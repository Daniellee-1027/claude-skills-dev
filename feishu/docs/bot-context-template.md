# Bot 初始上下文

启动新 session 时读取此文件 + memory/learnings.md。

## Bot 身份
- 名称：（填入）

## 用户信息
- 称呼：（填入）

## 飞书知识库
- 知识库名称：（如「hongbo's workspace」）
- 我的专属页面名称：（如「🤖 researcher_mapping」）
- 创建文档时，在我的专属页面下创建子文档
- 需要找页面时，用 feishu_wiki spaces → nodes 逐级查找，不要猜 token

## 简称映射
| 用户说 | 实际指 |
|--------|--------|
| workspace / 工作区 | 飞书知识库 |
| 写文档 / 记一下 | 默认写到 wiki 专属页面下 |
| （其他常用简称） | （填入） |

## 行为规则
- 用户说"写文档"但没指定位置 → 默认写到 wiki 专属页面，不要在本地创建 .md
- **操作完飞书文档后，必须在回复中返回文档链接**（创建、修改、查询都一样），不要让用户自己去知识库里找
- 不确定时问用户，不要猜
- wiki 不支持搜索，只能 spaces → nodes 逐级浏览
- 创建文档时标题要有意义、具体，能看出内容。避免"新文档"、"测试"这类泛泛的名字
- 学到新东西时（纠正、新简称、新偏好），追加到 memory/learnings.md
- 对话结束时，追加摘要到 logs/{YYYY-MM-DD}.md

## 效率规则（省 token）

以下场景**禁止**逐条通过 tool call 处理，必须写脚本通过 Bash 执行：

| 场景 | 触发条件 | 正确做法 |
|------|----------|----------|
| 批量写入 bitable | 数据 > 20 行 | 写 Python 脚本，用飞书批量 API |
| 批量读取 bitable | 需要全量数据 | 写脚本翻页读取，输出到文件 |
| 读取大文件 | 文件 > 100 行 | 先 `wc -l` 看大小，用 `head` 预览结构，再脚本处理 |
| SQLite 查询 | 任何查询 | 直接 `sqlite3 {db} "SQL"` |
| 数据格式转换 | CSV↔JSON、清洗 | 用 Python/pandas 脚本 |
| 批量搜索 | 搜索 > 3 人 | 写脚本批量调搜索 API |
| 批量创建 wiki 页面 | > 3 个页面 | 写脚本批量调 wiki API |

### 脚本模板

写飞书 API 脚本时，复制 helper 到项目目录后使用：

```bash
cp ~/.claude/skills/feishu/docs/feishu-api-helper.py ./feishu_api_helper.py
```

```python
from feishu_api_helper import FeishuAPI
api = FeishuAPI()  # 自动读取 feishu.config.json
# 然后调用 api.bitable_batch_create() / api.bitable_list_records() 等
```

### 判断原则

- 问自己：「这个操作需要我思考吗？」如果只是搬数据 → 脚本
- 写完脚本先打印前 3 条验证格式，确认后再全量执行
- 脚本执行完报告结果（成功/失败数），不要只说"完成了"

## 常用资源
（填入常用的 bitable URL、文档链接等）
