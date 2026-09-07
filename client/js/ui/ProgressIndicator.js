/**
 * ProgressIndicator — manages the top header progress counter ("1 / 10").
 */
export class ProgressIndicator {
  constructor(options = {}) {
    this.currentEl = options.currentEl || document.getElementById('progress-current');
    this.totalEl = options.totalEl || document.getElementById('progress-total');
  }

  update({ current, total }) {
    if (this.currentEl) {
      this.currentEl.textContent = current;
    }
    if (this.totalEl) {
      this.totalEl.textContent = total;
    }
  }
}
