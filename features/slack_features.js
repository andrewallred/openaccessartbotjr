/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { SlackDialog } = require('botbuilder-adapter-slack');

const CollectionApiService = require('../services/collectionapi_service.js');

module.exports = function(controller) {

    controller.ready(async () => {

    });

    controller.on('slash_command', async(bot, message) => {

        console.log('slash command');

        console.log(message);

        if (message.command === "/oa") {
            
            const searchTerm = message.text;

            let selectedObjectId = await CollectionApiService.getObjectForSearchTerm(searchTerm);

            let objectData = await CollectionApiService.getObjectById(selectedObjectId);

            console.log('got an object');
            console.log(selectedObjectId);

            //var response = buildFoundResponse(objectData.primaryImageSmall, objectData.objectURL, searchTerm, message.user_name);

            //bot.replyPublic(message,response);

            sendInteractiveDialog(bot, message, searchTerm, objectData);

        }

    });

    // receive an interactive message, and reply with a message that will replace the original
    controller.on('block_actions', async(bot, message) => {

        console.log('block action! ' + message.text);

        console.log(message);
        console.log(message._activity);

        if (message.text.includes('select ')) {

            const imageUrl = message.text.replace('select ', '');

            let response = buildFoundResponse(imageUrl, '', '', '');

            //bot.replyPublic(message, response);
            sendPublicBlocks(bot, message, '', imageUrl);
            

        } else if (message.text.includes('shuffle ')) {

            const searchTerm = message.text.replace('shuffle ', '');

            let selectedObjectId = await CollectionApiService.getObjectForSearchTerm(searchTerm);

            let objectData = await CollectionApiService.getObjectById(selectedObjectId);
            
            sendInteractiveDialog(bot, message, searchTerm, objectData);

        } else if (message.text.includes('cancel ')) {

            const activityId = message.text.replace('cancel ', '');

            message.id = activityId;
            message.conversation = message.incoming_message.conversation;

            console.log(message.id);
            console.log(message.conversation);

            bot.deleteMessage(message);

        }
        
    });

}

function buildFoundResponse(imageUrl, objectUrl, searchTerm, userName) {
    var response = {};
    response.text = '<' + imageUrl + '|' + decodeURI(searchTerm) + '> requested by ' + userName + ' (' + '<' + objectUrl + '|learn more>)';
            
    console.log(response);

    return response;
}

function sendPublicBlocks(bot, message, searchTerm, imageUrl) {

    bot.replyPublic(message, {
        "blocks": [
            {
                "type": "image",
                "title": {
                    "type": "plain_text",
                    "text": "Example Image",
                    "emoji": true
                },
                "image_url": imageUrl,
                "alt_text": "monet"
            }
        ]
      }); 

}

function sendInteractiveDialog(bot, message, searchTerm, objectData) {

    bot.replyInteractive(message, {
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
                            "text": "Select"
                        },
                        "style": "primary",
                        "value": "select " + objectData.primaryImageSmall
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "Shuffle"
                        },
                        "style": "primary",
                        "value": "shuffle " + searchTerm
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