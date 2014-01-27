var Profiler = require('lightprof').Profiler;

var IncrementedSet = require('./lib/incremented-set');
var set = new IncrementedSet();

var numInsertions = 10000;

console.log('=== IncrementedSet insertion ===');
var profiler = new Profiler();
profiler.profile(set);
for (var i = 0; i < numInsertions; i++) {
  set.increment(getRandomInt(1, 100), 1);
}
profiler.stop();
console.log(profiler.reportTree(), '\n');

console.log('=== IncrementedSet lookup ===');
var profiler = new Profiler();
profiler.profile(set);
set.first(numInsertions);
profiler.stop();
console.log(profiler.reportTree(), '\n');

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
