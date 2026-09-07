import { EventEmitter } from '../core/EventEmitter.js';

export class TopicScreen extends EventEmitter {
  constructor() {
    super();
    this.el = document.getElementById('page-learn');
  }

  async render({ level, sentenceRepo, progressService }) {
    if (!this.el) return;

    this.el.innerHTML = `<div class="page-loading">Loading ${level} topics...</div>`;

    try {
      const topics = await sentenceRepo.getTopics(level);
      const allSentences = await sentenceRepo.getSentences({ level });
      const stats = progressService.getStats();
      const completedIds = new Set(stats.completedSentenceIds || []);

      this.el.innerHTML = `
        <div class="topic-hub">
          <div class="page-header">
            <a href="#/learn" class="back-link">&larr; Back to Levels</a>
            <h1 class="page-title">${level} Topics</h1>
            <p class="page-subtitle">Choose a topic to start practicing</p>
          </div>
          <div class="topic-grid">
            ${topics.map(t => {
              const topicSentences = allSentences.filter(s => s.topic === t.id);
              const completedCount = topicSentences.filter(s => completedIds.has(String(s.id))).length;
              const pct = topicSentences.length > 0 ? Math.round((completedCount / topicSentences.length) * 100) : 0;
              return `
                <a href="#/practice?level=${level}&topic=${t.id}" class="topic-card" data-topic="${t.id}">
                  <div class="topic-card-header">
                    <span class="topic-card-name">${t.label}</span>
                  </div>
                  <div class="topic-card-stats">
                    <span class="topic-card-count">${topicSentences.length} sentences</span>
                    <span class="topic-card-pct">${pct}% complete</span>
                  </div>
                  <div class="topic-card-bar">
                    <div class="topic-card-bar-fill" style="width: ${pct}%"></div>
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      `;

      this.el.querySelectorAll('.topic-card').forEach(card => {
        card.addEventListener('click', () => {
          const topic = card.dataset.topic;
          this.emit('topic:select', { level, topic });
        });
      });
    } catch (err) {
      this.el.innerHTML = '<div class="page-empty">Failed to load topics. Please try again.</div>';
    }
  }

  showLoading() {
    if (this.el) this.el.innerHTML = '<div class="page-loading">Loading...</div>';
  }
}
