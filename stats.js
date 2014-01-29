(function() {
  'use strict';

  var config = require('config');

  var Stats = require('./lib/twitter-stats');
  var stats = new Stats();

  var Twit = require('twit');
  var twitter = new Twit({
    consumer_key:         config.twitter.consumerKey,
    consumer_secret:      config.twitter.consumerSecret,
    access_token:         config.twitter.accessToken,
    access_token_secret:  config.twitter.accessTokenSecret
  });

  stats.show();
  setInterval(
    function() { stats.show(); },
    config.ui.updateInterval * 1000
  );

  var stream = twitter.stream('statuses/sample');
  stream.on('tweet', function(tweet) {
    stats.update(tweet);
  });

  process.on('SIGINT', function() {
    process.exit(0);
  });

})();
