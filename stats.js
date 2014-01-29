(function() {
  'use strict';

  var config = require('config');
  var _ = require('lodash');
  _.str = require('underscore.string');
  _.mixin(_.str.exports());
  var numeral = require('numeral');
  var moment = require('moment');
  var Q = require('kew');
  var IncrementedSet = require('./lib/incremented-set');
  var formatter = require('./lib/formatter');

  var stats = {
    startTime: Date.now(),          // when tracking began
    num: 0,                         // number of tweets
    numWithUrl: 0,                  // ... with URL
    numWithPic: 0,                  // ... with picture
    numWithPlace: 0,                // ... with associated location
    numIsReply: 0,                  // ... is a reply
    numIsRetweet: 0,                // ... is a retweet
    tags: new IncrementedSet(),     // hashtags, sorted by popularity
    domains: new IncrementedSet(),  // domains from URLs, sorted by popularity
    langs: new IncrementedSet(),    // languages, sorted by popularity
    countries: new IncrementedSet(),// assoc. countries, sorted by popularity
    sources: new IncrementedSet(),  // sources, sorted by popularity
    users: new IncrementedSet(),    // tweeting users, sorted by popularity
    mentions: new IncrementedSet(), // mentioned users, sorted by popularity
    urls: new IncrementedSet(),     // linked URLs, sorted by popularity
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

    if (hasUrl(tweet))    { stats.numWithUrl++; }
    if (hasPic(tweet))    { stats.numWithPic++; }
    if (isReply(tweet))   { stats.numIsReply++; }
    if (isRetweet(tweet)) { stats.numIsRetweet++; }
    if (hasLang(tweet))   { stats.langs.increment(tweet.lang); }
    if (hasPlace(tweet))  {
      stats.numWithPlace++;
      stats.countries.increment(tweet.place.country_code);
    }

    stats.users.increment(tweet.user.screen_name);

    var source = _.stripTags(tweet.source);
    if (source.indexOf(' ') > 0) {
      source = '"' + source + '"';
    }
    stats.sources.increment(source);

    _.each(tweet.entities.hashtags, function(hashtag) {
      stats.tags.increment(hashtag.text);
    });

    _.each(tweet.entities.urls, function(url) {
      var urlDomain = url.display_url.replace(/\/.*$/, '').toLowerCase();
      stats.domains.increment(urlDomain);
      stats.urls.increment(url.expanded_url);
    });

    _.each(tweet.entities.user_mentions, function(user) {
      stats.mentions.increment(user.screen_name);
    });
  }

  function showStats() {
    cacheStats();
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

    var urlPct = stats.num ? stats.numWithUrl / stats.num : 0;
    var placePct = stats.num ? stats.numWithPlace / stats.num : 0;
    var replyPct = stats.num ? stats.numIsReply / stats.num : 0;
    formatter.writeLn(
      _.lpad('with URL:', 12), _.lpad(numeral(urlPct).format('0.00%'), 6),
      '    ',
      _.lpad('with place:', 12), _.lpad(numeral(placePct).format('0.00%'), 6),
      '    ',
      _.lpad('is a reply:', 12), _.lpad(numeral(replyPct).format('0.00%'), 6)
    );

    var picPct = stats.num ? stats.numWithPic / stats.num : 0;
    var retweetPct = stats.num ? stats.numIsRetweet / stats.num : 0;
    formatter.writeLn(
      _.lpad('with pic:', 12), _.lpad(numeral(picPct).format('0.00%'), 6),
      '    ',
      _.lpad('', 12), '      ', // placeholder for future stat
      '    ',
      _.lpad('is a RT:', 12), _.lpad(numeral(retweetPct).format('0.00%'), 6)
    );

    parts = ['Top Tags:'];
    parts.push.apply(
      parts,
      stats.tags.first(config.ui.numTags).map(function(tag) { return '#' + tag; })
    );
    formatter.writeLn.apply(formatter, parts);

    parts = ['Top Domains:'];
    parts.push.apply(parts, stats.domains.first(config.ui.numDomains));
    formatter.writeLn.apply(formatter, parts);

    parts = ['Top Langs:'];
    parts.push.apply(parts, stats.langs.first(config.ui.numLangs));
    formatter.writeLn.apply(formatter, parts);

    parts = ['Top Countries:'];
    parts.push.apply(parts, stats.countries.first(config.ui.numCountries));
    formatter.writeLn.apply(formatter, parts);

    parts = ['Top Sources:'];
    parts.push.apply(parts, stats.sources.first(config.ui.numSources));
    formatter.writeLn.apply(formatter, parts);

    parts = ['Top Tweeters:'];
    parts.push.apply(
      parts,
      stats.users.first(config.ui.numUsers).map(function(user) { return '@' + user; })
    );
    formatter.writeLn.apply(formatter, parts);

    parts = ['Top Mentions:'];
    parts.push.apply(
      parts,
      stats.mentions.first(config.ui.numUsers).map(function(user) { return '@' + user; })
    );
    formatter.writeLn.apply(formatter, parts);

    var urls = stats.urls.first(config.ui.numUrls);
    formatter.writeLn('Top Links:');
    _.each(urls, function(url) {
      formatter.writeLn('  ' + url);
    });

    formatter.rewind();
  }

  function cacheStats() {
    stats.tags.cache(config.ui.numTags);
    stats.domains.cache(config.ui.numDomains);
    stats.langs.cache(config.ui.numLangs);
    stats.countries.cache(config.ui.numCountries);
    stats.sources.cache(config.ui.numSources);
    stats.users.cache(config.ui.numUsers);
    stats.mentions.cache(config.ui.numUsers);
    stats.urls.cache(config.ui.numUrls);
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

  function hasLang(tweet) {
    return (tweet.lang !== 'und');
  }

  function hasPlace(tweet) {
    return (tweet.place !== null);
  }

  function isReply(tweet) {
    return (tweet.in_reply_to_status_id_str !== null);
  }

  function isRetweet(tweet) {
    return (typeof tweet.retweeted_status !== 'undefined');
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
})();