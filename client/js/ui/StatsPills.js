/**
 * StatsPills — manages the floating live stats dock at the bottom of the screen.
 * Displays real-time WPM, Accuracy %, and Mistakes count.
 */
export class StatsPills {
  constructor(options = {}) {
    this.wpmEl = options.wpmEl || document.getElementById('wpm-value');
    this.accuracyEl = options.accuracyEl || document.getElementById('accuracy-value');
    this.mistakesEl = options.mistakesEl || document.getElementById('mistakes-value');
  }

  /**
   * Update stats display from a metrics snapshot.
   * @param {{ wpm: number, accuracy: number, mistakes: number, elapsedSeconds: number }} stats
   */
  update(stats) {
    if (!stats) return;

    if (this.accuracyEl) {
      this.accuracyEl.textContent = `${stats.accuracy}%`;
    }

    if (this.mistakesEl) {
      this.mistakesEl.textContent = stats.mistakes;
    }

    if (this.wpmEl) {
      if (stats.elapsedSeconds < 1 || stats.wpm === 0) {
        this.wpmEl.textContent = '--';
      } else {
        this.wpmEl.textContent = stats.wpm;
      }
    }
  }

  /**
   * Reset stats display to starting state.
   */
  reset() {
    if (this.wpmEl) this.wpmEl.textContent = '--';
    if (this.accuracyEl) this.accuracyEl.textContent = '100%';
    if (this.mistakesEl) this.mistakesEl.textContent = '0';
  }
}
