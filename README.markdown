# Descensus ad Inferos

## Overview
*Descensus ad Inferos* is a top-down action game where players control Jesus in a fiery underworld, battling Satan and other enemies. The game features a centered layout with symmetrical UI elements, a modular dialogue system for conversations, and a dynamic gameplay experience with movement, combat, and environmental hazards.

### Features
- **Centered Layout**: The game map is the focal point, with UI elements (HP/Mana bars, profile pictures, chat boxes) symmetrically aligned around it.
- **Modular Dialogue System**: Conversations are loaded from JSON files, making it easy to add new levels and characters.
- **Responsive Design**: Built with Tailwind CSS for adaptability across screen sizes.
- **Dynamic Gameplay**: Includes player movement (WASD), ranged and melee attacks, enemy AI, and a chunk-based map system.

## Project Structure
```
project/
├── index.html              # Main HTML file defining the game layout
├── styles.css              # CSS styles for visual effects and layout
├── setup.js                # Initializes game state, sprites, and event listeners
├── game.js                 # Core game mechanics (movement, combat, rendering)
├── dialogue.js             # Modular dialogue system for conversations
├── dialogues/              # Directory for dialogue JSON files
│   └── level1/             # Level-specific dialogue files
│       └── satan.json      # Sample dialogue for Satan in Level 1
├── program_documentation.md # Detailed program documentation
└── README.md               # Project overview and setup instructions
```

## Setup Instructions
### Prerequisites
- A modern web browser (e.g., Firefox, Chrome).
- A local server to serve the files (e.g., Python’s HTTP server).
- An internet connection (for sprite fallbacks if the local `images/` folder is unavailable).

### Running the Game
1. **Clone or Download the Repository**:
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

## Gameplay
- **Movement**: Use WASD keys to move Jesus (up, down, left, right).
- **Combat**:
  - **Ranged Attack**: Click or hold the mouse to fire spells (requires mana).
  - **Melee Attack**: Automatically triggers when mana is depleted, attacking nearby enemies.
- **Aim Toggle**: Toggle between mouse aim and auto-aim using the "Mouse Aim" button in the header.
- **Dialogue**: Navigate conversation options using arrow keys and select with Enter.

## Development
For detailed design principles, gameplay mechanics, and future development considerations, refer to the [Program Documentation](program_documentation.md).

### Adding New Levels or Characters
1. Create a new dialogue JSON file in `dialogues/` (e.g., `dialogues/level2/new_enemy.json`).
2. Update `game.js` to load the appropriate dialogue based on the game state.
3. Add new NPCs to `gameState.enemies` in `setup.js` with unique IDs.

## Testing
- **Layout**: Verify the game map is centered, with chat boxes and PFPs symmetrically aligned.
- **Dialogue**: Approach Satan to trigger dialogue, navigate options, and confirm combat starts post-dialogue.
- **Gameplay**: Test movement (WASD), combat (mouse click, melee), and enemy AI.
- **Responsiveness**: Resize the browser to ensure the layout adapts correctly on mobile and desktop.

## Contributing
Contributions are welcome! Please fork the repository, make your changes, and submit a pull request. For major changes, open an issue first to discuss your ideas.

## License
This project is licensed under the MIT License. See the LICENSE file for details.