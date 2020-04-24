var router = require('express').Router();
var multer = require('multer');
var storage = require('../middleware/storage');


/* GET home page. */
router.get('/', function(req, res) {
	var rows = storage.getRows();
	if(rows.length > 0) res.render('index', { lines : rows });
	else res.render('index', { lines : undefined });
});

/* POST home page. */
router.post('/', storage.saveFiles , (req, res, next) => {
	var files = req.files;
	if (!files) {
		const error = new Error('Please choose files');
		error.status = 400;
		return next(error);
	}
	storage.updateRows(files);
	res.send(files);
});

module.exports = async function(cli) {
	
	await storage.init(cli);
	return router;

};
