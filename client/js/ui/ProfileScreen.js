export class ProfileScreen {
  constructor() {
    this.el = document.getElementById('page-profile');
  }

  render({ authService, progressService, streakService }) {
    if (!this.el) return;

    const isAuthenticated = authService?.isAuthenticated || false;
    const email = authService?.email || '';
    const stats = progressService.getStats();
    const streak = streakService ? streakService.getStreak() : 0;
    const favoritesCount = stats.favoritesCount ?? 0;
    const difficultWordsCount = stats.difficultWordsCount ?? 0;
    const wordReview = progressService.data.wordReview || {};
    const mastered = Object.values(wordReview).filter(e => e.mastered).length;

    this.el.innerHTML = `
      <div class="profile-page">
        <div class="page-header">
          <h1 class="page-title">Profile</h1>
          <p class="page-subtitle">Your learner profile</p>
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

        <div class="profile-activity">
          ${stats.lastSessionDate
            ? `<span>Last active: ${new Date(stats.lastSessionDate).toLocaleDateString()}</span>`
            : '<span>No activity yet</span>'}
        </div>

        <div class="profile-actions">
          ${isAuthenticated
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
