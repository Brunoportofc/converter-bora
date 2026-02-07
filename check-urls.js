const https = require('https');

const urls = [
    "https://raw.githubusercontent.com/sina-masnadi/lambda-ghostscript/master/bin/gs",
    "https://raw.githubusercontent.com/serverless-pub/ghostscript-lambda-layer/master/bin/gs",
    "https://github.com/shelfio/ghostscript-lambda-layer/raw/master/bin/gs", // Likely 404
    "https://github.com/shelfio/ghostscript-lambda-layer/raw/master/layer.zip",
    "https://github.com/sina-masnadi/lambda-ghostscript/raw/master/bin/gs"
];

const checkUrl = (url) => {
    return new Promise((resolve) => {
        const req = https.request(url, { method: 'HEAD' }, (res) => {
            console.log(`${res.statusCode} - ${url}`);
            if (res.statusCode === 302 || res.statusCode === 301) {
                console.log(`  -> Redirect to: ${res.headers.location}`);
                // Recursive check? Maybe just logging is enough to know it exists.
                checkUrl(res.headers.location).then(resolve);
            } else {
                resolve();
            }
        });
        req.on('error', (e) => {
            console.log(`ERROR - ${url}: ${e.message}`);
            resolve();
        });
        req.end();
    });
};

(async () => {
    for (const url of urls) {
        await checkUrl(url);
    }
})();
