/**
 * Split into declaration and initialization for better performance.
 */
var validator;
var cheerio;
var graph;
var LastFmNode;
var tumblr;
var foursquare;
var Github;
var Twit;
var stripe;
var twilio;
var Linkedin;
var BitGo;
var clockwork;
var paypal;
var lob;
var ig;
var Y;
var Bitcore;
var BitcoreInsight;
var request;


var _ = require('lodash');
var async = require('async');
var querystring = require('querystring');
var intersections = require('../data/intersections');

var secrets = require('../config/secrets');



/**
 * GET /api
 * List of API examples.
 */
exports.getApi = function(req, res) {
  res.render('api/index', {
    title: 'API Examples'
  });
};

/**
 * GET /api/foursquare
 * Foursquare API example.
 */
exports.getFoursquare = function(req, res, next) {
  foursquare = require('node-foursquare')({ secrets: secrets.foursquare });

  var token = _.find(req.user.tokens, { kind: 'foursquare' });

  var lat = req.param('lat');
  var lng = req.param('lng');

  async.parallel({
    trendingVenues: function(callback) {
      foursquare.Venues.getTrending(lat, lng, { radius: 250 }, token.accessToken, function(err, results) {
        callback(err, results);
      });
     }
  },
  function(err, results) {
    if (err) return next(err);

    res.status('api/foursquare').send({
      title: 'Foursquare API',
      trendingVenues: results.trendingVenues.venues[0].hereNow
    });
  });
};

/**
 * GET /api/tumblr
 * Tumblr API example.
 */
exports.getTumblr = function(req, res, next) {
  tumblr = require('tumblr.js');

  var token = _.find(req.user.tokens, { kind: 'tumblr' });
  var client = tumblr.createClient({
    consumer_key: secrets.tumblr.consumerKey,
    consumer_secret: secrets.tumblr.consumerSecret,
    token: token.accessToken,
    token_secret: token.tokenSecret
  });
  client.posts('withinthisnightmare.tumblr.com', { type: 'photo' }, function(err, data) {
    if (err) return next(err);
    res.render('api/tumblr', {
      title: 'Tumblr API',
      blog: data.blog,
      photoset: data.posts[0].photos
    });
  });
};

/**
 * GET /api/facebook
 * Facebook API example.
 */
