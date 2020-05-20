const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const os = require('os');
const http = require('http');

let contents;
let server;

let cli = {
	files: [],
	list: '',
	dest: app.getPath('downloads'),
	port: 3000
};

ipcMain.on('input', (event, message, ...args) => {
	if (message === 'file-select') fileSelector();
	else if (message === 'folder-select') folderSelector();
	else if (message === 'list-select') listSelector();
	else if (message === 'dest-select') destSelector();
	else if (message === 'port') portSelector(message, ...args);
	else if (message === 'start-server') launchServer();
	else if (message === 'kill-server') destroyServer();
});

ipcMain.on('click', (event, message, ...args) => {
	if (message === 'selected-files') filesEditor();
});

function fileSelector () {
	dialog.showOpenDialog({
		title: 'Select files to share',
		buttonLabel: 'Add files',
		properties: ['openFile', 'multiSelections', 'showHiddenFiles', 'dontAddToRecent']
	}).then(result => {
		if(!result.canceled) result.filePaths.forEach(value => cli.files.push(value));
		contents.send('update', cli);
	});
}

function folderSelector () {
	dialog.showOpenDialog({
		title: 'Select folders to share',
		buttonLabel: 'Add folders',
		properties: ['openDirectory', 'multiSelections', 'showHiddenFiles', 'dontAddToRecent']
	}).then(result => {
		if(!result.canceled) result.filePaths.forEach(value => cli.files.push(value));
		contents.send('update', cli);
	});
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
		else cli.dest = path.resolve(__dirname, './uploads');
		contents.send('update', cli);
	});
}

function filesEditor () {
	if(cli.files.length) {
		let list = cli.files.map(value => value);
		list.push('Cancel');
		dialog.showMessageBox({
			type: 'info',
			title: 'Edit files to share',
			message: 'Select the files you want to remove from share list',
			buttons: list
		}).then(action => {
			if(action.response !== cli.files.length) {
				cli.files.splice(action.response, 1);
				contents.send('update', cli);
				filesEditor();
			}
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
			port: cli.port
		}
	}).then((app) =>{
		contents.send('status', 'initiated');
		server = http.createServer(app);
		contents.send('status', 'created');
		try {
			server.listen(cli.port);
			contents.send('status', 'binded');
			const ni = os.networkInterfaces();
			let addrs = [];
			for (const iface in ni) {
				const ip4 = ni[iface].find(iface => iface.family === 'IPv4');
				if(!ip4.internal) addrs.push([iface, ip4.address]);
			}
			contents.send('address', addrs);
		}
		catch (err) {
			if(err.code === 'EACCESS') contents.send('status', 'port-err');
		}
	});
}

function destroyServer() {
	contents.send('status', 'closing');
	server.close();
	contents.send('status', 'closed');
}

function portSelector (message, port) {
	cli.port = port;
}

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: 'icon.png',
    resizable: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true
    }
  });
  
  contents = win.webContents;
  
  win.setMenuBarVisibility(false);
  // and load the index.html of the app.
  win.loadFile('electron-files/control.html');
  
  contents.on('did-finish-load', () => {
    contents.send('update', cli);
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
