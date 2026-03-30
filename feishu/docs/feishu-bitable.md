# feishu_bitable_* — 飞书多维表格操作

## 工具概览

多维表格有多个独立工具（不是一个工具的多个 action）：

| 工具名 | 用途 |
|--------|------|
| feishu_bitable_get_meta | 解析 URL，获取 app_token 和 table_id |
| feishu_bitable_list_fields | 列出所有列（字段） |
| feishu_bitable_list_records | 列出行（记录），支持分页 |
| feishu_bitable_get_record | 获取单行 |
| feishu_bitable_create_record | 新建行 |
| feishu_bitable_update_record | 更新行 |
| feishu_bitable_delete_record | 删除行 |
| feishu_bitable_create_app | 创建新多维表格 |
| feishu_bitable_create_field | 新建列 |
| feishu_bitable_rename_field | 重命名列 |
| feishu_bitable_delete_field | 删除列 |
| feishu_bitable_batch_create_records | 批量新建行（≤500/次） |
| feishu_bitable_batch_delete_records | 批量删除行 |
| feishu_bitable_create_view | 创建视图 |

## 典型工作流

### 从 URL 开始操作表格

```
1. feishu_bitable_get_meta(url) → 得到 app_token, table_id
2. feishu_bitable_list_fields(app_token, table_id) → 了解列结构
3. feishu_bitable_list_records(app_token, table_id) → 读取数据
```

### 创建新表格并批量写入数据

```
1. feishu_bitable_create_app(name) → 得到 app_token, table_id
2. 清理默认内容：batch_delete 默认空行 → delete_field 多余列
3. feishu_bitable_rename_field(...) → 重命名第一列（不能 create 第一列）
4. feishu_bitable_create_field(...) → 添加其余列
5. feishu_bitable_create_view(...) → 创建默认视图
6. feishu_bitable_batch_create_records(...) → 批量写入（每批 ≤500）
```

## 各工具详细用法

### feishu_bitable_get_meta

```json
{ "url": "https://xxx.feishu.cn/wiki/ABC?table=tblXXX" }
{ "url": "https://xxx.feishu.cn/base/DEF?table=tblYYY" }
```

支持两种 URL 格式：
- Wiki 格式：`/wiki/{nodeToken}?table={tableId}` — 会自动解析 node 获取 app_token
- Base 格式：`/base/{appToken}?table={tableId}`

返回：app_token, table_id, tables 列表

### feishu_bitable_list_fields

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX" }
```

返回每列的 field_id, field_name, type, type_name, is_primary, property。

### feishu_bitable_list_records

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX" }
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "page_size": 50, "page_token": "xxx" }
```

- page_size 默认 100，最大 500
- 如果 has_more 为 true，用返回的 page_token 继续翻页
- 返回：records 数组, has_more, page_token, total

### feishu_bitable_get_record

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "record_id": "recYYY" }
```

### feishu_bitable_create_record

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "fields": { "字段名": "值" } }
```

fields 是一个对象，key 是**字段名**（不是 field_id），value 是对应类型的值。

### feishu_bitable_update_record

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "record_id": "recYYY", "fields": { "字段名": "新值" } }
```

部分更新：只传需要修改的字段。

### feishu_bitable_delete_record

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "record_id": "recYYY" }
```

### feishu_bitable_create_app

```json
{ "name": "新表格名称" }
{ "name": "新表格名称", "folder_token": "FOLDER_TOKEN" }
```

新创建的多维表格自带一个默认 table。返回 app_token 和第一个 table_id。

### feishu_bitable_create_field

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "field_name": "状态", "field_type": 3 }
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "field_name": "分类", "field_type": 4, "property": { "options": [{"name": "A"}, {"name": "B"}] } }
```

## 字段类型编号

| field_type | 类型名 |
|------------|--------|
| 1 | Text 文本 |
| 2 | Number 数字 |
| 3 | SingleSelect 单选 |
| 4 | MultiSelect 多选 |
| 5 | DateTime 日期 |
| 7 | Checkbox 复选框 |
| 11 | User 人员 |
| 13 | Phone 电话 |
| 15 | URL 链接 |
| 17 | Attachment 附件 |
| 18 | SingleLink 单向关联 |
| 19 | Lookup 查找引用 |
| 20 | Formula 公式 |
| 21 | DuplexLink 双向关联 |
| 22 | Location 地理位置 |
| 23 | GroupChat 群组 |
| 1001 | CreatedTime 创建时间 |
| 1002 | ModifiedTime 修改时间 |
| 1003 | CreatedUser 创建人 |
| 1004 | ModifiedUser 修改人 |
| 1005 | AutoNumber 自动编号 |

### feishu_bitable_batch_create_records

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "records": [{"字段名": "值1"}, {"字段名": "值2"}] }
```

每次最多 500 条。records 数组中每个元素是 `{字段名: 值}` 对象（同 create_record 的 fields 格式）。

### feishu_bitable_batch_delete_records

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "record_ids": ["recAAA", "recBBB"] }
```

### feishu_bitable_rename_field

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "field_id": "fldXXX", "field_name": "新名称" }
```

用于重命名已有字段。建表后第一个字段只能 rename，不能 delete 后 create。

### feishu_bitable_delete_field

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "field_id": "fldXXX" }
```

### feishu_bitable_create_view

```json
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "view_name": "默认视图" }
{ "app_token": "APP_TOKEN", "table_id": "tblXXX", "view_name": "看板", "view_type": "kanban" }
```

view_type 可选：grid（默认）、kanban、gallery、gantt、form。

## 注意事项

- create_record / update_record / batch_create_records 的 fields 用**字段名**作为 key
- 批量写入时禁止逐条 create_record，必须用 batch_create_records
- 先用 list_fields 了解表结构再操作，避免字段名写错
- 分页查询大表时注意 has_more 和 page_token
- 建表后第一个字段只能 rename，不能 create（Bitable 限制）
