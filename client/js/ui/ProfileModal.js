import { EventEmitter } from '../core/EventEmitter.js';
import { BADGES } from '../services/AchievementService.js';

/**
 * ProfileModal — displays overall learner stats, streak metrics, and badge showcase.
 * Emits:
 * - 'profile:dismiss'
 * - 'profile:open'
 */
export class ProfileModal extends EventEmitter {
  constructor() {
    super();

    const hasDoc = typeof document !== 'undefined';
    this.backdrop = hasDoc ? document.getElementById('profile-modal') : null;
    this.closeBtn = hasDoc
      ? document.getElementById('profile-modal-close-btn')
      : null;
    this.dismissBtn = hasDoc
      ? document.getElementById('profile-modal-dismiss-btn')
      : null;

    this.currentStreakEl = hasDoc
      ? document.getElementById('modal-current-streak')
      : null;
    this.longestStreakEl = hasDoc
      ? document.getElementById('modal-longest-streak')
      : null;
    this.sentencesEl = hasDoc
      ? document.getElementById('modal-stat-sentences')
      : null;
    this.bestWpmEl = hasDoc
      ? document.getElementById('modal-stat-best-wpm')
      : null;
    this.avgWpmEl = hasDoc
      ? document.getElementById('modal-stat-avg-wpm')
      : null;
    this.accuracyEl = hasDoc
      ? document.getElementById('modal-stat-accuracy')
      : null;
    this.sessionsEl = hasDoc
      ? document.getElementById('modal-stat-sessions')
      : null;
    this.favoritesEl = hasDoc
      ? document.getElementById('modal-stat-favorites')
      : null;
    this.masteredEl = hasDoc
      ? document.getElementById('modal-stat-mastered')
      : null;

    this.badgesGrid = hasDoc
      ? document.getElementById('modal-badges-grid')
      : null;
    this.unlockedCountEl = hasDoc
      ? document.getElementById('modal-badges-unlocked-count')
      : null;
    this.totalBadgesEl = hasDoc
      ? document.getElementById('modal-badges-total-count')
      : null;

    this._bindEvents();
  }

  _bindEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.dismissBtn) {
      this.dismissBtn.addEventListener('click', () => this.close());
    }

    if (this.backdrop) {
      this.backdrop.addEventListener('click', (e) => {
        if (e.target === this.backdrop) {
          this.close();
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });
    }
  }

  open() {
    if (this.backdrop) {
      this.backdrop.classList.add('is-open');
      this.backdrop.setAttribute('aria-hidden', 'false');
    }
    this.emit('profile:open');
  }

  close() {
    if (this.backdrop) {
      this.backdrop.classList.remove('is-open');
      this.backdrop.setAttribute('aria-hidden', 'true');
    }
    this.emit('profile:dismiss');
  }

  isOpen() {
    return this.backdrop?.classList.contains('is-open') ?? false;
  }

  /**
   * Render stats and badges in the modal.
   * @param {object} stats - Stats object from progressService.getStats()
   * @param {string[]} unlockedBadgeIds - Array of unlocked badge IDs
   */
  render(stats = {}, unlockedBadgeIds = []) {
    if (this.currentStreakEl)
      this.currentStreakEl.textContent = stats.currentStreak ?? 0;
    if (this.longestStreakEl)
      this.longestStreakEl.textContent = stats.longestStreak ?? 0;
    if (this.sentencesEl)
      this.sentencesEl.textContent = stats.completedSentenceCount ?? 0;
    if (this.bestWpmEl) this.bestWpmEl.textContent = stats.bestWpm ?? 0;
    if (this.avgWpmEl) this.avgWpmEl.textContent = stats.averageWpm ?? 0;
    if (this.accuracyEl)
      this.accuracyEl.textContent = `${stats.averageAccuracy ?? 100}%`;
    if (this.sessionsEl) this.sessionsEl.textContent = stats.totalSessions ?? 0;
    if (this.favoritesEl)
      this.favoritesEl.textContent = stats.favoritesCount ?? 0;
    if (this.masteredEl)
      this.masteredEl.textContent = stats.masteredWordsCount ?? 0;

    const unlockedSet = new Set(unlockedBadgeIds || []);
    if (this.unlockedCountEl)
      this.unlockedCountEl.textContent = unlockedSet.size;
    if (this.totalBadgesEl) this.totalBadgesEl.textContent = BADGES.length;

    const progressBar =
      typeof document !== 'undefined'
        ? document.getElementById('modal-badges-progress-bar')
        : null;
    if (progressBar) {
      const pct =
        BADGES.length > 0
          ? Math.round((unlockedSet.size / BADGES.length) * 100)
          : 0;
      progressBar.style.width = `${pct}%`;
    }

    if (!this.badgesGrid) return;

    this.badgesGrid.innerHTML = '';

    BADGES.forEach((badge) => {
      const isUnlocked = unlockedSet.has(badge.id);

      const card = document.createElement('div');
      card.className = `badge-card ${isUnlocked ? 'is-unlocked' : 'is-locked'}`;
      card.setAttribute('role', 'listitem');
      card.setAttribute('title', `${badge.name}: ${badge.description}`);

      card.innerHTML = `
        <div class="badge-card-top">
          <div class="badge-card-icon" aria-hidden="true">${isUnlocked ? badge.icon : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'}</div>
          <span class="badge-card-status">${isUnlocked ? 'Unlocked' : 'Locked'}</span>
        </div>
        <div class="badge-card-info">
          <div class="badge-card-name"></div>
          <div class="badge-card-desc"></div>
        </div>
      `;

      card.querySelector('.badge-card-name').textContent = badge.name;
      card.querySelector('.badge-card-desc').textContent = badge.description;

      this.badgesGrid.appendChild(card);
    });
  }
}
