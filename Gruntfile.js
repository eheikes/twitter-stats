'use strict';

module.exports = function(grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    mochacli: {
      options: {
        reporter: 'spec',
        require: ['chai']
      },
      all: ['test/*.js']
    }

  });

  grunt.registerTask('test', ['mochacli']);

  grunt.registerTask('default', ['test']);
};
