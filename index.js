if (!process.env.SLACK_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}




var Botkit = require('./node_modules/botkit/lib/Botkit.js');
var os = require('os');


var controller = Botkit.slackbot({
  send_via_rtm:true, debug: true
});

var bot = controller.spawn({
  token: process.env.SLACK_TOKEN
}).startRTM();


controller.hears(['identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {

      bot.reply(message,
          'My name is Horse Gif. I am a bot that sends a horsegif, everytime I see "horse" in a message');

    });

controller.hears(['movie search' && ""], ['ambient,message_received'], function(bot, message) {
  var request = require("request");
  var query = 'kingsman';
  var url = "https://api.themoviedb.org/3/search/movie?api_key=87a3acc12bd88c311e7dcc9c41542560&query=" +query+ "&region=CH";
  var base_url = "https://image.tmdb.org/t/p/w500/";

  request({ url: url, json: true }, function (error, response, body) {

    if (!error && response.statusCode === 200) {
      console.log(body);
      var im
      bot.reply(message, 'Here is your movie Poster: ' +base_url+ '' +image_url+ '');
    } else {
      bot.reply(message, 'There was a problem with the API. Sorry:cry: no Movie right now');
    }
  });
});


