var router = require('express').Router();
var storage = require('../middleware/storage');
var path = require('path');

/* Download single file */
router.post('/', (req, res, next) => {
	var pathArray = storage.getPaths();
	if( req.body.file >= 0 && req.body.file < pathArray.length ) {
		var filePath = pathArray[req.body.file];
		if ( storage.isFolder(req.body.file) ) {
			var name = path.basename(filePath);
			var namezip = name + '.zip';
			res.zip({
				'files':[
					{ 'path': filePath, 'name': name }
				],
				'filename' : namezip
			});
		}
		else {
			res.download(filePath);
		}
	}
	else if( pathArray.length === 0 ) {
		const error = new Error('There are no files for download!');
		error.status = 403;
		return next(error);
	}
	else {
		const error = new Error('Wrong data supplied!');
		error.status = 400;
		return next(error);
	}
});

/* Download all files */
router.get('/', (req, res, next) => {
	var pathArray = storage.getPaths();
	if( pathArray.length > 0 ) {
		var filesJSON = pathArray.map( function(value) {
			var name = path.basename(value);
			return { 
				'path': value,
				'name': name,
			};
		});
		res.zip({
			'files': filesJSON,
			'filename': 'allFiles.zip'
		});
	}
	else {
		const error = new Error('There are no files for download!');
		error.status = 403;
		return next(error);
	}
});

module.exports = router;
