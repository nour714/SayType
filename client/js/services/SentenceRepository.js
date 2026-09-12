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
    if (filter.topic && filter.topic !== 'all')
      params.append('topic', filter.topic);

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
      console.warn(
        'SentenceRepository: API fetch failed, checking static dataset fallback...',
        err
      );
      const staticData = await this._loadStaticDataset();
      if (staticData && staticData.length > 0) {
        let data = staticData;
        if (filter.level) {
          data = data.filter(
            (s) => s.level && s.level.toLowerCase() === filter.level.toLowerCase()
          );
        }
        if (filter.topic && filter.topic !== 'all') {
          data = data.filter(
            (s) => s.topic && s.topic.toLowerCase() === filter.topic.toLowerCase()
          );
        }
        this._cache = staticData;
        return data;
      }
      return this._getFallbackSentences(filter);
    }
  }

  /**
   * Load static JSON datasets when API is unreachable.
   * @private
   */
  async _loadStaticDataset() {
    if (this._staticCache && this._staticCache.length > 0) {
      return this._staticCache;
    }
    const all = [];
    const files = ['data/sentences.a1.json', 'data/sentences.a2.json'];
    for (const f of files) {
      try {
        const res = await fetch(f);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) all.push(...list);
        }
      } catch (_) {}
    }
    if (all.length === 0) {
      for (const f of ['/data/sentences.a1.json', '/data/sentences.a2.json']) {
        try {
          const res = await fetch(f);
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list)) all.push(...list);
          }
        } catch (_) {}
      }
    }
    if (all.length > 0) {
      this._staticCache = all;
      return all;
    }
    return null;
  }

  /**
   * Fetch available topics from backend, optionally filtered by level.
   * @param {string} [level]
   * @returns {Promise<Array<{ id: string, label: string, count: number }>>}
   */
  async getTopics(level) {
    try {
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`${this.baseUrl}/topics${queryString}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn(
        'SentenceRepository: getTopics fetch failed, using fallback topics.',
        err
      );
      const allTopics = [
        { id: 'greetings', label: 'Greetings & Introductions', level: 'A1', count: 50 },
        { id: 'daily-life', label: 'Daily Life & Routine', level: 'A1', count: 50 },
        { id: 'work-study', label: 'Study & Work', level: 'A1', count: 50 },
        { id: 'shopping-food', label: 'Shopping & Food', level: 'A1', count: 50 },
        { id: 'travel', label: 'Travel & Transport', level: 'A1', count: 50 },
        { id: 'feelings-opinions', label: 'Feelings & Opinions', level: 'A2', count: 50 },
        { id: 'health', label: 'Health & Help', level: 'A2', count: 50 },
        { id: 'technology', label: 'Technology & Internet', level: 'A2', count: 50 },
        { id: 'plans-conversations', label: 'Plans & Conversations', level: 'A2', count: 50 },
        { id: 'general', label: 'General Essentials', level: 'A2', count: 50 }
      ];
      if (level) {
        return allTopics.filter(
          (t) => t.level.toLowerCase() === level.toLowerCase()
        );
      }
      return allTopics;
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
      console.warn(
        `SentenceRepository: Failed to fetch sentence ${id}, checking cache.`,
        err
      );
      const all = await this.getSentences();
      return all.find((s) => String(s.id) === String(id)) || null;
    }
  }

  /**
   * Offline fallback dataset with word-level metadata.
   * A representative sentence for each of the 10 V1 topics.
   * @private
   */
  _getFallbackSentences(filter = {}) {
    let data = [
      {
        id: 'a1-greetings-001',
        level: 'A1',
        topic: 'greetings',
        topic_label: 'Greetings & Introductions',
        text_en: 'Hello!',
        text_ar: 'مرحبًا!',
        english: 'Hello!',
        arabic: 'مرحبًا!',
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
        text_en: 'I usually wake up at seven.',
        text_ar: 'عادةً أستيقظ في السابعة.',
        english: 'I usually wake up at seven.',
        arabic: 'عادةً أستيقظ في السابعة.',
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
        text_en: 'I study at the university.',
        text_ar: 'أنا أدرس في الجامعة.',
        english: 'I study at the university.',
        arabic: 'أنا أدرس في الجامعة.',
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
      },
      {
        id: 'a1-shopping-food-001',
        level: 'A1',
        topic: 'shopping-food',
        topic_label: 'Shopping & Food',
        text_en: 'How much is this?',
        text_ar: 'بكم هذا؟',
        english: 'How much is this?',
        arabic: 'بكم هذا؟',
        words: [
          {
            word: 'how',
            translation: 'كيف',
            partOfSpeech: 'question word',
            pronunciation: '/haʊ/'
          },
          {
            word: 'this',
            translation: 'هذا / هذه',
            partOfSpeech: 'pronoun',
            pronunciation: '/ðɪs/'
          }
        ],
        tags: ['shopping', 'food']
      },
      {
        id: 'a1-travel-001',
        level: 'A1',
        topic: 'travel',
        topic_label: 'Travel & Transport',
        text_en: 'Where is the train station?',
        text_ar: 'أين محطة القطار؟',
        english: 'Where is the train station?',
        arabic: 'أين محطة القطار؟',
        words: [
          {
            word: 'where',
            translation: 'أين',
            partOfSpeech: 'question word',
            pronunciation: '/wɛər/'
          },
          {
            word: 'station',
            translation: 'محطة',
            partOfSpeech: 'noun',
            pronunciation: '/ˈsteɪ.ʃən/'
          }
        ],
        tags: ['travel', 'transport']
      },
      {
        id: 'a2-feelings-opinions-001',
        level: 'A2',
        topic: 'feelings-opinions',
        topic_label: 'Feelings & Opinions',
        text_en: 'I am happy today.',
        text_ar: 'أنا سعيد اليوم.',
        english: 'I am happy today.',
        arabic: 'أنا سعيد اليوم.',
        words: [
          {
            word: 'happy',
            translation: 'سعيد',
            partOfSpeech: 'adjective',
            pronunciation: '/ˈhæp.i/'
          },
          {
            word: 'today',
            translation: 'اليوم',
            partOfSpeech: 'adverb',
            pronunciation: '/təˈdeɪ/'
          }
        ],
        tags: ['feelings', 'opinions']
      },
      {
        id: 'a2-health-001',
        level: 'A2',
        topic: 'health',
        topic_label: 'Health & Help',
        text_en: 'I feel sick.',
        text_ar: 'أشعر بالمرض.',
        english: 'I feel sick.',
        arabic: 'أشعر بالمرض.',
        words: [
          {
            word: 'feel',
            translation: 'يشعر',
            partOfSpeech: 'verb',
            pronunciation: '/fiːl/'
          },
          {
            word: 'sick',
            translation: 'مريض',
            partOfSpeech: 'adjective',
            pronunciation: '/sɪk/'
          }
        ],
        tags: ['health', 'help']
      },
      {
        id: 'a2-technology-001',
        level: 'A2',
        topic: 'technology',
        topic_label: 'Technology & Internet',
        text_en: 'Where is my phone?',
        text_ar: 'أين هاتفي؟',
        english: 'Where is my phone?',
        arabic: 'أين هاتفي؟',
        words: [
          {
            word: 'phone',
            translation: 'هاتف',
            partOfSpeech: 'noun',
            pronunciation: '/foʊn/'
          }
        ],
        tags: ['technology', 'internet']
      },
      {
        id: 'a2-plans-conversations-001',
        level: 'A2',
        topic: 'plans-conversations',
        topic_label: 'Plans & Conversations',
        text_en: 'What are your plans for tomorrow?',
        text_ar: 'ما هي خططك للغد؟',
        english: 'What are your plans for tomorrow?',
        arabic: 'ما هي خططك للغد؟',
        words: [
          {
            word: 'tomorrow',
            translation: 'غدًا',
            partOfSpeech: 'adverb',
            pronunciation: '/təˈmɔːr.oʊ/'
          }
        ],
        tags: ['plans', 'conversations']
      },
      {
        id: 'a2-general-001',
        level: 'A2',
        topic: 'general',
        topic_label: 'General Essentials',
        text_en: 'Everything will be fine.',
        text_ar: 'كل شيء سيكون على ما يرام.',
        english: 'Everything will be fine.',
        arabic: 'كل شيء سيكون على ما يرام.',
        words: [
          {
            word: 'fine',
            translation: 'بخير / جيد',
            partOfSpeech: 'adjective',
            pronunciation: '/faɪn/'
          }
        ],
        tags: ['general', 'essentials']
      }
    ];

    if (filter.level) {
      data = data.filter(
        (s) => s.level && s.level.toLowerCase() === filter.level.toLowerCase()
      );
    }
    if (filter.topic && filter.topic !== 'all') {
      data = data.filter(
        (s) => s.topic && s.topic.toLowerCase() === filter.topic.toLowerCase()
      );
    }
    return data;
  }
}
