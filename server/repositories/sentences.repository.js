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
      // Fallback in-memory dataset (representative subset of the 10 V1 topics)
      return [
        {
          id: "a1-daily-life-001",
          level: "A1",
          topic: "daily-life",
          topic_label: "Daily Life",
          text_en: "I wake up at seven every morning.",
          text_ar: "أستيقظ في الساعة السابعة كل صباح.",
          english: "I wake up at seven every morning.",
          arabic: "أستيقظ في الساعة السابعة كل صباح.",
          words: [
            { word: "wake", translation: "يستيقظ", partOfSpeech: "verb", pronunciation: "/weɪk/" },
            { word: "seven", translation: "سبعة", partOfSpeech: "number", pronunciation: "/ˈsɛv.ən/" }
          ],
          tags: ["routine", "morning"]
        },
        {
          id: "a1-family-001",
          level: "A1",
          topic: "family",
          topic_label: "Family & Friends",
          text_en: "She is my sister.",
          text_ar: "هي أختي.",
          english: "She is my sister.",
          arabic: "هي أختي.",
          words: [
            { word: "She", translation: "هي", partOfSpeech: "pronoun", pronunciation: "/ʃiː/" },
            { word: "sister", translation: "أخت", partOfSpeech: "noun", pronunciation: "/ˈsɪs.tər/" }
          ],
          tags: ["family", "relationship"]
        },
        {
          id: "a1-food-001",
          level: "A1",
          topic: "food",
          topic_label: "Food & Drink",
          text_en: "I like coffee.",
          text_ar: "أحب القهوة.",
          english: "I like coffee.",
          arabic: "أحب القهوة.",
          words: [
            { word: "like", translation: "يحب", partOfSpeech: "verb", pronunciation: "/laɪk/" },
            { word: "coffee", translation: "قهوة", partOfSpeech: "noun", pronunciation: "/ˈkɔː.fi/" }
          ],
          tags: ["beverage", "preference"]
        },
        {
          id: "a1-travel-001",
          level: "A1",
          topic: "travel",
          topic_label: "Travel & Places",
          text_en: "The airport is far from here.",
          text_ar: "المطار بعيد عن هنا.",
          english: "The airport is far from here.",
          arabic: "المطار بعيد عن هنا.",
          words: [
            { word: "airport", translation: "مطار", partOfSpeech: "noun", pronunciation: "/ˈɛər.pɔːrt/" },
            { word: "far", translation: "بعيد", partOfSpeech: "adjective", pronunciation: "/fɑːr/" }
          ],
          tags: ["travel", "locations"]
        },
        {
          id: "a1-university-001",
          level: "A1",
          topic: "university",
          topic_label: "University & Study",
          text_en: "I study English at university.",
          text_ar: "أدرس اللغة الإنجليزية في الجامعة.",
          english: "I study English at university.",
          arabic: "أدرس اللغة الإنجليزية في الجامعة.",
          words: [
            { word: "study", translation: "يدرس", partOfSpeech: "verb", pronunciation: "/ˈstʌd.i/" },
            { word: "university", translation: "جامعة", partOfSpeech: "noun", pronunciation: "/ˌjuː.nɪˈvɜːr.sə.ti/" }
          ],
          tags: ["study", "subject"]
        },
        {
          id: "a1-work-001",
          level: "A1",
          topic: "work",
          topic_label: "Work & Career",
          text_en: "He works in an office.",
          text_ar: "يعمل في مكتب.",
          english: "He works in an office.",
          arabic: "يعمل في مكتب.",
          words: [
            { word: "works", translation: "يعمل", partOfSpeech: "verb", pronunciation: "/wɜːrks/" },
            { word: "office", translation: "مكتب", partOfSpeech: "noun", pronunciation: "/ˈɔː.fɪs/" }
          ],
          tags: ["job", "office"]
        },
        {
          id: "a1-shopping-001",
          level: "A1",
          topic: "shopping",
          topic_label: "Shopping & Numbers",
          text_en: "I want to pay with cash.",
          text_ar: "أريد أن أدفع نقدًا.",
          english: "I want to pay with cash.",
          arabic: "أريد أن أدفع نقدًا.",
          words: [
            { word: "pay", translation: "يدفع", partOfSpeech: "verb", pronunciation: "/peɪ/" },
            { word: "cash", translation: "نقد", partOfSpeech: "noun", pronunciation: "/kæʃ/" }
          ],
          tags: ["shopping", "payment"]
        },
        {
          id: "a1-health-001",
          level: "A1",
          topic: "health",
          topic_label: "Health & Body",
          text_en: "I walk thirty minutes every day.",
          text_ar: "أمشي ثلاثين دقيقة كل يوم.",
          english: "I walk thirty minutes every day.",
          arabic: "أمشي ثلاثين دقيقة كل يوم.",
          words: [
            { word: "walk", translation: "يمشي", partOfSpeech: "verb", pronunciation: "/wɔːk/" },
            { word: "thirty", translation: "ثلاثون", partOfSpeech: "number", pronunciation: "/ˈθɜːr.ti/" }
          ],
          tags: ["exercise", "health"]
        },
        {
          id: "a1-weather-001",
          level: "A1",
          topic: "weather",
          topic_label: "Weather & Seasons",
          text_en: "It is sunny today.",
          text_ar: "الطقس مشمس اليوم.",
          english: "It is sunny today.",
          arabic: "الطقس مشمس اليوم.",
          words: [
            { word: "sunny", translation: "مشمس", partOfSpeech: "adjective", pronunciation: "/ˈsʌn.i/" }
          ],
          tags: ["weather", "sun"]
        },
        {
          id: "a1-communication-001",
          level: "A1",
          topic: "communication",
          topic_label: "Communication",
          text_en: "Thank you very much.",
          text_ar: "شكرًا جزيلًا.",
          english: "Thank you very much.",
          arabic: "شكرًا جزيلًا.",
          words: [
            { word: "Thank", translation: "يشكر", partOfSpeech: "verb", pronunciation: "/θæŋk/" },
            { word: "very", translation: "جدًا", partOfSpeech: "adverb", pronunciation: "/ˈvɛr.i/" }
          ],
          tags: ["polite", "greeting"]
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
