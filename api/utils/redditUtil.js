const request = require("request");
const _get =  require("lodash/get");
const mlUtil = require("./mlUtil.js");
module.exports = {
    redditAnalyze: _redditAnalyze
};

// Analyze reddit post
function _redditAnalyze(options, callback) {
    if (!options.id) {
        const error = {
            message: "Missing id when fetching Reddit post data in reddit_util._getRedditPost",
            status_code: 404
        }
        callback(error);
        return;
    }
    // Fetching the reddit post metadata
    const path = `https://api.reddit.com/api/info?id=${options.id}`;
    console.log(path);
    const getOptions = {
        url: path,
        headers: {
            "Content-Type": "text/plain",
            "User-Agent": "RecognAIze.mentalhealth"
        }
    };
    request.get(getOptions, function(err, response){
        if (err) {
            callback(err);
            return;
        }
        if (response && response.statusCode !== 200) {
            const error = {
                statusCode: response.statusCode,
                message: response.body
            }
            callback(error)
            return;
        }

        // Clean the inputs
        cleanedInputs = cleanRedditInputs(JSON.parse(response.body))
        if (!cleanedInputs) {
            const error = {
                message: "Error parsing reddit metadata. Please try again later",
                status_code: 500
            }
            callback(error);
            return;
        }
        // Return error if no text found
        if (!cleanedInputs.clean_text) {
            const error = {
                statusCode: 400,
                message: "The provided reddit URL does not exist or does not contain text."
            }
            callback(error)
            return;
        }

        // Run the model
        const modelOptions = {
            type: "reddit",
            data: {
                num_comments: cleanedInputs.num_comments,
                score: cleanedInputs.score,
                clean_text: cleanedInputs.clean_text,
                post_length: cleanedInputs.post_length,
                link_flair_text: cleanedInputs.link_flair_text
            }
        };
        
        mlUtil.runModel(modelOptions, function(modelErr, modelResponse){
            if (modelErr) {
                const error = {
                    statusCode: 500,
                    message: "Error running the model"
                }
                callback(error);
                return;
            }
            // If mental health issue found and wanting to message
            if (mlUtil.hasMentalHealthIssue(modelResponse) && options.messageFlag) {
                _getBearerToken({
                    username: options.username,
                    password: options.password,
                    clientId: options.clientId,
                    clientSecret: options.clientSecret
                }, function(tokenError, response) {
                    if (tokenError) {
                        callback(tokenError);
                        return;
                    }
                    _sendMessage({
                        receiver: cleanedInputs.author,
                        messageSubject: options.messageSubject,
                        message: options.message,
                        bearerToken: response.access_token
                    }, function(msgErr, msgResponse) {
                        if (msgErr) {
                            callback(msgErr);
                            return;
                        }
                        modelResponse.sent_message = true;
                        modelResponse.author = cleanedInputs.author;
                        callback(null, modelResponse);
                        return;
                    })
                })
            } else {
                callback(null, modelResponse);
            }
        });
    });
    
}

function cleanRedditInputs(input) {
    let fullInput = input;
    if (typeof unsanitizedInput === "string") {
        try {
            fullInput = JSON.parse(string);
        } catch {
            return null;
        }
    }
    const cleanedInputs = basicPreProcessing(fullInput);
    return cleanedInputs;
}

function basicPreProcessing(fullInput) {
    const selftext = _get(fullInput, "data.children[0].data.selftext");
    const title = _get(fullInput, "data.children[0].data.title");
    let text = "";
    if (selftext && title) {
        text = `${title} ${selftext}`;
    }
    const cleanedInputs = {
        author: _get(fullInput, "data.children[0].data.author"),
        num_comments: _get(fullInput, "data.children[0].data.num_comments", 0),
        score: _get(fullInput, "data.children[0].data.score"),
        clean_text: mlUtil.processText(text),
        post_length: text.length, // in characters
        link_flair_text:  _get(fullInput, "data.children[0].data.link_flair_text"),
    };
    return (cleanedInputs);
}
function _sendMessage(options, callback) {
    if (!options.receiver ||
        !options.message ||
        !options.bearerToken ||
        !options.messageSubject) {
            const error = {
                statusCode: 400,
                message: "Bad Request in redditUtil._sendMessage"
            };
            callback(error);
            return; 
    }
    const host = "https://oauth.reddit.com";

    const path = "/api/compose";
    const params = `?grant_type=identity&to=${encodeURIComponent(options.receiver)}&subject=${encodeURIComponent(options.messageSubject)}&text=${encodeURIComponent(options.message)}`;
    const postOptions = {
        url: host + path + params,
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "RecognAIze.mentalhealth",
            "Authorization": `Bearer ${options.bearerToken}`
        }
    };

    request.post(postOptions, function(err, response){
        if (err) {
            callback(err);
            return;
        }
        if (response && response.statusCode !== 200) {
            const error = {
                statusCode: response.statusCode,
                message: response.body
            }
            callback(error);
            return;
        }

        callback(null, response);
    });
}

// Needed to send message
function _getBearerToken(options, callback) {
    if (!options.username ||
        !options.password ||
        !options.clientId ||
        !options.clientSecret) {
            const error = {
                statusCode: 400,
                message: "Bad Request in redditUtil._getBearerToken"
            };
            callback(error);
            return;
    }
    const host = "https://www.reddit.com";

    const path = "/api/v1/access_token";
    const params = `?grant_type=password&username=${encodeURIComponent(options.username)}&password=${encodeURIComponent(options.password)}`;
    console.log(path);
    const authentication = `${options.clientId}:${options.clientSecret}`;
    const postOptions = {
        url: host + path + params,
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "RecognAIze.mentalhealth",
            "Authorization": `Basic ${Buffer.from(authentication).toString('base64')}`
        }
    };

    request.post(postOptions, function(err, response){
        if (err) {
            callback(err);
            return;
        }
        if (response && response.statusCode !== 200) {
            const error = {
                statusCode: response.statusCode,
                message: response.body
            }
            callback(error);
            return;
        }

        callback(null, JSON.parse(response.body));
    });
}

