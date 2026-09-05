import assert from 'node:assert';
import { SentenceEngine } from '../client/js/core/SentenceEngine.js';
import { MetricsCalculator } from '../client/js/core/MetricsCalculator.js';
import { SessionEngine } from '../client/js/core/SessionEngine.js';

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
console.log('ALL CLIENT CORE UNIT TESTS PASSED SUCCESSFULLY! 🎉');
