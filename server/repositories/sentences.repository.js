const fs = require('fs').promises;
const path = require('path');

/**
 * SentencesRepository — Data Access Layer for Sentence entities.
 * Follows the repository pattern. Currently reads from sentences.a1.json;
 * can be replaced with a database implementation (e.g. SQLite / PostgreSQL) in Phase 2
 * without changing the caller interface.
 */
class SentencesRepository {
  constructor(dataPath) {
    this.dataPath = dataPath || path.join(__dirname, '../data/sentences.a1.json');
    this._cache = null;
  }

  /**
   * Load all sentences from data store.
   * @returns {Promise<Array<{ id: number, text_en: string, text_ar: string, level: string }>>}
   */
  async findAll() {
    if (this._cache) {
      return this._cache;
    }

    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this._cache = JSON.parse(data);
      return this._cache;
    } catch (err) {
      console.error('Error reading sentences file:', err.message);
      // Fallback in-memory dataset
      return [
        { id: 1, text_en: "I am tired.", text_ar: "أنا تعبان.", level: "A1" },
        { id: 2, text_en: "I like coffee.", text_ar: "أنا بحب القهوة.", level: "A1" },
        { id: 3, text_en: "She is my sister.", text_ar: "هي أختي.", level: "A1" },
        { id: 4, text_en: "I go to school every day.", text_ar: "أنا بروح المدرسة كل يوم.", level: "A1" },
        { id: 5, text_en: "This is my house.", text_ar: "ده بيتي.", level: "A1" },
        { id: 6, text_en: "I do not understand everything yet.", text_ar: "لا أفهم كل شيء بعد.", level: "A1" },
        { id: 7, text_en: "We eat lunch at noon.", text_ar: "بناكل غدا في الضهر.", level: "A1" },
        { id: 8, text_en: "He works in an office.", text_ar: "هو بيشتغل في مكتب.", level: "A1" },
        { id: 9, text_en: "I drink water every morning.", text_ar: "أنا بشرب مية كل يوم الصبح.", level: "A1" },
        { id: 10, text_en: "Thank you very much.", text_ar: "شكرًا جزيلًا.", level: "A1" }
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
    return sentences.find((s) => Number(s.id) === Number(id)) || null;
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
}

module.exports = new SentencesRepository();
