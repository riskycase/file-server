const http = require('http');
const os = require('os');

let server;
let contents;
let options;

module.exports.killServer = killServer;

module.exports.destroyServer = destroyServer;

module.exports.launchServer = function (receivedContents = contents, receivedOptions = options) {
	contents = receivedContents;
	options = receivedOptions;
	contents.send('status', 'initiating');
	require('../server/app')({
		input: options.files,
		flags: {
			destination: options.dest,
			list: options.list,
		}
	}).then(createServer);
}

module.exports.isServerLisenting = server && server.listening;

module.exports.serverListening = serverListening;

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
	if(server && server.listening)
		server.close();	
}

function destroyServer() {
	contents.send('status', 'closing');	
	killServer();
	contents.send('status', 'closed');
}