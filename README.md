# AI Config Jumper

快速跳转当前工作区里的 AI 配置文件和配置目录。

如果你经常在项目里切换 Codex、Claude、Gemini、Cursor、Copilot、MCP 等配置，AI Config Jumper 会在 VS Code 左侧活动栏提供一个独立入口，把常见 AI 配置集中列出来，点击即可打开或定位。

## 功能

- 扫描当前 VS Code workspace。
- 只在顶层展示当前 workspace 根目录里的常见 AI 配置入口。
- 支持配置额外的 workspace 相对路径，例如 `tools/ai/claude/skill`。
- 支持在指定目录下递归搜索常见 AI 配置名。
- 点击文件直接在编辑器中打开。
- 目录会保留在 `AI Configs` 侧边栏中展开，方便继续浏览目录内容。
- 支持右键复制路径、打开文件、在资源管理器中定位。
- 支持手动刷新。
- 自动忽略 `node_modules`、`.git`、`dist`、`build`。
- 可选显示用户级 / 系统级 AI 配置，默认关闭。

## 支持的配置文件

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
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

## 自定义工作区路径

默认情况下，插件只扫描当前 workspace 根目录里的固定 AI 配置入口，避免在大型项目里做全量递归扫描。

如果你的 AI 配置目录放在自定义位置，可以在 VS Code Settings 中加入：

```json
"aiConfigJumper.customWorkspacePaths": [
  "tools/ai/claude/skill",
  "docs/ai/AGENTS.md"
]
```

这个配置会把存在的文件或目录直接列出来。路径必须是 workspace 相对路径。

常见示例：

- `tools/ai/claude/skill`
- `docs/ai/AGENTS.md`
- `.config/ai`

如果你希望在某些目录下继续自动寻找内置支持的配置名，例如 `AGENTS.md`、`CLAUDE.md`、`.claude/`、`.cursor/`，可以配置搜索根目录：

```json
"aiConfigJumper.searchRoots": [
  "tools/ai",
  "docs",
  ".github"
]
```

`searchRoots` 只会在你指定的目录下搜索，并继续忽略 `node_modules`、`.git`、`dist`、`build`。

如果不确定该填哪一个，优先用 `customWorkspacePaths` 添加一个确切文件或目录；只有希望在某个目录下面继续自动寻找 AI 配置时，再使用 `searchRoots`。

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
