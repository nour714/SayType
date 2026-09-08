---
name: Editorial Typographic Sanctuary
colors:
  surface: '#141312'
  surface-dim: '#141312'
  surface-bright: '#3a3938'
  surface-container-lowest: '#0f0e0d'
  surface-container-low: '#1c1b1a'
  surface-container: '#211f1e'
  surface-container-high: '#2b2a28'
  surface-container-highest: '#363433'
  on-surface: '#e6e1df'
  on-surface-variant: '#dbc1b2'
  inverse-surface: '#e6e1df'
  inverse-on-surface: '#32302f'
  outline: '#a38c7e'
  outline-variant: '#554337'
  surface-tint: '#ffb785'
  primary: '#ffb785'
  on-primary: '#502500'
  primary-container: '#d97724'
  on-primary-container: '#461f00'
  inverse-primary: '#954a00'
  secondary: '#9dd0cd'
  on-secondary: '#003735'
  secondary-container: '#1d514f'
  on-secondary-container: '#8fc2bf'
  tertiary: '#e9c349'
  on-tertiary: '#3c2f00'
  tertiary-container: '#cca72f'
  on-tertiary-container: '#4e3d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc6'
  primary-fixed-dim: '#ffb785'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#713700'
  secondary-fixed: '#b9ece9'
  secondary-fixed-dim: '#9dd0cd'
  on-secondary-fixed: '#00201f'
  on-secondary-fixed-variant: '#1a4e4c'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#141312'
  on-background: '#e6e1df'
  surface-variant: '#363433'
typography:
  sentence-hero:
    fontFamily: Newsreader
    fontSize: 38px
    fontWeight: '400'
    lineHeight: 58px
    letterSpacing: -0.01em
  sentence-hero-mobile:
    fontFamily: Newsreader
    fontSize: 26px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.005em
  sentence-arabic-sub:
    fontFamily: Noto Serif
    fontSize: 22px
    fontWeight: '400'
    lineHeight: 38px
    letterSpacing: '0'
  sentence-arabic-sub-mobile:
    fontFamily: Noto Serif
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: '0'
  display-roman:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.015em
  body-reading:
    fontFamily: Newsreader
    fontSize: 19px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.005em
  body-ui:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.01em
  body-ui-strong:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-stats:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  phonetic-mono:
    fontFamily: Newsreader
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
  space-2xl: 3.5rem
  space-3xl: 5rem
  stage-max-width: 760px
  reading-gutter-desktop: 3rem
  reading-gutter-mobile: 1.25rem
---

## Brand & Style

This design system delivers a quiet, scholarly haven for Arabic speakers mastering English through focused reading and deliberate sentence typing. The interface rejects gamified, frenetic language-learning tropes—dispensing with neon streaks, aggressive badges, and cartoonish mascots. Instead, it embodies the calm, meditative atmosphere of a private library, pairing archival book craft with modern precision tools.

### Brand Personality & Emotional Tenor

- **Contemplative & Archival:** The screen feels like aged stock, ink, and binding thread. It evokes the stillness of an uninterrupted reading session.
- **Dignified & Unrushed:** Learning is treated as an intellectual pursuit. Errors are soft deviations, not loud penalizing alerts; successes settle smoothly into place.
- **Bilingual Equilibrium:** English (the subject of study) and Arabic (the anchor of understanding) hold deliberate typographic balance. Neither language feels subordinated or awkwardly retrofitted.

### Design Style

An organic hybrid of **Editorial Archival Minimalism** and **Tactile Bookcraft**. Surfaces rely on delicate fiber-like paper tones, warm espresso inks, hairline rule-lines (`0.5px` to `1px`), and warm, muted glowing focus rings that resemble ink soaking subtly into laid paper.

## Colors

