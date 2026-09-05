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
import { TrainingScreen } from './ui/TrainingScreen.js';
import { StatsPills } from './ui/StatsPills.js';
import { ProgressIndicator } from './ui/ProgressIndicator.js';

function bootstrap() {
  // 1. Initialize Services
  const themeService = new ThemeService();
  const speechService = new SpeechService();
  const sentenceRepo = new SentenceRepository();

  // 2. Initialize Core Engines
  const sentenceEngine = new SentenceEngine();
  const metricsCalculator = new MetricsCalculator();
  const sessionEngine = new SessionEngine(sentenceEngine, metricsCalculator);

  // 3. Initialize UI Components
  const trainingScreen = new TrainingScreen();
  const statsPills = new StatsPills();
  const progressIndicator = new ProgressIndicator();

  // 4. Wire Theme Service
  themeService.init();
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => themeService.toggle());
  }

  // 5. Wire Speech Service to UI
  speechService.on('start', () => trainingScreen.setSpeaking(true));
  speechService.on('end', () => {
    trainingScreen.setSpeaking(false);
    trainingScreen.ensureTypingFocus();
  });

  // 6. Wire UI Actions to Engines & Services
  trainingScreen.on('action:listen', () => {
    const current = sessionEngine.currentSentence;
    if (current && current.text_en) {
      speechService.speak(current.text_en);
    }
  });

  trainingScreen.on('action:next', () => {
    sessionEngine.advanceToNextSentence();
  });

  trainingScreen.on('action:restart', () => {
    sessionEngine.restartLesson();
  });

  // 7. Wire Session Engine Events to UI Components
  sessionEngine.on('sentence:loaded', ({ sentence, index, total }) => {
    trainingScreen.renderSentence(sentence);
    progressIndicator.update({
      current: index + 1,
      total,
      level: sentence.level || 'A1'
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

  sessionEngine.on('sentence:completed', ({ stats, isLast }) => {
    if (!isLast) {
      trainingScreen.showSentenceModal(stats);
    }
  });

  sessionEngine.on('lesson:completed', (summary) => {
    trainingScreen.showLessonModal(summary);
  });

  // 8. Global Keyboard Interactions
  window.addEventListener('keydown', (e) => {
    // Check if modal is open: Space or Enter navigates
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
      if (current && current.text_en) {
        speechService.speak(current.text_en);
      }
      return;
    }

    // Pass keystroke to session engine
    const result = sessionEngine.handleKey(e.key);
    if (result !== null) {
      e.preventDefault();
    }
  });

  // 9. Load Sentence Dataset & Start Session
  sentenceRepo.getSentences().then((sentences) => {
    sessionEngine.setSentences(sentences);
  });
}

// Bootstrap once DOM content is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
