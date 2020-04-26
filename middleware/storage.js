var fs = require('fs');
var rl = require('readline');
var nfu = require('nodejs-fs-utils');
var multer = require('multer');
var path = require('path');
	
var files = [];
var rows = [];
var index = 0;
var destination;
var icons = [
	['image','jpg|jpeg|png|dng|bmp|tiff'],
	['play','mp3|ogg|avi|mp4|flac'],
	['file-text','txt|doc|docx'],
	['pdf','pdf'],
	['file','']
];

// Form the row object that will be inserted into the view
function formObject(filePath) {
	return {
		'name': path.basename(filePath),
		'icon': fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory() ? 'folder' : getIcon(path.extname(filePath).substring(path.extname(filePath).indexOf('.') + 1)),
		'size': humanFileSize(nfu.fsizeSync(filePath)),
		'index': index++
	};
}
// Get the icon of the file/folder given filePath
function getIcon(ext) {
	var icon = icons.find(function(value) {
		return ext.match(value[1]);
	})[0];
	return icon;
}

/* Convert file size to human readable */
function humanFileSize(bytes) {
	var thresh = 1000;
	if(Math.abs(bytes) < thresh) {
		return bytes + ' B';
	}
	var units = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
	var u = -1;
	do {
		bytes /= thresh;
		++u;
	}while(Math.abs(bytes) >= thresh);
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

	return new Promise(function(resolve, reject) {
		
		files = cli.input;
		files = files.filter(onlyUnique);
		destination = cli.flags.destination;
		
		if(!fs.existsSync(destination)) fs.mkdirSync(destination);
		
		//Read from list of files
		if(cli.flags.list !== '') {
			var readInterface = rl.createInterface({
				input: fs.createReadStream(cli.flags.list),
				console: false
			});
			
			readInterface.on('line', function(line) {
				if( files.indexOf(line) === -1 ) {
					files.push(line);
				}
			});
			
			readInterface.on('close', function() {
				files = files.filter(onlyUnique);
				rows = files.map(formObject);
				resolve();
			});
			
		}
		
		else {
			rows = files.map(formObject);
			resolve();
		}
		
	});

};

module.exports.getRows = function() {
	return rows;
};

module.exports.getPaths = function() {
	return files;
};

module.exports.isFolder = function(index) {
	return rows[index].icon === 'folder';
};

module.exports.saveFiles = upload.array('files[]');

module.exports.updateRows = function(uploadedFiles) {
	
	uploadedFiles.forEach(function (value) {
		var filePath = value.path;
		if ( files.indexOf(filePath) === -1 ) {
			files.push(filePath);
			rows.push(formObject(filePath));
		}
	});
	
};
