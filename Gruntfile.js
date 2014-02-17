/**
 * grunt-s3tools
 * https://github.com/firehist/grunt-s3tools
 * 
 * Copyright (c) 2013 "firehist" Benjamin Longearet, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/**/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    /**
     * Increments the version number, etc.
     */
    bump: {
      options: {
        files: [
          "package.json"
        ],
        commit: true,
        commitMessage: 'chore(release): v%VERSION%',
        commitFiles: [
          "package.json"
        ],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin'
      }
    },

    s3deploy: {
      options: grunt.util._.extend({
        names: {config: 'config'},
        archivePath: 's3/archives/',
        localPath: 's3/config/',
        distPath: '/manager/',
        prefix: '',
        suffix: ''
      }, {}),
      config: {}
    },

    s3invalidate: {
      options: grunt.util._.extend({
        names: {config: 'config'},
        prefix: '/manager/',
        suffix: ''
      }, {}),
      config: {}
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    },

    markdox: {
      all: {
        files: [
          {src: 'tasks/*.js', dest: 'DOCUMENTATION.md'}
        ]
      }
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-markdox');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'i18nextract', 'nodeunit', 'clean']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};