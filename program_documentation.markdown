# Descensus ad Inferos Program Documentation

## Project Overview
*Descensus ad Inferos* is a top-down action game built using HTML5, JavaScript, and Tailwind CSS. The game pits the player, controlling Jesus, against Satan in a fiery underworld setting. The player navigates a grid-based map, avoiding lava pits and rocks while engaging in combat with enemies. The game features a modular dialogue system, a centered layout for optimal UI symmetry, and a scalable architecture for future expansion.

### Key Features
- **Centered Layout**: The game map is the focal point, with UI elements (HP/Mana bars, profile pictures, and chat boxes) symmetrically aligned around it.
- **Modular Dialogue System**: Conversations are loaded from JSON files, allowing easy addition of new levels, characters, and dialogues.
- **Responsive Design**: Tailwind CSS ensures the layout adapts to various screen sizes.
- **Dynamic Gameplay**: Includes player movement, melee and ranged attacks, enemy AI, and a chunk-based map generation system.

## File Structure
The project is organized as follows:

```
project/
├── index.html              # Main HTML file defining the game layout
├── styles.css              # CSS styles for visual effects and layout
├── setup.js                # Initializes game state, sprites, and event listeners
├── game.js                 # Core game mechanics (movement, combat, rendering)
├── dialogue.js             # Modular dialogue system for conversations
└── dialogues/              # Directory for dialogue JSON files
    └── level1/             # Level-specific dialogue files
        └── satan.json      # Sample dialogue for Satan in Level 1
```

## Setup Instructions
### Prerequisites
- A modern web browser (e.g., Firefox, Chrome).
- A local server to serve the files (e.g., Python’s HTTP server).
- An internet connection (for sprite fallbacks if local `images/` folder is unavailable).

### Running the Game
1. **Clone or Download the Project**:
   Ensure all files are in the correct directory structure as shown above.

2. **Serve the Project**:
   Navigate to the project directory and start a local server:
   ```bash
   python3 -m http.server 8000
   ```

3. **Access the Game**:
   Open a browser and navigate to `http://localhost:8000/index.html`.

4. **Verify Assets**:
   - Ensure the `images/` folder is present with sprite files (`jesus-up.png`, `satan-down.png`, etc.), or rely on GitHub fallback URLs (requires internet).
   - Confirm the `dialogues/level1/satan.json` file exists for dialogue loading.

### Expected Behavior
- The game loads with a centered layout, displaying the game map, HP/Mana bars, Jesus’s profile picture (PFP), and chat box at the top, and Satan’s PFP and chat box at the bottom.
- Approaching Satan (within 200px) triggers a dialogue sequence loaded from `satan.json`.
- After the dialogue, Satan becomes hostile, and gameplay continues with combat mechanics.

## Design Principles
### Centered Layout
- The game map is the focal point, constrained to a `max-w-4xl` width and centered using `mx-auto`.
- UI elements (chat boxes, PFPs, bars) are symmetrically aligned around the map using Tailwind’s flexbox utilities (`flex`, `flex-grow`, fixed widths like `w-16 sm:w-20` for PFPs).

### Modular Dialogue System
- Dialogue logic is separated into `dialogue.js`, which loads conversations from JSON files (`dialogues/{level}/{npcId}.json`).
- This allows easy addition of new levels or characters by creating new JSON files without altering code.

### Responsiveness
- Tailwind CSS ensures the layout adapts to different screen sizes using responsive classes (`sm:`, `md:`).
- On smaller screens, elements stack vertically; on larger screens, they align horizontally for symmetry.

## Gameplay Mechanics
### Player Controls
- **Movement**: Use WASD keys to move Jesus (up, down, left, right).
- **Combat**:
  - **Ranged Attack**: Click or hold the mouse to fire spells (requires mana).
  - **Melee Attack**: Automatically triggers when mana is depleted, attacking nearby enemies.
- **Aim Toggle**: Toggle between mouse aim and auto-aim using the "Mouse Aim" button in the header.

### Dialogue System
- Triggered when the player approaches an NPC (e.g., Satan within 200px).
- Conversations are loaded from JSON, displaying text and response options.
- Players navigate options using arrow keys and select with Enter, advancing the dialogue until completion.

### Enemies and Environment
- **Enemies**: Satan starts as a non-hostile NPC, becoming hostile after dialogue. Additional enemies spawn in waves.
- **Obstacles**: Lava pits deal damage over time; rocks block movement and can be destroyed.
- **Chunk System**: The map is generated in chunks (400x400px), dynamically loading/unloading based on player position.

## Future Development Considerations
### Adding New Levels
1. Create a new folder in `dialogues/` (e.g., `dialogues/level2/`).
2. Add a JSON file for each NPC (e.g., `dialogues/level2/new_enemy.json`).
3. Update `game.js` to load the appropriate level dialogue based on game state.

### Adding New Characters
1. Add a new NPC to `gameState.enemies` in `setup.js` with a unique `id`.
2. Create a corresponding dialogue JSON file (e.g., `dialogues/level1/new_character.json`).
3. Ensure `checkDialogue` in `game.js` can handle multiple NPCs if needed.

### Enhancing Dialogue
- **Branching Conversations**: Add logic in `chooseOption` to branch dialogue based on player choices.
- **Dynamic Text**: Include variables in dialogue JSON (e.g., player name) for personalized conversations.
- **Multiple Languages**: Extend `useModernLanguage` to support additional language styles or translations.

### Improving Gameplay
- **New Mechanics**: Add abilities, items, or power-ups by extending `gameState.player` and updating `game.js`.
- **Level Progression**: Implement a level system by tracking progress in `gameState` and loading new chunks/enemies.

## Testing Checklist
- **Layout**: Verify the game map is centered, with chat boxes and PFPs symmetrically aligned.
- **Dialogue**: Approach Satan to trigger dialogue, navigate options, and confirm combat starts post-dialogue.
- **Gameplay**: Test movement (WASD), combat (mouse click, melee), and enemy AI.
- **Responsiveness**: Resize the browser to ensure the layout adapts correctly on mobile and desktop.

This documentation provides a foundation for understanding, running, and extending *Descensus ad Inferos*. For further questions, refer to the code comments or reach out to the development team.