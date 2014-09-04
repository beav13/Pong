module.exports = function(grunt) {
  var target = grunt.option('target') || 'production';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['frontend/scripts/**/*.js'],
        dest: 'temp/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'temp/pong.js': ['frontend/scripts/pong.js'],
		  'temp/worker.js': ['frontend/scripts/worker.js']
        }
      }
    },
    copy: {
      main: {
        files: [
          {expand: true, cwd: 'frontend/', src: ['images/**'], dest: target},
          {expand: true, cwd: 'frontend/', src: ['styles/**'], dest: target},
          {expand: true, cwd: 'frontend/', src: ['index.html', 'pong.html'], dest: target},
          {expand: true, flatten:true, src: ['temp/pong.js'], dest: target + '/scripts'},
		  {expand: true, flatten:true, src: ['temp/worker.js'], dest: target + '/scripts'}
        ]
      }
    },
	clean: ["temp"]
  });


  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['concat', 'uglify', 'copy', 'clean']);

};