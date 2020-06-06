const http = require('http');
const { app } = require('electron');
const os = require('os');

let server;
let contents;

module.exports.options = options = {
	_files: [],
	get files() {
		return this._files;
	},
	set files(files) {
		this._files = files;
	},
	_list: '',
	get list() {
		return this._list;
	},
	set list(list) {
		this._list = list;
		optionsChanged();
	},
	_dest: app.getPath('downloads'),
	get dest() {
		return this._dest;
	},
	set dest(dest) {
		this._dest = dest;
		optionsChanged();
	},
	_port: 3000,
	get port() {
		return this._port;
	},
	set port(port) {
		this._port = port;
	},
	_version: 'unchecked',
	get version() {
		return this._version;
	},
	set version(version) {
		this._version = version;
	}
};

module.exports.optionsChanged = optionsChanged;

module.exports.killServer = killServer;

module.exports.destroyServer = destroyServer;

module.exports.refreshServer = function () {
	require('../server/middleware/storage').init({
		input: options.files,
		flags: {
			destination: options.dest,
			list: options.list,
		}
	});
	contents.send('refresh', 'done');
}

module.exports.launchServer = function (receivedContents) {
	contents = receivedContents;
	contents.send('status', 'initiating');
	require('../server/app')({
		input: options.files,
		flags: {
			destination: options.dest,
			list: options.list,
		}
	}).then(createServer);
}

module.exports.isServerListening = function () {
	return server ? server.listening : false;
}

module.exports.serverListening = serverListening;

function optionsChanged() {
	if(server && server.listening) contents.send('refresh', 'needed');
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

function killServer() {
	if(server && server.listening) server.close();	
}

function destroyServer() {
	contents.send('status', 'closing');	
	killServer();
	contents.send('status', 'closed');
}