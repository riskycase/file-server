const { ipcRenderer } = require('electron');

document.querySelector('#file-select').addEventListener('click', () => {
	ipcRenderer.send('input', 'file-select');
});

document.querySelector('#folder-select').addEventListener('click', () => {
	ipcRenderer.send('input', 'folder-select');
});

document.querySelector('#selected-files').addEventListener('click', () => {
	ipcRenderer.send('click', 'selected-files');
});

document.querySelector('#list-select').addEventListener('click', () => {
	ipcRenderer.send('input', 'list-select');
});

document.querySelector('#dest-select').addEventListener('click', () => {
	ipcRenderer.send('input', 'dest-select');
});

document.querySelector('#port').addEventListener('input', () => {
	ipcRenderer.send('input', 'port', document.querySelector('#port').value);
});

document.querySelector('#start-server').addEventListener('click', () => {
	ipcRenderer.send('input', 'start-server');
});

document.querySelector('#kill-server').addEventListener('click', () => {
	ipcRenderer.send('input', 'kill-server');
});

ipcRenderer.on('status', (event, message) => {
	if(message === 'initiating') {
		document.querySelector('#message').innerHTML = 'Creating server configuration';
	}
	else if(message === 'initiated') {
		document.querySelector('#message').innerHTML = 'Parsing as HTTP server';
	}
	else if(message === 'created') {
		document.querySelector('#message').innerHTML = 'Binding server to specified port';
	}
	else if(message === 'port-err') {
		document.querySelector('#message').innerHTML = 'Can\'t use the selecte dport, try changing port or run with elevated permissions';
	}
	else if(message === 'binded') {
		document.querySelector('#message').innerHTML = 'Server ready';
		document.querySelector('#start-server').style.display = 'none';
		document.querySelector('#kill-server').style.display = 'inline-block';
	}
	else if(message === 'closing') {
		document.querySelector('#message').innerHTML = 'Shutting down server';
	}
	else if(message === 'closed') {
		document.querySelector('#message').innerHTML = 'Server closed';
		document.querySelector('#ip-address').innerHTML = '';
		document.querySelector('#start-server').style.display = 'inline-block';
		document.querySelector('#kill-server').style.display = 'none';
	}
});

ipcRenderer.on('address', (event, message) => {
	document.querySelector('#ip-address').innerHTML = message.map(value => value.join(': ') + ':' + document.querySelector('#port').value).join('<br>');
});

ipcRenderer.on('update', (event, message) => {
	document.querySelector('#selected-dest').innerHTML = message.dest;
	if(message.list !== '') document.querySelector('#selected-list').innerHTML = message.list;
	else document.querySelector('#selected-list').innerHTML = 'No list file selected!';
	document.querySelector('#port').innerHTML = message.port;
	if(message.files.length) {
		if(message.files.length === 1) document.querySelector('#selected-files').innerHTML = '1 file selected. Click to view/edit.';
		else document.querySelector('#selected-files').innerHTML = message.files.length +' files selected. Click to view/edit.';
	}
	else document.querySelector('#selected-files').innerHTML = 'No files selected';
});

