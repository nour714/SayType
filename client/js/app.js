/**
 * SayType — Application Entry Point
 * Wires routing, services, engines, and UI components.
 */

import { Router } from './core/Router.js';
import { SentenceEngine } from './core/SentenceEngine.js';
import { MetricsCalculator } from './core/MetricsCalculator.js';
import { SessionEngine } from './core/SessionEngine.js';
import { SentenceRepository } from './services/SentenceRepository.js';
import { SpeechService } from './services/SpeechService.js';
import { ThemeService } from './services/ThemeService.js';
import { ProgressService } from './services/ProgressService.js';
import { DictionaryService } from './services/DictionaryService.js';
import { ReviewScheduler } from './services/ReviewScheduler.js';
import { getSupabaseClient } from './services/SupabaseClient.js';
import { AuthService } from './services/AuthService.js';
import { SyncService } from './services/SyncService.js';
import { StreakService } from './services/StreakService.js';
import { SettingsService } from './services/SettingsService.js';
import { TrainingScreen } from './ui/TrainingScreen.js';
import { StatsPills } from './ui/StatsPills.js';
import { ProgressIndicator } from './ui/ProgressIndicator.js';
import { TopicSelector } from './ui/TopicSelector.js';
import { LevelSelector } from './ui/LevelSelector.js';
import { AuthModal } from './ui/AuthModal.js';
import { Navigation } from './ui/Navigation.js';
import { DashboardScreen } from './ui/DashboardScreen.js';
import { LevelScreen } from './ui/LevelScreen.js';
import { TopicScreen } from './ui/TopicScreen.js';
import { ReviewScreen } from './ui/ReviewScreen.js';
import { ProgressScreen } from './ui/ProgressScreen.js';
import { ProfileScreen } from './ui/ProfileScreen.js';
import { SettingsScreen } from './ui/SettingsScreen.js';

const VALID_LEVELS = ['A1', 'A2'];

