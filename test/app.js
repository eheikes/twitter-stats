'use strict';

var should = require('chai').should();
var config = require('config');

describe('Configuration', function() {

  describe('Twitter OAuth settings', function() {
    it('should exist', function() {
      should.exist(config.twitter.consumerKey);
      should.exist(config.twitter.consumerSecret);
      should.exist(config.twitter.accessToken);
      should.exist(config.twitter.accessTokenSecret);
    });
  });

  describe('UI settings', function() {
    it('should exist', function() {
      should.exist(config.ui.updateInterval);

      should.exist(config.ui.numTags);
      should.exist(config.ui.numDomains);
      should.exist(config.ui.numLangs);
      should.exist(config.ui.numCountries);
      should.exist(config.ui.numSources);
      should.exist(config.ui.numUsers);
      should.exist(config.ui.numUrls);
    });
  });

});
