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

console.log('--- Testing ProgressService.replaceAll ---');
const progressReplace = new ProgressService('test_saytype_replaceall');
progressReplace.reset();

// Put some local state in
progressReplace.recordSentenceCompletion({ sentenceId: 1, wpm: 50, accuracy: 95, mistakes: 1 });
progressReplace.recordMistakeOnWord('hello');
assert.strictEqual(progressReplace.getStats().completedSentenceCount, 1);

// Simulate pulling server state (server wins)
const serverData = {
  completedSentenceIds: ['10', '11', '12'],
  completedCount: 3,
  bestWpm: 80,
  averageWpm: 75,
  averageAccuracy: 98,
  totalMistakes: 5,
  totalSessions: 10,
  lastSessionDate: '2026-01-15T10:00:00.000Z',
  favorites: ['10', '12'],
  difficultWords: { 'world': 3 },
  sentencesTypedTotal: 30,
  wordReview: { 'world': { box: 1, dueAtCount: 40 } }
};
progressReplace.replaceAll(serverData);

const statsAfter = progressReplace.getStats();
assert.strictEqual(statsAfter.completedSentenceCount, 3);
assert.strictEqual(statsAfter.bestWpm, 80);
assert.strictEqual(statsAfter.favoritesCount, 2);
assert.strictEqual(progressReplace.getSentencesTypedTotal(), 30);
assert.strictEqual(progressReplace.isFavorite('10'), true);
assert.strictEqual(progressReplace.isFavorite('12'), true);
assert.strictEqual(progressReplace.isFavorite('1'), false);

// replaceAll merges onto defaults — missing fields should still work
const partialData = { completedSentenceIds: ['5'], bestWpm: 40 };
progressReplace.replaceAll(partialData);
assert.strictEqual(progressReplace.getStats().completedSentenceCount, 1);
assert.strictEqual(progressReplace.getStats().bestWpm, 40);
assert.strictEqual(progressReplace.getStats().averageAccuracy, 100); // default value
assert.strictEqual(progressReplace.getDifficultWords().length, 0); // default value

console.log('✓ ProgressService.replaceAll passed!');

console.log('--- Testing SyncService migration vs server-wins branching ---');
import { SyncService } from '../client/js/services/SyncService.js';

// Mock AuthService
function createMockAuthService(userId, clientStub) {
  const listeners = {};
  const mockAuth = {
    _userId: userId,
    get isAuthenticated() { return !!this._userId; },
    get userId() { return this._userId; },
    get email() { return userId ? `${userId}@test.com` : null; },
    getClient() { return clientStub; },
    on(event, fn) { (listeners[event] || (listeners[event] = [])).push(fn); },
    emit(event, payload) { (listeners[event] || []).forEach(fn => fn(payload)); }
  };
  return mockAuth;
}

// Case 1: First-ever login — no server row → local data uploaded
{
  let upsertPayload = null;
  const mockClient = {
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() { return { data: null, error: null }; },
        async upsert(payload) { upsertPayload = payload; return { error: null }; }
      };
    }
  };
  const mockAuth = createMockAuthService('user-1', mockClient);
  const ps = new ProgressService('test_sync_migration');
  ps.reset();
  ps.recordSentenceCompletion({ sentenceId: 42, wpm: 60, accuracy: 90, mistakes: 2 });
  const beforeData = { ...ps.data };

  const sync = new SyncService(ps, mockAuth);
  sync.init();

  // Simulate sign-in event
  mockAuth.emit('auth:signedIn', { userId: 'user-1' });

  // Wait for async sync
  await new Promise(r => setTimeout(r, 50));

  assert.ok(upsertPayload, 'upsert should have been called');
  assert.strictEqual(upsertPayload.user_id, 'user-1');
  assert.deepStrictEqual(upsertPayload.data.completedSentenceIds, beforeData.completedSentenceIds);
  assert.strictEqual(upsertPayload.data.bestWpm, beforeData.bestWpm);
  // Local state should be preserved (not overwritten)
  assert.strictEqual(ps.getStats().completedSentenceCount, 1);
}

