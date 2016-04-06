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

  /**
   * Copies properties to target from arguments passed
   *   subsequent to target.
   * @param {Object} target
   * @param {...Object}
   * @returns {Object}
   */
  function extend (target /*...objects*/) {
    var sources = Array.prototype.slice.call(arguments, 1);
    function copyFrom(source) {
      return function (key) {
        target[key] = source[key];
      };
    }
    while (sources.length) {
      var source = sources.shift();
      Object.keys(source).forEach(copyFrom(source));
    }
    return target;
  }

  /**
   * Default context constant.
   * @type {{}}
   */
  var DEFAULT_CONTEXT = {};

  /**
   * Wild card constant.
   * @type {string}
   */
  var WILD_CARD = '*';

  /**
   * Handler interface
   * @type {{prepare: Function, invoke: Function, dispose: Function}}
   */
  var handlerInterface = {

    /**
     * Prepare the arguments for the invocation.
     * @param {String} event
     * @param {Array.<*>} args
     * @returns {Array.<*>}
     */
    prepare: function (event, args) {
      return args;
    },

    /**
     * Invoke the handler's callback.
     * @param {Array.<*>} args
     * @param {Boolean} async
     */
    invoke: function (args, async) {
      var self = this;
      if (async) {
        setTimeout(function () {
          if (!self.isDisposed) {
            self.callback.apply(self.context, args);
          }
        }, 0);
      } else {
        self.callback.apply(self.context, args);
      }
    },

    /**
     * Dispose of this instance.
     */
    dispose: function () {
      if (this.isDisposed) {
        return;
      }
      this.callback = null;
      this.context = null;
      this.isDisposed = true;
    }
  };

  /**
   * Standard handler.
   * @name Handler
   * @param {Function} callback
   * @param {Object} context
   * @returns {handlerInterface}
   * @constructor
   */
  function Handler(callback, context) {
    var handler = Object.create(handlerInterface);
    handler.callback = callback || function () {};
    handler.context = context || DEFAULT_CONTEXT;
    handler.isDisposed = false;
    return handler;
  }

  /**
   * Piped handler.
   * @name PipedHandler
   * @param {Object} context
   * @returns {Handler}
   * @constructor
   */
  function PipedHandler(context) {
    var handler = new Handler(null, context);

    handler.prepare = function (event, args) {
      return [event].concat(args);
    };

    handler.callback = function () {
      // the value of `this` within the callback is
      // always the context object
      var pipedArgs = Array.prototype.slice.call(arguments, 0);
      this.trigger.apply(this, pipedArgs);
    };

    return handler;
  }

  /**
   * @name VentageInterface
   */
  var ventageInterface = {
    /**
     * Triggers the specified event.
     * @param {String} event
     * @param {Array.<*>} args
     * @param {Boolean} async
     * @private
     */
    _trigger: function (event, args, async) {
      var eventHandlers = (this._handlerMap[event] || []);
      var wildcardHandlers = (this._handlerMap[WILD_CARD] || []);
      var triggerHandlers = eventHandlers.concat(wildcardHandlers);
      triggerHandlers.forEach(function (handler) {
        args = handler.prepare(event, args);
        handler.invoke(args, async);
      });
    },

    /**
     * Add a handler to the internal handler map.
     * @param {String} event
     * @param {Handler} handler
     * @private
     */
    _addHandler: function (event, handler) {
      var map = this._handlerMap;
      if (!map.hasOwnProperty(event)) {
        map[event] = [];
      }
      map[event].push(handler);
    },

    /**
     * Creates an event handler on the instance.
     * @param {String} event
     * @param {Function} callback
     * @param {Object|*} [context]
     */
    on: function (event, callback, context) {
      if (!event) {
        throw new Error('must supply an event name: event');
      }
      if (!callback) {
        throw new Error('must supply a callback: callback');
      }
      this._addHandler(event, new Handler(callback, context));
    },

    /**
     * Pipes an event and its args to another Ventage instance.
     *   If `event` is not supplied all events will be piped to
     *   `otherVentage`.
     * @param {String} [event]
     * @param {Ventage} otherVentage
     * @returns {Function} callback
     */
    pipe: function (event, otherVentage) {
      if (arguments.length === 1) {
        otherVentage = event;
        event = WILD_CARD;
      }
      if (!otherVentage) {
        throw new Error('must supply a target for piped events: otherVentage');
      }
      var pipedHandler = new PipedHandler(otherVentage);
      this._addHandler(event, pipedHandler);
      return pipedHandler.callback;
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

      var map = this._handlerMap,
        handlers = map[event],
        culledHandlers = [],
        handler,
        dispose;

      while (handlers.length) {
        handler = handlers.shift();
        dispose = true;

        if (callback) {
          dispose = dispose && callback === handler.callback;
        }

        if (context) {
          dispose = dispose && context === handler.context;
        }

        if (dispose) {
          handler.dispose();
        } else {
          culledHandlers.push(handler);
        }
      }

      if (culledHandlers.length) {
        map[event] = culledHandlers;
      } else {
        map[event] = null;
        delete map[event];
      }
    },

    /**
     * Clears all event handlers from the instance.
     */
    clear: function () {
      var map = this._handlerMap;
      Object.keys(map).forEach(function (event) {
        var handlers = map[event];
        while (handlers.length) {
          handlers.shift().dispose();
        }
      });
      this._handlerMap = {};
    },

    /**
     * Trigger an event synchronously.
     * @param {String} event
     * @param {...*}
     */
    trigger: function (event/*, ...args*/) {
      if (!event) {
        throw new Error('must supply an event name: event');
      }
      if (this._alwaysTriggerAsync) {
        return this.triggerAsync.apply(this, arguments);
      }
      var args = Array.prototype.slice.call(arguments, 1);
      this._trigger(event, args, false);
    },

    /**
     * Trigger an event asynchronously.
     * @param {String} event
     * @param {...*}
     */
    triggerAsync: function (event/*, ...args*/) {
      var args = Array.prototype.slice.call(arguments, 1);
      this._trigger(event, args, true);
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
    instance._handlerMap = {};
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
      instance = extend(instance, instanceApi);
    }
    return instance;
  };

  return Ventage;

}));