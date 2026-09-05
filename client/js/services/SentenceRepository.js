/**
 * SentenceRepository — handles fetching sentences from the backend API or local JSON.
 * Follows the repository pattern: client UI only interacts with this interface,
 * abstracting away whether the data source is REST API, static JSON, or local cache.
 */
export class SentenceRepository {
  constructor(apiEndpoint = '/api/sentences') {
    this.apiEndpoint = apiEndpoint;
    this.fallbackSentences = [
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

  /**
   * Fetch sentence collection.
   * Tries API first -> JSON file fallback -> in-memory fallback.
   * @returns {Promise<Array<{ id: number, text_en: string, text_ar: string, level: string }>>}
   */
  async getSentences() {
    // 1. Try REST API endpoint
    try {
      const response = await fetch(this.apiEndpoint);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.info('API route unavailable, trying static JSON fallback:', err.message);
    }

    // 2. Try static JSON endpoint
    try {
      const response = await fetch('/data/sentences.a1.json');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.info('Static JSON unavailable, falling back to bundled dataset:', err.message);
    }

    // 3. Bundled in-memory fallback
    return this.fallbackSentences;
  }
}
