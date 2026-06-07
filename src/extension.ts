import * as path from "node:path";
import * as os from "node:os";
import * as vscode from "vscode";

const AI_CONFIG_FILE_NAME_GROUPS = [
  ["AGENTS.md"],
  ["CLAUDE.md"],
  ["GEMINI.md"],
  [".cursorrules"],
  [".mcp.json"]
];

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
type ConfigScope = "workspace" | "system";
type GroupId = "system";
type TreeNode = GroupNode | ResourceNode | FileSystemNode | MessageNode;

interface ConfigResource {
  kind: ConfigKind;
  scope: ConfigScope;
  uri: vscode.Uri;
  label: string;
  description: string;
  workspaceFolder?: vscode.WorkspaceFolder;
}

interface SystemConfigCandidate {
  kind: ConfigKind;
  uri: vscode.Uri;
  source: string;
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
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("aiConfigJumper.showSystemConfigs")) {
        provider.refresh();
      }
    }),
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
    if (!element) {
      return this.getRootNodes();
    }

    if (element instanceof GroupNode) {
      const resources = this.getResourcesByGroup(element.groupId);

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
      await this.findWorkspaceConfigs(workspaceFolder, resources);
    }

    if (shouldShowSystemConfigs()) {
      await this.findSystemConfigs(resources);
    }

    this.resources = resources.sort(compareResources);
    this.changeEmitter.fire(undefined);
  }

  private async findWorkspaceConfigs(
    workspaceFolder: vscode.WorkspaceFolder,
    resources: ConfigResource[]
  ): Promise<void> {
    const seen = new Set<string>();
    const addCandidate = async (kind: ConfigKind, relativePath: string): Promise<boolean> => {
      const uri = getWorkspaceCandidateUri(workspaceFolder, relativePath);

      if (seen.has(uri.fsPath)) {
        return false;
      }

      try {
        const stat = await vscode.workspace.fs.stat(uri);

        if (!hasFileType(stat.type, kind)) {
          return false;
        }

        resources.push({
          kind,
          scope: "workspace",
          uri,
          label: relativePath,
          description: workspaceFolder.name,
          workspaceFolder
        });
        seen.add(uri.fsPath);
        return true;
      } catch {
        // Missing workspace configs are expected. Only existing root-level candidates are shown.
        return false;
      }
    };

    for (const fileNameGroup of AI_CONFIG_FILE_NAME_GROUPS) {
      await addFirstExistingCandidate("file", fileNameGroup, addCandidate);
    }

    for (const relativePath of AI_CONFIG_FILE_PATHS) {
      await addCandidate("file", relativePath);
    }

    for (const directoryName of AI_CONFIG_DIRECTORIES) {
      await addCandidate("directory", directoryName);
    }
  }

  private getRootNodes(): TreeNode[] {
    const nodes: TreeNode[] = [];

    if (vscode.workspace.workspaceFolders?.length) {
      const workspaceResources = this.resources.filter((resource) => resource.scope === "workspace");
      nodes.push(...workspaceResources.map((resource) => new ResourceNode(resource)));

      if (workspaceResources.length === 0) {
        nodes.push(new MessageNode("No project AI configs found."));
      }
    } else {
      nodes.push(new MessageNode("Open a workspace to scan project AI configs."));
    }

    if (shouldShowSystemConfigs()) {
      nodes.push(new GroupNode("System", "system", this.getResourcesByGroup("system").length));
    }

    return nodes;
  }

  private getResourcesByGroup(_groupId: GroupId): ConfigResource[] {
    return this.resources.filter((resource) => resource.scope === "system");
  }

  private async findSystemConfigs(resources: ConfigResource[]): Promise<void> {
    const seen = new Set(resources.map((resource) => resource.uri.fsPath));

    for (const candidate of getSystemConfigCandidates()) {
      if (seen.has(candidate.uri.fsPath)) {
        continue;
      }

      try {
        const stat = await vscode.workspace.fs.stat(candidate.uri);

        if (!hasFileType(stat.type, candidate.kind)) {
          continue;
        }

        resources.push({
          kind: candidate.kind,
          scope: "system",
          uri: candidate.uri,
          label: formatHomePath(candidate.uri.fsPath),
          description: candidate.source
        });
        seen.add(candidate.uri.fsPath);
      } catch {
        // Missing system configs are expected. Only existing files and directories are shown.
      }
    }
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
    readonly groupId: GroupId,
    count: number
  ) {
    super(`${displayName} (${count})`, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "group";
  }
}

