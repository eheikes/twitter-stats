//
// Formatter for stats data.
//
var blessed = require('blessed');

var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var Formatter = (function() {
  function Formatter() {
    this.program = blessed.program();
    this.start();
  }

  Formatter.prototype.start = function() {
    this.lineCount = 0;
  };

  Formatter.prototype.clearLn = function() {
    this.program.write(_.repeat(' ', this.program.cols));
    this.program.newline();
    this.program.up(1);
  };

  Formatter.prototype.writeLn = function() {
    var str = Array.prototype.slice.call(arguments).join(' ');
    this.clearLn();
    this.program.write(_.truncate(str, this.program.cols - 1, '…'));
    this.program.newline();
    this.lineCount++;
  };

  Formatter.prototype.stop =
  Formatter.prototype.rewind = function() {
    this.program.up(this.lineCount);
  };

  return Formatter;
})();

module.exports = new Formatter();
