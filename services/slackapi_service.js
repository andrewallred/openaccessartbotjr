// mini service to delete ephemeral slack messages using the response_url provided in the response
// this was needed as the botkit implementation cannot handle this scenario

module.exports = { deleteEphemeralMessage, respondPubliclyToEphemeralMessage }

const axios = require('axios').default;

async function deleteEphemeralMessage(response_url) {

    const results = axios.post(response_url, {
        "delete_original": "true"
    });

}

async function respondPubliclyToEphemeralMessage(response_url, text, blocks) {

    console.log(JSON.stringify(blocks));

    const results = axios.post(response_url, {
        "delete_original": "true",
        "text": text,
        "replace_original": false,
        "response_type": "in_channel"
    }).catch(function (error) {
        if (error.response) {
          // Request made and server responded
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
        }
    
      });

}