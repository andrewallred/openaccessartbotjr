let MongoClient = require('mongodb').MongoClient;

module.exports = { getTeamById, saveTeam, getTermsForSlang, saveSearchResults, saveSearchTerm, getObjectForSearchTerm }

const winston = require('winston');

async function saveTeam(teamId, botAccessToken, botUserId) {

    let MongoClient = require('mongodb').MongoClient;

    await MongoClient.connect(process.env.MONGO_URI, async (err, db) => {

        if (err) throw err;
        let dbo = db.db(process.env.MONGO_DB);
        let team = { TeamId: teamId, BotAccessToken: botAccessToken, BotUserId: botUserId };
        dbo.collection("Teams").insertOne(team, function(err, res) {
            if (err) throw err;
            db.close();
        });

    });

}

async function getTeamById(teamId) {

    let team;

    const client = await MongoClient.connect(process.env.MONGO_URI);

    const db = client.db(process.env.MONGO_DB);
    let query = { TeamId: teamId };
    let temp = await db.collection("Teams").findOne(query);

    team = temp;

    client.close();

    return team;

}

async function getTermsForSlang(slang) {

    let startTime = new Date();

    slang = encodeURIComponent(slang);

    let slangTerms;

    const client = await MongoClient.connect(process.env.MONGO_URI);

    const db = client.db(process.env.MONGO_DB);
    let query = { Slang: slang };
    let temp = await db.collection("Slang").findOne(query);

    if (temp) {
        slangTerms = temp.Terms;
    }

    let endTime = new Date();

    let timeElapsed = endTime - startTime;

    winston.debug('getTermsForSlang timeElapsed ' + timeElapsed);

    client.close();

    return slangTerms;

}

async function saveSearchResults(searchTerm, objectIDs) {

    let MongoClient = require('mongodb').MongoClient;

    await MongoClient.connect(process.env.MONGO_URI, async (err, db) => {

        if (err) throw err;
        let dbo = db.db(process.env.MONGO_DB);
        let searchResults = { SearchTerm: encodeURIComponent(searchTerm), ObjectIDs: objectIDs };
        dbo.collection("SearchResults").insertOne(term, function(err, res) {
            if (err) throw err;
            db.close();
        });

    });

}

async function saveSearchTerm(searchTerm, objectUrl, objectId) {

    let MongoClient = require('mongodb').MongoClient;

    await MongoClient.connect(process.env.MONGO_URI, async (err, db) => {

        if (err) throw err;
        let dbo = db.db(process.env.MONGO_DB);
        let term = { SearchTerm: encodeURIComponent(searchTerm), ObjectUrl: objectUrl, ObjectId: objectId };
        dbo.collection("SearchTerms").insertOne(term, function(err, res) {
            if (err) throw err;
            db.close();
        });

    });

}

async function getObjectForSearchTerm(searchTerm) {

    searchTerm = encodeURIComponent(searchTerm);

    let selectedResult = {};

    const client = await MongoClient.connect(process.env.MONGO_URI);

    const db = client.db(process.env.MONGO_DB);
    let collection = db.collection("SearchTerms");
    
    let temp = {};

    await collection.aggregate([
        { $match: { SearchTerm: searchTerm } },
        { $sample: { size: 1 } }
    ]).forEach( function(result) { temp = result; } );

    winston.debug('found a random prior result ' + temp);
    
    if (temp) {
        if (temp.ObjectId != null) {
            selectedResult.SelectedObjectId = temp.ObjectId;
        } else if (temp.ObjectUrl != null) {
            selectedResult.SelectedObjectId = temp.ObjectUrl.replace('https://www.metmuseum.org/art/collection/search/', '');
        }
    }

    client.close();

    return selectedResult;

}