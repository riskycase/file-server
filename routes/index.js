var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var rl = require('readline');
var nfu = require('nodejs-fs-utils');
var meow = require('meow');

// Get args
var cli = meow(`
	Usage
	  $ npm start [options] [files]
	  files is an array of paths to files you want to share

	Options
	  --destination, -d	PATH	Save uploaded files to folder specified in path (defaults to uploads folder in local working directory)
	  --list, -l		PATH	Read files to share from the lsit given in path

	Examples
	  $ npm start 
`, {
	booleanDefault: undefined,
	flags: {
		destination: {
			type: 'string',
			default: 'uploads',
			alias: 'd'
		},
		list: {
			type: 'string',
			default: '',
			alias: 'l'
		}
	}
});
var files = cli.input.map(value => value.replace(/\\/g, '/'));
var rows = files.map(formObject);
var index = 0;

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

// SET STORAGE
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, cli.flags.destination);
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
});

//Read from list of files
if(cli.flags.list !== '') {
	var readInterface = rl.createInterface({
		input: fs.createReadStream(cli.flags.list),
		output: process.stdout,
		console: false
	});
	readInterface.on('line', function(line) {
		if( files.indexOf(line) === -1 ) files.push(line);
	});
	readInterface.on('close', function() {
		if( files.length > 0 ) {
			rows = files.map( function(value) {
				return formObject(value);
			});
		}
	});
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

var upload = multer({ storage: storage });

/* GET home page. */
router.get('/', function(req, res) {
	if(rows.length > 0) res.render('index', { lines : rows });
	else res.render('index', { lines : undefined });
});

/* POST home page. */
router.post('/', upload.array('files[]'), (req, res) => {
	const files = req.files;
	if (!files) {
		const error = new Error('Please choose files');
		error.httpStatusCode = 400;
		return next(error);
	}
	if(!rows) rows = [];
	files.forEach( function(value, index) {
		var path = JSON.stringify(value.path).replace('\\\\', '/').replace(/"/g, '');
		rows.push(formObject(path));
	});
	res.send(files);
});

/* Download single file */
router.post('/download', (req, res) => {
	var value = files[req.body.file];
	if ( value.lastIndexOf('/')+1 === value.length ) {
		var name = value.substring(value.lastIndexOf('/', value.lastIndexOf('/') - 1 ) + 1, value.length - 1);
		var namezip = name + '.zip';
		res.zip({
			'files':[
				{ 'path': value, 'name': name }
			],
			'filename' : namezip
		});
	}
	else {
		res.download(value);
	}
});

/* Download all files */
router.get('/download', (req, res) => {
	var list = files.filter( onlyUnique );
	var filesJSON = list.map( function(value) {
		if ( value.lastIndexOf('/')+1 === value.length )
			var name = value.substring(value.lastIndexOf('/', value.lastIndexOf('/') - 1 ) + 1, value.length - 1);
		else
			var name = value.substring(value.lastIndexOf('/') + 1);
		return { 
			'path': value,
			'name': name,
		};
	});
	res.zip({
		'files': filesJSON,
		'filename': 'allFiles.zip'
	});
});

module.exports = router;
