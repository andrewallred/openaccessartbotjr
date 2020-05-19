var MongoClient = require('mongodb').MongoClient;

module.exports = { getTeamById, saveTeam }

async function saveTeam(teamId, botAccessToken, botUserId) {

    var MongoClient = require('mongodb').MongoClient;

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
    var query = { TeamId: teamId };
    console.log(query);
    let temp = await db.collection("Teams").findOne(query);

    console.log(temp);
    
    /*.toArray(function(err, result) {

        console.log("finding");

        if (err) throw err;
        team = result;
        client.close();

    });*/

    return team;

}