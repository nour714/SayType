import { EventEmitter } from '../core/EventEmitter.js';

const STORAGE_KEY = 'saytype_settings_v1';

export class SettingsService extends EventEmitter {
  constructor() {
    super();
    this.data = this._load();
  }

  _load() {
    const defaults = {
      speechRate: 1,
      typingMode: 'strict',
      soundEnabled: true,
      interfaceLang: 'en'
    };

    if (typeof window === 'undefined' || !window.localStorage) return defaults;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch (_) {}
    return defaults;
  }

  _save() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (_) {}
    }
    this.emit('settings:change', { settings: this.data });
  }

  get(key) {
    return this.data[key];
  }

  getAll() {
    return { ...this.data };
  }

  set(key, value) {
    if (this.data[key] !== value) {
      this.data[key] = value;
      this._save();
    }
  }

  replaceAll(data) {
    if (data) {
      this.data = { ...this._load(), ...data };
      this._save();
    }
  }
}
