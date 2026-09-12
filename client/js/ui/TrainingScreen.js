import { EventEmitter } from '../core/EventEmitter.js';
import { DictionaryTooltip } from './DictionaryTooltip.js';
import { TypingRenderer } from './TypingRenderer.js';

/**
 * TrainingScreen — manages the interactive typing interface,
 * focus handling, learning state indicator, favorite toggling,
 * and completion dialogs.
 *
 * Composes two sub-components that own their own DOM refs:
 * - DictionaryTooltip: word lexical inspection tooltip
 * - TypingRenderer: character-span rendering, typing feedback, caret
 * Their methods are re-exposed here as delegates so this class keeps
 * its exact existing public API and event contract.
 *
 * Emits UI events:
 * - 'action:next': when next sentence is requested
 * - 'action:restart': when lesson restart is requested
 * - 'action:listen': when audio playback is requested
 * - 'action:favorite': when favorite button is toggled
 * - 'action:start-lesson': when lesson start overlay is dismissed
 * - 'action:key': when keystroke comes from virtual keyboard
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

    // Meta & State Elements
    this.stateIndicator = document.getElementById('state-indicator');
    this.stateText = document.getElementById('state-indicator-text');
    this.favoriteBtn = document.getElementById('favorite-btn');

    // Review Badge Element
    this.reviewBadge = document.getElementById('review-badge');

    // Start Lesson Overlay Elements
    this.startOverlay = document.getElementById('lesson-start-overlay');
    this.startLessonBtn = document.getElementById('start-lesson-btn');

    // Modal Elements (Sentence Complete)
    this.sentenceModal = document.getElementById('sentence-complete-modal');
    this.modalWpm = document.getElementById('modal-wpm');
    this.modalAccuracy = document.getElementById('modal-accuracy');
    this.modalMistakes = document.getElementById('modal-mistakes');
    this.nextSentenceBtn = document.getElementById('next-sentence-btn');
    this.modalListenAgainBtn = document.getElementById(
      'modal-listen-again-btn'
    );

    // Modal Elements (Lesson Complete)
    this.lessonModal = document.getElementById('lesson-complete-modal');
    this.lessonWpm = document.getElementById('lesson-wpm');
    this.lessonAccuracy = document.getElementById('lesson-accuracy');
    this.lessonMistakes = document.getElementById('lesson-mistakes');
    this.restartLessonBtn = document.getElementById('restart-lesson-btn');

    /** Composed sub-components, each owning its own DOM refs. */
    this.dictionaryTooltip = new DictionaryTooltip();
    this.typingRenderer = new TypingRenderer();

    this._modalTimeout = null;
    this.currentSentence = null;
    this.dictionaryService = null;

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

    // Favorite button
    if (this.favoriteBtn) {
      this.favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.emit('action:favorite');
      });
    }

    // Start lesson button
    if (this.startLessonBtn) {
      this.startLessonBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeStartOverlay();
        this.emit('action:start-lesson');
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

    // Mobile virtual keyboard input on hidden anchor
    if (this.typingAnchor) {
      this.typingAnchor.addEventListener('input', (e) => {
        this.hideTooltip();
        const inputType = e.inputType;
        const data = e.data;
        const val = this.typingAnchor.value;
        this.typingAnchor.value = '';

        if (inputType === 'deleteContentBackward') {
          this.emit('action:key', 'Backspace');
        } else if (data) {
          for (const char of data) {
            this.emit('action:key', char);
          }
        } else if (val) {
          for (const char of val) {
            this.emit('action:key', char);
          }
        }
      });
    }

    // Word hover & tap inspection
    if (this.sentenceEnEl) {
      // Desktop mouse hover
      this.sentenceEnEl.addEventListener('mouseover', (e) => {
        const token = e.target.closest('.word-token');
        if (token && token.dataset.word && this.dictionaryService) {
          const info = this.dictionaryService.lookup(
            token.dataset.word,
            this.currentSentence
          );
          if (info) {
            this.showTooltip(info, token.getBoundingClientRect());
          }
        }
      });

      this.sentenceEnEl.addEventListener('mouseout', (e) => {
        const token = e.target.closest('.word-token');
        if (token) {
          const related = e.relatedTarget
            ? e.relatedTarget.closest('.word-token')
            : null;
          if (related !== token) {
            this.hideTooltip();
          }
        }
      });

      // Mobile / click tap toggle
      this.sentenceEnEl.addEventListener('click', (e) => {
        const token = e.target.closest('.word-token');
        if (token && token.dataset.word && this.dictionaryService) {
          e.stopPropagation();
          const info = this.dictionaryService.lookup(
            token.dataset.word,
            this.currentSentence
          );
          if (info) {
            if (this.dictionaryTooltip.isShowingWord(info.word)) {
              this.hideTooltip();
            } else {
              this.showTooltip(info, token.getBoundingClientRect());
            }
          }
        } else {
          this.hideTooltip();
        }
      });
    }

    // Dismiss tooltip on outside click or scroll
    document.addEventListener('click', (e) => {
      if (
        !e.target.closest('#word-tooltip') &&
        !e.target.closest('.word-token')
      ) {
        this.hideTooltip();
      }
    });

    window.addEventListener('scroll', () => this.hideTooltip(), {
      passive: true
    });

    // Focus management
    document.addEventListener('click', (e) => {
      if (
        e.target.closest('button') ||
        e.target.closest('.modal-card') ||
        e.target.closest('select')
      ) {
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
   * Set DictionaryService reference for word lookup.
   * @param {import('../services/DictionaryService.js').DictionaryService} dictionaryService
   */
  setDictionaryService(dictionaryService) {
    this.dictionaryService = dictionaryService;
  }

  /**
   * Render a new sentence on the typographic canvas.
   * Groups word characters in .word-token spans while keeping individual .char elements.
   * @param {{ text_en: string, text_ar: string, english?: string, arabic?: string, words?: Array }} sentence
   */
  renderSentence(sentence) {
    this.currentSentence = sentence;
    this.dictionaryTooltip.currentSentence = sentence;
    this.hideTooltip();

    if (this._modalTimeout) {
      clearTimeout(this._modalTimeout);
      this._modalTimeout = null;
    }

    this.closeModals();

    if (this.sentenceArEl) {
      this.sentenceArEl.textContent = sentence.text_ar || sentence.arabic || '';
    }

    if (!this.sentenceEnEl) return;

    const text = sentence.text_en || sentence.english || '';
    this.typingRenderer.renderCharacters(text);

    this.updateCaret({
      charIndex: 0,
      hasPendingError: false,
      isCompleted: false
    });
    this.ensureTypingFocus();
  }

  /**
   * Display lexical word tooltip near target element rect.
   * Delegates to the composed DictionaryTooltip.
   * @param {{ word: string, translation: string, pronunciation: string, partOfSpeech: string }} info
   * @param {DOMRect} targetRect
   */
  showTooltip(info, targetRect) {
    this.dictionaryTooltip.showTooltip(info, targetRect);
  }

  /**
   * Hide lexical word inspection tooltip.
   * Delegates to the composed DictionaryTooltip.
   */
  hideTooltip() {
    this.dictionaryTooltip.hideTooltip();
  }

  /**
   * Whether the word tooltip is currently visible.
   * Delegates to the composed DictionaryTooltip.
   * @returns {boolean}
   */
  isTooltipVisible() {
    return this.dictionaryTooltip.isTooltipVisible();
  }

  /**
   * Focusable elements within the currently open dialog (for focus trapping).
   * @returns {HTMLElement[]}
   */
  getModalFocusables() {
    let openModal = null;
    if (
      this.sentenceModal &&
      this.sentenceModal.classList.contains('is-open')
    ) {
      openModal = this.sentenceModal;
    } else if (
      this.lessonModal &&
      this.lessonModal.classList.contains('is-open')
    ) {
      openModal = this.lessonModal;
    } else if (
      this.startOverlay &&
      this.startOverlay.classList.contains('is-open')
    ) {
      openModal = this.startOverlay;
    }
    if (!openModal) return [];

    return Array.from(
      openModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }

  /**
   * Show a calm empty state when the selected topic has no sentences.
   */
  showEmptyState() {
    this.hideTooltip();
    this.closeModals();

    this.typingRenderer.clearCharacters();

    if (this.sentenceEnEl) {
      const message = document.createElement('div');
      message.className = 'empty-state-msg';
      message.textContent = 'No lessons available for this topic.';
      this.sentenceEnEl.appendChild(message);
      const link = document.createElement('a');
      link.href = '#/learn';
      link.className = 'action-btn secondary-btn';
      link.textContent = 'Back to Learn';
      link.style.marginTop = '16px';
      this.sentenceEnEl.appendChild(link);
    }
    if (this.sentenceArEl) {
      this.sentenceArEl.textContent = 'لا توجد دروس متاحة لهذا الموضوع.';
    }

    this.setStateIndicator('EMPTY');
  }

  /**
   * Show error state when sentence loading fails.
   */
  showError() {
    this.hideTooltip();
    this.closeModals();

    this.typingRenderer.clearCharacters();

    if (this.sentenceEnEl) {
      const message = document.createElement('div');
      message.className = 'empty-state-msg';
      message.textContent =
        'Failed to load sentences. Check your connection and try again.';
      this.sentenceEnEl.appendChild(message);
      const link = document.createElement('a');
      link.href = '#/';
      link.className = 'action-btn secondary-btn';
      link.textContent = 'Back to Home';
      link.style.marginTop = '16px';
      this.sentenceEnEl.appendChild(link);
    }
    if (this.sentenceArEl) {
      this.sentenceArEl.textContent =
        'فشل تحميل الجمل. تحقق من اتصالك وحاول مرة أخرى.';
    }

    this.setStateIndicator('EMPTY');
  }

  /**
   * Update learning state indicator UI badge.
   * @param {string} state - Session state (IDLE, LISTENING, READY, TYPING, COMPLETED, RESULT)
   */
  setStateIndicator(state) {
    if (!this.stateIndicator || !this.stateText) return;

    this.stateIndicator.classList.remove(
      'state-idle',
      'state-listening',
      'state-ready',
      'state-typing',
      'state-completed',
      'state-result',
      'state-loading',
      'state-start',
      'state-listen-fallback'
    );

    switch (state) {
      case 'LESSON_START':
        this.stateIndicator.classList.add('state-start');
        this.stateText.textContent = 'READY';
        break;
      case 'LOADING_SENTENCE':
        this.stateIndicator.classList.add('state-loading');
        this.stateText.textContent = 'LOADING';
        break;
      case 'LISTENING':
        this.stateIndicator.classList.add('state-listening');
        this.stateText.textContent = 'LISTEN FIRST';
        break;
      case 'READY':
        this.stateIndicator.classList.add('state-ready');
        this.stateText.textContent = 'TYPE NOW';
        break;
      case 'TYPING':
        this.stateIndicator.classList.add('state-typing');
        this.stateText.textContent = 'TYPING';
        break;
      case 'COMPLETED':
      case 'RESULT':
        this.stateIndicator.classList.add('state-completed');
        this.stateText.textContent = 'COMPLETED';
        break;
      case 'EMPTY':
        this.stateIndicator.classList.add('state-idle');
        this.stateText.textContent = 'NO SENTENCES';
        break;
      default:
        this.stateIndicator.classList.add('state-idle');
        this.stateText.textContent = 'READY';
        break;
    }
  }

  /**
   * Show a visible fallback prompt when automatic pronunciation fails
   * (e.g. browser autoplay policy blocks speech). The learner can press
   * the Listen button to hear the sentence manually.
   */
  showListenFallback() {
    if (this.stateIndicator && this.stateText) {
      this.stateIndicator.classList.remove(
        'state-idle',
        'state-listening',
        'state-ready',
        'state-typing',
        'state-completed',
        'state-result',
        'state-loading',
        'state-start'
      );
      this.stateIndicator.classList.add('state-listen-fallback');
      this.stateText.textContent = 'PRESS LISTEN';
    }
    if (this.listenBtn) {
      this.listenBtn.classList.add('is-fallback');
    }
    if (this.focusReminder) {
      this.focusReminder.style.display = 'none';
    }
  }

  /**
   * Clear any listen-fallback highlight state.
   */
  clearListenFallback() {
    if (this.listenBtn) {
      this.listenBtn.classList.remove('is-fallback');
    }
  }

  /**
   * Set favorite star button visual status.
   * @param {boolean} isFav
   */
  setFavorite(isFav) {
    if (!this.favoriteBtn) return;
    if (isFav) {
      this.favoriteBtn.classList.add('is-favorite');
      this.favoriteBtn.setAttribute('title', 'Remove from favorites');
      this.favoriteBtn.setAttribute('aria-pressed', 'true');
    } else {
      this.favoriteBtn.classList.remove('is-favorite');
      this.favoriteBtn.setAttribute('title', 'Save sentence to favorites');
      this.favoriteBtn.setAttribute('aria-pressed', 'false');
    }
  }

  /**
   * Show or hide the review badge based on sentence metadata.
   * @param {object} sentence - sentence object (may have isReview/reviewWord)
   */
  setReviewBadge(sentence) {
    if (!this.reviewBadge) return;
    if (sentence && sentence.isReview) {
      this.reviewBadge.textContent = `Review · ${sentence.reviewWord}`;
      this.reviewBadge.hidden = false;
    } else {
      this.reviewBadge.hidden = true;
    }
  }

  /**
   * Dismiss the initial lesson start overlay.
   */
  closeStartOverlay() {
    if (this.startOverlay) {
      this.startOverlay.classList.remove('is-open');
      this.startOverlay.setAttribute('aria-hidden', 'true');
    }
    this.ensureTypingFocus();
  }

  /**
   * Check whether the start overlay is currently open.
   * @returns {boolean}
   */
  isStartOverlayOpen() {
    return Boolean(
      this.startOverlay && this.startOverlay.classList.contains('is-open')
    );
  }

  /**
   * Handle correct character typing.
   * Delegates to the composed TypingRenderer (tooltip dismissal stays here).
   * @param {{ index: number }} payload
   */
  onCharCorrect(payload) {
    this.hideTooltip();
    this.typingRenderer.onCharCorrect(payload);
  }

  /**
   * Handle mistaken keystroke at target position.
   * Delegates to the composed TypingRenderer (tooltip dismissal stays here).
   * @param {{ index: number }} payload
   */
  onCharWrong(payload) {
    this.hideTooltip();
    this.typingRenderer.onCharWrong(payload);
  }

  /**
   * Handle backspace event.
   * Delegates to the composed TypingRenderer (tooltip dismissal stays here).
   * @param {{ charIndex: number, clearedError: boolean }} payload
   */
  onBackspace(payload) {
    this.hideTooltip();
    this.typingRenderer.onBackspace(payload);
  }

  /**
   * Synchronize caret position and character highlight classes.
   * Delegates to the composed TypingRenderer.
   * @param {{ charIndex: number, hasPendingError: boolean, isCompleted?: boolean }} state
   */
  updateCaret(state) {
    this.typingRenderer.updateCaret(state);
  }

  /**
   * Display sentence completion dialog with stats.
   * @param {{ wpm: number, accuracy: number, mistakes: number }} stats
   */
  showSentenceModal(stats) {
    this.hideTooltip();
    if (this.modalWpm) this.modalWpm.textContent = stats.wpm;
    if (this.modalAccuracy)
      this.modalAccuracy.textContent = `${stats.accuracy}%`;
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
   * @param {{ avgWpm: number, avgAccuracy: number, totalMistakes: number, totalSentences?: number }} summary
   */
  showLessonModal(summary) {
    this.hideTooltip();
    this.closeModals();

    if (this.lessonWpm) this.lessonWpm.textContent = summary.avgWpm;
    if (this.lessonAccuracy)
      this.lessonAccuracy.textContent = `${summary.avgAccuracy}%`;
    if (this.lessonMistakes)
      this.lessonMistakes.textContent = summary.totalMistakes;

    const lessonSubtext = document.getElementById('lesson-subtext');
    if (lessonSubtext) {
      const count = summary.totalSentences || 0;
      lessonSubtext.textContent = `You have transcribed all ${count} foundational A1 sentences.`;
    }

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
    this.hideTooltip();
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
        this.listenBtn.classList.remove('is-fallback');
      } else {
        this.listenBtn.classList.remove('is-speaking');
      }
    }
  }

  /**
   * Return true if any dialog / modal / overlay is currently open.
   */
  isAnyModalOpen() {
    const isSentenceOpen =
      this.sentenceModal && this.sentenceModal.classList.contains('is-open');
    const isLessonOpen =
      this.lessonModal && this.lessonModal.classList.contains('is-open');
    const isStartOpen = this.isStartOverlayOpen();
    const isTrackOpen = Boolean(
      typeof document !== 'undefined' &&
        document.getElementById('track-modal')?.classList.contains('is-open')
    );
    const isProfileOpen = Boolean(
      typeof document !== 'undefined' &&
        document.getElementById('profile-modal')?.classList.contains('is-open')
    );
    const isAuthOpen = Boolean(
      typeof document !== 'undefined' &&
        document.getElementById('auth-modal')?.classList.contains('is-open')
    );
    return Boolean(
      isSentenceOpen ||
        isLessonOpen ||
        isStartOpen ||
        isTrackOpen ||
        isProfileOpen ||
        isAuthOpen
    );
  }

  /**
   * Focus hidden input anchor for reliable key capturing.
   */
  ensureTypingFocus() {
    if (
      this.typingAnchor &&
      document.activeElement !== this.typingAnchor &&
      !this.isAnyModalOpen()
    ) {
      this.typingAnchor.focus();
    }
  }
}
