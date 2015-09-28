'use strict';
var chai = require('chai');
var assert = chai.assert;
var Ventage = require('../ventage');

suite('Ventage#on()', function () {
  setup(function (done) {
    done();
  });

  test('throws when event name argument missing', function (done) {
    var events = new Ventage();
    assert.throws(function () {
      events.on();
    }, Error);
    done();
  });

  test('throws when callback argument missing', function (done) {
    var events = new Ventage();
    assert.throws(function () {
      events.on('event');
    }, Error);
    done();
  });

  test('adds a callback to the instance', function (done) {
    var events = new Ventage();
    var callback = function () {};
    events.on('foo', callback);
    assert.lengthOf(events._handlerMap.foo, 1, 'should have 1 foo handler');
    done();
  });

  test('adds a callback with a specific context to the instance', function (done) {
    var context = {};
    var events = new Ventage();
    var callback = function () {};
    events.on('foo', callback, context);
    assert.lengthOf(events._handlerMap.foo, 1, 'should have 1 foo handler');
    done();
  });

  test('allows duplicates to be added to an instance', function (done) {
    var context = {};
    var events = new Ventage();
    var callback = function () {};
    events.on('foo', callback, context);
    events.on('foo', callback, context);
    events.on('foo', callback);
    events.on('foo', callback);
    assert.lengthOf(events._handlerMap.foo, 4, 'should have 4 foo handlers');
    done();
  });
});