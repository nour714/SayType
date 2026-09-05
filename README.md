# SayType — English Sentence Typing & Pronunciation Trainer

> **Editorial Typographic Sanctuary** — A contemplative, archival English sentence typing and pronunciation trainer designed for Arabic speakers. Master rhythm, accuracy, and phonetics in an editorial sanctuary.

---

## ✨ Features

- **Contemplative Editorial Design**: Deep, warm espresso dark mode with warm book paper light mode based on curated design tokens.
- **Strict Stop-at-Error Typing**: Char-by-char validation locks on wrong keystrokes to cultivate accurate muscle memory.
- **Phonetic Pronunciation Audio**: Integrated Web Speech API playback tuned for deliberate English learning cadence (`0.88x` rate).
- **Real-Time Live Metrics**: Dynamic calculation of WPM (Words Per Minute), Accuracy percentage, and Mistakes count.
- **Arabic Translation Subtext**: Elegant dual-language display with Noto Serif Arabic whisper mirror.
- **Session & Milestone Progression**: Per-sentence completion breakdown and full 10-sentence lesson aggregate review.
- **Clean Modular Architecture**: Decoupled core engines, services, UI views, and Express backend with repository pattern.

---

## 🏛️ Project Architecture

```
├── client/
│   ├── index.html              # HTML structure with semantic accessibility
│   ├── styles/
│   │   ├── tokens.css          # Design system tokens (dark/light CSS variables)
│   │   ├── base.css            # Layout shell, resets, noise overlay
│   │   └── components.css      # Vessel, hero sentence, buttons, dock, modals
│   └── js/
│       ├── core/
│       │   ├── EventEmitter.js         # Pub/sub communication
│       │   ├── SentenceEngine.js       # Char matching & stop-at-error logic
│       │   ├── MetricsCalculator.js    # Live WPM & accuracy calculator
│       │   └── SessionEngine.js        # Lesson cycle & event orchestrator
│       ├── services/
│       │   ├── SentenceRepository.js   # API fetcher with static JSON fallbacks
│       │   ├── SpeechService.js        # Speech synthesis wrapper
│       │   └── ThemeService.js         # Dark/light theme state & persistence
│       ├── ui/
│       │   ├── TrainingScreen.js       # Typographic arena & modal dialogs
│       │   ├── StatsPills.js           # Floating live stats dock
│       │   └── ProgressIndicator.js    # Breadcrumb level & progress counter
│       └── app.js              # Pure assembly entry point
├── server/
│   ├── app.js                  # Express application serving client & API
│   ├── routes/
│   │   └── sentences.routes.js # REST API router
│   ├── controllers/
│   │   └── sentences.controller.js # Request/response controller
│   ├── repositories/
│   │   └── sentences.repository.js # Data access layer (JSON now → DB later)
│   └── data/
│       └── sentences.a1.json   # 10 foundational A1 English-Arabic sentences
└── tests/
    ├── client.test.mjs         # Client core unit tests
    └── server.test.js          # Server & API integration tests
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/nour714/SayType.git
cd SayType

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```bash
npm test
```

---

## ⌨️ Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl` + `Space` / `⌘` + `Space` | Listen to current sentence pronunciation |
| `Esc` | Reset current sentence |
| `Enter` / `Space` | Advance to next sentence (when modal is open) |

---

## 📄 License
MIT
