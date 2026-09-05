/**
 * ProgressIndicator — manages the top header breadcrumbs:
 * Current level badge (e.g. "A1 FOUNDATIONS") and progress counter ("1 / 10").
 */
export class ProgressIndicator {
  constructor(options = {}) {
    this.levelBadgeEl = options.levelBadgeEl || document.getElementById('level-badge');
    this.currentEl = options.currentEl || document.getElementById('progress-current');
    this.totalEl = options.totalEl || document.getElementById('progress-total');
  }

  /**
   * Update progress numbers and level indicator.
   * @param {{ current: number, total: number, level?: string }} info
   */
  update({ current, total, level = 'A1' }) {
    if (this.currentEl) {
      this.currentEl.textContent = current;
    }
    if (this.totalEl) {
      this.totalEl.textContent = total;
    }
    if (this.levelBadgeEl) {
      this.levelBadgeEl.textContent = `${level} FOUNDATIONS`;
    }
  }
}
