# SayType — English Typing & Pronunciation Trainer

> A calm, editorial typing and pronunciation trainer for **Arabic speakers**. Listen-first learning, character-by-character typing, and a coherent learning platform with levels, topics, review, and progress tracking.

---

## What SayType Does

SayType is a listen-first English practice platform. The learning flow:

1. **Choose Level** — A1 (Beginner) or A2 (Elementary)
2. **Choose Topic** — Daily Life, Food & Drink, Technology, etc.
3. **Listen** — Hear the sentence pronounced naturally (typing stays locked)
4. **Type** — Character-by-character with live accuracy feedback
5. **Review** — Spaced repetition reinforces difficult words
6. **Track Progress** — Monitor your learning journey

---

## Pages & Navigation

| Route | Page | Description |
|-------|------|-------------|
| `#/` | Home | Welcome, continue learning, quick stats, topic shortcuts |
| `#/learn` | Learn | Level hub — choose A1 or A2 with progress bars |
| `#/practice` | Practice | Core typing arena (supports `?level=` and `?topic=` params) |
| `#/review` | Review | Spaced review dashboard — due words, learning, mastered |
| `#/progress` | Progress | Overall metrics, streak, activity breakdown |
| `#/profile` | Profile | Account info, learner stats |
| `#/settings` | Settings | Typing mode, speech rate, theme, sound |

Desktop: top navigation bar. Mobile: bottom navigation bar (hides during practice).

---

## Listen-First Learning

- A **user gesture** (Begin Lesson) unlocks browser speech permission.
- State machine: `LOADING → LISTENING → READY → TYPING → COMPLETED → RESULT`.
- Keystrokes are **rejected during LISTENING** — you must listen before typing.
- Auto-speech fallback: visible **Press Listen** prompt if browser blocks autoplay.
- On-demand listen: button or `Ctrl` / `⌘` + `Space`.

## Typing Modes

- **Strict (default):** wrong keystrokes don't advance the cursor until corrected.
- **Free:** wrong keystrokes are counted but the cursor advances.

Configurable in Settings. Character states (correct/current/wrong) are visually distinct with a breathing caret and soft-shake error animation.

## Word Dictionary

Hover (desktop) or tap (mobile) any word for an inline tooltip: word, part of speech, IPA pronunciation, Arabic translation, and usage example. Lookup: sentence metadata → bundled offline lexicon (~370 words) → graceful fallback.

---

## Content Architecture

### Levels

| Level | Sentences | Topics |
|-------|-----------|--------|
| A1 | 154 | 10 |
| A2 | 180 | 12 |

A2 includes all A1 topics plus **Technology** and **Emotions**. Future levels (B1, B2, C1) are architecturally supported — just add `sentences.b1.json`.

### Topics

**A1 (10):** Daily Life, Family & Friends, Food & Drink, Travel & Places, University & Study, Work & Career, Shopping & Numbers, Health & Body, Weather & Seasons, Communication

**A2 (12):** A1 topics + Technology, Emotions

Each topic shows real sentence counts and completion progress derived from the dataset.

---

## Spaced Review (Leitner System)

Words you mistype are scheduled for review using Leitner boxes with intervals of 10, 20, 40, and 80 sentences. After 4 successful reviews, a word is marked **mastered**.

- Every 10 sentences typed, up to 3 due words are injected into the lesson.
- Review outcomes (success/failure) update the Leitner box.
- Review page shows: Due Today, Learning, Mastered, Total Reviewed.

---

## Streak Tracking

A simple daily streak tracks consecutive learning days. Activity is recorded locally and syncs when authenticated. Timezone-safe: uses local date strings. Multiple activities on the same day count as one.

---

## User Accounts & Sync

### Guest Mode (default)
- Full learning experience, no login required.
- All progress stored in localStorage.

### Authenticated Mode
- Sign in with email/password via Supabase.
- Progress syncs across devices.
- Server-wins conflict resolution on returning devices.
- First-ever login uploads local state.

### Sync Rules
- Anonymous learning is always local.
- Login never destroys local progress.
- Merges compatible local + cloud progress.
- Favorites, review state, streak, and history all sync.

---

## Settings

