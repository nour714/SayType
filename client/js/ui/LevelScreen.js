import { EventEmitter } from '../core/EventEmitter.js';

export class LevelScreen extends EventEmitter {
  constructor() {
    super();
    this.el = document.getElementById('page-learn');
  }

  async render({ sentenceRepo, progressService }) {
    if (!this.el) return;

    this.el.innerHTML = '<div class="page-loading">Loading levels...</div>';

    try {
      const allSentences = await sentenceRepo.getSentences();
      const topicsA1 = await sentenceRepo.getTopics('A1');
      const topicsA2 = await sentenceRepo.getTopics('A2');
      const stats = progressService.getStats();
      const completedIds = new Set(stats.completedSentenceIds || []);

      const levels = [
        {
          id: 'A1', name: 'Beginner',
          description: 'Start with everyday expressions and basic phrases',
          topics: topicsA1,
          sentences: allSentences.filter(s => s.level === 'A1')
        },
        {
          id: 'A2', name: 'Elementary',
          description: 'Build on foundations with more complex sentences',
          topics: topicsA2,
          sentences: allSentences.filter(s => s.level === 'A2')
        }
      ];

      this.el.innerHTML = `
        <div class="level-hub">
          <div class="page-header">
            <h1 class="page-title">Choose Your Level</h1>
            <p class="page-subtitle">Select a CEFR level to begin practicing</p>
          </div>
          <div class="level-grid">
            ${levels.map(lv => {
              const completedCount = lv.sentences.filter(s => completedIds.has(String(s.id))).length;
              const pct = lv.sentences.length > 0 ? Math.round((completedCount / lv.sentences.length) * 100) : 0;
              return `
                <a href="#practice?level=${lv.id}" class="level-card" data-level="${lv.id}">
                  <div class="level-card-header">
                    <span class="level-card-code">${lv.id}</span>
                    <span class="level-card-name">${lv.name}</span>
                  </div>
                  <p class="level-card-desc">${lv.description}</p>
                  <div class="level-card-stats">
                    <span class="level-card-count">${lv.sentences.length} sentences</span>
                    <span class="level-card-pct">${pct}% complete</span>
                  </div>
                  <div class="level-card-bar">
                    <div class="level-card-bar-fill" style="width: ${pct}%"></div>
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      `;

      this.el.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', (e) => {
          e.preventDefault();
          const level = card.dataset.level;
          this.emit('level:select', { level });
        });
      });
    } catch (err) {
      this.el.innerHTML = '<div class="page-empty">Failed to load levels. Please try again.</div>';
    }
  }

  showLoading() {
    if (this.el) this.el.innerHTML = '<div class="page-loading">Loading...</div>';
  }

  showOffline() {
    if (!this.el) return;
    this.el.innerHTML = '<div class="page-offline">You\'re offline. Your local progress is still available.</div>';
  }
}
