/*global requirejs, require, mocha*/
requirejs.config({
  paths: {
    'underscore': '../bower_components/underscore/underscore',
    'ventage': '../ventage'
  },
  shim: {
    'underscore': {
      exports: '_'
    }
  }
});

require([
  // Events instance methods
  './ventage.ctor.js',
  './ventage.create.js',
  './ventage.on.js',
  './ventage.off.js',
  './ventage.clear.js',
  './ventage.trigger.js',
  './ventage.triggerAsync.js',
  './ventage.pipe.js'
], function () {
  'use strict';
  mocha.checkLeaks();
  mocha.run();
});