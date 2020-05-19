const express = require('express');
const path = require('path');
const logger = require('morgan');
const zip = require('express-easy-zip');

const downloadRouter = require('./routes/download');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

if (process.env.NODE_ENV === 'development') {
	app.use(logger('dev'));
}

app.use(zip());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/download', downloadRouter);

module.exports = async function(cli){

	const indexRouter = await require('./routes/index')(cli);
	
	app.use('/', indexRouter);
	
	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		const error = new Error('Resource not found');
		error.status = 404;
		return next(error);
	});

	// error handler
	app.use(function(err, req, res, next) {
		// set locals, only providing error in development
		res.locals.message = err.message;
		res.locals.error = req.app.get('env') === 'development' ? err : {};

		// render the error page
		res.status(err.status);
		res.render('error');
	});
	
	return app;
	
};
