# SayType — English Sentence Typing & Pronunciation Trainer

> A calm, editorial-think typing and pronunciation trainer designed for **Arabic speakers**. Listen to an A1 English sentence, then type it character-by-character with live phonetic, vocabulary, and accuracy feedback.
>
> **Editorial Typographic Sanctuary** — a contemplative, archival English learning surface built with a modular, dependency-free architecture.

---

## What SayType Does

SayType is a listen-first English practice tool. For each sentence:

1. You **Listen** to a natural, deliberately paced English pronunciation.
2. Typing stays **locked** until pronunciation finishes.
3. You **Type** the sentence character-by-character.
4. Wrong keystrokes are caught and corrected in place.
5. On completion you get live **WPM**, **Accuracy**, and **Mistakes** metrics.
6. Progress and favorites persist locally across visits.

The learner interface is minimal and focused — the sentence is the central visual element, not a dashboard.

---

## Listen-First Learning

- The first interaction is a **user gesture** (Begin Lesson) — this unlocks browser speech permission and starts the audio flow.
- Sentences transition through a clear state machine: `LOADING → LISTENING → READY → TYPING → COMPLETED → RESULT`, with a visible state badge (**LISTEN FIRST / TYPE NOW / TYPING / COMPLETED**).
- Keystrokes are **rejected during LISTENING** to enforce listening before typing.
- If automatic speech is unavailable or blocked by autoplay policy, a visible **pressed-LISTEN fallback** appears so the learner is never stranded.
- Listen is also available on demand via the on-screen button or `Ctrl` / `⌘` + `Space`.

## Typing Modes

- **Strict (default):** stop-at-error — a wrong keystroke does not advance the cursor until corrected with Backspace.
- **Free:** wrong keystrokes are counted and marked but the cursor advances (extension hook; driven by `SentenceEngine.setTypingMode`).

Correct, current, and incorrect characters are visually distinct, with a breathing caret and subtle soft-shake feedback on errors (respects `prefers-reduced-motion`).

## Word Dictionary

- Hover (desktop) or tap (mobile) any word to open an inline **tooltip** showing the word, its part of speech, IPA-style pronunciation, **Arabic translation**, and the sentence itself as a usage example.
- Tooltip stays in the viewport, dismisses on Escape / outside interaction / next character, and never blocks typing.
- Lookup order: the sentence's own word metadata → a large bundled offline **lexicon** (~370 entries) → graceful empty fallback. No paid or remote dictionary API.

## Topics

154 A1 sentences across exactly **10 topics**, each with per-word metadata and curated Arabic translations. Only topics that have real content are shown; counts match the real dataset.

- Daily Life (20) · Family & Friends (16) · Food & Drink (17) · Travel & Places (16) · University & Study (16) · Work & Career (16) · Shopping & Numbers (14) · Health & Body (14) · Weather & Seasons (10) · Communication (15)

Switching a topic cancels speech, resets typing and lesson progress, loads the first sentence, and pronounces it with typing locked until speech ends. Empty/offline sets show a calm empty state instead of a spurious "lesson complete".

## Progress Persistence

All learner data is stored locally in `localStorage` (no login, no remote database):

- Completed sentences & count
- Best / average WPM
- Average accuracy
- Total mistakes
- Favorite sentences
- Difficult words (repeated mistake tracking)

Favorites, progress, difficult words, best WPM, and average accuracy all survive a browser refresh. Restarting a lesson does **not** erase learner history. If `localStorage` is unavailable, an in-memory fallback keeps the app fully functional.

## Speech Technology

- Uses the native **Web Speech API** (`speechSynthesis`) — no paid API, no external service.
- Prefers natural English voices, `en-US`, at a deliberate `0.88×` learning cadence.
- Guards against overlapping playback and duplicate `end` events, includes a timeout watchdog, and degrades to the Listen fallback when unsupported.
- Browser voices vary by platform (Windows, macOS, mobile); narration cadence and voice choice therefore differ across devices.

## Architecture

Clean, decoupled, dependency-free (no React/Vue/Tailwind/Firebase). Vanilla ES modules + a small Express REST backend with a repository pattern.

```
├── client/
│   ├── index.html              # Semantic, accessible structure (dark/light themes)
│   ├── styles/
│   │   ├── tokens.css          # Design-system tokens (dark "espresso" / light "book paper")
│   │   ├── base.css            # Reset, layout shell, noise overlay, reduced-motion
│   │   └── components.css      # Vessel, sentence, dock, modals, tooltip, responsive
│   └── js/
│       ├── core/
│       │   ├── EventEmitter.js         # Tiny pub/sub
│       │   ├── SentenceEngine.js       # Character matching, strict/free modes
│       │   ├── MetricsCalculator.js    # Live WPM, accuracy, mistakes
│       │   └── SessionEngine.js        # Lesson lifecycle & state machine
│       ├── services/
│       │   ├── SentenceRepository.js   # API fetch + offline fallback dataset
│       │   ├── SpeechService.js        # Web Speech wrapper (cancel-safe)
│       │   ├── ThemeService.js         # Dark/light theme & persistence
│       │   ├── DictionaryService.js    # Offline word lexicon
│       │   └── ProgressService.js      # localStorage progress + favorites
│       ├── ui/
│       │   ├── TrainingScreen.js       # Typing arena, tooltip, modals
│       │   ├── StatsPills.js           # Live stats dock
│       │   ├── ProgressIndicator.js    # Level + progress breadcrumbs
│       │   └── TopicSelector.js        # Topic dropdown
│       └── app.js              # Pure assembly entry
├── server/
│   ├── app.js                  # Express app (static + REST API)
│   ├── routes/                 # /api/sentences router
│   ├── controllers/            # Request/response handling
│   ├── repositories/           # Repository pattern (JSON now → DB later)
│   └── data/sentences.a1.json  # 154 A1 sentences, 10 topics, word metadata
└── tests/
    ├── server.test.js          # Server & API integration tests
    └── client.test.mjs         # Core engine / service unit tests
```

**Offline behavior:** if the API is unreachable, the client falls back to a bundled representative dataset and fallback topic list, so the app still works.

## Getting Started

### Prerequisites
- Node.js v18+
- npm

A modern browser that supports the Web Speech API (`speechSynthesis`) is recommended for audio.

### Install & Run

```bash
git clone https://github.com/nour714/SayType.git
cd SayType
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The server serves both the REST API and the client statics.

### Test

```bash
npm test
```

Runs the server/API integration suite and the client core unit suite.

## Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl` / `⌘` + `Space` | Listen to current sentence pronunciation |
| `Esc` | Resets current sentence (or dismisses tooltip if open) |
| `Enter` / `Space` / `Esc` | Advance / restart when a dialog is open |

## Accessibility & Known Limitations

- Full keyboard navigation, visible focus, focus-trapping within dialogs, Escape handling, live-region screen-reader announcements, and `aria` labels/pressed states.
- The typing anchor is a visually hidden input; virtual keyboards on mobile are captured via its input events.
- **Known browser limitation:** automatic (autoplay) speech is restricted on many browsers until the learner performs the Begin Lesson gesture; a visible Listen fallback covers this.
- Voice/pronunciation quality depends on the OS-provided `speechSynthesis` voices.

## License
MIT