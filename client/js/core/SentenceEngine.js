import { EventEmitter } from './EventEmitter.js';

/**
 * SentenceEngine — handles char-by-char comparison and strict stop-at-error logic.
 * Decoupled from DOM and metrics calculation. Emits granular domain events:
 * - 'char:correct': { index, char, isComplete }
 * - 'char:wrong': { index, expected, actual }
 * - 'backspace': { charIndex, clearedError }
 * - 'caret:update': { charIndex, hasPendingError, isCompleted, length }
 * - 'sentence:complete': { sentence }
 */
export class SentenceEngine extends EventEmitter {
  constructor() {
    super();
    this.targetSentence = null;
    this.text = '';
    this.charIndex = 0;
    this.hasPendingError = false;
    this.isCompleted = false;
  }

  /**
   * Load and prepare a sentence for typing.
   * @param {{ id: number, text_en: string, text_ar: string, level?: string }} sentence
   */
  setSentence(sentence) {
    this.targetSentence = sentence;
    this.text = sentence && sentence.text_en ? sentence.text_en : '';
    this.charIndex = 0;
    this.hasPendingError = false;
    this.isCompleted = false;
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
      if (this.hasPendingError) {
        // Clear the pending error at the current character index
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
      return null;
    }

    // Only process single printable characters
    if (typeof key !== 'string' || key.length !== 1) {
      return null;
    }

    const targetChar = this.text[this.charIndex];

    if (key === targetChar) {
      // Correct keystroke!
      const currentIndex = this.charIndex;
      this.hasPendingError = false;
      this.charIndex++;

      const isComplete = this.charIndex >= this.text.length;
      if (isComplete) {
        this.isCompleted = true;
      }

      this.emit('char:correct', { index: currentIndex, char: key, isComplete });
      this.emit('caret:update', this.state);

      if (isComplete) {
        this.emit('sentence:complete', { sentence: this.targetSentence });
      }

      return { type: 'correct', index: currentIndex, char: key, isComplete };
    } else {
      // Wrong keystroke! Strict stop-at-error
      this.hasPendingError = true;
      this.emit('char:wrong', {
        index: this.charIndex,
        expected: targetChar,
        actual: key
      });
      this.emit('caret:update', this.state);

      return {
        type: 'wrong',
        index: this.charIndex,
        expected: targetChar,
        actual: key
      };
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
      length: this.text.length
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
