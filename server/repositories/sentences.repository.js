const fs = require('fs').promises;
const path = require('path');

/**
 * SentencesRepository — Data Access Layer for Sentence entities.
 * Follows the repository pattern. Reads from sentences.a1.json;
 * can be backed by a database in later phases without altering the caller contract.
 */
class SentencesRepository {
  constructor(dataPath) {
    this.dataPath = dataPath || path.join(__dirname, '../data/sentences.a1.json');
    this._cache = null;
  }

  /**
   * Load all sentences from data store.
   * @returns {Promise<Array>}
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
        {
          id: 1,
          level: "A1",
          topic: "daily-life",
          topic_label: "Daily Life",
          text_en: "I am tired.",
          text_ar: "أنا متعب.",
          english: "I am tired.",
          arabic: "أنا متعب.",
          words: [
            { word: "I", translation: "أنا", partOfSpeech: "pronoun", pronunciation: "/aɪ/" },
            { word: "am", translation: "أكون", partOfSpeech: "verb", pronunciation: "/æm/" },
            { word: "tired", translation: "متعب / مرهق", partOfSpeech: "adjective", pronunciation: "/ˈtaɪərd/" }
          ]
        },
        {
          id: 2,
          level: "A1",
          topic: "food",
          topic_label: "Food & Drink",
          text_en: "I like coffee.",
          text_ar: "أنا أحب القهوة.",
          english: "I like coffee.",
          arabic: "أنا أحب القهوة.",
          words: [
            { word: "I", translation: "أنا", partOfSpeech: "pronoun", pronunciation: "/aɪ/" },
            { word: "like", translation: "يحب", partOfSpeech: "verb", pronunciation: "/laɪk/" },
            { word: "coffee", translation: "قهوة", partOfSpeech: "noun", pronunciation: "/ˈkɔːfi/" }
          ]
        },
        {
          id: 3,
          level: "A1",
          topic: "family",
          topic_label: "Family & Friends",
          text_en: "She is my sister.",
          text_ar: "هي أختي.",
          english: "She is my sister.",
          arabic: "هي أختي.",
          words: [
            { word: "She", translation: "هي", partOfSpeech: "pronoun", pronunciation: "/ʃiː/" },
            { word: "is", translation: "تكون", partOfSpeech: "verb", pronunciation: "/ɪz/" },
            { word: "my", translation: "لي", partOfSpeech: "determiner", pronunciation: "/maɪ/" },
            { word: "sister", translation: "أخت", partOfSpeech: "noun", pronunciation: "/ˈsɪstər/" }
          ]
        },
        {
          id: 4,
          level: "A1",
          topic: "university",
          topic_label: "University & Study",
          text_en: "I go to school every day.",
          text_ar: "أذهب إلى المدرسة كل يوم.",
          english: "I go to school every day.",
          arabic: "أذهب إلى المدرسة كل يوم.",
          words: [
            { word: "I", translation: "أنا", partOfSpeech: "pronoun", pronunciation: "/aɪ/" },
            { word: "go", translation: "يذهب", partOfSpeech: "verb", pronunciation: "/ɡoʊ/" },
            { word: "school", translation: "مدرسة", partOfSpeech: "noun", pronunciation: "/skuːl/" }
          ]
        },
        {
          id: 5,
          level: "A1",
          topic: "daily-life",
          topic_label: "Daily Life",
          text_en: "This is my house.",
          text_ar: "هذا منزلي.",
          english: "This is my house.",
          arabic: "هذا منزلي.",
          words: [
            { word: "house", translation: "منزل", partOfSpeech: "noun", pronunciation: "/haʊs/" }
          ]
        },
        {
          id: 6,
          level: "A1",
          topic: "university",
          topic_label: "University & Study",
          text_en: "I do not understand everything yet.",
          text_ar: "لا أفهم كل شيء بعد.",
          english: "I do not understand everything yet.",
          arabic: "لا أفهم كل شيء بعد.",
          words: [
            { word: "understand", translation: "يفهم", partOfSpeech: "verb", pronunciation: "/ˌʌndərˈstænd/" }
          ]
        },
        {
          id: 7,
          level: "A1",
          topic: "food",
          topic_label: "Food & Drink",
          text_en: "We eat lunch at noon.",
          text_ar: "نتناول الغداء عند الظهيرة.",
          english: "We eat lunch at noon.",
          arabic: "نتناول الغداء عند الظهيرة.",
          words: [
            { word: "lunch", translation: "غداء", partOfSpeech: "noun", pronunciation: "/lʌntʃ/" }
          ]
        },
        {
          id: 8,
          level: "A1",
          topic: "work",
          topic_label: "Work & Career",
          text_en: "He works in an office.",
          text_ar: "هو يعمل في مكتب.",
          english: "He works in an office.",
          arabic: "هو يعمل في مكتب.",
          words: [
            { word: "office", translation: "مكتب", partOfSpeech: "noun", pronunciation: "/ˈɔːfɪs/" }
          ]
        },
        {
          id: 9,
          level: "A1",
          topic: "daily-life",
          topic_label: "Daily Life",
          text_en: "I drink water every morning.",
          text_ar: "أشرب الماء كل صباح.",
          english: "I drink water every morning.",
          arabic: "أشرب الماء كل صباح.",
          words: [
            { word: "water", translation: "ماء", partOfSpeech: "noun", pronunciation: "/ˈwɔːtər/" }
          ]
        },
        {
          id: 10,
          level: "A1",
          topic: "daily-life",
          topic_label: "Daily Life",
          text_en: "Thank you very much.",
          text_ar: "شكرًا جزيلًا.",
          english: "Thank you very much.",
          arabic: "شكرًا جزيلًا.",
          words: [
            { word: "Thank", translation: "يشكر", partOfSpeech: "verb", pronunciation: "/θæŋk/" }
          ]
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
   * @returns {Promise<Array<{ id: string, label: string, count: number }>>}
   */
  async getTopics() {
    const sentences = await this.findAll();
    const map = new Map();
    sentences.forEach((s) => {
      const id = s.topic || 'daily-life';
      const label = s.topic_label || id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' ');
      if (!map.has(id)) {
        map.set(id, { id, label, count: 0 });
      }
      map.get(id).count++;
    });
    return Array.from(map.values());
  }
}

module.exports = new SentencesRepository();
