var nodemailer = require('nodemailer');

var mail = {
    send: function (config, done) {
        // create reusable transporter object using the default SMTP transport
        var transporter = nodemailer.createTransport(config.smtp);

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: config.from,
            to: config.to,
            subject: config.subject,
            text: config.text,
            html: config.html
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, done);
    }
};

module.exports = mail;