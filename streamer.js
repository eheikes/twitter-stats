'use strict';

var picDomains = [
  'pic.twitter.com',
  'instagram.com'
];

var stats = {
  startTime: Date.now(),  // when tracking began
  num: 0,                 // number of tweets
  numWithUrl: 0,          // ... with URL
  numWithPic: 0,          // ... with picture
  tags: {},               // hash of hashtags
  domains: {}             // hash of domains
};

var config = require('config');

var Twit = require('twit');
var twitter = new Twit({
  consumer_key:         config.twitter.consumerKey,
  consumer_secret:      config.twitter.consumerSecret,
  access_token:         config.twitter.accessToken,
  access_token_secret:  config.twitter.accessTokenSecret
});

console.log('Initialized...');

var stream = twitter.stream('statuses/sample');
stream.on('tweet', function(tweet) {
  updateStats(tweet);
});

process.on('SIGINT', function() {
  console.log(stats);
  process.exit(0);
});

function updateStats(tweet) {
  stats.num++;

  var urlRegExp = /\bhttp(s?):\/\//;
  if (tweet.text.match(urlRegExp)) { stats.numWithUrl++; }
}
