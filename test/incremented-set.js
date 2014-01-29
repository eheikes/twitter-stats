var should = require('chai').should();
var IncrementedSet = require('../lib/incremented-set');

describe('IncrementedSet', function() {

  describe('Constructor', function() {
    it('should begin with an empty set', function(done) {
      var set = new IncrementedSet();

      set.cache(7).then(function() {
        set.first(7).should.be.empty;
        done();
      }).fail(done);
    });
  });

  describe('first()', function() {
    it('should return the largest key', function(done) {
      var set = new IncrementedSet();

      set.increment('foo', 3);
      set.increment('bar', 7);
      set.increment('baz', 2);
      set.cache(3).then(function() {
        set.first().should.eql(['bar']);
        done();
      }).fail(done);
    });

    it('should return the requested number of keys', function(done) {
      var set = new IncrementedSet();

      set.increment('foo', 3);
      set.increment('bar', 7);
      set.increment('baz', 2);
      set.cache(3).then(function() {
        set.first(2).length.should.equal(2);
        done();
      }).fail(done);
    });

    it('should return the full set if more keys than exist are requested', function(done) {
      var set = new IncrementedSet();

      set.increment('foo', 3);
      set.increment('bar', 7);
      set.cache(2).then(function() {
        set.first(5).length.should.equal(2);
        done();
      }).fail(done);
    });

    it('should ignore arguments less than 1', function(done) {
      var set = new IncrementedSet();

      set.increment('foo', 3);
      set.increment('bar', 7);
      set.cache(2).then(function() {
        set.first(0).length.should.equal(1);
        set.first(-1).length.should.equal(1);
        done();
      }).fail(done);
    });
  });

  describe('increment()', function() {
    it('should add nonexisting keys to the set', function(done) {
      var set = new IncrementedSet();

      set.increment('foo');
      set.increment('bar');
      set.cache(2).then(function() {
        set.first(2).indexOf('foo').should.be.at.least(0);
        set.first(2).indexOf('bar').should.be.at.least(0);
        done();
      }).fail(done);
    });

    it('should add 1 to an existing key', function(done) {
      var set = new IncrementedSet();

      set.insert('foo');
      set.insert('bar');
      set.increment('foo');
      set.cache(2).then(function() {
        set.first(1).indexOf('foo').should.be.at.least(0);
        set.first(1).indexOf('bar').should.equal(-1);
        done();
      }).fail(done);
    });

    it('should add an arbitrary amount to an existing key', function(done) {
      var result, set = new IncrementedSet();

      set.increment('foo', 1.1);
      set.increment('bar', 2.6);
      set.increment('baz', 3.3);
      set.increment('bar', 0.8);
      set.increment('baz', -0.1);
      set.cache(3).then(function() {
        set.first(3).should.eql(['bar', 'baz', 'foo']);
        done();
      }).fail(done);
    });
  });

  describe('insert()', function() {
    it('should add keys to the set', function(done) {
      var result, set = new IncrementedSet();

      set.insert('foo');
      set.insert('bar');
      set.cache(2).then(function() {
        set.first(2).indexOf('foo').should.be.at.least(0);
        set.first(2).indexOf('bar').should.be.at.least(0);
        done();
      }).fail(done);
    });

    it('should assign an initial value of 1', function(done) {
      var set = new IncrementedSet();

      set.insert('foo');
      set.increment('bar', 2);
      set.increment('baz', 2);
      set.cache(3).then(function() {
        set.first(2).indexOf('foo').should.equal(-1);
        done();
      }).fail(done);
    });
  });

  describe('Reverse comparison', function() {
    it('should be used when sorting', function(done) {
      var set = new IncrementedSet({sort: 'minFirst'});

      set.increment('foo', 3);
      set.increment('bar', 2);
      set.increment('baz', 7);
      set.cache(3).then(function() {
        set.first(3).should.eql(['bar', 'foo', 'baz']);
        done();
      }).fail(done);
    });
  });

});