exports.getFacebook = function(req, res, next) {
  graph = require('fbgraph');

  var token = _.find(req.user.tokens, { kind: 'facebook' });
  graph.setAccessToken(token.accessToken);
  async.parallel({
    getMe: function(done) {
      graph.get(req.user.facebook, function(err, me) {
        done(err, me);
      });
    },
    getMyFriends: function(done) {
      graph.get(req.user.facebook + '/friends', function(err, friends) {
        done(err, friends.data);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/facebook', {
      title: 'Facebook API',
      me: results.getMe,
      friends: results.getMyFriends
    });
  });
};

/**
 * GET /api/scraping
 * Web scraping example using Cheerio library.
 */
exports.getScraping = function(req, res, next) {
  cheerio = require('cheerio');
  request = require('request');

  request.get('https://news.ycombinator.com/', function(err, request, body) {
    if (err) return next(err);
    var $ = cheerio.load(body);
    var links = [];
    $('.title a[href^="http"], a[href^="https"]').each(function() {
      links.push($(this));
    });
    res.render('api/scraping', {
      title: 'Web Scraping',
      links: links
    });
  });
};

/**
 * GET /api/github
 * GitHub API Example.
 */
exports.getGithub = function(req, res, next) {
  Github = require('github-api');

  var token = _.find(req.user.tokens, { kind: 'github' });
  var github = new Github({ token: token.accessToken });
  var repo = github.getRepo('sahat', 'requirejs-library');
  repo.show(function(err, repo) {
    if (err) return next(err);
    res.render('api/github', {
      title: 'GitHub API',
      repo: repo
    });
  });

};

/**
 * GET /api/aviary
 * Aviary image processing example.
 */
exports.getAviary = function(req, res) {
  res.render('api/aviary', {
    title: 'Aviary API'
  });
};

/**
 * GET /api/nyt
 * New York Times API example.
 */
exports.getNewYorkTimes = function(req, res, next) {
  request = require('request');

  var query = querystring.stringify({ 'api-key': secrets.nyt.key, 'list-name': 'young-adult' });
  var url = 'http://api.nytimes.com/svc/books/v2/lists?' + query;
  request.get(url, function(err, request, body) {
    if (err) return next(err);
    if (request.statusCode === 403) return next(Error('Missing or Invalid New York Times API Key'));
    var bestsellers = JSON.parse(body);
    res.render('api/nyt', {
      title: 'New York Times API',
      books: bestsellers.results
    });
  });
};

/**
 * GET /api/lastfm
 * Last.fm API example.
 */
exports.getLastfm = function(req, res, next) {
  request = require('request');
  LastFmNode = require('lastfm').LastFmNode;

  var lastfm = new LastFmNode(secrets.lastfm);
  async.parallel({
    artistInfo: function(done) {
      lastfm.request('artist.getInfo', {
        artist: 'The Pierces',
        handlers: {
          success: function(data) {
            done(null, data);
          },
          error: function(err) {
            done(err);
          }
        }
      });
    },
    artistTopTracks: function(done) {
      lastfm.request('artist.getTopTracks', {
        artist: 'The Pierces',
        handlers: {
          success: function(data) {
            var tracks = [];
            _.each(data.toptracks.track, function(track) {
              tracks.push(track);
            });
            done(null, tracks.slice(0,10));
          },
          error: function(err) {
            done(err);
          }
        }
      });
    },
    artistTopAlbums: function(done) {
      lastfm.request('artist.getTopAlbums', {
        artist: 'The Pierces',
        handlers: {
          success: function(data) {
            var albums = [];
            _.each(data.topalbums.album, function(album) {
              albums.push(album.image.slice(-1)[0]['#text']);
            });
            done(null, albums.slice(0, 4));
          },
          error: function(err) {
            done(err);
          }
        }
      });
    }
  },
  function(err, results) {
    if (err) return next(err.message);
    var artist = {
      name: results.artistInfo.artist.name,
      image: results.artistInfo.artist.image.slice(-1)[0]['#text'],
      tags: results.artistInfo.artist.tags.tag,
      bio: results.artistInfo.artist.bio.summary,
      stats: results.artistInfo.artist.stats,
      similar: results.artistInfo.artist.similar.artist,
      topAlbums: results.artistTopAlbums,
      topTracks: results.artistTopTracks
    };
    res.render('api/lastfm', {
      title: 'Last.fm API',
      artist: artist
    });
  });
};

exports.getHeat = function(req, res, next) {
  var lat = req.param('lat');
  var lng = req.param('lng');

  var params = {
    lat: lat,
    lng: lng
  };
  res.render('api/heat', {params: params});
}

/**
 * GET /api/twitter
 * Twiter API example.
 */
exports.getTwitter = function(req, res, next) {
  //get data from request
  var data = [
    {lat: 43.64945,lon: -79.37141},
{lat: 43.6504606,lon: -79.3719239},
{lat: 43.6515337,lon: -79.37236},
{lat: 43.6527176,lon: -79.372824},              
{lat: 43.653704,lon: -79.373238},
{lat: 43.655357,lon: -79.373862},
{lat: 43.657052,lon: -79.374531},
{lat: 43.660432,lon: -79.3758537},
{lat: 43.66242,lon: -79.3767079},
{lat: 43.6662894,lon: -79.378325},
{lat: 43.668869,lon: -79.3794158},
{lat: 43.6699892,lon: -79.3799226},
{lat: 43.6715773,lon: -79.38052},
{lat: 43.648513176,lon: -79.373833537},
{lat: 43.6499164,lon: -79.374409},
{lat: 43.651173,lon: -79.374925},
{lat: 43.652441,lon: -79.375448},
{lat: 43.65317,lon: -79.375754},
{lat: 43.654817,lon: -79.376441},
{lat: 43.656499,lon: -79.377127},
{lat: 43.659858,lon: -79.378522},
{lat: 43.661871,lon: -79.379335},
{lat: 43.6657034,lon: -79.380928},
{lat: 43.6710224,lon: -79.383123},
{lat: 43.6506539,lon: -79.377248},
{lat: 43.6519522,lon: -79.377756},
{lat: 43.6526703,lon: -79.378066},
{lat: 43.646846,lon: -79.376931},
{lat: 43.6478484,lon: -79.377351},
{lat: 43.6491624,lon: -79.377904},
{lat: 43.650419,lon: -79.378436},
{lat: 43.651697,lon: -79.378965},
{lat: 43.6524209,lon: -79.379276},
{lat: 43.654066,lon: -79.379957},
{lat: 43.656326,lon: -79.380912},
{lat: 43.6590897,lon: -79.382096},
{lat: 43.6613687,lon: -79.383094},
{lat: 43.6649351,lon: -79.384558},
{lat: 43.670229,lon: -79.386767},
{lat: 43.672879,lon: -79.387845},
{lat: 43.6756028,lon: -79.38895},
{lat: 43.6769762,lon: -79.389534},
{lat: 43.6791392,lon: -79.390424},
{lat: 43.6820226,lon: -79.391574},
{lat: 43.688075,lon: -79.394098},
{lat: 43.6982977,lon: -79.396601},
{lat: 43.702508,lon: -79.397458},
{lat: 43.7067501,lon: -79.398311},
{lat: 43.709554,lon: -79.398943},
{lat: 43.7118551,lon: -79.399437},
{lat: 43.716605,lon: -79.400452},
{lat: 43.7195544,lon: -79.40109},
{lat: 43.721971,lon: -79.401557},
{lat: 43.7251031,lon: -79.402193},
{lat: 43.7278642,lon: -79.40293},
{lat: 43.730913,lon: -79.403788},
{lat: 43.7343677,lon: -79.404585},
{lat: 43.645996,lon: -79.379115},
{lat: 43.647345,lon: -79.379702},
{lat: 43.648653,lon: -79.380268},
{lat: 43.649876,lon: -79.380823},
{lat: 43.6512244,lon: -79.381452},
{lat: 43.65189,lon: -79.381698},
{lat: 43.6529652,lon: -79.382631},
{lat: 43.655721,lon: -79.383734},
{lat: 43.658496,lon: -79.384865},
{lat: 43.6608138,lon: -79.385857},
{lat: 43.664366,lon: -79.387151},
{lat: 43.669701,lon: -79.389468},
{lat: 43.6466383,lon: -79.383007},
{lat: 43.6479338,lon: -79.383531},
{lat: 43.649196,lon: -79.384074},
{lat: 43.6505005,lon: -79.38462},
{lat: 43.645291,lon: -79.382476},
{lat: 43.6464054,lon: -79.384076},
{lat: 43.6476553,lon: -79.384788},
{lat: 43.648857,lon: -79.38548},
{lat: 43.6501396,lon: -79.38624},
{lat: 43.650827,lon: -79.386628},
{lat: 43.654812,lon: -79.388484},
{lat: 43.656323,lon: -79.388959},
{lat: 43.6598474,lon: -79.39049},
{lat: 43.6636098,lon: -79.390626},
{lat: 43.6659353,lon: -79.391879},
{lat: 43.668685,lon: -79.394119},
{lat: 43.7145838,lon: -79.359791},
{lat: 43.713573,lon: -79.364752},
{lat: 43.7125627,lon: -79.369606},
{lat: 43.711056,lon: -79.377114},
{lat: 43.7100093,lon: -79.382221},
{lat: 43.7084166,lon: -79.390153},
{lat: 43.7078669,lon: -79.39279},
{lat: 43.7063458,lon: -79.400252},
{lat: 43.7051068,lon: -79.406125},
{lat: 43.7046104,lon: -79.408474},
{lat: 43.7034761,lon: -79.41388},
{lat: 43.7027131,lon: -79.417444},
{lat: 43.7023611,lon: -79.419081},
{lat: 43.7009757,lon: -79.425534},
{lat: 43.6998248,lon: -79.430961},
{lat: 43.698048,lon: -79.439379},
{lat: 43.6972932,lon: -79.442789},
{lat: 43.696242,lon: -79.447688},
{lat: 43.695684,lon: -79.450293},
{lat: 43.694985,lon: -79.453476},
{lat: 43.672136,lon: -79.395624},
{lat: 43.674705,lon: -79.396651},
{lat: 43.67719,lon: -79.397579},
{lat: 43.6795475,lon: -79.39855},
{lat: 43.6843241,lon: -79.400495},
{lat: 43.686624,lon: -79.401479},
{lat: 43.690773,lon: -79.403027},
{lat: 43.6937297,lon: -79.401852},
{lat: 43.6978798,lon: -79.403231},
{lat: 43.698761,lon: -79.406076},
{lat: 43.710333,lon: -79.411119},
{lat: 43.71696,lon: -79.413444},
{lat: 43.7222401,lon: -79.415589},
{lat: 43.7279,lon: -79.417894},
{lat: 43.7332,lon: -79.41951},
{lat: 43.7359103,lon: -79.4201},
{lat: 43.7398627,lon: -79.421636},
{lat: 43.744121,lon: -79.406724},
{lat: 43.7615144,lon: -79.410903},
{lat: 43.7692945,lon: -79.412931},
{lat: 43.773798,lon: -79.414034},
{lat: 43.7797703,lon: -79.415504},
{lat: 43.7870804,lon: -79.417327},
{lat: 43.7938145,lon: -79.418991},
{lat: 43.798049,lon: -79.420064},
{lat: 43.6745775,lon: -79.380161},
{lat: 43.6883196,lon: -79.383542},
{lat: 43.690374,lon: -79.383288},
{lat: 43.6936038,lon: -79.3846212},
{lat: 43.6982046,lon: -79.386448},
{lat: 43.7003222,lon: -79.386937},
{lat: 43.7043099,lon: -79.388524},
{lat: 43.711129,lon: -79.391181},
{lat: 43.7178824,lon: -79.394131},
{lat: 43.7223099,lon: -79.395694},
{lat: 43.726237038,lon: -79.396790564},
{lat: 43.770604,lon: -79.186884},
{lat: 43.7676558,lon: -79.189555},
{lat: 43.7621101,lon: -79.1947327},
{lat: 43.749649,lon: -79.205992},
{lat: 43.7437557,lon: -79.211651},
{lat: 43.738817,lon: -79.217042},
{lat: 43.725113,lon: -79.232452},
{lat: 43.721858,lon: -79.236215},
{lat: 43.711111,lon: -79.248196},
{lat: 43.7087694,lon: -79.249759},
{lat: 43.703931,lon: -79.252775},
{lat: 43.6930141,lon: -79.262326},
{lat: 43.691469,lon: -79.264762},
{lat: 43.6877698,lon: -79.270928},
{lat: 43.6822709,lon: -79.279219},
{lat: 43.6808074,lon: -79.284041},
{lat: 43.6802604,lon: -79.2907},
{lat: 43.678903,lon: -79.29801},
{lat: 43.67695,lon: -79.304104},
{lat: 43.67394,lon: -79.307902},
{lat: 43.669951,lon: -79.311169},
{lat: 43.718239,lon: -79.240372},
{lat: 43.672219,lon: -79.384788},
{lat: 43.653099,lon: -79.387585},
{lat: 43.694104,lon: -79.366284},
{lat: 43.666345,lon: -79.316558},
{lat: 43.6967298,lon: -79.371732},
{lat: 43.70096,lon: -79.373324},
{lat: 43.7042575,lon: -79.374587},
{lat: 43.7069178,lon: -79.375617},
{lat: 43.6825716,lon: -79.39976},
{lat: 43.6573374,lon: -79.356489},
{lat: 43.659502,lon: -79.357445}
  ];
  
  var result = [];

  // pull module and authentication
  var Twitter = require('twitter');
  var token = _.find(req.user.tokens, { kind: 'twitter' });
  var client = new Twitter({
    consumer_key: secrets.twitter.consumerKey,
    consumer_secret: secrets.twitter.consumerSecret,
    access_token_key: token.accessToken,
    access_token_secret: token.tokenSecret
  });

  
  async.each(data, function (datum, callback) {
    //search by name
    var params = {
                  q: "",
                  count: 100,
                  geocode: "" + datum["lat"] + "," + datum["lon"] + ",.5km"
                };

                console.log(params);

    client.get('search/tweets', params, function(error, tweets, response){
      if (!error) {
        for(var i = 0; i < tweets["statuses"].length; i++) {
          var tweet = tweets["statuses"][i];

          if(!tweet["geo"] || !tweet["geo"]["coordinates"]) {
            continue;
          }

          var point = {
            intersectionlat : datum["lat"],
            intersectionlon : datum["lon"],
            tweetlat : tweet["geo"]["coordinates"][0],
            tweetlon : tweet["geo"]["coordinates"][1],
            text : tweet["text"],
            time : tweet["created_at"]
          }

          result.push(point);
        }

        callback();
      }
    });

      

  }, function(err) {
    res.send(result);
  });
};

/**
 * GET /api/steam
 * Steam API example.
 */
exports.getSteam = function(req, res, next) {
  request = require('request');

  var steamId = '76561197982488301';
  var query = { l: 'english', steamid: steamId, key: secrets.steam.apiKey };
  async.parallel({
    playerAchievements: function(done) {
      query.appid = '49520';
      var qs = querystring.stringify(query);
      request.get({ url: 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?' + qs, json: true }, function(error, request, body) {
        if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
        done(error, body);
      });
    },
    playerSummaries: function(done) {
      query.steamids = steamId;
      var qs = querystring.stringify(query);
      request.get({ url: 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?' + qs, json: true }, function(err, request, body) {
        if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
        done(err, body);
      });
    },
    ownedGames: function(done) {
      query.include_appinfo = 1;
      query.include_played_free_games = 1;
      var qs = querystring.stringify(query);
      request.get({ url: 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?' + qs, json: true }, function(err, request, body) {
        if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
        done(err, body);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/steam', {
      title: 'Steam Web API',
      ownedGames: results.ownedGames.response.games,
      playerAchievemments: results.playerAchievements.playerstats,
      playerSummary: results.playerSummaries.response.players[0]
    });
  });
};

/**
 * GET /api/stripe
 * Stripe API example.
 */
exports.getStripe = function(req, res) {
  stripe = require('stripe')(secrets.stripe.secretKey);

  res.render('api/stripe', {
    title: 'Stripe API',
    publishableKey: secrets.stripe.publishableKey
  });
};

/**
 * POST /api/stripe
 * Make a payment.
 */
exports.postStripe = function(req, res, next) {
  var stripeToken = req.body.stripeToken;
  var stripeEmail = req.body.stripeEmail;
  stripe.charges.create({
    amount: 395,
    currency: 'usd',
    source: stripeToken,
    description: stripeEmail
  }, function(err, charge) {
    if (err && err.type === 'StripeCardError') {
      req.flash('errors', { msg: 'Your card has been declined.' });
      res.redirect('/api/stripe');
    }
    req.flash('success', { msg: 'Your card has been charged successfully.' });
    res.redirect('/api/stripe');
  });
};

/**
 * GET /api/twilio
 * Twilio API example.
 */
exports.getTwilio = function(req, res) {
  twilio = require('twilio')(secrets.twilio.sid, secrets.twilio.token);

  res.render('api/twilio', {
    title: 'Twilio API'
  });
};

/**
 * POST /api/twilio
 * Send a text message using Twilio.
 */
exports.postTwilio = function(req, res, next) {
  req.assert('number', 'Phone number is required.').notEmpty();
  req.assert('message', 'Message cannot be blank.').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/api/twilio');
  }
  var message = {
    to: req.body.number,
    from: '+13472235148',
    body: req.body.message
  };
  twilio.sendMessage(message, function(err, responseData) {
    if (err) return next(err.message);
    req.flash('success', { msg: 'Text sent to ' + responseData.to + '.'});
    res.redirect('/api/twilio');
  });
};

/**
 * GET /api/clockwork
 * Clockwork SMS API example.
 */
exports.getClockwork = function(req, res) {
  clockwork = require('clockwork')({ key: secrets.clockwork.apiKey });

  res.render('api/clockwork', {
    title: 'Clockwork SMS API'
  });
};

/**
 * POST /api/clockwork
 * Send a text message using Clockwork SMS
 */
exports.postClockwork = function(req, res, next) {
  var message = {
    To: req.body.telephone,
    From: 'Hackathon',
    Content: 'Hello from the Hackathon Starter'
  };
  clockwork.sendSms(message, function(err, responseData) {
    if (err) return next(err.errDesc);
    req.flash('success', { msg: 'Text sent to ' + responseData.responses[0].to });
    res.redirect('/api/clockwork');
  });
};

/**
 * GET /api/venmo
 * Venmo API example.
 */
exports.getVenmo = function(req, res, next) {
  request = require('request');

  var token = _.find(req.user.tokens, { kind: 'venmo' });
  var query = querystring.stringify({ access_token: token.accessToken });
  async.parallel({
    getProfile: function(done) {
      request.get({ url: 'https://api.venmo.com/v1/me?' + query, json: true }, function(err, request, body) {
        done(err, body);
      });
    },
    getRecentPayments: function(done) {
      request.get({ url: 'https://api.venmo.com/v1/payments?' + query, json: true }, function(err, request, body) {
        done(err, body);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/venmo', {
      title: 'Venmo API',
      profile: results.getProfile.data,
      recentPayments: results.getRecentPayments.data
    });
  });
};

/**
 * POST /api/venmo
 * Send money.
 */
exports.postVenmo = function(req, res, next) {
  validator = require('validator');

  req.assert('user', 'Phone, Email or Venmo User ID cannot be blank').notEmpty();
  req.assert('note', 'Please enter a message to accompany the payment').notEmpty();
  req.assert('amount', 'The amount you want to pay cannot be blank').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/api/venmo');
  }
  var token = _.find(req.user.tokens, { kind: 'venmo' });
  var formData = {
    access_token: token.accessToken,
    note: req.body.note,
    amount: req.body.amount
  };
  if (validator.isEmail(req.body.user)) {
    formData.email = req.body.user;
  } else if (validator.isNumeric(req.body.user) &&
    validator.isLength(req.body.user, 10, 11)) {
    formData.phone = req.body.user;
  } else {
    formData.user_id = req.body.user;
  }
  request.post('https://api.venmo.com/v1/payments', { form: formData }, function(err, request, body) {
    if (err) return next(err);
    if (request.statusCode !== 200) {
      req.flash('errors', { msg: JSON.parse(body).error.message });
      return res.redirect('/api/venmo');
    }
    req.flash('success', { msg: 'Venmo money transfer complete' });
    res.redirect('/api/venmo');
  });
};

/**
 * GET /api/linkedin
 * LinkedIn API example.
 */
exports.getLinkedin = function(req, res, next) {
  Linkedin = require('node-linkedin')(secrets.linkedin.clientID, secrets.linkedin.clientSecret, secrets.linkedin.callbackURL);

  var token = _.find(req.user.tokens, { kind: 'linkedin' });
  var linkedin = Linkedin.init(token.accessToken);
  linkedin.people.me(function(err, $in) {
    if (err) return next(err);
    res.render('api/linkedin', {
      title: 'LinkedIn API',
      profile: $in
    });
  });
};

/**
 * GET /api/instagram
 * Instagram API example.
 */
exports.getInstagram = function(req, res, next) {
  var obj = [];
  var count = 0;
  ig = require('instagram-node').instagram();

  ig.use({ client_id: secrets.instagram.clientID, client_secret: secrets.instagram.clientSecret });
  ig.use({ access_token: secrets.instagram.accessToken });

  async.each(intersections,function(item, callback){
  		ig.media_search(item.lat, item.lon, {distance: 500},function(err, medias, remaining, limit){
			for (x=0; x<medias.length; x++){
				obj.push([item.lat, item.lon, medias[x].location.latitude, medias[x].location.longitude, medias[x].tags]);
			}
			count++;
			console.log(count);
			callback();
  		});
	},
  function(err){
	 res.status('api/instagram').send(
		obj
	);
  });
}
  	/*}
  }, function(err, results) {
    if (err) return next(err);
	
	for (x=0; x<results.mediaSearch.length; x++){
		var fin = {};
		//fin['tags']=results.mediaSearch[x].tags;
		//fin['location']=results.mediaSearch[x].location;
		obj.push([results.mediaSearch[x].location.latitude, results.mediaSearch[x].location.longitude]);
	}
	
    res.status('api/instagram').send(
		obj
	);
  });
};

/**
 * GET /api/yahoo
 * Yahoo API example.
 */
exports.getYahoo = function(req, res) {
  Y = require('yui/yql');

  Y.YQL('SELECT * FROM weather.forecast WHERE (location = 10007)', function(response) {
    var location = response.query.results.channel.location;
    var condition = response.query.results.channel.item.condition;
    res.render('api/yahoo', {
      title: 'Yahoo API',
      location: location,
      condition: condition
    });
  });
};

/**
 * GET /api/paypal
 * PayPal SDK example.
 */
exports.getPayPal = function(req, res, next) {
  paypal = require('paypal-rest-sdk');

  paypal.configure({
    mode: 'sandbox',
    client_id: secrets.paypal.client_id,
    client_secret: secrets.paypal.client_secret
  });

  var paymentDetails = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: secrets.paypal.returnUrl,
      cancel_url: secrets.paypal.cancelUrl
    },
    transactions: [{
      description: 'Hackathon Starter',
      amount: {
        currency: 'USD',
        total: '1.99'
      }
    }]
  };

  paypal.payment.create(paymentDetails, function(err, payment) {
    if (err) return next(err);
    req.session.paymentId = payment.id;
    var links = payment.links;
    for (var i = 0; i < links.length; i++) {
      if (links[i].rel === 'approval_url') {
        res.render('api/paypal', {
          approvalUrl: links[i].href
        });
      }
    }
  });
};

