// not totally clean implementation of service calls for the collection api

module.exports = { getObjectForSearchTerm, getObjectById }

const DbService = require('../services/db_service.js');

const axios = require('axios').default;

const winston = require('winston');

const baseSearchUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=';
const baseObjectUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/';
const noResultsUrl = 'https://images.metmuseum.org/CRDImages/dp/web-large/DP815335.jpg';
const filter = "";

async function getObjectForSearchTerm(searchTerm) {

    let startTime = new Date();

    let searchResults = await getObjectsForSearchTerm(searchTerm);

    if (searchResults == null) {
        return null;
    }

    let getTopResult = searchTerm.includes("#top ");

    if (getTopResult) {
        searchTerm = searchTerm.replace("#top ", "");
    }

    for (let i = 0; i < 10; i++) {

        // select an object
        let objectIndex = 0;
        if (!getTopResult) {
            // randomly get closer to the top of the results
            if (Math.random() * 100 < 20) {
                objectIndex = Math.floor(Math.random() * searchResults.Total);
            }
            else if (Math.random() * 100 < 3) {
                objectIndex = 0;
            }
            else {
                objectIndex = Math.floor(Math.random() * searchResults.Total / 8);
            }
        }

        let objectData = await getObjectById(searchResults.ObjectIDs[objectIndex]);
        objectData.ResultsCount = searchResults.Total;
        if (objectData && objectData.primaryImageSmall) {
            return objectData;
        }
        
    }

    let endTime = new Date();

    let timeElapsed = endTime - startTime;

    winston.info('getObjectForSearchTerm timeElapsed ' + timeElapsed);

}

async function getObjectsForSearchTerm(searchTerm) {

    let startTime = new Date();

    let unprocessedSearchTerm = searchTerm;

    let paintingsOnly = searchTerm.includes("#paintings");
    if (paintingsOnly) {
        searchTerm = searchTerm.replace(" #paintings ", "");
        searchTerm = searchTerm.replace("#paintings ", "");
        searchTerm = searchTerm.replace(" #paintings", "");
    }

    let medium;
    let hasMedium = searchTerm.includes("#medium ");
    if (hasMedium) {
        medium = searchTerm.match(new RegExp('\#medium\\s(\\w+)'))[1];
        searchTerm = searchTerm.replace(" #medium " + medium, "");
    }

    let slangTerms = await DbService.getTermsForSlang(searchTerm);
    if (slangTerms && slangTerms.length > 0) {
        searchTerm = slangTerms[Math.floor(Math.random() * slangTerms.length)];
        searchTerm = "\"" + searchTerm + "\"";
    }
    else {
        searchTerm = encodeURIComponent(searchTerm);
    }

    // need to replace the annoying curly quotes post-encoding
    // if someone else wants to do this in a non-terrible way please do
    searchTerm = searchTerm.replace("%E2%80%9C", "\"");
    searchTerm = searchTerm.replace("%E2%80%9D", "\"");

    if (hasMedium && medium) {
        searchTerm = searchTerm + "&medium=" + encodeURIComponent(medium);
    }

    if (paintingsOnly) {
        searchTerm = searchTerm + "&medium=Paintings";
    }

    const searchUrl = baseSearchUrl + searchTerm + filter;

    let axiosStartTime = new Date();
    
    const results = await axios.get(searchUrl);
    const data = results.data;

    let axiosEndTime = new Date();

    let axiosTimeElapsed = axiosEndTime - axiosStartTime;

    winston.info('axios search timeElapsed ' + axiosTimeElapsed);
    
    if (data == null || data.total == 0) {            
        return null;
    }

    let searchResults = {
        ObjectIDs: data.objectIDs,
        Total: data.total,
    };

    DbService.saveSearchResults(unprocessedSearchTerm, data.objectIDs);

    let endTime = new Date();

    let timeElapsed = endTime - startTime;

    winston.info('getObjectForSearchTerm timeElapsed ' + timeElapsed);

    return Promise.resolve(searchResults);

}

async function getObjectById(objectId) {

    let startTime = new Date();

    const objectUrl = baseObjectUrl + objectId;

    let result = await axios.get(objectUrl);
    let data = result.data;

    let endTime = new Date();

    let timeElapsed = endTime - startTime;

    winston.info('getObjectById id ' + objectId + ' timeElapsed ' + timeElapsed);

    if (result.statusCode == 404) {
        return null;
    }

    return data;

}