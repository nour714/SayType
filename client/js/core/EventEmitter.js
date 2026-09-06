/**
 * EventEmitter — lightweight pub/sub base class for decoupled module communication.
 * Used by SentenceEngine and SessionEngine to fire domain events
 * that UI modules subscribe to.
 */
export class EventEmitter {
  constructor() {
    /** @type {Object<string, Function[]>} */
    this._listeners = {};
  }

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} fn
   * @returns {this}
   */
  on(event, fn) {
    (this._listeners[event] || (this._listeners[event] = [])).push(fn);
    return this;
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event
   * @param {Function} fn
   * @returns {this}
   */
  off(event, fn) {
    const list = this._listeners[event];
    if (list) {
      this._listeners[event] = list.filter(f => f !== fn);
    }
    return this;
  }

  /**
   * Emit an event with optional payload.
   * Isolates listener errors so one faulty listener cannot break others.
   * @param {string} event
   * @param {...*} args
   */
  emit(event, ...args) {
    const list = this._listeners[event];
    if (list) {
      list.forEach(fn => {
        try {
          fn(...args);
        } catch (err) {
          console.error(`EventEmitter: listener error on "${event}":`, err);
        }
      });
    }
  }
}
