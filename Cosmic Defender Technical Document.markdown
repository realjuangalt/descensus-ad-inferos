# Technical Document: Cosmic Defender

## 1. Introduction
"Cosmic Defender" is a browser-based, mobile-optimized arcade shooter inspired by classic space defense games. The project aims to deliver a lightweight, engaging experience with intuitive touch controls for mobile devices while supporting keyboard and mouse inputs for desktop play. The design adopts an **emulator-like architecture**, where `index.html` serves as a reusable "console" providing a standardized interface (canvas and controls), and `game.js` acts as a self-contained "game cartridge" implementing the core game logic. This document details the design intention, system architecture, interaction model, and implementation specifics.

## 2. Design Intention

### 2.1 Primary Goals
The design of "Cosmic Defender" is driven by the following objectives:
- **Mobile-First Experience**: Create a seamless, touch-based game optimized for mobile browsers, prioritizing intuitive controls and responsive performance.
- **Modular Architecture**: Separate the interface (`index.html`) from game logic (`game.js`) to mimic a Game Boy-like system, enabling easy swapping of games without modifying the core interface.
- **Engaging Gameplay**: Deliver a simple yet addictive shooter where players defend against enemies using two weapons (gun with infinite ammo, bomb with limited ammo), collect powerups, and aim for a high score.
- **Cross-Platform Support**: Ensure compatibility with both mobile (touch) and desktop (keyboard/mouse) inputs, providing a consistent experience across devices.
- **Performance**: Achieve smooth rendering at 60 FPS within the canvas, even on lower-end mobile devices, using simple shapes and optimized logic.
- **Extensibility**: Design the interface to support future games by providing a clear input and rendering contract.

### 2.2 Success Criteria
- Players can move, aim, shoot, and toggle weapons using touch joysticks and a button on mobile, or WASD, mouse, and space bar on desktop.
- All game visuals (player, enemies, bullets, score, ammo) are rendered within the canvas, with no external DOM dependencies for gameplay elements.
- The game runs at 60 FPS on mid-range mobile devices (e.g., 2018-era smartphones).
- The `Interface` class is reusable for other games with minimal modifications, requiring only a new `game.js` implementation.
- The game is playable without server dependencies, using static file hosting.

### 2.3 Design Philosophy
The emulator-like architecture draws inspiration from retro gaming consoles, where the hardware (interface) is fixed, and games are interchangeable cartridges. This philosophy:
- **Promotes Reusability**: The `Interface` class handles all input and canvas setup, allowing developers to focus on game mechanics.
- **Ensures Consistency**: Standardized inputs (move, aim, shoot, action) provide a familiar control scheme across games.
- **Simplifies Development**: By abstracting input handling, developers can write game logic without worrying about touch or keyboard nuances.
- **Enhances Maintainability**: Changes to input handling (e.g., adding new controls) can be made in `index.html` without affecting existing games.

## 3. System Architecture

### 3.1 Components
The system is divided into two main components:

#### 3.1.1 `index.html` (The Interface/Console)
- **Role**: Acts as the "console," providing a canvas for rendering and a unified input system for mobile and desktop.
- **Structure**:
  - **HTML**: Contains a `<canvas id="canvas">` for gameplay, a header (`<div id="header">`), and mobile controls (`#move` joystick, `#aim` joystick, `#action` button).
  - **CSS**: Styles the canvas, joysticks, and button, ensuring a mobile-friendly layout with a fixed bottom control bar.
  - **JavaScript**: Defines the `Interface` class, which manages canvas resizing, input capture, and callback dispatching.
- **Key Features**:
  - **Canvas Management**: Dynamically resizes the canvas to fit the viewport (`max-width: 400px`, `max-height: 60vh`) and notifies the game via `onResize`.
  - **Input Handling**:
    - **Mobile**: Two touch joysticks (move and aim) and an action button. The move joystick outputs normalized directions (-1 to 1), and the aim joystick provides canvas coordinates and shooting triggers.
    - **Desktop**: WASD for movement, mouse for aiming, left-click for shooting (auto-shoot when held), and space bar for actions.
  - **Callback System**: Exposes `setCallback` to register game handlers for `onMove`, `onAim`, `onShoot`, `onAction`, `onRestart`, and `onResize`.

#### 3.1.2 `game.js` (The Game/Cartridge)
- **Role**: Implements the "Cosmic Defender" game, handling all logic, state, and rendering within the canvas.
- **Structure**:
  - Defines a `CosmicDefenderGame` class that accepts the `ui` (Interface instance) as a constructor parameter.
  - Manages state: player position, bullets, enemies, score, weapon mode (Gun/Bomb), and ammo.
  - Implements game loop: `update` (state updates) and `render` (drawing to `ui.ctx`).
