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

        if (message.command === "/oa") {

            try {

                let searchTerm = message.text;

                let searchResult = await CollectionApiService.getObjectForSearchTerm(searchTerm);

                if (searchResult == null || searchResult.SelectedObjectId == null) {

                    let response = buildNotFoundResponse("https://images.metmuseum.org/CRDImages/dp/web-large/DP815335.jpg", searchTerm, message.user_name);
                    
                    let responseUrl = message.incoming_message.channelData.response_url;
                    SlackApiService.respondPubliclyToEphemeralMessage(responseUrl, response);

                    DbService.saveSearchTerm(searchTerm, null);

                } else {

                    let objectData = await CollectionApiService.getObjectById(searchResult.SelectedObjectId);

                    await sendInteractiveDialog(bot, message, searchTerm, objectData, message.user_name, searchResult.ResultsCount > 1);

                }

            } catch (err) {

                console.log("An error occurred ");
                console.log(err);

                let response = buildSomethingWentWrongResponse("https://images.metmuseum.org/CRDImages/dp/web-large/DP835005.jpg", searchTerm, message.user_name);
                    
                let responseUrl = message.incoming_message.channelData.response_url;
                SlackApiService.respondPubliclyToEphemeralMessage(responseUrl, response);

                DbService.saveSearchTerm(searchTerm, null);

            }

        }

    });

    // receive an interactive message, and reply with a message that will replace the original
    controller.on('block_actions', async(bot, message) => {

        if (message.text.includes('select ')) {

            const selectData = JSON.parse(message.text.replace('select ', ''));

            let responseUrl = message.incoming_message.channelData.response_url;

            let response = buildFoundResponse(selectData.imageUrl, selectData.objectUrl, selectData.searchTerm, selectData.userName);
        
            SlackApiService.respondPubliclyToEphemeralMessage(responseUrl, response);

            DbService.saveSearchTerm(selectData.searchTerm, selectData.objectUrl);

        } else if (message.text.includes('shuffle ')) {

            const selectData = JSON.parse(message.text.replace('shuffle ', ''));

            console.log("selectData is ");
            console.log(selectData);

            let searchResult = await CollectionApiService.getObjectForSearchTerm(selectData.searchTerm);

            if (searchResult != null && searchResult.SelectedObjectId != null) {

                let objectData = await CollectionApiService.getObjectById(searchResult.SelectedObjectId);
                
                await sendInteractiveDialog(bot, message, selectData.searchTerm, objectData, selectData.userName, true);
                
            } else {
                // TODO error!
            }

        } else if (message.text.includes('cancel ')) {

            let deleteUrl = message.incoming_message.channelData.response_url;

            SlackApiService.deleteEphemeralMessage(deleteUrl);

        }
        
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

async function sendInteractiveDialog(bot, message, searchTerm, objectData, userName, allowShuffle) {

    let sendData = {
        imageUrl: objectData.primaryImageSmall,
        objectUrl: objectData.objectURL,
        searchTerm: searchTerm,
        userName: userName
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

    await bot.replyInteractive(message, blocks);      

}