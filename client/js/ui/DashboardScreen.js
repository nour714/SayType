import { EventEmitter } from '../core/EventEmitter.js';

export class DashboardScreen extends EventEmitter {
  constructor() {
    super();
    this.el = document.getElementById('page-home');
  }

  async render({
    stats,
    streak,
    dueReviewCount,
    topics,
    lastLevel,
    sentenceRepo
  }) {
    if (!this.el) return;

    const hour = new Date().getHours();
    const greeting =
      hour < 12
        ? 'Good morning'
        : hour < 18
          ? 'Good afternoon'
          : 'Good evening';

    const completed = stats?.completedSentenceCount || 0;
    const totalSessions = stats?.totalSessions || 0;
    const avgAcc = stats?.averageAccuracy ?? 100;
    const avgWpm = stats?.averageWpm ?? 0;
    const bestWpm = stats?.bestWpm ?? 0;
    const totalMistakes = stats?.totalMistakes ?? 0;
    const favoritesCount = stats?.favoritesCount ?? 0;

    const levelLabel = lastLevel || 'A1';
    const hasHistory = completed > 0;

    let levelCards = '';
    try {
      const allSentences = await sentenceRepo.getSentences();
      const completedIds = new Set(stats.completedSentenceIds || []);
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
          <a href="#/practice?level=${lv}" class="home-level-card">
            <div class="home-level-header">
              <span class="home-level-code">${lv}</span>
              <span class="home-level-pct">${pct}%</span>
            </div>
            <div class="home-level-bar">
              <div class="home-level-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="home-level-count">${lvCompleted}/${lvSentences.length} sentences</span>
          </a>
        `;
        })
        .join('');
    } catch (_) {
      levelCards = `
        <a href="#/practice?level=A1" class="home-level-card">
          <div class="home-level-header">
            <span class="home-level-code">A1</span>
          </div>
          <span class="home-level-count">Beginner</span>
        </a>
        <a href="#/practice?level=A2" class="home-level-card">
          <div class="home-level-header">
            <span class="home-level-code">A2</span>
          </div>
          <span class="home-level-count">Elementary</span>
        </a>
      `;
    }

    const ctaRoute = hasHistory
      ? `#practice?level=${levelLabel}`
      : '#practice?level=A1';

    this.el.innerHTML = `
      <div class="home-container">
        <section class="home-hero">
          <p class="home-greeting">${greeting}</p>
          <h1 class="home-title">${hasHistory ? 'Continue your English practice' : 'Welcome to SayType'}</h1>
          <p class="home-subtitle">${hasHistory ? 'Pick up where you left off.' : 'Start learning English through typing and listening.'}</p>
          <a href="${ctaRoute}" class="action-btn primary-btn home-cta">${hasHistory ? 'Continue Learning' : 'Start Learning'}</a>
        </section>

        <div class="home-grid">
          <section class="home-card home-progress-card">
            <h2 class="home-card-title">Progress</h2>
            <div class="home-stat-row">
              <span class="home-stat-value">${completed}</span>
              <span class="home-stat-label">sentences completed</span>
            </div>
            <div class="home-stat-sub">${totalSessions} sessions · ${totalMistakes} total mistakes</div>
          </section>

          <section class="home-card home-review-card">
            <h2 class="home-card-title">Review</h2>
            <div class="home-stat-row">
              <span class="home-stat-value">${dueReviewCount}</span>
              <span class="home-stat-label">${dueReviewCount === 1 ? 'word' : 'words'} due</span>
            </div>
            ${
              dueReviewCount > 0
                ? `<a href="#/review" class="home-card-link">Start Review →</a>`
                : '<div class="home-stat-sub">All caught up</div>'
            }
          </section>

          <section class="home-card home-streak-card">
            <h2 class="home-card-title">Streak</h2>
            <div class="home-stat-row">
              <span class="home-stat-value">${streak}</span>
              <span class="home-stat-label">${streak === 1 ? 'day' : 'days'}</span>
            </div>
          </section>

          <section class="home-card home-wpm-card">
            <h2 class="home-card-title">Speed</h2>
            <div class="home-stat-row">
              <span class="home-stat-value">${avgWpm}</span>
              <span class="home-stat-label">avg WPM</span>
            </div>
            <div class="home-stat-sub">Best: ${bestWpm} WPM</div>
          </section>

          <section class="home-card home-accuracy-card">
            <h2 class="home-card-title">Accuracy</h2>
            <div class="home-stat-row">
              <span class="home-stat-value">${avgAcc}%</span>
            </div>
          </section>

          <section class="home-card home-favorites-card">
            <h2 class="home-card-title">Favorites</h2>
            <div class="home-stat-row">
              <span class="home-stat-value">${favoritesCount}</span>
              <span class="home-stat-label">saved</span>
            </div>
          </section>
        </div>

        <section class="home-levels-section">
          <h2 class="home-section-title">Levels</h2>
          <div class="home-level-list">
            ${levelCards}
          </div>
        </section>

        ${
          topics && topics.length > 0
            ? `
          <section class="home-topics-section">
            <h2 class="home-section-title">Topics</h2>
            <div class="home-topic-list">
              ${topics
                .slice(0, 6)
                .map(
                  (t) => `
                <a href="#/practice?level=${levelLabel}&topic=${t.id}" class="home-topic-chip">
                  <span class="home-topic-chip-name">${t.label}</span>
                  <span class="home-topic-chip-count">${t.count}</span>
                </a>
              `
                )
                .join('')}
            </div>
          </section>
        `
            : ''
        }
      </div>
    `;
  }

  showLoading() {
    if (!this.el) return;
    this.el.innerHTML = '<div class="page-loading">Loading...</div>';
  }

  showEmpty() {
    if (!this.el) return;
    this.el.innerHTML =
      '<div class="page-empty">No content available yet.</div>';
  }

  showOffline() {
    if (!this.el) return;
    this.el.innerHTML =
      '<div class="page-offline">You\'re offline. Your local progress is still available.</div>';
  }
}