/**
 * GET /api/paypal/success
 * PayPal SDK example.
 */
exports.getPayPalSuccess = function(req, res) {
  var paymentId = req.session.paymentId;
  var paymentDetails = { payer_id: req.query.PayerID };
  paypal.payment.execute(paymentId, paymentDetails, function(err) {
    if (err) {
      res.render('api/paypal', {
        result: true,
        success: false
      });
    } else {
      res.render('api/paypal', {
        result: true,
        success: true
      });
    }
  });
};

/**
 * GET /api/paypal/cancel
 * PayPal SDK example.
 */
exports.getPayPalCancel = function(req, res) {
  req.session.paymentId = null;
  res.render('api/paypal', {
    result: true,
    canceled: true
  });
};

/**
 * GET /api/lob
 * Lob API example.
 */
exports.getLob = function(req, res, next) {
  lob = require('lob')(secrets.lob.apiKey);

  lob.routes.list({
    zip_codes: ['10007']
  }, function(err, routes) {
    if(err) return next(err);
    res.render('api/lob', {
      title: 'Lob API',
      routes: routes.data[0].routes
    });
  });
};

/**
 * GET /api/bitgo
 * BitGo wallet example
 */
exports.getBitGo = function(req, res, next) {
  BitGo = require('bitgo');

  var bitgo = new BitGo.BitGo({ env: 'test', accessToken: secrets.bitgo.accessToken });
  var walletId = req.session.walletId;

  var renderWalletInfo = function(walletId) {
    bitgo.wallets().get({ id: walletId }, function(err, walletResponse) {
      walletResponse.createAddress({}, function(err, addressResponse) {
        walletResponse.transactions({}, function(err, transactionsResponse) {
          res.render('api/bitgo', {
            title: 'BitGo API',
            wallet: walletResponse.wallet,
            address: addressResponse.address,
            transactions: transactionsResponse.transactions
          });
        });
      });
    });
  };

  if (walletId) {
    renderWalletInfo(walletId);
  } else {
    bitgo.wallets().createWalletWithKeychains({
        passphrase: req.sessionID, // change this!
        label: 'wallet for session ' + req.sessionID,
        backupXpub: 'xpub6AHA9hZDN11k2ijHMeS5QqHx2KP9aMBRhTDqANMnwVtdyw2TDYRmF8PjpvwUFcL1Et8Hj59S3gTSMcUQ5gAqTz3Wd8EsMTmF3DChhqPQBnU'
      }, function(err, res) {
        req.session.walletId = res.wallet.wallet.id;
        renderWalletInfo(req.session.walletId);
      }
    );
  }
};


