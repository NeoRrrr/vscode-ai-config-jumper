import * as path from "node:path";
import * as vscode from "vscode";

const AI_CONFIG_FILE_NAMES = new Set([
  "AGENTS.md",
  "agents.md",
  "CLAUDE.md",
  "claude.md",
  "GEMINI.md",
  "gemini.md",
  ".cursorrules",
  ".mcp.json"
]);

const AI_CONFIG_FILE_PATHS = new Set([
  path.join(".github", "copilot-instructions.md"),
  path.join(".vscode", "mcp.json")
]);

const AI_CONFIG_DIRECTORIES = new Set([
  ".codex",
  ".claude",
  ".gemini",
  ".cursor",
  ".windsurf"
]);

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build"
]);

type ConfigKind = "file" | "directory";
type TreeNode = GroupNode | ResourceNode | FileSystemNode | MessageNode;

interface ConfigResource {
  kind: ConfigKind;
  uri: vscode.Uri;
  workspaceFolder: vscode.WorkspaceFolder;
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new AiConfigTreeDataProvider();
  const treeView = vscode.window.createTreeView("aiConfigJumper.configs", {
    treeDataProvider: provider,
    showCollapseAll: true
  });

  context.subscriptions.push(
    treeView,
    vscode.commands.registerCommand("aiConfigJumper.refresh", () => provider.refresh()),
    vscode.commands.registerCommand("aiConfigJumper.revealDirectory", async (target: unknown) => {
      const uri = getUriFromCommandTarget(target);

      if (!uri) {
        void vscode.window.showWarningMessage("Could not find a directory to reveal.");
        return;
      }

      await revealDirectoryInExplorer(uri);
    })
  );

  provider.refresh();
}

export function deactivate(): void {
  // No cleanup required.
}

class AiConfigTreeDataProvider implements vscode.TreeDataProvider<TreeNode> {
  private readonly changeEmitter = new vscode.EventEmitter<TreeNode | undefined>();
  private resources: ConfigResource[] = [];

  readonly onDidChangeTreeData = this.changeEmitter.event;

  refresh(): void {
    void this.scanWorkspace();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (!vscode.workspace.workspaceFolders?.length) {
      return element ? [] : [new MessageNode("Open a workspace to scan AI configs.")];
    }

    if (!element) {
      return [
        new GroupNode("Files", "files", this.getResourcesByKind("file").length),
        new GroupNode("Directories", "directories", this.getResourcesByKind("directory").length)
      ];
    }

    if (element instanceof GroupNode) {
      const kind: ConfigKind = element.groupId === "files" ? "file" : "directory";
      const resources = this.getResourcesByKind(kind);

      if (resources.length === 0) {
        return [new MessageNode(`No ${element.displayName.toLowerCase()} found.`)];
      }

      return resources.map((resource) => new ResourceNode(resource));
    }

    if (element instanceof ResourceNode && element.resource.kind === "directory") {
      return this.getDirectoryChildren(element.resource.uri);
    }

    if (element instanceof FileSystemNode && element.fileType === vscode.FileType.Directory) {
      return this.getDirectoryChildren(element.uri);
    }

    return [];
  }

  private async scanWorkspace(): Promise<void> {
    const resources: ConfigResource[] = [];

    for (const workspaceFolder of vscode.workspace.workspaceFolders ?? []) {
      await this.walkWorkspaceFolder(workspaceFolder, workspaceFolder.uri, resources);
    }

    this.resources = resources.sort(compareResources);
    this.changeEmitter.fire(undefined);
  }

  private async walkWorkspaceFolder(
    workspaceFolder: vscode.WorkspaceFolder,
    directoryUri: vscode.Uri,
    resources: ConfigResource[]
  ): Promise<void> {
    let entries: [string, vscode.FileType][];

    try {
      entries = await vscode.workspace.fs.readDirectory(directoryUri);
    } catch (error) {
      console.warn(`Failed to scan ${directoryUri.toString()}`, error);
      return;
    }

    for (const [name, fileType] of entries) {
      const entryUri = vscode.Uri.joinPath(directoryUri, name);
      const relativePath = getWorkspaceRelativePath(workspaceFolder, entryUri);

      if (fileType === vscode.FileType.Directory) {
        if (IGNORED_DIRECTORIES.has(name)) {
          continue;
        }

        if (AI_CONFIG_DIRECTORIES.has(name)) {
          resources.push({ kind: "directory", uri: entryUri, workspaceFolder });
        }

        await this.walkWorkspaceFolder(workspaceFolder, entryUri, resources);
        continue;
      }

      if (fileType === vscode.FileType.File && isAiConfigFile(name, relativePath)) {
        resources.push({ kind: "file", uri: entryUri, workspaceFolder });
      }
    }
  }