The palette draws directly from bookbinding materials: bookbinder board, raw sienna ink, patinated bronze teal, and warm rag paper. The default mode is **dark** ("Warm Espresso"), calibrated to reduce eye strain during extended night reading and typing sessions, complemented by an equally refined "Warm Cream Book Paper" light mode.

### Dark Mode (Default)

- **Base Canvas (`#141312`):** Deep charcoal steeped in warm espresso bean tones.
- **Surface Elevation 1 (`#1C1B1A`):** Low-contrast resting cards and sentence vessels.
- **Surface Elevation 2 (`#242220`):** Elevated reading blocks, glosses, and active drawer plates.
- **Text & Ink Hierarchy:**
  - Primary Hero Text: `#F5F2EC` (Warm archival vellum ink).
  - Secondary Text / Arabic Subtext: `#BFB8AA` (Parchment grey).
  - Muted Inactive / Glyphs: `#6B665E` (Dry graphite).

### Light Mode (Warm Cream Paper)

- **Base Canvas (`#FAF8F5`):** Unbleached book rag paper.
- **Surface Elevation 1 (`#F3EFEA`):** Pressed deckle-edge card surfaces.
- **Surface Elevation 2 (`#EAE3DA`):** Inset typing gutters and tool trays.
- **Text & Ink Hierarchy:**
  - Primary Hero Text: `#1C1B1A` (Dense iron gall ink).
  - Secondary Text / Arabic Subtext: `#544E47` (Warm walnut).
  - Muted Inactive: `#9E9689` (Faded stamp ink).

### Accent & Feedback Inks

- **Raw Sienna Primary (`#D97724`):** Focal anchor. Used for active typing cursors, phoneme accents, and key interactive touchpoints.
- **Bronze Teal Secondary (`#2A5C5A`):** Grammar markers, morphology breakdowns, and parts of speech.
- **Warm Gold Tertiary (`#D4AF37`):** Mastery milestones, retention markers, and review markers.
- **Ink Feedback (Typing Accuracy):**
  - _Correct Strike:_ Settles into Primary Hero Ink (`#F5F2EC` in dark, `#1C1B1A` in light) with a micro-glow of `#D9772433`.
  - _Deviant Strike:_ Muted terracotta wash (`#8C3827`), avoiding abrasive red alarms.

## Typography

Typography is the absolute core of the experience. The typography stack balances optical beauty with linguistic precision.

### Typographic Roles

1. **The Hero Sentence (Newsreader):** Set with high optical care, italicized alternatives for stress patterns, and gentle tracking. It breathes at the center of the viewport, inviting rhythmic reading and keystrokes.
2. **The Arabic Counterpart (Noto Serif / Amiri):** Arabic requires generous vertical clearance and appropriate leading to prevent mark clipping. Set at roughly 1.15x to 1.25x line-height compared to Latin script.
3. **The Utility Shell (Plus Jakarta Sans):** Low-noise geometric sans handles progress ratios, speed metrics (WPM), vocabulary frequency flags, and navigation chrome.
4. **Phonetic & Grammar Layer (Newsreader Italic):** Used for IPA transcriptions, root-word etymology, and syntactic part-of-speech notations.

## Layout & Spacing

The layout is built around a **Contemplative Focus Stage** rather than dense multi-column dashboard layouts.

### Structure & Grid Philosophy

- **The Stage:** All core interaction happens within a central column constrained to a maximum width of `760px`. This keeps Latin line lengths under 70 characters and ensures the Arabic translation rests squarely within the reader’s peripheral gaze.
- **Vertical Spacing Rhythm:** Generous vertical intervals (`space-2xl` and `space-3xl`) isolate the active sentence from distracting meta-controls. Secondary metadata sits at the edges of the perimeter.
- **Breakpoints:**
  - **Mobile (< 640px):** Single-column layout. The central stage takes full width with `reading-gutter-mobile` padding. Ambient stats compress to a quiet bottom dock.
  - **Tablet (641px - 1024px):** Fixed stage width (`620px`). Arabic context and English hero sentence stack with comfortable `space-xl` separation.
  - **Desktop (> 1025px):** Stage expands to `760px`. Peripheral annotations (etymology drawer, syntax tags) reveal themselves in muted margins without pushing or shifting the typing track.

