# AI Config Jumper

快速跳转当前工作区里的 AI 配置文件和配置目录。

如果你经常在项目里切换 Codex、Claude、Gemini、Cursor、Copilot、MCP 等配置，AI Config Jumper 会在 VS Code 左侧活动栏提供一个独立入口，把常见 AI 配置集中列出来，点击即可打开或定位。

## 功能

- 扫描当前 VS Code workspace。
- 按 `Files` 和 `Directories` 分组展示 AI 配置。
- 点击文件直接在编辑器中打开。
- 点击目录会在资源管理器中定位。
- 支持手动刷新。
- 自动忽略 `node_modules`、`.git`、`dist`、`build`。

## 支持的配置文件

- `AGENTS.md` / `agents.md`
- `CLAUDE.md` / `claude.md`
- `GEMINI.md` / `gemini.md`
- `.cursorrules`
- `.mcp.json`
- `.github/copilot-instructions.md`
- `.vscode/mcp.json`

## 支持的配置目录

- `.codex/`
- `.claude/`
- `.gemini/`
- `.cursor/`
- `.windsurf/`

## 使用方式

安装后，在 VS Code 左侧活动栏点击 `AI Configs` 图标即可查看当前工作区中的 AI 配置。

如果你新增、删除或移动了配置文件，点击视图右上角的刷新按钮即可重新扫描。

## 隐私

AI Config Jumper 只扫描本地工作区文件路径，不会上传你的文件内容，也不会连接任何远程 AI 服务。
