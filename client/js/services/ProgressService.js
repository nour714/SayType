import { EventEmitter } from '../core/EventEmitter.js';

/** Leitner box intervals (in sentences-typed units) for review scheduling. */
const BOX_INTERVALS = [10, 20, 40, 80];

/**
 * ProgressService — manages local learner progress persistence in localStorage.
 * Tracks:
 * - Completed sentence IDs and count
 * - Best WPM, Average WPM, Average Accuracy, Total Mistakes
 * - Last session timestamp
 * - Favorite sentences (☆ / ★)
 * - Difficult words causing repeated mistakes
 * - Smart spaced review system (Leitner boxes)
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
      difficultWords: {},
      sentencesTypedTotal: 0,
      wordReview: {}
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

    // Increment the global sentences-typed counter (review scheduling clock)
    this.data.sentencesTypedTotal = (this.data.sentencesTypedTotal ?? 0) + 1;

    if (wpm > (this.data.bestWpm ?? 0)) {
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
   * Also updates the Leitner review state for the word.
   * @param {string} word
   * @param {boolean} [skipReview=false] - If true, don't update wordReview (for review sentences handled separately)
   */
  recordMistakeOnWord(word, skipReview = false) {
    if (!word || typeof word !== 'string') return;
    const clean = word.toLowerCase().trim();
    if (!clean) return;

    if (!this.data.difficultWords) {
      this.data.difficultWords = {};
    }

    this.data.difficultWords[clean] = (this.data.difficultWords[clean] ?? 0) + 1;

    // Update Leitner review state for this word (unless skipReview is set)
    if (!skipReview) {
      this._updateWordReviewOnMistake(clean);
    }

    this._save();
  }

  /**
   * Update wordReview state when a mistake occurs on a word.
   * Sets the word to box 0, due at the current sentencesTypedTotal.
   * @private
   * @param {string} cleanWord
   */
  _updateWordReviewOnMistake(cleanWord) {
    if (!this.data.wordReview) {
      this.data.wordReview = {};
    }

    const current = this.data.wordReview[cleanWord];
    // Don't override if currently in an active review (recordWordReviewOutcome handles that)
    if (current && current._inReview) return;

    this.data.wordReview[cleanWord] = {
      box: 0,
      dueAtCount: this.data.sentencesTypedTotal ?? 0,
      mastered: false
    };
  }

  /**
   * Record the outcome of a review session for a specific word.
   * @param {string} word
   * @param {boolean} success - true if typed correctly, false if mistake occurred
   */
  recordWordReviewOutcome(word, success) {
    if (!word || typeof word !== 'string') return;
    const clean = word.toLowerCase().trim();
    if (!clean) return;

    if (!this.data.wordReview) {
      this.data.wordReview = {};
    }

    const entry = this.data.wordReview[clean];
    if (!entry) return;

    // Clear the in-review flag
    delete entry._inReview;

    if (success) {
      // Successful review: advance to next box
      entry.box = (entry.box ?? 0) + 1;

      // Check if word is now mastered (passed box 4)
      if (entry.box >= BOX_INTERVALS.length) {
        entry.mastered = true;
        entry.dueAtCount = Infinity; // Never due again
      } else {
        // Schedule next review based on the interval for the new box
        entry.dueAtCount = (this.data.sentencesTypedTotal ?? 0) + BOX_INTERVALS[entry.box - 1];
      }
    } else {
      // Failed review: reset to box 0, due at current count
      entry.box = 0;
      entry.dueAtCount = this.data.sentencesTypedTotal ?? 0;
    }

    this._save(true);
  }

  /**
   * Get words that are due for review.
   * @param {number} limit - Maximum number of words to return (default 3)
   * @returns {Array<{ word: string, box: number }>}
   */
  getDueReviewWords(limit = 3) {
    if (!this.data.wordReview) return [];

    const totalTyped = this.data.sentencesTypedTotal ?? 0;

    return Object.entries(this.data.wordReview)
      .filter(([, entry]) => !entry.mastered && entry.dueAtCount <= totalTyped)
      .sort((a, b) => a[1].dueAtCount - b[1].dueAtCount) // Most overdue first
      .slice(0, limit)
      .map(([word, entry]) => ({ word, box: entry.box }));
  }

  /**
   * Mark a word as currently in a review session.
   * @param {string} word
   */
  markWordInReview(word) {
    if (!word || typeof word !== 'string') return;
    const clean = word.toLowerCase().trim();
    if (!clean) return;

    if (!this.data.wordReview) {
      this.data.wordReview = {};
    }

    const entry = this.data.wordReview[clean];
    if (entry) {
      entry._inReview = true;
      this._save();
    }
  }

  /**
   * Get the total number of sentences typed (review scheduling clock).
   * @returns {number}
   */
  getSentencesTypedTotal() {
    return this.data.sentencesTypedTotal ?? 0;
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
   * Replace all progress data (used when pulling authoritative server state on login).
   * Merges onto the default shape so older server rows don't crash on missing fields.
   * @param {object} data
   */
  replaceAll(data) {
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
      difficultWords: {},
      sentencesTypedTotal: 0,
      wordReview: {}
    };
    this.data = { ...defaultData, ...data };
    this._save(true);
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
      difficultWords: {},
      sentencesTypedTotal: 0,
      wordReview: {}
    };
    this._save(true);
  }
}
