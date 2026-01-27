const https = require ('node:https');


https.createServer((req, res) => {
    res.writehead(200),
    res.end('hello bitch');
}).listen(3000);

