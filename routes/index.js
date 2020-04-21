module.exports = function(cli) {
	
	var router = require('express').Router();
	var multer = require('multer');
	var middleware = require('../middleware/storage');
	
	middleware.init(cli);

	/* GET home page. */
	router.get('/', function(req, res) {
		var rows = middleware.getRows();
		if(rows.length > 0) res.render('index', { lines : rows });
		else res.render('index', { lines : undefined });
	});

	/* POST home page. */
	router.post('/', middleware.saveFiles , (req, res) => {
		var files = req.files;
		if (!files) {
			const error = new Error('Please choose files');
			error.httpStatusCode = 400;
			return next(error);
		}
		middleware.updateRows(files);
		res.send(files);
	});

	return router;
}