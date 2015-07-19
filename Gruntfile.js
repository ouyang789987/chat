'use strict';

module.exports = function (grunt) {

  // Load grunt tasks
  grunt.loadNpmTasks('grunt-asset-injector');
  grunt.loadNpmTasks('grunt-wiredep');

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    pkg: grunt.file.readJSON('package.json'),
    express: {
      options: {
        port: process.env.PORT || 9000
      }
    },
    open: {
      server: {
        url: 'http://localhost:<%= express.options.port %>'
      }
    },
    watch: {
      injectJS: {
        files: [
            'public/js/**/*.js'
          ],
        tasks: ['injector:scripts']
      },
      injectCss: {
        files: [
          'public/css/**/*.css'
        ],
        tasks: ['injector:css']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      }
    },

    // Automatically inject Bower components into the app
    wiredep: {
      target: {
        src: 'public/index.html'
      }
    },

    injector: {
      options: {
        ignorePath: 'public/'
      },
      // Inject application script files into index.html (doesn't include bower)
      scripts: {
        options: {
          starttag: '<!-- injector:js -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          'public/index.html': [
              'public/js/**/*.js'
            ]
        }
      },

      // Inject component css into index.html
      css: {
        options: {
          starttag: '<!-- injector:css -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          'public/index.html': [
            'public/css/**/*.css'
          ]
        }
      }
    },
  });

  grunt.registerTask('build', [
    'injector',
    'wiredep'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
};
