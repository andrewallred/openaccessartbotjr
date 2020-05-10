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

        console.log('slash command');

        console.log(message);

        if (message.command === "/oa") {
            
            const searchTerm = message.text;

            let selectedObjectId = await CollectionApiService.getObjectForSearchTerm(searchTerm);

            let objectData = await CollectionApiService.getObjectById(selectedObjectId);

            //console.log('got an object');
            //console.log(selectedObjectId);

            //var response = buildFoundResponse(objectData.primaryImageSmall, objectData.objectURL, searchTerm, message.user_name);

            //bot.replyPublic(message,response);

            await sendInteractiveDialog(bot, message, searchTerm, objectData);

        }

    });

    // receive an interactive message, and reply with a message that will replace the original
    controller.on('block_actions', async(bot, message) => {

        //console.log("inmemmessage");
        //console.log(inmemmessage);

        console.log('block action! ' + message.text);

        console.log(message);
        //console.log(message._activity);

        if (message.text.includes('select ')) {

            const imageUrl = message.text.replace('select ', '');

            let response = buildFoundResponse(imageUrl, '', '', '');

            console.log('joining channel ' + message.channel);

            await bot.startConversationInChannel(message.channel, null);

            console.log('saying');

            await bot.say('test');

            //bot.replyPublic(message, response);
            //sendPublicBlocks(bot, null, '', imageUrl);
            

        } else if (message.text.includes('shuffle ')) {

            const searchTerm = message.text.replace('shuffle ', '');

            let selectedObjectId = await CollectionApiService.getObjectForSearchTerm(searchTerm);

            let objectData = await CollectionApiService.getObjectById(selectedObjectId);
            
            await sendInteractiveDialog(bot, message, searchTerm, objectData);

        } else if (message.text.includes('cancel ')) {

            const activityId = message.text.replace('cancel ', '');

            let messageToDelete = {};
            messageToDelete.id = message.container.message_ts;
            messageToDelete.conversation = message.incoming_message.conversation;

            let deleteUrl = message.incoming_message.channelData.response_url;

            console.log('to delete');
            console.log(deleteUrl);

            //console.log(message.id);
            //console.log(messageToDelete);

            //bot.deleteMessage(messageToDelete);

            SlackApiService.deleteEphemeralMessage(deleteUrl);

        }
        
    });

}

function buildFoundResponse(imageUrl, objectUrl, searchTerm, userName) {
    var response = {};
    response.text = '<' + imageUrl + '|' + decodeURI(searchTerm) + '> requested by ' + userName + ' (' + '<' + objectUrl + '|learn more>)';
            
    //console.log(response);

    return response;
}

function sendPublicBlocks(bot, message, searchTerm, imageUrl) {

    bot.replyPublic(message, 'selected!');

    /*bot.replyPublic(message, {
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
      });*/ 

}

//let inmemmessage;

async function sendInteractiveDialog(bot, message, searchTerm, objectData) {

    //inmemmessage = message;

    await bot.replyPublic(message, {
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

      //console.log(message);

      let messageToDelete = {};
      messageToDelete.id = message.incoming_message.id;
      messageToDelete.conversation = message.incoming_message.conversation;

      //console.log(messageToDelete);

      //await bot.deleteMessage(messageToDelete);*/

      //await bot.replyPublic(message, 'test');

      //await bot.deleteMessage(messageToDelete);


      //bot.reply(message, 'test2');

}