## Elevation & Depth

This system avoids synthetic drop shadows, elevated gloss, and high-contrast layered cards. Depth is produced purely through **surface tint shifts, ruled hairlines, and ambient backlights**.

### Depth Layers

- **Ground (Canvas):** Pure resting plane (`#141312` dark / `#FAF8F5` light).
- **Inlaid Wells (The Typing Track):** Recessed rather than elevated. The typing arena utilizes a slightly deepened hue with soft inset borders (`1px solid rgba(255, 255, 255, 0.04)` in dark; `1px solid rgba(0, 0, 0, 0.05)` in light) indicating a carved plate ready to receive ink.
- **Floating Annotations (Lexical Slates):** When a word is inspected, its dictionary slate emerges with an ambient glow:
  - _Dark Mode:_ `box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(217, 119, 36, 0.12);`
  - _Light Mode:_ `box-shadow: 0 12px 32px -4px rgba(28, 27, 26, 0.08), 0 0 0 1px rgba(192, 94, 18, 0.15);`

## Shapes

The design uses **Soft (Level 1)** geometry, drawing inspiration from trimmed paper folios, leather ledger corners, and physical index cards.

- **Base Radius (`0.25rem` / `4px`):** Used for micro-badges, grammar chips, and subtle focus outlines.
- **Container Radius (`0.5rem` / `8px`):** Used for typing surfaces, lexeme inspection popovers, and translation cards.
- **Pill Exceptions (`9999px`):** Strictly reserved for persistent status tags (e.g., CEFR level pills like `B2`, cadence pacing pills, or audio speed selectors).

## Components

### Hero Typing Surface

- **Container:** Framed by a delicate `1px` border with `0.25rem` radius. Never looks like an HTML `<textarea>`.
- **Ghost Target Text:** Rendered in `sentence-hero` at `35%` opacity in dry graphite ink.
- **Carret / Beam:** An amber sienna cursor (`#D97724`), `2.5px` wide, with a faint breathing glow (`0 0 8px rgba(217, 119, 36, 0.45)`).
- **Arabic Mirror Strip:** Situated directly beneath or above the active typing track, rendered in `sentence-arabic-sub` using `Noto Serif` with directional text isolation (`dir="rtl"`).

### Word-Level Grammar Chips

- **Resting:** Micro-pill with subtle hairline border (`rgba(255, 255, 255, 0.08)` in dark), transparent background, uppercase label (`label-caps`).
- **Interactive:** Hovering or tabbing illuminates the chip in bronze teal (`#2A5C5A`), revealing the Arabic root meaning in a calm tooltip.

### Action Buttons & Keystroke Triggers

- **Primary Action (Commit / Next Cadence):** Minimal fill in Raw Sienna (`#D97724`), text in deep charcoal (`#141312`), font `body-ui-strong`. No harsh gradients. Micro-interaction: `transform: translateY(1px)` on active press.
- **Secondary (Audio Pronunciation, Loop Segment):** Transparent surface with subtle border, shifting to `#242220` (dark) or `#EAE3DA` (light) on hover.

### Inputs & Translation Drawers

- Text fields use no background fill; only an active bottom baseline border that transitions from muted graphite to raw sienna upon entry.
- Lexical drawer slides from the stage base with clean horizontal hairline separators (`0.5px solid rgba(255, 255, 255, 0.08)`).

### Quiet Progress & Metronome Indicators

- A continuous, ultra-thin progress thread (`1.5px`) anchored at the top or base of the stage container.
- WPM, Accuracy, and Rhythm statistics are displayed in low-contrast, non-blinking `label-stats`, prioritizing undisturbed focus over high-intensity gamification.
