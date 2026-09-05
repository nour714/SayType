import { EventEmitter } from './EventEmitter.js';

/**
 * SessionEngine — orchestrates the complete lesson lifecycle.
 * Integrates SentenceEngine and MetricsCalculator, and emits session-level events:
 * - 'sentence:loaded': { sentence, index, total }
 * - 'metrics:update': { wpm, accuracy, mistakes, elapsedSeconds }
 * - 'sentence:completed': { sentence, index, stats, isLast }
 * - 'lesson:completed': { history, avgWpm, avgAccuracy, totalMistakes, totalSentences }
 * - 'lesson:restarted': {}
 */
export class SessionEngine extends EventEmitter {
  /**
   * @param {import('./SentenceEngine.js').SentenceEngine} sentenceEngine
   * @param {import('./MetricsCalculator.js').MetricsCalculator} metricsCalculator
   */
  constructor(sentenceEngine, metricsCalculator) {
    super();
    this.sentenceEngine = sentenceEngine;
    this.metrics = metricsCalculator;
    this.sentences = [];
    this.currentSentenceIndex = 0;
    this.lessonHistory = [];
    this.isLessonCompleted = false;

    // Forward events from SentenceEngine
    this.sentenceEngine.on('char:correct', (payload) => {
      this.metrics.recordCorrect();
      this.emit('char:correct', payload);
      this.emit('metrics:update', this.metrics.snapshot());
    });

    this.sentenceEngine.on('char:wrong', (payload) => {
      this.metrics.recordMistake();
      this.emit('char:wrong', payload);
      this.emit('metrics:update', this.metrics.snapshot());
    });

    this.sentenceEngine.on('backspace', (payload) => {
      this.emit('backspace', payload);
      this.emit('metrics:update', this.metrics.snapshot());
    });

    this.sentenceEngine.on('caret:update', (payload) => {
      this.emit('caret:update', payload);
    });

    this.sentenceEngine.on('sentence:complete', () => {
      this._onSentenceFinished();
    });
  }

  /**
   * Initialize or replace the sentence collection and start at index 0.
   * @param {Array<{ id: number, text_en: string, text_ar: string, level?: string }>} sentences
   */
  setSentences(sentences) {
    this.sentences = Array.isArray(sentences) && sentences.length > 0 ? sentences : [];
    this.lessonHistory = [];
    this.isLessonCompleted = false;
    this.loadSentence(0);
  }

  /**
   * Load sentence at specific index.
   * @param {number} index
   */
  loadSentence(index) {
    if (index >= this.sentences.length) {
      this.completeLesson();
      return;
    }

    this.currentSentenceIndex = index;
    const sentence = this.sentences[this.currentSentenceIndex];

    this.metrics.reset();
    this.sentenceEngine.setSentence(sentence);

    // Start live metrics update timer
    this.metrics.startLiveUpdates((snapshot) => {
      this.emit('metrics:update', snapshot);
    }, 250);

    this.emit('sentence:loaded', {
      sentence,
      index: this.currentSentenceIndex,
      total: this.sentences.length
    });

    // Initial metrics
    this.emit('metrics:update', this.metrics.snapshot());
  }

  /**
   * Delegate key stroke to typing engine and timer.
   * @param {string} key
   */
  handleKey(key) {
    if (this.isLessonCompleted || this.sentenceEngine.isCompleted) {
      return null;
    }

    // Ignore non-printable modifier/navigation keys
    if (key === 'Shift' || key === 'Control' || key === 'Alt' || 
        key === 'Meta' || key === 'CapsLock' || key === 'Tab' || 
        key.startsWith('Arrow') || key === 'PageUp' || key === 'PageDown' ||
        key === 'Home' || key === 'End' || key === 'Insert') {
      return null;
    }

    // Escape resets the current sentence
    if (key === 'Escape') {
      this.resetCurrentSentence();
      return null;
    }

    // Start metrics timer on first typing attempt
    if (key === 'Backspace' || (typeof key === 'string' && key.length === 1)) {
      this.metrics.startIfNeeded();
    }

    return this.sentenceEngine.handleKey(key);
  }

  /**
   * Reset current sentence progress to start.
   */
  resetCurrentSentence() {
    this.metrics.reset();
    this.sentenceEngine.reset();
    this.emit('sentence:loaded', {
      sentence: this.currentSentence,
      index: this.currentSentenceIndex,
      total: this.sentences.length
    });
    this.emit('metrics:update', this.metrics.snapshot());
  }

  /**
   * Internal handler when sentence completes.
   */
  _onSentenceFinished() {
    this.metrics.stopLiveUpdates();
    const stats = this.metrics.snapshot();
    const sentence = this.currentSentence;
    const isLast = this.currentSentenceIndex === this.sentences.length - 1;

    this.lessonHistory.push({
      sentenceId: sentence ? sentence.id : this.currentSentenceIndex + 1,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      mistakes: stats.mistakes,
      seconds: stats.elapsedSeconds
    });

    this.emit('sentence:completed', {
      sentence,
      index: this.currentSentenceIndex,
      stats,
      isLast
    });

    if (isLast) {
      setTimeout(() => {
        this.completeLesson();
      }, 450);
    }
  }

  /**
   * Trigger lesson completed state and calculate aggregate stats.
   */
  completeLesson() {
    this.isLessonCompleted = true;
    this.metrics.stopLiveUpdates();

    const totalSentences = this.lessonHistory.length || 1;
    const avgWpm = Math.round(this.lessonHistory.reduce((sum, item) => sum + item.wpm, 0) / totalSentences);
    const avgAccuracy = Math.round(this.lessonHistory.reduce((sum, item) => sum + item.accuracy, 0) / totalSentences);
    const totalMistakes = this.lessonHistory.reduce((sum, item) => sum + item.mistakes, 0);

    this.emit('lesson:completed', {
      history: [...this.lessonHistory],
      avgWpm,
      avgAccuracy,
      totalMistakes,
      totalSentences: this.sentences.length
    });
  }

  /**
   * Advance to the next sentence in the series.
   */
  advanceToNextSentence() {
    this.loadSentence(this.currentSentenceIndex + 1);
  }

  /**
   * Restart the lesson from sentence 0.
   */
  restartLesson() {
    this.lessonHistory = [];
    this.isLessonCompleted = false;
    this.emit('lesson:restarted');
    this.loadSentence(0);
  }

  get currentSentence() {
    return this.sentences[this.currentSentenceIndex] || null;
  }

  get totalSentences() {
    return this.sentences.length;
  }

  get isCurrentSentenceCompleted() {
    return this.sentenceEngine.isCompleted;
  }
}
