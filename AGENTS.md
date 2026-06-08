# Project Notes

- Do not commit or push unless the user explicitly asks for it.
- Keep `ai/` as local development material only. It must stay ignored by Git and excluded from VSIX packages.
- `aiConfigJumper.customWorkspacePaths` is for exact workspace-relative files or directories. It must support arbitrary nested paths such as `tools/ai/claude/skill`, `skills`, or `docs/ai/AGENTS.md`.
- `aiConfigJumper.searchRoots` is for recursive discovery under selected workspace-relative directories. It should only discover supported AI config names and continue skipping ignored folders.
- Keep system configs grouped by default. `aiConfigJumper.flattenSystemConfigs` is the opt-in switch for showing system configs inline at the tree root.
- Directory context menus should support creating files under the selected directory. Accept nested relative file paths such as `nested/notes.md`, but reject absolute paths, `..`, and directory-only input.
- VS Code User, Workspace, and Workspace Folder settings should all work. For `customWorkspacePaths` and `searchRoots`, merge array values across those scopes instead of letting project settings replace global defaults.
- In multi-root workspaces, read path settings in the context of each `WorkspaceFolder`, because the configured paths are relative to that folder.
