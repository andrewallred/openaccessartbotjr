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

    const results = axios.post(response_url, {
        "delete_original": "true",
        "text": text,
        "blocks": blocks,
        "replace_original": false,
        "response_type": "in_channel"
    });

}