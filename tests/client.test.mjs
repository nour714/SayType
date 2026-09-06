import assert from 'node:assert';
import { SentenceEngine } from '../client/js/core/SentenceEngine.js';
import { MetricsCalculator } from '../client/js/core/MetricsCalculator.js';
import { SessionEngine } from '../client/js/core/SessionEngine.js';
import { ProgressService } from '../client/js/services/ProgressService.js';
import { DictionaryService } from '../client/js/services/DictionaryService.js';

console.log('--- Testing SentenceEngine ---');
const engine = new SentenceEngine();
const testSentence = { id: 1, text_en: "I am tired.", text_ar: "أنا تعبان.", level: "A1" };
engine.setSentence(testSentence);

assert.strictEqual(engine.currentChar, 'I');
assert.strictEqual(engine.hasPendingError, false);

// Type correct char
const res1 = engine.handleKey('I');
assert.strictEqual(res1.type, 'correct');
assert.strictEqual(engine.charIndex, 1);
assert.strictEqual(engine.hasPendingError, false);

// Type wrong char (should stop-at-error)
const res2 = engine.handleKey('x');
assert.strictEqual(res2.type, 'wrong');
assert.strictEqual(engine.charIndex, 1);
assert.strictEqual(engine.hasPendingError, true);

// Backspace to clear error
const res3 = engine.handleKey('Backspace');
assert.strictEqual(res3.type, 'backspace');
assert.strictEqual(res3.clearedError, true);
assert.strictEqual(engine.hasPendingError, false);
assert.strictEqual(engine.charIndex, 1);

// Type space
engine.handleKey(' ');
assert.strictEqual(engine.charIndex, 2);

// Backspace without error should step back
const res4 = engine.handleKey('Backspace');
assert.strictEqual(res4.type, 'backspace');
assert.strictEqual(res4.clearedError, false);
assert.strictEqual(engine.charIndex, 1);

console.log('✓ SentenceEngine passed!');

console.log('--- Testing MetricsCalculator ---');
const metrics = new MetricsCalculator();
metrics.startIfNeeded();
metrics.recordCorrect();
metrics.recordCorrect();
metrics.recordMistake();
assert.strictEqual(metrics.mistakes, 1);
assert.strictEqual(metrics.correctKeystrokes, 2);
assert.strictEqual(metrics.accuracy, 67);
console.log('✓ MetricsCalculator passed!');

console.log('--- Testing SessionEngine ---');
const engine2 = new SentenceEngine();
const metrics2 = new MetricsCalculator();
const session = new SessionEngine(engine2, metrics2);

let loadedCount = 0;
let completedCount = 0;
let lessonFinished = false;

session.on('sentence:loaded', () => { loadedCount++; });
session.on('sentence:completed', () => { completedCount++; });
session.on('lesson:completed', () => { lessonFinished = true; });

session.setSentences([
  { id: 1, text_en: "Hi.", text_ar: "مرحبا", level: "A1" },
  { id: 2, text_en: "Go.", text_ar: "اذهب", level: "A1" }
]);

assert.strictEqual(loadedCount, 1);
assert.strictEqual(session.currentSentence.text_en, "Hi.");

// Type "Hi."
session.handleKey('H');
session.handleKey('i');
session.handleKey('.');

assert.strictEqual(completedCount, 1);

// Advance
session.advanceToNextSentence();
assert.strictEqual(loadedCount, 2);
assert.strictEqual(session.currentSentence.text_en, "Go.");

// Type "Go."
session.handleKey('G');
session.handleKey('o');
session.handleKey('.');

assert.strictEqual(completedCount, 2);

// Wait for completion timeout
await new Promise(r => setTimeout(r, 550));
assert.strictEqual(lessonFinished, true);

console.log('✓ SessionEngine passed!');

console.log('--- Testing SentenceEngine Free Typing Mode ---');
const freeEngine = new SentenceEngine();
freeEngine.setSentence({ id: 99, text_en: "Sun.", text_ar: "شمس" });
freeEngine.setTypingMode('free');
assert.strictEqual(freeEngine.typingMode, 'free');

