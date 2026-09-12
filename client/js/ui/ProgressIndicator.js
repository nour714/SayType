/**
 * ProgressIndicator — manages the top header progress counter ("1 / 10").
 */
export class ProgressIndicator {
  constructor(options = {}) {
    this.currentEl =
      options.currentEl || document.getElementById('progress-current');
    this.totalEl = options.totalEl || document.getElementById('progress-total');
    this.barEl =
      options.barEl || document.getElementById('session-progress-bar-fill');
  }

  update({ current, total }) {
    if (this.currentEl) {
      this.currentEl.textContent = current;
    }
    if (this.totalEl) {
      this.totalEl.textContent = total;
    }
    if (this.barEl && total > 0) {
      const pct = Math.min(100, Math.round((current / total) * 100));
      this.barEl.style.width = `${pct}%`;
    }
  }
}
