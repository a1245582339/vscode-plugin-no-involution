import * as vscode from 'vscode';
import { getConfig } from './getConfig';
import { subscribeSchedule } from './schedule';
export function activate() {
	const config = getConfig();
	subscribeSchedule(config);
	vscode.workspace.onDidChangeConfiguration(() => {
		const config = getConfig();
		subscribeSchedule(config);
	});
}

export function deactivate() { }