// Type wrong char in free mode: advances cursor and records mistake without pending error block
const freeRes1 = freeEngine.handleKey('x');
assert.strictEqual(freeRes1.type, 'wrong');
assert.strictEqual(freeEngine.charIndex, 1);
assert.strictEqual(freeEngine.charMistakes[0], true);
assert.strictEqual(freeEngine.charMistakes.filter(Boolean).length, 1);
assert.strictEqual(freeEngine.hasPendingError, false);

// Backspace in free mode steps back
const freeRes2 = freeEngine.handleKey('Backspace');
assert.strictEqual(freeRes2.type, 'backspace');
assert.strictEqual(freeEngine.charIndex, 0);

// Word helper test
const wordInfo = freeEngine.getWordAt(0);
assert.strictEqual(wordInfo.rawWord, 'Sun.');
assert.strictEqual(wordInfo.word, 'sun');
console.log('✓ SentenceEngine Free Mode passed!');

console.log('--- Testing SessionEngine Listen-First Gating & State Machine ---');
const engineGated = new SentenceEngine();
const metricsGated = new MetricsCalculator();
const sessionGated = new SessionEngine(engineGated, metricsGated, { listenFirst: true });

let listenEventFired = false;
let capturedStateChanges = [];
sessionGated.on('sentence:listen', () => { listenEventFired = true; });
sessionGated.on('state:change', ({ from, to }) => { capturedStateChanges.push({ from, to }); });

sessionGated.setSentences([{ id: 10, text_en: "Hi.", text_ar: "مرحبا" }]);
assert.strictEqual(sessionGated.currentState, 'LOADING_SENTENCE');
assert.strictEqual(sessionGated.isLessonStarted, false);
assert.strictEqual(listenEventFired, false);

// The first user gesture (beginLesson) unlocks listening
sessionGated.beginLesson();
assert.strictEqual(sessionGated.currentState, 'LISTENING');
assert.strictEqual(listenEventFired, true);

// beginLesson is idempotent
sessionGated.beginLesson();
assert.strictEqual(sessionGated.currentState, 'LISTENING');

// During LISTENING, keystrokes are rejected (returns null)
const blockedKey = sessionGated.handleKey('H');
assert.strictEqual(blockedKey, null);
assert.strictEqual(sessionGated.currentState, 'LISTENING');

// When speech finishes:
sessionGated.finishListening();
assert.strictEqual(sessionGated.currentState, 'READY');

// Keystroke in READY transitions to TYPING
const typingKey = sessionGated.handleKey('H');
assert.strictEqual(typingKey.type, 'correct');
assert.strictEqual(sessionGated.currentState, 'TYPING');

// After lesson has started, advancing re-enters LISTENING (no overlay needed)
sessionGated.setSentences([{ id: 10, text_en: "Hi.", text_ar: "مرحبا" }, { id: 11, text_en: "Go.", text_ar: "اذهب" }]);
sessionGated.beginLesson();
sessionGated.finishListening();
sessionGated.handleKey('H');
sessionGated.handleKey('i');
sessionGated.handleKey('.');
sessionGated.advanceToNextSentence();
assert.strictEqual(sessionGated.currentState, 'LISTENING');
assert.strictEqual(sessionGated.isLessonStarted, true);
console.log('✓ SessionEngine Listen-First Gating passed!');

console.log('--- Testing SessionEngine Empty Dataset Handling ---');
const engineEmpty = new SentenceEngine();
const metricsEmpty = new MetricsCalculator();
const sessionEmpty = new SessionEngine(engineEmpty, metricsEmpty);
let emptyLessonCompleted = false;
let emptyLoadedEmitted = false;
sessionEmpty.on('lesson:completed', () => { emptyLessonCompleted = true; });
sessionEmpty.on('sentence:loaded', ({ sentence }) => {
  if (sentence === null) emptyLoadedEmitted = true;
});

// An empty dataset must NOT auto-complete a lesson or fire lesson:completed
sessionEmpty.setSentences([]);
assert.strictEqual(emptyLessonCompleted, false);
assert.strictEqual(emptyLoadedEmitted, true);
assert.strictEqual(sessionEmpty.currentState, 'LOADING_SENTENCE');
assert.strictEqual(sessionEmpty.currentSentence, null);
// Typing against an empty set is a no-op
assert.strictEqual(sessionEmpty.handleKey('H'), null);

