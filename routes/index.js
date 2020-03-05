var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var rl = require('readline');

// SET STORAGE
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads')
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname)
	}
});

// Get args
var myArgs = process.argv.slice(2);
var files = [];

for (index in myArgs) {
	var file = myArgs[index];
	var readInterface = rl.createInterface({
		input: fs.createReadStream(file),
		output: process.stdout,
		console: false
	});
	readInterface.on('line', function(line) {
		files.push(line);
	});
}

/* Get unique elements only */
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function formRow(icon, name, link) {
	return '<tr>\
	<td style="witdh: 25;"><span uk-icon="'+icon+'"></span></td>\
	<td>'+name+'</td>\
	<td><form action="/download" method="POST"><button type="submit" name="file" value="'+link+'"class="uk-button uk-button-primary uk-align-right" style="margin: 0;">Download <span uk-icon="download"></button></form></td>\
	</tr>';
}

var upload = multer({ storage: storage })

/* GET home page. */
router.get('/', function(req, res, next) {
	var list = files.filter( onlyUnique );
	var code;
	if( list.length > 0 ) {
		var rows = list.map( function(value) {
			var name, icon;
			if ( value.lastIndexOf('/')+1 === value.length ) {
				name = value.substring(value.lastIndexOf('/', value.lastIndexOf('/') - 1 ) + 1, value.length - 1);
				icon = 'folder';
			}
			else {
				name = value.substring(value.lastIndexOf('/') + 1);
				var ext = value.substring(value.indexOf('.') + 1) == value ? 'null' : value.substring(value.indexOf('.') + 1);
				icon = 'file';
				if( ext.match('jpg|jpeg|png|dng|bmp|tiff') ) icon = 'image' ;
				if( ext.match('mp3|ogg|avi|mp4|flac') ) icon = 'play' ;
				if( ext.match('txt|doc|docx') ) icon = 'file-text' ;
				if( ext.match('pdf') ) icon = 'file-pdf' ;
			}
			return formRow(icon, name, value);
		});
		code = '<table class="uk-table uk-table-divider">\
		<tr><td></td><td></td><td>\
		<form action="/download" method="GET"><button type="submit" class="uk-button uk-button-primary uk-align-right" style="margin: 0;">Download All <span uk-icon="download"></button></form>\
		</td></tr>';
		rows.forEach(function(value){
			code += "\n" + value;
		});
		code += '</table>'
	}
	else {
		code = '<table class="uk-table uk-table-divider">\
		<tr><td>\
		No files selected to share\
		</td></tr>\
		</table>';
	}
	res.render('index', { code: code });
});

/* POST home page. */
router.post('/', upload.array('files[]'), (req, res) => {
	const files = req.files
	if (!files) {
		const error = new Error('Please choose files')
		error.httpStatusCode = 400
		return next(error)
	}
	res.send(files)
});

/* Download single file */
router.post('/download', (req, res) => {
	var value = req.body.file;
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
		}
	});
	res.zip({
		'files': filesJSON,
		'filename': 'allFiles.zip'
	});
});

module.exports = router;
