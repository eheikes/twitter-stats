'use strict';

var config = require('config');
var _ = require('lodash');
var numeral = require('numeral');
var moment = require('moment');
var IncrementedSet = require('./lib/incremented-set');
var formatter = require('./lib/formatter');

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
  var parts = [];
  formatter.start();

  var uptime = moment(stats.startTime).fromNow();
  formatter.writeLn(' === Twitter Stats (since ' + uptime + ') ===');

  var tweetFormat = stats.num < 1000 ? '0' : '0,0.00a';
  var per = getThroughput();
  parts = [
    numeral(stats.num).format(tweetFormat) + ' tweets',
    '(' + numeral(per.sec).format('0,0.00') + '/sec,',
    numeral(per.min).format('0,0') + '/min,',
    numeral(per.hr).format('0,0') + '/hour)'
  ];
  formatter.writeLn.apply(formatter, parts);

  var pct = stats.num ? stats.numWithUrl / stats.num : 0;
  formatter.writeLn('with URL:', numeral(pct).format('0,0.00%'));

  pct = stats.num ? stats.numWithPic / stats.num : 0;
  formatter.writeLn('with pic:', numeral(pct).format('0,0.00%'));

  parts = ['Top Tags:'];
  parts.push.apply(
    parts,
    stats.tags.first(config.ui.numTags).map(function(tag) { return '#' + tag; })
  );
  formatter.writeLn.apply(formatter, parts);

  parts = ['Top Domains:'];
  parts.push.apply(parts, stats.domains.first(config.ui.numDomains));
  formatter.writeLn.apply(formatter, parts);

  formatter.rewind();
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
