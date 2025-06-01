const vscode = require('vscode');

function activate(context) {
    let disposable = vscode.commands.registerCommand('openreplica-hello-world.helloWorld', function () {
        vscode.window.showInformationMessage('Hello from OpenReplica!');
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
