import { EventEmitter } from '../core/EventEmitter.js';

/**
 * SpeechService — encapsulates Web Speech API for deliberate A1 English pronunciation.
 * Emits events:
 * - 'start': { text }
 * - 'end': {}
 * - 'error': { error }
 */
export class SpeechService extends EventEmitter {
  constructor() {
    super();
    this.activeUtterance = null;
    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.voices = [];

    if (this.isSupported) {
      this._loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this._loadVoices();
      };
    }
  }

  _loadVoices() {
    if (this.isSupported) {
      this.voices = window.speechSynthesis.getVoices() || [];
    }
  }

  _getBestEnglishVoice() {
    if (!this.voices || this.voices.length === 0) {
      this._loadVoices();
    }
    return (
      this.voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel'))
      ) ||
      this.voices.find((v) => v.lang.startsWith('en')) ||
      null
    );
  }

  /**
   * Speak the provided English text with a deliberate, learning-appropriate cadence.
   * @param {string} text
   */
  speak(text) {
    if (!this.isSupported || !text) {
      console.warn('Speech synthesis is not available or text is empty.');
      return;
    }

    // Cancel any previous utterance
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.88; // Deliberate cadence for A1 learning
    utterance.pitch = 1.0;

    const voice = this._getBestEnglishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      this.emit('start', { text });
    };

    utterance.onend = () => {
      this.activeUtterance = null;
      this.emit('end');
    };

    utterance.onerror = (err) => {
      this.activeUtterance = null;
      this.emit('error', { error: err });
      this.emit('end');
    };

    this.activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop any current speech playback.
   */
  stop() {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
      this.activeUtterance = null;
      this.emit('end');
    }
  }
}
