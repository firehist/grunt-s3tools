/**
 * grunt-s3tools
 * https://github.com/firehist/grunt-s3tools
 *
 * Copyright (c) 2013 "firehist" Benjamin Longearet, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Some variables
  var 	_ 		= grunt.util._
    , log 		= grunt.log
    ,moment	= require('moment')
    ,cloudfront	= require('cloudfront')
    ,s3 		= require('../node_modules/grunt-s3/tasks/lib/s3.js').init(grunt);

  // Some methods
  /**
   * Check opt given in parameter
   * @return {Boolean|Object}
   */
  var checkOptions = function (opt, target) {
    if (_.isUndefined(opt.key) || opt.key === '') {
      log.error('Missing aws key property.');
    } else if (_.isUndefined(opt.secret) || opt.secret === '') {
      log.error('Missing aws secret property.');
    } else if (_.isUndefined(opt.distID) || opt.distID === '') {
      log.error('Missing aws distID property.');
    } else if (_.isUndefined(opt.names[ this.target ]) || opt.names[ this.target ] === '') {
      log.error('Missing filename configuration');
    } else {
      opt['name'] = opt.names[ this.target ];
      return opt;
    }
    return false;
  };

  /*
   * S3 invalidate files
   */
  grunt.registerMultiTask('s3invalidate', 'Invalidate to S3 Amazon', function() {

    var opt = this.options({
      name: ''
      ,target: this.target
      ,prefix: this.data.prefix || './'
      ,suffix: this.data.suffix || '.js'
    });

    // Check default options
    opt = checkOptions.call(this, opt);
    if (opt === false) {
      return;
    }

    // Sanitize
    var done		= this.async()
      ,cf			= cloudfront.createClient(opt.key, opt.secret)
      ,distPath	= opt.prefix + opt.name + opt.suffix
      ,timestamp	= moment().format('HHmmss');

    cf.createInvalidation(opt.distID, 'DeployFormat_' + timestamp + '_' + distPath, distPath, function(err, invalidation) {
      if (err) {
        log.error(err);
        done(false);
      } else {
        log.writeln('>>'.green + ' Distribution ID: ' + invalidation.distribution);
        log.writeln('>>'.green + ' Invalidation ID: ' + invalidation.id);
        log.writeln('>>'.green + ' Status:          ' + invalidation.status);
        log.writeln('>>'.green + ' Time:            ' + invalidation.createTime);
        done();
      }
    });

    return;
  });

  /*
   * S3 deploy file
   */
  grunt.registerMultiTask('s3deploy', 'Invalidate to S3 Amazon', function() {

    var opt = this.options({
      name: ''
      ,headers: this.data.headers || {
        'Content-Encoding': 'gzip',
        'Content-Type':		'application/x-javascript'
      }
      ,target: this.target
      ,archivePath: this.data.archivePath || ''
      ,localPath: this.data.localPath || ''
      ,prefix: this.data.prefix || './'
      ,suffix: this.data.suffix || '.js'
    });

    // Check default options
    opt = checkOptions.call(this, opt);
    if (opt === false) {
      return;
    }

    if (_.isUndefined(opt.archivePath) || opt.archivePath === '') {
      log.error('Missing archivePath');
      return;
    } else if (_.isUndefined(opt.localPath) || opt.localPath === '') {
      log.error('Missing localPath');
      return;
    } else if (_.isUndefined(opt.distPath) || opt.distPath === '') {
      log.error('Missing distPath');
      return;
    }

    var filename			= opt.prefix + opt.name + opt.suffix
      , archivePath		= opt.archivePath + opt.name
      , archiveYearPath	= archivePath + '/' + moment().format('YYYYMMDD')
      , archiveFullPath	= archiveYearPath + '/' + filename + '_' + moment().format('HHmmss')
      , localFullPath		= opt.localPath + filename
      , distFullPatch		= opt.distPath + filename;

    log.writeln('Start deploy filename: ' + opt.name + '[' + filename + ']');

    if (!grunt.file.exists( localFullPath )) {
      log.error('File not exist: ' + localFullPath);
      return;
    } else {

      log.writeln('Start download archive: from[s3:' + distFullPatch + '] to[' + archiveFullPath + ']');

      // test folders
      if (!grunt.file.exists(archivePath)) {
        grunt.file.mkdir(archivePath);
      }
      if (!grunt.file.exists(archiveYearPath)) {
        grunt.file.mkdir(archiveYearPath);
      }

      var done = this.async()
        , download = {
          src: distFullPatch,
          dest: archiveFullPath
        }
        , upload = {
          src: localFullPath,
          dest: distFullPatch
          , headers: opt.headers
        };
      var transferDownload = s3.download.bind(s3, download.src, download.dest, download)();
      transferDownload.done(function(msg) {
        log.ok(msg);

        var transfertUpload = s3.upload.bind(s3, upload.src, upload.dest, upload)();

        transfertUpload.done(function(msg) {
          log.ok(msg);
          // Run invalidation
          grunt.task.run(['s3invalidate:' + opt.target]);
          done();
        });

        transfertUpload.fail(function(msg) {
          log.error(msg);
          done(false);
        });

      })
      transferDownload.fail(function(msg) {
        log.error(msg);
        done(false);
      });

    }

  });

};