- **Key Features**:
  - **Player Mechanics**: Moves constantly in the last input direction (speed: 2 for mobile, 5 for keyboard), aims via joystick/mouse, and shoots with auto-shoot enabled.
  - **Gameplay**: Spawns enemies, handles collisions, updates score (10 for gun kills, 15 for bomb kills), and manages game-over state.
  - **Rendering**: Draws player, bullets, enemies, score, and ammo on the canvas using simple shapes (circles) and text.

### 3.2 Interaction Model
The interaction between `index.html` and `game.js` follows a clear contract:

#### 3.2.1 Initialization
- **index.html**:
  1. Creates an `Interface` instance (`ui`).
  2. Calls `resizeCanvas` to set initial canvas dimensions.
  3. Loads `game.js` dynamically via a `<script>` tag.
  4. Passes `ui` to the game’s constructor.
- **game.js**:
  1. Instantiates `CosmicDefenderGame` with `ui`.
  2. Sets initial player position (`x: canvas.width / 2, y: canvas.height - 50`).
  3. Registers callbacks for all input events.
  4. Starts the game loop with `requestAnimationFrame`.

#### 3.2.2 Input Handling
- **index.html**:
  - Captures touch (joysticks, button), keyboard (WASD, space), and mouse (movement, clicks) inputs.
  - Translates inputs into normalized values:
    - `onMove`: `dx`, `dy` (-1 to 1) for direction, `isMobile` flag.
    - `onAim`: `x`, `y` in canvas coordinates.
    - `onShoot`: `dist` (0 to 1) for intensity, `isActive` for continuous input.
    - `onAction`: No parameters.
    - `onRestart`: No parameters.
  - Calls registered callbacks with these values.
- **game.js**:
  - `handleMove`: Stores `dx`, `dy` and `isMobile` for constant movement.
  - `handleAim`: Stores aim coordinates for shooting direction.
  - `handleShoot`: Fires bullets if `autoShoot` is true and `isActive`, respecting cooldown.
  - `handleAction`: Toggles weapon mode.
  - `handleRestart`: Resets game state.
  - `handleResize`: Repositions player to stay within canvas.

#### 3.2.3 Rendering
- **game.js**:
  - Clears the canvas each frame using `ui.ctx.clearRect`.
  - Draws all game elements (player, bullets, enemies, score, ammo) using `ui.ctx` methods (e.g., `arc`, `fillText`).
  - Uses `ui.canvas.width` and `ui.canvas.height` for positioning and clamping.
- **index.html**:
  - Provides the canvas context (`ui.ctx`) but does not render anything itself.

#### 3.2.4 Data Flow
```
[index.html]                         [game.js]
   |---(creates ui: Interface)         |
   |---(resizes canvas)                |
   |---(loads game.js)                 |
   |                                    |---(new CosmicDefenderGame(ui))
   |                                    |---(sets player at canvas.width/2, height-50)
   |                                    |---(registers callbacks)
   |                                    |---(starts loop)
   |                                    |
   |---(captures inputs)               |
   |    - Joystick: dx, dy, aim, shoot |
   |    - Keyboard: WASD, space        |
   |    - Mouse: aim, shoot, restart   |
   |---(calls callbacks)-------------->|----(updates state: move, shoot, etc.)
   |                                    |----(renders to ui.ctx)
   |---(on resize)-------------------->|----(repositions player)
```

## 4. Implementation Details

### 4.1 `index.html` Implementation
- **Canvas Setup**:
  - Canvas size is set to `Math.min(400, window.innerWidth * 0.9)` for width and `Math.min(600, window.innerHeight * 0.6)` for height, ensuring mobile compatibility.
  - `resizeCanvas` is called on `window.resize` and during `Interface` initialization.
- **Mobile Controls**:
  - **Move Joystick**: Outputs normalized `dx`, `dy` (-1 to 1) when deflected beyond a 0.2 threshold, providing 360-degree movement.
  - **Aim Joystick**: Outputs proportional `dx`, `dy` for aiming (converted to canvas coordinates) and `dist` (> 0.3) for shooting.
  - **Action Button**: Triggers `onAction` on touch.
- **Desktop Controls**:
  - **WASD**: Outputs normalized `dx`, `dy` in eight directions.
  - **Mouse**: Provides `x`, `y` for aiming; left-click triggers `onShoot` with `dist` and auto-shoot on hold.
  - **Space Bar**: Triggers `onAction`.
- **Input Normalization**:
  - Joystick inputs are normalized to unit length for movement, ensuring constant speed.
  - Shooting `dist` is capped at 1, simulating joystick deflection.
- **Event Dispatching**:
  - Uses `setCallback` to store game-provided handlers.
  - Calls handlers with precise input data (e.g., `onMove(dx, dy, isMobile)`).

### 4.2 `game.js` Implementation
- **Game State**:
  - Player: `{ x, y, keyboardSpeed: 5, mobileSpeed: 2, radius: 15, dx, dy }`.
  - Bullets: Array of `{ x, y, dx, dy, radius, type }` (gun or bomb).
  - Enemies: Array of `{ x, y, radius, speed }`.
  - Other: `score`, `weaponMode`, `bombAmmo`, `gameOver`, `isMobileInput`, `autoShoot`, `isShooting`.
