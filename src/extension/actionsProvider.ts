import * as vscode from "vscode";

type ActionId =
  | "routingStudio.open"
  | "routingStudio.newFile"
  | "routingStudio.validate"
  | "routingStudio.export"
  | "routingStudio.showOutput";

class ActionItem extends vscode.TreeItem {
  constructor(label: string, commandId: ActionId, iconId: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.command = { command: commandId, title: label };
    this.iconPath = new vscode.ThemeIcon(iconId);
  }
}

export class ActionsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.changeEmitter.event;

  refresh() {
    this.changeEmitter.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.TreeItem[] {
    return [
      new ActionItem("Open", "routingStudio.open", "folder-opened"),
      new ActionItem("New Routing File", "routingStudio.newFile", "new-file"),
      new ActionItem("Validate", "routingStudio.validate", "check"),
      new ActionItem("Export", "routingStudio.export", "export"),
      new ActionItem("Show Output", "routingStudio.showOutput", "output"),
    ];
  }
}

