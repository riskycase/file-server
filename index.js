const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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

let cli = {
	files: [],
	list: '',
	dest: app.getPath('downloads'),
	port: 3000
};

ipcMain.on('input', (event, message, ...args) => {
	if (message === 'file-select') shareSelector('file');
	else if (message === 'folder-select') shareSelector('folder');
	else if (message === 'list-select') listSelector();
	else if (message === 'dest-select') destSelector();
	else if (message === 'port') portSelector(message, ...args);
	else if (message === 'clear-all') clearList();
	else if (message === 'done') loadControl();
	else if (message === 'start-server') launchServer();
	else if (message === 'kill-server') destroyServer();
});

ipcMain.on('click', (event, message) => {
	if (message === 'selected-files') filesEditor();
});

ipcMain.on('list', (event, index) => {
	cli.files.splice(index, 1);
	if(cli.files.length) createCards();
	else loadControl();
});

function clearList() {
	cli.files = [];
	loadControl();
}

function loadControl() {
	BrowserWindow.fromWebContents(contents).loadFile('electron-files/control.html');
	contents.on('did-finish-load', () => {
		contents.send('update', cli);
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
		contents.send('update', cli);
	});
}

function pushUnique(item) {
	if (cli.files.indexOf(item) === -1)
		cli.files.push(item);
}

function listSelector () {
	dialog.showOpenDialog({
		title: 'Select list file',
		buttonLabel: 'Use this list',
		properties: ['openFile', 'showHiddenFiles', 'dontAddToRecent']
	}).then(result => {
		if(!result.canceled) cli.list = result.filePaths[0];
		else cli.list = '';
		contents.send('update', cli);
	});
}

function destSelector () {
	dialog.showOpenDialog({
		title: 'Select folder save to',
		buttonLabel: 'Save here',
		properties: ['openDirectory', 'showHiddenFiles', 'dontAddToRecent', 'createDirectory', 'promptToCreate']
	}).then(result => {
		if(!result.canceled) cli.dest = result.filePaths[0];
		else cli.dest = app.getPath('downloads');
		contents.send('update', cli);
	});
}

function filesEditor () {
	if(cli.files.length) {
		BrowserWindow.fromWebContents(contents).loadFile('electron-files/fileEditor.html');
		contents.on('did-finish-load', () => {
			createCards();
		});
	}
}

function launchServer() {
	contents.send('status', 'initiating');
	require('./app')({
		input: cli.files,
		flags: {
			destination: cli.dest,
			list: cli.list,
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
	server.listen(cli.port);
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
	cli.port = port;
}

function createCards(value,index) {
	contents.send('list', cli.files.map((value, index) => '<div class="uk-card uk-padding-small uk-card-secondary" onclick="listClicked('+index+')"><h3>'+path.basename(value)+'</h3><span class="uk-text-small">'+value+'</span></div>'));
}