- **Movement**:
  - Constant movement in the last `dx`, `dy` direction at fixed speed (2 for mobile, 5 for keyboard).
  - Clamps position to canvas bounds.
- **Shooting**:
  - Auto-shoot enabled (`autoShoot: true`).
  - Fires bullets when `isShooting` is true, with speed scaled by `dist * 5`.
  - Gun: Infinite ammo, smaller radius.
  - Bomb: Limited ammo (`bombAmmo`), larger radius.
- **Enemies**:
  - Spawn randomly at the top every 1000ms.
  - Move downward with speed increasing by `score / 100`.
  - Removed if they exit the canvas (score penalty: -5).
- **Collisions**:
  - Bullet-enemy: Destroys enemy, adds score (10 for gun, 15 for bomb).
  - Player-enemy: Triggers game over.
- **Rendering**:
  - Clears canvas each frame.
  - Draws player (white circle), bullets (yellow/red circles), enemies (purple circles), score, and ammo (text at top-left).
  - Game-over screen: Semi-transparent overlay with "GAME OVER" and restart prompt.
- **Loop**:
  - Runs `update` (state) and `render` (draw) at 60 FPS via `requestAnimationFrame`.

### 4.3 Optimizations
- **Performance**:
  - Uses simple shapes (circles) and minimal draw calls to ensure 60 FPS on low-end devices.
  - Clamps all positions to reduce off-screen calculations.
  - Filters arrays efficiently to remove out-of-bounds objects.
- **Input Smoothing**:
  - Joystick threshold (0.2) prevents jitter from minor touches.
  - Normalized inputs ensure consistent movement speed.
- **Responsive Design**:
  - Canvas resizes dynamically to fit device screens.
  - Player position adjusts on resize to stay in bounds.

## 5. Design Considerations

### 5.1 Mobile-First Design
- **Touch Controls**: Dual joysticks provide intuitive movement and aiming, with a larger aim joystick (140px) for precision. The action button is centrally placed for easy access.
- **Viewport Fit**: Canvas size adapts to mobile screens, ensuring controls remain accessible without scrolling.
- **Performance**: Optimized for mid-range devices (e.g., 2018 smartphones) with lightweight rendering and minimal computation.

### 5.2 Cross-Platform Support
- **Unified Inputs**: The `Interface` class abstracts mobile and desktop inputs into a single callback system, allowing `game.js` to handle both without modification.
- **Consistent Feel**: Movement speed differs (mobile: 2, keyboard: 5) but feels instant and fixed, matching the keyboard’s calibration experience.

### 5.3 Extensibility
- **Reusable Interface**: The `Interface` class supports any game that follows the callback contract, requiring only a new `game.js`.
- **Flexible Callbacks**: Games can ignore unused callbacks (e.g., `onAction`) or add custom logic (e.g., different shooting mechanics).
- **Future Enhancements**: New inputs (e.g., additional buttons) can be added to `index.html` without breaking existing games.

### 5.4 Limitations
- **No Server-Side Features**: The game is client-side only, lacking leaderboards or multiplayer. These could be added by extending `index.html` with API calls.
- **Single Game Loading**: Only one game (`game.js`) is loaded at a time. A game selector could be added for dynamic loading.
- **Simple Graphics**: Limited to 2D canvas rendering with basic shapes, suitable for retro-style games but not complex visuals.

## 6. Guidelines for New Games
To create a new game compatible with this interface, developers should:
- **Class Structure**: Define a class (e.g., `MyGame`) that accepts `ui` and implements `init`, `update`, `render`, and callback handlers.
- **Canvas Usage**: Use `ui.canvas` for bounds and `ui.ctx` for all rendering.
- **Input Handling**:
  - Handle `onMove(dx, dy, isMobile)` for movement (normalized directions).
  - Use `onAim(x, y)` for aiming (canvas coordinates).
  - Process `onShoot(dist, isActive)` for shooting, respecting `dist` for variable effects.
  - Implement `onAction` and `onRestart` as needed.
  - Adjust for `onResize(width, height)` to reposition elements.
- **Game Loop**: Use `requestAnimationFrame` for smooth updates.
- **State Management**: Manage game state internally, ensuring all visuals are drawn on the canvas.

## 7. Conclusion
The design of "Cosmic Defender" achieves a balance between simplicity, performance, and extensibility. The emulator-like architecture separates concerns, allowing the `Interface` to handle inputs and canvas setup while `game.js` focuses on gameplay. The mobile-first approach ensures accessibility, and cross-platform support broadens the audience. By adhering to the interaction contract, developers can create new games that leverage the same robust interface, making the system a versatile platform for browser-based gaming.