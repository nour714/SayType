import { EventEmitter } from '../core/EventEmitter.js';

/**
 * SoundService — synthesized Web Audio feedback for typing.
 *
 * Provides instant, zero-latency acoustic feedback:
 * - playCorrectKey(char): calm, subtle acoustic/mechanical click with organic jitter.
 * - playMistakeKey(): distinct, soft, muted low warning thud.
 * - playBackspace(clearedError): gentle muted tap.
 *
 * Gracefully handles autoplay restrictions and non-browser/Node test environments.
 */
export class SoundService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled =
      options.enabled !== undefined ? Boolean(options.enabled) : true;
    this.ctx = null;
    this._isSupported =
      typeof window !== 'undefined' &&
      Boolean(window.AudioContext || window.webkitAudioContext);
  }

  get isSupported() {
    return this._isSupported;
  }

  get isEnabled() {
    return this.enabled;
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
  }

  /**
   * Lazy-initialize AudioContext to comply with browser autoplay policies.
   * @returns {AudioContext|null}
   */
  _getContext() {
    if (!this._isSupported) return null;
    if (!this.ctx) {
      try {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch (_) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Play a calm, gentle acoustic/thock sound for correct character entry.
   * @param {string} [_char]
   */
  playCorrectKey(_char = '') {
    if (!this.enabled) return;
    const ctx = this._getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Slight pitch variation (jitter) so repetitive typing sounds organic
      const jitter = (Math.random() - 0.5) * 40;
      const startFreq = 620 + jitter;
      const endFreq = 280 + jitter * 0.5;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Warm, soft, non-piercing
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.035);

      // Fast attack (2ms), quick gentle decay (40ms), very gentle peak volume (0.09)
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };
    } catch (_) {}
  }

  /**
   * Play a distinct, soft, muted low error sound when a mistake is made.
   */
  playMistakeKey() {
    if (!this.enabled) return;
    const ctx = this._getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Lower frequency with pitch drop to produce a muted "bonk/thud"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

      // Distinct but not loud or jarring (gain 0.14)
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };
    } catch (_) {}
  }

  /**
   * Play a subtle tap when backspacing.
   * @param {boolean} [clearedError]
   */
  playBackspace(clearedError = false) {
    if (!this.enabled) return;
    const ctx = this._getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const startFreq = clearedError ? 360 : 310;
      const endFreq = 200;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.03);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };
    } catch (_) {}
  }
}
