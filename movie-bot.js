var Botkit = require('./node_modules/botkit/lib/Botkit.js');

if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
    console.log('Error: Specify clientId clientSecret and port in environment');
    process.exit(1);
}


var controller = Botkit.slackbot({
    json_file_store: './db_slackbutton_bot/',
    // rtm_receive_messages: false, // disable rtm_receive_messages if you enable events api
}).configureSlackApp(
    {
        clientId: process.env.clientId,
        clientSecret: process.env.clientSecret,
        redirectUri: process.env.redirectUri, // optional parameter passed to slackbutton oauth flow
        scopes: ['bot'],
    }
);

controller.setupWebserver(process.env.port,function(err,webserver) {
    controller.createWebhookEndpoints(controller.webserver);
    controller.createHomepageEndpoint(controller.webserver);
    controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });
});


// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};
function trackBot(bot) {
    _bots[bot.config.token] = bot;
}

controller.on('create_bot',function(bot,config) {

    if (_bots[bot.config.token]) {
        // already online! do nothing.
    } else {
        bot.startRTM(function(err) {

            if (!err) {
                trackBot(bot);
            }

            bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
                if (err) {
                    console.log(err);
                } else {
                    convo.say('I am a bot that has just joined your team');
                    convo.say('You must now /invite me to a channel so that I can be of use!');
                }
            });

        });
    }

});


// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});

controller.hears('hello','direct_message',function(bot,message) {
    bot.reply(message,'Hello!');
});

controller.hears('^stop','direct_message',function(bot,message) {
    bot.reply(message,'Goodbye');
    bot.rtm.close();
});

controller.on(['direct_message','mention','direct_mention'],function(bot,message) {
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    },function(err) {
        if (err) { console.log(err) }
        bot.reply(message,'I heard you loud and clear boss.');
    });
});

controller.storage.teams.all(function(err,teams) {

    if (err) {
        throw new Error(err);
    }

    // connect all teams with bots up to slack!
    for (var t  in teams) {
        if (teams[t].bot) {
            controller.spawn(teams[t]).startRTM(function(err, bot) {
                if (err) {
                    console.log('Error connecting bot to Slack:',err);
                } else {
                    trackBot(bot);
                }
            });
        }
    }

});

controller.hears('start', 'direct_message', function(bot, message) {

    askYesNo(bot, message);
});

var colors = ['blue', 'green', '...'];

// receive an interactive message, and reply with a message that will replace the original
controller.on('interactive_message_callback', function(bot, message) {
    if(message.actions[0].value === 'no') {
        askYesNo(bot, message);
    }
});

function askYesNo(bot, message) {
    bot.reply(message, {
        attachments:[
            {
                title: 'Do you want to interact with my buttons?',
                callback_id: '123',
                attachment_type: 'default',
                actions: generate_buttons()
            }
        ]
    });
}

function generate_buttons() {
    var movie_buttons = [];
    movie_buttons.push();
    return  [
        {
            "name":"yes",
            "text": "Yes",
            "value": "yes",
            "type": "button",
        },
        {
            "name":"no",
            "text": "Nohj dfshjd shjkdfsj hkdfsjkh jkhdfs",
            "value": "no",
            "type": "button",
        }
    ];
}