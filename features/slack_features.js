/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { SlackDialog } = require('botbuilder-adapter-slack');

module.exports = function(controller) {

    controller.ready(async () => {

    });

    controller.on('slash_command', async(bot, message) => {
        if (message.text === 'plain') {
            await bot.reply(message, 'This is a plain reply');
        } else if (message.text === 'public') {
            await bot.replyPublic(message, 'This is a public reply');
        } else if (message.text === 'private') {
            await bot.replyPrivate(message, 'This is a private reply');
        } else if (message.text === 'oa') {
            await bot.replyPublic(message, 'oabot');
        }

        // set http status
        //bot.httpBody({text:'You can send an immediate response using bot.httpBody()'});
        //console.log(message.text);

        await bot.replyPublic(message, message.text);
        await bot.replyPublic(message, message.command);

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