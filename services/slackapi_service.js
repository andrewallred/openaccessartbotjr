// mini service to delete ephemeral slack messages using the response_url provided in the response
// this was needed as the botkit implementation cannot handle this scenario

module.exports = { deleteEphemeralMessage, respondPubliclyToEphemeralMessage }

const axios = require('axios').default;

const winston = require('winston');

async function deleteEphemeralMessage(response_url) {

    const results = axios.post(response_url, {
        "delete_original": "true"
    });

}

async function respondPubliclyToEphemeralMessage(response_url, text, blocks) {

    // debug logging statement, commented out in production
    // winston.debug(JSON.stringify(blocks));

    const results = axios.post(response_url, {
        "delete_original": "true",
        "text": text,
        "replace_original": false,
        "response_type": "in_channel"
    }).catch(function (error) {
        if (error.response) {
          // Request made and server responded
          winston.error(error.response.data);
          winston.error(error.response.status);
          winston.error(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          winston.error(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          winston.error('Error', error.message);
        }
    
      });

}