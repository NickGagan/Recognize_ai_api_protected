const redditUtil = require("../utils/redditUtil");
const textUtil = require("../utils/textUtil");

module.exports = {
    getMentalHealthState: _getMentalHealthState,
    getMentalHealthStateFromBody: _getMentalHealthStateFromBody
};

function _getMentalHealthState(req, res) {
    // contact njgagan@gmail.com for credentials
    const analyzeRedditOptions = {
        id: req.query.id,
        username: "<username>",
        password: "<password>",
        clientId: "<client_id>",
        clientSecret: "<client_secret>",
        messageFlag: req.query.messageFlag,
        message: req.body.message,
        messageSubject: req.body.messageSubject
    };
    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).end('Missing Authorization Header');
    }

    // verify auth credentials
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    if (username !== "admin" && password !== "admin") {
        return res.status(401).end('Invalid Authentication Credentials');
    }
    redditUtil.redditAnalyze(analyzeRedditOptions, function(err, response){
        if (err) {
            res.status(err.statusCode).send({
                message: err.message,
                statusCode: err.statusCode
            });
            return;
        }
        res.status(200).json(response);
    });
}

function _getMentalHealthStateFromBody(req, res) {
    const analyzeTextOptions = {
        text: req.body.text
    };
    textUtil.textAnalyze(analyzeTextOptions, function(err, response){
        if (err) {
            res.status(500).end(err.message);
            return;
        }
        res.status(200).json(response);
    });
}
