# AI Config Jumper

AI Config Jumper adds an Activity Bar entry that lists AI-related configuration files and directories found in the current VS Code workspace.

## MVP Features

- Scans workspace folders for common AI config files and directories.
- Groups results into `Files` and `Directories`.
- Opens files in the editor.
- Reveals directories in the VS Code Explorer.
- Provides a refresh button in the view title.
- Ignores `node_modules`, `.git`, `dist`, and `build`.

## Local Debugging

1. Run `npm install`.
2. Open this folder in VS Code.
3. Press `F5` and choose `Run Extension`.
4. In the Extension Development Host window, open a workspace and click the `AI Configs` Activity Bar item.
