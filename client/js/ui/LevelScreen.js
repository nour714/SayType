import { EventEmitter } from '../core/EventEmitter.js';

export class LevelScreen extends EventEmitter {
  constructor() {
    super();
    this.el = document.getElementById('page-learn');
    this._selectedLevel = null;
    this._sentenceRepo = null;
    this._progressService = null;
  }

  async render({ sentenceRepo, progressService, level }) {
    if (!this.el) return;
    this._sentenceRepo = sentenceRepo;
    this._progressService = progressService;

    if (level) {
      this._selectedLevel = level;
      await this._renderTopics(level);
    } else {
      this._selectedLevel = null;
      await this._renderLevels();
    }
  }

  async _renderLevels() {
    this.el.innerHTML = '<div class="page-loading">Loading levels...</div>';

    try {
      const allSentences = await this._sentenceRepo.getSentences();
      const stats = this._progressService.getStats();
      const completedIds = new Set(stats.completedSentenceIds || []);

      const levels = [
        { id: 'A1', name: 'Beginner', description: 'Everyday expressions and basic phrases' },
        { id: 'A2', name: 'Elementary', description: 'More complex sentences and vocabulary' }
      ];

      this.el.innerHTML = `
        <div class="level-hub">
          <div class="page-header">
            <h1 class="page-title">Choose Your Level</h1>
            <p class="page-subtitle">Select a CEFR level to begin practicing</p>
          </div>
          <div class="level-grid">
            ${levels.map(lv => {
              const lvSentences = allSentences.filter(s => s.level === lv.id);
              const lvCompleted = lvSentences.filter(s => completedIds.has(String(s.id))).length;
              const pct = lvSentences.length > 0 ? Math.round((lvCompleted / lvSentences.length) * 100) : 0;
              return `
                <div class="level-card" data-level="${lv.id}">
                  <div class="level-card-header">
                    <span class="level-card-code">${lv.id}</span>
                    <span class="level-card-name">${lv.name}</span>
                  </div>
                  <p class="level-card-desc">${lv.description}</p>
                  <div class="level-card-stats">
                    <span class="level-card-count">${lvSentences.length} sentences</span>
                    <span class="level-card-completed">${lvCompleted} completed</span>
                  </div>
                  <div class="level-card-bar">
                    <div class="level-card-bar-fill" style="width:${pct}%"></div>
                  </div>
                  <div class="level-card-actions">
                    <button class="action-btn secondary-btn level-topics-btn" data-level="${lv.id}">View Topics</button>
                    <a href="#practice?level=${lv.id}" class="action-btn primary-btn">Practice All</a>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      this.el.querySelectorAll('.level-topics-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const lv = btn.dataset.level;
          this._selectedLevel = lv;
          this._renderTopics(lv);
        });
      });
    } catch (err) {
      this.el.innerHTML = '<div class="page-empty">Failed to load levels. Please try again.</div>';
    }
  }

  async _renderTopics(level) {
    this.el.innerHTML = `<div class="page-loading">Loading ${level} topics...</div>`;

    try {
      const topics = await this._sentenceRepo.getTopics(level);
      const allSentences = await this._sentenceRepo.getSentences({ level });
      const stats = this._progressService.getStats();
      const completedIds = new Set(stats.completedSentenceIds || []);

      this.el.innerHTML = `
        <div class="topic-hub">
          <div class="page-header">
            <button class="back-link" id="back-to-levels">&larr; Back to Levels</button>
            <h1 class="page-title">${level} Topics</h1>
            <p class="page-subtitle">Choose a topic to start practicing</p>
          </div>
          <div class="topic-grid">
            ${topics.map(t => {
              const topicSentences = allSentences.filter(s => s.topic === t.id);
              const completedCount = topicSentences.filter(s => completedIds.has(String(s.id))).length;
              const pct = topicSentences.length > 0 ? Math.round((completedCount / topicSentences.length) * 100) : 0;
              return `
                <a href="#practice?level=${level}&topic=${t.id}" class="topic-card">
                  <div class="topic-card-header">
                    <span class="topic-card-name">${t.label}</span>
                  </div>
                  <div class="topic-card-stats">
                    <span class="topic-card-count">${topicSentences.length} sentences</span>
                    <span class="topic-card-completed">${completedCount} done</span>
                  </div>
                  <div class="topic-card-bar">
                    <div class="topic-card-bar-fill" style="width:${pct}%"></div>
                  </div>
                </a>
              `;
            }).join('')}
            <a href="#practice?level=${level}" class="topic-card topic-card-all">
              <div class="topic-card-header">
                <span class="topic-card-name">All Topics</span>
              </div>
              <div class="topic-card-stats">
                <span class="topic-card-count">${allSentences.length} sentences</span>
              </div>
            </a>
          </div>
        </div>
      `;

      const backBtn = document.getElementById('back-to-levels');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this._selectedLevel = null;
          this._renderLevels();
        });
      }
    } catch (err) {
      this.el.innerHTML = '<div class="page-empty">Failed to load topics. Please try again.</div>';
    }
  }
}
