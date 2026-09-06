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

  // 4. Wire Theme Service
  themeService.init();
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => themeService.toggle());
  }

  // 5. Wire Speech Service to UI & Session
  speechService.on('start', () => {
    trainingScreen.setSpeaking(true);
  });

  speechService.on('end', () => {
    trainingScreen.setSpeaking(false);
    sessionEngine.finishListening();
    trainingScreen.ensureTypingFocus();
  });

  speechService.on('error', () => {
    trainingScreen.setSpeaking(false);
    sessionEngine.finishListening();
    trainingScreen.ensureTypingFocus();
  });

  speechService.on('unsupported', () => {
    sessionEngine.finishListening();
  });

  // 6. Listen-First Triggering
  sessionEngine.on('sentence:listen', ({ sentence, text }) => {
    // If the initial start overlay is open, wait for the learner's first gesture
    if (trainingScreen.isStartOverlayOpen()) {
      return;
    }

    const textToSpeak = text || (sentence ? (sentence.text_en || sentence.english) : '');
    if (textToSpeak) {
      speechService.speak(textToSpeak)
        .then(() => {
          sessionEngine.finishListening();
          trainingScreen.ensureTypingFocus();
        })
        .catch(() => {
          sessionEngine.finishListening();
          trainingScreen.ensureTypingFocus();
        });
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
    // Start lesson gesture unlocks speech in modern browsers
    const current = sessionEngine.currentSentence;
    if (current) {
      const text = current.text_en || current.english || '';
      if (text) {
        speechService.speak(text)
          .then(() => {
            sessionEngine.finishListening();
            trainingScreen.ensureTypingFocus();
          })
          .catch(() => {
            sessionEngine.finishListening();
            trainingScreen.ensureTypingFocus();
          });
      } else {
        sessionEngine.finishListening();
      }
    }
  });

  trainingScreen.on('action:key', (key) => {
    sessionEngine.handleKey(key);
  });

  // 8. Wire Session Engine Events to UI Components
  sessionEngine.on('state:change', ({ to }) => {
    trainingScreen.setStateIndicator(to);
  });

  sessionEngine.on('sentence:loaded', ({ sentence, index, total }) => {
    trainingScreen.renderSentence(sentence);
    const isFav = sentence ? progressService.isFavorite(sentence.id) : false;
    trainingScreen.setFavorite(isFav);
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
    progressService.recordMistakeOnWord(word);
  });

  sessionEngine.on('sentence:completed', ({ sentence, stats, isLast }) => {
    progressService.recordSentenceCompletion({
      sentenceId: sentence ? sentence.id : null,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      mistakes: stats.mistakes
    });

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
    sentenceRepo.getSentences(query).then((sentences) => {
      sessionEngine.setSentences(sentences);
    });
  });

  sentenceRepo.getTopics().then((topics) => {
    topicSelector.setTopics(topics);
  }).catch((err) => {
    console.warn('Failed to load topics:', err);
  });

  // 10. Global Keyboard Interactions
  window.addEventListener('keydown', (e) => {
    // If start overlay is open, Enter or Space starts the lesson
    if (trainingScreen.isStartOverlayOpen()) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trainingScreen.closeStartOverlay();
        const current = sessionEngine.currentSentence;
        if (current) {
          const text = current.text_en || current.english || '';
          if (text) {
            speechService.speak(text)
              .then(() => {
                sessionEngine.finishListening();
                trainingScreen.ensureTypingFocus();
              })
              .catch(() => {
                sessionEngine.finishListening();
                trainingScreen.ensureTypingFocus();
              });
          } else {
            sessionEngine.finishListening();
          }
        }
      }
      return;
    }

    // Check if sentence/lesson modal is open: Space or Enter navigates
    if (trainingScreen.isAnyModalOpen()) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (trainingScreen.sentenceModal?.classList.contains('is-open')) {
          sessionEngine.advanceToNextSentence();
        } else if (trainingScreen.lessonModal?.classList.contains('is-open')) {
          sessionEngine.restartLesson();
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
