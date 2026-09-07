import { EventEmitter } from './EventEmitter.js';

export class Router extends EventEmitter {
  constructor() {
    super();
    this.routes = {};
    this.current = null;
    this._onHashChange = this._onHashChange.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', this._onHashChange);
    }
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    if (typeof window !== 'undefined') {
      window.location.hash = path;
    }
  }

  _onHashChange() {
    this._resolve();
  }

  _resolve() {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const params = {};

    if (queryString) {
      for (const [key, value] of new URLSearchParams(queryString)) {
        params[key] = value;
      }
    }

    const handler = this.routes[path] || this.routes['*'];
    if (handler) {
      this.current = path;
      handler(params);
      this.emit('route:change', { path, params });
    } else {
      this.navigate('/');
    }
  }

  init(defaultRoute = '/') {
    if (typeof window === 'undefined') return;
    if (!window.location.hash) {
      window.location.hash = defaultRoute;
    } else {
      this._resolve();
    }
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('hashchange', this._onHashChange);
    }
  }
}
