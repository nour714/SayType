import { EventEmitter } from '../core/EventEmitter.js';

/**
 * LevelSelector — minimalist CEFR level selection dropdown.
 * Emits:
 * - 'level:change': { level: string }
 */
export class LevelSelector extends EventEmitter {
  /**
   * @param {string} elementId
   * @param {string} [defaultLevel='A1']
   */
  constructor(elementId = 'level-select', defaultLevel = 'A1') {
    super();
    this.selectEl = document.getElementById(elementId);
    this._currentLevel = defaultLevel;
    this._bindEvents();
  }

  _bindEvents() {
    if (this.selectEl) {
      this.selectEl.addEventListener('change', (e) => {
        this._currentLevel = e.target.value;
        this.emit('level:change', { level: this._currentLevel });
      });
    }
  }

  /** @returns {string} */
  get level() {
    return this._currentLevel;
  }

  /**
   * Set the active level programmatically.
   * @param {string} level
   */
  setLevel(level) {
    this._currentLevel = level;
    if (this.selectEl) {
      this.selectEl.value = level;
    }
  }
}
