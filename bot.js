//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the openaccessartbotjr bot.

// TODO reenable after fixing breaking changes
// require ('newrelic');

// Import Botkit's core features
const { Botkit } = require('botkit');
const { BotkitCMSHelper } = require('botkit-plugin-cms');

// Import a platform-specific adapter for slack.

const { SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware } = require('botbuilder-adapter-slack');

const { MongoDbStorage } = require('botbuilder-storage-mongodb');

const DbService = require('./services/db_service.js');

// Load process.env values from .env file
require('dotenv').config();

let storage = null;
if (process.env.MONGO_URI) {
    storage = mongoStorage = new MongoDbStorage({
        url : process.env.MONGO_URI,
        database: process.env.MONGO_DB
    });
}

const adapter = new SlackAdapter({

    // parameters used to secure webhook endpoint
    verificationToken: process.env.VERIFICATION_TOKEN,
    clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,  

    // auth token for a single-team app
    // botToken: process.env.BOT_TOKEN,

    // credentials used to set up oauth for multi-team apps
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: ['bot'], 
    redirectUri: process.env.REDIRECT_URI,
 
    // functions required for retrieving team-specific info
    // for use in multi-team apps
    getTokenForTeam: getTokenForTeam,
    getBotUserByTeam: getBotUserByTeam,

    oauthVersion: "v2"
});

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());


const controller = new Botkit({
    webhook_uri: '/api/messages',

    adapter: adapter,

    storage: storage
});

if (process.env.CMS_URI) {
    controller.usePlugin(new BotkitCMSHelper({
        uri: process.env.CMS_URI,
        token: process.env.CMS_TOKEN,
    }));
}

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {

    // load traditional developer-created local custom feature modules
    controller.loadModules(__dirname + '/features');

    /* catch-all that uses the CMS to trigger dialogs */
    if (controller.plugins.cms) {
        controller.on('message,direct_message', async (bot, message) => {
            let results = false;
            results = await controller.plugins.cms.testTrigger(bot, message);

            if (results !== false) {
                // do not continue middleware!
                return false;
            }
        });
    }

});



controller.webserver.get('/', (req, res) => {

    res.send(`hello world!`);

});

controller.webserver.get('/status', (req, res) => {

    res.send(`open access art bot is up!`);

});






controller.webserver.get('/install', (req, res) => {

    // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
    res.redirect(controller.adapter.getInstallLink());

});

controller.webserver.get('/install/auth', async (req, res) => {

    try {
        const results = await controller.adapter.validateOauthCode(req.query.code);

        let team = await DbService.getTeamById(results.team.id);

        if (team == null) {
            await DbService.saveTeam(results.team.id, results.access_token, results.bot_user_id);
        }

        team = await DbService.getTeamById(results.team.id);

        res.redirect('https://www.openaccessartbot.com/success.html');

    } catch (err) {
        console.error('OAUTH ERROR:', err);
        res.status(401);
        res.send(err.message);
    }
});

async function getTokenForTeam(teamId) {

    try {

        let team = await DbService.getTeamById(teamId);

        if (team == null) {
            console.error("team not found " + teamId);
            return null;
        }

        return Promise.resolve(team.BotAccessToken);

    } catch (err) {
        console.log(err);
        throw err;
    }
    
}

async function getBotUserByTeam(teamId) {

    let team = await DbService.getTeamById(teamId);

    if (team == null) {
        console.error("team not found " + teamId);
    }

    return Promise.resolve(team.BotUserId);

}