// Case 2: Returning device — server row exists → server wins
{
  const serverProgressData = {
    completedSentenceIds: ['100', '200'],
    completedCount: 2,
    bestWpm: 90,
    averageWpm: 85,
    averageAccuracy: 99,
    totalMistakes: 0,
    totalSessions: 5,
    lastSessionDate: '2026-06-01T00:00:00.000Z',
    favorites: ['100'],
    difficultWords: {},
    sentencesTypedTotal: 50,
    wordReview: {}
  };
  const mockClient = {
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() { return { data: { data: serverProgressData, updated_at: '2026-06-01' }, error: null }; },
        async upsert() { return { error: null }; }
      };
    }
  };
  const mockAuth = createMockAuthService('user-2', mockClient);
  const ps = new ProgressService('test_sync_serverwins');
  ps.reset();
  // Put some local guest data that should be overwritten
  ps.recordSentenceCompletion({ sentenceId: 999, wpm: 30, accuracy: 70, mistakes: 10 });
  assert.strictEqual(ps.getStats().completedSentenceCount, 1);

  const sync = new SyncService(ps, mockAuth);
  sync.init();

  // Simulate sign-in event
  mockAuth.emit('auth:signedIn', { userId: 'user-2' });

  // Wait for async sync
  await new Promise(r => setTimeout(r, 50));

  // Server data should have overwritten local
  assert.strictEqual(ps.getStats().completedSentenceCount, 2);
  assert.strictEqual(ps.getStats().bestWpm, 90);
  assert.deepStrictEqual(ps.data.completedSentenceIds, ['100', '200']);
  assert.strictEqual(ps.getSentencesTypedTotal(), 50);
}

// Case 3: Sign-out stops pushing
{
  let upsertCount = 0;
  const mockClient = {
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() { return { data: null, error: null }; },
        async upsert() { upsertCount++; return { error: null }; }
      };
    }
  };
  const mockAuth = createMockAuthService('user-3', mockClient);
  const ps = new ProgressService('test_sync_signout');
  ps.reset();

  const sync = new SyncService(ps, mockAuth);
  sync.init();

  mockAuth.emit('auth:signedIn', { userId: 'user-3' });
  await new Promise(r => setTimeout(r, 50));

  // Trigger a local change
  ps.recordSentenceCompletion({ sentenceId: 1, wpm: 50, accuracy: 90, mistakes: 1 });
  await new Promise(r => setTimeout(r, 1200));

  const countAfterSignIn = upsertCount;

  // Sign out
  mockAuth._userId = null;
  mockAuth.emit('auth:signedOut');
  upsertCount = 0;

  // Trigger another local change — should not push
  ps.recordSentenceCompletion({ sentenceId: 2, wpm: 55, accuracy: 92, mistakes: 0 });
  await new Promise(r => setTimeout(r, 1200));

  assert.strictEqual(upsertCount, 0, 'No upsert should happen after sign-out');
}

console.log('✓ SyncService migration/server-wins/sign-out passed!');

console.log('--- Testing Router ---');
import { Router } from '../client/js/core/Router.js';

// Mock window for Node.js test environment
const _originalWindow = globalThis.window;
if (typeof globalThis.window === 'undefined') {
  const listeners = {};
  globalThis.window = {
    location: { hash: '' },
    addEventListener: (event, fn) => {
      (listeners[event] || (listeners[event] = [])).push(fn);
    },
    removeEventListener: (event, fn) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(f => f !== fn);
      }
    },
    _triggerHashChange: () => {
      (listeners['hashchange'] || []).forEach(fn => fn());
    }
  };
}

// Router: register + navigate
{
  const router = new Router();
  let routeCalled = false;
  let capturedParams = null;

  router.register('/test', (params) => {
    routeCalled = true;
    capturedParams = params;
  });

  window.location.hash = '#/test?level=A1&topic=food';
  router._resolve();

  assert.strictEqual(routeCalled, true);
  assert.strictEqual(capturedParams.level, 'A1');
  assert.strictEqual(capturedParams.topic, 'food');
  assert.strictEqual(router.current, '/test');

  // Navigate to unknown route should redirect to /
  let homeCalled = false;
  router.register('/', () => { homeCalled = true; });
  window.location.hash = '#/unknown-route';
  router._resolve();
  // navigate('/') sets hash to '/', browser auto-prefixes '#'
  assert.strictEqual(window.location.hash, '/');

  router.destroy();
}

