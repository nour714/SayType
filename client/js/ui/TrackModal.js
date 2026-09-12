import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Metadata for all 10 topics across A1 and A2 with icons and Arabic translations.
 */
const TOPIC_METADATA = {
  greetings: { icon: '👋', ar: 'التحية والتعارف' },
  'daily-life': { icon: '☕', ar: 'الحياة اليومية والروتين' },
  'work-study': { icon: '📚', ar: 'الدراسة والعمل' },
  'shopping-food': { icon: '🛒', ar: 'التسوق والطعام' },
  travel: { icon: '✈️', ar: 'السفر والمواصلات' },
  'feelings-opinions': { icon: '💡', ar: 'المشاعر والآراء' },
  health: { icon: '🩺', ar: 'الصحة والمساعدة' },
  technology: { icon: '💻', ar: 'التقنية والإنترنت' },
  'plans-conversations': { icon: '🗓️', ar: 'المواعيد والمحادثة' },
  general: { icon: '🎯', ar: 'جمل أساسية متنوعة' }
};

/**
 * TrackModal — portal modal allowing user to choose level and topic track
 * before starting practice session.
 *
 * Emits:
 * - 'track:selected': { level: string, topic: string }
 * - 'track:open'
 * - 'track:dismiss'
 */
export class TrackModal extends EventEmitter {
  constructor(sentenceRepo) {
    super();
    this.sentenceRepo = sentenceRepo;

    const hasDoc = typeof document !== 'undefined';
    this.backdrop = hasDoc ? document.getElementById('track-modal') : null;
    this.closeBtn = hasDoc
      ? document.getElementById('track-modal-close-btn')
      : null;
    this.levelTabs = hasDoc
      ? document.querySelectorAll('.track-level-tab')
      : [];
    this.topicsGrid = hasDoc
      ? document.getElementById('track-modal-topics-grid')
      : null;
    this.startBtn = hasDoc
      ? document.getElementById('track-modal-start-btn')
      : null;

    this._selectedLevel = 'A1';
    this._selectedTopic = '';
    this._topicsCache = {};

    this._bindEvents();
  }

  _bindEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.backdrop) {
      this.backdrop.addEventListener('click', (e) => {
        if (e.target === this.backdrop) {
          this.close();
        }
      });
    }

    if (this.levelTabs && this.levelTabs.length > 0) {
      this.levelTabs.forEach((tab) => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const level = tab.dataset.level;
          if (level && level !== this._selectedLevel) {
            this._selectedLevel = level;
            this._selectedTopic = '';
            this._updateActiveTab();
            this._renderTopics();
          }
        });
      });
    }

    if (this.startBtn) {
      this.startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this._handleStart();
      });
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });
    }
  }

  _updateActiveTab() {
    if (!this.levelTabs) return;
    this.levelTabs.forEach((tab) => {
      const isActive = tab.dataset.level === this._selectedLevel;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  /**
   * Open the track modal.
   * @param {{ level?: string, topic?: string }} options
   */
  async open({ level = 'A1', topic = '' } = {}) {
    this._selectedLevel = level || 'A1';
    this._selectedTopic = topic || '';

    this._updateActiveTab();
    await this._renderTopics();

    if (this.backdrop) {
      this.backdrop.classList.add('is-open');
      this.backdrop.setAttribute('aria-hidden', 'false');
    }

    this.emit('track:open');
  }

  /**
   * Close the modal.
   */
  close() {
    if (this.backdrop) {
      this.backdrop.classList.remove('is-open');
      this.backdrop.setAttribute('aria-hidden', 'true');
    }
    this.emit('track:dismiss');
  }

  /**
   * Check if modal is open.
   * @returns {boolean}
   */
  isOpen() {
    return Boolean(
      this.backdrop && this.backdrop.classList.contains('is-open')
    );
  }

  /**
   * Render topics for the currently selected level.
   */
  async _renderTopics() {
    if (!this.topicsGrid) return;
    this.topicsGrid.innerHTML =
      '<div class="track-loading">جاري تحميل المواضيع...</div>';

    let topics = this._topicsCache[this._selectedLevel];
    if (!topics && this.sentenceRepo) {
      try {
        topics = await this.sentenceRepo.getTopics(this._selectedLevel);
        this._topicsCache[this._selectedLevel] = topics;
      } catch (_) {
        topics = [];
      }
    }

    if (!Array.isArray(topics)) topics = [];

    // Construct full cards list: "All Topics" first, then individual topics
    const totalSentences = topics.reduce((acc, t) => acc + (t.count || 50), 0);
    const allItem = {
      id: '',
      label: 'All Topics',
      ar: 'جميع جمل المستوى',
      icon: '🌟',
      count: totalSentences
    };

    const displayTopics = [
      allItem,
      ...topics.map((t) => {
        const meta = TOPIC_METADATA[t.id] || { icon: '📖', ar: t.label };
        return {
          id: t.id,
          label: t.label,
          ar: meta.ar,
          icon: meta.icon,
          count: t.count || 50
        };
      })
    ];

    this.topicsGrid.innerHTML = displayTopics
      .map((item) => {
        const isSelected = item.id === this._selectedTopic;
        return `
        <button
          type="button"
          class="track-topic-card ${isSelected ? 'is-selected' : ''}"
          data-topic-id="${item.id}"
        >
          <div class="track-topic-icon-box" aria-hidden="true">${item.icon}</div>
          <div class="track-topic-meta">
            <div class="track-topic-title">${item.label}</div>
            <div class="track-topic-ar" dir="rtl" lang="ar">${item.ar}</div>
          </div>
          <div class="track-topic-badge">${item.count} جملة</div>
          <div class="track-topic-check" aria-hidden="true">✓</div>
        </button>
      `;
      })
      .join('');

    // Bind topic card selection clicks
    this.topicsGrid.querySelectorAll('.track-topic-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const topicId = card.dataset.topicId;
        this._selectedTopic = topicId;

        this.topicsGrid
          .querySelectorAll('.track-topic-card')
          .forEach((c) => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
      });
    });
  }

  _handleStart() {
    this.close();
    this.emit('track:selected', {
      level: this._selectedLevel,
      topic: this._selectedTopic
    });
  }
}
