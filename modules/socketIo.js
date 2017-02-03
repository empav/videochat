var mailer = require('../controllers/mail');
var mailConfig = require('../configs/mail');

function socketIo(io, logger){
    var numClients;
    var mRoomName;
    io.on('connection', function (socket) {

        // convenience function to log server messages on the client
        function log() {
            var array = ['Message from Server:'];
            array.push.apply(array, arguments);
            socket.emit('log', array);
        }

        // When a client tries to join a room, only allow them if they are first or
        // second in the room. Otherwise it is full.
        socket.on('join', function (roomName) {
            mRoomName = roomName;
            logger.debug('Request to join room: ' + roomName);
            log('Request to join room: ' + roomName);

            var room = io.sockets.adapter.rooms[roomName];
            numClients = (room) ? room.length : 0;

            logger.debug('Room: ' + roomName + 'now has: ' + (numClients + 1) + ' clients');
            log('Room: ' + roomName + 'now has: ' + (numClients + 1) + ' clients');

            if (numClients === 0) {
                logger.debug('Client ID: ' + socket.id + ' created a room with name: ' + roomName);
                log('Client ID: ' + socket.id + ' created a room with name: ' + roomName);
                socket.join(roomName);
                socket.emit('joined', numClients);
                mailConfig.to = mailConfig.email;
                mailConfig.subject = 'Create new communication';
                mailConfig.text = mailConfig.url + '/chat/' + mRoomName;
                mailer.send(mailConfig);
            } else if (numClients === 1) {
                logger.debug('Client ID: ' + socket.id + ' joined a room with name: ' + roomName);
                log('Client ID: ' + socket.id + ' joined a room with name: ' + roomName);
                socket.join(roomName);
                // When the client is second to join the room, both clients are ready.
                socket.emit('joined', numClients);
                io.sockets.in(roomName).emit('channel-ready', roomName);
            } else {
                socket.emit('full');
            }
        });

        socket.on('message', function (message) {
            logger.debug('Client said: ', message);
            log('Client said: ', message);

            // for a real app, would be room-only (not broadcast)
            socket.broadcast.emit('message', message);
        });

        socket.on('start-call', function () {
            logger.debug('Client said: start-call');
            log('Client said: start-call');

            socket.emit('start-call');
            socket.broadcast.emit('start-call');
        });

        socket.on('stop-call', function () {
            logger.debug('Client said: stop-call');
            log('Caller said: stop-call');

            socket.emit('stop-call');
            socket.broadcast.emit('stop-call');
        });

        socket.on('disconnect', function () {
            numClients--;
            logger.debug('Client disconnected');
        });

        socket.on('mic-disconnect', function () {
            socket.broadcast.emit('mic-disconnect');
        });

    });
}

module.exports = socketIo;