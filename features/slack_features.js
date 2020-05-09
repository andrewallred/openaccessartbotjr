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

        if (message.command === "/oa") {
            
            const searchTerm = message.text;

            let selectedObjectId = await CollectionApiService.getObjectForSearchTerm(searchTerm);

            let objectData = await CollectionApiService.getObjectById(selectedObjectId);

            console.log('got an object');
            console.log(selectedObjectId);

            var response = buildFoundResponse(objectData.primaryImageSmall, objectData.objectURL, searchTerm, message.user_name);

            //bot.replyPublic(message,response);

            bot.replyInteractive(message, {
                "blocks": [
                    {
                        "type": "image",
                        "title": {
                            "type": "plain_text",
                            "text": "Example Image",
                            "emoji": true
                        },
                        "image_url": "https://images.metmuseum.org/CRDImages/as/web-large/DP121510.jpg",
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
                                "value": "select"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "Shuffle"
                                },
                                "style": "primary",
                                "value": "shuffle"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "Cancel"
                                },
                                "style": "danger",
                                "value": "cancel"
                            }
                        ]
                    }		
                ]
              }); 

        }

    });

    // receive an interactive message, and reply with a message that will replace the original
    controller.on('block_actions', function(bot, message) {
        console.log('block action');
    });

    controller.on('interactive_message', async (bot, message) => {

        console.log('INTERACTIVE MESSAGE', message);

        switch(message.actions[0].name) {
            case 'replace':
                await bot.replyInteractive(message,'[ A previous message was successfully replaced with this less exciting one. ]');
                break;
            case 'dialog':
                await bot.replyWithDialog(message, new SlackDialog('this is a dialog', '123', 'Submit', [
                    {
                        type: 'text',
                        label: 'Field 1',
                        name: 'field1',
                    },
                    {
                        type: 'text',
                        label: 'Field 2',
                        name: 'field2',
                    }
                ]).notifyOnCancel(true).state('foo').asObject());
                break;
            default:
                await bot.reply(message, 'Got a button click!');
        }
    });

    controller.on('dialog_submission', async (bot, message) => {
        await bot.reply(message, 'Got a dialog submission');

        // Return an error to Slack
        bot.dialogError([
            {
                "name": "field1",
                "error": "there was an error in field1"
            }
        ])
    });

    controller.on('dialog_cancellation', async (bot, message) => {
        await bot.reply(message, 'Got a dialog cancellation');
    });

}

function buildFoundResponse(imageUrl, objectUrl, searchTerm, userName) {
    var response = {};
    response.text = '<' + imageUrl + '|' + decodeURI(searchTerm) + '> requested by ' + userName + ' (' + '<' + objectUrl + '|learn more>)';
            
    console.log(response);

    return response;
}