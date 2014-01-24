'use strict';

var config = require('config');
var _ = require('lodash');
var numeral = require('numeral');
var moment = require('moment');
var IncrementedSet = require('./lib/incremented-set');

var stats = {
  startTime: Date.now(),        // when tracking began
  num: 0,                       // number of tweets
  numWithUrl: 0,                // ... with URL
  numWithPic: 0,                // ... with picture
  tags: new IncrementedSet(),   // hashtags, sorted by popularity
  domains: new IncrementedSet() // domains from URLs, sorted by popularity
};

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

  _.each(tweet.entities.hashtags, function(hashtag) {
    stats.tags.increment(hashtag.text);
  });

  _.each(tweet.entities.urls, function(url) {
    var urlDomain = url.display_url.replace(/\/.*$/, '').toLowerCase();
    stats.domains.increment(urlDomain);
  });
}

function showStats() {
  var uptime = moment(stats.startTime).fromNow();
  program.write(' === Twitter Stats (since ' + uptime + ') ===');
  program.newline();

  var tweetFormat = stats.num < 1000 ? '0' : '0,0.00a';
  var per = getThroughput();
  program.write(numeral(stats.num).format(tweetFormat) + ' tweets ');
  program.write('(');
  program.write(numeral(per.sec).format('0,0.00') + '/sec, ');
  program.write(numeral(per.min).format('0,0') + '/min, ');
  program.write(numeral(per.hr).format('0,0') + '/hour');
  program.write(')');
  program.newline();

  var pct = stats.num ? stats.numWithUrl / stats.num : 0;
  program.write('with URL: ');
  program.write(numeral(pct).format('0,0.00%'));
  program.newline();

  pct = stats.num ? stats.numWithPic / stats.num : 0;
  program.write('with pic: ');
  program.write(numeral(pct).format('0,0.00%'));
  program.newline();

  program.write('Top Tags: ');
  _.each(stats.tags.first(config.ui.numTags), function(tag) {
    program.write('#' + tag + ' ');
  });
  program.newline();

  program.write('Top Domains: ');
  _.each(stats.domains.first(config.ui.numDomains), function(domain) {
    program.write(domain + ' ');
  });
  program.newline();

  program.up(6);
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
