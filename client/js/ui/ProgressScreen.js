export class ProgressScreen {
  constructor() {
    this.el = document.getElementById('page-progress');
  }

  render({ progressService, streakService, sentenceRepo }) {
    if (!this.el) return;

    const stats = progressService.getStats();
    const streak = streakService ? streakService.getStreak() : 0;
    const completed = stats.completedSentenceCount || 0;
    const totalSessions = stats.totalSessions || 0;

    this.el.innerHTML = `
      <div class="progress-page">
        <div class="page-header">
          <h1 class="page-title">Your Progress</h1>
          <p class="page-subtitle">Track your English learning journey</p>
        </div>

        <div class="progress-grid">
          <div class="progress-card progress-overview-card">
            <h2 class="progress-card-title">Overall Progress</h2>
            <div class="progress-overview-stats">
              <div class="progress-overview-item">
                <span class="progress-overview-value">${completed}</span>
                <span class="progress-overview-label">Completed Sentences</span>
              </div>
              <div class="progress-overview-item">
                <span class="progress-overview-value">${stats.averageAccuracy}%</span>
                <span class="progress-overview-label">Average Accuracy</span>
              </div>
              <div class="progress-overview-item">
                <span class="progress-overview-value">${stats.averageWpm}</span>
                <span class="progress-overview-label">Average WPM</span>
              </div>
              <div class="progress-overview-item">
                <span class="progress-overview-value">${stats.bestWpm}</span>
                <span class="progress-overview-label">Best WPM</span>
              </div>
            </div>
          </div>

          <div class="progress-card">
            <h2 class="progress-card-title">Activity</h2>
            <div class="progress-activity">
              <div class="progress-activity-item">
                <span class="progress-activity-value">${streak}</span>
                <span class="progress-activity-label">Day Streak</span>
              </div>
              <div class="progress-activity-item">
                <span class="progress-activity-value">${stats.totalMistakes}</span>
                <span class="progress-activity-label">Total Mistakes</span>
              </div>
              <div class="progress-activity-item">
                <span class="progress-activity-value">${stats.favoritesCount}</span>
                <span class="progress-activity-label">Favorites</span>
              </div>
              <div class="progress-activity-item">
                <span class="progress-activity-value">${stats.difficultWordsCount}</span>
                <span class="progress-activity-label">Difficult Words</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