class ResourceNode extends vscode.TreeItem {
  constructor(readonly resource: ConfigResource) {
    const collapsibleState =
      resource.kind === "directory" ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;

    super(resource.label, collapsibleState);

    this.resourceUri = resource.uri;
    this.description = resource.description;
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

function getWorkspaceCandidateUri(workspaceFolder: vscode.WorkspaceFolder, relativePath: string): vscode.Uri {
  return vscode.Uri.joinPath(workspaceFolder.uri, ...relativePath.split(/[\\/]+/).filter(Boolean));
}

async function addFirstExistingCandidate(
  kind: ConfigKind,
  relativePaths: string[],
  addCandidate: (kind: ConfigKind, relativePath: string) => Promise<boolean>
): Promise<void> {
  for (const relativePath of relativePaths) {
    if (await addCandidate(kind, relativePath)) {
      return;
    }
  }
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
  const leftScope = left.scope.localeCompare(right.scope);

  if (leftScope !== 0) {
    return leftScope;
  }

  const leftWorkspace = left.description.localeCompare(right.description);

  if (leftWorkspace !== 0) {
    return leftWorkspace;
  }

  return left.label.localeCompare(right.label);
}

function compareDirectoryEntries(left: [string, vscode.FileType], right: [string, vscode.FileType]): number {
  const leftIsDirectory = left[1] === vscode.FileType.Directory;
  const rightIsDirectory = right[1] === vscode.FileType.Directory;

  if (leftIsDirectory !== rightIsDirectory) {
    return leftIsDirectory ? -1 : 1;
  }

  return left[0].localeCompare(right[0]);
}

function shouldShowSystemConfigs(): boolean {
  return vscode.workspace.getConfiguration("aiConfigJumper").get("showSystemConfigs", false);
}

function getSystemConfigCandidates(): SystemConfigCandidate[] {
  const home = os.homedir();
  const appData = process.env.APPDATA;
  const candidates: SystemConfigCandidate[] = [];

  const addHome = (kind: ConfigKind, source: string, ...segments: string[]) => {
    candidates.push({ kind, source, uri: vscode.Uri.file(path.join(home, ...segments)) });
  };

  const addPath = (kind: ConfigKind, source: string, fsPath: string | undefined) => {
    if (fsPath) {
      candidates.push({ kind, source, uri: vscode.Uri.file(fsPath) });
    }
  };

  addHome("directory", "Codex", ".codex");
  addHome("file", "Codex", ".codex", "config.toml");
  addHome("file", "Codex", ".codex", "AGENTS.md");

  addHome("directory", "Claude Code", ".claude");
  addHome("file", "Claude Code", ".claude.json");
  addHome("file", "Claude Code", ".claude", "settings.json");
  addHome("file", "Claude Code", ".claude", "CLAUDE.md");

  addHome("directory", "Gemini CLI", ".gemini");
  addHome("file", "Gemini CLI", ".gemini", "settings.json");
  addHome("file", "Gemini CLI", ".gemini", "GEMINI.md");

  addHome("directory", "Cursor", ".cursor");
  addHome("file", "Cursor", ".cursor", "mcp.json");

  addHome("directory", "Windsurf", ".windsurf");
  addHome("file", "MCP", ".mcp.json");

  if (process.platform === "darwin") {
    addPath("file", "Claude Desktop", path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json"));
    addPath("file", "VS Code", path.join(home, "Library", "Application Support", "Code", "User", "mcp.json"));
    addPath("file", "VS Code Insiders", path.join(home, "Library", "Application Support", "Code - Insiders", "User", "mcp.json"));
    addPath("file", "VSCodium", path.join(home, "Library", "Application Support", "VSCodium", "User", "mcp.json"));
  } else if (process.platform === "win32") {
    addPath("file", "Claude Desktop", appData ? path.join(appData, "Claude", "claude_desktop_config.json") : undefined);
    addPath("file", "VS Code", appData ? path.join(appData, "Code", "User", "mcp.json") : undefined);
    addPath("file", "VS Code Insiders", appData ? path.join(appData, "Code - Insiders", "User", "mcp.json") : undefined);
    addPath("file", "VSCodium", appData ? path.join(appData, "VSCodium", "User", "mcp.json") : undefined);
  } else {
    addPath("file", "Claude Desktop", path.join(home, ".config", "Claude", "claude_desktop_config.json"));
    addPath("file", "VS Code", path.join(home, ".config", "Code", "User", "mcp.json"));
    addPath("file", "VS Code Insiders", path.join(home, ".config", "Code - Insiders", "User", "mcp.json"));
    addPath("file", "VSCodium", path.join(home, ".config", "VSCodium", "User", "mcp.json"));
  }

  return candidates;
}

function hasFileType(actual: vscode.FileType, expected: ConfigKind): boolean {
  const expectedType = expected === "file" ? vscode.FileType.File : vscode.FileType.Directory;
  return (actual & expectedType) === expectedType;
}

function formatHomePath(fsPath: string): string {
  const home = os.homedir();

  if (fsPath === home) {
    return "~";
  }

  if (fsPath.startsWith(`${home}${path.sep}`)) {
    return `~${path.sep}${path.relative(home, fsPath)}`;
  }

  return fsPath;
}
