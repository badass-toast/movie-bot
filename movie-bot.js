var Botkit = require('botkit');

if (!process.env.clientId) {
  console.log('Error: Specify client Id in environment')
} else if (!process.env.clientSecret) {
  console.log('Error: Specify client secret in environment')
} else if (!process.env.verfToken) {
  console.log('Error: Specify Verification token in environment')
}  else if (!process.env.port) {
  console.log('Error: Specify port in environment')
}

if (!process.env.clientId || !process.env.clientSecret || !process.env.verfToken|| !process.env.port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
}

var controller = Botkit.slackbot({
  json_file_store: '../tmp/db_slackbutton_slashcommand/',
}).configureSlackApp({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  scopes: ['commands']
});


controller.setupWebserver(process.env.port,function(err,webserver) {

  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});

var request = require('request');
var base_url = 'https://image.tmdb.org/t/p/w185';

controller.on('slash_command', function (slashCommand, message) {
  switch (message.command) {
    case '/movie':
      if (message.token !== process.env.verfToken) return;
      if (message.text === '') {
        slashCommand.replyPrivate(message, 'I give you back a movie with all information according to your search word! Try type \n`/movie star wars episode 4` :smile: \n You have to be very specific!');
        return;
      }else if(message.text !== '') {
        var movie_search_title = message.text;
        var url_query = 'https://api.themoviedb.org/3/search/movie?api_key=87a3acc12bd88c311e7dcc9c41542560&query=' +movie_search_title+ '';

        request({ url: url_query, json: true }, function (error, response, body) {
          var movies = body.results;

          if (movies.length !== 0) {
            var movie_id_gen = body.results[0].id;
            var url_id = 'https://api.themoviedb.org/3/movie/' +movie_id_gen+ '?api_key=87a3acc12bd88c311e7dcc9c41542560&language=en-US';
            request({ url: url_id, json: true }, function (error, response, body) {
              slashCommand.replyPublic(message, generate_movie_text(body));
            });
          }else if(body.total_results === 0) {
            slashCommand.replyPrivate(message, 'I wasn\'t able to find any movies by that name:sweat:. Please try to be more specific');
          }
        });
      }

      break;

    default:
      slashCommand.replyPrivate(message, 'Darn something went wrong. Sorry...');

  }

})
;

function generate_movie_text(movies){
  var image_url = movies.poster_path;
  var discription = movies.overview;
  var release_uncut = movies.release_date;
  var release = release_uncut.substring(0, 4);
  var vote = movies.vote_average;
  var genre_id = '';
  if(movies.genres[0] === undefined){
    genre_id = 'Who knows?';
  }else if(movies.genres[0].name !== undefined){
    genre_id = movies.genres[0].name;
  }
  var time_unfunc = movies.runtime;
  var runtime = time_func(time_unfunc);
  var homepage = '';
  var more = '';
  if (movies.homepage !== '') {
    homepage = movies.homepage.substring(7);
    more = 'More--> ';
  }
  return {
    "attachments": [
      {
        "fallback": "This is required so what...",
        "color": "#4FCEAD",
        "title": "" +movies.title+"",
        "text": "" +movies.overview+ "",
        "fields": [
          {
            "title": "Information",
            "value": "" +genre_id+ " ‧ " +release+ " ‧ " +vote+ "/10 ‧ " +runtime+ "\n" +more+ "" +homepage+ ""
          }
        ],
        "image_url": ""+base_url+ "" +image_url+ "",
        "footer": "Movie Bot by Matteo Piatti",
        "footer_icon": "https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2017-01-04/123219148900_1c45aa7f55e1af5797a0_72.png"
      }
    ]
  }
  //return (''+base_url+ '' +image_url+ '\n*' +movie_title+ '*\n' +discription+ '\n _' +genre_id+ ' ‧ ' +release+ ' ‧ ' +vote+ '/10 ‧ ' +runtime+ '_\n' +more+ '' +homepage+ '');
}


function time_func(time) {
  var hours = Math.trunc(time/60);
  var minutes = time % 60;
  return '' +hours+ 'h ' +minutes+ 'm';
}
