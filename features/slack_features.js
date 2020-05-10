/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { SlackDialog } = require('botbuilder-adapter-slack');

const CollectionApiService = require('../services/collectionapi_service.js');
const SlackApiService = require('../services/slackapi_service.js');

module.exports = function(controller) {

    controller.ready(async () => {

    });

    controller.on('slash_command', async(bot, message) => {

        if (message.command === "/oa") {
            
            const searchTerm = message.text;

            let selectedObjectId = await CollectionApiService.getObjectForSearchTerm(searchTerm);

            let objectData = await CollectionApiService.getObjectById(selectedObjectId);

            await sendInteractiveDialog(bot, message, searchTerm, objectData, message.user_name);

        }

    });

    // receive an interactive message, and reply with a message that will replace the original
    controller.on('block_actions', async(bot, message) => {

        if (message.text.includes('select ')) {

            const selectData = JSON.parse(message.text.replace('select ', ''));

            let responseUrl = message.incoming_message.channelData.response_url;

            let response = buildFoundResponse(selectData.imageUrl, selectData.objectUrl, selectData.searchTerm, selectData.userName);
        
            SlackApiService.respondPubliclyToEphemeralMessage(responseUrl, response);

            

        } else if (message.text.includes('shuffle ')) {

            const selectData = JSON.parse(message.text.replace('shuffle ', ''));

            let selectedObjectId = await CollectionApiService.getObjectForSearchTerm(selectData.searchTerm);

            let objectData = await CollectionApiService.getObjectById(selectedObjectId);
            
            await sendInteractiveDialog(bot, message, selectData.searchTerm, objectData, selectData.userName);

        } else if (message.text.includes('cancel ')) {

            let deleteUrl = message.incoming_message.channelData.response_url;

            SlackApiService.deleteEphemeralMessage(deleteUrl);

        }
        
    });

}

function buildFoundResponse(imageUrl, objectUrl, searchTerm, userName) {

    return '<' + imageUrl + '|' + decodeURI(searchTerm) + '> requested by ' + userName + ' (' + '<' + objectUrl + '|learn more>)';

}

async function sendInteractiveDialog(bot, message, searchTerm, objectData, userName) {

    var sendData = {
        imageUrl: objectData.primaryImageSmall,
        objectUrl: objectData.objectURL,
        searchTerm: searchTerm,
        userName: userName
    };

    await bot.replyInteractive(message, {
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
                        "style": "danger",
                        "value": "cancel " + message.reference.activityId
                    }
                ]
            }		
        ]
      });      

}