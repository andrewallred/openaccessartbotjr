/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { SlackDialog } = require('botbuilder-adapter-slack');

const winston = require('winston');
const consoleTransport = new winston.transports.Console();
winston.add(consoleTransport);

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

                winston.info('searchTerm ' + searchTerm + ' | user ' + message.user_name);

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
                                    "text": "`/oa \"One Hundred Famous Views of Edo\"` Quoted searches will select artworks for the exact term (and this is a great one to test out!)."
                                }
                            }
                        ]
                    };

                    bot.replyInteractive(message, helpBlocks);

                } else {

                    let searchResult = await CollectionApiService.getObjectForSearchTerm(searchTerm);

                    if (searchResult == null || searchResult.objectID == null) {

                        sendNoResultsResponse(bot, message, searchTerm);                        

                    } else {

                        sendInteractiveDialog(bot, message, searchTerm, searchResult, message.user_name, 1, searchResult.ResultsCount > 1);

                    }

                }

            } catch (err) {

                winston.error('An error occurred ' + err);

                let response = buildSomethingWentWrongResponse("https://images.metmuseum.org/CRDImages/dp/web-large/DP835005.jpg");
                    
                let responseUrl = message.incoming_message.channelData.response_url;
                SlackApiService.respondPubliclyToEphemeralMessage(responseUrl, response);

                DbService.saveSearchTerm(searchTerm, null, null);

            }

        }

        let endTime = new Date();

        let timeElapsed = endTime - startTime;

        winston.debug('slash command ' + message.command + ' timeElapsed ' + timeElapsed);

    });

    // receive an interactive message, and reply with a message that will replace the original
    controller.on('block_actions', async(bot, message) => {

        let startTime = new Date();

        if (message.text.includes('select ')) {

            const selectData = JSON.parse(message.text.replace('select ', ''));

            let responseUrl = message.incoming_message.channelData.response_url;

            let responseText = buildFoundResponseText(selectData.imageUrl, selectData.objectUrl, selectData.objectTitle, selectData.searchTerm, selectData.userName);
            let responseBlocks = buildFoundResponseBlocks(selectData.imageUrl, selectData.objectUrl, selectData.objectTitle, selectData.searchTerm, selectData.userName);
        
            SlackApiService.respondPubliclyToEphemeralMessage(responseUrl, responseText, responseBlocks);

            DbService.saveSearchTerm(selectData.searchTerm, selectData.objectUrl, selectData.objectId);

        } else if (message.text.includes('shuffle ')) {

            const selectData = JSON.parse(message.text.replace('shuffle ', ''));

            let searchResult;
            let dbSearchResult;
            winston.debug('this is attempt #' + selectData.attempt + ' for string ' + selectData.searchTerm);
            if ((selectData.attempt + 1) % 3 == 0) {
                dbSearchResult = await DbService.getObjectForSearchTerm(selectData.searchTerm);

                winston.debug('looked up prior search result');
                winston.debug(dbSearchResult);                
            }

            if (dbSearchResult == null || dbSearchResult.SelectedObjectId == null) {
                // we're not using a prior search result
                if (selectData.attempt == 4) {
                    // get the top result if it is the 4th attempt
                    winston.debug('getting the top result since it is the 4th attempt');
                    searchResult = await CollectionApiService.getObjectForSearchTerm(selectData.searchTerm + " #top");
                } else {
                    // otherwise get a random result
                    searchResult = await CollectionApiService.getObjectForSearchTerm(selectData.searchTerm);
                }                
            } else {
                searchResult = await CollectionApiService.getObjectById(dbSearchResult.SelectedObjectId);
            }

            if (searchResult != null && searchResult.objectID != null) {
                
                sendInteractiveDialog(bot, message, selectData.searchTerm, searchResult, selectData.userName, selectData.attempt + 1, true);
                
            } else {
                // TODO error!
                winston.error('no object found!')
            }

        } else if (message.text.includes('cancel ')) {

            let deleteUrl = message.incoming_message.channelData.response_url;

            SlackApiService.deleteEphemeralMessage(deleteUrl);

        }

        let endTime = new Date();

        let timeElapsed = endTime - startTime;

        winston.debug('block action timeElapsed ' + timeElapsed);
        
    });

}

