// mini service to delete ephemeral slack messages using the response_url provided in the response
// this was needed as the botkit implementation cannot handle this scenario

module.exports = { deleteEphemeralMessage }

const axios = require('axios').default;

async function deleteEphemeralMessage(response_url) {

    const results = await axios.post(response_url, {
        "delete_original": "true"
    });

}