| Setting | Options | Default |
|---------|---------|---------|
| Typing Mode | Strict, Free | Strict |
| Speech Rate | 0.5x – 1.5x | 1x |
| Sound Effects | On, Off | On |
| Theme | Dark, Light | Dark |

All preferences persist in localStorage.

---

## Architecture

Vanilla ES modules (client), CommonJS (server). Zero frontend dependencies except Supabase via ESM CDN.

```
client/
├── index.html              # SPA with page containers + navigation
├── styles/
│   ├── tokens.css          # Design tokens (Midnight Ink / Parchment)
│   ├── base.css            # Reset, layout, noise overlay
│   ├── components.css      # Training screen, modals, tooltip
│   └── pages.css           # Navigation, home, levels, review, progress, settings
└── js/
    ├── core/
    │   ├── Router.js           # Hash-based SPA router
    │   ├── EventEmitter.js     # Lightweight pub/sub
    │   ├── SentenceEngine.js   # Character matching, strict/free modes
    │   ├── MetricsCalculator.js
    │   └── SessionEngine.js    # Lesson lifecycle & state machine
    ├── services/
    │   ├── SentenceRepository.js   # API fetch + offline fallback
    │   ├── SpeechService.js        # Web Speech wrapper
    │   ├── ThemeService.js         # Dark/light theme
    │   ├── DictionaryService.js    # Offline word lexicon
    │   ├── ProgressService.js      # localStorage + Leitner review
    │   ├── ReviewScheduler.js      # Review sentence selection
    │   ├── StreakService.js        # Daily learning streak
    │   ├── SettingsService.js      # User preferences
    │   ├── AuthService.js          # Supabase auth
    │   ├── SyncService.js          # Local ↔ cloud sync
    │   └── SupabaseClient.js       # Supabase singleton
    └── ui/
        ├── TrainingScreen.js       # Core typing arena
        ├── StatsPills.js           # Live WPM/Accuracy/Mistakes
        ├── ProgressIndicator.js    # Header progress counter
        ├── LevelSelector.js        # Level dropdown
        ├── TopicSelector.js        # Topic dropdown
        ├── Navigation.js           # Desktop + mobile nav
        ├── DashboardScreen.js      # Home page
        ├── LevelScreen.js          # Level hub
        ├── TopicScreen.js          # Topic hub
        ├── ReviewScreen.js         # Review page
        ├── ProgressScreen.js       # Progress page
        ├── ProfileScreen.js        # Profile page
        ├── SettingsScreen.js       # Settings page
        └── AuthModal.js            # Sign in/up modal
server/
├── app.js                  # Express + static + REST API
├── controllers/            # Request handlers
├── repositories/           # Multi-file JSON repository
└── data/
    ├── sentences.a1.json   # 154 A1 sentences
    └── sentences.a2.json   # 180 A2 sentences
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm
- Modern browser with Web Speech API support

### Install & Run

```bash
git clone https://github.com/nour714/SayType.git
cd SayType
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### Test

```bash
npm test
```

36 tests: 18 server/API integration + 18 client unit tests.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl` / `⌘` + `Space` | Listen to pronunciation |
| `Esc` | Dismiss tooltip, close overlay, advance/restart modal |
| `Enter` / `Space` | Next sentence / restart when modal is open |

---

## Technology Stack

- **Frontend:** Vanilla ES modules, no framework
- **Backend:** Express 5, CommonJS
- **Database:** Supabase (optional, for sync)
- **Storage:** localStorage (guest mode)
- **Styling:** CSS custom properties, no preprocessor
- **Fonts:** Newsreader (hero), Inter (UI), JetBrains Mono (stats), Noto Naskh Arabic (translations)
- **Testing:** Node.js test runner (assert)

---

## Accessibility

- Full keyboard navigation with visible focus
- Focus trapping in modals and dialogs
- `aria` labels, `aria-current` for navigation, `aria-live` regions
- `prefers-reduced-motion` respected
- Screen-reader announcements for sentence loads
- Virtual keyboard support via hidden input anchor

---

## Known Limitations

- Browser speech voices vary by platform (Windows/macOS/mobile)
- Automatic speech may be blocked until user gesture (autoplay policy)
- Voice quality depends on OS-provided `speechSynthesis` voices
- No offline-first service worker yet (API fallback covers offline)

---

## License

MIT
