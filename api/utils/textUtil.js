const mlUtil = require("./mlUtil.js");
module.exports = {
    textAnalyze: _textAnalyze
};
function _textAnalyze(options, callback) {
    if (!options.text) {
        const error = {
            message: "Missing text when running textUtil._textAnalyze",
            status_code: 404
        }
        callback(error);
        return;
    }
    const modelOptions = {
        type: "text",
        data: {
            clean_text: mlUtil.processText(options.text)
        }
    }
    mlUtil.runModel(modelOptions, function(modelErr, modelResponse){
        if (modelErr) {
            const error = {
                statusCode: 500,
                message: "Error running the model"
            }
            callback(error);
            return;
        }
        callback(null, modelResponse);
    });
}


