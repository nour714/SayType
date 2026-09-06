/**
 * MetricsCalculator — tracks WPM, Accuracy, and Mistake counts in real time.
 * Pure calculation module with no DOM or event dependencies.
 */
export class MetricsCalculator {
  constructor() {
    this.reset();
  }

  /** Reset all counters and timers for a new sentence. */
  reset() {
    this.stopLiveUpdates();
    /** @type {number|null} */
    this._startTime = null;
    this._correctKeystrokes = 0;
    this._totalAttempts = 0;
    this._mistakes = 0;
    /** @type {Function|null} */
    this._onUpdate = null;
  }

  /** Start the timer on the first keystroke if it hasn't started yet. */
  startIfNeeded() {
    if (!this._startTime) {
      this._startTime = Date.now();
    }
  }

  /** Record a correctly-typed keystroke. */
  recordCorrect() {
    this._totalAttempts++;
    this._correctKeystrokes++;
  }

  /** Record a mistaken keystroke (wrong character). */
  recordMistake() {
    this._totalAttempts++;
    this._mistakes++;
  }

  /**
   * Current Words Per Minute (WPM).
   * Standard formula: (correct_chars / 5) / elapsed_minutes.
   * @returns {number}
   */
  get wpm() {
    if (!this._startTime) return 0;
    const elapsedSec = (Date.now() - this._startTime) / 1000;
    if (elapsedSec < 1) return 0;
    const elapsedMin = elapsedSec / 60;
    const words = this._correctKeystrokes / 5;
    return Math.max(0, Math.round(words / elapsedMin));
  }

  /**
   * Current accuracy percentage.
   * @returns {number} 0–100
   */
  get accuracy() {
    if (this._totalAttempts === 0) return 100;
    return Math.round((this._correctKeystrokes / this._totalAttempts) * 100);
  }

  /** @returns {number} */
  get mistakes() { return this._mistakes; }

  /** @returns {number} */
  get correctKeystrokes() { return this._correctKeystrokes; }

  /** @returns {number} */
  get totalAttempts() { return this._totalAttempts; }

  /**
   * Elapsed seconds since the first keystroke.
   * @returns {number}
   */
  get elapsedSeconds() {
    if (!this._startTime) return 0;
    return Math.max(1, (Date.now() - this._startTime) / 1000);
  }

  /**
   * Begin periodic live-stat updates.
   * @param {Function} callback — called with snapshot() every intervalMs
   * @param {number} [intervalMs=250]
   */
  startLiveUpdates(callback, intervalMs = 250) {
    this.stopLiveUpdates();
    this._onUpdate = callback;
    this._intervalId = setInterval(() => {
      if (this._onUpdate) this._onUpdate(this.snapshot());
    }, intervalMs);
  }

  /** Stop periodic live-stat updates. */
  stopLiveUpdates() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  /**
   * Frozen snapshot of current metrics.
   * @returns {{ wpm: number, accuracy: number, mistakes: number, elapsedSeconds: number }}
   */
  snapshot() {
    return {
      wpm: this.wpm,
      accuracy: this.accuracy,
      mistakes: this.mistakes,
      elapsedSeconds: this.elapsedSeconds,
    };
  }
}
