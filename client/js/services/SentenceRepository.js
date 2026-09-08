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
        'SentenceRepository: API fetch failed, falling back to local dataset.',
        err
      );
      return this._getFallbackSentences(filter);
    }
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
      return [
        { id: 'daily-life', label: 'Daily Life', count: 20 },
        { id: 'family', label: 'Family & Friends', count: 16 },
        { id: 'food', label: 'Food & Drink', count: 17 },
        { id: 'travel', label: 'Travel & Places', count: 16 },
        { id: 'university', label: 'University & Study', count: 16 },
        { id: 'work', label: 'Work & Career', count: 16 },
        { id: 'shopping', label: 'Shopping & Numbers', count: 14 },
        { id: 'health', label: 'Health & Body', count: 14 },
        { id: 'weather', label: 'Weather & Seasons', count: 10 },
        { id: 'communication', label: 'Communication', count: 15 }
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
      },
      {
        id: 'a1-travel-001',
        level: 'A1',
        topic: 'travel',
        topic_label: 'Travel & Places',
        text_en: 'The airport is far from here.',
        text_ar: 'المطار بعيد عن هنا.',
        english: 'The airport is far from here.',
        arabic: 'المطار بعيد عن هنا.',
        words: [
          {
            word: 'airport',
            translation: 'مطار',
            partOfSpeech: 'noun',
            pronunciation: '/ˈɛər.pɔːrt/'
          },
          {
            word: 'far',
            translation: 'بعيد',
            partOfSpeech: 'adjective',
            pronunciation: '/fɑːr/'
          }
        ],
        tags: ['travel', 'locations']
      },
      {
        id: 'a1-university-001',
        level: 'A1',
        topic: 'university',
        topic_label: 'University & Study',
        text_en: 'I study English at university.',
        text_ar: 'أدرس اللغة الإنجليزية في الجامعة.',
        english: 'I study English at university.',
        arabic: 'أدرس اللغة الإنجليزية في الجامعة.',
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
        tags: ['study', 'subject']
      },
      {
        id: 'a1-work-001',
        level: 'A1',
        topic: 'work',
        topic_label: 'Work & Career',
        text_en: 'He works in an office.',
        text_ar: 'يعمل في مكتب.',
        english: 'He works in an office.',
        arabic: 'يعمل في مكتب.',
        words: [
          {
            word: 'works',
            translation: 'يعمل',
            partOfSpeech: 'verb',
            pronunciation: '/wɜːrks/'
          },
          {
            word: 'office',
            translation: 'مكتب',
            partOfSpeech: 'noun',
            pronunciation: '/ˈɔː.fɪs/'
          }
        ],
        tags: ['job', 'office']
      },
      {
        id: 'a1-shopping-001',
        level: 'A1',
        topic: 'shopping',
        topic_label: 'Shopping & Numbers',
        text_en: 'I want to pay with cash.',
        text_ar: 'أريد أن أدفع نقدًا.',
        english: 'I want to pay with cash.',
        arabic: 'أريد أن أدفع نقدًا.',
        words: [
          {
            word: 'pay',
            translation: 'يدفع',
            partOfSpeech: 'verb',
            pronunciation: '/peɪ/'
          },
          {
            word: 'cash',
            translation: 'نقد',
            partOfSpeech: 'noun',
            pronunciation: '/kæʃ/'
          }
        ],
        tags: ['shopping', 'payment']
      },
      {
        id: 'a1-health-001',
        level: 'A1',
        topic: 'health',
        topic_label: 'Health & Body',
        text_en: 'I walk thirty minutes every day.',
        text_ar: 'أمشي ثلاثين دقيقة كل يوم.',
        english: 'I walk thirty minutes every day.',
        arabic: 'أمشي ثلاثين دقيقة كل يوم.',
        words: [
          {
            word: 'walk',
            translation: 'يمشي',
            partOfSpeech: 'verb',
            pronunciation: '/wɔːk/'
          },
          {
            word: 'thirty',
            translation: 'ثلاثون',
            partOfSpeech: 'number',
            pronunciation: '/ˈθɜːr.ti/'
          }
        ],
        tags: ['exercise', 'health']
      },
      {
        id: 'a1-weather-001',
        level: 'A1',
        topic: 'weather',
        topic_label: 'Weather & Seasons',
        text_en: 'It is sunny today.',
        text_ar: 'الطقس مشمس اليوم.',
        english: 'It is sunny today.',
        arabic: 'الطقس مشمس اليوم.',
        words: [
          {
            word: 'sunny',
            translation: 'مشمس',
            partOfSpeech: 'adjective',
            pronunciation: '/ˈsʌn.i/'
          }
        ],
        tags: ['weather', 'sun']
      },
      {
        id: 'a1-communication-001',
        level: 'A1',
        topic: 'communication',
        topic_label: 'Communication',
        text_en: 'Thank you very much.',
        text_ar: 'شكرًا جزيلًا.',
        english: 'Thank you very much.',
        arabic: 'شكرًا جزيلًا.',
        words: [
          {
            word: 'Thank',
            translation: 'يشكر',
            partOfSpeech: 'verb',
            pronunciation: '/θæŋk/'
          },
          {
            word: 'very',
            translation: 'جدًا',
            partOfSpeech: 'adverb',
            pronunciation: '/ˈvɛr.i/'
          }
        ],
        tags: ['polite', 'greeting']
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
