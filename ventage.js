/*global define*/
(function (global, factory) {
  'use strict';

  // AMD (require.js) module
  if (typeof define === 'function' && define.amd) {
    return define(['underscore'], function (_) {
      return factory(_);
    });
  }

  // browser
  global.Ventage = factory(global._);

}(this, function (_/*, global, undefined*/) {
  'use strict';

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

  var api = {
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
    _trigger: function (event, args, async) {
      var handlers = this._filterHandlers(event);
      if (handlers.length === 0) {
        return;
      }
      var invocation = _.bind(invoke, null, args, async);
      _.each(handlers, invocation);
    },
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
    },
    clear: function () {
      this._handlers = [];
    },
    trigger: function (event/*, ...args*/) {
      if (this._alwaysTriggerAsync) {
        return this.triggerAsync.apply(this, arguments);
      }
      var args = Array.prototype.slice.call(arguments, 1);
      this._trigger.call(this, event, args, false);
    },
    triggerAsync: function (event/*, ...args*/) {
      var args = Array.prototype.slice.call(arguments, 1);
      this._trigger.call(this, event, args, true);
    }
  };

  /**
   * Ventage constructor
   * @param {Boolean} [alwaysTriggerAsync] determines if events
   * should always be triggered asynchronously. Defaults to `false`.
   * @returns {Object} instance of Ventage
   * @constructor
   */
  function Ventage(alwaysTriggerAsync) {
    alwaysTriggerAsync = alwaysTriggerAsync || false;
    var instance = Object.create(api);
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