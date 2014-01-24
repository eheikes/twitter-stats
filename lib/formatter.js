//
// Formatter for stats data.
//
var blessed = require('blessed');

var Formatter = (function() {
  function Formatter() {
    this.program = blessed.program();
    this.clear();
  }

  Formatter.prototype.clear = function() {
    this.lineCount = 0;
  }

  Formatter.prototype.writeLn = function() {
    var str = Array.prototype.slice.call(arguments).join(' ');
    this.program.write(str);
    this.program.newline();
    this.lineCount++;
  };

  Formatter.prototype.rewind = function() {
    this.program.up(this.lineCount);
  };

  return Formatter;
})();

module.exports = new Formatter();
