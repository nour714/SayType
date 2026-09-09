import { BADGES } from '../services/AchievementService.js';

export class ProfileScreen {
  constructor() {
    this.el = document.getElementById('page-profile');
  }

  render({ authService, progressService, streakService }) {
    if (!this.el) return;

    const isAuthenticated = authService?.isAuthenticated || false;
    const email = authService?.email || '';
    const stats = progressService.getStats();
    const streak =
      stats.currentStreak ?? (streakService ? streakService.getStreak() : 0);
    const longestStreak = stats.longestStreak ?? 0;
    const favoritesCount = stats.favoritesCount ?? 0;
    const mastered =
      stats.masteredWordsCount ??
      Object.values(progressService.data.wordReview || {}).filter(
        (e) => e.mastered
      ).length;
    const unlockedSet = new Set(progressService.data.unlockedBadges || []);

    this.el.innerHTML = `
      <div class="profile-page">
        <div class="page-header">
          <h1 class="page-title">Profile</h1>
          <p class="page-subtitle">Your learner profile & achievements</p>
        </div>

        <div class="profile-card">
          <div class="profile-avatar">
            <span class="profile-avatar-letter">${isAuthenticated ? email.charAt(0).toUpperCase() : '?'}</span>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">${isAuthenticated ? email : 'Guest'}</h2>
            <p class="profile-status">${isAuthenticated ? 'Signed in · Progress synced' : 'Local mode · Sign in to sync'}</p>
          </div>
        </div>

        <div class="profile-stats-grid">
          <div class="profile-stat">
            <span class="profile-stat-value">${stats.completedSentenceCount}</span>
            <span class="profile-stat-label">Sentences</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat-value">${stats.averageAccuracy}%</span>
            <span class="profile-stat-label">Accuracy</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat-value">${stats.averageWpm}</span>
            <span class="profile-stat-label">Avg WPM</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat-value">${stats.bestWpm}</span>
            <span class="profile-stat-label">Best WPM</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat-value">${streak}</span>
            <span class="profile-stat-label">Day Streak</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat-value">${longestStreak}</span>
            <span class="profile-stat-label">Best Streak</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat-value">${stats.totalSessions}</span>
            <span class="profile-stat-label">Sessions</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat-value">${favoritesCount}</span>
            <span class="profile-stat-label">Favorites</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat-value">${mastered}</span>
            <span class="profile-stat-label">Words Mastered</span>
          </div>
        </div>

        <div class="profile-badges-section">
          <div class="badges-header">
            <h2 class="badges-title">Badges & Milestones</h2>
            <span class="badges-counter">${unlockedSet.size} / ${BADGES.length} Unlocked</span>
          </div>
          <div class="badges-grid" role="list">
            ${BADGES.map((badge) => {
              const isUnlocked = unlockedSet.has(badge.id);
              return `
                <div class="badge-card ${isUnlocked ? 'is-unlocked' : 'is-locked'}" role="listitem">
                  <div class="badge-card-top">
                    <span class="badge-card-icon">${isUnlocked ? badge.icon : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'}</span>
                    <span class="badge-card-status">${isUnlocked ? 'Unlocked' : 'Locked'}</span>
                  </div>
                  <div class="badge-card-info">
                    <div class="badge-card-name">${badge.name}</div>
                    <div class="badge-card-desc">${badge.description}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="profile-activity">
          ${
            stats.lastSessionDate
              ? `<span>Last active: ${new Date(stats.lastSessionDate).toLocaleDateString()}</span>`
              : '<span>No activity yet</span>'
          }
        </div>

        <div class="profile-actions">
          ${
            isAuthenticated
              ? `<button id="profile-signout-btn" class="action-btn secondary-btn">Sign Out</button>`
              : `<a href="#" id="profile-signin-btn" class="action-btn primary-btn">Sign In to Sync</a>`
          }
        </div>
      </div>
    `;

    const signOutBtn = document.getElementById('profile-signout-btn');
    if (signOutBtn && authService) {
      signOutBtn.addEventListener('click', async () => {
        await authService.signOut();
        this.render({ authService, progressService, streakService });
      });
    }

    const signInBtn = document.getElementById('profile-signin-btn');
    if (signInBtn) {
      signInBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const authBtn = document.getElementById('auth-btn');
        if (authBtn) authBtn.click();
      });
    }
  }
}
