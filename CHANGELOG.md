# Change Log

## 0.0.9

- Merge user, workspace, and workspace-folder path settings for custom paths and search roots.
- Add `aiConfigJumper.flattenSystemConfigs` to optionally show system configs inline.
- Add a directory context menu action for creating files.
- Group path settings together and system display settings together in the Settings UI.

## 0.0.8

- Add examples and JSON snippets for custom workspace path settings.
- Clarify custom path examples for skills directories and project-relative config files.

## 0.0.7

- Add `aiConfigJumper.customWorkspacePaths` for exact workspace-relative files or directories.
- Add `aiConfigJumper.searchRoots` for opt-in recursive scanning under selected workspace directories.
- Keep ignored folders skipped during configured recursive scans.

## 0.0.6

- Add context menu actions for files and directories.
- Support opening files, revealing files in Explorer, and copying item paths from the AI Configs tree.
- Add Open to the Side and Copy Relative Path actions.

## 0.0.5

- Match only canonical uppercase project instruction files: `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`.
- Stop showing lowercase variants such as `agents.md` as AI config hits.

## 0.0.4

- Add optional system-level AI config discovery behind the `aiConfigJumper.showSystemConfigs` setting.
- Add a `System` Tree View group for user-level Codex, Claude, Gemini, Cursor, Windsurf, VS Code MCP, and Claude Desktop config locations.
- Replace separate `Files` and `Directories` groups with one workspace-root list.
- Only show project-level config entries from fixed workspace-root locations.

## 0.0.3

- Keep directory navigation inside the AI Configs view instead of switching to Explorer on click.
- Allow AI config directories to expand and show their contents.

## 0.0.2

- Rewrite Marketplace README as a Chinese user-facing introduction.
- Update extension description for published Marketplace usage.

## 0.0.1

- Add Activity Bar entry for AI config discovery.
- Add Tree View grouped by Files and Directories.
- Scan workspace folders for common AI config files and directories.
- Open files from the tree and reveal directories in Explorer.
- Add refresh command.
