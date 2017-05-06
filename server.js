var express = require('express'),
    app = express();
var bodyParser = require('body-parser')

var allowCrossDomain = function(req, res, next) {
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
        comments[roomId].push(req.body);
    }
    else {
        comments[roomId] = [req.body];
    }
    res.sendStatus(200);
});

app.listen(3000, function () {
    console.log('stated listening on 3000');
});