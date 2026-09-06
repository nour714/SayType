/**
 * ReviewScheduler — picks concrete sentences for spaced review rounds.
 * Pure logic, no DOM, no localStorage.
 */
export class ReviewScheduler {
  /**
   * Build a review round by matching due words to real sentences.
   * @param {Array} allSentences - full flat pool of every sentence (all topics)
   * @param {Array<{word: string, box: number}>} dueWords - words due for review
   * @returns {Array} sentence objects, cloned and tagged with isReview/reviewWord
   */
  buildReviewRound(allSentences, dueWords) {
    if (!Array.isArray(allSentences) || allSentences.length === 0) return [];
    if (!Array.isArray(dueWords) || dueWords.length === 0) return [];

    const reviewSentences = [];

    for (const { word } of dueWords) {
      // Find all sentences containing this word
      const candidates = allSentences.filter((sentence) => {
        if (!sentence.words || !Array.isArray(sentence.words)) return false;
        return sentence.words.some(
          (w) => w.word && w.word.toLowerCase() === word.toLowerCase()
        );
      });

      if (candidates.length === 0) continue; // Skip if no sentence found

      // Pick one at random for variety
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];

      // Shallow clone with review tags (don't mutate original)
      reviewSentences.push({
        ...chosen,
        isReview: true,
        reviewWord: word
      });
    }

    return reviewSentences;
  }
}
