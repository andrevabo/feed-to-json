const express = require('express');
const request = require('request');
const cors = require('cors');
const FeedParser = require('feedparser');

const app = express();
app.use(cors());
module.exports.app = app;
app.set('port', (process.env.PORT || 5000));

app.get('/', function (appReq, appResp) {
    let url = appReq.query.url;

    if (!url) {
        appResp.status(400).send({ error: 'URL not set' });
        return;
    } else if (!url.match('^(http|https|ftp)://.*$')) {
        let protocol = 'http://';
        if (url.indexOf('//') === 0)
            protocol = 'http:';
        url = protocol + url;
    }

    const req = request(url);
    const feedparser = new FeedParser();

    const collection = [];

    req.on('error', (error) => {
        console.error(error);
        appResp.status(400).send({ error: error.message, url: url });
    });

    req.on('response', (res) => {
        if (res.statusCode !== 200) {
            req.emit('error', new Error('Bad status code'));
        } else {
            req.pipe(feedparser);
        }
    });

    feedparser.on('error', (error) => {
        console.error(error);
        appResp.status(400).send(error.message);
    });

    feedparser.on('readable', () => {
        let item;
        while (item = feedparser.read()) {
            collection.push(item);
        }
    });

    feedparser.on('end', () => {
        const meta = appReq.meta;
        appResp.send({
            entries: collection,
            meta,
        });
    });
});

app.listen(app.get('port'), () => {
    console.log('Node app is running on port', app.get('port'));
});
