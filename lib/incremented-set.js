//
// Data structure -- Set of unique keys, sorted by associated value.
// Performance goal: Fast insertion, decent lookups. Memory is not a concern.
//
'use strict';
module.exports = (function() {

  var config = require('config');
  var redis = require('redis');
  var uuid = require('uuid');
  var Q = require('kew');
  var _ = require('lodash');

  var defaults = {
    sort: 'maxFirst',
    // Redis settings
    password: config.redis.password,
    connect_timeout: config.redis.timeout * 1000
  };

  function IncrementedSet(opts) {
    this.setOpts(opts);

    this.vals = [];         // cache for lookups
    this.name = uuid.v4();  // key for the Redis store

    this.connectRedis();
  }

  IncrementedSet.prototype.setOpts = function(opts) {
    this.opts = _.extend({}, defaults);
    _.extend(this.opts, config.redis);
    _.extend(this.opts, opts);
  };

  IncrementedSet.prototype.connectRedis = function() {
    this.redisError = null;

    if (this.opts.socket) {
      this.redis = redis.createClient(this.opts.socket, this.opts);
    } else {
      this.redis = redis.createClient(this.opts.port, this.opts.host, this.opts);
    }

    this.redis.select(this.opts.database);

    this.redis.on('error', function(err) {
      if (!this.redisError) { console.error(err); }
      this.redisError = err;
    });
  };

  // Update the local cache from the Redis store.
  // Returns a promise, which can then be used to extract the results.
  IncrementedSet.prototype.cache = function(count) {
    var set = this;

    var deferred = Q.defer();
    var rangeFunc = (this.opts.sort === 'minFirst' ? 'zrange' : 'zrevrange');
    this.redis[rangeFunc](this.name, 0, count - 1, deferred.makeNodeResolver());

    return deferred.promise
      .then(function(items) {
        var args = [0, count].concat(items);
        Array.prototype.splice.apply(set.vals, args);
        return items;
      })
      .fail(function(err) {
        console.error(err);
        process.exit(1);
      });
  };

  // Immediate lookup of the values, from the cache.
  IncrementedSet.prototype.first = function(count) {
    if (typeof count === 'undefined' || count < 1) { count = 1; }
    return this.vals.slice(0, count);
  };

  // Increments the specified key by an amount (default 1).
  IncrementedSet.prototype.increment = function(key, amount) {
    if (typeof amount === 'undefined') { amount = 1; }
    this.redis.zincrby(this.name, amount, key);
  };

  // Inserts a key with the given value (default 1).
  IncrementedSet.prototype.insert = function(key, amount) {
    if (typeof amount === 'undefined') { amount = 1; }
    this.redis.zadd(this.name, amount, key);
  };

  return IncrementedSet;
})();
