module.exports = function(grunt) {
  'use strict';
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        jshintrc: true
      },
      all: [
        '*.js',
        'lib/*.js',
        'test/*.js'
      ]
    },

    mochacli: {
      options: {
        reporter: 'spec',
        require: ['chai']
      },
      all: ['test/*.js']
    },

    execute: {
      profile: {
        src: ['profiler.js']
      }
    }

  });

  grunt.registerTask('test', ['mochacli']);
  grunt.registerTask('profile', ['execute:profile']);

  grunt.registerTask('default', ['jshint', 'test', 'profile']);
};
