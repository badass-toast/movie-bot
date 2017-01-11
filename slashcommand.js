/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ______    ______    ______   __  __    __    ______
 /\  == \  /\  __ \  /\__  _\ /\ \/ /   /\ \  /\__  _\
 \ \  __<  \ \ \/\ \ \/_/\ \/ \ \  _"-. \ \ \ \/_/\ \/
 \ \_____\ \ \_____\   \ \_\  \ \_\ \_\ \ \_\   \ \_\
 \/_____/  \/_____/    \/_/   \/_/\/_/  \/_/    \/_/
 This is a sample Slack Button application that provides a custom
 Slash command.
 This bot demonstrates many of the core features of Botkit:
 *
 * Authenticate users with Slack using OAuth
 * Receive messages using the slash_command event
 * Reply to Slash command both publicly and privately
 # RUN THE BOT:
 Create a Slack app. Make sure to configure at least one Slash command!
 -> https://api.slack.com/applications/new
 Run your bot from the command line:
 clientId=<my client id> clientSecret=<my client secret> PORT=3000 node bot.js
 Note: you can test your oauth authentication locally, but to use Slash commands
 in Slack, the app must be hosted at a publicly reachable IP or host.
 # EXTEND THE BOT:
 Botkit is has many features for building cool and useful bots!
 Read all about it here:
 -> http://howdy.ai/botkit
 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/* Uses the slack button feature to offer a real time bot to multiple teams */
var Botkit = require('botkit');

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.PORT || !process.env.VERIFICATION_TOKEN) {
    console.log('Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN and PORT in environment');
    process.exit(1);
}

var config = {}
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    config = {
        json_file_store: './db_slackbutton_slash_command/',
    };
}

var controller = Botkit.slackbot(config).configureSlackApp(
    {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        scopes: ['commands']
    }
);

controller.setupWebserver(process.env.PORT, function (err, webserver) {
    controller.createWebhookEndpoints(controller.webserver);
    controller.createHomepageEndpoint(controller.webserver);
    controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });
});

var request = require("request");
var base_url = "https://image.tmdb.org/t/p/w185";
controller.on('slash_command', function (slashCommand, message) {

    switch (message.command) {
        case "/movie":
            if (message.token !== process.env.VERIFICATION_TOKEN) return;


            if (message.text === "") {
                slashCommand.replyPrivate(message, "I give you back a movie with all information according to your search word! Try type `/movie star wars` :smile:");
                return;
            }else if(message.text != "") {
                var movie_search_title = message.text;
                var url_query = "https://api.themoviedb.org/3/search/movie?api_key=87a3acc12bd88c311e7dcc9c41542560&query=" +movie_search_title+ "";

                request({ url: url_query, json: true }, function (error, response, body) {
                    var movies = body.results;

                    if (movies.length === 1) {
                        var movie_id_gen = body.results[0].id;
                        var url_id = "https://api.themoviedb.org/3/movie/" +movie_id_gen+ "?api_key=87a3acc12bd88c311e7dcc9c41542560&language=en-US";
                        request({ url: url_id, json: true }, function (error, response, body) {
                            slashCommand.replyPublic(message, generate_movie_text(body));
                        })
                    }else if(body.total_results === 0) {
                        slashCommand.replyPrivate(message, 'I wasn\'t able to find any movies by that name:sweat:. Please try to be more specific');
                    }else{
                        slashCommand.replyPublic(message, {
                            attachments:[
                                {
                                    title: 'There were more than one movie with this name. Choose one below or try to be more specific!',
                                    callback_id: '123',
                                    attachment_type: 'default',
                                    actions: generate_buttons(movies)
                                }
                            ]
                        })
                    }
                });
            }

            break;
        default:
            slashCommand.replyPrivate(message, "Darn something went wrong. Sorry...");

    }

})
;

controller.on('interactive_message_callback', function(slashCommand, message) {
    var movie_id = message.actions[0].value;
    var url_id_call = "https://api.themoviedb.org/3/movie/" +movie_id+ "?api_key=87a3acc12bd88c311e7dcc9c41542560&language=en-US";
    request({ url: url_id_call, json: true }, function (error, response, body) {
        slashCommand.replyPublicDelayed(message, generate_movie_text(body));
    })
});

function generate_buttons(movies){
    var movie_buttons = [];
    var length = movies.length;
    if (length>5) {
        //slack api limits buttons to 5 at a time so if there are more than 5 movies it has to load more than it actually prints.
        length = 5;
    }
    for(var i = 0; i<length;i++){
        movie_buttons.push(
            {
                "name":movies[i].title,
                "text": movies[i].title,
                "value": movies[i].id,
                "type": "button"
            });
    }
    return movie_buttons;
}

function generate_movie_text(movies){
    var image_url = movies.poster_path;
    var movie_title = movies.title;
    var discription = movies.overview;
    var release_uncut = movies.release_date;
    var release = release_uncut.substring(0, 4);
    var vote = movies.vote_average;
    var genre_id = movies.genres[0].name;
    var time_unfunc = movies.runtime;
    var runtime = time_func(time_unfunc);
    var homepage = null;
    if (movies.homepage === '') {
        homepage = 'There is no website available for this movie!';
    } else {
        homepage = movies.homepage.substring(7);
    }
    return ''+base_url+ '' +image_url+ '\n*' +movie_title+ '*\n' +discription+ '\n _' +genre_id+ ' ‧ ' +release+ ' ‧ ' +vote+ '/10 ‧ ' +runtime+ '_\nMore --> ' +homepage+ '';
}


function time_func(time) {
    var hours = Math.trunc(time/60);
    var minutes = time % 60;
    return '' +hours+ 'h ' +minutes+ 'm';
}