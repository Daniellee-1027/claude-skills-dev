# feishu_wiki — 飞书知识库操作

## 工具名

`feishu_wiki`

## 核心概念

- **Space（知识空间）**：顶层容器，有 space_id
- **Node（节点）**：空间下的文档/表格等，有 node_token 和 obj_token
  - node_token 用于 wiki API 操作
  - obj_token 用于访问实际内容（如文档用 feishu_doc 读取时传 obj_token）
- 节点可以嵌套，形成树形目录结构

## 典型工作流

**访问某个知识库的内容：**

```
1. spaces → 找到目标空间的 space_id
2. nodes(space_id) → 浏览根节点列表
3. nodes(space_id, parent_node_token) → 进入子目录
4. get(node_token) → 获取节点详情（含 obj_token）
5. 用 feishu_doc read(obj_token) → 读取文档内容
```

## Actions

### spaces — 列出所有知识空间

```json
{ "action": "spaces" }
```

返回所有空间的 space_id, name, description, visibility。

### nodes — 浏览空间节点

```json
{ "action": "nodes", "space_id": "SPACE_ID" }
{ "action": "nodes", "space_id": "SPACE_ID", "parent_node_token": "NODE_TOKEN" }
```

- 不传 parent_node_token → 列出根节点
- 传 parent_node_token → 列出该节点的子节点
- 返回：node_token, obj_token, obj_type, title, has_child

### get — 获取节点详情

```json
{ "action": "get", "token": "NODE_TOKEN" }
```

- token 从 URL `/wiki/XXX` 提取，或从 nodes 结果中获取
- 返回：node_token, space_id, obj_token, obj_type, title, parent_node_token, has_child

### create — 创建节点

```json
{ "action": "create", "space_id": "SPACE_ID", "title": "新文档" }
{ "action": "create", "space_id": "SPACE_ID", "title": "新表格", "obj_type": "bitable", "parent_node_token": "PARENT_TOKEN" }
```

- obj_type 可选：docx（默认）、sheet、bitable、doc、mindnote、file、slides
- parent_node_token 可选，不传则创建在根目录

### move — 移动节点

```json
{ "action": "move", "space_id": "SRC_SPACE", "node_token": "NODE", "target_space_id": "DST_SPACE", "target_parent_token": "PARENT" }
```

可跨空间移动。target_space_id 和 target_parent_token 都是可选的。

### rename — 重命名节点

```json
{ "action": "rename", "space_id": "SPACE_ID", "node_token": "NODE_TOKEN", "title": "新标题" }
```

### import_to_wiki — 将云空间文档移入知识库

```json
{ "action": "import_to_wiki", "space_id": "SPACE_ID", "obj_token": "DOC_TOKEN", "obj_type": "bitable" }
{ "action": "import_to_wiki", "space_id": "SPACE_ID", "obj_token": "DOC_TOKEN", "obj_type": "docx", "parent_wiki_token": "PARENT_NODE_TOKEN" }
```

- 用于把云空间（Drive）里的文档移到知识库（Wiki）下
- obj_token：云空间文档的 token（bitable 的 app_token、docx 的 document_id 等）
- obj_type：doc / sheet / bitable / file / docx / slides / mindnote
- parent_wiki_token：可选，目标父节点的 wiki node_token，不传则放到空间根目录
- 移动后文档会从"我的空间"/"共享空间"消失，出现在知识库中
- 此接口为异步，若已完成则直接返回 wiki_token，否则返回 task_id

**与 move 的区别：** `move` 是在 wiki 内部移动已有节点，`import_to_wiki` 是把云空间文档迁入 wiki。

## 重要：不支持搜索和删除

- **搜索**：wiki 工具没有搜索功能，必须通过 spaces → nodes 逐级浏览
- **删除**：飞书 wiki API 不支持通过 API 删除节点，需要在飞书界面手动删除

wiki 工具**没有搜索功能**。如果用户要找某个文档，必须通过 spaces → nodes 逐级浏览来定位。

## 读取 wiki 文档内容

wiki 的 `get` 只返回节点元信息（标题、类型等），不返回文档正文。
要读取正文，需要用返回的 `obj_token` 配合 `feishu_doc` 工具：

```
1. feishu_wiki get(token) → 得到 obj_token, obj_type
2. 如果 obj_type 是 docx → feishu_doc read(obj_token)
3. 如果 obj_type 是 bitable → feishu_bitable_get_meta 或其他 bitable 工具
```
