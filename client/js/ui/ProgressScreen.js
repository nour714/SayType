export class ProgressScreen {
  constructor() {
    this.el = document.getElementById('page-progress');
  }

  async render({ progressService, streakService, sentenceRepo }) {
    if (!this.el) return;

    const stats = progressService.getStats();
    const streak = streakService ? streakService.getStreak() : 0;
    const completed = stats.completedSentenceCount || 0;
    const completedIds = new Set(stats.completedSentenceIds || []);
    const dueReviewCount = progressService.getDueReviewWords(50).length;
    const difficultWords = progressService.getDifficultWords().slice(0, 8);
    const favoritesCount = progressService.getFavorites().length;
    const wordReview = progressService.data.wordReview || {};
    const allReviewWords = Object.entries(wordReview);
    const learning = allReviewWords.filter(([, e]) => !e.mastered);
    const mastered = allReviewWords.filter(([, e]) => e.mastered);

    // Last-14-days activity strip, derived from already-tracked activity days.
    const activeDays = new Set(streakService?.data?.activityDays || []);
    const today = new Date();
    const strip = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      strip.push({
        key,
        label: 'SMTWTFS'[d.getDay()],
        active: activeDays.has(key),
        today: i === 0
      });
    }
    const activeCount = strip.filter((d) => d.active).length;

    let levelCards = '';
    let topicCards = '';
    try {
      const allSentences = await sentenceRepo.getSentences();
      const levels = ['A1', 'A2'];
      levelCards = levels
        .map((lv) => {
          const lvSentences = allSentences.filter((s) => s.level === lv);
          const lvCompleted = lvSentences.filter((s) =>
            completedIds.has(String(s.id))
          ).length;
          const pct =
            lvSentences.length > 0
              ? Math.round((lvCompleted / lvSentences.length) * 100)
              : 0;
          return `
          <div class="progress-level-item">
            <div class="progress-level-header">
              <span class="progress-level-code">${lv}</span>
              <span class="progress-level-pct">${pct}%</span>
            </div>
            <div class="progress-level-bar">
              <div class="progress-level-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="progress-level-count">${lvCompleted} / ${lvSentences.length}</span>
          </div>
        `;
        })
        .join('');

      const topics = await sentenceRepo.getTopics('A1');
      const topics2 = await sentenceRepo.getTopics('A2');
      const allTopics = [
        ...topics.map((t) => ({ ...t, level: 'A1' })),
        ...topics2.map((t) => ({ ...t, level: 'A2' }))
      ];
      topicCards = allTopics
        .map((t) => {
          const tSentences = allSentences.filter(
            (s) => s.topic === t.id && s.level === t.level
          );
          const tCompleted = tSentences.filter((s) =>
            completedIds.has(String(s.id))
          ).length;
          const pct =
            tSentences.length > 0
              ? Math.round((tCompleted / tSentences.length) * 100)
              : 0;
          return `
          <div class="progress-topic-item">
            <div class="progress-topic-info">
              <span class="progress-topic-name">${t.label}</span>
              <span class="progress-topic-level">${t.level}</span>
            </div>
            <div class="progress-topic-bar">
              <div class="progress-topic-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="progress-topic-count">${tCompleted}/${tSentences.length}</span>
          </div>
        `;
        })
        .join('');
    } catch (_) {}

    this.el.innerHTML = `
      <div class="progress-page">
        <div class="page-header">
          <h1 class="page-title">Your Progress</h1>
          <p class="page-subtitle">Track your English learning journey</p>
        </div>

        <div class="progress-grid">
          <div class="progress-card progress-overview-card">
            <h2 class="progress-card-title">Overall</h2>
            <div class="progress-overview-stats">
              <div class="progress-overview-item">
                <span class="progress-overview-value">${completed}</span>
                <span class="progress-overview-label">Sentences</span>
              </div>
              <div class="progress-overview-item">
                <span class="progress-overview-value">${stats.averageAccuracy}%</span>
                <span class="progress-overview-label">Accuracy</span>
              </div>
              <div class="progress-overview-item">
                <span class="progress-overview-value">${stats.averageWpm}</span>
                <span class="progress-overview-label">Avg WPM</span>
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
                <span class="progress-activity-value">${stats.longestStreak ?? 0}</span>
                <span class="progress-activity-label">Best Streak</span>
              </div>
              <div class="progress-activity-item">
                <span class="progress-activity-value">${stats.totalMistakes}</span>
                <span class="progress-activity-label">Mistakes</span>
              </div>
              <div class="progress-activity-item">
                <span class="progress-activity-value">${favoritesCount}</span>
                <span class="progress-activity-label">Favorites</span>
              </div>
              <div class="progress-activity-item">
                <span class="progress-activity-value">${stats.totalSessions}</span>
                <span class="progress-activity-label">Sessions</span>
              </div>
            </div>
            <div class="activity-strip" role="img" aria-label="Practice activity over the last 14 days">
              ${strip
                .map(
                  (d) => `
                <div class="activity-day${d.active ? ' is-active' : ''}${d.today ? ' is-today' : ''}" title="${d.key}">
                  <span class="activity-day-bar"></span>
                  <span class="activity-day-label">${d.label}</span>
                </div>
              `
                )
                .join('')}
            </div>
            <p class="activity-legend">${activeCount} active ${activeCount === 1 ? 'day' : 'days'} in the last 2 weeks</p>
          </div>

          ${
            levelCards
              ? `
            <div class="progress-card">
              <h2 class="progress-card-title">Level Progress</h2>
              <div class="progress-level-list">${levelCards}</div>
            </div>
          `
              : ''
          }

          <div class="progress-card">
            <h2 class="progress-card-title">Review Status</h2>
            <div class="progress-activity">
              <div class="progress-activity-item">
                <span class="progress-activity-value">${dueReviewCount}</span>
                <span class="progress-activity-label">Due Now</span>
              </div>
              <div class="progress-activity-item">
                <span class="progress-activity-value">${learning.length}</span>
                <span class="progress-activity-label">Learning</span>
              </div>
              <div class="progress-activity-item">
                <span class="progress-activity-value">${mastered.length}</span>
                <span class="progress-activity-label">Mastered</span>
              </div>
            </div>
          </div>

          ${
            topicCards
              ? `
            <div class="progress-card progress-topics-card">
              <h2 class="progress-card-title">Topic Progress</h2>
              <div class="progress-topic-list">${topicCards}</div>
            </div>
          `
              : ''
          }

          ${
            difficultWords.length > 0
              ? `
            <div class="progress-card">
              <h2 class="progress-card-title">Difficult Words</h2>
              <div class="progress-word-list">
                ${difficultWords
                  .map(
                    ({ word, count }) => `
                  <div class="progress-word-item">
                    <span class="progress-word-text">${word}</span>
                    <span class="progress-word-count">${count} ${count === 1 ? 'mistake' : 'mistakes'}</span>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
              : `
            <div class="progress-card">
              <h2 class="progress-card-title">Difficult Words</h2>
              <div class="progress-empty">No difficult words recorded yet. Keep practicing!</div>
            </div>
          `
          }
        </div>
      </div>
    `;
  }
}
