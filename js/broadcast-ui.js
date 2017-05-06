var isBroadcaster = false;
var config = {
    openSocket: function (config) {

        var channel = config.channel || location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');
        console.log(channel);
        var socket = new Firebase('https://webrtc.firebaseIO.com/' + channel);
        socket.channel = channel;
        socket.on('child_added', function (data) {
            config.onmessage(data.val());
        });
        socket.send = function (data) {
            this.push(data);
        };
        config.onopen && setTimeout(config.onopen, 1);
        socket.onDisconnect().remove();
        return socket;
    },
    onRemoteStream: function (media) {
        if (!isBroadcaster) {
            console.log(media);
            var video = media.video;
            video.setAttribute('controls', true);

            participants.insertBefore(video, participants.firstChild);

            video.play();
        }
    },
    onRoomFound: function (room) {
        console.log('BROADCASTER');


        var alreadyExist = document.getElementById(room.broadcaster);
        if (alreadyExist) return;


        if (typeof roomsList === 'undefined') roomsList = document.body;

        var div = document.createElement('div');
        div.setAttribute('id', room.broadcaster);
        div.innerHTML = '<span class="roomName">' + room.roomName + '</span>' +
            '<button class="join btn waves-effect" id="' + room.roomToken + '">Watch</button>';
        roomsList.insertBefore(div, roomsList.firstChild);

        div.onclick = function () {
            div = this;
            captureUserMedia(false, function () {
                broadcastUI.joinRoom({
                    roomToken: div.querySelector('.join').id,
                    joinUser: div.id
                });
            });
            handleComments(room.roomToken);
        };
    }
};

function createButtonClickHandler() {
    captureUserMedia(true, function () {
        isBroadcaster = true;
        broadcastUI.createRoom({
            roomName: (document.getElementById('conference-name') || {}).value || 'Anonymous'
        }, function (roomId) {
            console.log('call me once');
            showComments(roomId);
        });
    });
}

function captureUserMedia(isBroadcaster, callback) {
    if (isBroadcaster) {
        var video = document.createElement('video');
        video.setAttribute('autoplay', true);
        video.setAttribute('controls', true);
        participants.insertBefore(video, participants.firstChild);
        getUserMedia({
            video: video,
            onsuccess: function (stream) {
                config.attachStream = stream;
                callback && callback();

                video.setAttribute('muted', true);
            },
            onerror: function () {
                alert('unable to get access to your webcam.');
                callback && callback();
            }
        });
    }

    else {
        callback();
    }
}

/* on page load: get public rooms */
var broadcastUI = broadcast(config);

/* UI specific */
var participants = document.getElementById("participants") || document.body;
var startConferencing = document.getElementById('start-conferencing');
var roomsList = document.getElementById('rooms-list');

if (startConferencing) startConferencing.onclick = createButtonClickHandler;

function showComments(roomId) {
    console.log('show comments');
    console.log(roomId);
    // HIDE THE ROOMS
    $('.visible').hide();
    $('#comments').show();
    handleComments(roomId)
}

var vueComm = new Vue({
    el: '#comments',
    data: {
        comments: []
    }
});


function handleComments(roomId) {
    ROOMID = roomId;
    setInterval(function () {
        axios.get(commentsDomain + '/comments?roomId=' + roomId)
            .then(function (res) {
                console.log(res.data);
                vueComm.comments = res.data;
            })
    }, 1000);
}