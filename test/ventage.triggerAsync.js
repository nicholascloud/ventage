'use strict';
var chai = require('chai');
var assert = chai.assert;
var Ventage = require('../ventage');

suite('Ventage#triggerAsync()', function () {
  setup(function (done) {
    done();
  });

  test('triggers a callback when an event is raised', function (done) {
    var events = new Ventage();
    var callback = function () {
      done();
    };
    events.on('foo', callback);
    events.triggerAsync('foo');
  });

  test('triggers a callback with a specified context when an event is raised', function (done) {
    var expectedContext = {};
    var events = new Ventage();
    var callback = function () {
      assert.equal(this, expectedContext);
      done();
    };
    events.on('foo', callback, expectedContext);
    events.triggerAsync('foo');
  });

  test('triggers a callback with data when an event is raised', function (done) {
    var expectedArg1 = {}, expectedArg2 = {};
    var events = new Ventage();
    var callback = function (arg1, arg2) {
      assert.equal(arg1, expectedArg1);
      assert.equal(arg2, expectedArg2);
      done();
    };
    events.on('foo', callback);
    events.triggerAsync('foo', expectedArg1, expectedArg2);
  });

  test('triggers wildcard callback when any event is raised', function (done) {
    var times = 0;
    var ventage = new Ventage();
    ventage.on('*', function () {
      times += 1;
      assert.equal(times, arguments.length);
      if (times === 3) {
        done();
      }
    });
    ventage.trigger('foo', 1);
    ventage.trigger('bar', 1, 2);
    ventage.trigger('baz', 1, 2, 3);
  });

  test('does not trigger callback when disposed asynchronously', function (done) {
    var events = new Ventage();
    var callback = function () {
      done(new Error('callback should not have been invoked'));
    };
    events.on('foo', callback);
    events.triggerAsync('foo');
    events.off('foo');
    setTimeout(function () {
      done();
    }, 100);
  });
});