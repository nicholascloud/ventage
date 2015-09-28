'use strict';
var chai = require('chai');
var assert = chai.assert;
var Ventage = require('../ventage');

suite('Ventage#off()', function () {
  setup(function (done) {
    done();
  });

  test('removes a callback from the instance', function (done) {
    var events = new Ventage();
    var callback = function () {};
    events.on('foo', callback);
    assert.lengthOf(events._handlerMap.foo, 1, 'should have 1 foo handler');
    events.off('foo', callback);
    assert.isFalse(events._handlerMap.hasOwnProperty('foo'), 'should not have foo handlers');
    done();
  });

  test('removes all callbacks registered for an event from the instance', function (done) {
    var events = new Ventage();
    events.on('foo', function () {});
    events.on('foo', function () {});
    events.on('bar', function () {});
    events.on('bar', function () {});
    assert.lengthOf(events._handlerMap.foo, 2, 'should have 2 foo handlers');
    assert.lengthOf(events._handlerMap.bar, 2, 'should have 2 bar handlers');
    events.off('foo');
    assert.isFalse(events._handlerMap.hasOwnProperty('foo'), 'should not have foo handlers');
    assert.isFalse(events._handlerMap.hasOwnProperty('foo'), 'should not have bar handlers');
    done();
  });

  test('removes only callbacks registered with a specific context from the instance', function (done) {
    var context = {};
    var events = new Ventage();
    var callback = function () {};
    events.on('foo', callback, context);
    events.on('foo', callback);
    assert.lengthOf(events._handlerMap.foo, 2);
    events.off('foo', callback, context);
    assert.lengthOf(events._handlerMap.foo, 1);
    done();
  });

  test('removes all callbacks', function (done) {
    var context = {};
    var events = new Ventage();
    var callback = function () {};
    events.on('foo', callback, context);
    events.on('foo', callback);
    assert.lengthOf(events._handlerMap.foo, 2);
    events.off();
    assert.isFalse(events._handlerMap.hasOwnProperty('foo'));
    done();
  });

  test('piped handler is removed', function (done) {
    var ventage1 = new Ventage();
    var ventage2 = new Ventage();
    var callbackHandle = ventage1.pipe('foo', ventage2);
    ventage1.on('bar', function () {});
    assert.lengthOf(ventage1._handlerMap.foo, 1);
    assert.lengthOf(ventage1._handlerMap.bar, 1);
    ventage1.off('foo', callbackHandle, ventage2);
    assert.isFalse(ventage1._handlerMap.hasOwnProperty('foo'), 'should not have foo handlers');
    assert.lengthOf(ventage1._handlerMap.bar, 1, 'should have 1 bar handler');
    done();
  });

  test('all piped handles are removed for event + context', function (done) {
    var ventage1 = new Ventage();
    var ventage2 = new Ventage();
    ventage1.pipe('foo', ventage2);
    ventage1.pipe('foo', ventage2);
    ventage1.pipe('foo', ventage2);
    assert.lengthOf(ventage1._handlerMap.foo, 3, 'should have 3 foo handlers');
    ventage1.off('foo', null, ventage2);
    assert.isFalse(ventage1._handlerMap.hasOwnProperty('foo'), 'should have no foo handlers');
    done();
  });
});