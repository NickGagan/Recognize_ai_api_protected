const sw = require('remove-stopwords');
const request = require("request");

const mlHost = (process.env.API_ENV === "dev") ? "http://127.0.0.1:5000" : "https://recognize-ai-ml-api.herokuapp.com";
module.exports = {
    processText: _processText,
    hasMentalHealthIssue: _hasMentalHealthIssue,
    runModel: _runModel
};

// Preprocess text
function _processText(placeholder_text) {
    processedText = placeholder_text.toLowerCase();
    // Remove unicode characters
    processedText = processedText.replace(/[^\x20-\x7E]/g, '');

    // Remove urls
    processedText = processedText.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');

    // Remove multi-character symbols
    processedText = processedText.replace(/[\n\r\t]/g, " ");

    // Remove numeric values
    processedText = processedText.replace(/[0-9]/g, '');
    
    // Reduce repeated letters
    processedText = processedText.replace( /(.)\1{2,}/g, '$1$1');
    // Remove Stop words
    processedText = sw.removeStopwords(processedText.split(' '));
    processedText = processedText.join(" ");

    // Remove punctuation
   processedText = processedText.replace(/[^\w\s]|_/g, " "); 

    // Remove extra blank spaces
    processedText = processedText.replace(/\s+/g, ' ').trim();

    // Remove stop words again
    processedText = sw.removeStopwords(processedText.split(' '));
    
    return(processedText.join(" "));
}

// Run the model
function _runModel(options, callback) {
    const modelOptions = {
        url: `${mlHost}?type=${options.type}`,
        headers: {
            "Content-Type": "application/json"
        },
        body: options.data,
        json: true
    };

    request.post(modelOptions, function(err, response) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, response.body);
    });
}
function _hasMentalHealthIssue(data) {
    return data.poor_mental_health;
}
