/**
 * DictionaryService — provides static word lookup for educational hover/tap popovers.
 * Operates completely offline with zero external API dependencies.
 * Queries sentence-level embedded words first, falling back to a foundational A1 lexicon.
 */
export class DictionaryService {
  constructor() {
    /**
     * Common A1 English vocabulary lexicon for fallback lookup.
     * @type {Record<string, { translation: string, pronunciation: string, partOfSpeech: string }>}
     */
    this.fallbackLexicon = {
      i: { translation: "أنا", pronunciation: "/aɪ/", partOfSpeech: "pronoun" },
      you: { translation: "أنتَ / أنتِ", pronunciation: "/juː/", partOfSpeech: "pronoun" },
      he: { translation: "هو", pronunciation: "/hiː/", partOfSpeech: "pronoun" },
      she: { translation: "هي", pronunciation: "/ʃiː/", partOfSpeech: "pronoun" },
      we: { translation: "نحن", pronunciation: "/wiː/", partOfSpeech: "pronoun" },
      they: { translation: "هم / هن", pronunciation: "/ðeɪ/", partOfSpeech: "pronoun" },
      this: { translation: "هذا / هذه", pronunciation: "/ðɪs/", partOfSpeech: "pronoun" },
      that: { translation: "ذلك / تلك", pronunciation: "/ðæt/", partOfSpeech: "pronoun" },
      my: { translation: "لي (ياء الملكية)", pronunciation: "/maɪ/", partOfSpeech: "determiner" },
      your: { translation: "لك (كاف الملكية)", pronunciation: "/jɔːr/", partOfSpeech: "determiner" },
      his: { translation: "له", pronunciation: "/hɪz/", partOfSpeech: "determiner" },
      her: { translation: "لها", pronunciation: "/hɜːr/", partOfSpeech: "determiner" },
      our: { translation: "لنا (نا الفاعلين)", pronunciation: "/aʊər/", partOfSpeech: "determiner" },
      am: { translation: "أكون", pronunciation: "/æm/", partOfSpeech: "verb" },
      is: { translation: "يكون / تكون", pronunciation: "/ɪz/", partOfSpeech: "verb" },
      are: { translation: "يكونون", pronunciation: "/ɑːr/", partOfSpeech: "verb" },
      tired: { translation: "متعب / مرهق", pronunciation: "/ˈtaɪərd/", partOfSpeech: "adjective" },
      like: { translation: "يحب / يفضل", pronunciation: "/laɪk/", partOfSpeech: "verb" },
      coffee: { translation: "قهوة", pronunciation: "/ˈkɔːfi/", partOfSpeech: "noun" },
      tea: { translation: "شاي", pronunciation: "/tiː/", partOfSpeech: "noun" },
      water: { translation: "ماء", pronunciation: "/ˈwɔːtər/", partOfSpeech: "noun" },
      sister: { translation: "أخت", pronunciation: "/ˈsɪstər/", partOfSpeech: "noun" },
      brother: { translation: "أخ", pronunciation: "/ˈbrʌðər/", partOfSpeech: "noun" },
      brothers: { translation: "إخوة", pronunciation: "/ˈbrʌðərz/", partOfSpeech: "noun" },
      parents: { translation: "الوالدان", pronunciation: "/ˈpɛrənts/", partOfSpeech: "noun" },
      grandfather: { translation: "جد", pronunciation: "/ˈɡrændˌfɑːðər/", partOfSpeech: "noun" },
      grandmother: { translation: "جدة", pronunciation: "/ˈɡrændˌmʌðər/", partOfSpeech: "noun" },
      school: { translation: "مدرسة", pronunciation: "/skuːl/", partOfSpeech: "noun" },
      university: { translation: "جامعة", pronunciation: "/ˌjuːnɪˈvɜːrsəti/", partOfSpeech: "noun" },
      house: { translation: "منزل / بيت", pronunciation: "/haʊs/", partOfSpeech: "noun" },
      home: { translation: "بيت / وطن", pronunciation: "/hoʊm/", partOfSpeech: "noun" },
      lunch: { translation: "وجبة الغداء", pronunciation: "/lʌntʃ/", partOfSpeech: "noun" },
      dinner: { translation: "وجبة العشاء", pronunciation: "/ˈdɪnər/", partOfSpeech: "noun" },
      breakfast: { translation: "وجبة الإفطار", pronunciation: "/ˈbrɛkfəst/", partOfSpeech: "noun" },
      bread: { translation: "خبز", pronunciation: "/brɛd/", partOfSpeech: "noun" },
      cheese: { translation: "جبن", pronunciation: "/tʃiːz/", partOfSpeech: "noun" },
      office: { translation: "مكتب عمل", pronunciation: "/ˈɔːfɪs/", partOfSpeech: "noun" },
      job: { translation: "وظيفة / عمل", pronunciation: "/dʒɒb/", partOfSpeech: "noun" },
      work: { translation: "عمل / يشتغل", pronunciation: "/wɜːrk/", partOfSpeech: "noun / verb" },
      works: { translation: "يعمل", pronunciation: "/wɜːrks/", partOfSpeech: "verb" },
      morning: { translation: "صباح", pronunciation: "/ˈmɔːrnɪŋ/", partOfSpeech: "noun" },
      night: { translation: "ليل", pronunciation: "/naɪt/", partOfSpeech: "noun" },
      tonight: { translation: "الليلة", pronunciation: "/təˈnaɪt/", partOfSpeech: "adverb" },
      every: { translation: "كل", pronunciation: "/ˈɛvri/", partOfSpeech: "determiner" },
      day: { translation: "يوم", pronunciation: "/deɪ/", partOfSpeech: "noun" },
      thank: { translation: "يشكر", pronunciation: "/θæŋk/", partOfSpeech: "verb" },
      very: { translation: "جدًا", pronunciation: "/ˈvɛri/", partOfSpeech: "adverb" },
      much: { translation: "كثيرًا / كم", pronunciation: "/mʌtʃ/", partOfSpeech: "adverb" },
      wake: { translation: "يستيقظ", pronunciation: "/weɪk/", partOfSpeech: "verb" },
      book: { translation: "كتاب", pronunciation: "/bʊk/", partOfSpeech: "noun" },
      bed: { translation: "سرير / نوم", pronunciation: "/bɛd/", partOfSpeech: "noun" },
      reads: { translation: "تقرأ / يقرأ", pronunciation: "/riːdz/", partOfSpeech: "verb" },
      green: { translation: "أخضر", pronunciation: "/ɡriːn/", partOfSpeech: "adjective" },
      fresh: { translation: "طازج", pronunciation: "/frɛʃ/", partOfSpeech: "adjective" },
      train: { translation: "قطار", pronunciation: "/treɪn/", partOfSpeech: "noun" },
      station: { translation: "محطة", pronunciation: "/ˈsteɪʃən/", partOfSpeech: "noun" },
      airport: { translation: "مطار", pronunciation: "/ˈɛərpɔːrt/", partOfSpeech: "noun" },
      far: { translation: "بعيد", pronunciation: "/fɑːr/", partOfSpeech: "adjective" },
      library: { translation: "مكتبة للقراءة", pronunciation: "/ˈlaɪbrɛri/", partOfSpeech: "noun" },
      quiet: { translation: "هادئ", pronunciation: "/ˈkwaɪət/", partOfSpeech: "adjective" },
      studies: { translation: "يدرس / تدرس", pronunciation: "/ˈstʌdiz/", partOfSpeech: "verb" },
      english: { translation: "اللغة الإنجليزية", pronunciation: "/ˈɪŋɡlɪʃ/", partOfSpeech: "noun" },
      literature: { translation: "أدب", pronunciation: "/ˈlɪtərətʃər/", partOfSpeech: "noun" },
      supermarket: { translation: "سوبرماركت", pronunciation: "/ˈsuːpərˌmɑːrkɪt/", partOfSpeech: "noun" },
      shirt: { translation: "قميص", pronunciation: "/ʃɜːrt/", partOfSpeech: "noun" },
      cost: { translation: "يكلف / سعر", pronunciation: "/kɒst/", partOfSpeech: "verb / noun" },
      cash: { translation: "نقد / كاش", pronunciation: "/kæʃ/", partOfSpeech: "noun" },
      beach: { translation: "شاطئ", pronunciation: "/biːtʃ/", partOfSpeech: "noun" },
      hotel: { translation: "فندق", pronunciation: "/hoʊˈtɛl/", partOfSpeech: "noun" },
      stories: { translation: "قصص", pronunciation: "/ˈstɔːriz/", partOfSpeech: "noun" },
      wonderful: { translation: "رائع / بديع", pronunciation: "/ˈwʌndərfəl/", partOfSpeech: "adjective" }
    };
  }

