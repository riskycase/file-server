const { ipcRenderer } = require('electron');

document.getElementById('file-select').addEventListener('click', () => {
	ipcRenderer.send('input', 'file-select');
});

document.getElementById('folder-select').addEventListener('click', () => {
	ipcRenderer.send('input', 'folder-select');
});

document.getElementById('selected-files').addEventListener('click', () => {
	ipcRenderer.send('click', 'selected-files');
});

document.getElementById('list-select').addEventListener('click', () => {
	ipcRenderer.send('input', 'list-select');
});

document.getElementById('dest-select').addEventListener('click', () => {
	ipcRenderer.send('input', 'dest-select');
});

document.getElementById('port').addEventListener('input', () => {
	ipcRenderer.send('input', 'port', document.getElementById('port').value);
});

document.getElementById('start-server').addEventListener('click', () => {
	ipcRenderer.send('input', 'start-server');
});

document.getElementById('kill-server').addEventListener('click', () => {
	ipcRenderer.send('input', 'kill-server');
});

ipcRenderer.on('status', (event, message) => {
	if(message === 'initiating') {
		document.getElementById('message').innerHTML = 'Creating server configuration';
	}
	else if(message === 'initiated') {
		document.getElementById('message').innerHTML = 'Parsing as HTTP server';
	}
	else if(message === 'created') {
		document.getElementById('message').innerHTML = 'Binding server to specified port';
	}
	else if(message === 'port-err') {
		document.getElementById('message').innerHTML = 'Can\'t use the selected port, try changing port or run with elevated permissions';
	}
	else if(message === 'binded') {
		document.getElementById('message').innerHTML = 'Server ready';
		document.getElementById('start-server').style.display = 'none';
		document.getElementById('kill-server').style.display = 'inline-block';
	}
	else if(message === 'closing') {
		document.getElementById('message').innerHTML = 'Shutting down server';
	}
	else if(message === 'closed') {
		document.getElementById('message').innerHTML = 'Server closed';
		document.getElementById('ip-address').innerHTML = '';
		document.getElementById('start-server').style.display = 'inline-block';
		document.getElementById('kill-server').style.display = 'none';
	}
});

ipcRenderer.on('address', (event, message) => {
	document.getElementById('ip-address').innerHTML = message.map(value => value.join(': ') + ':' + document.getElementById('port').value).join('<br>');
});

ipcRenderer.on('update', (event, message) => {
	document.getElementById('selected-dest').innerHTML = message.dest;
	if(message.list !== '') document.getElementById('selected-list').innerHTML = message.list;
	else document.getElementById('selected-list').innerHTML = 'No list file selected!';
	document.getElementById('port').innerHTML = message.port;
	if(message.files.length) {
		if(message.files.length === 1) document.getElementById('selected-files').innerHTML = '1 file selected. Click to view/edit.';
		else document.getElementById('selected-files').innerHTML = message.files.length +' files selected. Click to view/edit.';
	}
	else document.getElementById('selected-files').innerHTML = 'No files selected';
});

