const STORAGE_KEY = 'saytype_streak_v1';

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00Z');
  const d2 = new Date(dateStr2 + 'T00:00:00Z');
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

export class StreakService {
  constructor() {
    this.data = this._load();
  }

  _load() {
    const defaults = { streak: 0, lastActivityDate: null, activityDays: [] };
    if (typeof window === 'undefined' || !window.localStorage) return defaults;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch (_) {}
    return defaults;
  }

  _save() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (_) {}
    }
  }

  recordActivity() {
    const today = todayKey();
    if (this.data.lastActivityDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (this.data.lastActivityDate === yesterdayKey) {
      this.data.streak += 1;
    } else if (this.data.lastActivityDate !== today) {
      this.data.streak = 1;
    }

    this.data.lastActivityDate = today;

    if (!this.data.activityDays.includes(today)) {
      this.data.activityDays.push(today);
      if (this.data.activityDays.length > 365) {
        this.data.activityDays = this.data.activityDays.slice(-365);
      }
    }

    this._save();
  }

  getStreak() {
    return this.data.streak;
  }

  getLastActivityDate() {
    return this.data.lastActivityDate;
  }

  replaceAll(data) {
    if (data) {
      this.data = { streak: 0, lastActivityDate: null, activityDays: [], ...data };
      this._save();
    }
  }
}
