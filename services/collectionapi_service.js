module.exports = { getObjectForSearchTerm, getObjectById }

const axios = require('axios').default;

const baseSearchUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/search?q=';
const baseObjectUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/';
const noResultsUrl = 'https://images.metmuseum.org/CRDImages/dp/web-large/DP815335.jpg';
const filter = " -nude -naked";

async function getObjectForSearchTerm(searchTerm, getTopResult) {

    const searchUrl = baseSearchUrl + searchTerm + filter;
    
    const results = await axios.get(searchUrl);
    const data = results.data;

    console.log('selecting an object for searchTerm: ' + searchTerm);

    // select an object
    let objectIndex = 0;
    if (!getTopResult) {
        // randomly get closer to the top of the results
        if (Math.random() * 10 < 3) {
            objectIndex = Math.floor(Math.random() * data.total);
        }
        else {
            objectIndex = Math.floor(Math.random() * data.total / 4);
        }
    }
    
    let selectedObjectId = data.objectIDs[objectIndex];

    console.log('selected an object: ' + selectedObjectId);

    return Promise.resolve(selectedObjectId);

}

async function getObjectById(objectId) {

    const objectUrl = baseObjectUrl + objectId;

    console.log('getting object by id: ' + objectId);

    return axios.get(objectUrl).then(results => Promise.resolve(results.data));

}