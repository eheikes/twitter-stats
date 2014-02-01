//
// Formatter for stats data.
//
module.exports = (function() {
  'use strict';

  // The blessed lib seems to leak memory when called multiple times,
  //   so use a singleton for blessed.program().
  var blessed = require('blessed');
  var program = null;

  var _ = require('lodash');
  _.str = require('underscore.string');
  _.mixin(_.str.exports());

  function Formatter(linesArray) {
    if (!program) {
      program = blessed.program();
    }

    this.program = program;
    this.start();

    this.template = linesArray;
    this.compiledTemplate = _.map(this.template, function(line) {
      return _.template(line);
    });
  }

  Formatter.prototype.start = function() {
    this.lineCount = 0;
  };

  Formatter.prototype.clearLn = function() {
    this.program.write(_.repeat(' ', this.program.cols));
    this.program.newline();
    this.program.up(1);
  };

  Formatter.prototype.display = function(data) {
    this.start();
    _.each(this.compiledTemplate, function(line) {
      this.writeLn(line(data));
    }, this);
    this.rewind();
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
