const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');

const fileEditor = require('./fileEditor.js');
const server = require('./server.js');

let contents;

let options = {
	files: [],
	list: '',
	dest: app.getPath('downloads'),
	port: 3000,
	version: 'unchecked'
};

//Check for the latest version
require('https').get('https://raw.githubusercontent.com/riskycase/file-server/deploy/package.json', (res) => {
	res.setEncoding('utf8');
	let body = '';
	res.on('data', (chunk) => { body += chunk; });
	res.on('end', () => {
		if(JSON.parse(body).version === app.getVersion()) options.version = 'latest';
		else options.version = 'old';
	});
});

module.exports.loadControl = function (receivedContents = contents) {
	contents = receivedContents;
	BrowserWindow.fromWebContents(contents).loadFile(path.resolve(__dirname, '../electron-views/control.html'));
	contents.on('did-finish-load', () => {
		contents.send('update', options);
		contents.send('version', app.getVersion());
		if(server.isServerListening) server.serverListening();
	});
}

ipcMain.on('input', (event, message, ...args) => {
	if (message === 'file-select') shareSelector('file');
	else if (message === 'folder-select') shareSelector('folder');
	else if (message === 'list-select') listSelector();
	else if (message === 'dest-select') destSelector();
	else if (message === 'port') portSelector(message, ...args);
	else if (message === 'version' && options.version === 'old') shell.openExternal('https://github.com/riskycase/file-server/releases');
	else if (message === 'start-server') server.launchServer(contents, options);
	else if (message === 'kill-server') server.killServer();
});

ipcMain.on('click', (event, message) => {
	if (message === 'selected-files') fileEditor.loadFileEditor(contents, options);
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
		if(!result.canceled) result.filePaths.forEach(pushUnique);
		contents.send('update', options);
	});
}

function pushUnique(item) {
	if (options.files.indexOf(item) === -1)
		options.files.push(item);
}

function listSelector () {
	dialog.showOpenDialog({
		title: 'Select list file',
		buttonLabel: 'Use this list',
		properties: ['openFile', 'showHiddenFiles', 'dontAddToRecent']
	}).then(result => {
		if(!result.canceled) options.list = result.filePaths[0];
		else options.list = '';
		contents.send('update', options);
	});
}

function destSelector () {
	dialog.showOpenDialog({
		title: 'Select folder save to',
		buttonLabel: 'Save here',
		properties: ['openDirectory', 'showHiddenFiles', 'dontAddToRecent', 'createDirectory', 'promptToCreate']
	}).then(result => {
		if(!result.canceled) options.dest = result.filePaths[0];
		else options.dest = app.getPath('downloads');
		contents.send('update', options);
	});
}

function portSelector(message, port) {
	options.port = port;
}