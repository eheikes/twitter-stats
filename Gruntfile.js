'use strict';

module.exports = function(grunt) {
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
