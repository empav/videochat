#! /usr/bin/node

var express = require('express');
var app = express();

var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//HTTPS
var https = require('https');
var fs = require('fs');

//Logging
var logger = require('winston');

logger.level = 'debug';

logger.configure({
    transports: [
        new (logger.transports.File)({filename: './server.log', level: 'debug'})
    ]
});

//HTTPS certificate
var options = require('./configs/ssl');

//Config
var port = process.env.PORT || '3000';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//Using sass
app.use(require('node-sass-middleware')({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: true,
    sourceMap: true
}));

//Serving static content from public dir
app.use(express.static(path.join(__dirname, 'public')));


// Routings
app.use('/', require('./routes/index'));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

//Creating an https server
var server = https.createServer(options, app);
server.listen(port, function () {
    logger.info('Https node server is listening on port: ', port);
});

var io = require('socket.io')(server);
require('./modules/socketIo')(io, logger);