/**
 * POST /api/bitgo
 * BitGo send coins example
 */
exports.postBitGo = function(req, res, next) {
  var bitgo = new BitGo.BitGo({ env: 'test', accessToken: secrets.bitgo.accessToken });
  var walletId = req.session.walletId;

  try {
    bitgo.wallets().get({ id: walletId }, function(err, wallet) {
      wallet.sendCoins({
        address: req.body.address,
        amount: parseInt(req.body.amount),
        walletPassphrase: req.sessionID
      }, function(err, result) {
        if (err) {
          req.flash('errors', { msg: err.message });
          return res.redirect('/api/bitgo');
        }
        req.flash('info', { msg: 'txid: ' + result.hash + ', hex: ' + result.tx });
        return res.redirect('/api/bitgo');
      });
    });
  } catch (e) {
    req.flash('errors', { msg: e.message });
    return res.redirect('/api/bitgo');
  }
};


/**
 * GET /api/bicore
 * Bitcore example
 */
exports.getBitcore = function(req, res, next) {
  Bitcore = require('bitcore');
  Bitcore.Networks.defaultNetwork = secrets.bitcore.bitcoinNetwork == 'testnet' ? Bitcore.Networks.testnet : Bitcore.Networks.mainnet;

  try {
    var privateKey;

    if (req.session.bitcorePrivateKeyWIF) {
      privateKey = Bitcore.PrivateKey.fromWIF(req.session.bitcorePrivateKeyWIF);
    } else {
      privateKey = new Bitcore.PrivateKey();
      req.session.bitcorePrivateKeyWIF = privateKey.toWIF();
      req.flash('info', {
        msg: 'A new ' + secrets.bitcore.bitcoinNetwork + ' private key has been created for you and is stored in ' +
        'req.session.bitcorePrivateKeyWIF. Unless you changed the Bitcoin network near the require bitcore line, ' +
        'this is a testnet address.'
      });
    }

    var myAddress = privateKey.toAddress();
    var bitcoreUTXOAddress = '';

    if (req.session.bitcoreUTXOAddress)
      bitcoreUTXOAddress = req.session.bitcoreUTXOAddress;
    res.render('api/bitcore', {
      title: 'Bitcore API',
      network: secrets.bitcore.bitcoinNetwork,
      address: myAddress,
      getUTXOAddress: bitcoreUTXOAddress
    });
  } catch (e) {
    req.flash('errors', { msg: e.message });
    return next(e);
  }
};

