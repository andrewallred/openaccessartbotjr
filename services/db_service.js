let MongoClient = require('mongodb').MongoClient;

module.exports = { getTeamById, saveTeam, getTermsForSlang, saveSearchTerm, getObjectForSearchTerm }

async function saveTeam(teamId, botAccessToken, botUserId) {

    let MongoClient = require('mongodb').MongoClient;

    await MongoClient.connect(process.env.MONGO_URI, async (err, db) => {

        if (err) throw err;
        let dbo = db.db("heroku_sq60p3vj");
        let team = { TeamId: teamId, BotAccessToken: botAccessToken, BotUserId: botUserId };
        dbo.collection("Teams").insertOne(team, function(err, res) {
            if (err) throw err;
            //console.log("1 document inserted");
            db.close();
        });

    });

}

async function getTeamById(teamId) {

    //console.log("getting team " + teamId);

    let team;

    const client = await MongoClient.connect(process.env.MONGO_URI);

    const db = client.db("heroku_sq60p3vj");
    let query = { TeamId: teamId };
    let temp = await db.collection("Teams").findOne(query);

    team = temp;

    return team;

}

async function getTermsForSlang(slang) {

    slang = encodeURIComponent(slang);

    //console.log("getting slang " + slang);

    let slangTerms;

    const client = await MongoClient.connect(process.env.MONGO_URI);

    const db = client.db("heroku_sq60p3vj");
    let query = { Slang: slang };
    let temp = await db.collection("Slang").findOne(query);

    if (temp) {
        slangTerms = temp.Terms;
    }

    return slangTerms;

}

async function saveSearchTerm(searchTerm, objectUrl, objectId) {

    let MongoClient = require('mongodb').MongoClient;

    await MongoClient.connect(process.env.MONGO_URI, async (err, db) => {

        if (err) throw err;
        let dbo = db.db("heroku_sq60p3vj");
        let term = { SearchTerm: encodeURIComponent(searchTerm), ObjectUrl: objectUrl, ObjectId: objectId };
        //console.log(term);
        dbo.collection("SearchTerms").insertOne(term, function(err, res) {
            if (err) throw err;
            //console.log("1 document inserted");
            db.close();
        });

    });

}

async function getObjectForSearchTerm(searchTerm) {

    searchTerm = encodeURIComponent(searchTerm);

    let selectedResult = {};

    const client = await MongoClient.connect(process.env.MONGO_URI);

    const db = client.db("heroku_sq60p3vj");
    let query = { SearchTerm: searchTerm };
    let collection = db.collection("SearchTerms");
    let collectionCount = await collection.count(query);
    let skipCount = Math.floor(Math.random() * collectionCount);
    
    //let temp = collection.findOne(query);
    let temp = await collection.find(query).limit(1).skip(skipCount);

    //console.log(temp);

    if (temp) {
        if (temp.ObjectId != null) {
            selectedResult.SelectedObjectId = temp.ObjectId;
        } else if (temp.ObjectUrl != null) {
            selectedResult.SelectedObjectId = temp.ObjectUrl.replace('https://www.metmuseum.org/art/collection/search/', '');
        }
    }

    return selectedResult;

}