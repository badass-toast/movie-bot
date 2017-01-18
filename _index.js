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

controller.hears(['movie search (.*)'], ['ambient,message_received'], function(bot, message) {
    var request = require("request");
    var query = message.match[1];
    var url = "https://api.themoviedb.org/3/search/movie?api_key=87a3acc12bd88c311e7dcc9c41542560&query=" +query+ "";
    var base_url = "https://image.tmdb.org/t/p/w185";

    request({ url: url, json: true }, function (error, response, body) {
      if(body.total_results != 0) {
        console.log('bla');
        var image_url = body.results[0].poster_path;
        var movie_title = body.results[0].title;
        var discription = body.results[0].overview;
        var release_uncut = body.results[0].release_date;
        var release = release_uncut.substring(0, 4);
        var vote = body.results[0].vote_average;
        var genre_id = body.results[0].genre_ids[0];
        var genre = genre_find(genre_id);
        if (!error && response.statusCode === 200) {
          bot.reply(message, '///////////////////////////////////////////////////////////////////////////////////////////////////////////////');
          bot.reply(message, '' + base_url + '' + image_url + '');
          bot.reply(message, '*' + movie_title + '*');
          bot.reply(message, '' + discription + '');
          bot.reply(message, '_' + genre + ' ‧ ' + release + ' ‧ ' + vote + '/10_');
          bot.reply(message, {attachments: [{title: 'Do you searched for this movie?',callback_id: '123',attachment_type: 'default',actions: [{"name": "yes", "text": "yes thx", "value": "yes", "type": "button"}, {"name": "no","text": "no, next","value": "no", "type": "button"}]}]});
          bot.reply(message, '///////////////////////////////////////////////////////////////////////////////////////////////////////////////');
        } else {
          bot.reply(message, 'There was a problem with the API. Sorry:cry: no Movie right now');
        }
      } else if(body.total_results == 0){
        bot.reply(message, 'I wasn\'t able to find this movie:sweat: I am very sorry:cry:');
      }
    });
});

function genre_find(genre_id) {
  switch (genre_id) {
    case 28:
      return 'Action';
      break;
    case 12:
      return 'Adventure';
      break;
    case 16:
      return 'Animation';
      break;
    case 35:
      return 'Comedy';
      break;
    case 80:
      return 'Crime';
      break;
    case 99:
      return 'Documentary';
      break;
    case 18:
      return 'Drama';
      break;
    case 10751:
      return 'Family';
      break;
    case 14:
      return 'Fantasy';
      break;
    case 36:
      return 'History';
      break;
    case 27:
      return 'Horror';
      break;
    case 10402:
      return 'Music';
      break;
    case 9648:
      return 'Mystery';
      break;
    case 10749:
      return 'Romance';
      break;
    case 878:
      return 'Science Fiction';
      break;
    case 10770:
      return 'TV Movie';
      break;
    case 53:
      return 'Thriller';
      break;
    case 10752:
      return 'War';
      break;
    case 37:
      return 'Western';
      break;
  }
}


