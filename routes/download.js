var router = require('express').Router();
var storage = require('../middleware/storage');

/* Download single file */
router.post('/', (req, res) => {
	var value = storage.getPaths()[req.body.file];
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
router.get('/', (req, res) => {
	var filesJSON = storage.getPaths().map( function(value) {
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
