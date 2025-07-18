# Three.js 3D Multi-Mode Game

A comprehensive 3D game built with Three.js featuring multiple game modes, advanced graphics, and real-time multiplayer support. Built with ES6 modules and modern web technologies.

## 🎮 Game Modes

### Single Player Mode
- **6 Progressive Levels** with unique mechanics and challenges
- **Level 1**: Coin and Key Introduction
- **Level 2**: Bounce Pad Challenges
- **Level 3**: Deadly Spike Maze
- **Level 4**: Portal Maze with Teleportation
- **Level 5**: Spike Parkour Challenge
- **Level 6**: Tower Climb

### Pacman Mode
- **5 Pacman Levels** with classic arcade feel
- **Classic Mode**: Endless survival with lives system
- **Neon Visual Theme** with retro aesthetics
- **Ghost AI** with pursuit mechanics
- **Timer-based Challenges** for competitive play

### Battle Mode
- **Bot Battle System** with AI opponents
- **Sumo-style Combat** on floating arenas
- **Physics-based Gameplay** with ball mechanics
- **Multiple Difficulty Levels** and bot counts
- **Dynamic Arena Themes** with hazards and effects

### Multiplayer Mode
- **Real-time Multiplayer** with WebSocket server
- **Race and Battle Modes** for up to 4 players
- **Spectator Support** for watching matches
- **Room-based System** with customizable settings
- **Cross-platform Compatibility**

## ✨ Features

### Core Gameplay
- **Three Camera Modes**: First-person, third-person, and isometric (Press C to cycle)
- **Isometric Map Panning**: Mouse control for exploring levels from above
- **Advanced Physics**: Gravity, jumping, collision detection, and response
- **Dynamic Lighting**: Real-time shadows with 4K shadow mapping
- **Particle Effects**: Environmental and combat effects

### Level System
- **JSON-based Levels**: Easy-to-create custom levels
- **15 Pre-built Levels**: 6 single-player + 9 pacman levels
- **Interactive Elements**: Portals, bounce pads, spikes, holes, and more
- **Progressive Difficulty**: Mechanics introduced gradually
- **Themed Environments**: Different visual styles per level

### Visual Enhancements
- **Skybox Manager**: Dynamic skyboxes with level-specific themes
- **Graphics Enhancer**: Advanced post-processing effects
- **Atmospheric Particles**: Immersive environmental effects
- **Neon Themes**: Retro-futuristic visual styles for Pacman mode

### User Interface
- **Comprehensive HUD**: Score, health, lives, timer, and more
- **Minimap System**: Real-time level overview
- **Menu System**: Intuitive navigation between modes
- **Settings Manager**: Customizable game options
- **Battle UI**: Specialized interface for combat modes

## 🎯 Controls

### Movement
- **WASD** - Move forward/backward/left/right
- **Mouse** - Look around (first/third person)
- **Space** - Jump
- **Click** - Lock pointer for mouse control

### Camera
- **C** - Cycle camera modes (First Person → Third Person → Isometric)
- **R** - Reset camera to default position
- **Mouse** - In isometric mode, pan around the map

### UI & Game
- **ESC** - Main menu / Pause game
- **O** - Pause/Resume (alternative)
- **F1** - Toggle FPS counter
- **F2** - Toggle position display
- **F3** - Toggle minimap

### Multiplayer (Local Battle)
- **Player 1**: WASD
- **Player 2**: Arrow Keys
- **Player 3**: IJKL
- **Player 4**: TFGH

## 🚀 How to Run

### Option 1: Simple Web Server (Recommended)
```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000
```

### Option 2: Full Multiplayer Server
```bash
# Install dependencies
npm install

# Start the server (includes multiplayer support)
npm start
```

### Option 3: Alternative Ports
```bash
# If port 8000 is in use, try different ports
python3 -m http.server 8001
python3 -m http.server 3000
```

Then open your browser to `http://localhost:8000` (or your chosen port)

## 🏗️ Project Structure

