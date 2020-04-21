var fs = require('fs');
var rl = require('readline');
var nfu = require('nodejs-fs-utils');
var multer = require('multer');
	
var files = [];
var rows = [];
var index = 0;
var destination;

// Form the row object that will be inserted into the view
function formObject(path) {
	return {
		'name': nameOf(path),
		'icon': getIcon(path),
		'size': humanFileSize(nfu.fsizeSync(path), true),
		'index': index++
	};
}

// Get the name of the file/folder from the path
function nameOf(path) {
	return (path.lastIndexOf('/')+1 === path.length) ? path.substring(path.lastIndexOf('/', path.lastIndexOf('/') - 1 ) + 1, path.length - 1) : name = path.substring(path.lastIndexOf('/') + 1);
}

// Get the icon of the file/folder given path
function getIcon(path) {
	var icon = 'file';
	if ( path.lastIndexOf('/')+1 === path.length ) icon =  'folder';
	var ext = path.substring(path.indexOf('.') + 1) == path ? 'null' : path.substring(path.indexOf('.') + 1);
	if( ext.match('jpg|jpeg|png|dng|bmp|tiff') ) icon =  'image' ;
	else if( ext.match('mp3|ogg|avi|mp4|flac') ) icon =  'play' ;
	else if( ext.match('txt|doc|docx') ) icon =  'file-text' ;
	else if( ext.match('pdf') ) icon =  'file-pdf' ;
	return icon;
}

/* Convert file size to human readable */
function humanFileSize(bytes, si) {
	var thresh = si ? 1000 : 1024;
	if(Math.abs(bytes) < thresh) {
		return bytes + ' B';
	}
	var units = si
		? ['kB','MB','GB','TB','PB','EB','ZB','YB']
		: ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
	var u = -1;
	do {
		bytes /= thresh;
		++u;
	}while(Math.abs(bytes) >= thresh && u < units.length - 1);
	return bytes.toFixed(0)+' '+units[u];
}


/* Get unique elements only */
function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}

// SET STORAGE
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, destination);
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
});

var upload = multer({ storage: storage });

module.exports.init = function(cli) {
	
	files = cli.input.map(value => value.replace(/\\/g, '/'));
	rows = files.map(formObject);
	destination = cli.flags.destination;
	
	//Read from list of files
	if(cli.flags.list !== '') {
		var readInterface = rl.createInterface({
			input: fs.createReadStream(cli.flags.list),
			output: process.stdout,
			console: false
		});
		readInterface.on('line', function(line) {
			if( files.indexOf(line) === -1 ) {
				files.push(line);
				rows.push(formObject(line));
			}
		});
	}

}

module.exports.getRows = function() {
	return rows;
}

module.exports.getPaths = function() {
	return files;
}

module.exports.saveFiles = upload.array('files[]');

module.exports.updateRows = function(files) {
	files.forEach(function (value) {
		var path = value.path.replace(/\\/g, '/');
		files.push(path);
		rows.push(formObject(path));
	});
}
