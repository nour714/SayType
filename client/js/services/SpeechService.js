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
  speak(text, rate = 0.88) {
    return new Promise((resolve) => {
      if (!this.isSupported || !text) {
        this._isSpeaking = false;
        this.emit('unsupported');
        this.emit('end');
        resolve();
        return;
      }

      // Cancel any ongoing utterance before beginning a new one
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate; // Deliberate cadence for A1 learning
      utterance.pitch = 1.0;

      const voice = this._getBestEnglishVoice();
      if (voice) {
        utterance.voice = voice;
      }

      let settled = false;
      const cleanup = () => {
        if (settled) return;
        settled = true;
        if (this._watchdogTimer) {
          clearTimeout(this._watchdogTimer);
          this._watchdogTimer = null;
        }
        this._isSpeaking = false;
        this.activeUtterance = null;
        this.emit('end');
        resolve();
      };

      utterance.onstart = () => {
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
      // to ensure UI never freezes if browser speech engine hangs
      const estimatedDuration = Math.max(3000, (text.split(' ').length * 1200) + 2500);
      this._watchdogTimer = setTimeout(() => {
        if (!settled) {
          console.warn('Speech watchdog triggered timeout, auto-completing.');
          this.stop();
          cleanup();
        }
      }, estimatedDuration);

      this.activeUtterance = utterance;
      this._isSpeaking = true;

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('speechSynthesis.speak failed:', err);
        cleanup();
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
   * Stop any current speech playback.
   */
  stop() {
    if (this._watchdogTimer) {
      clearTimeout(this._watchdogTimer);
      this._watchdogTimer = null;
    }
    this._isSpeaking = false;
    this.activeUtterance = null;

    if (this.isSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Safe ignore
      }
    }
    this.emit('end');
  }
}
