var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var rl = require('readline');
var nfu = require('nodejs-fs-utils');

// SET STORAGE
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads');
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
});

// Get args
var myArgs = process.argv.slice(2);
var files = [];
var rows = [];
var index = 0;

function formObject(path) {
	var name, icon, size = humanFileSize(nfu.fsizeSync(path), true);
	if ( path.lastIndexOf('/')+1 === path.length ) {
		name = path.substring(path.lastIndexOf('/', path.lastIndexOf('/') - 1 ) + 1, path.length - 1);
		icon = 'folder';
	}
	else {
		name = path.substring(path.lastIndexOf('/') + 1);
		var ext = path.substring(path.indexOf('.') + 1) == path ? 'null' : path.substring(path.indexOf('.') + 1);
		icon = 'file';
		if( ext.match('jpg|jpeg|png|dng|bmp|tiff') ) icon = 'image' ;
		if( ext.match('mp3|ogg|avi|mp4|flac') ) icon = 'play' ;
		if( ext.match('txt|doc|docx') ) icon = 'file-text' ;
		if( ext.match('pdf') ) icon = 'file-pdf' ;
		var stat = fs.statSync(path);
	}
	return {
		'name': name,
		'icon': icon,
		'icon': icon,
		'size': size,
		'index': index++
	};
}

for (index in myArgs) {
	var file = myArgs[index];
	var readInterface = rl.createInterface({
		input: fs.createReadStream(file),
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
	res.render('index', { rows : rows });
});

/* POST home page. */
router.post('/', upload.array('files[]'), (req, res) => {
	const files = req.files;
	if (!files) {
		const error = new Error('Please choose files');
		error.httpStatusCode = 400;
		return next(error);
	}
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