  private getResourcesByKind(kind: ConfigKind): ConfigResource[] {
    return this.resources.filter((resource) => resource.kind === kind);
  }

  private async getDirectoryChildren(uri: vscode.Uri): Promise<TreeNode[]> {
    let entries: [string, vscode.FileType][];

    try {
      entries = await vscode.workspace.fs.readDirectory(uri);
    } catch (error) {
      console.warn(`Failed to read ${uri.toString()}`, error);
      return [new MessageNode("Unable to read this directory.")];
    }

    const visibleEntries = entries
      .filter(([name, fileType]) => fileType !== vscode.FileType.Directory || !IGNORED_DIRECTORIES.has(name))
      .sort(compareDirectoryEntries);

    if (visibleEntries.length === 0) {
      return [new MessageNode("Empty directory.")];
    }

    return visibleEntries.map(([name, fileType]) => new FileSystemNode(name, vscode.Uri.joinPath(uri, name), fileType));
  }
}

class GroupNode extends vscode.TreeItem {
  constructor(
    readonly displayName: string,
    readonly groupId: "files" | "directories",
    count: number
  ) {
    super(`${displayName} (${count})`, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "group";
  }
}

class ResourceNode extends vscode.TreeItem {
  constructor(readonly resource: ConfigResource) {
    const relativePath = getWorkspaceRelativePath(resource.workspaceFolder, resource.uri);
    const collapsibleState =
      resource.kind === "directory" ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;

    super(relativePath, collapsibleState);

    this.resourceUri = resource.uri;
    this.description = resource.workspaceFolder.name;
    this.tooltip = resource.uri.fsPath;
    this.contextValue = resource.kind;

    if (resource.kind === "file") {
      this.iconPath = new vscode.ThemeIcon("file");
      this.command = {
        command: "vscode.open",
        title: "Open File",
        arguments: [resource.uri]
      };
    } else {
      this.iconPath = new vscode.ThemeIcon("folder");
    }
  }
}

class FileSystemNode extends vscode.TreeItem {
  constructor(
    label: string,
    readonly uri: vscode.Uri,
    readonly fileType: vscode.FileType
  ) {
    const isDirectory = fileType === vscode.FileType.Directory;

    super(label, isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

    this.resourceUri = uri;
    this.tooltip = uri.fsPath;
    this.contextValue = isDirectory ? "fsDirectory" : "fsFile";
    this.iconPath = new vscode.ThemeIcon(isDirectory ? "folder" : "file");

    if (!isDirectory) {
      this.command = {
        command: "vscode.open",
        title: "Open File",
        arguments: [uri]
      };
    }
  }
}

class MessageNode extends vscode.TreeItem {
  constructor(message: string) {
    super(message, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "message";
  }
}

async function revealDirectoryInExplorer(uri: vscode.Uri): Promise<void> {
  try {
    await vscode.commands.executeCommand("workbench.view.explorer");
    await vscode.commands.executeCommand("revealInExplorer", uri);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showWarningMessage(`Could not reveal directory in Explorer: ${message}`);
  }
}

function getWorkspaceRelativePath(workspaceFolder: vscode.WorkspaceFolder, uri: vscode.Uri): string {
  return path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
}

function isAiConfigFile(fileName: string, relativePath: string): boolean {
  return AI_CONFIG_FILE_NAMES.has(fileName) || AI_CONFIG_FILE_PATHS.has(relativePath);
}

function getUriFromCommandTarget(target: unknown): vscode.Uri | undefined {
  if (target instanceof vscode.Uri) {
    return target;
  }

  if (target instanceof ResourceNode) {
    return target.resource.uri;
  }

  if (target instanceof FileSystemNode) {
    return target.uri;
  }

  if (target instanceof vscode.TreeItem && target.resourceUri instanceof vscode.Uri) {
    return target.resourceUri;
  }

  return undefined;
}

function compareResources(left: ConfigResource, right: ConfigResource): number {
  const leftWorkspace = left.workspaceFolder.name.localeCompare(right.workspaceFolder.name);

  if (leftWorkspace !== 0) {
    return leftWorkspace;
  }

  return getWorkspaceRelativePath(left.workspaceFolder, left.uri).localeCompare(
    getWorkspaceRelativePath(right.workspaceFolder, right.uri)
  );
}

function compareDirectoryEntries(left: [string, vscode.FileType], right: [string, vscode.FileType]): number {
  const leftIsDirectory = left[1] === vscode.FileType.Directory;
  const rightIsDirectory = right[1] === vscode.FileType.Directory;

  if (leftIsDirectory !== rightIsDirectory) {
    return leftIsDirectory ? -1 : 1;
  }

  return left[0].localeCompare(right[0]);
}
