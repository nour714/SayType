import { EventEmitter } from './EventEmitter.js';

/**
 * Valid lifecycle states for the learning session.
 * IDLE -> LESSON_START -> LOADING_SENTENCE -> LISTENING -> READY -> TYPING -> COMPLETED -> RESULT -> (loop)
 */
export const SESSION_STATES = {
  IDLE: 'IDLE',
  LESSON_START: 'LESSON_START',
  LOADING_SENTENCE: 'LOADING_SENTENCE',
  LISTENING: 'LISTENING',
  READY: 'READY',
  TYPING: 'TYPING',
  COMPLETED: 'COMPLETED',
  RESULT: 'RESULT'
};

/**
 * SessionEngine — orchestrates the complete lesson lifecycle.
 * Centralizes the state machine (IDLE -> LISTENING -> READY -> TYPING -> COMPLETED -> RESULT),
 * integrates SentenceEngine and MetricsCalculator, and emits session-level domain events:
 * - 'state:change': { from, to, sentence }
 * - 'sentence:loaded': { sentence, index, total }
 * - 'sentence:listen': { sentence, text }
 * - 'metrics:update': { wpm, accuracy, mistakes, elapsedSeconds }
 * - 'sentence:completed': { sentence, index, stats, isLast }
 * - 'word:mistake': { word, sentenceId }
 * - 'lesson:completed': { history, avgWpm, avgAccuracy, totalMistakes, totalSentences }
 * - 'lesson:restarted': {}
 */
export class SessionEngine extends EventEmitter {
  static STATES = SESSION_STATES;

