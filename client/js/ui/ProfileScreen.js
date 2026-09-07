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
            <p class="profile-status">${isAuthenticated ? 'Signed in' : 'Local mode — sign in to sync'}</p>
          </div>
        </div>

        <div class="profile-stats-grid">
          <div class="profile-stat">
            <span class="profile-stat-value">${stats.completedSentenceCount}</span>
            <span class="profile-stat-label">Sentences Done</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat-value">${stats.averageAccuracy}%</span>
            <span class="profile-stat-label">Avg Accuracy</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat-value">${stats.averageWpm}</span>
            <span class="profile-stat-label">Avg WPM</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat-value">${streak}</span>
            <span class="profile-stat-label">Day Streak</span>
          </div>
        </div>

        <div class="profile-joined">
          ${stats.lastSessionDate
            ? `<span>Last active: ${new Date(stats.lastSessionDate).toLocaleDateString()}</span>`
            : '<span>No activity yet</span>'}
        </div>
      </div>
    `;
  }
}
