const fs = require('fs');
const rl = require('readline');
const nfu = require('nodejs-fs-utils');
const multer = require('multer');
const path = require('path');
	
let sharedFiles = [];
let receivedFiles = [];
let destination;
const icons = [
	['image','jpg|jpeg|png|dng|bmp|tiff'],
	['play','mp3|ogg|avi|mp4|flac'],
	['file-text','txt|doc|docx'],
	['pdf','pdf'],
	['file','']
];

// Form the row object that will be inserted into the view
const formRow = (file, index) => ({
	'name': path.basename(file.path),
	'icon': file.folder ? 'folder' : getIcon(path.extname(file.path).substring(path.extname(file.path).indexOf('.') + 1)),
	'size': !file.size ? 'Calculating size' : humanFileSize(file.size),
	'index': index
});

// Get the icon of the file/folder given file path
const getIcon = (ext) => icons.find((value) => ext.match(value[1]))[0];

/* Convert file size to human readable */
function humanFileSize(bytes) {
	const thresh = 1024;
	if(Math.abs(bytes) < thresh) {
		return bytes + ' B';
	}
	const units = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
	let u = -1;
	do {
		bytes /= thresh;
		++u;
	}while(Math.abs(bytes) >= thresh);
	return bytes.toFixed(2)+' '+units[u];
}

/* Get unique elements only */
function isPathPresent(arr, path) {
	return arr.find(value => value.path === path);
}

// SET STORAGE
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, destination);
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
});

async function readLines(listPath) {
	
	const readInterface = rl.createInterface({
		input: fs.createReadStream(listPath),
		console: false
	});

	for await (const line of readInterface) {
		if( !isPathPresent(sharedFiles, line) ) {
			sharedFiles.push(fileMaker(line));
		}
	}

}

function fileMaker(path) {
	return {path:path, size: undefined, folder: undefined}
}

function calcSize(file) {
	nfu.fsize(file.path, (err, size) => file.size = size);
	file.folder = fs.existsSync(file.path) && fs.lstatSync(file.path).isDirectory();
}

const upload = multer({ storage: storage });

module.exports.init = async function(cli) {
	
	sharedFiles = cli.input.filter((value, index, self) => self.indexOf(value) === index).map(fileMaker);
	destination = cli.flags.destination;
	
	fs.access(destination, fs.constants.F_OK, (err) => {
		if(err)
			fs.mkdirSync(destination, { recursive: true });
	});
	
	if(cli.flags.list !== '') await readLines(cli.flags.list);
	
	sharedFiles.forEach(calcSize);
	
	receivedFiles = [];
	
};

module.exports.getRows = () => sharedFiles.concat(receivedFiles).map(formRow);

module.exports.getPaths = () => sharedFiles.concat(receivedFiles).map(fileObject => fileObject.path);

module.exports.isFolder = (index) => sharedFiles.concat(receivedFiles)[index].folder;

module.exports.saveFiles = upload.array('files[]');

module.exports.updateRows = function(uploadedFiles) {
	
	uploadedFiles.forEach(function (value) {
		if ( !isPathPresent(receivedFiles, value.path) ) {
			receivedFiles.push({path: value.path, size: value.size, folder: false});
		}
	});
	
};
