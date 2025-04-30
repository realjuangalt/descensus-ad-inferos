# Cosmic Defender Interface Schema

This schema describes the interaction between `index.html` (the emulator-like interface) and `game.js` (the game logic) in the "Cosmic Defender" project. It also provides a blueprint for developers to create other games that are compatible with the `Interface` class provided by `index.html`.

## Overview
The architecture separates the **interface** (input handling and canvas setup) from the **game logic** (game mechanics and rendering). `index.html` acts as a reusable "console" that provides a standardized canvas and input system, while `game.js` is a "game cartridge" that implements specific game logic. This modular design allows different games to be plugged into the same interface with minimal changes.

## Components

### `index.html` (The Interface/Console)
- **Role**: Provides a canvas for rendering, captures user inputs (touch, keyboard, mouse), and exposes an `Interface` class for games to interact with.
- **Key Elements**:
  - **Canvas**: `<canvas id="canvas">` where all game visuals are rendered.
  - **Controls** (mobile):
    - Move Joystick (`#move`): Controls player movement.
    - Aim Joystick (`#aim`): Controls aiming and shooting.
    - Action Button (`#action`, labeled "B"): Triggers game-specific actions (e.g., weapon toggle).
  - **Controls** (desktop):
    - WASD: Movement.
    - Mouse movement: Aiming.
    - Left mouse click: Shooting (auto-shoot if held).
    - Space bar: Action button.
  - **Header**: Displays the game title ("COSMIC DEFENDER").
- **Interface Class**:
  - Instantiated as `ui` and passed to the game.
  - Properties:
    - `canvas`: The HTML canvas element.
    - `ctx`: The 2D canvas rendering context.
  - Methods:
    - `setCallback(event, callback)`: Registers callbacks for input events.
    - (Previously included `updateWeaponInfo`, but removed as ammo is now rendered on-canvas.)
- **Responsibilities**:
  - Dynamically resizes the canvas to fit the viewport (`max-width: 400px`, `max-height: 60vh`).
  - Captures touch, keyboard, and mouse inputs, translating them into callbacks.
  - Initializes the game by loading `game.js` and passing the `ui` instance.

### `game.js` (The Game/Cartridge)
- **Role**: Implements the game logic, rendering, and state management for "Cosmic Defender".
- **Structure**:
  - Defines a `CosmicDefenderGame` class that takes the `ui` instance as a constructor parameter.
  - Manages game state (player, enemies, bullets, score, etc.).
  - Handles input via callbacks and renders to the canvas using `ui.ctx`.
- **Key Interactions**:
  - Registers callbacks with `ui.setCallback` to receive inputs.
  - Uses `ui.canvas` and `ui.ctx` for rendering and boundary checks.
  - Updates game state based on inputs and renders each frame.

## Interaction Contract

### Initialization
1. **index.html**:
   - Creates an `Interface` instance (`ui`).
   - Calls `resizeCanvas` to set initial canvas dimensions.
   - Dynamically loads `game.js` via a `<script>` tag.
   - Passes `ui` to the game’s constructor.
2. **game.js**:
   - Instantiates the game class (e.g., `CosmicDefenderGame`) with `ui`.
   - Sets up initial state (e.g., player position at `canvas.width / 2, canvas.height - 50`).
   - Registers callbacks for inputs.
   - Starts the game loop using `requestAnimationFrame`.

### Input Callbacks
The `Interface` class provides the following callbacks, which games must register using `ui.setCallback(event, callback)`:

| Event | Callback Signature | Description | Source |
|-------|--------------------|-------------|--------|
| `onMove` | `(dx: number, dy: number, isMobile: boolean) => void` | Called when movement input is received. `dx`, `dy` are normalized (-1 to 1) directions. `isMobile` indicates joystick (`true`) or keyboard (`false`). | Joystick (mobile), WASD (desktop) |
| `onAim` | `(x: number, y: number) => void` | Called when aiming input is received. `x`, `y` are canvas coordinates for the aim point. | Aim joystick (mobile), mouse (desktop) |
| `onShoot` | `(dist: number, isActive: boolean) => void` | Called when shooting is triggered. `dist` (0 to 1) indicates deflection distance (joystick) or mouse distance from center. `isActive` indicates if the input is ongoing (e.g., joystick deflected or mouse held). | Aim joystick (mobile, dist > 0.3), left mouse click (desktop) |
| `onAction` | `() => void` | Called when the action button is pressed. | "B" button (mobile), space bar (desktop) |
| `onRestart` | `() => void` | Called when the canvas is tapped/clicked, typically to restart after game over. | Canvas tap (mobile), click (desktop) |
| `onResize` | `(width: number, height: number) => void` | Called when the canvas resizes, providing new dimensions. | Window resize, initial setup |

### Rendering
- Games must use `ui.ctx` to render all visuals (player, enemies, UI elements like score and ammo) within the canvas.
- The canvas is cleared and redrawn each frame in the game’s `loop` method.
- Games should respect `ui.canvas.width` and `ui.canvas.height` for positioning and boundary checks.

