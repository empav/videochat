var express = require('express');
var router = express.Router();

var mailer = require('../controllers/mail');
var mailConfig = require('../configs/mail');
var multer = require('multer');
var upload = multer();
var utils = require('../modules/utils');

router.get('/', function (req, res, next) {
    res.render('index', {url: mailConfig.url});
});

router.get('/chat/:roomCode', function (req, res, next) {
    var roomCode = req.params.roomCode;
    if(roomCode) {
        res.render('chat', {roomCode: roomCode});
    }
});

router.get('/mailApi/:email', function (req, res, next) {
    var email = req.params.email;
    if(email) {
        mailConfig.to = email;
        mailConfig.subject = 'Create new communication';
        mailConfig.text = mailConfig.url + '/chat/' + utils.randomCode(10);
        mailer.send(mailConfig, function (error, info) {
            if (error) {
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        });
    }
});

router.post('/sendMail', upload.array(), function (req, res, next) {
    mailConfig.to = req.body.to;
    mailConfig.subject = 'Create new communication';
    mailConfig.text = mailConfig.url + '/chat/' + utils.randomCode(10);
    mailer.send(mailConfig, function (error, info) {
         if (error) {
            res.sendStatus(500);
         } else {
            res.sendStatus(200);
         }
    });
});

module.exports = router;
