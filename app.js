var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var zip = require('express-easy-zip');

var downloadRouter = require('./routes/download');

var app;

app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

if (process.env.NODE_ENV === 'development') {
	app.use(logger('dev'));
}

app.use(zip());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/download', downloadRouter);

module.exports = async function(cli){

	var indexRouter = await require('./routes/index')(cli);
	
	app.use('/', indexRouter);
	
	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		next(createError(404));
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
