# Ball Blitz - Deployment Guide

This guide explains how to deploy Ball Blitz to both itch.io and GitHub.

## 🚀 Quick Deployment

### Automated Deployment (Recommended)

```bash
./deploy.sh
```

This script will:
- Clean up previous builds
- Download Three.js for offline use
- Create both itch.io and GitHub packages
- Generate deployment-ready zip files

## 📦 Manual Deployment

If you need to create packages manually:

### For Itch.io (Offline Version)
```bash
mkdir build-itch
curl -o build-itch/three.module.js https://unpkg.com/three@0.158.0/build/three.module.js
cp *.js levels/ build-itch/
# Create index.html with local Three.js import
cd build-itch && zip -r ../ball-blitz-itch.zip .
```

### For GitHub (Online Version)
```bash
mkdir build-github
cp *.js levels/ build-github/
# Create index.html with CDN Three.js import
cd build-github && zip -r ../ball-blitz-github.zip .
```

## 🎮 Itch.io Deployment

### Step 1: Prepare Your Itch.io Page
1. Go to [itch.io](https://itch.io) and log in
2. Click "Create new project"
3. Fill in the details:
   - **Title**: Ball Blitz - Arcade Edition
   - **Project URL**: choose your URL
   - **Classification**: Game
   - **Kind of project**: HTML

### Step 2: Upload Game Files
1. In the "Uploads" section, click "Upload files"
2. Upload `ball-blitz-itch.zip`
3. Check "This file will be played in the browser"
4. Set the iframe size to **1024 x 768** (or larger)

### Step 3: Configure Settings
- **Pricing**: Free or set a price
- **Visibility**: Public (when ready)
- **Tags**: 3d, multiplayer, arcade, action, physics
- **Description**: 
```
🎮 Ball Blitz is a fast-paced 3D multiplayer ball battle game!

✨ Features:
- 15+ Unique Battle Arenas
- Up to 4-player local multiplayer
- Ball customization system
- Tournament mode
- Dynamic physics and audio

🕹️ Controls:
- WASD: Move
- Mouse: Look around
- Space: Jump
- C: Toggle camera

Perfect for playing with friends on one computer!
```

### Step 4: Screenshots and Media
- Upload screenshots of different arenas
- Create a GIF of multiplayer action
- Add the game logo as the cover image

### Step 5: Publish
1. Click "Save & View Page" to preview
2. When satisfied, change visibility to "Public"

## 🐙 GitHub Release

### Step 1: Create a New Release
1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `Ball Blitz - Arcade Edition v1.0.0`

### Step 2: Upload Assets
1. Drag and drop `ball-blitz-github.zip`
2. Add release notes:

```markdown
# Ball Blitz - Arcade Edition v1.0.0

🎮 **First official release of Ball Blitz!**

## What's New
- ✨ 15+ unique battle arenas with themed hazards
- 👥 Local multiplayer support (up to 4 players)
- 🎨 Ball customization system
- 🏆 Tournament mode (first to 4 wins)
- 🎵 Dynamic audio system
- 📊 Leaderboard tracking

## 🚀 How to Play

1. Download `ball-blitz-github.zip`
2. Extract the files
3. Start a local HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open `http://localhost:8000`
5. Enjoy the game!

## 🕹️ Controls

| Action | Player 1 | Player 2 | Player 3 | Player 4 |
|--------|----------|----------|----------|----------|
| Move | WASD | Arrow Keys | IJKL | TFGH |

## 🛠️ Technical Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for Three.js CDN)
- HTTP server for local hosting

## 🐛 Bug Reports
Report issues in the GitHub Issues section.

---
**Have fun! 🎮✨**
```

### Step 3: Publish Release
1. Select "Set as the latest release"
2. Click "Publish release"

## 📋 Checklist Before Publishing

### Pre-Release Testing
- [ ] Test itch.io build offline (open index.html directly)
- [ ] Test GitHub build with HTTP server
- [ ] Verify all game modes work
- [ ] Test multiplayer with multiple controllers
- [ ] Check ball customization saves properly
- [ ] Verify audio works correctly
- [ ] Test on different browsers

### Itch.io Checklist
- [ ] Game title and description are compelling
- [ ] Screenshots show different arenas and features
- [ ] Tags are relevant and help discoverability
- [ ] Iframe size is appropriate (1024x768+)
- [ ] Game loads and plays correctly in browser

### GitHub Checklist
- [ ] Release notes are clear and detailed
- [ ] Download package includes all necessary files
- [ ] README.md has clear setup instructions
- [ ] Version number follows semantic versioning
- [ ] All links in documentation work

## 🔄 Future Updates

To update both platforms:

1. Run `./deploy.sh` to create new packages
2. Update version numbers
3. Upload new packages to both platforms
4. Update release notes with changelog

## 📊 Analytics and Feedback

### Itch.io
- Monitor downloads and ratings
- Respond to comments
- Update based on user feedback

### GitHub
- Watch for issues and pull requests
- Monitor download statistics
- Engage with the community

---

**Ready to share your game with the world! 🌟** 