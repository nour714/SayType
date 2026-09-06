import { EventEmitter } from '../core/EventEmitter.js';

/**
 * ThemeService — manages dark / light theme state, persistence, and meta tags.
 * Default is dark (Editorial Typographic Sanctuary).
 */
export class ThemeService extends EventEmitter {
  constructor(storageKey = 'typist_theme') {
    super();
    this.storageKey = storageKey;
    this.theme = 'dark';
  }

  /**
   * Initialize theme from localStorage or system preference.
   */
  init() {
    const saved = localStorage.getItem(this.storageKey);
    const initialTheme = saved === 'light' ? 'light' : 'dark';
    this.setTheme(initialTheme);
  }

  /**
   * Set theme explicitly ('dark' | 'light').
   * @param {'dark' | 'light'} theme
   */
  setTheme(theme) {
    this.theme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem(this.storageKey, this.theme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', this.theme === 'dark' ? '#0f1114' : '#f5f3ef');
    }

    this.emit('change', { theme: this.theme });
  }

  /**
   * Toggle between dark and light mode.
   * @returns {'dark' | 'light'}
   */
  toggle() {
    const next = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  get current() {
    return this.theme;
  }
}
