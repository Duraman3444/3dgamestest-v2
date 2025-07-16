# Three.js 3D Game

A modular Three.js 3D game built with ES6 modules featuring player movement, collision detection, collectibles, and a complete game loop.

## Features

- **Three camera modes** - First-person, third-person, and isometric (Press C to cycle)
- **Isometric map panning** - Move mouse to explore the entire map from above
- **JSON Level System** - Load custom levels with tiles, coins, keys, and exits
- **Level Objectives** - Collect all coins and the key to activate the exit
- **WASD movement controls** with mouse look
- **Jumping and gravity** physics
- **Collision detection** with obstacles and world boundaries
- **Collectible items** with scoring system
- **Dynamic lighting** and shadows
- **Minimap** and comprehensive UI system
- **Pause menu** (Press ESC)
- **FPS counter** and debug information

## Project Structure

```
3dgamestest-v2/
├── index.html          # Main HTML file
├── main.js             # Entry point and game initialization
├── gameLoop.js         # Game loop and system coordination
├── player.js           # Player object and controls
├── gridManager.js      # Grid/level management and terrain
├── cameraSystem.js     # Camera controls and management
├── collisionSystem.js  # Collision detection and response
├── UIManager.js        # UI elements and HUD management
├── levelLoader.js      # Level loading and JSON parsing system
├── levels/
│   └── level1.json     # Sample level file
├── package.json        # Project configuration
└── README.md           # This file
```

## How to Run

1. **Install dependencies** (if running from npm):
   ```bash
   npm install
   ```

2. **Start a local server**:
   ```bash
   # Option 1: Using Python (recommended)
   python -m http.server 3000
   
   # Option 2: Using Node.js http-server
   npx http-server -p 3000
   
   # Option 3: Using npm script
   npm start
   ```

3. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

4. **Click on the canvas** to lock the pointer and start playing!

## Controls

### Movement
- **WASD** - Move forward/backward/left/right
- **Mouse** - Look around
- **Space** - Jump
- **Click** - Lock pointer for mouse control

### Camera
- **C** - Cycle through camera modes (First Person → Third Person → Isometric)
- **R** - Reset camera to default position
- **Mouse** - In isometric mode, pan around the map to explore

### UI
- **ESC** - Pause/unpause game
- **F1** - Toggle FPS counter
- **F2** - Toggle position display
- **F3** - Toggle minimap

## Game Objective

- Collect all the **golden spheres** (coins) scattered around the level
- Find and collect the **cyan key** (worth 50 points)
- Navigate around the **brown obstacles** 
- Reach the **green exit** after collecting all items and the key
- Your **score** increases by 10 points for each coin and 50 for the key
- Complete the level as quickly as possible!

## Creating Custom Levels

The game supports custom levels through JSON files. Place your level files in the `levels/` directory.

### Level JSON Format

```json
{
  "name": "My Custom Level",
  "size": {
    "width": 16,
    "height": 16
  },
  "spawn": {
    "x": 0,
    "y": 1,
    "z": 0
  },
  "tiles": [
    {"x": 0, "z": 0, "type": "ground"},
    {"x": 1, "z": 0, "type": "ground"}
  ],
  "coins": [
    {"x": 3, "z": 3},
    {"x": 7, "z": 5}
  ],
  "obstacles": [
    {"x": 5, "z": 5, "type": "box", "width": 2, "height": 3, "depth": 2}
  ],
  "key": {
    "x": 13,
    "z": 13
  },
  "exit": {
    "x": 1,
    "z": 14,
    "width": 3,
    "height": 4,
    "depth": 3
  }
}
```

### Level Properties

- **name**: Display name for the level
- **size**: Grid dimensions (width/height in tiles)
- **spawn**: Player starting position (x, y, z coordinates)
- **tiles**: Ground tiles array (x, z, type)
- **coins**: Collectible coins array (x, z coordinates)
- **obstacles**: Obstacle array (x, z, optional width/height/depth)
- **key**: Key position (x, z coordinates) - required for exit
- **exit**: Exit position (x, z, optional width/height/depth)

All coordinates are in grid units (converted to world units automatically).

## Technical Details

### ES6 Modules Structure

Each file is a self-contained ES6 module:

- **main.js**: Initializes the game, sets up Three.js renderer, scene, lighting, and coordinates all systems
- **gameLoop.js**: Manages the main game loop, handles updates for all systems, and renders the scene
- **player.js**: Handles player movement, input processing, and physics
- **gridManager.js**: Manages the game world, generates terrain, obstacles, and collectibles from level data
- **levelLoader.js**: Loads and parses JSON level files with validation and error handling
- **cameraSystem.js**: Controls camera behavior, supports multiple camera modes with smooth transitions
- **collisionSystem.js**: Handles collision detection between player, obstacles, collectibles, key, and exit
- **UIManager.js**: Manages all UI elements, HUD, minimap, and user interface interactions

### Key Features

- **Modular Architecture**: Each system is independent and communicates through well-defined interfaces
- **Real-time Physics**: Gravity, jumping, and collision response
- **Dynamic Lighting**: Directional light with shadows and ambient lighting
- **Procedural Generation**: Random placement of obstacles and collectibles
- **Responsive UI**: Scales with window size and provides multiple display options
- **Performance Monitoring**: Built-in FPS counter and performance metrics

## Browser Requirements

- Modern browser with WebGL support
- ES6 module support
- Pointer Lock API support for mouse controls

## Development

The game uses Three.js loaded via CDN for simplicity. All modules are written in vanilla JavaScript ES6+ without additional build tools.

To extend the game:
1. Add new modules following the existing ES6 pattern
2. Import and initialize them in `main.js`
3. Add update calls in `gameLoop.js` if needed
4. Follow the existing naming and structure conventions

## Troubleshooting

- **Game doesn't load**: Make sure you're running from a local server (not file://)
- **Controls don't work**: Click on the canvas to lock the pointer
- **Performance issues**: Check browser console for errors and try reducing shadows/effects
- **Module loading errors**: Ensure all files are in the same directory and server is running

Enjoy the game! 