function buildFoundResponseText(imageUrl, objectUrl, objectTitle, searchTerm, userName) {

    searchTerm = searchTerm.replace("#top ", "");    

    let hasMedium = searchTerm.includes("#medium ");
    if (hasMedium) {
        let medium = searchTerm.match(new RegExp('\#medium\\s(\\w+)'))[1];
        searchTerm = searchTerm.replace(" #medium " + medium, "");
    }

    let paintingsOnly = searchTerm.includes("#paintings");
    if (paintingsOnly) {
        searchTerm = searchTerm.replace(" #paintings ", "");
        searchTerm = searchTerm.replace("#paintings ", "");
        searchTerm = searchTerm.replace(" #paintings", "");
    }

    return '<' + imageUrl + '|' + decodeURI(searchTerm) + '> requested by ' + userName + ' (' + '<' + objectUrl + '|learn more>)';

}

function buildFoundResponseBlocks(imageUrl, objectUrl, objectTitle, searchTerm, userName) {

    // not used for now
    let blocks = {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": decodeURI(searchTerm) + " requested by " + userName + " " + "(<" + objectUrl + "|learn more>)"
                }
            },
            {
                "type": "image",
                "title": {
                    "type": "plain_text",
                    "text": objectTitle,
                    "emoji": true
                },
                "image_url": imageUrl,
                "alt_text": objectTitle
            }
        ]
    };

    return blocks;

}

function sendNoResultsResponse(bot, message, searchTerm) {

    let noResultsFoundBlocks = {
        "blocks": [
            {
                "type": "image",
                "title": {
                    "type": "plain_text",
                    "text": searchTerm + " not found, enjoy some cats instead (just for you)",
                    "emoji": true
                },
                "image_url": "https://images.metmuseum.org/CRDImages/dp/web-large/DP815335.jpg",
                "alt_text": searchTerm
            }	
        ]
    };

    bot.replyInteractive(message, noResultsFoundBlocks);

}

function buildSomethingWentWrongResponse(imageUrl) {

    return 'something went wrong! <' + imageUrl + '|try again>';

}

async function sendInteractiveDialog(bot, message, searchTerm, objectData, userName, attempt, allowShuffle) {

    let startTime = new Date();

    let sendData = {
        imageUrl: objectData.primaryImageSmall,
        objectUrl: objectData.objectURL,
        objectTitle: objectData.title,
        objectId: objectData.objectID,
        searchTerm: searchTerm,
        userName: userName,
        attempt: attempt
    };

    let noImageFoundBlocks = {
        "blocks": [            
            {
                "type": "section",
                "text": {
                    "type": "plain_text",
                    "text": "Error! Please try again.",
                    "emoji": true
                }
            },
            {
                "type": "actions",
                "elements": [

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

    let foundBlocks = {
        "blocks": [
            {
                "type": "image",
                "title": {
                    "type": "plain_text",
                    "text": objectData.title,
                    "emoji": true
                },
                "image_url": objectData.primaryImageSmall,
                "alt_text": searchTerm
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

    let blocks;
    if (objectData.primaryImageSmall) {
        blocks = foundBlocks;
    } else {
        blocks = noImageFoundBlocks;
    }

    if (!allowShuffle) {
        // lazy
        blocks.blocks[1].elements.splice(1, 1);
    }

    let endTime = new Date();

    let timeElapsed = endTime - startTime;

    winston.debug('send interactive dialog timeElapsed ' + timeElapsed);

    // debug logging statement
    // winston.debug(JSON.stringify(blocks));

    bot.replyInteractive(message, blocks);      

}