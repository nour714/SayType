const fs = require('fs').promises;
const path = require('path');

/**
 * SentencesRepository — Data Access Layer for Sentence entities.
 * Follows the repository pattern. Loads all sentences.*.json files
 * from the data directory; can be backed by a database in later phases
 * without altering the caller contract.
 */
class SentencesRepository {
  constructor(dataDir) {
    this.dataDir = dataDir || path.join(__dirname, '../data');
    this._cache = null;
  }

  /**
   * Load all sentences from every sentences.*.json file in the data directory.
   * @returns {Promise<Array>}
   */
  async findAll() {
    if (this._cache) {
      return this._cache;
    }

    try {
      const files = (await fs.readdir(this.dataDir)).filter(
        (f) => f.startsWith('sentences.') && f.endsWith('.json')
      );
      const all = [];
      for (const file of files) {
        const raw = await fs.readFile(path.join(this.dataDir, file), 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) all.push(...parsed);
      }
      this._cache = all;
      return this._cache;
    } catch (err) {
      console.error('Error reading sentences data directory:', err.message);
      // Fallback in-memory dataset (representative subset of the 10 V1 topics)
      return [
        {
          id: 'a1-greetings-001',
          level: 'A1',
          topic: 'greetings',
          topic_label: 'Greetings & Introductions',
          text_en: 'Hello',
          text_ar: 'مرحبًا',
          english: 'Hello',
          arabic: 'مرحبًا',
          words: [
            {
              word: 'hello',
              translation: 'مرحبًا',
              partOfSpeech: 'interjection',
              pronunciation: '/həˈloʊ/'
            }
          ],
          tags: ['greetings', 'introductions']
        },
        {
          id: 'a1-daily-life-001',
          level: 'A1',
          topic: 'daily-life',
          topic_label: 'Daily Life & Routine',
          text_en: 'I usually wake up at seven',
          text_ar: 'عادةً أستيقظ في السابعة',
          english: 'I usually wake up at seven',
          arabic: 'عادةً أستيقظ في السابعة',
          words: [
            {
              word: 'wake',
              translation: 'يستيقظ',
              partOfSpeech: 'verb',
              pronunciation: '/weɪk/'
            },
            {
              word: 'seven',
              translation: 'سبعة',
              partOfSpeech: 'number',
              pronunciation: '/ˈsɛv.ən/'
            }
          ],
          tags: ['daily-life', 'routine']
        },
        {
          id: 'a1-work-study-001',
          level: 'A1',
          topic: 'work-study',
          topic_label: 'Study & Work',
          text_en: 'I study at the university',
          text_ar: 'أنا أدرس في الجامعة',
          english: 'I study at the university',
          arabic: 'أنا أدرس في الجامعة',
          words: [
            {
              word: 'study',
              translation: 'يدرس',
              partOfSpeech: 'verb',
              pronunciation: '/ˈstʌd.i/'
            },
            {
              word: 'university',
              translation: 'جامعة',
              partOfSpeech: 'noun',
              pronunciation: '/ˌjuː.nɪˈvɜːr.sə.ti/'
            }
          ],
          tags: ['study', 'work']
        }
      ];
    }
  }

  /**
   * Find a sentence by its unique ID.
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const sentences = await this.findAll();
    return sentences.find((s) => String(s.id) === String(id)) || null;
  }

  /**
   * Find sentences matching a specific CEFR level (e.g. "A1").
   * @param {string} level
   * @returns {Promise<Array>}
   */
  async findByLevel(level) {
    const sentences = await this.findAll();
    if (!level) return sentences;
    return sentences.filter(
      (s) => s.level && s.level.toLowerCase() === level.toLowerCase()
    );
  }

  /**
   * Find sentences matching a topic.
   * @param {string} topic
   * @returns {Promise<Array>}
   */
  async findByTopic(topic) {
    const sentences = await this.findAll();
    if (!topic || topic === 'all') return sentences;
    return sentences.filter(
      (s) => s.topic && s.topic.toLowerCase() === topic.toLowerCase()
    );
  }

  /**
   * Find sentences matching level and topic.
   * @param {string} level
   * @param {string} topic
   * @returns {Promise<Array>}
   */
  async findByLevelAndTopic(level, topic) {
    let sentences = await this.findAll();
    if (level) {
      sentences = sentences.filter(
        (s) => s.level && s.level.toLowerCase() === level.toLowerCase()
      );
    }
    if (topic && topic !== 'all') {
      sentences = sentences.filter(
        (s) => s.topic && s.topic.toLowerCase() === topic.toLowerCase()
      );
    }
    return sentences;
  }

  /**
   * Get list of all distinct topics available with counts.
   * @param {string} [level] - optional level filter (e.g. "A1", "A2")
   * @returns {Promise<Array<{ id: string, label: string, count: number }>>}
   */
  async getTopics(level) {
    let sentences = await this.findAll();
    if (level) {
      sentences = sentences.filter(
        (s) => s.level && s.level.toLowerCase() === level.toLowerCase()
      );
    }
    const map = new Map();
    sentences.forEach((s) => {
      const id = s.topic || 'daily-life';
      const label =
        s.topic_label ||
        id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' ');
      if (!map.has(id)) {
        map.set(id, { id, label, count: 0 });
      }
      map.get(id).count++;
    });
    return Array.from(map.values());
  }
}

module.exports = new SentencesRepository();
module.exports.SentencesRepository = SentencesRepository;
