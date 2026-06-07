# AI Config Jumper

快速跳转当前工作区里的 AI 配置文件和配置目录。

如果你经常在项目里切换 Codex、Claude、Gemini、Cursor、Copilot、MCP 等配置，AI Config Jumper 会在 VS Code 左侧活动栏提供一个独立入口，把常见 AI 配置集中列出来，点击即可打开或定位。

## 功能

- 扫描当前 VS Code workspace。
- 只在顶层展示当前 workspace 根目录里的常见 AI 配置入口。
- 点击文件直接在编辑器中打开。
- 目录会保留在 `AI Configs` 侧边栏中展开，方便继续浏览目录内容。
- 支持手动刷新。
- 自动忽略 `node_modules`、`.git`、`dist`、`build`。
- 可选显示用户级 / 系统级 AI 配置，默认关闭。

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

文件项可以直接打开；目录项可以展开查看其中内容，不会把你切走到资源管理器。插件不会把目录内部命中的文件重复平铺到顶层。

如果你新增、删除或移动了配置文件，点击视图右上角的刷新按钮即可重新扫描。

## 系统级配置

如果你想同时查看当前用户目录下的全局 AI 配置，可以在 VS Code Settings 中打开：

```json
"aiConfigJumper.showSystemConfigs": true
```

打开后会额外显示 `System` 分组，常见路径包括：

- `~/.codex/`
- `~/.claude/`
- `~/.gemini/`
- `~/.cursor/`
- `~/.windsurf/`
- `~/.cursor/mcp.json`
- VS Code 用户级 `mcp.json`
- Claude Desktop MCP 配置

## 隐私

AI Config Jumper 只扫描本地文件路径，不会上传你的文件内容，也不会连接任何远程 AI 服务。系统级配置默认不显示，需要你手动打开。
