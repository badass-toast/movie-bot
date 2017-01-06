var Botkit = require('./node_modules/botkit/lib/Botkit.js');

if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}


var controller = Botkit.slackbot({
  json_file_store: './db_slackbutton_bot/', interactive_replies: true, debug: false
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

var request = require("request");
var base_url = "https://image.tmdb.org/t/p/w185";

controller.hears(['movie (.*)'], ['ambient,message_received'], function(bot, message) {
  var movie_search_title = message.match[1];
  var url_query = "https://api.themoviedb.org/3/search/movie?api_key=87a3acc12bd88c311e7dcc9c41542560&query=" +movie_search_title+ "";

  request({ url: url_query, json: true }, function (error, response, body) {
    var movies = body.results;

    if (movies.length === 1) {
      var movie_id_gen = body.results[0].id;
      var url_id = "https://api.themoviedb.org/3/movie/" +movie_id_gen+ "?api_key=87a3acc12bd88c311e7dcc9c41542560&language=en-US";
      request({ url: url_id, json: true }, function (error, response, body) {
        bot.reply(message, generate_movie_text(body));
      })
    }else if(body.total_results === 0) {
        bot.reply(message, 'I wasn\'t able to find any movies by that name:sweat:. Please try to be more specific');
    }else{
      bot.reply(message, {
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
});

controller.on('interactive_message_callback', function(bot, message) {
  var movie_id = message.actions[0].value;
  var url_id_call = "https://api.themoviedb.org/3/movie/" +movie_id+ "?api_key=87a3acc12bd88c311e7dcc9c41542560&language=en-US";
  request({ url: url_id_call, json: true }, function (error, response, body) {
    var movie_text = generate_movie_text(body);
    bot.reply(message, {
      text: movie_text
    });
    bot.api.chat.delete({
      ts: message.message_ts,
      channel: message.channel
    });
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
    homepage = 'There is ni website for this movie!';
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

