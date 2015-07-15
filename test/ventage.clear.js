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
    assert.lengthOf(events._handlers, 3);
    events.clear();
    assert.lengthOf(events._handlers, 0);
    done();
  });
});
