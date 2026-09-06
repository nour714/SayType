/**
 * SentenceRepository — Client Data Access Layer.
 * Fetches sentences from the Express REST API (/api/sentences).
 * Provides offline fallback if API is unreachable.
 */
export class SentenceRepository {
  constructor(baseUrl = '/api/sentences') {
    this.baseUrl = baseUrl;
    this._cache = null;
  }

  /**
   * Fetch sentences with optional filtering by level and topic.
   * @param {object} [filter]
   * @param {string} [filter.level]
   * @param {string} [filter.topic]
   * @returns {Promise<Array>}
   */
  async getSentences(filter = {}) {
    const params = new URLSearchParams();
    if (filter.level) params.append('level', filter.level);
    if (filter.topic && filter.topic !== 'all') params.append('topic', filter.topic);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const url = `${this.baseUrl}${queryString}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      this._cache = data;
      return data;
    } catch (err) {
      console.warn('SentenceRepository: API fetch failed, falling back to local dataset.', err);
      return this._getFallbackSentences(filter);
    }
  }

  /**
   * Fetch available topics from backend.
   * @returns {Promise<Array<{ id: string, label: string, count: number }>>}
   */
  async getTopics() {
    try {
      const response = await fetch(`${this.baseUrl}/topics`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn('SentenceRepository: getTopics fetch failed, using fallback topics.', err);
      return [
        { id: 'all', label: 'All Topics', count: 28 },
        { id: 'daily-life', label: 'Daily Life', count: 7 },
        { id: 'family', label: 'Family & Friends', count: 4 },
        { id: 'food', label: 'Food & Drink', count: 4 },
        { id: 'travel', label: 'Travel & Places', count: 4 },
        { id: 'university', label: 'University & Study', count: 4 },
        { id: 'work', label: 'Work & Career', count: 4 },
        { id: 'shopping', label: 'Shopping & Numbers', count: 4 }
      ];
    }
  }

  /**
   * Fetch a single sentence by ID.
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  async getSentenceById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.warn(`SentenceRepository: Failed to fetch sentence ${id}, checking cache.`, err);
      const all = await this.getSentences();
      return all.find((s) => String(s.id) === String(id)) || null;
    }
  }

  /**
   * Offline fallback dataset with word-level metadata.
   * @private
   */
  _getFallbackSentences(filter = {}) {
    let data = [
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
        topic: "travel",
        topic_label: "Travel & Places",
        text_en: "The airport is far from here.",
        text_ar: "المطار بعيد عن هنا.",
        english: "The airport is far from here.",
        arabic: "المطار بعيد عن هنا.",
        words: [
          { word: "airport", translation: "مطار", partOfSpeech: "noun", pronunciation: "/ˈɛərpɔːrt/" },
          { word: "far", translation: "بعيد", partOfSpeech: "adjective", pronunciation: "/fɑːr/" }
        ]
      },
      {
        id: 7,
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
        ]
      }
    ];

    if (filter.level) {
      data = data.filter((s) => s.level && s.level.toLowerCase() === filter.level.toLowerCase());
    }
    if (filter.topic && filter.topic !== 'all') {
      data = data.filter((s) => s.topic && s.topic.toLowerCase() === filter.topic.toLowerCase());
    }
    return data;
  }
}