### Data Flow
```
[index.html]                         [game.js]
   |                                    |
   |---(creates ui: Interface)         |
   |---(loads game.js)                 |
   |                                    |---(new CosmicDefenderGame(ui))
   |                                    |---(sets initial state)
   |                                    |---(registers callbacks via ui.setCallback)
   |                                    |---(starts game loop)
   |                                    |
   |---(captures inputs)               |
   |    - Joystick: onMove, onAim, onShoot
   |    - Keyboard: onMove, onAction
   |    - Mouse: onAim, onShoot, onRestart
   |    - Canvas tap/click: onRestart
   |                                    |
   |---(calls callbacks)-------------->|----(updates state: player position, bullets, etc.)
   |                                    |----(renders to ui.ctx)
   |                                    |
   |---(resizes canvas)--------------->|----(handles resize via onResize)
```

## Requirements for Compatible Games
To create a new game that fits this interface, developers must follow these guidelines:

### Game Structure
- **Class-Based**: Define a class (e.g., `MyGame`) that takes a single parameter `ui` (the `Interface` instance).
- **Constructor**: Initialize game state using `ui.canvas.width` and `ui.canvas.height` for positioning (e.g., player at `ui.canvas.width / 2`).
- **Methods**:
  - `init()`: Register callbacks, set up the game loop.
  - `handleMove(dx, dy, isMobile)`: Update movement based on normalized direction and input source.
  - `handleAim(x, y)`: Update aim point (canvas coordinates).
  - `handleShoot(dist, isActive)`: Handle shooting, respecting `dist` for speed and `isActive` for auto-shoot.
  - `handleAction()`: Handle action button presses.
  - `handleRestart()`: Reset game state on restart.
  - `handleResize(width, height)`: Adjust positions for new canvas size.
  - `update()`: Update game state (physics, collisions, etc.).
  - `render()`: Draw to `ui.ctx`.
  - `loop()`: Run `update` and `render` via `requestAnimationFrame`.

### Example Template
```javascript
class MyGame {
  constructor(ui) {
    this.ui = ui;
    this.player = {
      x: ui.canvas.width / 2,
      y: ui.canvas.height - 50,
      speed: 3
    };
    this.init();
  }

  init() {
    this.ui.setCallback('onMove', (dx, dy, isMobile) => this.handleMove(dx, dy, isMobile));
    this.ui.setCallback('onAim', (x, y) => this.handleAim(x, y));
    this.ui.setCallback('onShoot', (dist, isActive) => this.handleShoot(dist, isActive));
    this.ui.setCallback('onAction', () => this.handleAction());
    this.ui.setCallback('onRestart', () => this.handleRestart());
    this.ui.setCallback('onResize', (w, h) => this.handleResize(w, h));
    this.loop();
  }

  handleMove(dx, dy, isMobile) {
    const speed = isMobile ? 2 : 5;
    this.player.x += dx * speed;
    this.player.y += dy * speed;
  }

  handleAim(x, y) {
    // Store aim coordinates
  }

  handleShoot(dist, isActive) {
    if (isActive) {
      // Fire projectile with speed based on dist
    }
  }

  handleAction() {
    // Perform action (e.g., toggle mode)
  }

  handleRestart() {
    this.player.x = this.ui.canvas.width / 2;
    this.player.y = this.ui.canvas.height - 50;
  }

  handleResize(width, height) {
    this.player.x = width / 2;
    this.player.y = height - 50;
  }

  update() {
    // Update game state
  }

  render() {
    const ctx = this.ui.ctx;
    ctx.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);
    // Draw game elements
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }
}

const game = new MyGame(ui);
```

### Guidelines
- **Canvas Bounds**: Always use `ui.canvas.width` and `ui.canvas.height` for positioning and clamping to stay within the canvas.
- **Rendering**: Clear the canvas each frame and draw all visuals (including UI like score) using `ui.ctx`.
- **Input Handling**:
  - Expect `onMove` to provide normalized `dx`, `dy` (-1 to 1) for both joystick and keyboard.
  - Use `isMobile` to adjust behavior (e.g., different speeds).
  - Handle `onShoot` with `dist` for variable effects and `isActive` for continuous input.
- **Resize Awareness**: Update positions in `onResize` to adapt to canvas size changes.
- **Game Loop**: Use `requestAnimationFrame` for smooth updates and rendering.
- **No External DOM**: Avoid manipulating the DOM directly; all visuals should be on the canvas.

## Example: Cosmic Defender Implementation
In "Cosmic Defender":
- **Initialization**: `CosmicDefenderGame` sets the player at `ui.canvas.width / 2, ui.canvas.height - 50`.
- **Movement**: `handleMove` stores `dx`, `dy`; `update` applies `mobileSpeed: 2` or `keyboardSpeed: 5`.
- **Aiming/Shooting**: `handleAim` stores canvas coordinates; `handleShoot` fires bullets if `autoShoot` and `isActive` are true.
- **Action**: `toggleWeapon` switches between "Gun" and "Bomb".
- **Rendering**: Draws player, bullets, enemies, score, and ammo on `ui.ctx`.
- **Resize**: `handleResize` repositions the player to stay in bounds.

## Notes
- **Extensibility**: New games can use the same `index.html` by replacing `game.js` with a new script, as long as it follows the callback contract.
- **Limitations**: The interface assumes a single-canvas game with no server-side features. Add API calls in `index.html` for leaderboards or multiplayer.
- **Customization**: Developers can adjust speeds, input thresholds, or add new callbacks by extending `Interface`.

This schema ensures that `index.html` and `game.js` work seamlessly and provides a clear framework for creating compatible games.