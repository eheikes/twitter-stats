var should = require('chai').should();
var Stats = require('../lib/twitter-stats.js');
var moment = require('moment');

var sample = {};

describe('TwitterStats', function() {

  beforeEach(function() {
    sample = {
      created_at: 'Wed Jan 29 19:35:05 +0000 2014',
      id: 114749583439036416,
      id_str: '114749583439036416',
      text: 'Sample tweet',
      source: '<a href="http://twitter.com/download/android" rel="nofollow">Twitter for Android</a>',
      in_reply_to_status_id: 114749583439036416,
      in_reply_to_status_id_str: '114749583439036416',
      in_reply_to_user_id: 819797,
      in_reply_to_user_id_str: '819797',
      in_reply_to_screen_name: 'twitterapi',
      user: {
        id: 508013852,
        id_str: '508013852',
        name: 'John Doe',
        screen_name: 'johndoe',
      },
      geo: null,
      coordinates: null,
      place: {
        attributes: {},
        bounding_box: {},
        country: "United States",
        country_code: "US",
        full_name: "Washington, DC",
        id: "01fbe706f872cb32",
        name: "Washington",
        place_type: "city",
        url: "http://api.twitter.com/1/geo/id/01fbe706f872cb32.json"
      },
      contributors: null,
      retweeted_status: {
        created_at: 'Wed Jan 29 16:46:36 +0000 2014',
        id: 428569881127030800,
        id_str: '428569881127030784',
        text: 'Sample retweet',
        source: '<a href="http://twitter.com/tweetbutton" rel="nofollow">Tweet Button</a>',
        in_reply_to_status_id: null,
        in_reply_to_status_id_str: null,
        in_reply_to_user_id: null,
        in_reply_to_user_id_str: null,
        in_reply_to_screen_name: null,
        user: {},
        geo: null,
        coordinates: null,
        place: null,
        contributors: null,
        entities: {
          hashtags: [],
          symbols: [],
          urls: [Object],
          user_mentions: [Object]
        },
        lang: 'en'
      },
      retweet_count: 0,
      favorite_count: 0,
      entities: {
        hashtags: [],
        symbols: [],
        urls: [{
          url: 'https://t.co/XdXRudPXH5',
          expanded_url: 'https://instagram.com/p/eOxxr6q82y/',
          display_url: 'instagram.com/p/eOxxr6q82y'
        }],
        user_mentions: [],
        media: [{
          id: 266031293949698048,
          id_str: '266031293949698048',
          media_url: 'http://pbs.twimg.com/media/A7EiDWcCYAAZT1D.jpg',
          media_url_https: 'https://pbs.twimg.com/media/A7EiDWcCYAAZT1D.jpg',
          url: 'http://t.co/bAJE6Vom',
          display_url: 'pic.twitter.com/bAJE6Vom',
          expanded_url: 'http://twitter.com/BarackObama/status/266031293945503744/photo/1',
          type: 'photo',
          sizes: {}
        }]
      },
      favorited: false,
      retweeted: false,
      lang: 'en'
    };
  });

  describe('hasUrl()', function() {
    it('should recognize a tweet with links', function() {
      var stats = new Stats();
      stats.hasUrl(sample).should.be.true;
    });

    it('should not recognize a tweet without links', function() {
      var stats = new Stats();
      sample.entities.urls = [];
      stats.hasUrl(sample).should.be.false;
    });
  });

  describe('hasPic()', function() {
    it('should recognize a tweet with a Photo Upload pic', function() {
      var stats = new Stats();
      sample.entities.urls = [];
      stats.hasPic(sample).should.be.true;
    });

    it('should recognize a tweet with an Instagram pic', function() {
      var stats = new Stats();
      sample.entities.media = [];
      stats.hasPic(sample).should.be.true;
    });

    it('should not recognize a tweet without Twitter or Instagram pics', function() {
      var stats = new Stats();
      sample.entities.urls = [];
      sample.entities.media = [];
      stats.hasPic(sample).should.be.false;
    });
  });

  describe('hasLang()', function() {
    it('should recognize a tweet with a specified language', function() {
      var stats = new Stats();
      stats.hasLang(sample).should.be.true;
    });

    it('should not recognize a tweet without a specified language', function() {
      var stats = new Stats();
      sample.lang = null;
      stats.hasLang(sample).should.be.false;
    });

    it('should not recognize a tweet with an unknown language', function() {
      var stats = new Stats();
      sample.lang = 'und';
      stats.hasLang(sample).should.be.false;
    });
  });

  describe('hasPlace()', function() {
    it('should recognize a tweet with location', function() {
      var stats = new Stats();
      stats.hasPlace(sample).should.be.true;
    });

    it('should not recognize a tweet without a location', function() {
      var stats = new Stats();
      sample.place = null;
      stats.hasPlace(sample).should.be.false;
    });
  });

  describe('isReply()', function() {
    it('should recognize a reply', function() {
      var stats = new Stats();
      stats.isReply(sample).should.be.true;
    });

    it('should not recognize a non-reply', function() {
      var stats = new Stats();
      sample.in_reply_to_status_id      = null;
      sample.in_reply_to_status_id_str  = null;
      sample.in_reply_to_user_id        = null;
      sample.in_reply_to_user_id_str    = null;
      sample.in_reply_to_screen_name    = null;
      stats.isReply(sample).should.be.false;
    });
  });

  describe('isRetweet()', function() {
    it('should recognize a retweet', function() {
      var stats = new Stats();
      stats.isRetweet(sample).should.be.true;
    });

    it('should not recognize a normal tweet', function() {
      var stats = new Stats();
      delete sample.retweeted_status;
      stats.isRetweet(sample).should.be.false;
    });
  });

  describe('isPhotoMedia()', function() {
    it('should recognize a photo', function() {
      var stats = new Stats();
      var mediaData = {};

      mediaData.type = 'photo';
      stats.isPhotoMedia(mediaData).should.be.true;
    });

    it('should not recognize other media', function() {
      var stats = new Stats();
      var mediaData = {};

      mediaData.type = 'video';
      stats.isPhotoMedia(mediaData).should.be.false;
    });
  });

  describe('isPhotoUrl()', function() {
    it('should recognize an Instagram URL', function() {
      var stats = new Stats();
      var urlData = {};

      urlData.display_url = 'instagram.com/p/hZPgizk7cY';
      stats.isPhotoUrl(urlData).should.be.true;

      urlData.display_url = 'instagram.com/p/jqDomcoTq0';
      stats.isPhotoUrl(urlData).should.be.true;
    });

    it('should not recognize other URLs', function() {
      var stats = new Stats();
      var urlData = {};

      urlData.display_url = 'google.com';
      stats.isPhotoUrl(urlData).should.be.false;

      urlData.display_url = 'ericheikes.com/category/tech/';
      stats.isPhotoUrl(urlData).should.be.false;
    });
  });

  describe('getThroughput()', function() {
    it('should correctly calculate sec/min/hr throughput', function() {
      var stats = new Stats();
      var numTweets = 100;

      stats.setStartTime(+moment().subtract(1, 'hours'));
      for (var i = 0; i < numTweets; i++) {
        stats.update(sample);
      }
      var tp = stats.getThroughput();

      var ε = 0.01;
      var expected = {
        hr:  numTweets,
        min: numTweets / 60,
        sec: numTweets / 60 / 60
      };
      tp.sec.should.be.above(expected.sec - ε);
      tp.sec.should.be.below(expected.sec + ε);
      tp.min.should.be.above(expected.min - ε);
      tp.min.should.be.below(expected.min + ε);
      tp.hr.should.be.above(expected.hr - ε);
      tp.hr.should.be.below(expected.hr + ε);
    });
  });

});