async function bootstrap() {
  // 1. Services
  const themeService = new ThemeService();
  const speechService = new SpeechService();
  const progressService = new ProgressService();
  const dictionaryService = new DictionaryService();
  const sentenceRepo = new SentenceRepository();
  const reviewScheduler = new ReviewScheduler();
  const streakService = new StreakService();
  const settingsService = new SettingsService();

  // Apply saved speech rate
  speechService.setRate(settingsService.get('speechRate') || 1);

  // 2. Auth & Sync
  const supabaseClient = getSupabaseClient();
  const authService = new AuthService(supabaseClient);
  const syncService = new SyncService(progressService, authService);
  syncService.init();
  await authService.init();

  // 3. Core Engines
  const sentenceEngine = new SentenceEngine();
  const metricsCalculator = new MetricsCalculator();
  const sessionEngine = new SessionEngine(sentenceEngine, metricsCalculator, { listenFirst: true });

  // Apply saved typing mode
  const savedTypingMode = settingsService.get('typingMode');
  if (savedTypingMode) sentenceEngine.setTypingMode(savedTypingMode);

  // 4. UI Components
  const trainingScreen = new TrainingScreen();
  trainingScreen.setDictionaryService(dictionaryService);
  const statsPills = new StatsPills();
  const progressIndicator = new ProgressIndicator();
  const levelSelector = new LevelSelector('level-select', 'A1');
  const topicSelector = new TopicSelector('topic-select');
  const authModal = new AuthModal();
  const navigation = new Navigation();

  // 5. Screen instances
  const dashboardScreen = new DashboardScreen();
  const levelScreen = new LevelScreen();
  const topicScreen = new TopicScreen();
  const reviewScreen = new ReviewScreen();
  const progressScreen = new ProgressScreen();
  const profileScreen = new ProfileScreen();
  const settingsScreen = new SettingsScreen();

  // 6. Router
  const router = new Router();

  // 7. Transient state
  let currentLevel = 'A1';
  let currentTopic = '';
  let allSentencesPool = [];
  let reviewWordFailedThisSentence = false;
  let currentPage = null;

  // =========================================================================
  // Helpers
  // =========================================================================
  function cleanupPracticeSession() {
    speechService.stop();
    trainingScreen.closeModals();
    trainingScreen.hideTooltip();
    if (trainingScreen.focusReminder) {
      trainingScreen.focusReminder.style.display = 'none';
    }
  }

  function showPage(route) {
    const pageContainers = document.querySelectorAll('.page-container');
    pageContainers.forEach(c => { c.style.display = 'none'; });

    const trainingOnly = document.querySelectorAll('.training-only');
    const isTrainingRoute = route === '/practice';

    trainingOnly.forEach(el => {
      el.style.display = isTrainingRoute ? '' : 'none';
    });

    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) {
      mobileNav.classList.toggle('mobile-nav-hidden', route === '/practice');
    }

    const dock = document.getElementById('dock-bar');
    if (dock) {
      dock.style.display = isTrainingRoute ? '' : 'none';
    }

    navigation.setActive(route);
  }

  async function getProgressContext() {
    const topics = await sentenceRepo.getTopics(currentLevel).catch(() => []);
    return {
      stats: progressService.getStats(),
      streak: streakService.getStreak(),
      dueReviewCount: progressService.getDueReviewWords(50).length,
      lastLevel: currentLevel,
      lastTopic: currentTopic,
      continueLesson: progressService.data.completedCount > 0,
      topics
    };
  }

  // =========================================================================
  // Theme wiring
  // =========================================================================
  themeService.init();
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => themeService.toggle());
  }

  // =========================================================================
  // Auth UI wiring
  // =========================================================================
  const authBtn = document.getElementById('auth-btn');

  function updateAuthButton() {
    if (!authBtn) return;
    if (authService.isAuthenticated) {
      authBtn.classList.add('is-synced');
      authBtn.textContent = 'Synced';
      authBtn.title = `Signed in as ${authService.email || 'account'} — click to sign out`;
    } else {
      authBtn.classList.remove('is-synced');
      authBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px;"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93"></path><path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93"></path><path d="M5.5 10.5A7 7 0 0 0 12 22a7 7 0 0 0 6.5-11.5"></path><path d="M12 16v2"></path></svg> Sync`;
      authBtn.title = 'Sign in to sync progress across devices';
    }
  }

  if (authBtn) {
    authBtn.addEventListener('click', async () => {
      if (authService.isAuthenticated) {
        await authService.signOut();
        updateAuthButton();
      } else {
        authModal.open();
      }
    });
  }

  authService.on('auth:signedIn', () => { updateAuthButton(); authModal.close(); });
  authService.on('auth:signedOut', () => { updateAuthButton(); });

  authModal.on('auth:submit', async ({ email, password, mode }) => {
    authModal.setSubmitting(true);
    const result = mode === 'signup'
      ? await authService.signUp(email, password)
      : await authService.signIn(email, password);
    authModal.setSubmitting(false);
    if (result?.error) authModal.showError(result.error);
  });

  // =========================================================================
  // Speech Service wiring
  // =========================================================================
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
    trainingScreen.showListenFallback();
  });

  speechService.on('unsupported', () => {
    sessionEngine.finishListening();
    trainingScreen.showListenFallback();
  });

  // Listen-First triggering
  sessionEngine.on('sentence:listen', ({ sentence, text }) => {
    if (trainingScreen.isStartOverlayOpen()) return;
    const textToSpeak = text || (sentence ? (sentence.text_en || sentence.english) : '');
    if (textToSpeak) {
      speechService.speak(textToSpeak);
    } else {
      sessionEngine.finishListening();
    }
  });

  // =========================================================================
  // UI Actions -> Engines
  // =========================================================================
  trainingScreen.on('action:listen', () => {
    const current = sessionEngine.currentSentence;
    if (current) {
      const text = current.text_en || current.english || '';
      if (text) speechService.speak(text);
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
    sessionEngine.beginLesson();
  });

  trainingScreen.on('action:key', (key) => {
    sessionEngine.handleKey(key);
  });

  // =========================================================================
  // Session Engine Events -> UI
  // =========================================================================
  sessionEngine.on('state:change', ({ to }) => {
    trainingScreen.setStateIndicator(to);
  });

  sessionEngine.on('sentence:loaded', ({ sentence, index, total }) => {
    reviewWordFailedThisSentence = false;

    if (!sentence) {
      trainingScreen.showEmptyState();
      trainingScreen.setFavorite(false);
      progressIndicator.update({ current: 0, total: 0 });
      statsPills.reset();
      return;
    }

    trainingScreen.renderSentence(sentence);
    const srAnnounce = document.getElementById('sr-announce');
    if (srAnnounce) srAnnounce.textContent = `Listen: ${sentence.text_en || sentence.english || ''}`;
    trainingScreen.setFavorite(progressService.isFavorite(sentence.id));
    trainingScreen.setReviewBadge(sentence);
    progressIndicator.update({ current: index + 1, total });
    statsPills.reset();
  });

  sessionEngine.on('char:correct', (p) => trainingScreen.onCharCorrect(p));
  sessionEngine.on('char:wrong', (p) => trainingScreen.onCharWrong(p));
  sessionEngine.on('backspace', (p) => trainingScreen.onBackspace(p));
  sessionEngine.on('caret:update', (p) => trainingScreen.updateCaret(p));
  sessionEngine.on('metrics:update', (stats) => statsPills.update(stats));

  sessionEngine.on('word:mistake', ({ word }) => {
    const currentSentence = sessionEngine.currentSentence;
    if (currentSentence?.isReview && word.toLowerCase() === currentSentence.reviewWord.toLowerCase()) {
      reviewWordFailedThisSentence = true;
      return;
    }
    progressService.recordMistakeOnWord(word);
  });

  sessionEngine.on('sentence:completed', ({ sentence, stats, isLast }) => {
    streakService.recordActivity();

    progressService.recordSentenceCompletion({
      sentenceId: sentence ? sentence.id : null,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      mistakes: stats.mistakes
    });

    if (sentence?.isReview) {
      const success = !reviewWordFailedThisSentence;
      progressService.recordWordReviewOutcome(sentence.reviewWord, success);
    }

    const totalTyped = progressService.getSentencesTypedTotal();
    if (totalTyped % 10 === 0) {
      const dueWords = progressService.getDueReviewWords(3);
      if (dueWords.length > 0) {
        const reviewRound = reviewScheduler.buildReviewRound(allSentencesPool, dueWords);
        if (reviewRound.length > 0) {
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

  // =========================================================================
  // Level & Topic Selector Integration (Training screen)
  // =========================================================================
  function loadSentencesForCurrentFilters() {
    const query = { level: currentLevel };
    if (currentTopic) query.topic = currentTopic;
    speechService.stop();
    sentenceRepo.getSentences(query).then((sentences) => {
      sessionEngine.setSentences(sentences || []);
      if (sentences && sentences.length > 0) {
        trainingScreen.closeStartOverlay();
        sessionEngine.beginLesson();
      }
    }).catch((err) => {
      console.warn('Failed to load sentences:', err);
      trainingScreen.showError();
    });
  }

  function refreshTopicsForLevel() {
    sentenceRepo.getTopics(currentLevel).then((topics) => {
      topicSelector.setTopics(topics);
      if (currentTopic && !topics.some((t) => t.id === currentTopic)) {
        currentTopic = '';
      }
    }).catch(() => {});

    sentenceRepo.getSentences({ level: currentLevel }).then((sentences) => {
      allSentencesPool = sentences || [];
    }).catch(() => {});
  }

  levelSelector.on('level:change', ({ level }) => {
    currentLevel = level;
    currentTopic = '';
    refreshTopicsForLevel();
    loadSentencesForCurrentFilters();
  });

  topicSelector.on('topic:change', ({ topic }) => {
    currentTopic = topic;
    loadSentencesForCurrentFilters();
  });

  // =========================================================================
  // Navigation
  // =========================================================================
  navigation.on('navigate', ({ route }) => {
    router.navigate(route);
  });

  // Settings nav button
  const settingsNavBtn = document.getElementById('settings-nav-btn');
  if (settingsNavBtn) {
    settingsNavBtn.addEventListener('click', () => router.navigate('/settings'));
  }

  // =========================================================================
  // Routes
  // =========================================================================
  router.register('/', async () => {
    if (currentPage === '/practice') cleanupPracticeSession();
    currentPage = '/';
    showPage('/');
    await dashboardScreen.render(await getProgressContext());
  });

  router.register('/learn', async () => {
    if (currentPage === '/practice') cleanupPracticeSession();
    currentPage = '/learn';
    showPage('/learn');
    await levelScreen.render({ sentenceRepo, progressService });
  });

  router.register('/practice', async (params) => {
    const prevPage = currentPage;
    currentPage = '/practice';
    showPage('/practice');

    const container = document.getElementById('page-practice');
    if (container) container.style.display = '';

    if (params.level && VALID_LEVELS.includes(params.level)) {
      currentLevel = params.level;
      levelSelector.setLevel(params.level);
    }
    if (params.topic) {
      currentTopic = params.topic;
      topicSelector.setTopic(params.topic);
    }

    // Only reload sentences if coming from a different page or changing filters
    if (prevPage !== '/practice') {
      refreshTopicsForLevel();
      loadSentencesForCurrentFilters();
    }
  });

  router.register('/review', async () => {
    if (currentPage === '/practice') cleanupPracticeSession();
    currentPage = '/review';
    showPage('/review');
    reviewScreen.render({ progressService, reviewScheduler, sentenceRepo, currentLevel });
  });

  router.register('/progress', async () => {
    if (currentPage === '/practice') cleanupPracticeSession();
    currentPage = '/progress';
    showPage('/progress');
    progressScreen.render({ progressService, streakService, sentenceRepo });
  });

  router.register('/profile', async () => {
    if (currentPage === '/practice') cleanupPracticeSession();
    currentPage = '/profile';
    showPage('/profile');
    profileScreen.render({ authService, progressService, streakService });
  });

  router.register('/settings', async () => {
    if (currentPage === '/practice') cleanupPracticeSession();
    currentPage = '/settings';
    showPage('/settings');
    settingsScreen.render({ settingsService });
  });

  // =========================================================================
  // Settings screen events
  // =========================================================================
  settingsScreen.on('setting:typingMode', ({ value }) => {
    sentenceEngine.setTypingMode(value);
  });

  settingsScreen.on('setting:speechRate', ({ value }) => {
    speechService.setRate(value);
  });

  settingsScreen.on('setting:theme', () => {
    themeService.toggle();
  });

  // =========================================================================
  // Global Keyboard
  // =========================================================================
  window.addEventListener('keydown', (e) => {
    if (currentPage !== '/practice') return;

    if (e.key === 'Escape' && trainingScreen.isTooltipVisible()) {
      e.preventDefault();
      trainingScreen.hideTooltip();
      return;
    }

    if (trainingScreen.isStartOverlayOpen()) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trainingScreen.closeStartOverlay();
        sessionEngine.beginLesson();
      }
      return;
    }

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

    if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
      e.preventDefault();
      const current = sessionEngine.currentSentence;
      if (current) {
        const text = current.text_en || current.english || '';
        if (text) speechService.speak(text);
      }
      return;
    }

    const result = sessionEngine.handleKey(e.key);
    if (result !== null) {
      e.preventDefault();
    }
  });

  // =========================================================================
  // Init Router
  // =========================================================================
  router.init('/');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
