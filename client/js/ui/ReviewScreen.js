import { EventEmitter } from '../core/EventEmitter.js';

export class ReviewScreen extends EventEmitter {
  constructor() {
    super();
    this.el = document.getElementById('page-review');
  }

  render({ progressService, reviewScheduler, sentenceRepo, currentLevel }) {
    if (!this.el) return;

    const dueWords = progressService.getDueReviewWords(50);
    const wordReview = progressService.data.wordReview || {};
    const allWords = Object.entries(wordReview);

    const learning = allWords.filter(([, e]) => !e.mastered && e.dueAtCount > (progressService.data.sentencesTypedTotal || 0));
    const mastered = allWords.filter(([, e]) => e.mastered);
    const totalReviewed = allWords.length;

    this.el.innerHTML = `
      <div class="review-page">
        <div class="page-header">
          <h1 class="page-title">Spaced Review</h1>
          <p class="page-subtitle">Words scheduled for practice based on your learning history</p>
        </div>

        <div class="review-dashboard">
          <div class="review-stat">
            <span class="review-stat-value">${dueWords.length}</span>
            <span class="review-stat-label">Due Today</span>
          </div>
          <div class="review-stat">
            <span class="review-stat-value">${learning.length}</span>
            <span class="review-stat-label">Learning</span>
          </div>
          <div class="review-stat">
            <span class="review-stat-value">${mastered.length}</span>
            <span class="review-stat-label">Mastered</span>
          </div>
          <div class="review-stat">
            <span class="review-stat-value">${totalReviewed}</span>
            <span class="review-stat-label">Total Reviewed</span>
          </div>
        </div>

        ${dueWords.length > 0 ? `
          <div class="review-start-section">
            <a href="#practice?level=${currentLevel || 'A1'}&review=true" class="action-btn primary-btn review-start-btn">
              Start Review
              <span class="review-start-count">${dueWords.length} words</span>
            </a>
          </div>

          <div class="review-list-section">
            <h2 class="review-list-title">Words Due for Review</h2>
            <div class="review-word-list">
              ${dueWords.map(({ word, box }) => `
                <div class="review-word-item">
                  <span class="review-word-text">${word}</span>
                  <span class="review-word-box">Box ${box + 1}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="review-empty-state">
            <div class="review-empty-icon">&#10003;</div>
            <h2 class="review-empty-title">You're all caught up</h2>
            <p class="review-empty-text">No words are due for review right now. Keep practicing to add more words to your review queue.</p>
          </div>
        `}
      </div>
    `;
  }

  showLoading() {
    if (this.el) this.el.innerHTML = '<div class="page-loading">Loading review data...</div>';
  }
}