```
3dgamestest-v2/
├── index.html              # Main HTML file
├── main.js                 # Entry point and game initialization
├── gameLoop.js             # Game loop and system coordination
├── server.js               # WebSocket server for multiplayer
├── package.json            # Dependencies and scripts
│
├── Core Systems/
│   ├── player.js           # Player object and controls
│   ├── gridManager.js      # Level management and terrain
│   ├── cameraSystem.js     # Camera controls and management
│   ├── collisionSystem.js  # Collision detection and response
│   ├── levelLoader.js      # Level loading and JSON parsing
│   └── skyboxManager.js    # Dynamic skybox management
│
├── Game Modes/
│   ├── singlePlayerMenu.js # Single player level selection
│   ├── pacmanMenu.js       # Pacman mode options
│   ├── battleMenu.js       # Battle mode configuration
│   ├── battleSystem.js     # Bot battle mechanics
│   ├── multiplayerMenu.js  # Multiplayer lobby system
│   └── multiplayerManager.js # Network communication
│
├── UI Systems/
│   ├── mainMenu.js         # Main menu navigation
│   ├── UIManager.js        # HUD and game UI
│   ├── battleUI.js         # Battle-specific interface
│   ├── gameOverScreen.js   # End game screens
│   └── settingsManager.js  # Game settings
│
├── Enhanced Features/
│   ├── graphicsEnhancer.js # Post-processing effects
│   ├── arenaManager.js     # Arena generation and management
│   ├── botAI.js            # AI behavior for bots
│   └── victoryMenu.js      # Victory celebration screens
│
└── levels/                 # Level data files
    ├── level1-6.json       # Single player levels
    ├── pacman1-7.json      # Pacman mode levels
    └── pacman_classic.json # Classic pacman level
```

## 📊 Game Objectives

### Single Player
- Collect all **golden coins** (10 points each)
- Find the **cyan key** (50 points)
- Avoid obstacles and navigate challenges
- Reach the **green exit** to complete the level

### Pacman Mode
- Collect all **dots** while avoiding ghosts
- Use **power pellets** to temporarily defeat ghosts
- Complete levels within the time limit
- Survive as long as possible in Classic mode

### Battle Mode
- Push opponents off the floating arena
- Use physics-based combat mechanics
- Last player standing wins the round
- Best of multiple rounds determines the winner

## 🛠️ Technical Features

### Architecture
- **Modular ES6 Design**: Clean separation of concerns
- **Real-time Networking**: WebSocket-based multiplayer
- **Performance Optimized**: Efficient rendering and physics
- **Cross-platform**: Works on desktop and mobile browsers

### Graphics Technology
- **Three.js Engine**: Latest version with advanced features
- **4K Shadow Mapping**: High-quality dynamic shadows
- **Post-processing Pipeline**: Bloom, particles, and effects
- **Adaptive Quality**: Performance-based settings adjustment

### Level System
- **JSON-based Levels**: Easy creation and modification
- **Validation System**: Error handling and fallbacks
- **Dynamic Loading**: Seamless level transitions
- **Modular Components**: Reusable level elements

## 🎨 Creating Custom Levels

### Level JSON Format
```json
{
  "name": "My Custom Level",
  "type": "normal",
  "size": { "width": 20, "height": 20 },
  "spawn": { "x": 0, "y": 1, "z": 0 },
  "tiles": [
    {"x": 0, "z": 0, "type": "ground"}
  ],
  "coins": [{"x": 5, "z": 5}],
  "obstacles": [
    {"x": 10, "z": 10, "type": "box", "width": 2, "height": 3}
  ],
  "portals": [
    {"x": 3, "z": 3, "targetX": 15, "targetZ": 15}
  ],
  "spikes": [{"x": 8, "z": 8, "damage": 25}],
  "bouncePads": [{"x": 12, "z": 12, "force": 20}],
  "key": {"x": 18, "z": 18},
  "exit": {"x": 19, "z": 19}
}
```

### Level Types
- **normal**: Standard single-player levels
- **pacman**: Maze-based levels with ghosts
- **battle**: Arena-style combat levels

## 🌐 Browser Requirements

- **WebGL Support**: Modern graphics rendering
- **ES6 Modules**: Modern JavaScript features
- **Pointer Lock API**: First-person camera control
- **WebSocket Support**: Real-time multiplayer (optional)

## 🔧 Development

### Extending the Game
1. Add new modules following the ES6 pattern
2. Import and initialize in `main.js`
3. Add update calls in `gameLoop.js` if needed
4. Follow existing naming conventions

### Server Development
The multiplayer server uses Express.js and Socket.IO:
- Room-based game sessions
- Real-time position sync
- Spectator mode support
- Automatic cleanup and reconnection

## 🐛 Troubleshooting

### Common Issues
- **Game doesn't load**: Ensure you're using a local server, not file://
- **Controls unresponsive**: Click the canvas to lock the pointer
- **Multiplayer not working**: Check if the server is running on the correct port
- **Performance issues**: Try reducing graphics quality in settings

### Server Issues
- **Port already in use**: Kill existing processes or use a different port
- **Connection failed**: Check firewall settings and server logs

## 🎉 Achievements

This project demonstrates:
- **Advanced 3D Graphics**: Complex rendering and effects
- **Network Programming**: Real-time multiplayer implementation
- **Game Design**: Multiple interconnected game modes
- **Software Architecture**: Clean, modular, and maintainable code
- **Performance Optimization**: Smooth gameplay across devices

Built with passion and modern web technologies! 🚀 