// Router: event emission
{
  const router2 = new Router();
  let emittedRoute = null;
  router2.on('route:change', ({ path }) => { emittedRoute = path; });

  router2.register('/hello', () => {});
  window.location.hash = '#/hello';
  router2._resolve();
  assert.strictEqual(emittedRoute, '/hello');
  router2.destroy();
}

// Restore window
if (_originalWindow === undefined) {
  delete globalThis.window;
} else {
  globalThis.window = _originalWindow;
}

console.log('✓ Router passed!');

console.log('--- Testing StreakService ---');
import { StreakService } from '../client/js/services/StreakService.js';

{
  const streak = new StreakService();

  // Fresh state
  assert.strictEqual(streak.getStreak(), 0);
  assert.strictEqual(streak.getLastActivityDate(), null);

  // Record activity today
  streak.recordActivity();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  assert.strictEqual(streak.getStreak(), 1);
  assert.strictEqual(streak.getLastActivityDate(), todayKey);

  // Record again same day: streak should remain 1
  streak.recordActivity();
  assert.strictEqual(streak.getStreak(), 1);

  // ReplaceAll
  streak.replaceAll({ streak: 5, lastActivityDate: '2026-01-01', activityDays: ['2026-01-01'] });
  assert.strictEqual(streak.getStreak(), 5);
}

console.log('✓ StreakService passed!');

console.log('--- Testing SettingsService ---');
import { SettingsService } from '../client/js/services/SettingsService.js';

{
  const settings = new SettingsService('test_saytype_settings_v1');

  // Defaults
  assert.strictEqual(settings.get('typingMode'), 'strict');
  assert.strictEqual(settings.get('speechRate'), 1);
  assert.strictEqual(settings.get('soundEnabled'), true);
  assert.strictEqual(settings.get('interfaceLang'), 'en');

  // Set
  settings.set('typingMode', 'free');
  assert.strictEqual(settings.get('typingMode'), 'free');

  // getAll
  const all = settings.getAll();
  assert.strictEqual(all.typingMode, 'free');
  assert.strictEqual(all.speechRate, 1);

  // replaceAll merges onto defaults
  settings.replaceAll({ speechRate: 1.5 });
  assert.strictEqual(settings.get('speechRate'), 1.5);
  assert.strictEqual(settings.get('typingMode'), 'strict'); // default, not preserved from previous set
  assert.strictEqual(settings.get('soundEnabled'), true); // default
}

console.log('✓ SettingsService passed!');

