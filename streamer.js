'use strict';

var stats = {
  startTime: Date.now(),  // when tracking began
  num: 0,                 // number of tweets
  numWithUrl: 0,          // ... with URL
  numWithPic: 0,          // ... with picture
  tags: {},               // hash of hashtags
  domains: {}             // hash of domains
};

var config = require('config');
var sprintf = require('sprintf-js').sprintf;
var _ = require('lodash');

var Twit = require('twit');
var twitter = new Twit({
  consumer_key:         config.twitter.consumerKey,
  consumer_secret:      config.twitter.consumerSecret,
  access_token:         config.twitter.accessToken,
  access_token_secret:  config.twitter.accessTokenSecret
});

var blessed = require('blessed');
var program = blessed.program();

showStats();
setInterval(showStats, config.ui.updateInterval * 1000);

var stream = twitter.stream('statuses/sample');
stream.on('tweet', function(tweet) {
  updateStats(tweet);
});

process.on('SIGINT', function() {
  process.exit(0);
});

function updateStats(tweet) {
  stats.num++;

  if (hasUrl(tweet)) { stats.numWithUrl++; }
  if (hasPic(tweet)) { stats.numWithPic++; }
}

function showStats() {
  var per = getThroughput();
  program.write(sprintf('%u tweets', stats.num));
  program.write(sprintf(' (%.2f/sec, %.2f/min, %.2f/hour)', per.sec, per.min, per.hr));
  program.newline();

  program.write(sprintf('with URL: %.2f%%', stats.numWithUrl / stats.num * 100));
  program.newline();

  program.write(sprintf('with pic: %.2f%%', stats.numWithPic / stats.num * 100));
  program.newline();

  program.up(3);
}

function hasUrl(tweet) {
  return (tweet.entities.urls.length > 0);
}

function hasPic(tweet) {
  if (_.detect(tweet.entities.media, isPhotoMedia)) {
    return true;
  }

  if (_.detect(tweet.entities.urls, isPhotoUrl)) {
    return true;
  }

  return false;
}

function isPhotoMedia(mediaItem) {
  if (mediaItem.type === 'photo') {
    return true;
  }
  return false;
}

function isPhotoUrl(urlItem) {
  var domains = [
    'instagram.com'
  ];

  var urlDomain = urlItem.display_url.replace(/\/.*$/, '');
  if (_.contains(domains, urlDomain)) {
    return true;
  }
  return false;
}

function getThroughput() {
  var tp = {
    sec: 0,
    min: 0,
    hr:  0
  };
  var intervalSecs = (Date.now() - stats.startTime) / 1000;
  tp.sec = stats.num / intervalSecs;
  tp.min = tp.sec * 60;
  tp.hr  = tp.min * 60;
  return tp;
}
