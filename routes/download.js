var router = require('express').Router();
var storage = require('../middleware/storage');

// Get the name of the file/folder from the path
function nameOf(path) {
	return (path.lastIndexOf('/')+1 === path.length) ? path.substring(path.lastIndexOf('/', path.lastIndexOf('/') - 1 ) + 1, path.length - 1) : name = path.substring(path.lastIndexOf('/') + 1);
}

/* Download single file */
router.post('/', (req, res) => {
	var path = storage.getPaths()[req.body.file];
	if ( path.lastIndexOf('/')+1 === path.length ) {
		var name = nameOf(path);
		var namezip = name + '.zip';
		res.zip({
			'files':[
				{ 'path': path, 'name': name }
			],
			'filename' : namezip
		});
	}
	else {
		res.download(path);
	}
});

/* Download all files */
router.get('/', (req, res) => {
	var filesJSON = storage.getPaths().map( function(value) {
		var name = nameOf(value);
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
