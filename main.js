import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { GameLoop } from './gameLoop.js';
import { Player } from './player.js';
import { GridManager } from './gridManager.js';
import { CameraSystem } from './cameraSystem.js';
import { CollisionSystem } from './collisionSystem.js';
import { UIManager } from './UIManager.js';
import { LevelLoader } from './levelLoader.js';
import { MainMenu } from './mainMenu.js';
import { SinglePlayerMenu } from './singlePlayerMenu.js';
import { GameOverScreen } from './gameOverScreen.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scene = null;
        this.renderer = null;
        this.gameLoop = null;
        this.player = null;
        this.gridManager = null;
        this.cameraSystem = null;
        this.collisionSystem = null;
        this.uiManager = null;
        this.mainMenu = null;
        this.singlePlayerMenu = null;
        this.gameOverScreen = null;
        this.isGameInitialized = false;
        this.isPaused = false;
        this.pauseOverlay = null;
        
        // Level progression system for pacman mode
        this.currentLevel = 1;
        this.maxLevel = 10; // Maximum number of levels
        this.gameMode = 'normal'; // 'normal' or 'pacman'
        
        this.initializeMenu();
    }
    
    handleMainMenuSelection(mode) {
        if (mode === 'normal') {
            // Show single player options menu
            this.showSinglePlayerMenu();
        } else {
            // For other modes (like pacman), start directly
            this.startGame(mode);
        }
    }
    
    showMainMenu() {
        this.mainMenu.show();
        this.singlePlayerMenu.hide();
    }
    
    showSinglePlayerMenu() {
        this.mainMenu.hide();
        this.singlePlayerMenu.show();
    }
    
    initializeMenu() {
        // Create main menu
        this.mainMenu = new MainMenu((mode) => this.handleMainMenuSelection(mode));
        
        // Create single player menu
        this.singlePlayerMenu = new SinglePlayerMenu(
            (mode, level, difficulty) => this.startGame(mode, level, difficulty),
            () => this.showMainMenu()
        );
        
        // Create game over screen
        this.gameOverScreen = new GameOverScreen(
            () => this.returnToMainMenu(),
            () => this.retryLevel(),
            () => this.quitGame()
        );
        
        // Hide the game canvas initially
        this.canvas.style.display = 'none';
        
        // Hide game UI elements initially
        const gameUI = document.getElementById('ui');
        const crosshair = document.getElementById('crosshair');
        const instructions = document.getElementById('instructions');
        
        if (gameUI) gameUI.style.display = 'none';
        if (crosshair) crosshair.style.display = 'none';
        if (instructions) instructions.style.display = 'none';
    }
    
    createPauseOverlay() {
        const pauseOverlay = document.createElement('div');
        pauseOverlay.id = 'pauseOverlay';
        pauseOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            font-family: 'Courier New', monospace;
        `;
        
        const pauseTitle = document.createElement('h1');
        pauseTitle.textContent = 'GAME PAUSED';
        pauseTitle.style.cssText = `
            color: #00ffff;
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 30px;
            text-shadow: 3px 3px 0px #ff00ff, 6px 6px 0px #000000;
            text-align: center;
            letter-spacing: 4px;
            text-transform: uppercase;
        `;
        
        const pauseInstructions = document.createElement('p');
        pauseInstructions.textContent = 'Press O to resume or use the options below:';
        pauseInstructions.style.cssText = `
            color: #ffff00;
            font-size: 18px;
            font-weight: bold;
            text-shadow: 2px 2px 0px #000000;
            text-align: center;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 30px;
        `;
        
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            align-items: center;
        `;
        
        // Resume button
        const resumeButton = document.createElement('button');
        resumeButton.textContent = 'RESUME GAME';
        resumeButton.style.cssText = `
            background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
            border: 2px solid #00ffff;
            color: #00ffff;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            border-radius: 8px;
            cursor: pointer;
            text-shadow: 2px 2px 0px #000000;
            letter-spacing: 2px;
            transition: all 0.3s ease;
            min-width: 250px;
        `;
        
        // Main menu button
        const mainMenuButton = document.createElement('button');
        mainMenuButton.textContent = 'MAIN MENU';
        mainMenuButton.style.cssText = `
            background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
            border: 2px solid #ffff00;
            color: #ffff00;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            border-radius: 8px;
            cursor: pointer;
            text-shadow: 2px 2px 0px #000000;
            letter-spacing: 2px;
            transition: all 0.3s ease;
            min-width: 250px;
        `;
        
        // Quit button
        const quitButton = document.createElement('button');
        quitButton.textContent = 'QUIT GAME';
        quitButton.style.cssText = `
            background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
            border: 2px solid #ff00ff;
            color: #ff00ff;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            border-radius: 8px;
            cursor: pointer;
            text-shadow: 2px 2px 0px #000000;
            letter-spacing: 2px;
            transition: all 0.3s ease;
            min-width: 250px;
        `;
        
        // Add hover effects
        const addHoverEffect = (button, hoverColor) => {
            button.addEventListener('mouseenter', () => {
                button.style.background = `linear-gradient(135deg, #ff6600 0%, #ff9900 100%)`;
                button.style.color = '#000000';
                button.style.borderColor = hoverColor;
                button.style.transform = 'scale(1.05)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = `linear-gradient(135deg, #1a0033 0%, #330066 100%)`;
                button.style.color = hoverColor;
                button.style.borderColor = hoverColor;
                button.style.transform = 'scale(1)';
            });
        };
        
        addHoverEffect(resumeButton, '#00ffff');
        addHoverEffect(mainMenuButton, '#ffff00');
        addHoverEffect(quitButton, '#ff00ff');
        
        // Add event listeners
        resumeButton.addEventListener('click', () => {
            this.togglePause();
        });
        
        mainMenuButton.addEventListener('click', () => {
            this.pauseToMainMenu();
        });
        
        quitButton.addEventListener('click', () => {
            this.quitGame();
        });
        
        // Add elements to containers
        buttonsContainer.appendChild(resumeButton);
        buttonsContainer.appendChild(mainMenuButton);
        buttonsContainer.appendChild(quitButton);
        
        pauseOverlay.appendChild(pauseTitle);
        pauseOverlay.appendChild(pauseInstructions);
        pauseOverlay.appendChild(buttonsContainer);
        
        return pauseOverlay;
    }
    
    togglePause() {
        if (this.isPaused) {
            // Resume game
            this.isPaused = false;
            if (this.pauseOverlay) {
                document.body.removeChild(this.pauseOverlay);
                this.pauseOverlay = null;
            }
            
            // Enable player controls
            if (this.player) {
                this.player.enableControls();
            }
            
            // Resume game loop
            if (this.gameLoop) {
                this.gameLoop.start();
            }
            
            // Re-enable pointer lock
            this.canvas.requestPointerLock();
        } else {
            // Pause game
            this.isPaused = true;
            
            // Disable player controls
            if (this.player) {
                this.player.disableControls();
            }
            
            // Pause game loop
            if (this.gameLoop) {
                this.gameLoop.stop();
            }
            
            // Exit pointer lock
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
            
            // Show pause overlay
            this.pauseOverlay = this.createPauseOverlay();
            document.body.appendChild(this.pauseOverlay);
        }
    }
    
    async startGame(mode = 'normal', level = 1, difficulty = 'normal') {
        this.gameMode = mode; // Store game mode
        this.difficulty = difficulty; // Store difficulty
        
        // Set starting level (for single player mode with level selection)
        if (mode === 'normal' && level) {
            this.currentLevel = level;
        } else {
            this.currentLevel = 1; // Default to level 1 for other modes
        }
        
        // Show the game canvas
        this.canvas.style.display = 'block';
        
        // Show game UI elements
        const gameUI = document.getElementById('ui');
        const crosshair = document.getElementById('crosshair');
        const instructions = document.getElementById('instructions');
        
        if (gameUI) gameUI.style.display = 'block';
        if (crosshair) crosshair.style.display = 'block';
        if (instructions) instructions.style.display = 'block';
        
        // Initialize the game if not already done
        if (!this.isGameInitialized) {
            await this.init();
            this.isGameInitialized = true;
        }
        
        // Start the game loop
        this.gameLoop.start();
    }
    
    async init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLighting();
        await this.setupSystems();
        this.setupEventListeners();
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Set background color based on game mode
        if (this.gameMode === 'pacman') {
            this.renderer.setClearColor(0x000000); // Black background for neon theme
        } else {
            this.renderer.setClearColor(0x87CEEB); // Sky blue background for normal mode
        }
        
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }
    
    setupLighting() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        if (this.gameMode === 'pacman') {
            // Enhanced lighting for neon 80s/Tron theme
            
            // Dim the ambient light for more dramatic effect
            ambientLight.intensity = 0.2;
            ambientLight.color = new THREE.Color(0x001122); // Dark blue ambient
            
            // Add colored neon-style lights
            const neonLight1 = new THREE.DirectionalLight(0x00FFFF, 0.8); // Cyan light
            neonLight1.position.set(10, 10, 10);
            neonLight1.castShadow = true;
            neonLight1.shadow.mapSize.width = 2048;
            neonLight1.shadow.mapSize.height = 2048;
            this.scene.add(neonLight1);
            
            const neonLight2 = new THREE.DirectionalLight(0xFF00FF, 0.6); // Magenta light
            neonLight2.position.set(-10, 10, -10);
            neonLight2.castShadow = true;
            neonLight2.shadow.mapSize.width = 2048;
            neonLight2.shadow.mapSize.height = 2048;
            this.scene.add(neonLight2);
            
            // Add point lights for extra glow effect
            const pointLight1 = new THREE.PointLight(0xFFFF00, 2, 30); // Yellow point light
            pointLight1.position.set(0, 5, 0);
            this.scene.add(pointLight1);
            
            const pointLight2 = new THREE.PointLight(0x00FF00, 1.5, 25); // Green point light
            pointLight2.position.set(0, 8, 0);
            this.scene.add(pointLight2);
            
        } else if (this.gameMode === 'normal') {
            // PS2 theme lighting for single player mode
            
            // PS2-style lighting colors based on current level
            const ps2LightThemes = {
                1: { primary: 0x0099FF, secondary: 0x00CCFF }, // Blue
                2: { primary: 0xFF0099, secondary: 0xFF33CC }, // Magenta
                3: { primary: 0x00FF33, secondary: 0x66FF99 }, // Green
                4: { primary: 0xFF6600, secondary: 0xFF9933 }, // Orange
                5: { primary: 0x00CCCC, secondary: 0x33FFFF }, // Cyan
                6: { primary: 0xFFCC00, secondary: 0xFFFF33 }, // Yellow
                7: { primary: 0xFF0066, secondary: 0xFF3399 }, // Pink
                8: { primary: 0x3366FF, secondary: 0x6699FF }, // Blue
                9: { primary: 0xCC00CC, secondary: 0xFF33FF }, // Purple
                10: { primary: 0x9999FF, secondary: 0xCCCCFF } // Light Purple
            };
            
            const lightThemeIndex = ((this.currentLevel - 1) % 10) + 1;
            const lightTheme = ps2LightThemes[lightThemeIndex];
            
            // Adjust ambient light for PS2 theme
            ambientLight.intensity = 0.3;
            ambientLight.color = new THREE.Color(0x222244); // Dark blue-purple ambient
            
            // PS2-style directional lights
            const ps2Light1 = new THREE.DirectionalLight(lightTheme.primary, 0.7);
            ps2Light1.position.set(10, 10, 10);
            ps2Light1.castShadow = true;
            ps2Light1.shadow.mapSize.width = 2048;
            ps2Light1.shadow.mapSize.height = 2048;
            this.scene.add(ps2Light1);
            
            const ps2Light2 = new THREE.DirectionalLight(lightTheme.secondary, 0.5);
            ps2Light2.position.set(-10, 10, -10);
            ps2Light2.castShadow = true;
            ps2Light2.shadow.mapSize.width = 2048;
            ps2Light2.shadow.mapSize.height = 2048;
            this.scene.add(ps2Light2);
            
            // PS2-style point lights for glow effect
            const ps2PointLight = new THREE.PointLight(lightTheme.primary, 1.5, 25);
            ps2PointLight.position.set(0, 6, 0);
            this.scene.add(ps2PointLight);
            
        } else {
            // Standard lighting for normal mode
            
            // Directional light (sun)
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(10, 10, 5);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.1;
            directionalLight.shadow.camera.far = 100;
            directionalLight.shadow.camera.left = -50;
            directionalLight.shadow.camera.right = 50;
            directionalLight.shadow.camera.top = 50;
            directionalLight.shadow.camera.bottom = -50;
            this.scene.add(directionalLight);
            
            // Point light for additional illumination
            const pointLight = new THREE.PointLight(0xffffff, 1, 50);
            pointLight.position.set(0, 10, 0);
            this.scene.add(pointLight);
        }
    }
    
    async setupSystems() {
        // Initialize level loader and load a level
        this.levelLoader = new LevelLoader();
        
        // Load appropriate level based on game mode
        if (this.gameMode === 'pacman') {
            // Try to load pacman level, fallback to creating one
            try {
                await this.levelLoader.loadLevel('./levels/pacman.json');
            } catch (error) {
                console.warn('Could not load pacman.json, creating default pacman level');
                this.levelLoader.loadLevelFromData(this.levelLoader.createPacmanLevel());
            }
        } else {
            // Load level based on current level number
            const levelFile = `./levels/level${this.currentLevel}.json`;
            try {
                await this.levelLoader.loadLevel(levelFile);
            } catch (error) {
                console.warn(`Could not load ${levelFile}, using default level`);
                this.levelLoader.loadLevelFromData(this.levelLoader.createTestLevel());
            }
        }
        
        // Initialize all game systems with level data
        this.gridManager = new GridManager(this.scene, this.levelLoader);
        this.player = new Player(this.scene);
        
        // Get spawn point from level
        const spawnPoint = this.levelLoader.getSpawnPoint();
        this.player.setSpawnPoint(spawnPoint);
        
        // Set player reference in grid manager for ghost AI
        this.gridManager.setPlayer(this.player);
        
        this.cameraSystem = new CameraSystem(this.player);
        this.collisionSystem = new CollisionSystem();
        this.uiManager = new UIManager();
        
        // Setup collision system with grid and player
        this.collisionSystem.setPlayer(this.player);
        this.collisionSystem.setGrid(this.gridManager);
        this.collisionSystem.setGameOverCallback(() => this.handleGameOver());
        
        // Setup game loop
        this.gameLoop = new GameLoop(this.renderer, this.scene, this.cameraSystem.camera, {
            player: this.player,
            gridManager: this.gridManager,
            cameraSystem: this.cameraSystem,
            collisionSystem: this.collisionSystem,
            uiManager: this.uiManager,
            levelLoader: this.levelLoader
        });
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.cameraSystem.camera.aspect = window.innerWidth / window.innerHeight;
            this.cameraSystem.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Handle pointer lock
        this.canvas.addEventListener('click', () => {
            if (!this.isPaused) {
                this.canvas.requestPointerLock();
            }
        });
        
        // Handle pointer lock change
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === this.canvas && !this.isPaused) {
                this.player.enableControls();
            } else {
                this.player.disableControls();
            }
        });
        
        // Handle O key for pause functionality
        document.addEventListener('keydown', (event) => {
            if ((event.key === 'o' || event.key === 'O') && this.isGameInitialized) {
                event.preventDefault();
                
                // Only handle pause if main menu is not visible
                if (!this.mainMenu.isVisible) {
                    this.togglePause();
                }
            }
            
            // Handle ESC key for main menu
            if (event.key === 'Escape' && this.isGameInitialized) {
                event.preventDefault();
                
                // Check if main menu is visible
                if (this.mainMenu.isVisible) {
                    // Hide menu and resume game
                    this.mainMenu.hide();
                    this.canvas.style.display = 'block';
                    
                    // Show game UI
                    const gameUI = document.getElementById('ui');
                    const crosshair = document.getElementById('crosshair');
                    const instructions = document.getElementById('instructions');
                    
                    if (gameUI) gameUI.style.display = 'block';
                    if (crosshair) crosshair.style.display = 'block';
                    if (instructions) instructions.style.display = 'block';
                    
                    if (this.gameLoop) {
                        this.gameLoop.start();
                    }
                } else {
                    // Show main menu
                    this.toggleMainMenu();
                }
            }
        });
    }
    
    toggleMainMenu() {
        if (this.mainMenu.isVisible) {
            // Hide menu and resume game
            this.mainMenu.hide();
            this.canvas.style.display = 'block';
            
            // Show game UI
            const gameUI = document.getElementById('ui');
            const crosshair = document.getElementById('crosshair');
            const instructions = document.getElementById('instructions');
            
            if (gameUI) gameUI.style.display = 'block';
            if (crosshair) crosshair.style.display = 'block';
            if (instructions) instructions.style.display = 'block';
            
            if (this.gameLoop) {
                this.gameLoop.start();
            }
        } else {
            // Show menu and pause game
            this.mainMenu.show();
            this.canvas.style.display = 'none';
            
            // Hide game UI
            const gameUI = document.getElementById('ui');
            const crosshair = document.getElementById('crosshair');
            const instructions = document.getElementById('instructions');
            
            if (gameUI) gameUI.style.display = 'none';
            if (crosshair) crosshair.style.display = 'none';
            if (instructions) instructions.style.display = 'none';
            
            if (this.gameLoop) {
                this.gameLoop.stop();
            }
        }
    }
    
    handleGameOver() {
        console.log('Handling game over - showing game over screen');
        
        // Stop the game loop
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
        
        // Hide game elements
        this.canvas.style.display = 'none';
        const gameUI = document.getElementById('ui');
        const crosshair = document.getElementById('crosshair');
        const instructions = document.getElementById('instructions');
        
        if (gameUI) gameUI.style.display = 'none';
        if (crosshair) crosshair.style.display = 'none';
        if (instructions) instructions.style.display = 'none';
        
        // Show game over screen
        this.gameOverScreen.show();
    }
    
    // Level progression methods for pacman mode
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    nextLevel() {
        if (this.gameMode === 'pacman' && this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            console.log(`Advanced to level ${this.currentLevel}`);
            // TODO: Reload level with new difficulty
            return true;
        }
        return false;
    }
    
    // Calculate ghost speed based on current level
    getGhostSpeed() {
        if (this.gameMode === 'pacman') {
            // For pacman mode, use level-based progression
            if (this.currentLevel <= 3) {
                // First 3 levels: much slower ghost speed
                return 4.0 + (this.currentLevel - 1) * 1.0; // 4, 5, 6
            } else {
                // Level 4+: original speed progression
                return 11.0 + (this.currentLevel - 4) * 1.5; // 11, 12.5, 14, etc.
            }
        } else {
            // For normal mode, check if level has specific ghost speeds
            const levelData = this.levelLoader.getCurrentLevel();
            if (levelData && levelData.ghosts && levelData.ghosts.length > 0) {
                // Return the speed from the first ghost as default
                return levelData.ghosts[0].speed || 11.0;
            }
            return 11.0; // Default speed for non-pacman modes
        }
    }
    
    // Pause screen handler for returning to main menu
    pauseToMainMenu() {
        console.log('Returning to main menu from pause');
        
        // Stop the game loop
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
        
        // Hide game elements
        this.canvas.style.display = 'none';
        const gameUI = document.getElementById('ui');
        const crosshair = document.getElementById('crosshair');
        const instructions = document.getElementById('instructions');
        
        if (gameUI) gameUI.style.display = 'none';
        if (crosshair) crosshair.style.display = 'none';
        if (instructions) instructions.style.display = 'none';
        
        // Reset game state for next play
        this.isGameInitialized = false;
        this.currentLevel = 1;
        this.isPaused = false;
        
        // Clean up pause overlay
        if (this.pauseOverlay) {
            document.body.removeChild(this.pauseOverlay);
            this.pauseOverlay = null;
        }
        
        // Exit pointer lock
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Hide all menus and show main menu
        this.singlePlayerMenu.hide();
        this.mainMenu.show();
    }

    // Game over screen handlers
    returnToMainMenu() {
        console.log('Returning to main menu');
        
        // Hide game over screen
        this.gameOverScreen.hide();
        
        // Reset game state for next play
        this.isGameInitialized = false;
        this.currentLevel = 1;
        this.isPaused = false;
        
        // Clean up pause overlay if exists
        if (this.pauseOverlay) {
            document.body.removeChild(this.pauseOverlay);
            this.pauseOverlay = null;
        }
        
        // Hide all menus and show main menu
        this.singlePlayerMenu.hide();
        this.mainMenu.show();
    }
    
    retryLevel() {
        console.log('Retrying level');
        
        // Reset player lives
        if (this.player) {
            this.player.resetLives();
        }
        
        // Reset pause state
        this.isPaused = false;
        if (this.pauseOverlay) {
            document.body.removeChild(this.pauseOverlay);
            this.pauseOverlay = null;
        }
        
        // Restart the current level
        this.restartCurrentLevel();
    }
    
    quitGame() {
        console.log('Quitting game');
        
        // Create a styled confirmation dialog
        const confirmOverlay = document.createElement('div');
        confirmOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            font-family: 'Arial', sans-serif;
        `;
        
        const confirmPanel = document.createElement('div');
        confirmPanel.style.cssText = `
            background: #8b0000;
            padding: 40px;
            border-radius: 12px;
            border: 2px solid rgba(255,255,255,0.3);
            text-align: center;
            max-width: 400px;
        `;
        
        const confirmTitle = document.createElement('h2');
        confirmTitle.textContent = 'Quit Game';
        confirmTitle.style.cssText = `
            color: #ffffff;
            margin-bottom: 20px;
            font-size: 24px;
        `;
        
        const confirmMessage = document.createElement('p');
        confirmMessage.textContent = 'Are you sure you want to quit the game?';
        confirmMessage.style.cssText = `
            color: #ffffff;
            margin-bottom: 30px;
            font-size: 16px;
        `;
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 20px;
            justify-content: center;
        `;
        
        const yesButton = document.createElement('button');
        yesButton.textContent = 'Yes, Quit';
        yesButton.style.cssText = `
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.3);
            color: #ffffff;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        const noButton = document.createElement('button');
        noButton.textContent = 'Cancel';
        noButton.style.cssText = `
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.3);
            color: #ffffff;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        yesButton.addEventListener('click', () => {
            window.close();
        });
        
        noButton.addEventListener('click', () => {
            document.body.removeChild(confirmOverlay);
        });
        
        buttonsContainer.appendChild(yesButton);
        buttonsContainer.appendChild(noButton);
        
        confirmPanel.appendChild(confirmTitle);
        confirmPanel.appendChild(confirmMessage);
        confirmPanel.appendChild(buttonsContainer);
        
        confirmOverlay.appendChild(confirmPanel);
        document.body.appendChild(confirmOverlay);
    }
    
    async restartCurrentLevel() {
        try {
            // Hide game over screen
            this.gameOverScreen.hide();
            
            // Reset pause state
            this.isPaused = false;
            if (this.pauseOverlay) {
                document.body.removeChild(this.pauseOverlay);
                this.pauseOverlay = null;
            }
            
            // Show game elements
            this.canvas.style.display = 'block';
            const gameUI = document.getElementById('ui');
            const crosshair = document.getElementById('crosshair');
            const instructions = document.getElementById('instructions');
            
            if (gameUI) gameUI.style.display = 'block';
            if (crosshair) crosshair.style.display = 'block';
            if (instructions) instructions.style.display = 'block';
            
            // Reinitialize the game systems with current level
            await this.setupSystems();
            
            // Restart the game loop
            this.gameLoop.start();
            
        } catch (error) {
            console.error('Error restarting level:', error);
            // Fall back to main menu
            this.returnToMainMenu();
        }
    }
}

// Initialize the game
window.game = new Game(); 