console.log('--- Testing Practice Initialization Regression ---');
{
  // Simulate practice initialization with a mock SentenceRepository
  const engineP = new SentenceEngine();
  const metricsP = new MetricsCalculator();
  const sessionP = new SessionEngine(engineP, metricsP, { listenFirst: true });

  // Test 1: A1 practice returns sentences
  const a1Sentences = [
    { id: 'a1-daily-life-001', level: 'A1', topic: 'daily-life', text_en: 'I wake up at seven every morning.', text_ar: 'أستيقظ في الساعة السابعة كل صباح.' },
    { id: 'a1-daily-life-002', level: 'A1', topic: 'daily-life', text_en: 'She is my sister.', text_ar: 'هي أختي.' }
  ];
  sessionP.setSentences(a1Sentences);
  assert.strictEqual(sessionP.sentences.length, 2);
  assert.strictEqual(sessionP.currentSentence.text_en, 'I wake up at seven every morning.');
  assert.strictEqual(sessionP.currentState, 'LOADING_SENTENCE');
  console.log('✓ A1 practice initializes with sentences');

  // Test 2: A2 practice returns sentences
  const a2Sentences = [
    { id: 'a2-technology-001', level: 'A2', topic: 'technology', text_en: 'Technology changes our lives.', text_ar: 'التكنولوجيا تغير حياتنا.' }
  ];
  sessionP.setSentences(a2Sentences);
  assert.strictEqual(sessionP.sentences.length, 1);
  assert.strictEqual(sessionP.currentSentence.text_en, 'Technology changes our lives.');
  console.log('✓ A2 practice initializes with sentences');

  // Test 3: Topic-filtered practice returns sentences
  const topicSentences = [
    { id: 'a1-food-001', level: 'A1', topic: 'food', text_en: 'I like coffee.', text_ar: 'أحب القهوة.' }
  ];
  sessionP.setSentences(topicSentences);
  assert.strictEqual(sessionP.sentences.length, 1);
  assert.strictEqual(sessionP.currentSentence.topic, 'food');
  console.log('✓ Topic-filtered practice initializes with sentences');

  // Test 4: Empty response renders empty state (null sentence emitted)
  let emptySentenceLoaded = false;
  const sessionEmpty2 = new SessionEngine(new SentenceEngine(), new MetricsCalculator());
  sessionEmpty2.on('sentence:loaded', ({ sentence }) => {
    if (sentence === null) emptySentenceLoaded = true;
  });
  sessionEmpty2.setSentences([]);
  assert.strictEqual(emptySentenceLoaded, true);
  assert.strictEqual(sessionEmpty2.currentSentence, null);
  console.log('✓ Empty response emits null sentence for empty state');

  // Test 5: Listen-first flow works after practice init
  const sessionLF = new SessionEngine(new SentenceEngine(), new MetricsCalculator(), { listenFirst: true });
  let listenFired = false;
  sessionLF.on('sentence:listen', () => { listenFired = true; });
  sessionLF.setSentences([{ id: 1, text_en: 'Hi.', text_ar: 'مرحبا' }]);
  sessionLF.beginLesson();
  assert.strictEqual(sessionLF.currentState, 'LISTENING');
  assert.strictEqual(listenFired, true);
  sessionLF.finishListening();
  assert.strictEqual(sessionLF.currentState, 'READY');
  const keyResult = sessionLF.handleKey('H');
  assert.strictEqual(keyResult.type, 'correct');
  assert.strictEqual(sessionLF.currentState, 'TYPING');
  console.log('✓ Listen-first flow works after practice init');
}

console.log('--- Testing Route Link Consistency ---');
{
  // Verify that all nav link hrefs match Router paths
  const fs = await import('fs');
  const path = await import('path');
  const html = fs.readFileSync(path.join(process.cwd(), 'client', 'index.html'), 'utf8');
  
  // Extract all href values from nav links
  const hrefPattern = /href="(#[^"]+)"/g;
  const routerPaths = ['/', '/learn', '/practice', '/review', '/progress', '/profile', '/settings'];
  let match;
  let linkCount = 0;
  let brokenLinks = [];
  while ((match = hrefPattern.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('#/') || href === '#') {
      const route = href === '#' ? '/' : href.slice(1);
      const basePath = route.split('?')[0];
      if (routerPaths.includes(basePath)) {
        linkCount++;
      } else {
        brokenLinks.push(href);
      }
    } else {
      brokenLinks.push(href);
    }
  }
  assert.strictEqual(brokenLinks.length, 0, `Broken route links found: ${brokenLinks.join(', ')}`);
  assert.ok(linkCount >= 10, `Expected at least 10 valid nav links, found ${linkCount}`);
  console.log(`✓ All ${linkCount} navigation links use correct #/route format`);
}

console.log('--- Testing SentenceRepository API Response Structure ---');
{
  // Verify SentenceRepository fallback returns proper structure
  const { SentenceRepository } = await import('../client/js/services/SentenceRepository.js');
  const repo = new SentenceRepository('http://localhost:0/nonexistent');
  
  // Fallback should return sentences with required fields
  const fallbackSentences = await repo._getFallbackSentences({ level: 'A1' });
  assert.ok(Array.isArray(fallbackSentences), 'Fallback should return array');
  assert.ok(fallbackSentences.length > 0, 'Fallback should have sentences');
  
  const first = fallbackSentences[0];
  assert.ok(first.id, 'Sentence should have id');
  assert.ok(first.level, 'Sentence should have level');
  assert.ok(first.text_en || first.english, 'Sentence should have English text');
  assert.ok(first.text_ar || first.arabic, 'Sentence should have Arabic text');
  console.log(`✓ SentenceRepository fallback returns ${fallbackSentences.length} valid sentences`);
}

console.log('ALL REGRESSION TESTS PASSED SUCCESSFULLY! 🎉');
process.exit(0);
