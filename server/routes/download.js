const router = require('express').Router();
const storage = require('../middleware/storage');
const path = require('path');

/* Send a JSON array containing file details in a list */
router.get('/list', (req, res, next) => {
	res.json(storage.rawFiles());
});

/* Download single file */
router.get('/single', (req, res, next) => {
	const index = parseInt(req.query.index, 10);
	const pathArray = storage.getPaths();
	if( pathArray[index] ) {
		const filePath = pathArray[index];
		if ( storage.isFolder(index) ) {
			const name = path.basename(filePath);
			const namezip = name + '.zip';
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
router.get('/all', (req, res, next) => {
	const pathArray = storage.getPaths();
	if( pathArray.length > 0 ) {
		const filesJSON = pathArray.map( function(value) {
			const name = path.basename(value);
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
