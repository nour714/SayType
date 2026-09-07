import { EventEmitter } from '../core/EventEmitter.js';

/**
 * SpeechService — encapsulates Web Speech API for deliberate A1 English pronunciation.
 * Features:
 * - Promise-based speak() with automatic timeout watchdog (never blocks the learner)
 * - Safe overlapping speech cancellation
 * - Real-time isSpeaking property
 * - Graceful fallback when Web Speech is unsupported or blocked by autoplay policy
 * 
 * Emits events:
 * - 'start': { text }
 * - 'end': {}
 * - 'error': { error }
 * - 'unsupported': {}
 */
export class SpeechService extends EventEmitter {
  constructor() {
    super();
    this.activeUtterance = null;
    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.voices = [];
    this._isSpeaking = false;
    this._watchdogTimer = null;
    this._generation = 0;
    this._rate = 0.88;

    if (this.isSupported) {
      this._loadVoices();
      try {
        window.speechSynthesis.onvoiceschanged = () => {
          this._loadVoices();
        };
      } catch (e) {
        // Safe ignored on restrictive environments
      }
    }
  }

  get isSpeaking() {
    return this._isSpeaking;
  }

  /**
   * Whether the Web Speech API is available and usable in this browser.
   * @returns {boolean}
   */
  get isUsable() {
    return this.isSupported;
  }

  /**
   * Set the speech rate multiplier.
   * @param {number} rate - 0.5 to 1.5
   */
  setRate(rate) {
    if (typeof rate === 'number' && rate >= 0.5 && rate <= 1.5) {
      this._rate = rate;
    }
  }

  /**
   * Get the current speech rate.
   * @returns {number}
   */
  getRate() {
    return this._rate;
  }

  _loadVoices() {
    if (this.isSupported) {
      try {
        this.voices = window.speechSynthesis.getVoices() || [];
      } catch (e) {
        this.voices = [];
      }
    }
  }

  _getBestEnglishVoice() {
    if (!this.voices || this.voices.length === 0) {
      this._loadVoices();
    }
    return (
      this.voices.find(
        (v) =>
          v.lang &&
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Jenny'))
      ) ||
      this.voices.find((v) => v.lang && v.lang.startsWith('en')) ||
      null
    );
  }

  /**
   * Speak English text with a deliberate, learning-appropriate cadence.
   * Returns a Promise resolving when speech finishes or times out.
   * @param {string} text
   * @param {number} [rate=0.88]
   * @returns {Promise<void>}
   */
  speak(text, rate) {
    return new Promise((resolve) => {
      if (!this.isSupported || !text) {
        this._isSpeaking = false;
        this.emit('unsupported');
        this.emit('end');
        resolve();
        return;
      }

      this._cancelSpeech();

      const generation = ++this._generation;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate || this._rate;
      utterance.pitch = 1.0;

      const voice = this._getBestEnglishVoice();
      if (voice) {
        utterance.voice = voice;
      }

      let settled = false;
      const cleanup = () => {
        if (settled) return;
        // Stale utterances (canceled in favor of a newer one) settle their
        // promise without emitting 'end', otherwise listen-first gating
        // would unlock typing before the current narration finishes.
        if (generation !== this._generation) {
          resolve();
          return;
        }
        settled = true;
        this._clearWatchdog();
        this._isSpeaking = false;
        this.activeUtterance = null;
        this.emit('end');
        resolve();
      };

      utterance.onstart = () => {
        if (generation !== this._generation) return;
        this._isSpeaking = true;
        this.emit('start', { text });
      };

      utterance.onend = () => {
        cleanup();
      };

      utterance.onerror = (err) => {
        // If canceled intentionally, don't treat as critical error
        if (err && err.error !== 'canceled') {
          this.emit('error', { error: err });
        }
        cleanup();
      };

      // Watchdog timer: automatically resolve after (words * 1200ms + 2500ms)
      // to ensure UI never freezes if browser speech engine hangs.
      const estimatedDuration = Math.max(3000, (text.split(' ').length * 1200) + 2500);
      this._watchdogTimer = setTimeout(() => {
        this._watchdogTimer = null;
        if (generation === this._generation && !settled) {
          console.warn('Speech watchdog triggered timeout, auto-completing.');
          try {
            window.speechSynthesis.cancel();
          } catch (e) {
            // Safe ignore
          }
          cleanup();
        }
      }, estimatedDuration);

      this.activeUtterance = utterance;
      this._isSpeaking = true;

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('speechSynthesis.speak failed:', err);
        this._isSpeaking = false;
        if (generation === this._generation) {
          this._generation++;
          this.activeUtterance = null;
          this.emit('end');
        }
        resolve();
      }
    });
  }

  /**
   * Stop any current speech playback (alias for stop()).
   */
  cancel() {
    this.stop();
  }

  /**
   * Stop any current speech playback silently. Does NOT emit 'end',
   * because the caller is about to start a new narration (or is choosing
   * not to unlock the typing gate).
   */
  stop() {
    this._cancelSpeech();
  }

  /**
   * Clear the watchdog timer.
   * @private
   */
  _clearWatchdog() {
    if (this._watchdogTimer) {
      clearTimeout(this._watchdogTimer);
      this._watchdogTimer = null;
    }
  }

  /**
   * Invalidate any in-flight utterance and cancel browser speech.
   * @private
   */
  _cancelSpeech() {
    this._generation++;
    this._clearWatchdog();
    this._isSpeaking = false;
    this.activeUtterance = null;

    if (this.isSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Safe ignore
      }
    }
  }
}