/**
 * POST /api/bitcore
 * Bitcore send coins example
 */
exports.postBitcore = function(req, res, next) {
  BitcoreInsight = require('bitcore-explorers').Insight;

  try {
    var getUTXOAddress;

    if (req.body.address) {
      getUTXOAddress = req.body.address;
      req.session.bitcoreUTXOAddress = getUTXOAddress;
    } else if (req.session.bitcoreUTXOAddress) {
      getUTXOAddress = req.session.bitcoreUTXOAddress;
    } else {
      getUTXOAddress = '';
    }

    var myAddress;

    if (req.session.bitcorePrivateKeyWIF) {
      myAddress = Bitcore.PrivateKey.fromWIF(req.session.bitcorePrivateKeyWIF).toAddress();
    } else {
      myAddress = '';
    }

    var insight = new BitcoreInsight();

    insight.getUnspentUtxos(getUTXOAddress, function(err, utxos) {
      if (err) {
        req.flash('errors', { msg: err.message });
        return next(err);
      } else {
        req.flash('info', { msg: 'UTXO information obtained from the Bitcoin network via Bitpay Insight. You can use your own full Bitcoin node.' });

        // Results are in the form of an array of items which need to be turned into JS objects.
        for (var i = 0; i < utxos.length; ++i) {
          utxos[i] = utxos[i].toObject();
        }

        res.render('api/bitcore', {
          title: 'Bitcore API',
          myAddress: myAddress,
          getUTXOAddress: getUTXOAddress,
          utxos: utxos,
          network: secrets.bitcore.bitcoinNetwork
        });
      }
    });
  } catch (e) {
    req.flash('errors', { msg: e.message });
    return next(e);
  }
};

/**
* GET Google Places
*/
exports.getGooglePlaces = function(req, res, next) {

    var PlaceSearch = require("googleplaces//lib/PlaceSearch.js");
    var PlaceDetailsRequest = require("googleplaces/lib/PlaceDetailsRequest.js");

    var placeSearch = new PlaceSearch(secrets.googleplaces.apiKey, "json");
    var placeDetailsRequest = new PlaceDetailsRequest(secrets.googleplaces.apiKey, "json");



    var parameters = {
      location: [req.param('lng'), req.param('lat')],
      radius: 100
    };

    placeSearch(parameters, function (error, response) {
        placeDetailsRequest({reference: response.results[1].reference}, function (error, response) {
          res.status('api/places').send(response);
        });
    });

    
};







