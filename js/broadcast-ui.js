var isBroadcaster = false;
var lastName;
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

        var found = false;
        var currentName = room.roomName;
        if (currentName !== 'Hunk') {
            vueStreams.streams.forEach(function (stream) {
                if (stream.name === room.roomName) found = true;
            });
            if (!found && lastName !== currentName) {
                setnewImageSrc(room.roomName, function (img) {
                    vueStreams.streams.push({
                            name: room.roomName,
                            token: room.roomToken,
                            broadcaster: room.broadcaster,
                            img: img
                        }
                    );
                });
                lastName = currentName;

            }
        }

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
    vueStreams.hideStreams = true;
    vueComments.showComments = true;
    handleComments(roomId)
}

var vueComments = new Vue({
    el: '#comments',
    data: {
        comments: [],
        streams: [],
        currentBid: 10,
        showComments: false
    },
    methods: {
        bid: function () {
            this.currentBid = this.currentBid + 10;
            axios.post(commentsDomain + '/comments?roomId=' + ROOMID, {
                type: 'bid',
                bid: this.currentBid,
                date: new Date
            })
                .then(function (response) {
                    console.log(response.data);
                })
        }
    }
});

var vueStreams = new Vue({
    el: '#streams',
    data: {
        streams: [],
        hideStreams: false
    },
    methods: {
        watchStream: function (data) {
            captureUserMedia(false, function () {
                broadcastUI.joinRoom({
                    roomToken: data.token,
                    joinUser: data.broadcaster
                });
            });
            handleComments(data.token);
        }
    }

});


function handleComments(roomId) {
    ROOMID = roomId;
    vueComments.showComments = true;
    vueStreams.hideStreams = true;
    setInterval(function () {
        axios.get(commentsDomain + '/comments?roomId=' + roomId)
            .then(function (res) {
                console.log(res.data);
                vueComments.comments = res.data;
                if (res.data.bids) {
                    vueComments.currentBid = res.data.bids[res.data.bids.length - 1].bid;
                }
            })
    }, 1000);
}

function setnewImageSrc(productName, callback) {
    console.log(productName);
    var params = {
        "q": productName
    };

    $.ajax({
        url: "https://api.cognitive.microsoft.com/bing/v5.0/images/search?" + $.param(params),
        beforeSend: function (xhrObj) {
            // Request headers
            xhrObj.setRequestHeader("Content-Type", "multipart/form-data");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "1969f0d261b044fb8b640f1e9828cb53");
        },
        // Request body
        data: "{body}"
    })
        .done(function (data) {
            console.log(data.value[0].thumbnailUrl);
            callback(data.value[0] && data.value[0].thumbnailUrl)
        })
        .fail(function (err) {
            console.log(err);
        });
}