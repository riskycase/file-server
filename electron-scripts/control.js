const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');

const fileEditor = require('./fileEditor.js');
const server = require('./server.js');

let contents;
let refreshNeeded = false;

//Check for the latest version
require('https').get('https://raw.githubusercontent.com/riskycase/file-server/deploy/package.json', (res) => {
	res.setEncoding('utf8');
	let body = '';
	res.on('data', (chunk) => { body += chunk; });
	res.on('end', () => {
		if(JSON.parse(body).version === app.getVersion()) server.options.version = 'latest';
		else server.options.version = 'old';
	});
});

module.exports.refreshNeeded = () => refreshNeeded = true;

module.exports.loadControl = function (receivedContents = contents) {
	contents = receivedContents;
	BrowserWindow.fromWebContents(contents).loadFile(path.resolve(__dirname, '../electron-views/control.html'))
	.then(() => {
		contents.send('load', {options: server.options, refreshNeeded: refreshNeeded && server.isServerListening() ? 'needed' : 'done', version: app.getVersion()});
		if(server.isServerListening()) server.serverListening();
	});
}

ipcMain.on('input', (event, message, ...args) => {
	if (message === 'file-select') shareSelector('file');
	else if (message === 'folder-select') shareSelector('folder');
	else if (message === 'list-select') listSelector();
	else if (message === 'dest-select') destSelector();
	else if (message === 'port') portSelector(message, ...args);
	else if (message === 'version' && server.options.version === 'old') shell.openExternal('https://github.com/riskycase/file-server/releases');
	else if (message === 'start-server') server.launchServer(contents);
	else if (message === 'kill-server') server.destroyServer();
	else if (message === 'refresh-server') server.refreshServer();
});

ipcMain.on('click', (event, message) => {
	if (message === 'selected-files') fileEditor.loadFileEditor(contents);
});

function shareSelector (type) {
	let properties = ['multiSelections', 'showHiddenFiles', 'dontAddToRecent'];
	let title, label;
	if (type === 'file') {
		properties.push('openFile');
		title = 'Select files to share';
		label = 'Add files';
	}
	else {
		properties.push('openDirectory');
		title = 'Select folders to share';
		label = 'Add folders';
	}
	dialog.showOpenDialog({
		title: title,
		buttonLabel: label,
		properties: properties
	}).then(result => {
		if(!result.canceled) {
			result.filePaths.forEach(pushUnique);
		}
		contents.send('update', server.options);
	});
}

function pushUnique(item) {
	if (server.options.files.indexOf(item) === -1) {
		server.options.files.push(item);
		server.optionsChanged();
		refreshNeeded = false;
	}
}

function listSelector () {
	dialog.showOpenDialog({
		title: 'Select list file',
		buttonLabel: 'Use this list',
		properties: ['openFile', 'showHiddenFiles', 'dontAddToRecent']
	}).then(result => {
		if(!result.canceled) server.options.list = result.filePaths[0];
		else server.options.list = '';
		contents.send('update', server.options);
	});
}

function destSelector () {
	dialog.showOpenDialog({
		title: 'Select folder save to',
		buttonLabel: 'Save here',
		properties: ['openDirectory', 'showHiddenFiles', 'dontAddToRecent', 'createDirectory', 'promptToCreate']
	}).then(result => {
		if(!result.canceled) server.options.dest = result.filePaths[0];
		else server.options.dest = app.getPath('downloads');
		contents.send('update', server.options);
	});
}

function portSelector(message, port) {
	server.options.port = port;
}