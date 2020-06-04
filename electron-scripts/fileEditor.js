const { BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

const control = require('./control.js');

let contents;
let options;

ipcMain.on('input', (event, message, ...args) => {
	if (message === 'clear-all') clearList();
	else if (message === 'done') control.loadControl();;
});

ipcMain.on('remove', (event, index) => {
	options.files.splice(index, 1);
	control.refreshNeeded();
	if(options.files.length) createCards();
	else control.loadControl();
});

ipcMain.on('list', (event, index) => {
	shell.openPath(options.files[index]);
});

function clearList() {
	options.files = [];
	control.refreshNeeded();
	control.loadControl();
}

module.exports.loadFileEditor = function (receivedContents = contents, receivedOptions = options) {
	contents = receivedContents;
	options = receivedOptions;
	if(options.files.length) {
		BrowserWindow.fromWebContents(contents).loadFile(path.resolve(__dirname, '../electron-views/fileEditor.html'));
		contents.on('did-finish-load', () => {
			createCards();
		});
	}
}

function createCards(value,index) {
	contents.send('list', options.files.map((value, index) => `
		<div class="uk-card uk-padding-small uk-card-secondary" style="height: 90px">
			<div class="uk-float uk-float-left" onclick="listClicked(${index})">
				<span class="uk-text-large">${path.basename(value)}</span>
				<br>
				<span class="uk-text-small">${value}</span>
			</div>
			<div class="uk-float uk-float-right" onclick="removeClicked(${index})">
				<a>Remove</a>
			</div>
		</div>
	`));
}