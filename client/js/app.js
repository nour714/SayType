/**
 * Editorial Typographic Sanctuary — Application Entry Point
 * Assembly point only — initializes and wires decoupled services, engines, and UI components.
 */

import { SentenceEngine } from './core/SentenceEngine.js';
import { MetricsCalculator } from './core/MetricsCalculator.js';
import { SessionEngine } from './core/SessionEngine.js';
import { SentenceRepository } from './services/SentenceRepository.js';
import { SpeechService } from './services/SpeechService.js';
import { ThemeService } from './services/ThemeService.js';
import { ProgressService } from './services/ProgressService.js';
import { DictionaryService } from './services/DictionaryService.js';
import { ReviewScheduler } from './services/ReviewScheduler.js';
import { TrainingScreen } from './ui/TrainingScreen.js';
import { StatsPills } from './ui/StatsPills.js';
import { ProgressIndicator } from './ui/ProgressIndicator.js';
import { TopicSelector } from './ui/TopicSelector.js';

function bootstrap() {
  // 1. Initialize Services
  const themeService = new ThemeService();
  const speechService = new SpeechService();
  const progressService = new ProgressService();
  const dictionaryService = new DictionaryService();
  const sentenceRepo = new SentenceRepository();
  const reviewScheduler = new ReviewScheduler();

  // 2. Initialize Core Engines (with listenFirst enabled by default)
  const sentenceEngine = new SentenceEngine();
  const metricsCalculator = new MetricsCalculator();
  const sessionEngine = new SessionEngine(sentenceEngine, metricsCalculator, { listenFirst: true });

  // 3. Initialize UI Components
  const trainingScreen = new TrainingScreen();
  trainingScreen.setDictionaryService(dictionaryService);
  const statsPills = new StatsPills();
  const progressIndicator = new ProgressIndicator();
  const topicSelector = new TopicSelector('topic-select');

  // 4. Review system transient state
  let allSentencesPool = [];
  let reviewWordFailedThisSentence = false;

  // 4. Wire Theme Service
  themeService.init();
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => themeService.toggle());
  }

  // 5. Wire Speech Service to UI & Session
  speechService.on('start', () => {
    trainingScreen.setSpeaking(true);
    trainingScreen.clearListenFallback();
  });

  speechService.on('end', () => {
    trainingScreen.setSpeaking(false);
    sessionEngine.finishListening();
    trainingScreen.ensureTypingFocus();
  });

  speechService.on('error', () => {
    trainingScreen.setSpeaking(false);
    sessionEngine.finishListening();
    // Learner can recover manually by pressing the Listen button.
    trainingScreen.showListenFallback();
  });

  speechService.on('unsupported', () => {
    sessionEngine.finishListening();
    trainingScreen.showListenFallback();
  });

  // 6. Listen-First Triggering
  sessionEngine.on('sentence:listen', ({ sentence, text }) => {
    // If the initial start overlay is open, wait for the learner's first gesture
    if (trainingScreen.isStartOverlayOpen()) {
      return;
    }

    const textToSpeak = text || (sentence ? (sentence.text_en || sentence.english) : '');
    if (textToSpeak) {
      // Typing stays locked in LISTENING; SpeechService emits 'end' when the
      // current narration genuinely finishes, which unlocks READY typing.
      speechService.speak(textToSpeak);
    } else {
      sessionEngine.finishListening();
    }
  });

  // 7. Wire UI Actions to Engines & Services
  trainingScreen.on('action:listen', () => {
    const current = sessionEngine.currentSentence;
    if (current) {
      const text = current.text_en || current.english || '';
      if (text) {
        speechService.speak(text);
      }
    }
  });

  trainingScreen.on('action:next', () => {
    sessionEngine.advanceToNextSentence();
  });

  trainingScreen.on('action:restart', () => {
    speechService.stop();
    sessionEngine.restartLesson();
  });

  trainingScreen.on('action:favorite', () => {
    const current = sessionEngine.currentSentence;
    if (current && current.id !== undefined) {
      const isNowFav = progressService.toggleFavorite(current.id);
      trainingScreen.setFavorite(isNowFav);
    }
  });

  trainingScreen.on('action:start-lesson', () => {
    // Start lesson gesture unlocks speech in modern browsers.
    // beginLesson() transitions LOADING_SENTENCE -> LISTENING and emits
    // 'sentence:listen', which triggers pronunciation for the current sentence.
    sessionEngine.beginLesson();
  });

  trainingScreen.on('action:key', (key) => {
    sessionEngine.handleKey(key);
  });

  // 8. Wire Session Engine Events to UI Components
  sessionEngine.on('state:change', ({ to }) => {
    trainingScreen.setStateIndicator(to);
  });

  sessionEngine.on('sentence:loaded', ({ sentence, index, total }) => {
    // Reset review tracking for this sentence
    reviewWordFailedThisSentence = false;

    // Empty dataset (e.g. filtered topic with no content): show calm empty state.
    if (!sentence) {
      trainingScreen.showEmptyState();
      trainingScreen.setFavorite(false);
      progressIndicator.update({ current: 0, total: 0, level: 'A1' });
      statsPills.reset();
      return;
    }

    trainingScreen.renderSentence(sentence);
    const srAnnounce = document.getElementById('sr-announce');
    if (srAnnounce) {
      srAnnounce.textContent = `Listen: ${sentence.text_en || sentence.english || ''}`;
    }
    const isFav = sentence ? progressService.isFavorite(sentence.id) : false;
    trainingScreen.setFavorite(isFav);
    trainingScreen.setReviewBadge(sentence);
    progressIndicator.update({
      current: index + 1,
      total,
      level: (sentence && sentence.level) || 'A1'
    });
    statsPills.reset();
  });

  sessionEngine.on('char:correct', (payload) => {
    trainingScreen.onCharCorrect(payload);
  });

  sessionEngine.on('char:wrong', (payload) => {
    trainingScreen.onCharWrong(payload);
  });

  sessionEngine.on('backspace', (payload) => {
    trainingScreen.onBackspace(payload);
  });

  sessionEngine.on('caret:update', (payload) => {
    trainingScreen.updateCaret(payload);
  });

  sessionEngine.on('metrics:update', (stats) => {
    statsPills.update(stats);
  });

  sessionEngine.on('word:mistake', ({ word }) => {
    // Check if this is a review sentence with the target word
    const currentSentence = sessionEngine.currentSentence;
    if (currentSentence?.isReview && word.toLowerCase() === currentSentence.reviewWord.toLowerCase()) {
      reviewWordFailedThisSentence = true;
      // Don't call recordMistakeOnWord for review sentences — outcome recorded at completion
      return;
    }
    progressService.recordMistakeOnWord(word);
  });

  sessionEngine.on('sentence:completed', ({ sentence, stats, isLast }) => {
    progressService.recordSentenceCompletion({
      sentenceId: sentence ? sentence.id : null,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      mistakes: stats.mistakes
    });

    // Handle review sentence outcome
    if (sentence?.isReview) {
      const success = !reviewWordFailedThisSentence;
      progressService.recordWordReviewOutcome(sentence.reviewWord, success);
    }

    // Check if we should schedule a review round (every 10 sentences typed)
    const totalTyped = progressService.getSentencesTypedTotal();
    if (totalTyped % 10 === 0) {
      const dueWords = progressService.getDueReviewWords(3);
      if (dueWords.length > 0) {
        const reviewRound = reviewScheduler.buildReviewRound(allSentencesPool, dueWords);
        if (reviewRound.length > 0) {
          // Mark words as in-review so mistake tracking doesn't double-penalize
          dueWords.forEach(({ word }) => progressService.markWordInReview(word));
          sessionEngine.insertUpcoming(reviewRound);
        }
      }
    }

    if (!isLast) {
      trainingScreen.showSentenceModal(stats);
    }
  });

  sessionEngine.on('lesson:completed', (summary) => {
    trainingScreen.showLessonModal(summary);
  });

  // 9. Topic Selector Integration
  topicSelector.on('topic:change', ({ topic }) => {
    const query = topic ? { topic } : {};
    speechService.stop();
    sentenceRepo.getSentences(query).then((sentences) => {
      sessionEngine.setSentences(sentences || []);
      allSentencesPool = sentences || [];
      if (sentences && sentences.length > 0) {
        // The topic change is a user gesture; resume the listen-first flow immediately.
        trainingScreen.closeStartOverlay();
        sessionEngine.beginLesson();
      }
    }).catch((err) => {
      console.warn('Failed to load sentences for topic:', err);
    });
  });

  sentenceRepo.getTopics().then((topics) => {
    topicSelector.setTopics(topics);
  }).catch((err) => {
    console.warn('Failed to load topics:', err);
  });

  // 10. Global Keyboard Interactions
  window.addEventListener('keydown', (e) => {
    // Escape first dismisses any open word tooltip — never reset the
    // sentence while the learner is simply inspecting a word.
    if (e.key === 'Escape' && trainingScreen.isTooltipVisible()) {
      e.preventDefault();
      trainingScreen.hideTooltip();
      return;
    }

    // If start overlay is open, Enter or Space starts the lesson
    if (trainingScreen.isStartOverlayOpen()) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trainingScreen.closeStartOverlay();
        sessionEngine.beginLesson();
      }
      return;
    }

    // If sentence/lesson modal is open: Enter, Space, or Escape navigates
    if (trainingScreen.isAnyModalOpen()) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (trainingScreen.sentenceModal?.classList.contains('is-open')) {
          sessionEngine.advanceToNextSentence();
        } else if (trainingScreen.lessonModal?.classList.contains('is-open')) {
          sessionEngine.restartLesson();
        }
        return;
      }

      // Keep focus trapped inside the open dialog while tabbing
      if (e.key === 'Tab') {
        const focusables = trainingScreen.getModalFocusables();
        if (focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
      return;
    }

    // Ctrl+Space or Cmd+Space shortcut for pronunciation audio
    if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
      e.preventDefault();
      const current = sessionEngine.currentSentence;
      if (current) {
        const text = current.text_en || current.english || '';
        if (text) speechService.speak(text);
      }
      return;
    }

    // Pass keystroke to session engine
    const result = sessionEngine.handleKey(e.key);
    if (result !== null) {
      e.preventDefault();
    }
  });

  // 11. Load Initial Sentence Dataset & Start Session
  sentenceRepo.getSentences().then((sentences) => {
    sessionEngine.setSentences(sentences);
    // Also populate the full pool for review sentence matching
    allSentencesPool = sentences || [];
  }).catch((err) => {
    console.error('Failed to load sentences:', err);
  });
}

// Bootstrap once DOM content is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
