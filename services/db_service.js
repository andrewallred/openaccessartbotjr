let MongoClient = require('mongodb').MongoClient;

module.exports = { getTeamById, saveTeam }

async function saveTeam(teamId, botAccessToken, botUserId) {

    let MongoClient = require('mongodb').MongoClient;

    await MongoClient.connect(process.env.MONGO_URI, async (err, db) => {

        if (err) throw err;
        let dbo = db.db("heroku_sq60p3vj");
        let team = { TeamId: teamId, BotAccessToken: botAccessToken, BotUserId: botUserId };
        dbo.collection("Teams").insertOne(team, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });

    });

}

async function getTeamById(teamId) {

    console.log("getting team " + teamId);

    let team;

    const client = await MongoClient.connect(process.env.MONGO_URI);

    const db = client.db("heroku_sq60p3vj");
    let query = { TeamId: teamId };
    let temp = await db.collection("Teams").findOne(query);

    team = temp;

    return team;

}