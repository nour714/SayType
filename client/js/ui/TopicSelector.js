import { EventEmitter } from '../core/EventEmitter.js';

/**
 * TopicSelector — minimalist topic selection dropdown.
 * Emits:
 * - 'topic:change': { topic: string }
 */
export class TopicSelector extends EventEmitter {
  /**
   * @param {string} elementId
   */
  constructor(elementId = 'topic-select') {
    super();
    this.selectEl = document.getElementById(elementId);
    this._bindEvents();
  }

  _bindEvents() {
    if (this.selectEl) {
      this.selectEl.addEventListener('change', (e) => {
        this.emit('topic:change', { topic: e.target.value });
      });
    }
  }

  /**
   * Populate topic options in dropdown.
   * @param {Array<{ id: string, label: string, count?: number }>} topics
   * @param {string} [currentTopic='']
   */
  setTopics(topics, currentTopic = '') {
    if (!this.selectEl) return;
    this.selectEl.innerHTML = '';

    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All Topics';
    this.selectEl.appendChild(allOption);

    if (Array.isArray(topics)) {
      topics.forEach((topic) => {
        const opt = document.createElement('option');
        const id = topic.id || topic.slug || topic;
        const label = topic.label || topic.name || id;
        opt.value = id;
        opt.textContent = topic.count ? `${label} (${topic.count})` : label;
        this.selectEl.appendChild(opt);
      });
    }

    this.selectEl.value = currentTopic;
  }

  /**
   * Set active selected topic.
   * @param {string} topic
   */
  setSelectedTopic(topic) {
    if (this.selectEl) {
      this.selectEl.value = topic || '';
    }
  }

  setTopic(topic) {
    this.setSelectedTopic(topic);
  }
}
