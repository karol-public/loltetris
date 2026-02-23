# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LOLTetris is a cat-themed Tetris game built with vanilla JavaScript, HTML5 Canvas, and CSS3. Zero dependencies, no build system.

## Running the Game

Open `index.html` in a browser. No install or build step needed.

## Architecture

Single-file game engine (`game.js`, ~980 lines) with class-based architecture:

- **Tetromino** — Piece data (shape matrix, color, position) with `rotate()` and `clone()`
- **Grid** — 10x20 board state, collision detection (`isValidPosition`), line clearing
- **Renderer** — Canvas 2D drawing: blocks, ghost piece, particles, drop trails. Dynamically calculates block size for responsive layout
- **Particle** — Line-clear visual effects with lifetime/velocity/gravity
- **Input** — Keyboard (arrows/space/C/Escape) and touch/swipe controls with haptic feedback
- **Game** — Main controller: game loop (requestAnimationFrame with delta time), state management, scoring, lock delay mechanics, hold/next piece, combo system

`SHAPES` constant at top of file defines all 7 tetromino types with their rotation matrices and colors.

## Key Mechanics

- Lock delay: 500ms after piece touches ground, resets on successful move/rotate
- Line clear animation: 400ms flashing before removal
- Scoring: base points (40/100/300/1200 for 1-4 lines) × level + combo bonus
- Level up every 10 lines; gravity speeds from 1000ms to 100ms
- Cat reward images vary by clear type (laser eyes for Tetris, grumpy for game over)

## Code Style

- 2-space indentation, semicolons, camelCase
- No linter/formatter configured
- Font: Comic Sans MS / Chalkboard SE (intentional LOL aesthetic)

## File Layout

- `game.js` — All game logic
- `style.css` — Layout and theming (pink/white color scheme, glass effects, responsive mobile/desktop)
- `index.html` — DOM structure
- `assets/` — Cat SVGs and JPGs for rewards
