# AI Config Jumper

<p align="center">
  <img src="media/icon.png" width="96" alt="AI Config Jumper logo" />
</p>

<h3 align="center">One sidebar for all your AI coding configs.</h3>

<p align="center">
  在 VS Code 侧边栏快速发现、打开、复制和定位 Codex、Claude、Gemini、Cursor、Copilot、MCP 等 AI 配置。
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=neorrrr.vscode-ai-config-jumper"><img src="https://img.shields.io/visual-studio-marketplace/v/neorrrr.vscode-ai-config-jumper?label=version&color=2563eb" alt="Marketplace version" /></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=neorrrr.vscode-ai-config-jumper"><img src="https://img.shields.io/visual-studio-marketplace/i/neorrrr.vscode-ai-config-jumper?label=installs&color=16a34a" alt="Marketplace installs" /></a>
  <img src="https://img.shields.io/badge/VS%20Code-%5E1.90.0-007acc" alt="VS Code 1.90+" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-64748b" alt="MIT License" /></a>
</p>

---

## 为什么需要它？

AI 编程工具越来越多，但它们的项目说明、规则和 MCP 配置经常散落在不同位置：

| 工具 | 常见配置路径 |
| --- | --- |
| Codex | `AGENTS.md`、`.codex/` |
| Claude | `CLAUDE.md`、`.claude/` |
| Gemini | `GEMINI.md`、`.gemini/` |
| Cursor | `.cursorrules`、`.cursor/` |
| Copilot | `.github/copilot-instructions.md` |
| MCP | `.mcp.json`, `.vscode/mcp.json` |

AI Config Jumper 会把这些入口集中到独立的 `AI Configs` 侧边栏里，减少在资源管理器里反复搜索文件的时间。

## 亮点

- **独立 Activity Bar 入口**：不混在资源管理器里，AI 配置单独看。
- **工作区优先发现**：默认扫描 workspace 根目录里的常见 AI 配置文件和目录。
- **目录内联展开**：`.codex/`、`.claude/`、`.gemini/`、`.cursor/`、`.windsurf/` 可以直接在侧边栏展开。
- **自定义路径**：支持添加任意 workspace 相对路径，例如 `tools/ai/claude/skill`、`skills/` 或 `docs/ai/AGENTS.md`。
- **定向递归搜索**：只在你指定的目录里继续找配置，避免大型项目里全盘递归。
- **系统级配置**：可选显示 `~/.codex`、`~/.claude`、`~/.cursor`、全局 MCP 等用户级配置。
- **系统区布局**：系统级配置默认收纳在 `System` 分组里，也可以切换成根列表平铺显示。
- **右键快捷操作**：新建文件、打开、侧边打开、资源管理器定位、复制绝对路径、复制相对路径。
- **本地优先**：只检查本地文件路径，不上传文件内容。

## 快速开始

1. 从 VS Code Marketplace 安装扩展。
2. 打开包含 AI 配置的项目。
3. 点击 VS Code Activity Bar 里的 `AI Configs` 图标。
4. 点击文件即可打开，点击目录即可展开浏览。
5. 右键目录可以创建新文件，支持输入 `notes.md` 或 `nested/notes.md`。
6. 新增、删除或移动配置后，点击刷新按钮重新扫描。

## 支持的文件

| 文件 | 用途 |
| --- | --- |
| `AGENTS.md` | Codex / Agent 项目说明 |
| `CLAUDE.md` | Claude 项目说明 |
| `GEMINI.md` | Gemini 项目说明 |
| `.cursorrules` | Cursor 规则 |
| `.mcp.json` | 项目 MCP 配置 |
| `.github/copilot-instructions.md` | GitHub Copilot 项目说明 |
| `.vscode/mcp.json` | VS Code MCP 配置 |

## 支持的目录

| 目录 | 工具 |
| --- | --- |
| `.codex/` | Codex |
| `.claude/` | Claude |
| `.gemini/` | Gemini CLI |
| `.cursor/` | Cursor |
| `.windsurf/` | Windsurf |

## 配置

AI Config Jumper 开箱即用。只有当你的项目把 AI 配置放在自定义位置时，才需要在 VS Code Settings 里添加 workspace 相对路径。

VS Code 支持把设置写在 User、Workspace 或 Workspace Folder 层级。`customWorkspacePaths` 和 `searchRoots` 会合并这些层级的数组：全局设置可以放通用路径，项目设置可以追加项目专属路径。

### 精确自定义路径

如果你已经知道要显示哪个文件或目录，用 `aiConfigJumper.customWorkspacePaths`。

```json
"aiConfigJumper.customWorkspacePaths": [
  "tools/ai/claude/skill",
  "skills",
  "skills/claude",
  "docs/ai/AGENTS.md",
  ".config/ai"
]
```

这个配置适合确定位置的文件或目录，比如项目里的多级 skill 目录、说明文件或自定义 AI 配置目录。不存在的路径会被自动忽略。

### 搜索根目录

如果你希望插件在某些目录下继续自动寻找内置支持的配置名，用 `aiConfigJumper.searchRoots`。

```json
"aiConfigJumper.searchRoots": [
  "tools/ai",
  "docs",
  ".github"
]
```

搜索范围会被限制在你指定的目录下，并继续跳过 `node_modules`、`.git`、`dist`、`build`。

User 设置和项目设置会合并生效。例如你可以在 User Settings 里放常用的 `"skills"`，再在某个项目的 `.vscode/settings.json` 里追加 `"tools/ai/claude/skill"`。

### 系统级配置

系统级配置默认隐藏。如果你想同时查看用户目录下的全局 AI 配置，可以打开：

```json
"aiConfigJumper.showSystemConfigs": true
```

打开后，侧边栏会新增 `System` 分组，常见路径包括：

- `~/.codex/`
- `~/.claude/`
- `~/.gemini/`
- `~/.cursor/`
- `~/.windsurf/`
- `~/.cursor/mcp.json`
- VS Code 用户级 `mcp.json`
- Claude Desktop MCP 配置

如果你希望系统级配置不要放在 `System` 分组里，可以开启平铺显示：

```json
"aiConfigJumper.flattenSystemConfigs": true
```

默认值是 `false`，也就是继续使用 `System` 分组。

## FAQ

### 会扫描整个仓库吗？

不会。默认只检查 workspace 根目录里的固定入口。只有你显式配置 `aiConfigJumper.searchRoots` 后，才会在指定目录下递归搜索。

### 会上传或读取配置内容吗？

不会。AI Config Jumper 只检查本地文件路径；只有你点击文件时，才会通过 VS Code 打开文件。扩展本身不连接任何远程 AI 服务。

### 应该用 `customWorkspacePaths` 还是 `searchRoots`？

知道准确路径时，用 `customWorkspacePaths`。希望在某个目录下面继续自动发现配置时，才用 `searchRoots`。

### 为什么路径没有显示？

路径必须是 workspace 相对路径，并且必须真实存在。绝对路径和包含 `..` 的路径会被忽略。

### 支持 User 设置和项目设置同时生效吗？

支持。`customWorkspacePaths` 和 `searchRoots` 会合并 User、Workspace、Workspace Folder 三层数组配置。多根工作区里，每个 workspace folder 会按自己的项目设置追加路径。

## 开发

```bash
npm install
npm run compile
npm run package
```

## License

MIT
