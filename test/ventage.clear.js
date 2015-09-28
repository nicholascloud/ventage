'use strict';
var chai = require('chai');
var assert = chai.assert;
var Ventage = require('../ventage');

suite('Ventage#clear()', function () {
  setup(function (done) {
    done();
  });

  test('clears all callbacks from the instance', function (done) {
    var events = new Ventage();
    var callback = function () {};
    events.on('foo', callback);
    events.on('bar', callback);
    events.on('baz', function () {}, {});
    assert.lengthOf(events._handlerMap.foo, 1);
    assert.lengthOf(events._handlerMap.bar, 1);
    assert.lengthOf(events._handlerMap.baz, 1);
    events.clear();
    assert.isFalse(events._handlerMap.hasOwnProperty('foo'));
    assert.isFalse(events._handlerMap.hasOwnProperty('bar'));
    assert.isFalse(events._handlerMap.hasOwnProperty('baz'));
    done();
  });
});
