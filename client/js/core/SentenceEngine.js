import { EventEmitter } from './EventEmitter.js';

/**
 * SentenceEngine — handles char-by-char comparison and configurable typing behavior.
 * Supports:
 * - "strict" mode (default): Stop-at-error. Wrong keystroke does not advance cursor.
 * - "free" mode: Free typing. Wrong keystroke is counted, marked as mistake, and advances cursor.
 * 
 * Emits granular domain events:
 * - 'char:correct': { index, char, isComplete }
 * - 'char:wrong': { index, expected, actual, word }
 * - 'backspace': { charIndex, clearedError }
 * - 'caret:update': { charIndex, hasPendingError, isCompleted, length }
 * - 'sentence:complete': { sentence }
 */
export class SentenceEngine extends EventEmitter {
  /**
   * @param {object} [options]
   * @param {'strict' | 'free'} [options.typingMode='strict']
   */
  constructor(options = {}) {
    super();
    this.typingMode = options.typingMode || 'strict';
    this.targetSentence = null;
    this.text = '';
    this.charIndex = 0;
    this.hasPendingError = false;
    this.isCompleted = false;
    /** Track mistake flags per character in free mode @type {boolean[]} */
    this.charMistakes = [];
  }

  /**
   * Configure typing mode ('strict' | 'free').
   * @param {'strict' | 'free'} mode
   */
  setTypingMode(mode) {
    if (mode === 'strict' || mode === 'free') {
      this.typingMode = mode;
    }
  }

  /**
   * Load and prepare a sentence for typing.
   * @param {{ id: number|string, text_en: string, text_ar: string, level?: string, words?: Array }} sentence
   */
  setSentence(sentence) {
    this.targetSentence = sentence;
    this.text = sentence && (sentence.text_en || sentence.english) ? (sentence.text_en || sentence.english) : '';
    this.charIndex = 0;
    this.hasPendingError = false;
    this.isCompleted = false;
    this.charMistakes = new Array(this.text.length).fill(false);
    this.emit('sentence:loaded', { sentence: this.targetSentence });
    this.emit('caret:update', this.state);
  }

  /**
   * Reset the current sentence to index 0.
   */
  reset() {
    if (this.targetSentence) {
      this.setSentence(this.targetSentence);
    }
  }

  /**
   * Get the word containing or closest to the given character index.
   * @param {number} charIndex
   * @returns {{ rawWord: string, word: string, start: number, end: number } | null}
   */
  getWordAt(charIndex) {
    if (!this.text || charIndex < 0 || charIndex >= this.text.length) {
      return null;
    }
    let start = charIndex;
    while (start > 0 && /\S/.test(this.text[start - 1])) {
      start--;
    }
    let end = charIndex;
    while (end < this.text.length && /\S/.test(this.text[end])) {
      end++;
    }
    const rawWord = this.text.slice(start, end);
    const word = rawWord.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase();
    return { rawWord, word, start, end };
  }

  /**
   * Handle an incoming keystroke.
   * @param {string} key - e.g. e.key
   * @returns {object|null} result descriptor
   */
  handleKey(key) {
    if (this.isCompleted || !this.text) {
      return null;
    }

    // Handle Backspace
    if (key === 'Backspace') {
      if (this.typingMode === 'strict') {
        if (this.hasPendingError) {
          // Clear pending error at the current character index
          this.hasPendingError = false;
          this.emit('backspace', { charIndex: this.charIndex, clearedError: true });
          this.emit('caret:update', this.state);
          return { type: 'backspace', clearedError: true, charIndex: this.charIndex };
        } else if (this.charIndex > 0) {
          // Step back one character
          this.charIndex--;
          this.hasPendingError = false;
          this.emit('backspace', { charIndex: this.charIndex, clearedError: false });
          this.emit('caret:update', this.state);
          return { type: 'backspace', clearedError: false, charIndex: this.charIndex };
        }
      } else {
        // Free mode Backspace: step back and clear mistake state for that character
        if (this.charIndex > 0) {
          this.charIndex--;
          const wasMistake = this.charMistakes[this.charIndex];
          this.charMistakes[this.charIndex] = false;
          this.hasPendingError = false;
          this.emit('backspace', { charIndex: this.charIndex, clearedError: wasMistake });
          this.emit('caret:update', this.state);
          return { type: 'backspace', clearedError: wasMistake, charIndex: this.charIndex };
        }
      }
      return null;
    }

    // Only process single printable characters
    if (typeof key !== 'string' || key.length !== 1) {
      return null;
    }

    const targetChar = this.text[this.charIndex];
    const wordInfo = this.getWordAt(this.charIndex);
    const word = wordInfo ? wordInfo.word : '';

    if (key === targetChar) {
      // Correct keystroke
      const currentIndex = this.charIndex;
      this.hasPendingError = false;
      this.charIndex++;

      const isComplete = this.charIndex >= this.text.length;
      if (isComplete) {
        this.isCompleted = true;
      }

      this.emit('char:correct', { index: currentIndex, char: key, isComplete, word });
      this.emit('caret:update', this.state);

      if (isComplete) {
        this.emit('sentence:complete', { sentence: this.targetSentence });
      }

      return { type: 'correct', index: currentIndex, char: key, isComplete, word };
    } else {
      // Mistaken keystroke
      const currentIndex = this.charIndex;

      if (this.typingMode === 'strict') {
        // Strict mode: stop at error, do not advance cursor
        this.hasPendingError = true;
        this.emit('char:wrong', {
          index: currentIndex,
          expected: targetChar,
          actual: key,
          word
        });
        this.emit('caret:update', this.state);

        return {
          type: 'wrong',
          index: currentIndex,
          expected: targetChar,
          actual: key,
          word
        };
      } else {
        // Free mode: record mistake on character, advance cursor
        this.charMistakes[currentIndex] = true;
        this.hasPendingError = false;
        this.charIndex++;

        const isComplete = this.charIndex >= this.text.length;
        if (isComplete) {
          this.isCompleted = true;
        }

        this.emit('char:wrong', {
          index: currentIndex,
          expected: targetChar,
          actual: key,
          word,
          advanced: true
        });
        this.emit('caret:update', this.state);

        if (isComplete) {
          this.emit('sentence:complete', { sentence: this.targetSentence });
        }

        return {
          type: 'wrong',
          index: currentIndex,
          expected: targetChar,
          actual: key,
          word,
          advanced: true
        };
      }
    }
  }

  /**
   * Current snapshot of the typing engine state.
   */
  get state() {
    return {
      charIndex: this.charIndex,
      hasPendingError: this.hasPendingError,
      isCompleted: this.isCompleted,
      length: this.text.length,
      typingMode: this.typingMode
    };
  }

  get currentChar() {
    return this.text[this.charIndex] || null;
  }

  get length() {
    return this.text.length;
  }

  get targetText() {
    return this.text;
  }
}
