import { EventEmitter } from '../core/EventEmitter.js';

/**
 * TrainingScreen — manages the interactive typing interface,
 * character rendering, caret movement, error feedback, focus handling,
 * and completion dialogs.
 *
 * Emits UI events:
 * - 'action:next': when next sentence is requested
 * - 'action:restart': when lesson restart is requested
 * - 'action:listen': when audio playback is requested
 */
export class TrainingScreen extends EventEmitter {
  constructor() {
    super();

    // Core Canvas Elements
    this.sentenceEnEl = document.getElementById('sentence-en');
    this.sentenceArEl = document.getElementById('sentence-ar');
    this.sentenceVessel = document.getElementById('sentence-vessel');
    this.listenBtn = document.getElementById('listen-btn');
    this.typingAnchor = document.getElementById('typing-anchor');
    this.focusReminder = document.getElementById('focus-reminder');

    // Modal Elements (Sentence Complete)
    this.sentenceModal = document.getElementById('sentence-complete-modal');
    this.modalWpm = document.getElementById('modal-wpm');
    this.modalAccuracy = document.getElementById('modal-accuracy');
    this.modalMistakes = document.getElementById('modal-mistakes');
    this.nextSentenceBtn = document.getElementById('next-sentence-btn');
    this.modalListenAgainBtn = document.getElementById('modal-listen-again-btn');

    // Modal Elements (Lesson Complete)
    this.lessonModal = document.getElementById('lesson-complete-modal');
    this.lessonWpm = document.getElementById('lesson-wpm');
    this.lessonAccuracy = document.getElementById('lesson-accuracy');
    this.lessonMistakes = document.getElementById('lesson-mistakes');
    this.restartLessonBtn = document.getElementById('restart-lesson-btn');

    /** @type {HTMLSpanElement[]} */
    this.charElements = [];
    this._modalTimeout = null;

    this._bindEvents();
  }

  _bindEvents() {
    // Listen buttons
    if (this.listenBtn) {
      this.listenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.emit('action:listen');
      });
    }

    if (this.modalListenAgainBtn) {
      this.modalListenAgainBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.emit('action:listen');
      });
    }

    // Modal buttons
    if (this.nextSentenceBtn) {
      this.nextSentenceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.emit('action:next');
      });
    }

    if (this.restartLessonBtn) {
      this.restartLessonBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.emit('action:restart');
      });
    }

    // Focus management
    document.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('.modal-card')) {
        return;
      }
      this.ensureTypingFocus();
    });

    if (this.sentenceVessel) {
      this.sentenceVessel.addEventListener('click', () => {
        if (this.focusReminder) this.focusReminder.style.display = 'none';
        this.ensureTypingFocus();
      });
    }

    window.addEventListener('focus', () => {
      if (!this.isAnyModalOpen()) {
        if (this.focusReminder) this.focusReminder.style.display = 'none';
        this.ensureTypingFocus();
      }
    });

    window.addEventListener('blur', () => {
      if (!this.isAnyModalOpen() && this.focusReminder) {
        this.focusReminder.style.display = 'block';
      }
    });
  }

  /**
   * Render a new sentence on the typographic canvas.
   * @param {{ text_en: string, text_ar: string }} sentence
   */
  renderSentence(sentence) {
    if (this._modalTimeout) {
      clearTimeout(this._modalTimeout);
      this._modalTimeout = null;
    }

    this.closeModals();

    if (this.sentenceArEl) {
      this.sentenceArEl.textContent = sentence.text_ar || '';
    }

    if (!this.sentenceEnEl) return;
    this.sentenceEnEl.innerHTML = '';
    this.charElements = [];

    const chars = (sentence.text_en || '').split('');
    chars.forEach((ch) => {
      const span = document.createElement('span');
      span.classList.add('char');

      if (ch === ' ') {
        span.classList.add('char-space');
        span.textContent = ' ';
      } else {
        span.textContent = ch;
      }

      span.classList.add('char-untyped');
      this.sentenceEnEl.appendChild(span);
      this.charElements.push(span);
    });

    this.updateCaret({ charIndex: 0, hasPendingError: false, isCompleted: false });
    this.ensureTypingFocus();
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

  /**
   * Display sentence completion dialog with stats.
   * @param {{ wpm: number, accuracy: number, mistakes: number }} stats
   */
  showSentenceModal(stats) {
    if (this.modalWpm) this.modalWpm.textContent = stats.wpm;
    if (this.modalAccuracy) this.modalAccuracy.textContent = `${stats.accuracy}%`;
    if (this.modalMistakes) this.modalMistakes.textContent = stats.mistakes;

    this._modalTimeout = setTimeout(() => {
      if (this.sentenceModal) {
        this.sentenceModal.classList.add('is-open');
        this.sentenceModal.setAttribute('aria-hidden', 'false');
      }
      if (this.nextSentenceBtn) {
        this.nextSentenceBtn.focus();
      }
    }, 450);
  }

  /**
   * Display lesson completion dialog with aggregated summary.
   * @param {{ avgWpm: number, avgAccuracy: number, totalMistakes: number }} summary
   */
  showLessonModal(summary) {
    this.closeModals();

    if (this.lessonWpm) this.lessonWpm.textContent = summary.avgWpm;
    if (this.lessonAccuracy) this.lessonAccuracy.textContent = `${summary.avgAccuracy}%`;
    if (this.lessonMistakes) this.lessonMistakes.textContent = summary.totalMistakes;

    if (this.lessonModal) {
      this.lessonModal.classList.add('is-open');
      this.lessonModal.setAttribute('aria-hidden', 'false');
    }

    if (this.restartLessonBtn) {
      this.restartLessonBtn.focus();
    }
  }

  /**
   * Close all active modals.
   */
  closeModals() {
    if (this.sentenceModal) {
      this.sentenceModal.classList.remove('is-open');
      this.sentenceModal.setAttribute('aria-hidden', 'true');
    }
    if (this.lessonModal) {
      this.lessonModal.classList.remove('is-open');
      this.lessonModal.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Set speaking indicator on listen button.
   * @param {boolean} speaking
   */
  setSpeaking(speaking) {
    if (this.listenBtn) {
      if (speaking) {
        this.listenBtn.classList.add('is-speaking');
      } else {
        this.listenBtn.classList.remove('is-speaking');
      }
    }
  }

  /**
   * Return true if either sentence modal or lesson modal is open.
   */
  isAnyModalOpen() {
    const isSentenceOpen = this.sentenceModal && this.sentenceModal.classList.contains('is-open');
    const isLessonOpen = this.lessonModal && this.lessonModal.classList.contains('is-open');
    return Boolean(isSentenceOpen || isLessonOpen);
  }

  /**
   * Focus hidden input anchor for reliable key capturing.
   */
  ensureTypingFocus() {
    if (this.typingAnchor && document.activeElement !== this.typingAnchor) {
      this.typingAnchor.focus();
    }
  }
}
