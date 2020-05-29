const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const os = require('os');
const http = require('http');
const path = require('path');

function createWindow () {
	// Create the browser window.
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		resizable: false,
		fullscreenable: false,
		webPreferences: {
			nodeIntegration: true
		}
	});
	
	contents = win.webContents;
	
	win.setMenuBarVisibility(false);
	
	loadControl();
	require('https').get('https://raw.githubusercontent.com/riskycase/file-server/deploy/package.json', (res) => {
		res.setEncoding('utf8');
		let body = '';
		res.on('data', (chunk) => { body += chunk; });
		res.on('end', () => {
			if(JSON.parse(body).version === app.getVersion()) options.version = 'latest';
			else options.version = 'old';
		});
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
	if(server && server.listening) server.close();
	app.quit();
  }
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

let contents;
let server;

let options = {
	files: [],
	list: '',
	dest: app.getPath('downloads'),
	port: 3000,
	version: 'unchecked'
};

ipcMain.on('input', (event, message, ...args) => {
	if (message === 'file-select') shareSelector('file');
	else if (message === 'folder-select') shareSelector('folder');
	else if (message === 'list-select') listSelector();
	else if (message === 'dest-select') destSelector();
	else if (message === 'port') portSelector(message, ...args);
	else if (message === 'clear-all') clearList();
	else if (message === 'done') loadControl();
	else if (message === 'version' && options.version === 'old') shell.openExternal('https://github.com/riskycase/file-server/releases');
	else if (message === 'start-server') launchServer();
	else if (message === 'kill-server') destroyServer();
});

ipcMain.on('click', (event, message) => {
	if (message === 'selected-files') filesEditor();
});

ipcMain.on('remove', (event, index) => {
	options.files.splice(index, 1);
	if(options.files.length) createCards();
	else loadControl();
});

ipcMain.on('list', (event, index) => {
	shell.openPath(options.files[index]);
});

function clearList() {
	options.files = [];
	loadControl();
}

function loadControl() {
	BrowserWindow.fromWebContents(contents).loadFile('electron-views/control.html');
	contents.on('did-finish-load', () => {
		contents.send('update', options);
		contents.send('version', app.getVersion());
		if(server && server.listening) serverListening();
	});
}

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

function filesEditor () {
	if(options.files.length) {
		BrowserWindow.fromWebContents(contents).loadFile('electron-views/fileEditor.html');
		contents.on('did-finish-load', () => {
			createCards();
		});
	}
}

function launchServer() {
	contents.send('status', 'initiating');
	require('./server/app')({
		input: options.files,
		flags: {
			destination: options.dest,
			list: options.list,
		}
	}).then(createServer);
}

function getAddresses() {
	const ni = os.networkInterfaces();
	let addresses = [];
	for (const iface in ni) {
		const ip4 = ni[iface].find(iface => iface.family === 'IPv4');
		if(!ip4.internal) addresses.push([iface, ip4.address]);
	}
	return addresses;
}

function createServer(app) {
	contents.send('status', 'initiated');
	server = http.createServer(app);
	contents.send('status', 'created');
	server.listen(options.port);
	server.on('listening', serverListening);
	server.on('error', serverErrored);
}

function serverListening() {
	contents.send('status', 'binded');
	contents.send('address', getAddresses());
}

function serverErrored(err) {
	if(err.code === 'EADDRINUSE') contents.send('status', 'port-used');
	if(err.code === 'EACCES') contents.send('status', 'port-err');
}

function destroyServer() {
	contents.send('status', 'closing');
	server.close();
	contents.send('status', 'closed');
}

function portSelector(message, port) {
	options.port = port;
}

function createCards(value,index) {
	contents.send('list', options.files.map((value, index) => '<div class="uk-card uk-padding-small uk-card-secondary" style="height: 90px"><div class="uk-float uk-float-left" onclick="listClicked('+index+')"><span class="uk-text-large">'+path.basename(value)+'</span><br><span class="uk-text-small">'+value+'</span></div><div class="uk-float uk-float-right" onclick="removeClicked('+index+')"><a>Remove</a></div></div>'));
}
