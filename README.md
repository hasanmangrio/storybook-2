# Field Notes — A Private Journal

A beautiful personal journal web application where memories float as cards on a warm paper canvas.

## Features

- **The Garden** — journal entries drift as floating cards with independent sine-wave motion and cursor parallax. Each card's headline tells the story.
- **The Reader** — clicking a card FLIP-animates it from its exact screen position into a centered reading panel, with body text fading in line by line.
- **The Page** — a fullscreen composer that morphs from the `+` button. Mood selector tints the paper. Breathing aura pulses during pauses. Typing produces soft ripple micro-animations.

## Stack

Vite + React. No UI libraries or animation dependencies — all motion runs via CSS transitions and `requestAnimationFrame` loops writing CSS custom properties directly to DOM nodes.

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Building

```bash
npm run build
```
