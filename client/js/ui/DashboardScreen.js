import { EventEmitter } from '../core/EventEmitter.js';

export class DashboardScreen extends EventEmitter {
  constructor() {
    super();
    this.el = document.getElementById('page-home');
  }

  render({ stats, streak, dueReviewCount, topics, lastLevel, lastTopic, continueLesson }) {
    if (!this.el) return;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const completed = stats?.completedSentenceCount || 0;
    const total = stats?.totalSessions || 0;
    const avgAcc = stats?.averageAccuracy || 100;
    const avgWpm = stats?.averageWpm || 0;

    const levelLabel = lastLevel || 'A1';
    const topicLabel = lastTopic ? this._topicName(lastTopic) : 'Daily Life';

    const hasHistory = completed > 0;
    const ctaText = hasHistory ? 'Continue Lesson' : 'Start Your First Lesson';
    const ctaRoute = hasHistory && continueLesson ? `#practice?level=${levelLabel}&topic=${lastTopic || ''}` : '#practice?level=A1&topic=';

    this.el.innerHTML = `
      <div class="home-container">
        <section class="home-hero">
          <p class="home-greeting">${greeting}</p>
          <h1 class="home-title">Continue your English practice</h1>
          <div class="home-meta">
            <span class="home-level-badge">${levelLabel}</span>
            <span class="home-meta-sep">&middot;</span>
            <span class="home-topic">${topicLabel}</span>
          </div>
          <a href="${ctaRoute}" class="action-btn primary-btn home-cta">${ctaText}</a>
        </section>

        <div class="home-grid">
          <section class="home-card home-progress-card">
            <h2 class="home-card-title">Progress</h2>
            <div class="home-stat-row">
              <span class="home-stat-value">${completed}</span>
              <span class="home-stat-label">sentences</span>
            </div>
            <div class="home-stat-sub">
              ${completed} / ${total > 0 ? total : '—'} sessions
            </div>
          </section>

          <section class="home-card home-review-card">
            <h2 class="home-card-title">Review</h2>
            <div class="home-stat-row">
              <span class="home-stat-value">${dueReviewCount}</span>
              <span class="home-stat-label">${dueReviewCount === 1 ? 'word' : 'words'} ready</span>
            </div>
            ${dueReviewCount > 0
              ? '<div class="home-stat-sub">Due for practice today</div>'
              : '<div class="home-stat-sub">All caught up</div>'}
          </section>

          <section class="home-card home-streak-card">
            <h2 class="home-card-title">Streak</h2>
            <div class="home-stat-row">
              <span class="home-stat-value">${streak}</span>
              <span class="home-stat-label">${streak === 1 ? 'day' : 'days'}</span>
            </div>
          </section>

          <section class="home-card home-accuracy-card">
            <h2 class="home-card-title">Accuracy</h2>
            <div class="home-stat-row">
              <span class="home-stat-value">${avgAcc}%</span>
            </div>
          </section>
        </div>

        <section class="home-topics-section">
          <h2 class="home-section-title">Quick Start</h2>
          <div class="home-topic-list">
            ${(topics || []).slice(0, 6).map(t => `
              <a href="#practice?level=${levelLabel}&topic=${t.id}" class="home-topic-chip">
                <span class="home-topic-chip-name">${t.label}</span>
                <span class="home-topic-chip-count">${t.count}</span>
              </a>
            `).join('')}
          </div>
        </section>
      </div>
    `;
  }

  _topicName(id) {
    const names = {
      'daily-life': 'Daily Life',
      'family': 'Family & Friends',
      'food': 'Food & Drink',
      'travel': 'Travel & Places',
      'university': 'University & Study',
      'work': 'Work & Career',
      'shopping': 'Shopping & Numbers',
      'health': 'Health & Body',
      'weather': 'Weather & Seasons',
      'communication': 'Communication',
      'technology': 'Technology',
      'emotions': 'Emotions'
    };
    return names[id] || id;
  }

  showLoading() {
    if (!this.el) return;
    this.el.innerHTML = '<div class="page-loading">Loading...</div>';
  }

  showEmpty() {
    if (!this.el) return;
    this.el.innerHTML = '<div class="page-empty">No content available yet.</div>';
  }

  showOffline() {
    if (!this.el) return;
    this.el.innerHTML = '<div class="page-offline">You\'re offline. Your local progress is still available.</div>';
  }
}
