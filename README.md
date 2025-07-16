# Three.js 3D Game

A modular Three.js 3D game built with ES6 modules featuring player movement, collision detection, collectibles, and a complete game loop.

## Features

- **First-person and third-person camera modes** (Press C to switch)
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
- **C** - Toggle between first-person and third-person camera
- **R** - Reset camera to default position

### UI
- **ESC** - Pause/unpause game
- **F1** - Toggle FPS counter
- **F2** - Toggle position display
- **F3** - Toggle minimap

## Game Objective

- Collect all the **golden spheres** scattered around the level
- Avoid or navigate around the **brown obstacles**
- Your **score** increases by 10 points for each collectible
- Try to collect all items as quickly as possible!

## Technical Details

### ES6 Modules Structure

Each file is a self-contained ES6 module:

- **main.js**: Initializes the game, sets up Three.js renderer, scene, lighting, and coordinates all systems
- **gameLoop.js**: Manages the main game loop, handles updates for all systems, and renders the scene
- **player.js**: Handles player movement, input processing, and physics
- **gridManager.js**: Manages the game world, generates terrain, obstacles, and collectibles
- **cameraSystem.js**: Controls camera behavior, supports multiple camera modes with smooth transitions
- **collisionSystem.js**: Handles collision detection between player, obstacles, and collectibles
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