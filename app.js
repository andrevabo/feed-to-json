const express = require('express');
const request = require('request');
const cors = require('cors');
const FeedParser = require('feedparser');

const app = express();
app.use(cors());
module.exports.app = app;
app.set('port', (process.env.PORT || 5000));

const testing = [];
app.get('/', function (req1, res1) {
    let url = req1.query.url;
    if (!url.match("^(http|https|ftp)://.*$")) {
        let protocol = 'http://';
        if (url.indexOf('//') == 0)
            protocol = 'http:';
        url = protocol + url;
    }
    const req = request(url);
    const feedparser = new FeedParser();

    const collection = [];

    req.on('error', function (error) {
        console.error(error);
    });

    req.on('response', function (res) {
        const stream = this;

        if (res.statusCode !== 200) {
            this.emit('error', new Error('Bad status code'));
        } else {
            stream.pipe(feedparser);
        }
    });
    feedparser.on('error', function (error) {
        console.error(error);
    });

    feedparser.on('readable', function () {
        const stream = this;
        const meta = this.meta;
        let item;
        while (item = stream.read()) {
            collection.push(item);
        }
    });

    feedparser.on('end', function () {
        const stream = this;
        const meta = this.meta;
        const finalResponse = {};
        finalResponse.entries = collection;
        finalResponse.meta = meta;
        res1.send(finalResponse);
    });
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
