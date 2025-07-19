#!/bin/bash

echo "🚀 Ball Blitz Deployment Script"
echo "==============================="

# Clean up previous builds
echo "🧹 Cleaning up previous builds..."
rm -rf build-itch build-github
rm -f ball-blitz*.zip

# Create build directories
echo "📁 Creating build directories..."
mkdir -p build-itch build-github

# Download Three.js for itch.io build
echo "📦 Downloading Three.js for itch.io build..."
curl -s -o build-itch/three.module.js https://unpkg.com/three@0.158.0/build/three.module.js

# Copy game files to both builds
echo "📄 Copying game files..."
cp *.js build-itch/ && cp *.js build-github/
cp -r levels build-itch/ && cp -r levels build-github/

# Create itch.io index.html (local Three.js)
echo "🔧 Creating itch.io index.html..."
cat > build-itch/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ball Blitz - Arcade Edition</title>
    
    <script type="importmap">
    {
        "imports": {
            "three": "./three.module.js"
        }
    }
    </script>
    
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", Arial, sans-serif;
            overflow: hidden;
            font-smooth: always;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
        }
        
        #gameCanvas { display: block; }
        
        #ui {
            position: absolute;
            top: 30px;
            left: 10px;
            color: white;
            font-size: 14px;
            z-index: 100;
        }
        
        #crosshair {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            border: 2px solid white;
            border-radius: 50%;
            pointer-events: none;
            z-index: 100;
        }
        
        #instructions {
            position: absolute;
            top: 10px;
            right: 10px;
            color: white;
            font-size: 12px;
            z-index: 100;
        }
    </style>
</head>
<body>
    <div id="ui">
        <div id="score">Score: 0</div>
    </div>
    
    <div id="crosshair"></div>
    
    <div id="instructions">
        WASD: Move<br>
        Mouse: Look around<br>
        Space: Jump<br>
        Click: Lock pointer<br>
        C: Toggle camera (FPS/3rd/Iso)<br>
        O: Pause/Resume<br>
        ESC: Main Menu
    </div>
    
    <canvas id="gameCanvas"></canvas>
    
    <script type="module" src="main.js"></script>
</body>
</html>
EOF

# Create GitHub index.html (CDN Three.js)
echo "🔧 Creating GitHub index.html..."
cat > build-github/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ball Blitz - Arcade Edition</title>
    
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.158.0/build/three.module.js",
            "three/": "https://unpkg.com/three@0.158.0/"
        }
    }
    </script>
    
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", Arial, sans-serif;
            overflow: hidden;
            font-smooth: always;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
        }
        
        #gameCanvas { display: block; }
        
        #ui {
            position: absolute;
            top: 30px;
            left: 10px;
            color: white;
            font-size: 14px;
            z-index: 100;
        }
        
        #crosshair {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            border: 2px solid white;
            border-radius: 50%;
            pointer-events: none;
            z-index: 100;
        }
        
        #instructions {
            position: absolute;
            top: 10px;
            right: 10px;
            color: white;
            font-size: 12px;
            z-index: 100;
        }
    </style>
</head>
<body>
    <div id="ui">
        <div id="score">Score: 0</div>
    </div>
    
    <div id="crosshair"></div>
    
    <div id="instructions">
        WASD: Move<br>
        Mouse: Look around<br>
        Space: Jump<br>
        Click: Lock pointer<br>
        C: Toggle camera (FPS/3rd/Iso)<br>
        O: Pause/Resume<br>
        ESC: Main Menu
    </div>
    
    <canvas id="gameCanvas"></canvas>
    
    <script type="module" src="main.js"></script>
</body>
</html>
EOF

# Create README files
echo "📝 Creating README files..."

cat > build-itch/README.txt << 'EOF'
BALL BLITZ - ARCADE EDITION
===========================

🎮 A fast-paced 3D multiplayer ball battle game!

HOW TO PLAY:
-----------

1. Open index.html in any modern web browser
   - Chrome, Firefox, Safari, or Edge recommended
   - Internet connection NOT required (fully offline!)

2. Game Modes:
   - Single Player: Classic progression through levels
   - Pacman Mode: Collect dots and avoid enemies
   - Local Multiplayer: Up to 4-player battles on one computer

