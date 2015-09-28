'use strict';
var chai = require('chai');
var assert = chai.assert;
var Ventage = require('../ventage');

suite('Ventage#pipe()', function () {
  setup(function (done) {
    done();
  });

  test('throws when no arguments provided', function (done) {
    var events = new Ventage();
    assert.throws(function () {
      events.pipe();
    }, Error);
    done();
  });

  test('creates a callback handler', function (done) {
    var ventage1 = new Ventage();
    var ventage2 = new Ventage();
    var callbackHandle = ventage1.pipe('foo', ventage2);
    assert.isFunction(callbackHandle);
    assert.lengthOf(ventage1._handlerMap.foo, 1, 'should have 1 foo handler');
    done();
  });

  test('triggers a piped event', function (done) {
    var ventage1 = new Ventage();
    var ventage2 = new Ventage();
    ventage2.on('foo', function () {
      done();
    });
    ventage1.pipe('foo', ventage2);
    ventage1.trigger('foo');
  });

  test('triggers a piped wildcard event', function (done) {
    var ventage1 = new Ventage();
    var ventage2 = new Ventage();
    ventage2.on('foo', function () {
      done();
    });
    ventage1.pipe('*', ventage2);
    ventage1.trigger('foo');
  });

  test('passes all arguments to piped event handler', function (done) {
    var ventage1 = new Ventage();
    var ventage2 = new Ventage();
    ventage2.on('foo', function () {
      assert.lengthOf(arguments, 2, 'event args not piped correctly');
      assert.isTrue(arguments[0]);
      assert.isObject(arguments[1]);
      done();
    });
    ventage1.pipe('foo', ventage2);
    ventage1.trigger('foo', true, {});
  });
});