  /**
   * Look up lexical information for an English word.
   * @param {string} rawWord - Word clicked or hovered
   * @param {object} [sentence] - Currently active sentence entity
   * @returns {{
   *   word: string,
   *   translation: string,
   *   pronunciation: string,
   *   partOfSpeech: string
   * } | null}
   */
  lookup(rawWord, sentence = null) {
    if (!rawWord || typeof rawWord !== 'string') return null;

    const cleanWord = rawWord.replace(/^[^\w]+|[^\w]+$/g, '').trim();
    if (!cleanWord) return null;

    const lower = cleanWord.toLowerCase();

    // 1. Check sentence embedded words array first
    if (sentence && Array.isArray(sentence.words)) {
      const found = sentence.words.find(
        (w) => w.word && w.word.toLowerCase() === lower
      );
      if (found) {
        return {
          word: cleanWord,
          translation: found.translation || '',
          pronunciation: found.pronunciation || `/${lower}/`,
          partOfSpeech: found.partOfSpeech || 'word'
        };
      }
    }

    // 2. Check fallback lexicon
    if (this.fallbackLexicon[lower]) {
      const entry = this.fallbackLexicon[lower];
      return {
        word: cleanWord,
        translation: entry.translation,
        pronunciation: entry.pronunciation,
        partOfSpeech: entry.partOfSpeech
      };
    }

    // 3. Graceful fallback for unknown word
    return {
      word: cleanWord,
      translation: 'كلمة إنجليزية',
      pronunciation: `/${lower}/`,
      partOfSpeech: 'vocabulary'
    };
  }
}
