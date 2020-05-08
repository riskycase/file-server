const fs = require('fs');
const rl = require('readline');
const nfu = require('nodejs-fs-utils');
const multer = require('multer');
const path = require('path');
	
let files = [];
let rows = [];
let index = 0;
let destination;
const icons = [
	['image','jpg|jpeg|png|dng|bmp|tiff'],
	['play','mp3|ogg|avi|mp4|flac'],
	['file-text','txt|doc|docx'],
	['pdf','pdf'],
	['file','']
];

// Form the row object that will be inserted into the view
const formObject = (filePath, index) => ({
	'name': path.basename(filePath),
	'icon': fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory() ? 'folder' : getIcon(path.extname(filePath).substring(path.extname(filePath).indexOf('.') + 1)),
	'size': humanFileSize(nfu.fsizeSync(filePath)),
	'index': index++
});

// Get the icon of the file/folder given filePath
const getIcon = (ext) => icons.find((value) => ext.match(value[1]))[0];

/* Convert file size to human readable */
function humanFileSize(bytes) {
	const thresh = 1000;
	if(Math.abs(bytes) < thresh) {
		return bytes + ' B';
	}
	const units = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
	let u = -1;
	do {
		bytes /= thresh;
		++u;
	}while(Math.abs(bytes) >= thresh);
	return bytes.toFixed(0)+' '+units[u];
}

/* Get unique elements only */
const onlyUnique = (value, index, self) => self.indexOf(value) === index;

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
		if( files.indexOf(line) === -1 ) {
			files.push(line);
		}
	}

}

const upload = multer({ storage: storage });

module.exports.init = async function(cli) {
	
	files = cli.input.filter(onlyUnique);
	destination = cli.flags.destination;
	
	fs.access(destination, fs.constants.F_OK, (err) => {
		if(err)
			fs.mkdirSync(destination, { recursive: true });
	});
	
	if(cli.flags.list) await readLines(cli.flags.list);

	files = files.filter(onlyUnique);		
	rows = files.map(formObject);

};

module.exports.getRows = () => rows;

module.exports.getPaths = () => files;

module.exports.isFolder = (index) => rows[index].icon === 'folder';

module.exports.saveFiles = upload.array('files[]');

module.exports.updateRows = function(uploadedFiles) {
	
	uploadedFiles.forEach(function (value) {
		if ( files.indexOf(value.path) === -1 ) {
			files.push(value.path);
			rows.push({
				'name': value.filename,
				'icon': getIcon(path.extname(value.filename).substring(path.extname(value.filename).indexOf('.') + 1)),
				'size': humanFileSize(value.size),
				'index': index++
			});
		}
	});
	
};