  /**
   * @param {import('./SentenceEngine.js').SentenceEngine} sentenceEngine
   * @param {import('./MetricsCalculator.js').MetricsCalculator} metricsCalculator
   * @param {object} [options]
   * @param {boolean} [options.listenFirst=false] - Whether pronunciation must finish before typing
   */
  constructor(sentenceEngine, metricsCalculator, options = {}) {
    super();
    this.sentenceEngine = sentenceEngine;
    this.metrics = metricsCalculator;
    this.listenFirst = Boolean(options.listenFirst);

    this.state = SESSION_STATES.IDLE;
    this.sentences = [];
    this.currentSentenceIndex = 0;
    this.lessonHistory = [];
    this.isLessonCompleted = false;
    this.isLessonStarted = false;
    this.difficultWords = new Map();

    // Forward events from SentenceEngine
    this.sentenceEngine.on('char:correct', (payload) => {
      this.metrics.recordCorrect();
      this.emit('char:correct', payload);
      this.emit('metrics:update', this.metrics.snapshot());
    });

    this.sentenceEngine.on('char:wrong', (payload) => {
      this.metrics.recordMistake();
      if (payload.word) {
        const count = (this.difficultWords.get(payload.word) || 0) + 1;
        this.difficultWords.set(payload.word, count);
        this.emit('word:mistake', {
          word: payload.word,
          sentenceId: this.currentSentence?.id,
          mistakeCount: count
        });
      }
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
   * Transition session to a new state and emit domain event.
   * @param {string} nextState
   */
  setState(nextState) {
    if (this.state === nextState) return;
    const previousState = this.state;
    this.state = nextState;
    this.emit('state:change', {
      from: previousState,
      to: nextState,
      sentence: this.currentSentence
    });
  }

  /**
   * Configure listen-first gating.
   * @param {boolean} enabled
   */
  setListenFirst(enabled) {
    this.listenFirst = Boolean(enabled);
  }

  /**
   * Initialize or replace the sentence collection and start at index 0.
   * After loading, the session sits in LOADING_SENTENCE until beginLesson()
   * (the required user gesture) transitions it toward LISTENING.
   * @param {Array<{ id: number|string, text_en: string, text_ar: string, level?: string }>} sentences
   */
  setSentences(sentences) {
    this.sentences = Array.isArray(sentences) && sentences.length > 0 ? sentences : [];
    this.lessonHistory = [];
    this.isLessonCompleted = false;
    this.isLessonStarted = false;
    this.setState(SESSION_STATES.LOADING_SENTENCE);

    // Guard against an empty set: do not auto-complete an empty "lesson".
    if (this.sentences.length === 0) {
      this.currentSentenceIndex = 0;
      this.sentenceEngine.setSentence(null);
      this.emit('sentence:loaded', { sentence: null, index: 0, total: 0 });
      return;
    }

    this.loadSentence(0);
  }

  /**
   * Begin the lesson — the required first user gesture.
   * Transitions from LOADING_SENTENCE to LISTENING (listen-first) or READY,
   * and pronounces the current sentence.
   */
  beginLesson() {
    if (this.isLessonStarted) return;
    this.isLessonStarted = true;
    if (this.state === SESSION_STATES.LOADING_SENTENCE && this.currentSentence) {
      if (this.listenFirst) {
        this.setState(SESSION_STATES.LISTENING);
        const textToSpeak = this.currentSentence.text_en || this.currentSentence.english || '';
        this.emit('sentence:listen', {
          sentence: this.currentSentence,
          text: textToSpeak
        });
      } else {
        this.setState(SESSION_STATES.READY);
      }
    }
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

    this.setState(SESSION_STATES.LOADING_SENTENCE);
    this.currentSentenceIndex = index;
    const sentence = this.sentences[this.currentSentenceIndex];

    this.metrics.reset();
    this.sentenceEngine.setSentence(sentence);

    this.emit('sentence:loaded', {
      sentence,
      index: this.currentSentenceIndex,
      total: this.sentences.length
    });

    // Start live metrics update timer
    this.metrics.startLiveUpdates((snapshot) => {
      this.emit('metrics:update', snapshot);
    }, 250);

    // Initial metrics snapshot
    this.emit('metrics:update', this.metrics.snapshot());

    // Listen-first flow: if enabled and lesson already started, enter LISTENING;
    // otherwise remain LOADING_SENTENCE until beginLesson() transitions.
    if (this.listenFirst) {
      if (this.isLessonStarted) {
        this.setState(SESSION_STATES.LISTENING);
        const textToSpeak = sentence.text_en || sentence.english || '';
        this.emit('sentence:listen', { sentence, text: textToSpeak });
      }
    } else {
      this.setState(SESSION_STATES.READY);
    }
  }

  /**
   * Called when audio pronunciation completes (or is skipped).
   * Unlocks typing by transitioning from LISTENING to READY.
   */
  finishListening() {
    if (this.state === SESSION_STATES.LISTENING || this.state === SESSION_STATES.IDLE) {
      this.setState(SESSION_STATES.READY);
    }
  }

  /**
   * Delegate keystroke to typing engine while respecting state machine gating.
   * @param {string} key
   * @returns {object|null}
   */
  handleKey(key) {
    // Keystrokes are strictly disallowed during LISTENING, IDLE, COMPLETED, or RESULT
    if (this.state === SESSION_STATES.LISTENING || this.state === SESSION_STATES.IDLE) {
      return null;
    }

    if (this.isLessonCompleted || this.sentenceEngine.isCompleted || this.state === SESSION_STATES.COMPLETED || this.state === SESSION_STATES.RESULT) {
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

    // When in READY state, the first typing key transitions session to TYPING
    if (this.state === SESSION_STATES.READY) {
      if (key === 'Backspace' || (typeof key === 'string' && key.length === 1)) {
        this.setState(SESSION_STATES.TYPING);
      }
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

    if (this.listenFirst && this.isLessonStarted) {
      this.setState(SESSION_STATES.LISTENING);
      const textToSpeak = this.currentSentence ? (this.currentSentence.text_en || this.currentSentence.english || '') : '';
      this.emit('sentence:listen', { sentence: this.currentSentence, text: textToSpeak });
    } else {
      this.setState(SESSION_STATES.READY);
    }
  }

  /**
   * Internal handler when sentence completes.
   */
  _onSentenceFinished() {
    this.setState(SESSION_STATES.COMPLETED);
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

    this.setState(SESSION_STATES.RESULT);

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
   * The restart button click is itself a user gesture, so the listen-first
   * flow may resume immediately without re-showing the start overlay.
   */
  restartLesson() {
    this.lessonHistory = [];
    this.isLessonCompleted = false;
    this.isLessonStarted = true;
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

  get currentState() {
    return this.state;
  }
}
