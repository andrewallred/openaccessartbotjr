module.exports = { deleteEphemeralMessage }

const axios = require('axios').default;

async function deleteEphemeralMessage(response_url) {

    const results = await axios.post(response_url, {
        "delete_original": "true"
    });

}