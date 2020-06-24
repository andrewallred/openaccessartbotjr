/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { SlackDialog } = require('botbuilder-adapter-slack');

const CollectionApiService = require('../services/collectionapi_service.js');
const SlackApiService = require('../services/slackapi_service.js');
const DbService = require('../services/db_service.js');

module.exports = function(controller) {

    controller.ready(async () => {

    });

    controller.on('slash_command', async(bot, message) => {

        let startTime = new Date();

        if (message.command === "/oa") {

            try {

                let searchTerm = message.text;

                if (searchTerm == "help") {

                    let helpBlocks = {
                        "blocks": [
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": ":wave: Need some help with Open Access Art Bot? By typing the /oa command and a search term you can search for and select artworks to share with your slack workspace! "
                                }
                            },
                            {
                                "type": "divider"
                            },
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": "`/oa van gogh` Simple searches will search for the given term, in this case returning works by Van Gogh or similar artists."
                                }
                            },
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": "`/oa manet \"top\"` Searches using \"top\" will select the top artwork for the given search term."
                                }
                            },
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": "`/oa \"One Hundred Famous Views of Edo\"` Quoted searches will select artworks for the exact term (and this is a great one to test out)."
                                }
                            }
                        ]
                    };

                    bot.replyInteractive(message, helpBlocks);

                } else {

                    let searchResult = await CollectionApiService.getObjectForSearchTerm(searchTerm);

                    if (searchResult == null || searchResult.SelectedObjectId == null) {

                        let response = buildNotFoundResponse("https://images.metmuseum.org/CRDImages/dp/web-large/DP815335.jpg", searchTerm, message.user_name);
                        
                        let responseUrl = message.incoming_message.channelData.response_url;
                        SlackApiService.respondPubliclyToEphemeralMessage(responseUrl, response);

                        DbService.saveSearchTerm(searchTerm, null, null);

                    } else {

                        let objectData = await CollectionApiService.getObjectById(searchResult.SelectedObjectId);

                        sendInteractiveDialog(bot, message, searchTerm, objectData, message.user_name, 1, searchResult.ResultsCount > 1);

                    }

                }

            } catch (err) {

                console.log("An error occurred ");
                console.log(err);

                let response = buildSomethingWentWrongResponse("https://images.metmuseum.org/CRDImages/dp/web-large/DP835005.jpg", searchTerm, message.user_name);
                    
                let responseUrl = message.incoming_message.channelData.response_url;
                SlackApiService.respondPubliclyToEphemeralMessage(responseUrl, response);

                DbService.saveSearchTerm(searchTerm, null, null);

            }

        }

        let endTime = new Date();

        let timeElapsed = endTime - startTime;

        console.log('slash command timeElapsed ' + timeElapsed);

    });

    // receive an interactive message, and reply with a message that will replace the original
    controller.on('block_actions', async(bot, message) => {

        let startTime = new Date();

        if (message.text.includes('select ')) {

            const selectData = JSON.parse(message.text.replace('select ', ''));

            let responseUrl = message.incoming_message.channelData.response_url;

            let response = buildFoundResponse(selectData.imageUrl, selectData.objectUrl, selectData.searchTerm, selectData.userName);
        
            SlackApiService.respondPubliclyToEphemeralMessage(responseUrl, response);

            DbService.saveSearchTerm(selectData.searchTerm, selectData.objectUrl, selectData.objectId);

        } else if (message.text.includes('shuffle ')) {

            const selectData = JSON.parse(message.text.replace('shuffle ', ''));

            //console.log("selectData is ");
            //console.log(selectData);

            let searchResult;
            if ((selectData.attempt + 1) % 3 == 0) {
                searchResult = await DbService.getObjectForSearchTerm(selectData.searchTerm);

                console.log('looked up prior search result');
                console.log(searchResult);
            }

            if (searchResult == null || searchResult.SelectedObjectId == null) {
                searchResult = await CollectionApiService.getObjectForSearchTerm(selectData.searchTerm);
            }

            if (searchResult != null && searchResult.SelectedObjectId != null) {

                let objectData = await CollectionApiService.getObjectById(searchResult.SelectedObjectId);
                
                sendInteractiveDialog(bot, message, selectData.searchTerm, objectData, selectData.userName, selectData.attempt + 1, true);
                
            } else {
                // TODO error!
            }

        } else if (message.text.includes('cancel ')) {

            let deleteUrl = message.incoming_message.channelData.response_url;

            SlackApiService.deleteEphemeralMessage(deleteUrl);

        }

        let endTime = new Date();

        let timeElapsed = endTime - startTime;

        console.log('block action timeElapsed ' + timeElapsed);
        
    });

}

function buildFoundResponse(imageUrl, objectUrl, searchTerm, userName) {

    return '<' + imageUrl + '|' + decodeURI(searchTerm) + '> requested by ' + userName + ' (' + '<' + objectUrl + '|learn more>)';

}

function buildNotFoundResponse(imageUrl, searchTerm, userName) {

    return searchTerm + ' not found, enjoy some <' + imageUrl + '|cats> instead, requested by ' + userName;

}

function buildSomethingWentWrongResponse(imageUrl, searchTerm, userName) {

    return 'something went wrong! <' + imageUrl + '|try again>';

}

async function sendInteractiveDialog(bot, message, searchTerm, objectData, userName, attempt, allowShuffle) {

    let startTime = new Date();

    let sendData = {
        imageUrl: objectData.primaryImageSmall,
        objectUrl: objectData.objectURL,
        objectId: objectData.objectID,
        searchTerm: searchTerm,
        userName: userName,
        attempt: attempt
    };

    let blocks = {
        "blocks": [
            {
                "type": "image",
                "title": {
                    "type": "plain_text",
                    "text": "Example Image",
                    "emoji": true
                },
                "image_url": objectData.primaryImageSmall,
                "alt_text": "monet"
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "Send"
                        },
                        "style": "primary",
                        "value": "select " + JSON.stringify(sendData)
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "Shuffle"
                        },
                        "value": "shuffle " + JSON.stringify(sendData)
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "Cancel"
                        },
                        "value": "cancel " + message.reference.activityId
                    }
                ]
            }		
        ]
    };

    if (!allowShuffle) {
        // lazy
        blocks.blocks[1].elements.splice(1, 1);
    }

    let endTime = new Date();

    let timeElapsed = endTime - startTime;

    console.log('send interactive dialog timeElapsed ' + timeElapsed);

    bot.replyInteractive(message, blocks);      

}