// Data structure
// Set of unique keys, sorted by associated value.
// The values are integers that can only increase.
// Performance: Fast insertion, decent lookups.
module.exports = (function() {
  var maxFirst = function(a, b) {
    if (a.val > b.val) { return -1; }
    if (a.val < b.val) { return  1; }
    return 0;
  }

  function IncrementedSet(compareFunction) {
    if (compareFunction == null) { compareFunction = maxFirst; }
    this.comparator = compareFunction;
    this.vals = [];  // collection of {key, val} objs
  }

  IncrementedSet.prototype.first = function(count) {
    if (count == null || count < 1) { count = 1; }
    return this.vals.slice(0, count).map(function(pair) { return pair.key; });
  };

  IncrementedSet.prototype.findIndex = function(key) {
    for (var i = 0; i < this.vals.length; i++) {
      if (this.vals[i].key === key) {
        return i;
      }
    }
    return -1;
  };

  IncrementedSet.prototype.increment = function(key, amount) {
    if (amount == null) { amount = 1; }

    var index = this.findIndex(key);
    if (index >= 0) {
      this.vals[index].val += amount;
    } else {
      this.vals.push({ key: key, val: amount });
    }

    this.vals.sort(this.comparator);
  };

  IncrementedSet.prototype.insert = function(key) {
    this.increment(key, 1);
  };

  return IncrementedSet;
})();