// beginLesson with no content is a safe no-op
sessionEmpty.beginLesson();
assert.strictEqual(emptyLessonCompleted, false);
console.log('✓ SessionEngine Empty Dataset passed!');

console.log('--- Testing ProgressService ---');
const progress = new ProgressService('test_saytype_progress');
progress.reset();

// Test recording sentence completion
progress.recordSentenceCompletion({
  sentenceId: 101,
  wpm: 45,
  accuracy: 96,
  mistakes: 2,
  difficultWords: ['coffee']
});

const stats1 = progress.getStats();
assert.strictEqual(stats1.completedSentenceCount, 1);
assert.strictEqual(stats1.bestWpm, 45);
assert.strictEqual(stats1.totalMistakes, 2);

// Test favorites toggle
assert.strictEqual(progress.isFavorite(101), false);
assert.strictEqual(progress.toggleFavorite(101), true);
assert.strictEqual(progress.isFavorite(101), true);
assert.strictEqual(progress.toggleFavorite(101), false);
assert.strictEqual(progress.isFavorite(101), false);

// Test difficult words tracking
progress.recordMistakeOnWord('station');
progress.recordMistakeOnWord('station');
const diffWords = progress.getDifficultWords();
assert.strictEqual(diffWords[0].word, 'station');
assert.strictEqual(diffWords[0].count, 2);
console.log('✓ ProgressService passed!');

console.log('--- Testing DictionaryService ---');
const dictionary = new DictionaryService();

// Sentence embedded word lookup
const mockSentence = {
  text_en: "I like coffee.",
  words: [
    { word: "like", translation: "يحب", pronunciation: "/laɪk/", partOfSpeech: "verb" }
  ]
};
const foundWord = dictionary.lookup('like', mockSentence);
assert.strictEqual(foundWord.word, 'like');
assert.strictEqual(foundWord.translation, 'يحب');
assert.strictEqual(foundWord.partOfSpeech, 'verb');

// Fallback lexicon lookup
const fallbackWord = dictionary.lookup('water');
assert.strictEqual(fallbackWord.translation, 'ماء');

// Punctuation stripping
const punctWord = dictionary.lookup('"tea,');
assert.strictEqual(punctWord.translation, 'شاي');

// Unknown word graceful fallback
const unknownWord = dictionary.lookup('nonexistentwordxyz');
assert.strictEqual(unknownWord.word, 'nonexistentwordxyz');
assert.strictEqual(typeof unknownWord.translation, 'string');
console.log('✓ DictionaryService passed!');

console.log('--- Testing ProgressService Leitner Review State ---');
const progressReview = new ProgressService('test_saytype_leitner');
progressReview.reset();

// Simulate 10 sentences typed, with 'coffee' as a difficult word
for (let i = 0; i < 9; i++) {
  progressReview.recordSentenceCompletion({ sentenceId: 100 + i, wpm: 40, accuracy: 95, mistakes: 0 });
}
progressReview.recordMistakeOnWord('coffee');
progressReview.recordSentenceCompletion({ sentenceId: 110, wpm: 40, accuracy: 90, mistakes: 1 });

// sentencesTypedTotal should be 10
assert.strictEqual(progressReview.getSentencesTypedTotal(), 10);

// 'coffee' should be due for review (box 0, dueAtCount = 0)
let dueWords = progressReview.getDueReviewWords(3);
assert.strictEqual(dueWords.length, 1);
assert.strictEqual(dueWords[0].word, 'coffee');
assert.strictEqual(dueWords[0].box, 0);

// Successful review: advance coffee to box 1
progressReview.recordWordReviewOutcome('coffee', true);
dueWords = progressReview.getDueReviewWords(3);
// Coffee is now box 1, dueAtCount = 10 + 10 = 20, not due yet
assert.strictEqual(dueWords.length, 0);

// Simulate 10 more sentences
for (let i = 0; i < 10; i++) {
  progressReview.recordSentenceCompletion({ sentenceId: 120 + i, wpm: 42, accuracy: 96, mistakes: 0 });
}
assert.strictEqual(progressReview.getSentencesTypedTotal(), 20);

