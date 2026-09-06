import { EventEmitter } from '../core/EventEmitter.js';

/**
 * ProgressService — manages local learner progress persistence in localStorage.
 * Tracks:
 * - Completed sentence IDs and count
 * - Best WPM, Average WPM, Average Accuracy, Total Mistakes
 * - Last session timestamp
 * - Favorite sentences (☆ / ★)
 * - Difficult words causing repeated mistakes
 * 
 * Completely free, no login or remote database required.
 */
export class ProgressService extends EventEmitter {
  constructor(storageKey = 'saytype_progress_v1') {
    super();
    this.storageKey = storageKey;
    this._memoryFallback = null;
    this._saveTimer = null;
    this.data = this._load();
  }

  /**
   * Load data safely from localStorage or fallback memory.
   * @private
   */
  _load() {
    const defaultData = {
      completedSentenceIds: [],
      completedCount: 0,
      bestWpm: 0,
      averageWpm: 0,
      averageAccuracy: 100,
      totalMistakes: 0,
      totalSessions: 0,
      lastSessionDate: null,
      favorites: [],
      difficultWords: {}
    };

    if (typeof window === 'undefined' || !window.localStorage) {
      this._memoryFallback = defaultData;
      return defaultData;
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...defaultData, ...parsed };
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using in-memory state:', e.message);
    }

    return defaultData;
  }

  /**
   * Persist current state to localStorage.
   * Debounced (300ms) so rapid mistake tracking doesn't hammer localStorage;
   * pass immediate=true for high-value mutations like favorites/completions.
   * @param {boolean} [immediate=false]
   * @private
   */
  _save(immediate = false) {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }

    if (immediate) {
      this._persist();
      return;
    }

    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this._persist();
    }, 300);
  }

  /**
   * Synchronous localStorage write + change notification.
   * @private
   */
  _persist() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      } catch (e) {
        console.warn('Could not write to localStorage:', e.message);
      }
    }
    this.emit('change', { stats: this.getStats() });
  }

  /**
   * Record metrics from a completed sentence.
   * @param {{
   *   sentenceId: number|string,
   *   wpm: number,
   *   accuracy: number,
   *   mistakes: number,
   *   difficultWords?: string[]
   * }} result
   */
  recordSentenceCompletion({ sentenceId, wpm, accuracy, mistakes, difficultWords = [] }) {
    if (sentenceId !== undefined && sentenceId !== null) {
      const strId = String(sentenceId);
      if (!this.data.completedSentenceIds.includes(strId)) {
        this.data.completedSentenceIds.push(strId);
      }
    }

    this.data.completedCount = this.data.completedSentenceIds.length;
    this.data.totalSessions = (this.data.totalSessions ?? 0) + 1;
    this.data.totalMistakes = (this.data.totalMistakes ?? 0) + (mistakes ?? 0);
    this.data.lastSessionDate = new Date().toISOString();

    if (wpm > (this.data.bestWpm || 0)) {
      this.data.bestWpm = wpm;
    }

    // Incremental running averages
    const n = this.data.totalSessions;
    if (n === 1) {
      this.data.averageWpm = wpm;
      this.data.averageAccuracy = accuracy;
    } else {
      this.data.averageWpm = Math.round(((this.data.averageWpm * (n - 1)) + wpm) / n);
      this.data.averageAccuracy = Math.round(((this.data.averageAccuracy * (n - 1)) + accuracy) / n);
    }

    // Record difficult words
    if (Array.isArray(difficultWords)) {
      difficultWords.forEach((word) => {
        this.recordMistakeOnWord(word);
      });
    }

    this._save(true);
  }

  /**
   * Record a mistake against a specific word token.
   * @param {string} word
   */
  recordMistakeOnWord(word) {
    if (!word || typeof word !== 'string') return;
    const clean = word.toLowerCase().trim();
    if (!clean) return;

    if (!this.data.difficultWords) {
      this.data.difficultWords = {};
    }

    this.data.difficultWords[clean] = (this.data.difficultWords[clean] ?? 0) + 1;
    this._save();
  }

  /**
   * Toggle a sentence ID as favorite.
   * @param {number|string} sentenceId
   * @returns {boolean} whether it is now favorite
   */
  toggleFavorite(sentenceId) {
    if (sentenceId === undefined || sentenceId === null) return false;
    const id = String(sentenceId);
    const index = this.data.favorites.indexOf(id);

    if (index >= 0) {
      this.data.favorites.splice(index, 1);
      this._save(true);
      this.emit('favorite:removed', { sentenceId: id });
      return false;
    } else {
      this.data.favorites.push(id);
      this._save(true);
      this.emit('favorite:added', { sentenceId: id });
      return true;
    }
  }

  /**
   * Check if a sentence is marked as favorite.
   * @param {number|string} sentenceId
   * @returns {boolean}
   */
  isFavorite(sentenceId) {
    if (sentenceId === undefined || sentenceId === null) return false;
    return this.data.favorites.includes(String(sentenceId));
  }

  /**
   * Get list of favorite sentence IDs.
   * @returns {string[]}
   */
  getFavorites() {
    return [...(this.data.favorites || [])];
  }

  /**
   * Get tracked difficult words sorted by mistake count descending.
   * @returns {Array<{ word: string, count: number }>}
   */
  getDifficultWords() {
    const map = this.data.difficultWords || {};
    return Object.entries(map)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get overall snapshot of learner metrics.
   * @returns {object}
   */
  getStats() {
    return {
      completedSentenceCount: this.data.completedSentenceIds.length,
      completedSentenceIds: [...this.data.completedSentenceIds],
      bestWpm: this.data.bestWpm ?? 0,
      averageWpm: this.data.averageWpm ?? 0,
      averageAccuracy: this.data.averageAccuracy ?? 100,
      totalMistakes: this.data.totalMistakes ?? 0,
      totalSessions: this.data.totalSessions ?? 0,
      lastSessionDate: this.data.lastSessionDate,
      favoritesCount: (this.data.favorites ?? []).length,
      difficultWordsCount: Object.keys(this.data.difficultWords ?? {}).length
    };
  }

  /**
   * Clear all persisted progress.
   */
  reset() {
    this.data = {
      completedSentenceIds: [],
      completedCount: 0,
      bestWpm: 0,
      averageWpm: 0,
      averageAccuracy: 100,
      totalMistakes: 0,
      totalSessions: 0,
      lastSessionDate: null,
      favorites: [],
      difficultWords: {}
    };
    this._save(true);
  }
}
