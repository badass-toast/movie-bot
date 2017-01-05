var Botkit = require('./node_modules/botkit/lib/Botkit.js');

if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}


var controller = Botkit.slackbot({
  json_file_store: './db_slackbutton_bot/', interactive_replies: true,
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    redirectUri: 'http://localhost:3002',
    scopes: ['bot', 'commands'],
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


controller.hears(['movie (.*)'], ['ambient,message_received'], function(bot, message) {
  var movie_search_title = message.match[1];
  var request = require("request");
  var url = "https://api.themoviedb.org/3/search/movie?api_key=87a3acc12bd88c311e7dcc9c41542560&query=" +movie_search_title+ "";

  request({ url: url, json: true }, function (error, response, body) {
    var movies = body.results;

    if (movies.length === 1) {
      var movie_text = generate_movie_text(movies[0]);
      bot.reply(message, movie_text);
    }else {
      bot.reply(message, 'worked');
    }
  });
});

function generate_movie_text(title){
  return title.title
}

/*var request = require("request");
var query = message.match[1];
var url = "https://api.themoviedb.org/3/search/movie?api_key=87a3acc12bd88c311e7dcc9c41542560&query=" +query+ "";
var base_url = "https://image.tmdb.org/t/p/w185";

request({ url: url, json: true }, function (error, response, body) {
  if(body.total_results != 0) {
    var image_url = body.results[0].poster_path;
    var movie_title = body.results[0].title;
    var discription = body.results[0].overview;
    var release_uncut = body.results[0].release_date;
    var release = release_uncut.substring(0, 4);
    var vote = body.results[0].vote_average;
    var genre_id = body.results[0].genre_ids[0];
    var genre = genre_find(genre_id);
    if (!error && response.statusCode === 200) {
      bot.reply(message, '' + base_url + '' + image_url + '');
      bot.reply(message, '*' + movie_title + '*');
      bot.reply(message, '' + discription + '');
      bot.reply(message, '_' + genre + ' ‧ ' + release + ' ‧ ' + vote + '/10_');
    } else if(body.total_results == 0){
      bot.reply(message, 'I wasn\'t able to find this movie:sweat: I am very sorry:cry:');
    }
  });*/

/*function genre_find(genre_id) {
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
}*/

