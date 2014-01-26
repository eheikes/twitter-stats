var should = require('chai').should();
var IncrementedSet = require('../lib/incremented-set');

describe('IncrementedSet', function() {

  describe('first()', function() {
    it('should return the largest key', function() {
      var result, set = new IncrementedSet();

      set.increment('foo', 3);
      set.increment('bar', 7);
      set.increment('baz', 2);
      result = set.first();

      result.should.eql(['bar']);
    });

    it('should return the requested number of keys', function() {
      var result, set = new IncrementedSet();

      set.increment('foo', 3);
      set.increment('bar', 7);
      set.increment('baz', 2);
      result = set.first(2);

      result.length.should.equal(2);
    });

    it('should return the full set if more keys than exist are requested', function() {
      var result, set = new IncrementedSet();

      set.increment('foo', 3);
      set.increment('bar', 7);
      result = set.first(5);

      result.length.should.equal(2);
    });

    it('should ignore arguments less than 1', function() {
      var result, set = new IncrementedSet();

      set.increment('foo', 3);
      set.increment('bar', 7);

      result = set.first(0);
      result.length.should.equal(1);

      result = set.first(-1);
      result.length.should.equal(1);
    });
  });

  describe('findIndex()', function() {
    it('should find existing keys', function() {
      var result, set = new IncrementedSet();

      set.insert('foo');
      result = set.findIndex('foo');

      result.should.be.at.least(0);
    });

    it('should not find nonexisting keys', function() {
      var result, set = new IncrementedSet();

      set.insert('foo');
      result = set.findIndex('bar');

      result.should.equal(-1);
    });
  });

  describe('increment()', function() {
    it('should add nonexisting keys to the set', function() {
      var result, set = new IncrementedSet();

      set.increment('foo');
      set.increment('bar');
      result = set.first(2);

      result.indexOf('foo').should.be.at.least(0);
      result.indexOf('bar').should.be.at.least(0);
    });

    it('should add 1 to an existing key', function() {
      var result, set = new IncrementedSet();

      set.insert('foo');
      set.insert('bar');
      set.increment('foo');
      result = set.first(1);

      result.indexOf('foo').should.be.at.least(0);
      result.indexOf('bar').should.equal(-1);
    });

    it('should add an arbitrary amount to an existing key', function() {
      var result, set = new IncrementedSet();

      set.increment('foo', 1);
      set.increment('bar', 2);
      set.increment('baz', 3);
      set.increment('bar', 2);
      result = set.first(3);

      result.should.eql(['bar', 'baz', 'foo']);
    });
  });

  describe('insert()', function() {
    it('should add keys to the set', function() {
      var result, set = new IncrementedSet();

      set.insert('foo');
      set.insert('bar');
      result = set.first(2);

      result.indexOf('foo').should.be.at.least(0);
      result.indexOf('bar').should.be.at.least(0);
    });

    it('should assign an initial value of 1', function() {
      var result, set = new IncrementedSet();

      set.insert('foo');
      set.increment('bar', 2);
      set.increment('baz', 2);
      result = set.first(2);

      result.indexOf('foo').should.equal(-1);
    });
  });

  describe('Custom comparator', function() {
    it('should be used when sorting', function() {
      var minFirst = function(a, b) {
        if (a.val > b.val) { return  1; }
        if (a.val < b.val) { return -1; }
        return 0;
      }

      var result, set = new IncrementedSet(minFirst);

      set.increment('foo', 3);
      set.increment('bar', 2);
      set.increment('baz', 7);
      result = set.first(3);

      result.should.eql(['bar', 'foo', 'baz']);
    });
  });

});