// Now coffee (box 1) should be due
dueWords = progressReview.getDueReviewWords(3);
assert.strictEqual(dueWords.length, 1);
assert.strictEqual(dueWords[0].word, 'coffee');
assert.strictEqual(dueWords[0].box, 1);

// Failed review: reset coffee to box 0
progressReview.recordWordReviewOutcome('coffee', false);
dueWords = progressReview.getDueReviewWords(3);
assert.strictEqual(dueWords.length, 1);
assert.strictEqual(dueWords[0].box, 0);

// Successful review: advance to box 1, then box 2, then box 3, then box 4 (mastered)
progressReview.recordWordReviewOutcome('coffee', true); // box 1
progressReview.markWordInReview('coffee');
// Simulate 20 more sentences for box 1 interval
for (let i = 0; i < 20; i++) {
  progressReview.recordSentenceCompletion({ sentenceId: 140 + i, wpm: 43, accuracy: 97, mistakes: 0 });
}
dueWords = progressReview.getDueReviewWords(3);
assert.strictEqual(dueWords.length, 1);
assert.strictEqual(dueWords[0].box, 1);
progressReview.recordWordReviewOutcome('coffee', true); // box 2
progressReview.recordWordReviewOutcome('coffee', true); // box 3
progressReview.recordWordReviewOutcome('coffee', true); // box 4 (mastered)
dueWords = progressReview.getDueReviewWords(3);
assert.strictEqual(dueWords.length, 0); // mastered, never due again

console.log('✓ ProgressService Leitner Review State passed!');

console.log('--- Testing ReviewScheduler ---');
import { ReviewScheduler } from '../client/js/services/ReviewScheduler.js';
const scheduler = new ReviewScheduler();

const mockSentences = [
  { id: 1, text_en: "I drink coffee.", words: [{ word: "coffee" }, { word: "drink" }] },
  { id: 2, text_en: "She buys a book.", words: [{ word: "book" }, { word: "buys" }] },
  { id: 3, text_en: "We need more coffee.", words: [{ word: "coffee" }, { word: "more" }] },
];

const due = [{ word: 'coffee', box: 0 }];
const round = scheduler.buildReviewRound(mockSentences, due);
assert.strictEqual(round.length, 1);
assert.strictEqual(round[0].isReview, true);
assert.strictEqual(round[0].reviewWord, 'coffee');
assert.strictEqual([1, 3].includes(round[0].id), true);

// Empty inputs
assert.strictEqual(scheduler.buildReviewRound([], due).length, 0);
assert.strictEqual(scheduler.buildReviewRound(mockSentences, []).length, 0);

// No matching sentences
const noMatch = scheduler.buildReviewRound(mockSentences, [{ word: 'xyz', box: 0 }]);
assert.strictEqual(noMatch.length, 0);

console.log('✓ ReviewScheduler passed!');

console.log('--- Testing SessionEngine.insertUpcoming ---');
const engineUp = new SentenceEngine();
const metricsUp = new MetricsCalculator();
const sessionUp = new SessionEngine(engineUp, metricsUp);
sessionUp.setSentences([
  { id: 1, text_en: "Hi.", text_ar: "مرحبا" },
  { id: 2, text_en: "Go.", text_ar: "اذهب" },
]);
assert.strictEqual(sessionUp.sentences.length, 2);

sessionUp.insertUpcoming([
  { id: 99, text_en: "Review me.", text_ar: "راجعني", isReview: true, reviewWord: 'hi' }
]);
assert.strictEqual(sessionUp.sentences.length, 3);
assert.strictEqual(sessionUp.sentences[1].id, 99);
assert.strictEqual(sessionUp.sentences[1].isReview, true);

// insertUpcoming with empty array is a no-op
sessionUp.insertUpcoming([]);
assert.strictEqual(sessionUp.sentences.length, 3);

console.log('✓ SessionEngine.insertUpcoming passed!');

console.log('ALL CLIENT CORE UNIT TESTS PASSED SUCCESSFULLY! 🎉');
process.exit(0);
