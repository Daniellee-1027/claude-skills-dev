"""
Feishu API Helper — bot 写批量脚本时复制此文件到项目目录使用。

用法：
    from feishu_api_helper import FeishuAPI
    api = FeishuAPI()  # 自动读取 feishu.config.json

    # 创建 bitable 并批量导入 CSV
    app_token, table_id, url = api.bitable_create("表格名称")
    api.bitable_setup_fields(app_token, table_id, [
        ("姓名",   1, None),   # Text, 第一个字段会 rename
        ("公司",   1, None),   # Text
        ("标签",   4, ["A","B","C"]),  # MultiSelect with options
        ("主页",  15, None),   # URL
    ])
    api.bitable_batch_create(app_token, table_id, records)

    # 创建 wiki 文档
    api.wiki_create_doc(space_id, parent_node_token, title, content)
"""

import json
import time
import requests
from pathlib import Path


class FeishuAPI:
    def __init__(self, config_path: str = "feishu.config.json"):
        config = json.loads(Path(config_path).read_text())["feishu"]
        self.app_id = config["appId"]
        self.app_secret = config["appSecret"]
        domain = config.get("domain", "feishu")
        if domain == "lark":
            self.base = "https://open.larksuite.com/open-apis"
        elif domain == "feishu":
            self.base = "https://open.feishu.cn/open-apis"
        else:
            self.base = f"{domain.rstrip('/')}/open-apis"
        self._token = None
        self._token_expires = 0

    @property
    def token(self) -> str:
        if self._token and time.time() < self._token_expires - 60:
            return self._token
        r = requests.post(f"{self.base}/auth/v3/tenant_access_token/internal", json={
            "app_id": self.app_id, "app_secret": self.app_secret
        })
        data = r.json()
        self._token = data["tenant_access_token"]
        self._token_expires = time.time() + data.get("expire", 7200)
        return self._token

    def _headers(self):
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    def _api(self, method, path, **kwargs):
        r = requests.request(method, f"{self.base}{path}", headers=self._headers(), **kwargs)
        r.raise_for_status()
        data = r.json()
        if data.get("code", 0) != 0:
            raise Exception(f"API error: {data.get('msg')} (code={data.get('code')})")
        return data.get("data", {})

    # --- Bitable ---

    def bitable_create(self, name: str, folder_token: str = None) -> tuple:
        """创建多维表格，返回 (app_token, table_id, url)"""
        body = {"name": name}
        if folder_token:
            body["folder_token"] = folder_token
        data = self._api("POST", "/bitable/v1/apps", json=body)
        app_token = data["app"]["app_token"]
        url = data["app"].get("url", "")

        # 获取默认 table
        data = self._api("GET", f"/bitable/v1/apps/{app_token}/tables")
        table_id = data["items"][0]["table_id"]
        print(f"Created bitable: {url}")
        return app_token, table_id, url

    def bitable_setup_fields(self, app_token: str, table_id: str,
                             fields: list[tuple]) -> None:
        """设置字段。自动清理默认内容。
        fields: [(name, type, options_or_none), ...]
        第一个字段会 rename（Bitable 限制），其余 create。
        type: 1=Text, 2=Number, 3=SingleSelect, 4=MultiSelect, 5=DateTime, 7=Checkbox, 15=URL
        options: MultiSelect/SingleSelect 传 ["opt1", "opt2"]，其他传 None
        """
        # 1. 删除默认空行
        data = self._api("GET", f"/bitable/v1/apps/{app_token}/tables/{table_id}/records",
                         params={"page_size": 100})
        record_ids = [r["record_id"] for r in data.get("items", [])]
        if record_ids:
            self._api("POST", f"/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_delete",
                      json={"records": record_ids})
            print(f"Deleted {len(record_ids)} default rows")

        # 2. 获取现有字段，删除多余的（保留第一个）
        existing = self._api("GET", f"/bitable/v1/apps/{app_token}/tables/{table_id}/fields")
        existing_fields = existing.get("items", [])
        first_field_id = existing_fields[0]["field_id"] if existing_fields else None
        for f in existing_fields[1:]:
            self._api("DELETE", f"/bitable/v1/apps/{app_token}/tables/{table_id}/fields/{f['field_id']}")
            print(f"Deleted default field: {f['field_name']}")

        # 3. Rename 第一个字段
        if fields and first_field_id:
            name, ftype, opts = fields[0]
            body = {"field_name": name, "type": ftype}
            if opts and ftype in (3, 4):
                body["property"] = {"options": [{"name": o} for o in opts]}
            self._api("PUT", f"/bitable/v1/apps/{app_token}/tables/{table_id}/fields/{first_field_id}",
                      json=body)
            print(f"Renamed first field -> {name}")

        # 4. Create 其余字段
        for name, ftype, opts in fields[1:]:
            body = {"field_name": name, "type": ftype}
            if opts and ftype in (3, 4):
                body["property"] = {"options": [{"name": o} for o in opts]}
            self._api("POST", f"/bitable/v1/apps/{app_token}/tables/{table_id}/fields", json=body)
            print(f"Created field: {name} (type={ftype})")

    def bitable_batch_create(self, app_token: str, table_id: str, records: list[dict],
                             batch_size: int = 500) -> dict:
        """批量创建 bitable 记录，自动分批（每批最多 500）"""
        url = f"{self.base}/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create"
        total = len(records)
        created = 0
        errors = []
        for i in range(0, total, batch_size):
            batch = records[i:i + batch_size]
            payload = {"records": [{"fields": r} for r in batch]}
            r = requests.post(url, headers=self._headers(), json=payload)
            data = r.json()
            if data.get("code") == 0:
                created += len(batch)
                print(f"  [{created}/{total}] OK")
            else:
                errors.append({"batch": i, "error": data.get("msg", str(data))})
                print(f"  [{i}] ERROR: {data.get('msg')}")
            if i + batch_size < total:
                time.sleep(0.3)
        return {"created": created, "total": total, "errors": errors}

    def bitable_batch_delete(self, app_token: str, table_id: str, record_ids: list[str]) -> None:
        """批量删除记录"""
        for i in range(0, len(record_ids), 500):
            batch = record_ids[i:i + 500]
            self._api("POST", f"/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_delete",
                      json={"records": batch})

    def bitable_list_records(self, app_token: str, table_id: str,
                             page_size: int = 500) -> list[dict]:
        """读取所有 bitable 记录（自动翻页）"""
        records = []
        page_token = None
        while True:
            params = {"page_size": page_size}
            if page_token:
                params["page_token"] = page_token
            data = self._api("GET", f"/bitable/v1/apps/{app_token}/tables/{table_id}/records",
                             params=params)
            records.extend(data.get("items", []))
            if not data.get("has_more"):
                break
            page_token = data["page_token"]
        return records

    def bitable_list_fields(self, app_token: str, table_id: str) -> list[dict]:
        """列出 bitable 字段"""
        data = self._api("GET", f"/bitable/v1/apps/{app_token}/tables/{table_id}/fields")
        return data.get("items", [])

    def bitable_move_to_wiki(self, space_id: str, app_token: str) -> str:
        """把独立 bitable 移入 wiki 空间，返回 wiki_token"""
        data = self._api("POST", f"/wiki/v2/spaces/{space_id}/nodes/move_docs_to_wiki", json={
            "obj_type": "bitable", "obj_token": app_token,
        })
        wiki_token = data.get("wiki_token", "")
        print(f"Moved to wiki: wiki_token={wiki_token}")
        return wiki_token

    # --- Wiki ---

    def wiki_list_spaces(self) -> list[dict]:
        """列出所有知识库"""
        data = self._api("GET", "/wiki/v2/spaces")
        return data.get("items", [])

    def wiki_list_nodes(self, space_id: str, parent_node_token: str = None) -> list[dict]:
        """列出知识库节点"""
        params = {}
        if parent_node_token:
            params["parent_node_token"] = parent_node_token
        data = self._api("GET", f"/wiki/v2/spaces/{space_id}/nodes", params=params)
        return data.get("items", [])

    def wiki_create_doc(self, space_id: str, parent_node_token: str,
                        title: str, obj_type: str = "docx") -> dict:
        """在知识库创建文档节点"""
        data = self._api("POST", f"/wiki/v2/spaces/{space_id}/nodes", json={
            "obj_type": obj_type,
            "parent_node_token": parent_node_token,
            "node_type": "origin",
            "title": title,
        })
        return data.get("node", {})

    # --- Doc ---

    def doc_write(self, doc_token: str, content: str) -> dict:
        """写入文档内容（覆盖）"""
        blocks = self._api("GET", f"/docx/v1/documents/{doc_token}/blocks")
        items = blocks.get("items", [])
        if len(items) > 1:
            for block in items[1:]:
                requests.delete(
                    f"{self.base}/docx/v1/documents/{doc_token}/blocks/{block['block_id']}",
                    headers=self._headers()
                )
        return self.doc_append(doc_token, content)

    def doc_append(self, doc_token: str, content: str) -> dict:
        """追加文档内容"""
        blocks = self._api("GET", f"/docx/v1/documents/{doc_token}/blocks")
        doc_block_id = blocks.get("items", [{}])[0].get("block_id", doc_token)
        return self._api("POST", f"/docx/v1/documents/{doc_token}/blocks/{doc_block_id}/children",
                         json={"children": [{
                             "block_type": 2,
                             "text": {"elements": [{"text_run": {"content": content}}]}
                         }]})
