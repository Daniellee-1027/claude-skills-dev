# feishu_drive — 飞书云空间操作

## 工具名

`feishu_drive`

## Actions

### list — 列出文件夹内容

```json
{ "action": "list" }
{ "action": "list", "folder_token": "FOLDER_TOKEN" }
```

- 不传 folder_token → 列出根目录
- 返回每个文件的 token, name, type, url, created_time, modified_time

### info — 获取文件信息

```json
{ "action": "info", "file_token": "FILE_TOKEN", "type": "docx" }
```

type 可选值：doc, docx, sheet, bitable, folder, file, mindnote, shortcut

### create_folder — 创建文件夹

```json
{ "action": "create_folder", "name": "新文件夹" }
{ "action": "create_folder", "name": "新文件夹", "folder_token": "PARENT_FOLDER" }
```

返回：token, url

### move — 移动文件

```json
{ "action": "move", "file_token": "FILE_TOKEN", "type": "docx", "folder_token": "TARGET_FOLDER" }
```

异步操作，返回 task_id。

### delete — 删除文件

```json
{ "action": "delete", "file_token": "FILE_TOKEN", "type": "docx" }
```

异步操作，返回 task_id。

## 注意事项

- move 和 delete 是异步操作，返回 task_id 而非立即完成
- folder_token 传 "0" 或省略都表示根目录
- type 参数必须与文件实际类型匹配
