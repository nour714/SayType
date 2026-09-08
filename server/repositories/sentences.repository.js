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
          id: 'a1-daily-life-001',
          level: 'A1',
          topic: 'daily-life',
          topic_label: 'Daily Life',
          text_en: 'I wake up at seven every morning.',
          text_ar: 'أستيقظ في الساعة السابعة كل صباح.',
          english: 'I wake up at seven every morning.',
          arabic: 'أستيقظ في الساعة السابعة كل صباح.',
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
          tags: ['routine', 'morning']
        },
        {
          id: 'a1-family-001',
          level: 'A1',
          topic: 'family',
          topic_label: 'Family & Friends',
          text_en: 'She is my sister.',
          text_ar: 'هي أختي.',
          english: 'She is my sister.',
          arabic: 'هي أختي.',
          words: [
            {
              word: 'She',
              translation: 'هي',
              partOfSpeech: 'pronoun',
              pronunciation: '/ʃiː/'
            },
            {
              word: 'sister',
              translation: 'أخت',
              partOfSpeech: 'noun',
              pronunciation: '/ˈsɪs.tər/'
            }
          ],
          tags: ['family', 'relationship']
        },
        {
          id: 'a1-food-001',
          level: 'A1',
          topic: 'food',
          topic_label: 'Food & Drink',
          text_en: 'I like coffee.',
          text_ar: 'أحب القهوة.',
          english: 'I like coffee.',
          arabic: 'أحب القهوة.',
          words: [
            {
              word: 'like',
              translation: 'يحب',
              partOfSpeech: 'verb',
              pronunciation: '/laɪk/'
            },
            {
              word: 'coffee',
              translation: 'قهوة',
              partOfSpeech: 'noun',
              pronunciation: '/ˈkɔː.fi/'
            }
          ],
          tags: ['beverage', 'preference']
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
