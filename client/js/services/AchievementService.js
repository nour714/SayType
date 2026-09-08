/**
 * AchievementService — badge catalog and unlock evaluation.
 * Decoupled from DOM, SyncService, and AuthService.
 * Streaks and badges work identically for guest and signed-in learners.
 */

export const BADGES = [
  {
    id: 'first-steps',
    name: 'First Steps',
    icon: '🌱',
    description: 'Complete your first sentence.',
    check: (s) => s.completedSentenceCount >= 1
  },
  {
    id: 'half-century',
    name: 'Half Century',
    icon: '📘',
    description: 'Complete 50 sentences.',
    check: (s) => s.completedSentenceCount >= 50
  },
  {
    id: 'century',
    name: 'Century',
    icon: '🏆',
    description: 'Complete 100 sentences.',
    check: (s) => s.completedSentenceCount >= 100
  },
  {
    id: 'streak-3',
    name: '3-Day Streak',
    icon: '🔥',
    description: 'Practice 3 days in a row.',
    check: (s) => s.currentStreak >= 3
  },
  {
    id: 'streak-7',
    name: '7-Day Streak',
    icon: '🔥',
    description: 'Practice 7 days in a row.',
    check: (s) => s.currentStreak >= 7
  },
  {
    id: 'streak-30',
    name: '30-Day Streak',
    icon: '🔥',
    description: 'Practice 30 days in a row.',
    check: (s) => s.currentStreak >= 30
  },
  {
    id: 'sharp-shooter',
    name: 'Sharp Shooter',
    icon: '🎯',
    description: 'Finish 10 sentences with zero mistakes.',
    check: (s) => s.perfectAccuracyCount >= 10
  },
  {
    id: 'word-master',
    name: 'Word Master',
    icon: '🧠',
    description: 'Fully master 5 review words.',
    check: (s) => s.masteredWordsCount >= 5
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    icon: '⚡',
    description: 'Reach 40 WPM.',
    check: (s) => s.bestWpm >= 40
  },
  {
    id: 'explorer',
    name: 'Explorer',
    icon: '🧭',
    description: 'Favorite 5 sentences.',
    check: (s) => s.favoritesCount >= 5
  }
];

export class AchievementService {
  /**
   * Check all badges against current stats; unlock any newly-earned ones.
   * @param {import('./ProgressService.js').ProgressService} progressService
   * @returns {Array} newly unlocked badge objects (empty if none)
   */
  checkNewlyUnlocked(progressService) {
    const stats = progressService.getStats();
    const alreadyUnlocked = new Set(progressService.data.unlockedBadges || []);
    const newlyUnlocked = [];

    for (const badge of BADGES) {
      if (alreadyUnlocked.has(badge.id)) continue;
      if (badge.check(stats)) {
        if (progressService.unlockBadge(badge.id)) {
          newlyUnlocked.push(badge);
        }
      }
    }
    return newlyUnlocked;
  }
}
