// not totally clean implementation of service calls for the collection api

module.exports = { getObjectForSearchTerm, getObjectById }

const DbService = require('../services/db_service.js');

const axios = require('axios').default;

const baseSearchUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/search?q=';
const baseObjectUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/';
const noResultsUrl = 'https://images.metmuseum.org/CRDImages/dp/web-large/DP815335.jpg';
const filter = "";

async function getObjectForSearchTerm(searchTerm) {

    let getTopResult = searchTerm.includes("#top ");

    if (getTopResult) {
        searchTerm = searchTerm.replace("#top ", "");
    }

    let slangTerms = await DbService.getTermsForSlang(searchTerm);
    console.log(slangTerms);
    if (slangTerms && slangTerms.length > 0) {
        searchTerm = slangTerms[Math.floor(Math.random() * slangTerms.length)];
        searchTerm = "\"" + searchTerm + "\"";
    }
    else {
        searchTerm = encodeURIComponent(searchTerm);
    }

    console.log("encoded searchTerm is ");
    console.log(searchTerm);

    // need to replace the annoying curly quotes post-encoding
    // if someone else wants to do this in a non-terrible way please do
    searchTerm = searchTerm.replace("%E2%80%9C", "\"");
    searchTerm = searchTerm.replace("%E2%80%9D", "\"");

    const searchUrl = baseSearchUrl + searchTerm + filter;
    
    const results = await axios.get(searchUrl);
    const data = results.data;
    
    if (data == null || data.total == 0) {            
        return null;
    }

    console.log('selecting an object for searchTerm: ' + searchTerm);
    console.log('number of results ' + data.total);

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
    
    let searchResults = {
        SelectedObjectId: data.objectIDs[objectIndex],
        ResultsCount: data.total
    };

    console.log('selected an object: ');
    console.log(searchResults);

    return Promise.resolve(searchResults);

}

async function getObjectById(objectId) {

    const objectUrl = baseObjectUrl + objectId;

    console.log('getting object by id: ' + objectId);

    return axios.get(objectUrl).then(results => Promise.resolve(results.data));

}