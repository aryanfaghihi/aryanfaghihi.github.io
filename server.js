var express = require('express'),
    app = express();
var bodyParser = require('body-parser');

var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

app.use(bodyParser.json());
app.use(allowCrossDomain);

var comments = {};

app.get('/comments', function (req, res) {
    console.log(comments);
    var roomId = req.query.roomId;
    if (comments[roomId]) {
        res.send(comments[roomId]);
    }
    else {
        res.send([]);
    }
});

app.post('/comments', function (req, res) {
    var roomId = req.query.roomId;
    console.log(req.body);
    if (comments[roomId]) {
        if (req.body.type === 'comment' && comments[roomId]['comments'] && comments[roomId]['comments'].length > 0) {
            comments[roomId]['comments'].push(req.body);
        }
        else if (!comments[roomId]['comments']) {
            comments[roomId]['comments'] = [req.body];
        }
        else if (req.body.type === 'bid' && comments[roomId]['bids'] && comments[roomId]['bids'].length > 0) {
            comments[roomId]['bids'].push(req.body);
        }
        else {
            comments[roomId]['bids'] = [req.body];
        }
    }
    else {
        if (req.body.type === 'bid') {
            comments[roomId] = {
                bids: [req.body]
            }
        }
        else {
            comments[roomId] = {
                comments: [req.body]
            }
        }
    }
    res.sendStatus(200);
});

app.listen(3000, function () {
    console.log('stated listening on 3000');
});