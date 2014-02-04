module.exports = (function() {
  'use strict';

  var config = require('config');
  var _ = require('lodash');
  _.str = require('underscore.string');
  _.mixin(_.str.exports());
  var numeral = require('numeral');
  var moment = require('moment');
  var Q = require('kew');
  var IncrementedSet = require('./incremented-set');
  var Formatter = require('./formatter');

  function TwitterStats() {
    this.stats = {
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

    this.template = [
      ' === Twitter Stats (since <%= uptime %>) ===',
      '<%= numTweets %> tweets (<%= per.sec %>/sec, <%= per.min %>/min, <%= per.hr %>/hour)',
      '<%= urlCol %> <%= urlPct %>    <%= placeCol %> <%= placePct %>    <%= replyCol %> <%= replyPct %>',
      '<%= picCol %> <%= picPct %>                           <%= retweetCol %> <%= retweetPct %>',
      'Top Tags: <% _.each(tags, function(tag) { %><%= tag %> <% }); %>',
      'Top Domains: <% _.each(domains, function(domain) { %><%= domain %> <% }); %>',
      'Top Langs: <% _.each(langs, function(lang) { %><%= lang %> <% }); %>',
      'Top Countries: <% _.each(countries, function(country) { %><%= country %> <% }); %>',
      'Top Sources: <% _.each(sources, function(source) { %><%= source %> <% }); %>',
      'Top Tweeters: <% _.each(tweeters, function(user) { %><%= user %> <% }); %>',
      'Top Mentions: <% _.each(mentions, function(user) { %><%= user %> <% }); %>',
      'Top Links:'
    ];
    for (var i = 0; i < config.ui.numUrls; i++) {
      this.template.push('  <%= urls[' + i + '] %>');
    }
    this.formatter = new Formatter(this.template);
  }

  TwitterStats.prototype.update = function(tweet) {
    var stats = this.stats;

    stats.num++;

    if (this.hasUrl(tweet))    { stats.numWithUrl++; }
    if (this.hasPic(tweet))    { stats.numWithPic++; }
    if (this.isReply(tweet))   { stats.numIsReply++; }
    if (this.isRetweet(tweet)) { stats.numIsRetweet++; }
    if (this.hasLang(tweet))   { stats.langs.increment(tweet.lang); }
    if (this.hasPlace(tweet))  {
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
  };

  TwitterStats.prototype.show = function() {
    this.cache();
    var stats = this.stats;
    var data = {};

    data.uptime = moment(stats.startTime).fromNow();

    var tweetFormat = stats.num < 1000 ? '0' : '0,0.00a';
    data.numTweets = numeral(stats.num).format(tweetFormat);

    var per = this.getThroughput();
    data.per = {
      sec: numeral(per.sec).format('0,0.00'),
      min: numeral(per.min).format('0,0'),
      hr: numeral(per.hr).format('0,0')
    };

    var urlPct     = stats.num ? stats.numWithUrl   / stats.num : 0;
    var placePct   = stats.num ? stats.numWithPlace / stats.num : 0;
    var replyPct   = stats.num ? stats.numIsReply   / stats.num : 0;
    var picPct     = stats.num ? stats.numWithPic   / stats.num : 0;
    var retweetPct = stats.num ? stats.numIsRetweet / stats.num : 0;
    data.urlCol     = _.lpad('with URL:', 12);
    data.urlPct     = _.lpad(numeral(urlPct).format('0.00%'), 6);
    data.placeCol   = _.lpad('with place:', 12);
    data.placePct   = _.lpad(numeral(placePct).format('0.00%'), 6);
    data.replyCol   = _.lpad('is a reply:', 12);
    data.replyPct   = _.lpad(numeral(replyPct).format('0.00%'), 6);
    data.picCol     = _.lpad('with pic:', 12);
    data.picPct     = _.lpad(numeral(picPct).format('0.00%'), 6);
    data.retweetCol = _.lpad('is a RT:', 12);
    data.retweetPct = _.lpad(numeral(retweetPct).format('0.00%'), 6);

    data.tags = stats.tags.first(config.ui.numTags).map(function(tag) { return '#' + tag; });
    data.domains = stats.domains.first(config.ui.numDomains);
    data.langs = stats.langs.first(config.ui.numLangs);
    data.countries = stats.countries.first(config.ui.numCountries);
    data.sources = stats.sources.first(config.ui.numSources);
    data.tweeters = stats.users.first(config.ui.numUsers).map(function(user) { return '@' + user; });
    data.mentions = stats.mentions.first(config.ui.numUsers).map(function(user) { return '@' + user; });
    data.urls = stats.urls.first(config.ui.numUrls);

    this.formatter.draw(data);
  };

  TwitterStats.prototype.cache = function() {
    var stats = this.stats;
    stats.tags.cache(config.ui.numTags);
    stats.domains.cache(config.ui.numDomains);
    stats.langs.cache(config.ui.numLangs);
    stats.countries.cache(config.ui.numCountries);
    stats.sources.cache(config.ui.numSources);
    stats.users.cache(config.ui.numUsers);
    stats.mentions.cache(config.ui.numUsers);
    stats.urls.cache(config.ui.numUrls);
  };

  TwitterStats.prototype.cleanup = function() {
    this.formatter.clearAll();
  };

  TwitterStats.prototype.hasUrl = function(tweet) {
    return (tweet.entities.urls.length > 0);
  };

  TwitterStats.prototype.hasPic = function(tweet) {
    if (_.detect(tweet.entities.media, this.isPhotoMedia)) {
      return true;
    }

    if (_.detect(tweet.entities.urls, this.isPhotoUrl)) {
      return true;
    }

    return false;
  };

  TwitterStats.prototype.hasLang = function(tweet) {
    return (tweet.lang !== null) && (tweet.lang !== 'und');
  };

  TwitterStats.prototype.hasPlace = function(tweet) {
    return (tweet.place !== null);
  };

  TwitterStats.prototype.isReply = function(tweet) {
    return (tweet.in_reply_to_status_id_str !== null);
  };

  TwitterStats.prototype.isRetweet = function(tweet) {
    return (typeof tweet.retweeted_status !== 'undefined');
  };

  TwitterStats.prototype.isPhotoMedia = function(mediaItem) {
    return (mediaItem.type === 'photo');
  };

  TwitterStats.prototype.isPhotoUrl = function(urlItem) {
    var domains = [
      'instagram.com'
    ];

    var urlDomain = urlItem.display_url.replace(/\/.*$/, '');
    return _.contains(domains, urlDomain);
  };

  TwitterStats.prototype.getThroughput = function() {
    var stats = this.stats;
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
  };

  // Used for testing.
  TwitterStats.prototype.setStartTime = function(msTimestamp) {
    this.stats.startTime = msTimestamp;
  };

  return TwitterStats;
})();