'use strict';

$(function () {
    var chat = (function () {
        // Initialise our connection to the WebSocket.
        var socket = io();

        //Local video
        var $video = $('#ha-video');
        //Remote video
        var $remoteVideo = $('#ha-remote-video');
        //Chat
        var $chat = $('#ha-chat');
        var $inputMessage = $('#ha-inputMessage');
        var $btnSendMessage = $('#ha-sendMessage');
        var messageTemplate = '<div class="ha-message {{ha-class}}"><img src="/images/avatar.png" alt="avatar"><label><em>{{whoami}}:</em> {{message}}</label></div>';
        var $messagesContainer = $('#ha-messagesContainer');

        //Buttons
        var $btnCall = $('#ha-btnCall');
        var $btnStop = $('#ha-btnStop');
        var $btnFullScreen = $('#ha-btnFullScreen');
        var $btnChat = $('#ha-btnChat');
        var $btnMute = $('#ha-btnMute');
        var $btnChangeCamere = $('#ha-btnChangeCamera');

        //Room name
        var $roomName = $('#ha-roomName');

        //Spinner
        var $spinner = $('#ha-spinner');

        //Stream initiated by the caller
        var localStream = undefined;
        var remoteStream = undefined;

        //Name of the room
        var roomName = undefined;

        //This peer
        var peer = undefined;

        //Set up when the first client joing the room
        var caller = false;

        //Set up when the room reaches 2 clients
        var channelReady = false;

        //Select camera
        var selectCamera = document.getElementById('selectCamera');

        //Detect audio video hardware
        navigator.mediaDevices.enumerateDevices().then(function(devices) {
            devices.forEach(function(device) {
                if(device.kind === 'videoinput') {
                    var option = document.createElement("option");
                    option.text = device.label;
                    option.value = device.deviceId;
                    selectCamera.add(option);
                }
            });
        }).catch(function(error) {
            console.error(error.name + ": " + error.message);
        });


        //Request local media stream, audio and video
        var requestMediaStream = function () {
            if (window.stream) {
                window.stream.getTracks().forEach(function(track) {
                    track.stop();
                });
            }

            navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                }).then(function (stream) {
                    window.stream = stream;
                    localStream = stream;
                    $video.prop('src', window.URL.createObjectURL(stream));
                    createPeer();
                }).catch(function (e) {
                    alert('getUserMedia() error: ' + e.name);
                });
        };


        //Change camera
        selectCamera.onchange = function() {
            if (window.stream) {
                window.stream.getTracks().forEach(function(track) {
                    track.stop();
                });
            }

            var videoSource = selectCamera.value;

            navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
                }).then(function (stream) {
                    window.stream = stream;
                    localStream = stream;
                    $video.prop('src', window.URL.createObjectURL(stream));
                    peer.addStream(localStream);
                    startCall();
                }).catch(function (e) {
                    alert('getUserMedia() error: ' + e.name);
                });
        };


        //All click handlers
        var addClickHandlers = function () {

            //Change camera button
            $btnChangeCamere.click(function (event){
                if (selectCamera.selectedIndex === 0){
                    selectCamera.selectedIndex = 1;
                } else {
                    selectCamera.selectedIndex = 0;
                }
                var ev = new Event('change');
                selectCamera.dispatchEvent(ev);
            });

            //Start a call between 2 peers
            $btnCall.click(function (event) {
                event.preventDefault();
                event.stopPropagation();

                startCall();
            });


            //Stop the call
            $btnStop.click(function (event) {
                event.preventDefault();
                event.stopPropagation();

                stopCall();
            });


            //Switch full screen
            $btnFullScreen.click(function () {
                if ((document.fullScreenElement && document.fullScreenElement !== null) ||
                    (!document.mozFullScreen && !document.webkitIsFullScreen)) {
                    if (document.documentElement.requestFullScreen) {
                        document.documentElement.requestFullScreen();
                    } else if (document.documentElement.mozRequestFullScreen) {
                        document.documentElement.mozRequestFullScreen();
                    } else if (document.documentElement.webkitRequestFullScreen) {
                        document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                    }
                } else {
                    if (document.cancelFullScreen) {
                        document.cancelFullScreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.webkitCancelFullScreen) {
                        document.webkitCancelFullScreen();
                    }
                }
            });


            //Open the chat
            $btnChat.click(function () {
                $chat.toggle();
                $inputMessage.focus();
            });


            //Send a chat message
            $btnSendMessage.click(function () {
                event.preventDefault();
                event.stopPropagation();

                //Replacing template with the real message
                var message = messageTemplate.replace('{{message}}', $inputMessage.val());

                if (caller) {
                    message = message.replace('{{ha-class}}', 'ha-caller');
                    message = message.replace('{{whoami}}', 'Caller');
                }
                else {
                    message = message.replace('{{ha-class}}', 'ha-callee');
                    message = message.replace('{{whoami}}', 'Callee');
                }

                insertMessage(message);

                //Wipe out the inputbox
                $inputMessage.val('');

                //Send it to the others connected clients
                sendMessage({type: 'chat', message: message});

            });

            $btnMute.click(function () {
                event.preventDefault();
                event.stopPropagation();

                //Emit mic-disconnect and deactivate audio
                socket.emit('mic-disconnect');

                var $span = $btnMute.children('span');

                if ($span.hasClass('glyphicon-volume-up')) {
                    $span.removeClass('glyphicon-volume-up');
                    $span.addClass('glyphicon-volume-off');
                }
                else {
                    $span.removeClass('glyphicon-volume-off');
                    $span.addClass('glyphicon-volume-up');
                }
            });
        };


        //Generic function to send a message server-side
        var sendMessage = function (message) {
            socket.emit('message', message);
        };


        //Start a call
        var startCall = function () {
            if (channelReady) {
                socket.emit('start-call');
                createOffer();
            }
        };


        //Stop a call
        var stopCall = function () {
            socket.emit('stop-call');
        };


        //Create a peer and add local stream
        var createPeer = function (iceServers) {
            if (!iceServers) {
                peer = new RTCPeerConnection(null);
            } else {
                peer = new RTCPeerConnection({
                    iceServers: [{
                        'url': 'stun:stun.l.google.com:19302'
                    }]
                });
            }

            peer.addStream(localStream);
            // Set up callbacks for the connection generating iceCandidates or
            // receiving the remote media stream.
            peer.onicecandidate = function (event) {
                console.log('icecandidate event:', event);
                if (event.candidate) {
                    sendMessage({
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    });
                } else {
                    console.log('End of candidates.');
                }

            };

            peer.onaddstream = function (event) {
                $remoteVideo.prop('src', window.URL.createObjectURL(event.stream));
                $remoteVideo.show();
                /*
                if (caller) {
                    $remoteVideo.hide();
                }
                */

                remoteStream = event.stream;
            };
        };


        // Create an offer that contains the media capabilities of the browser.
        var createOffer = function () {
            peer.createOffer(function (offer) {
                    // If the offer is created successfully, set it as the local description
                    // and send it over the socket connection to initiate the peerConnection
                    // on the other side.
                    peer.setLocalDescription(offer);
                    sendMessage(peer.localDescription);
                },
                function (err) {
                    // Handle a failed offer creation.
                    console.error(err);
                }
            );
        };

        var insertMessage = function (message) {

            var m = $.type(message) === 'string' ? message : message.message;

            //If there are messages
            if ($messagesContainer.find('.ha-message').length > 0) {
                //Appending new message as last-child
                $(m).insertAfter($messagesContainer.find('.ha-message:last-child'));
            }
            //If there are no messages (chat is empty)
            else {
                //Appending new message as first-child
                $messagesContainer.prepend(m);
            }

            $messagesContainer.scrollTop($messagesContainer.prop('scrollHeight'));

            $chat.show();
            $inputMessage.focus();
        };

        //Handling all kinds of messages
        var gotMessage = function (message) {
            if (message.type === 'offer') {
                console.log('Got offer message.');

                peer.setRemoteDescription(new RTCSessionDescription(message));

                peer.createAnswer(function (answer) {
                    peer.setLocalDescription(answer, function () {
                        console.log('Created answer: ', answer);
                        sendMessage(peer.localDescription);
                    }, function (error) {
                        console.error('sending local description error: ' + error);
                    });
                }, function (error) {
                    console.error('create answer error: ' + error);
                });

            } else if (message.type === 'answer') {
                console.log('Got answer message.');
                peer.setRemoteDescription(new RTCSessionDescription(message));

            } else if (message.type === 'candidate') {
                console.log('Got canditate message.');
                peer.addIceCandidate(new RTCIceCandidate({
                    candidate: message.candidate
                }));

            } else if (message.type === 'chat') {
                insertMessage(message);
            } else if (message === 'bye') {
                // TODO: cleanup RTC connection?
            }
        };

        var join = function () {
            roomName = $roomName.val();
            if (roomName != '') {
                socket.emit('join', roomName);
                $spinner.show();
            }
        };

        //The only public API
        var init = function () {
            addClickHandlers();
            requestMediaStream();
            join();
        };


        // Socket IO Events server-side logged on client-side
        socket.on('log', function (array) {
            array.forEach(function (elem) {
                console.log(elem);
            });
        });

        //Someone joined a room and will be the callee
        socket.on('joined', function (numClients) {
            caller = numClients === 0 ? true : false;
        });

        //When room has 2 clients, channel is ready and a call may begin
        socket.on('channel-ready', function () {
            channelReady = true;
            //createPeer();

            if (caller) {
                $btnCall.show();
            }

            $btnChat.show();
            $spinner.hide();
        });

        //Handling all kinds of messages
        socket.on('message', gotMessage);


        //All clients connected to the same room will hide their spinner
        socket.on('start-call', function () {
            $spinner.hide();
            $btnStop.show();
            $btnMute.show();
            $btnCall.hide();
            if(selectCamera.options.length > 1){
                $btnChangeCamere.show();
            }
            $video.addClass('ha-video-small');$video.addClass('ha-video-small');
        });

        //Stop a call
        socket.on('stop-call', function () {
            $btnStop.hide();
            $btnMute.hide();

            if (caller) {
                $btnCall.show();
            }
            //TODO: To implement STOP_CALL
        });

        socket.on('mic-disconnect', function () {
            $remoteVideo.prop('muted', !$remoteVideo.prop('muted'));
        });

        //Stop a call
        socket.on('full', function () {
            alert('Sorry, room is full!');
            window.close();
        });

        //Public API
        return {
            init: init
        };

    })();

    chat.init();
});