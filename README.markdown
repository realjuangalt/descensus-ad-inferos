# Cosmic Defender

## Overview
**Cosmic Defender** is a browser-based, mobile-optimized arcade shooter inspired by classic space defense games. Players control a spaceship to fend off waves of enemies using two weapons (a gun with infinite ammo and bombs with limited ammo), aiming for a high score. The game features an emulator-like architecture, with `index.html` acting as a reusable "console" providing a canvas and input controls, and `game.js` implementing the game logic as a "cartridge." Designed for seamless play on mobile devices with touch controls, it also supports keyboard and mouse inputs for desktop users.

## Features
- **Mobile-First Design**: Intuitive touch controls with dual joysticks for movement and aiming, plus an action button for weapon switching.
- **Cross-Platform Support**: Playable on mobile (touch) and desktop (WASD, mouse, space bar) with consistent gameplay.
- **Engaging Gameplay**: Defeat enemies, manage ammo, and aim for high scores with simple yet addictive mechanics.
- **Smooth Performance**: Optimized for 60 FPS on mid-range mobile devices using lightweight canvas rendering.
- **Modular Architecture**: The `Interface` class in `index.html` supports swapping `game.js` with other games, enabling extensibility.
- **In-Canvas UI**: Score and ammo displayed within the canvas for a cohesive experience.

## Installation

### Prerequisites
- A modern web browser (e.g., Chrome, Safari, Firefox) with JavaScript enabled.
- A local web server (optional, for development) such as `npx serve`, `python -m http.server`, or any static file server.
- No external dependencies are required, as the game runs entirely client-side.

### Setup
1. **Clone or Download the Repository**:
   ```bash
   git clone <repository-url>
   cd cosmic-defender
   ```
   Alternatively, download the ZIP file and extract it.

2. **File Structure**:
   Ensure the following files are in the project directory:
   - `index.html`: The main interface file.
   - `game.js`: The game logic for Cosmic Defender.
   - `README.md`: This file.
   - `LICENSE`: The license file.

3. **Serve the Files**:
   - **Option 1: Local Server** (recommended for development):
     ```bash
     npx serve
     ```
     Or use Python:
     ```bash
     python -m http.server 8000
     ```
     Access the game at `http://localhost:8000` (or the port provided by your server).
   - **Option 2: Open Directly**:
     Open `index.html` in a browser using the `file://` protocol (e.g., `file:///path/to/cosmic-defender/index.html`). Note: Some browsers may restrict features when using `file://`.

4. **Play**:
   - On **mobile**, use the left joystick to move, the right joystick to aim and shoot, and the "B" button to toggle weapons.
   - On **desktop**, use WASD to move, mouse to aim, left-click to shoot (hold for auto-shoot), and space bar to toggle weapons.
   - Tap/click the canvas to restart after a game over.

## Usage
- **Game Objective**: Destroy enemies to earn points (10 for gun kills, 15 for bomb kills). Avoid collisions with enemies to survive.
- **Controls**:
  - **Mobile**:
    - Left Joystick: Move the player (constant speed of 2).
    - Right Joystick: Aim and auto-shoot when deflected (speed varies by deflection).
    - "B" Button: Toggle between Gun (infinite ammo) and Bomb (limited ammo).
  - **Desktop**:
    - WASD: Move the player (constant speed of 5).
    - Mouse: Aim (cursor position).
    - Left Mouse Click: Auto-shoot when held.
    - Space Bar: Toggle weapons.
  - **Restart**: Tap/click the canvas when the "GAME OVER" screen appears.
- **Scoring**:
  - Gun kill: +10 points.
  - Bomb kill: +15 points.
  - Enemy escapes: -5 points.
- **Ammo**: Gun has infinite ammo; Bombs are limited (starts with 5, decrements on use).

## Development
To create a new game compatible with the `Interface` class:
1. **Understand the Interface**:
   - The `Interface` class in `index.html` provides a canvas (`ui.canvas`, `ui.ctx`) and callbacks: `onMove`, `onAim`, `onShoot`, `onAction`, `onRestart`, `onResize`.
   - See the [Interface Schema](#) for details (available in the project documentation).
2. **Create a New Game**:
   - Write a `game.js` file with a class (e.g., `MyGame`) that accepts `ui` and implements the required callbacks.
   - Use `ui.ctx` for rendering and `ui.canvas` for bounds.
   - Example template:
     ```javascript
     class MyGame {
       constructor(ui) {
         this.ui = ui;
         this.player = { x: ui.canvas.width / 2, y: ui.canvas.height - 50 };
         this.init();
       }
       init() {
         this.ui.setCallback('onMove', (dx, dy, isMobile) => this.handleMove(dx, dy, isMobile));
         // Register other callbacks
         this.loop();
       }
       // Implement handlers, update, render, loop
     }
     const game = new MyGame(ui);
     ```
3. **Test**:
   - Replace `game.js` with your new file and serve the project.
   - Ensure all visuals stay within the canvas and inputs work across mobile and desktop.

## Contributing
Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit changes (`git commit -m "Add feature"`).
4. Push to the branch (`git push origin feature-name`).
5. Open a pull request with a detailed description.

Please ensure code adheres to the existing style and includes tests where applicable. For major changes, open an issue first to discuss.

## License
This project is proprietary software. **All Rights Reserved**. See the [LICENSE](./LICENSE) file for details.

## Contact
For questions, bug reports, or feature requests, please open an issue on the repository or contact the project maintainer at [your-email@example.com].

---

*Built with love for retro arcade gaming!*