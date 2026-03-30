# feishu_doc — 飞书文档操作

## 工具名

`feishu_doc`

## 获取 doc_token

从文档 URL 提取：`https://xxx.feishu.cn/docx/ABC123` → doc_token = `ABC123`

## Actions

### read — 读取文档

```json
{ "action": "read", "doc_token": "ABC123" }
```

返回：标题、纯文本内容、revision_id、block 数量。
如果文档包含图片/表格/代码块等结构化内容，会在返回中提示。

### write — 覆盖写入

```json
{ "action": "write", "doc_token": "ABC123", "content": "# 标题\n\n正文内容" }
```

- content 是 **Markdown 格式**，服务端自动转换为飞书 block
- **会清空原有内容**再写入
- 支持 Markdown 图片语法 `![alt](https://url)`，会自动上传到飞书
- 返回：blocks_deleted, blocks_added, images_processed

### append — 追加内容

```json
{ "action": "append", "doc_token": "ABC123", "content": "## 新章节\n\n追加的内容" }
```

- 同样用 Markdown 格式
- **不清空原有内容**，追加到文档末尾

### create — 创建文档

```json
{ "action": "create", "title": "新文档标题" }
{ "action": "create", "title": "新文档标题", "folder_token": "FOLDER_TOKEN" }
```

返回：document_id, title, url

### list_blocks — 列出所有 block

```json
{ "action": "list_blocks", "doc_token": "ABC123" }
```

返回文档的所有 block 及其类型、内容。用于精细编辑。

### get_block — 获取单个 block

```json
{ "action": "get_block", "doc_token": "ABC123", "block_id": "BLOCK_ID" }
```

block_id 从 list_blocks 结果中获取。

### update_block — 更新 block 文本

```json
{ "action": "update_block", "doc_token": "ABC123", "block_id": "BLOCK_ID", "content": "新内容" }
```

仅支持更新文本内容。

### delete_block — 删除 block

```json
{ "action": "delete_block", "doc_token": "ABC123", "block_id": "BLOCK_ID" }
```

## Block 类型参考

| 类型 | 说明 |
|------|------|
| Text | 普通文本 |
| Heading1/2/3 | 标题 |
| Bullet | 无序列表 |
| Ordered | 有序列表 |
| Code | 代码块 |
| Quote | 引用 |
| Todo | 待办 |
| Divider | 分割线 |
| Image | 图片 |
| File | 文件附件 |
| Table | 表格（只读，不能通过 API 创建） |
| TableCell | 表格单元格（只读） |

## 注意事项

- write/append 的 content 用 Markdown，不是飞书 block JSON
- Table 和 TableCell 类型的 block **不能通过 API 创建**，只能读取
- 图片上传是按顺序匹配的：Markdown 中第 1 张图对应第 1 个 image block
