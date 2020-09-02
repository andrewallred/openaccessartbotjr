// mini service to delete ephemeral slack messages using the response_url provided in the response
// this was needed as the botkit implementation cannot handle this scenario

module.exports = { deleteEphemeralMessage, respondWithTextPubliclyToEphemeralMessage, respondWithBlocksPubliclyToEphemeralMessage }

const axios = require('axios').default;

async function deleteEphemeralMessage(response_url) {

    const results = axios.post(response_url, {
        "delete_original": "true"
    });

}

async function respondWithTextPubliclyToEphemeralMessage(response_url, text) {

    const results = axios.post(response_url, {
        "delete_original": "true",
        "text": text,
        "replace_original": false,
        "response_type": "in_channel"
    });

}

async function respondWithBlocksPubliclyToEphemeralMessage(response_url, blocks) {

    const results = axios.post(response_url, {
        "delete_original": "true",
        "blocks": blocks,
        "replace_original": false,
        "response_type": "in_channel"
    });