3. Controls:
   - WASD: Move your ball
   - Mouse: Look around and aim
   - Space: Jump
   - Click: Lock mouse pointer
   - C: Toggle camera view (1st/3rd person/isometric)
   - O: Pause/Resume
   - ESC: Return to main menu

MULTIPLAYER CONTROLS:
--------------------
Player 1: WASD
Player 2: Arrow Keys  
Player 3: IJKL
Player 4: TFGH

FEATURES:
---------
- 🏟️ 15+ Unique Battle Arenas
- 🎨 Ball Customization System
- 🏆 Tournament Mode (first to 4 wins)
- 🎵 Dynamic Audio System
- ⚡ Real-time Physics
- 📊 Leaderboards
- 🌟 Multiple Game Modes

TIPS:
-----
- Use strategic positioning in multiplayer battles
- Customize your ball for better visibility
- Each arena has unique hazards and features
- Practice in single player before multiplayer!

Enjoy the game! 🎮✨
EOF

cat > build-github/README.md << 'EOF'
# Ball Blitz - Arcade Edition

🎮 **A fast-paced 3D multiplayer ball battle game built with Three.js!**

## 🚀 Quick Start

### Option 1: Simple HTTP Server (Recommended)

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server -p 8000
```

Then open: `http://localhost:8000`

### Option 2: Direct File Opening
⚠️ **Not recommended due to CORS restrictions with modern browsers**

## 🎮 Game Features

- **🏟️ 15+ Unique Battle Arenas** - Each with special hazards and themes
- **👥 Local Multiplayer** - Up to 4 players on one computer
- **🎨 Ball Customization** - Personalize your battle ball
- **🏆 Tournament Mode** - First to 4 wins takes the match
- **🎵 Dynamic Audio** - Immersive sound effects and music
- **⚡ Real-time Physics** - Smooth ball physics and collisions
- **📊 Leaderboards** - Track your best scores
- **🌟 Multiple Game Modes** - Single player, Pacman mode, and more

## 🕹️ Controls

| Action | Player 1 | Player 2 | Player 3 | Player 4 |
|--------|----------|----------|----------|----------|
| Move | WASD | Arrow Keys | IJKL | TFGH |
| Look | Mouse | Mouse | Mouse | Mouse |
| Jump | Space | Space | Space | Space |

**Universal Controls:**
- Click: Lock mouse pointer
- C: Toggle camera view
- O: Pause/Resume  
- ESC: Main menu

## 🛠️ Development

### Requirements
- Modern web browser with ES6 module support
- HTTP server (for development)
- Internet connection (for Three.js CDN)

### Technologies Used
- **Three.js** - 3D rendering engine
- **ES6 Modules** - Modern JavaScript modules
- **Canvas API** - 2D UI elements
- **Web Audio API** - Sound management

## 🎯 Game Modes

1. **Single Player** - Progress through challenging levels
2. **Pacman Mode** - Classic dot collection with modern 3D twist  
3. **Local Multiplayer** - Intense 4-player battle royale
4. **Battle Tournaments** - Competitive matches with win tracking

## 🏟️ Arena Types

- Jungle Temple - Sinkholes and spike traps
- Volcanic Crater - Lava bursts and ramps
- Sky Sanctuary - Multi-level floating platforms
- Desert Ruins - Quicksand and sandstorms
- Neon Grid - Teleporters and digital hazards
- And many more!

---

**Enjoy the game! 🎮✨**
EOF

# Create zip packages
echo "📦 Creating zip packages..."
cd build-itch && zip -r ../ball-blitz-itch.zip . && cd ..
cd build-github && zip -r ../ball-blitz-github.zip . && cd ..

# Show results
echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo "📦 Packages created:"
ls -lh ball-blitz*.zip
echo ""
echo "🎮 Itch.io Package: ball-blitz-itch.zip (ready to upload to itch.io)"
echo "🐙 GitHub Package: ball-blitz-github.zip (ready for GitHub release)"
echo ""
echo "📁 Build directories created:"
echo "   - build-itch/ (offline version with bundled Three.js)"
echo "   - build-github/ (online version using CDN)"
echo ""
echo "🚀 Next Steps:"
echo "   1. Upload ball-blitz-itch.zip to itch.io"
echo "   2. Create GitHub release with ball-blitz-github.zip"
echo "   3. Test both packages before publishing!"
echo "" 