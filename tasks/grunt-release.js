/*
 * grunt-release
 * https://github.com/geddski/grunt-release
 *
 * Copyright (c) 2013 Dave Geddes
 * Licensed under the MIT license.
 */

var shell = require('shelljs');
var semver = require('semver');

module.exports = function(grunt){
  grunt.registerTask('release', 'bump version, git tag, git push, npm publish', function(type){
    //defaults
    var options = this.options({
      bump: true,
      file: grunt.config('pkgFile') || 'package.json',
      add: true,
      commit: true,
      tag: true,
      push: true,
      pushTags: true,
      npm : true
    });

    var tagName = grunt.config.getRaw('release.options.tagName') || '<%= version %>';
    var commitMessage = grunt.config.getRaw('release.options.commitMessage') || 'release <%= version %>';
    var tagMessage = grunt.config.getRaw('release.options.tagMessage') || 'version <%= version %>';

    var config = setup(options.file, type);
    var templateOptions = {
      data: {
        version: config.newVersion[config.file[0]]
      }
    };

    if (options.bump) bump(config);
    if (options.add) add(config);
    if (options.commit) commit(config);
    if (options.tag) tag(config);
    if (options.push) push();
    if (options.pushTags) pushTags(config);
    if (options.npm) publish(config);

    function setup(files, type){
      if(typeof files === 'string') {
        files = [files];
      }
      var pkgs = {}, newVersions = {};
      for(var i in files) {
        var pkg = grunt.file.readJSON(files[i]);
        pkgs[files[i]] = pkg;
        if (options.bump) {
          newVersions[files[i]] = semver.inc(pkg.version, type || 'patch');
        }
      }
      return {file: files, pkg: pkgs, newVersion: newVersions};
    }

    function add(config){
      for(var i in config.file) {
        run('git add ' + config.file[i]);
      }
    }

    function commit(config){
      var message = grunt.template.process(commitMessage, templateOptions);
      run("git commit -m '" + message + "'", "committed " + config.file.join(", "));
    }

    function tag(config){
      var name = grunt.template.process(tagName, templateOptions);
      var message = grunt.template.process(tagMessage, templateOptions);
      run('git tag ' + name + ' -m "'+ message +'"', 'New git tag created: ' + name);
    }

    function push(){
      run('git push', 'pushed to remote');
    }

    function pushTags(config){
      run('git push --tags', 'pushed new tag '+ config.newVersion[config.file[0]] +' to remote');
    }

    function publish(config){
      var cmd = 'npm publish';
      if (options.folder){ cmd += ' ' + options.folder }
      run(cmd, 'published '+ config.newVersion[config.file[0]] +' to npm');
    }

    function run(cmd, msg){
      shell.exec(cmd, {silent:true});
      if (msg) grunt.log.ok(msg);
    }

    function bump(config){
      for(var i in config.file) {
        var file = config.file[i];

        config.pkg[file].version = config.newVersion[file];
        grunt.file.write(file, JSON.stringify(config.pkg[file], null, '  ') + '\n');
        grunt.log.ok(file + ' version bumped to ' + config.newVersion[file]);
      }
    }

  });
};
