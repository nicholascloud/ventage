(function (global, factory) {
  'use strict';

  // AMD (require.js) module
  if (typeof define === 'function' && define.amd) {
    return define([], function () {
      return factory();
    });
  }

  // CommonJS module
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
    return;
  }

  // browser
  global.Ventage = factory();

}(this, function () {
  'use strict';

  var _ = {
    ES5_FOREACH: !!([].forEach),
    ES5_BIND: !!(function () {}.bind),
    ES5_KEYS: !!(Object.keys),
    ES5_MAP: !!([].map),

    isUndefined: function (wut) {
      return typeof wut === 'undefined';
    },

    isFunction: function (func) {
      /*jshint eqeqeq:false*/
      return typeof func == 'function';
      /*jshint eqeqeq:true*/
    },

    where: function (collection, criteria) {
      var found = [];
      this.each(collection, function (item) {
        for (var key in criteria) {
          if (!criteria.hasOwnProperty(key)) {
            continue;
          }
          if (!item.hasOwnProperty(key)) {
            return;
          }
          if (item[key] !== criteria[key]) {
            return;
          }
        }
        found.push(item);
      });
      return found;
    },

    union: function (/*...collections*/) {
      var arrays = Array.prototype.slice.call(arguments);
      var combined = [].concat.apply([], arrays);
      var unique = [];
      this.each(combined, function (item) {
        if (unique.indexOf(item) < 0) {
          unique.push(item);
        }
      });
      return unique;
    },

    bind: function (func, context /*...boundArgs*/) {
      var boundArgs = Array.prototype.slice.call(arguments, 2);
      if (this.ES5_BIND) {
        return func.bind.apply(func, [context].concat(boundArgs));
      }
      return function (/*...args*/) {
        var args = Array.prototype.slice.call(arguments);
        return func.apply(context, boundArgs.concat(args));
      };
    },

    each: function (collection, iterator, context) {
      if (this.ES5_FOREACH) {
        return collection.forEach(iterator, context);
      }
      var i = 0, len = collection.length;
      if (len === 0) {
        return;
      }
      for (i; i < len; i += 1) {
        iterator(collection[i], i, collection);
      }
    },

    difference: function (collection /*,...collections*/) {
      var arrays = Array.prototype.slice.call(arguments, 1);
      var combined = [].concat.apply([], arrays);
      var diffed = [];
      this.each(collection, function (item) {
        if (combined.indexOf(item) < 0) {
          diffed.push(item);
        }
      });
      return diffed;
    },

    extend: function (target /*...objects*/) {
      var self = this;
      var objects = Array.prototype.slice.call(arguments, 1);
      var len = objects.length;

      function accumulate(key, bucket, objectIndex) {
        if (arguments.length === 1) {
          bucket = [];
          objectIndex = 0;
        }
        if (objectIndex === len) {
          return bucket[0];
        }
        var object = objects[objectIndex];
        if (object.hasOwnProperty(key)) {
          bucket.unshift(object[key]);
        }
        return accumulate(key, bucket, objectIndex + 1);
      }

      var allKeys = self.union.apply(self, self.map(objects, function (object) {
        return self.keys(object);
      }));

      self.each(allKeys, function (key) {
        var value = accumulate(key);
        if (!self.isUndefined(value)) {
          target[key] = value;
        }
      });
      return target;
    },

    keys: function (object) {
      if (this.ES5_KEYS) {
        return Object.keys(object);
      }
      var keys = [];
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          keys.push(key);
        }
      }
      return keys;
    },

    map: function (collection, iterator) {
      if (this.ES5_MAP) {
        return collection.map(iterator);
      }
      var mapped = [];
      this.each(collection, function (item, index) {
        mapped[index] = iterator(item);
      });
      return mapped;
    }
  };

  var DEFAULT_CONTEXT = {},
    WILD_CARD = '*';

  /**
   * Invokes a handler in a specified way
   * @param {Array} args - arguments to pass to the handler
   * @param {Boolean} async - determines if the handler should be invoked asynchronously.
   * @param {Object} handler - object with a `callback` property of type Function
   */
  function invoke(args, async, handler) {
    if (async) {
      return setTimeout(function () {
        handler.callback.apply(handler.context, args);
      }, 0);
    }
    handler.callback.apply(handler.context, args);
  }

  /**
   * @typedef {Object} Handler
   * @param {String} event
   * @param {Function} callback
   * @param {Object|*} context
   */

  /**
   * @name VentageInterface
   */
  var ventageInterface = {
    /**
     * Filters event handlers based on given criteria.
     * @param {String} event
     * @param {Function} [callback]
     * @param {Object|*} [context]
     * @returns {Array.<Handler>} handlers
     * @private
     */
    _filterHandlers: function (event, callback, context) {
      var criteria = {
        event: event
      };
      if (_.isFunction(callback)) {
        criteria.callback = callback;
      }
      if (context) {
        criteria.context = context;
      }
      var namedHandlers = _.where(this._handlers, criteria);
      var wildcardHandlers = _.where(this._handlers, {event: WILD_CARD});
      return _.union(namedHandlers, wildcardHandlers);
    },

    /**
     * Triggers the specified event.
     * @param {String} event
     * @param {Array.<*>} args
     * @param {Boolean} async
     * @private
     */
    _trigger: function (event, args, async) {
      var handlers = this._filterHandlers(event);
      if (handlers.length === 0) {
        return;
      }
      var invocation = _.bind(invoke, null, args, async);
      _.each(handlers, invocation);
    },

    /**
     * Creates an event handler on the instance.
     * @param {String} event
     * @param {Function} callback
     * @param {Object|*} [context]
     */
    on: function (event, callback, context) {
      context = context || DEFAULT_CONTEXT;
      var handlers = this._filterHandlers(event, callback, context);
      if (handlers.length > 0) {
        return;
      }
      this._handlers.push({
        event: event,
        callback: callback,
        context: context
      });
    },

    /**
     * Removes some or all handlers from the instance.
     * @param {String} [event]
     * @param {Function} [callback]
     * @param {Object|*} [context]
     */
    off: function (event, callback, context) {
      if (arguments.length === 0) {
        return this.clear();
      }
      context = context || DEFAULT_CONTEXT;
      var handlers = this._filterHandlers(event, callback, context);
      if (handlers.length === 0) {
        return;
      }
      this._handlers = _.difference(this._handlers, handlers);
      _.each(handlers, function (handler) {
        handler.event = null;
        handler.callback = null;
        handler.context = null;
      });
    },

    /**
     * Clears all event handlers from the instance.
     */
    clear: function () {
      _.each(this._handlers, function (handler) {
        handler.event = null;
        handler.callback = null;
        handler.context = null;
      });
      this._handlers = [];
    },

    /**
     * Trigger an event synchronously.
     * @param {String} event
     * @param {...*} args
     */
    trigger: function (event, args) {
      if (this._alwaysTriggerAsync) {
        return this.triggerAsync.apply(this, arguments);
      }
      args = Array.prototype.slice.call(arguments, 1);
      this._trigger.call(this, event, args, false);
    },

    /**
     * Trigger an event asynchronously.
     * @param {String} event
     * @param {...*} [args]
     */
    triggerAsync: function (event, args) {
      args = Array.prototype.slice.call(arguments, 1);
      this._trigger.call(this, event, args, true);
    },

    /**
     * Pipes an event and its args to another Ventage instance.
     * @param {String} event
     * @param {Ventage} otherVentage
     * @returns {Function} callback
     */
    pipe: function (event, otherVentage) {
      function callback () {
        /*jshint validthis:true*/
        /*
         * The callback is invoked with the context object
         *   as its `this` value.
         */
        var triggerArgs = Array.prototype.slice.call(arguments, 0);
        triggerArgs.unshift(event);
        this.trigger.apply(this, triggerArgs);
      }
      this.on(event, callback, otherVentage);
      return callback;
    }
  };

  /**
   * @typedef {Object} Ventage
   * @augments VentageInterface
   * Ventage constructor
   * @param {Boolean} [alwaysTriggerAsync] determines if events
   * should always be triggered asynchronously. Defaults to `false`.
   * @returns {Object} instance of Ventage
   * @constructor
   */
  function Ventage(alwaysTriggerAsync) {
    alwaysTriggerAsync = alwaysTriggerAsync || false;
    var instance = Object.create(ventageInterface);
    instance._handlers = [];
    instance._alwaysTriggerAsync = alwaysTriggerAsync;
    return instance;
  }

  /**
   * Creates a new instance with a Ventage prototype.
   * @params {Object} [instanceApi] - methods and properties that should be added to the instance.
   */
  Ventage.create = function (instanceApi) {
    var instance = new Ventage();
    if (arguments.length === 1) {
      instance = _.extend(instance, instanceApi);
    }
    return instance;
  };

  return Ventage;

}));