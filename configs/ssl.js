var fs = require('fs');

module.exports = {
    //HTTPS certificate
    key: fs.readFileSync('./keys/server.key'),
    cert: fs.readFileSync('./keys/server.crt')
};