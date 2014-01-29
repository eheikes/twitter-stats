//
// Data structure -- Set of unique keys, sorted by associated value.
// Performance goal: Fast insertion, decent lookups. Memory is not a concern.
//
module.exports = (function() {
  var config = require('config');
  var redis = require('redis');
  var uuid = require('uuid');
  var Q = require('kew');
  var _ = require('lodash');

  var defaults = {
    sort: 'maxFirst',
    // Redis settings
    auth_pass: config.redis.password,
    connect_timeout: config.redis.timeout * 1000
  };

  function IncrementedSet(opts) {
    // Save the set configuration.
    this.opts = _.extend({}, defaults);
    _.extend(this.opts, opts);

    // Cache the lookups.
    this.vals = [];

    // Set a key for the Redis store.
    this.name = uuid.v4();

    // Connect to Redis.
    this.redisError = null;
    if (config.redis.socket) {
      this.redis = redis.createClient(config.redis.socket, this.opts);
    } else {
      this.redis = redis.createClient(config.redis.port, config.redis.host, this.opts);
    }
    this.redis.on('error', function(err) {
      if (!this.redisError) { console.error(err); }
      this.redisError = err;
    });
  }

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

  // Inserts a key with the default value (1).
  IncrementedSet.prototype.insert = function(key) {
    this.increment(key, 1);
  };

  return IncrementedSet;
})();
