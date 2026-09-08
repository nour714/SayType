/**
 * TypingRenderer — owns the character-span DOM for the sentence canvas:
 * building per-character spans, typing feedback classes, and caret placement.
 * Composed inside TrainingScreen (not inherited): TrainingScreen keeps
 * onCharCorrect/onCharWrong/onBackspace/updateCaret delegates so its public
 * API and event contract are unchanged.
 */
export class TypingRenderer {
  constructor() {
    this.sentenceEnEl = document.getElementById('sentence-en');

    /** @type {HTMLSpanElement[]} */
    this.charElements = [];
  }

  /**
   * Build per-character spans for the given text on the typographic canvas.
   * Groups word characters in .word-token spans while keeping individual
   * .char elements.
   * @param {string} text
   */
  renderCharacters(text) {
    if (!this.sentenceEnEl) return;
    this.sentenceEnEl.innerHTML = '';
    this.charElements = [];

    let currentWordSpan = null;
    let currentWordRaw = '';

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const span = document.createElement('span');
      span.classList.add('char');

      if (ch === ' ') {
        span.classList.add('char-space', 'char-untyped');
        span.textContent = ' ';
        this.sentenceEnEl.appendChild(span);
        this.charElements.push(span);
        currentWordSpan = null;
        currentWordRaw = '';
      } else {
        span.textContent = ch;
        span.classList.add('char-untyped');

        if (!currentWordSpan) {
          currentWordSpan = document.createElement('span');
          currentWordSpan.classList.add('word-token');
          this.sentenceEnEl.appendChild(currentWordSpan);
        }

        currentWordSpan.appendChild(span);
        this.charElements.push(span);
        currentWordRaw += ch;
        currentWordSpan.dataset.word = currentWordRaw.replace(
          /^[^\w]+|[^\w]+$/g,
          ''
        );
      }
    }
  }

  /**
   * Clear the character canvas (empty/error states).
   */
  clearCharacters() {
    if (this.sentenceEnEl) {
      this.sentenceEnEl.innerHTML = '';
    }
    this.charElements = [];
  }

  /**
   * Handle correct character typing.
   * @param {{ index: number }} payload
   */
  onCharCorrect({ index }) {
    const span = this.charElements[index];
    if (span) {
      span.classList.remove('char-wrong', 'char-untyped');
      span.classList.add('char-correct');
    }
  }

  /**
   * Handle mistaken keystroke at target position.
   * @param {{ index: number }} payload
   */
  onCharWrong({ index }) {
    const span = this.charElements[index];
    if (span) {
      span.classList.remove('char-wrong');
      // Trigger CSS reflow to restart shake animation
      void span.offsetWidth;
      span.classList.add('char-wrong');
    }
  }

  /**
   * Handle backspace event.
   * @param {{ charIndex: number, clearedError: boolean }} payload
   */
  onBackspace({ charIndex, clearedError }) {
    const span = this.charElements[charIndex];
    if (span) {
      if (clearedError) {
        span.classList.remove('char-wrong');
      } else {
        span.classList.remove('char-correct', 'char-wrong');
        span.classList.add('char-current');
      }
    }
  }

  /**
   * Synchronize caret position and character highlight classes.
   * @param {{ charIndex: number, hasPendingError: boolean, isCompleted?: boolean }} state
   */
  updateCaret({ charIndex, hasPendingError }) {
    if (!this.sentenceEnEl) return;

    // Remove existing caret elements
    const carets = this.sentenceEnEl.querySelectorAll('.char-caret');
    carets.forEach((c) => c.remove());

    this.charElements.forEach((span, idx) => {
      span.classList.remove('char-current');
      if (idx < charIndex) {
        span.classList.remove('char-untyped', 'char-wrong');
        span.classList.add('char-correct');
      } else if (idx === charIndex) {
        span.classList.remove('char-correct');
        if (!hasPendingError) {
          span.classList.remove('char-wrong');
        }
        span.classList.add('char-current');
      } else {
        span.classList.remove('char-correct', 'char-wrong', 'char-current');
        span.classList.add('char-untyped');
      }
    });

    if (charIndex < this.charElements.length) {
      const activeSpan = this.charElements[charIndex];
      const caret = document.createElement('span');
      caret.className = 'char-caret';
      caret.setAttribute('aria-hidden', 'true');
      activeSpan.insertBefore(caret, activeSpan.firstChild);
    } else if (this.charElements.length > 0) {
      // Caret at end of finished sentence
      const lastSpan = this.charElements[this.charElements.length - 1];
      const caret = document.createElement('span');
      caret.className = 'char-caret caret-trail';
      caret.setAttribute('aria-hidden', 'true');
      lastSpan.appendChild(caret);
    }
  }
}
