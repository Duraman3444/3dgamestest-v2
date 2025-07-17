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
import { PacmanMenu } from './pacmanMenu.js';
import { BattleMenu } from './battleMenu.js';
import { GameOverScreen } from './gameOverScreen.js';
import { SettingsManager } from './settingsManager.js';
import { BattleSystem } from './battleSystem.js';
import { BattleUI } from './battleUI.js';

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
        this.pacmanMenu = null;
        this.battleMenu = null;
        this.gameOverScreen = null;
        this.settingsManager = null;
        this.battleSystem = null;
        this.battleUI = null;
        this.isGameInitialized = false;
        this.isPaused = false;
        this.pauseOverlay = null;
        
        // Level progression system for pacman mode
        this.currentLevel = 1;
        this.maxLevel = 10; // Maximum number of levels
        this.gameMode = 'normal'; // 'normal' or 'pacman'
        
        // Pacman timer system
        this.pacmanTimer = null; // Countdown timer for pacman mode
        this.pacmanLevelTimeLimit = 0; // Time limit for current pacman level in seconds
        this.pacmanTimeRemaining = 0; // Remaining time in seconds
        this.pacmanTimerStarted = false;
        
        // Classic pacman mode system
        this.isClassicMode = false; // Flag for classic mode
        this.classicLives = 3; // Starting lives for classic mode
        this.classicWave = 1; // Current wave/round in classic mode
        this.classicPlayerSpeed = 12; // Starting player speed in classic mode
        this.classicEnemySpeed = 8; // Starting enemy speed in classic mode
        this.maxClassicSpeed = 20; // Maximum speed for both player and enemies
     
        this.initializeMenu();
    }
    
    handleMainMenuSelection(mode) {
        if (mode === 'normal') {
            // Show single player options menu
            this.showSinglePlayerMenu();
        } else if (mode === 'pacman') {
            // Show pacman mode menu
            this.showPacmanMenu();
        } else if (mode === 'battle') {
            // Show battle mode menu
            this.showBattleMenu();
        } else {
            // For other modes, start directly
            this.startGame(mode);
        }
    }
    
    showMainMenu() {
        // Clear any active notifications
        if (this.uiManager) {
            this.uiManager.clearNotification();
        }
        
        this.mainMenu.show();
        this.singlePlayerMenu.hide();
        this.pacmanMenu.hide();
        this.battleMenu.hide();
    }
    
    showSinglePlayerMenu() {
        this.mainMenu.hide();
        this.singlePlayerMenu.show();
    }
    
    showPacmanMenu() {
        this.mainMenu.hide();
        this.pacmanMenu.show();
    }
    
    showBattleMenu() {
        this.mainMenu.hide();
        this.battleMenu.show();
    }
    
    initializeMenu() {
        // Create settings manager
        this.settingsManager = new SettingsManager();
        
        // Set up settings change callback
        this.settingsManager.setOnSettingsChanged((category, key, value) => {
            this.applyGameSetting(category, key, value);
        });
        
        // Create main menu
        this.mainMenu = new MainMenu((mode) => this.handleMainMenuSelection(mode));
        
        // Create single player menu
        this.singlePlayerMenu = new SinglePlayerMenu(
            (mode, level, difficulty) => this.startGame(mode, level, difficulty),
            () => this.showMainMenu()
        );
        
        // Create pacman menu
        this.pacmanMenu = new PacmanMenu(
            (mode, level, difficulty) => this.startGame(mode, level, difficulty),
            () => this.showMainMenu()
        );
        
        // Create battle menu
        this.battleMenu = new BattleMenu(
            (mode, level, difficulty) => this.startGame('battle', level, difficulty),
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
        
        // Set global game reference for settings
        window.game = this;
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
        
        // Create mode-specific pause instructions
        let instructionText = 'Press O to resume or use the options below:';
        if (this.gameMode === 'battle') {
            instructionText = 'BATTLE PAUSED - Press O to resume combat:';
        } else if (this.gameMode === 'pacman' || this.gameMode === 'pacman_classic') {
            instructionText = this.isClassicMode ? 
                'CLASSIC MODE PAUSED - Press O to resume:' : 
                'PACMAN MODE PAUSED - Press O to resume:';
        }
        
        pauseInstructions.textContent = instructionText;
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
        
        // Restart level button
        const restartLevelButton = document.createElement('button');
        restartLevelButton.textContent = 'RESTART LEVEL';
        restartLevelButton.style.cssText = `
            background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
            border: 2px solid #ff6600;
            color: #ff6600;
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
        
        // Settings button
        const settingsButton = document.createElement('button');
        settingsButton.textContent = 'SETTINGS';
        settingsButton.style.cssText = `
            background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
            border: 2px solid #00ff00;
            color: #00ff00;
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
        addHoverEffect(restartLevelButton, '#ff6600');
        addHoverEffect(mainMenuButton, '#ffff00');
        addHoverEffect(settingsButton, '#00ff00');
        addHoverEffect(quitButton, '#ff00ff');
        
        // Add event listeners
        resumeButton.addEventListener('click', () => {
            this.togglePause();
        });
        
        restartLevelButton.addEventListener('click', () => {
            this.restartCurrentLevelFromPause();
        });
        
        mainMenuButton.addEventListener('click', () => {
            this.pauseToMainMenu();
        });
        
        settingsButton.addEventListener('click', () => {
            this.showPauseSettings();
        });
        
        quitButton.addEventListener('click', () => {
            this.quitGame();
        });
        
        // Add elements to containers
        buttonsContainer.appendChild(resumeButton);
        buttonsContainer.appendChild(restartLevelButton);
        buttonsContainer.appendChild(mainMenuButton);
        buttonsContainer.appendChild(settingsButton);
        buttonsContainer.appendChild(quitButton);
        
        pauseOverlay.appendChild(pauseTitle);
        pauseOverlay.appendChild(pauseInstructions);
        pauseOverlay.appendChild(buttonsContainer);
        
        return pauseOverlay;
    }
    
    togglePause() {
        // Prevent pausing during certain states
        if (this.gameOverScreen && this.gameOverScreen.isVisible) {
            console.log('Cannot pause during game over screen');
            return;
        }
        
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
            
            // Resume battle system if in battle mode
            if (this.battleSystem && this.gameMode === 'battle') {
                this.battleSystem.isActive = true;
            }
            
            // Re-enable pointer lock
            this.canvas.requestPointerLock();
            
            console.log('Game resumed');
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
            
            // Pause battle system if in battle mode
            if (this.battleSystem && this.gameMode === 'battle') {
                this.battleSystem.isActive = false;
            }
            
            // Exit pointer lock
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
            
            // Show pause overlay
            this.pauseOverlay = this.createPauseOverlay();
            document.body.appendChild(this.pauseOverlay);
            
            console.log('Game paused');
        }
    }
    
    showPauseSettings() {
        if (this.settingsManager) {
            this.settingsManager.createSettingsPanel(() => {
                // Settings panel closed - no additional action needed
            });
        }
    }

    // Restart current level from pause menu
    async restartCurrentLevelFromPause() {
        console.log('Restarting current level from pause menu...');
        
        // Clear any active notifications
        if (this.uiManager) {
            this.uiManager.clearNotification();
        }
        
        // Stop and reset pacman timer if in pacman mode
        if (this.gameMode === 'pacman') {
            this.stopPacmanTimer();
        }
        
        // Clear per-level progress for current level
        this.clearPerLevelProgress();
        
        // Clear current saved game state
        this.clearSavedGameState();
        
        // Hide pause overlay
        if (this.pauseOverlay) {
            document.body.removeChild(this.pauseOverlay);
            this.pauseOverlay = null;
        }
        
        this.isPaused = false;
        
        // Restart the current level
        await this.restartCurrentLevel();
        
        console.log(`Level ${this.currentLevel} restarted successfully`);
    }
    
    applyGameSetting(category, key, value) {
        console.log(`Applying setting: ${category}.${key} = ${value}`);
        
        switch (category) {
            case 'audio':
                this.applyAudioSetting(key, value);
                break;
            case 'graphics':
                this.applyGraphicsSetting(key, value);
                break;
            case 'controls':
                this.applyControlsSetting(key, value);
                break;
            case 'ui':
                this.applyUISetting(key, value);
                break;
        }
    }
    
    applyAudioSetting(key, value) {
        // Apply audio settings
        switch (key) {
            case 'masterVolume':
                // Apply master volume (would need audio system)
                console.log(`Master volume set to ${value}%`);
                break;
            case 'musicVolume':
                // Apply music volume
                console.log(`Music volume set to ${value}%`);
                break;
            case 'sfxVolume':
                // Apply SFX volume
                console.log(`SFX volume set to ${value}%`);
                break;
        }
    }
    
    applyGraphicsSetting(key, value) {
        // Apply graphics settings
        switch (key) {
            case 'quality':
                this.applyGraphicsQuality(value);
                break;
            case 'enableShadows':
                this.applyTsShadows(value);
                break;
            case 'enableFog':
                this.applyFogSetting(value);
                break;
            case 'enableAntiAliasing':
                this.applyAntiAliasing(value);
                break;
        }
    }
    
    applyControlsSetting(key, value) {
        // Apply controls settings
        switch (key) {
            case 'mouseSensitivity':
                if (this.player) {
                    this.player.mouseSensitivity = value * 0.00004; // Convert to usable range
                }
                break;
            case 'invertY':
                if (this.player) {
                    this.player.invertY = value;
                }
                break;
        }
    }
    
    applyUISetting(key, value) {
        // Apply UI settings
        switch (key) {
            case 'showFPS':
                if (this.uiManager) {
                    this.uiManager.settings.showFPS = value;
                    this.uiManager.updateVisibility();
                }
                break;
            case 'showMinimap':
                if (this.uiManager) {
                    this.uiManager.settings.showMinimap = value;
                    this.uiManager.updateVisibility();
                }
                break;
            case 'showCrosshair':
                const crosshair = document.getElementById('crosshair');
                if (crosshair) {
                    crosshair.style.display = value ? 'block' : 'none';
                }
                break;
        }
    }
    
    applyGraphicsQuality(quality) {
        if (this.renderer) {
            switch (quality) {
                case 'low':
                    this.renderer.setPixelRatio(0.5);
                    this.renderer.shadowMap.enabled = false;
                    break;
                case 'medium':
                    this.renderer.setPixelRatio(1);
                    this.renderer.shadowMap.enabled = true;
                    break;
                case 'high':
                    this.renderer.setPixelRatio(window.devicePixelRatio);
                    this.renderer.shadowMap.enabled = true;
                    break;
            }
        }
    }
    
    applyTsShadows(enabled) {
        if (this.renderer) {
            this.renderer.shadowMap.enabled = enabled;
        }
    }
    
    applyFogSetting(enabled) {
        if (this.scene) {
            if (enabled) {
                this.scene.fog = new THREE.Fog(0x222222, 80, 300);
            } else {
                this.scene.fog = null;
            }
        }
    }
    
    // Classic mode lives management
    setClassicLives(newLives) {
        // Ensure classic lives never exceed 3 and never go below 0
        this.classicLives = Math.max(0, Math.min(newLives, 3));
        return this.classicLives;
    }
    
    applyAntiAliasing(enabled) {
        // Anti-aliasing requires renderer recreation, so just log for now
        console.log(`Anti-aliasing ${enabled ? 'enabled' : 'disabled'} - requires restart`);
    }
    
    async startGame(mode = 'normal', level = 1, difficulty = 'normal') {
        this.gameMode = mode; // Store game mode
        this.difficulty = difficulty; // Store difficulty
        
        // Reset pacman timer state
        this.stopPacmanTimer();
        
        // Handle classic pacman mode
        if (mode === 'pacman_classic') {
            this.isClassicMode = true;
            this.currentLevel = 2; // Always use level 2 for classic mode
            this.setClassicLives(3); // Reset lives using safe method
            this.classicWave = 1; // Reset wave counter
            this.classicPlayerSpeed = 12; // Reset speeds
            this.classicEnemySpeed = 8;
        } else {
            this.isClassicMode = false;
            // Set starting level (for single player mode and pacman mode with level selection)
            if ((mode === 'normal' || mode === 'pacman') && level) {
                this.currentLevel = level;
            } else {
                this.currentLevel = 1; // Default to level 1 for other modes
            }
        }
        
        // Clear any active notifications
        if (this.uiManager) {
            this.uiManager.clearNotification();
        }
        
        // Clean up UI elements to prevent duplication
        this.cleanupUIElements();
        
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
        
        // Start auto-save system (but not in pacman modes)
        if (!this.isClassicMode && this.gameMode !== 'pacman' && this.gameMode !== 'pacman_classic') {
            this.startAutoSave();
        }
        
        // Apply initial settings
        if (this.settingsManager) {
            this.settingsManager.applySettings();
        }
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
        
        // Set background color based on game mode - slightly brighter
        if (this.gameMode === 'pacman') {
            this.renderer.setClearColor(0x111122); // Dark blue-grey background for neon theme
        } else {
            this.renderer.setClearColor(0x87CEEB); // Sky blue background for normal mode
        }
        
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Add fog for depth - reduced intensity for better visibility
        this.scene.fog = new THREE.Fog(0x87CEEB, 80, 300);
    }
    
    setupLighting() {
        // Ambient light for general illumination - significantly brighter
        const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
        this.scene.add(ambientLight);
        
        if (this.gameMode === 'pacman') {
            // Enhanced lighting for neon 80s/Tron theme - much brighter
            
            // Increase ambient light for better visibility while maintaining atmosphere
            ambientLight.intensity = 0.8;
            ambientLight.color = new THREE.Color(0x223344); // Brighter blue ambient
            
            // Add colored neon-style lights - increased intensity
            const neonLight1 = new THREE.DirectionalLight(0x00FFFF, 1.5); // Cyan light - brighter
            neonLight1.position.set(10, 10, 10);
            neonLight1.castShadow = true;
            neonLight1.shadow.mapSize.width = 2048;
            neonLight1.shadow.mapSize.height = 2048;
            this.scene.add(neonLight1);
            
            const neonLight2 = new THREE.DirectionalLight(0xFF00FF, 1.2); // Magenta light - brighter
            neonLight2.position.set(-10, 10, -10);
            neonLight2.castShadow = true;
            neonLight2.shadow.mapSize.width = 2048;
            neonLight2.shadow.mapSize.height = 2048;
            this.scene.add(neonLight2);
            
            // Add point lights for extra glow effect - increased intensity
            const pointLight1 = new THREE.PointLight(0xFFFF00, 3, 35); // Yellow point light - brighter
            pointLight1.position.set(0, 5, 0);
            this.scene.add(pointLight1);
            
            const pointLight2 = new THREE.PointLight(0x00FF00, 2.5, 30); // Green point light - brighter
            pointLight2.position.set(0, 8, 0);
            this.scene.add(pointLight2);
            
        } else if (this.gameMode === 'normal') {
            // PS2 theme lighting for single player mode - much brighter
            
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
            
            // Adjust ambient light for PS2 theme - much brighter
            ambientLight.intensity = 0.9;
            ambientLight.color = new THREE.Color(0x444466); // Brighter blue-purple ambient
            
            // PS2-style directional lights - increased intensity
            const ps2Light1 = new THREE.DirectionalLight(lightTheme.primary, 1.3);
            ps2Light1.position.set(10, 10, 10);
            ps2Light1.castShadow = true;
            ps2Light1.shadow.mapSize.width = 2048;
            ps2Light1.shadow.mapSize.height = 2048;
            this.scene.add(ps2Light1);
            
            const ps2Light2 = new THREE.DirectionalLight(lightTheme.secondary, 1.0);
            ps2Light2.position.set(-10, 10, -10);
            ps2Light2.castShadow = true;
            ps2Light2.shadow.mapSize.width = 2048;
            ps2Light2.shadow.mapSize.height = 2048;
            this.scene.add(ps2Light2);
            
            // PS2-style point lights for glow effect - increased intensity
            const ps2PointLight = new THREE.PointLight(lightTheme.primary, 2.5, 35);
            ps2PointLight.position.set(0, 6, 0);
            this.scene.add(ps2PointLight);
            
        } else {
            // Standard lighting for normal mode - much brighter
            
            // Directional light (sun) - increased intensity
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
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
            
            // Point light for additional illumination - increased intensity
            const pointLight = new THREE.PointLight(0xffffff, 2, 60);
            pointLight.position.set(0, 10, 0);
            this.scene.add(pointLight);
        }
    }
    
    async setupSystems() {
        // Initialize level loader and load a level
        this.levelLoader = new LevelLoader();
        
        // Load appropriate level based on game mode
        if (this.gameMode === 'pacman' || this.gameMode === 'pacman_classic') {
            // For classic mode, always use level 2
            const levelToLoad = this.isClassicMode ? 2 : this.currentLevel;
            const pacmanLevelFile = `./levels/pacman${levelToLoad}.json`;
            try {
                await this.levelLoader.loadLevel(pacmanLevelFile);
            } catch (error) {
                console.warn(`Could not load ${pacmanLevelFile}, trying fallback`);
                try {
                    await this.levelLoader.loadLevel('./levels/pacman.json');
                } catch (fallbackError) {
                    console.warn('Could not load pacman.json, creating default pacman level');
                    this.levelLoader.loadLevelFromData(this.levelLoader.createPacmanLevel());
                }
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
        
        // Sync player lives with classic mode lives if in classic mode
        if (this.isClassicMode) {
            this.player.setLives(this.classicLives);
        }
        
        // Set level-specific player speed
        this.player.speed = this.getPlayerSpeed();
        
        // Get spawn point from level
        const spawnPoint = this.levelLoader.getSpawnPoint();
        this.player.setSpawnPoint(spawnPoint);
        
        // Set cross-references between player and grid manager
        this.gridManager.setPlayer(this.player);
        this.player.setGridManager(this.gridManager);
        
        this.cameraSystem = new CameraSystem(this.player);
        this.collisionSystem = new CollisionSystem();
        this.uiManager = new UIManager();
        
        // Setup collision system with grid and player
        this.collisionSystem.setPlayer(this.player);
        this.collisionSystem.setGrid(this.gridManager);
        this.collisionSystem.setGameOverCallback(() => this.handleGameOver());
        this.collisionSystem.setLevelCompletionCallback(() => this.handleLevelCompletion());
        
        // Reset collision system state for new level
        this.collisionSystem.resetForNewLevel();
        
        // Initialize battle system if in battle mode
        if (this.gameMode === 'battle') {
            this.battleSystem = new BattleSystem(this.scene, this.player);
            this.battleUI = new BattleUI();
            
            // Setup battle system callbacks
            this.battleSystem.setVictoryCallback(() => this.handleBattleVictory());
            this.battleSystem.setDefeatCallback(() => this.handleBattleDefeat());
            
            // Start battle at specified level
            this.battleSystem.startBattle(this.currentLevel);
        }

        // Setup game loop
        this.gameLoop = new GameLoop(this.renderer, this.scene, this.cameraSystem.camera, {
            player: this.player,
            gridManager: this.gridManager,
            cameraSystem: this.cameraSystem,
            collisionSystem: this.collisionSystem,
            uiManager: this.uiManager,
            levelLoader: this.levelLoader,
            battleSystem: this.battleSystem,
            battleUI: this.battleUI
        });

        // Load existing level progress if available (skip for battle mode and classic mode)
        if (this.gameMode !== 'battle' && !this.isClassicMode) {
            // This ensures that if a player has previously played this level and collected items,
            // those items remain collected when they restart the level
            this.loadAndApplyLevelProgress();
        }
        
        // Start pacman timer if in pacman mode
        if (this.gameMode === 'pacman') {
            this.startPacmanTimer();
        }
    }

    // Load and apply existing level progress
    loadAndApplyLevelProgress() {
        const levelProgress = this.loadPerLevelProgress();
        if (levelProgress && levelProgress.collectedItems) {
            console.log(`Loading existing progress for ${this.gameMode} level ${this.currentLevel}`);
            
            // Apply the collected items to the current level
            this.restoreCollectedItemsState(levelProgress.collectedItems);
            
            // Update the collision system with the collected items count
            if (this.collisionSystem) {
                const collectedCount = levelProgress.collectedItems.collectibles.length;
                this.collisionSystem.collectiblesCollected = collectedCount;
                
                // Update score based on collected items
                this.collisionSystem.score = (collectedCount * 10) + (levelProgress.collectedItems.key ? 50 : 0);
            }
            
            console.log(`Applied existing progress: ${levelProgress.collectedItems.collectibles.length} collectibles and ${levelProgress.collectedItems.key ? 1 : 0} keys`);
        }
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
        
        // Handle O key for pause functionality - use capture phase for higher priority
        document.addEventListener('keydown', (event) => {
            if ((event.key === 'o' || event.key === 'O') && this.isGameInitialized) {
                event.preventDefault();
                event.stopPropagation(); // Prevent other listeners from handling this
                
                // Check if any menus are visible and prevent pause
                const menuVisible = this.mainMenu.isVisible || 
                                  this.singlePlayerMenu.isVisible || 
                                  this.pacmanMenu.isVisible || 
                                  this.battleMenu.isVisible ||
                                  this.gameOverScreen.isVisible;
                
                // Only handle pause if no menus are visible and game is active
                if (!menuVisible) {
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
        }, true); // Use capture phase for higher priority
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
            // Clear any active notifications
            if (this.uiManager) {
                this.uiManager.clearNotification();
            }
            
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
        
        // Handle classic mode lives system
        if (this.isClassicMode) {
            // Use the player's actual lives count (already decremented by collision system)
            this.classicLives = this.player.getLives();
            console.log(`Classic Mode: Life lost! Lives remaining: ${this.classicLives}`);
            
            if (this.classicLives > 0) {
                // Still have lives, respawn player
                this.handleClassicModeRespawn();
                return;
            } else {
                // No more lives, game over
                console.log('Classic Mode: All lives lost! Game Over!');
                // Reset lives for next game
                this.player.resetLives();
                this.setClassicLives(3);
            }
        }
        
        // Stop pacman timer if in pacman mode
        if (this.gameMode === 'pacman' || this.gameMode === 'pacman_classic') {
            this.stopPacmanTimer();
        }
        
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
    
    // Handle classic mode respawn after losing a life
    async handleClassicModeRespawn() {
        console.log(`Classic Mode: Respawning player... Lives: ${this.classicLives}`);
        
        // Sync player lives with classic mode lives
        this.player.setLives(this.classicLives);
        
        // Show life lost notification
        if (this.uiManager) {
            this.uiManager.showNotification(`Life Lost! Lives Remaining: ${this.classicLives}`, 2000);
        }
        
        // Brief pause
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reset player position to spawn point
        if (this.player) {
            const spawnPoint = this.levelLoader.getSpawnPoint();
            this.player.setPosition(spawnPoint.x, spawnPoint.y, spawnPoint.z);
            this.player.health = this.player.maxHealth; // Reset health
        }
        
        // Reset ghosts to their starting positions (optional)
        if (this.gridManager && this.gridManager.ghosts) {
            this.gridManager.ghosts.forEach(ghost => {
                if (ghost.startPosition) {
                    ghost.position.x = ghost.startPosition.x;
                    ghost.position.z = ghost.startPosition.z;
                    ghost.mesh.position.set(
                        ghost.position.x * this.gridManager.tileSize,
                        ghost.mesh.position.y,
                        ghost.position.z * this.gridManager.tileSize
                    );
                }
            });
        }
        
        console.log('Classic Mode: Player respawned successfully');
    }
    
    // Handle level completion - advance to next level and reload
    async handleLevelCompletion() {
        console.log('Level completed! Advancing to next level...');
        
        // Handle classic mode completion differently
        if (this.isClassicMode) {
            console.log(`Classic Mode Wave ${this.classicWave} completed!`);
            
            // Increase wave counter
            this.classicWave++;
            
            // Increase speeds (max 20)
            if (this.classicPlayerSpeed < this.maxClassicSpeed) {
                this.classicPlayerSpeed = Math.min(this.classicPlayerSpeed + 1, this.maxClassicSpeed);
            }
            if (this.classicEnemySpeed < this.maxClassicSpeed) {
                this.classicEnemySpeed = Math.min(this.classicEnemySpeed + 1, this.maxClassicSpeed);
            }
            
            console.log(`Wave ${this.classicWave}: Player Speed: ${this.classicPlayerSpeed}, Enemy Speed: ${this.classicEnemySpeed}`);
            
            // Brief pause to show completion
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Restart the same level with new speeds and more fruit
            await this.restartClassicWave();
            return;
        }
        
        // Stop pacman timer and calculate time bonus
        let timeBonus = 0;
        if (this.gameMode === 'pacman') {
            timeBonus = this.calculateTimeBonus();
            this.stopPacmanTimer();
            
            // Add time bonus to score
            if (this.collisionSystem && timeBonus > 0) {
                this.collisionSystem.addScore(timeBonus);
                console.log(`Time bonus awarded: ${timeBonus} points!`);
            }
        }
        
        // Clear any active notifications
        if (this.uiManager) {
            this.uiManager.clearNotification();
        }
        
        // Save progress for the completed level (but not in pacman modes)
        if (!this.isClassicMode && this.gameMode !== 'pacman' && this.gameMode !== 'pacman_classic') {
            this.saveProgress(this.currentLevel);
        }
        
        // Clear per-level progress since level is completed (but not in pacman modes)
        if (!this.isClassicMode && this.gameMode !== 'pacman' && this.gameMode !== 'pacman_classic') {
            this.clearPerLevelProgress();
        }
        
        // Clear saved game state since level is completed (but not in pacman modes)
        if (!this.isClassicMode && this.gameMode !== 'pacman' && this.gameMode !== 'pacman_classic') {
            this.clearSavedGameState();
        }
        
        // Stop the game loop
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
        
        // Advance to next level
        const hasNextLevel = this.nextLevel();
        
        if (hasNextLevel) {
            try {
                // Brief pause to show completion
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Reload the game with the new level
                await this.restartCurrentLevel();
                
                console.log(`Started level ${this.currentLevel}`);
            } catch (error) {
                console.error('Error advancing to next level:', error);
                // Fall back to game over if level loading fails
                this.handleGameOver();
            }
        } else {
            // No more levels - show game completion or return to menu
            console.log('All levels completed!');
            this.clearSavedGameState(); // Clear save since game is completed
            this.handleGameOver(); // For now, treat as game over
        }
    }
    
    // Handle battle victory
    handleBattleVictory() {
        console.log('Battle victory!');
        if (this.battleSystem && this.battleUI) {
            const currentConfig = this.battleSystem.levelConfigs[this.battleSystem.currentLevel];
            const isLastLevel = this.battleSystem.currentLevel >= this.battleSystem.maxLevel;
            
            this.battleUI.showVictoryScreen(currentConfig, isLastLevel);
            
            if (!isLastLevel) {
                // Auto-advance to next level after victory screen
                setTimeout(() => {
                    this.battleSystem.startBattle(this.battleSystem.currentLevel + 1);
                }, 6000);
            }
        }
    }
    
    // Handle battle defeat
    handleBattleDefeat() {
        console.log('Battle defeat!');
        if (this.battleUI) {
            this.battleUI.showDefeatScreen();
        }
    }
    
    // Restart classic mode wave with increased speeds and more fruit
    async restartClassicWave() {
        console.log(`Starting Classic Mode Wave ${this.classicWave}...`);
        
        // Stop the game loop
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
        
        // Clear current systems
        this.cleanup();
        
        // Reinitialize systems with current level (always level 2 for classic)
        await this.setupSystems();
        
        // Add extra fruit for higher waves
        this.addExtraFruitForWave();
        
        // Start the game loop
        this.gameLoop.start();
        
        // Show wave information
        if (this.uiManager) {
            this.uiManager.showNotification(`Wave ${this.classicWave} - Speed: ${this.classicPlayerSpeed}`, 3000);
        }
    }
    
    // Add extra fruit based on current wave
    addExtraFruitForWave() {
        if (!this.isClassicMode || !this.gridManager) {
            return;
        }
        
        // Add 1-3 extra fruit per wave
        const extraFruitCount = Math.min(Math.floor(this.classicWave / 2) + 1, 3);
        console.log(`Adding ${extraFruitCount} extra fruit for wave ${this.classicWave}`);
        
        for (let i = 0; i < extraFruitCount; i++) {
            this.addRandomFruit();
        }
    }
    
    // Add a random fruit to an empty tile
    addRandomFruit() {
        if (!this.gridManager) return;
        
        const levelData = this.levelLoader.getCurrentLevel();
        if (!levelData) return;
        
        // Find empty ground tiles
        const emptyTiles = [];
        for (let x = 0; x < levelData.size.width; x++) {
            for (let z = 0; z < levelData.size.height; z++) {
                const tile = this.gridManager.getTile(x, z);
                if (tile && tile.type === 'ground' && !tile.occupied) {
                    emptyTiles.push({ x, z });
                }
            }
        }
        
        if (emptyTiles.length > 0) {
            const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            const fruitTypes = ['cherry', 'apple', 'banana', 'bonus'];
            const randomType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
            
            const fruit = {
                x: randomTile.x,
                z: randomTile.z,
                type: randomType,
                points: 500 + (this.classicWave * 100) // More points for higher waves
            };
            
            this.gridManager.generateFruitFromData([fruit]);
        }
    }
    
    // Save level completion progress
    saveProgress(levelId) {
        // Don't save progress in pacman modes
        if (this.isClassicMode || this.gameMode === 'pacman' || this.gameMode === 'pacman_classic') {
            console.log('Pacman mode: Progress saving disabled to maintain arcade experience');
            return;
        }
        
        try {
            const saved = localStorage.getItem('gameProgress');
            let progress = saved ? JSON.parse(saved) : {
                completedLevels: [],
                pacmanLevelsUnlocked: false,
                completedPacmanLevels: []
            };
            
            if (this.gameMode === 'pacman') {
                // Save pacman level completion
                if (!progress.completedPacmanLevels.includes(levelId)) {
                    progress.completedPacmanLevels.push(levelId);
                    console.log(`Pacman level ${levelId} completed and saved!`);
                }
            } else {
                // Save regular level completion
                if (!progress.completedLevels.includes(levelId)) {
                    progress.completedLevels.push(levelId);
                    console.log(`Level ${levelId} completed and saved!`);
                    
                    // Check if all regular levels are completed
                    const requiredLevels = [1, 2, 3, 4, 5, 6];
                    if (requiredLevels.every(level => progress.completedLevels.includes(level))) {
                        progress.pacmanLevelsUnlocked = true;
                        console.log('All regular levels completed! Pacman mode unlocked!');
                    }
                }
            }
            
            localStorage.setItem('gameProgress', JSON.stringify(progress));
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }
    
    // Enhanced save system that tracks collected items per level
    saveCurrentGameState() {
        // Don't save game state in pacman modes
        if (this.isClassicMode || this.gameMode === 'pacman' || this.gameMode === 'pacman_classic') {
            console.log('Pacman mode: Game state saving disabled to maintain arcade experience');
            return false;
        }
        
        try {
            if (!this.isGameInitialized || !this.player || !this.collisionSystem || !this.uiManager || !this.gridManager) {
                console.log('Game not fully initialized, cannot save state');
                return false;
            }

            // Get collected items data
            const collectedItems = this.getCollectedItemsData();

            const gameState = {
                currentLevel: this.currentLevel,
                gameMode: this.gameMode,
                playerPosition: {
                    x: this.player.position.x,
                    y: this.player.position.y,
                    z: this.player.position.z
                },
                playerHealth: this.player.health,
                playerLives: this.player.lives,
                score: this.collisionSystem.getScore(),
                collectiblesCollected: this.collisionSystem.collectiblesCollected,
                gameTime: this.uiManager.gameState.gameTime,
                collectedItems: collectedItems,
                timestamp: Date.now()
            };

            // Save the current game state
            localStorage.setItem('gameState', JSON.stringify(gameState));
            
            // Also save per-level progress for persistence across game sessions
            this.savePerLevelProgress(collectedItems);

            console.log('Game state saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving game state:', error);
            return false;
        }
    }

    // Get data about which specific items have been collected
    getCollectedItemsData() {
        const collectedItems = {
            collectibles: [],
            key: null
        };

        // Get collected collectibles with their grid positions
        if (this.gridManager && this.gridManager.collectibles) {
            this.gridManager.collectibles.forEach((collectible, index) => {
                if (collectible.collected) {
                    collectedItems.collectibles.push({
                        index: index,
                        gridX: collectible.gridX,
                        gridZ: collectible.gridZ,
                        position: {
                            x: collectible.position.x,
                            y: collectible.position.y,
                            z: collectible.position.z
                        }
                    });
                }
            });
        }

        // Check if key is collected
        if (this.gridManager && this.gridManager.keyObject && this.gridManager.keyObject.collected) {
            collectedItems.key = {
                gridX: this.gridManager.keyObject.gridX,
                gridZ: this.gridManager.keyObject.gridZ,
                position: {
                    x: this.gridManager.keyObject.position.x,
                    y: this.gridManager.keyObject.position.y,
                    z: this.gridManager.keyObject.position.z
                }
            };
        }

        return collectedItems;
    }

    // Save per-level progress for persistence
    savePerLevelProgress(collectedItems) {
        // Don't save per-level progress in pacman modes
        if (this.isClassicMode || this.gameMode === 'pacman' || this.gameMode === 'pacman_classic') {
            console.log('Pacman mode: Per-level progress saving disabled to maintain arcade experience');
            return;
        }
        
        try {
            const progressKey = `levelProgress_${this.gameMode}_${this.currentLevel}`;
            const levelProgress = {
                level: this.currentLevel,
                gameMode: this.gameMode,
                collectedItems: collectedItems,
                timestamp: Date.now()
            };

            localStorage.setItem(progressKey, JSON.stringify(levelProgress));
            console.log(`Level progress saved for ${this.gameMode} level ${this.currentLevel}`);
        } catch (error) {
            console.error('Error saving level progress:', error);
        }
    }

    // Load per-level progress
    loadPerLevelProgress() {
        try {
            const progressKey = `levelProgress_${this.gameMode}_${this.currentLevel}`;
            const savedProgress = localStorage.getItem(progressKey);
            
            if (!savedProgress) {
                return null;
            }

            return JSON.parse(savedProgress);
        } catch (error) {
            console.error('Error loading level progress:', error);
            return null;
        }
    }

    // Clear per-level progress for current level
    clearPerLevelProgress() {
        // Don't clear per-level progress in classic mode (there shouldn't be any)
        if (this.isClassicMode) {
            console.log('Classic mode: No per-level progress to clear');
            return;
        }
        
        try {
            const progressKey = `levelProgress_${this.gameMode}_${this.currentLevel}`;
            localStorage.removeItem(progressKey);
            console.log(`Cleared level progress for ${this.gameMode} level ${this.currentLevel}`);
        } catch (error) {
            console.error('Error clearing level progress:', error);
        }
    }

    // Clear all level progress (useful for debugging or reset)
    clearAllLevelProgress() {
        try {
            const keys = Object.keys(localStorage);
            const progressKeys = keys.filter(key => key.startsWith('levelProgress_'));
            
            progressKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log(`Cleared ${progressKeys.length} level progress entries`);
        } catch (error) {
            console.error('Error clearing all level progress:', error);
        }
    }

    // Load saved game state for continue feature
    loadSavedGameState() {
        try {
            const savedState = localStorage.getItem('gameState');
            if (!savedState) {
                console.log('No saved game state found');
                return null;
            }

            const gameState = JSON.parse(savedState);
            
            // Validate saved state
            if (!gameState.currentLevel || !gameState.gameMode || !gameState.playerPosition) {
                console.log('Invalid saved game state');
                return null;
            }

            return gameState;
        } catch (error) {
            console.error('Error loading game state:', error);
            return null;
        }
    }

    // Check if a saved game state exists
    hasSavedGameState() {
        try {
            const savedState = localStorage.getItem('gameState');
            return savedState !== null;
        } catch (error) {
            console.error('Error checking saved game state:', error);
            return false;
        }
    }

    // Continue from saved game state with proper item restoration
    async continueFromSavedState() {
        const savedState = this.loadSavedGameState();
        if (!savedState) {
            console.log('No saved state to continue from');
            return false;
        }

        try {
            // Set game mode and level
            this.gameMode = savedState.gameMode;
            this.currentLevel = savedState.currentLevel;

            // Clean up any existing UI elements to prevent duplication
            this.cleanupUIElements();

            // Initialize the game with the saved state
            await this.startGame(this.gameMode, this.currentLevel);

            // Wait for systems to be ready
            await new Promise(resolve => setTimeout(resolve, 100));

            // Restore player state
            if (this.player) {
                this.player.setPosition(
                    savedState.playerPosition.x,
                    savedState.playerPosition.y,
                    savedState.playerPosition.z
                );
                this.player.health = savedState.playerHealth || 100;
                this.player.lives = savedState.playerLives || 3;
            }

            // Restore collision system state
            if (this.collisionSystem) {
                this.collisionSystem.score = savedState.score || 0;
                this.collisionSystem.collectiblesCollected = savedState.collectiblesCollected || 0;
            }

            // Restore UI state
            if (this.uiManager) {
                this.uiManager.gameState.gameTime = savedState.gameTime || 0;
                this.uiManager.gameState.gameStartTime = performance.now() - (savedState.gameTime * 1000);
            }

            // Note: Collected items state is already restored by loadAndApplyLevelProgress() 
            // in setupSystems(), so we don't need to restore it again here.
            // The continue functionality now leverages the per-level progress system.

            console.log('Game continued from saved state successfully');
            return true;
        } catch (error) {
            console.error('Error continuing from saved state:', error);
            return false;
        }
    }

    // Clean up UI elements to prevent duplication
    cleanupUIElements() {
        // Remove any existing minimap to prevent duplication
        const existingMinimap = document.getElementById('minimap');
        if (existingMinimap) {
            existingMinimap.remove();
        }

        // Clean up any other UI elements that might duplicate
        const existingFPSDisplay = document.getElementById('fps-counter');
        if (existingFPSDisplay) {
            existingFPSDisplay.remove();
        }

        const existingPositionDisplay = document.getElementById('position-display');
        if (existingPositionDisplay) {
            existingPositionDisplay.remove();
        }

        const existingCollectiblesDisplay = document.getElementById('collectibles-counter');
        if (existingCollectiblesDisplay) {
            existingCollectiblesDisplay.remove();
        }

        const existingKeysDisplay = document.getElementById('keys-counter');
        if (existingKeysDisplay) {
            existingKeysDisplay.remove();
        }

        const existingLivesDisplay = document.getElementById('lives-counter');
        if (existingLivesDisplay) {
            existingLivesDisplay.remove();
        }

        const existingGameTimer = document.getElementById('game-timer');
        if (existingGameTimer) {
            existingGameTimer.remove();
        }

        const existingCameraModeDisplay = document.getElementById('camera-mode');
        if (existingCameraModeDisplay) {
            existingCameraModeDisplay.remove();
        }
    }

    // Restore the state of collected items
    restoreCollectedItemsState(collectedItems) {
        if (!this.gridManager) {
            console.log('GridManager not available, cannot restore collected items');
            return;
        }

        // Restore collected collectibles
        if (collectedItems.collectibles && collectedItems.collectibles.length > 0) {
            collectedItems.collectibles.forEach(collectedItem => {
                const collectible = this.gridManager.collectibles[collectedItem.index];
                if (collectible) {
                    collectible.collected = true;
                    collectible.mesh.visible = false;
                    
                    // Update tile occupation status if it exists
                    if (collectible.tile) {
                        collectible.tile.occupied = false;
                        collectible.tile.type = 'ground';
                    }
                }
            });
        }

        // Restore collected key
        if (collectedItems.key && this.gridManager.keyObject) {
            this.gridManager.keyObject.collected = true;
            this.gridManager.keyObject.mesh.visible = false;
        }

        console.log(`Restored ${collectedItems.collectibles.length} collected items and ${collectedItems.key ? 1 : 0} keys`);
    }

    // Clear saved game state
    clearSavedGameState() {
        // Don't clear saved game state in pacman modes (there shouldn't be any)
        if (this.isClassicMode || this.gameMode === 'pacman' || this.gameMode === 'pacman_classic') {
            console.log('Pacman mode: No saved game state to clear');
            return;
        }
        
        try {
            localStorage.removeItem('gameState');
            console.log('Saved game state cleared');
        } catch (error) {
            console.error('Error clearing saved game state:', error);
        }
    }

    // Auto-save game state periodically
    startAutoSave() {
        // Save every 10 seconds during gameplay
        this.autoSaveInterval = setInterval(() => {
            if (this.isGameInitialized && !this.isPaused) {
                this.saveCurrentGameState();
            }
        }, 10000);
    }

    // Stop auto-save
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // Level progression methods for pacman mode
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    nextLevel() {
        if (this.gameMode === 'pacman') {
            // Pacman mode: advance through levels 1-10
            if (this.currentLevel < this.maxLevel) {
                this.currentLevel++;
                console.log(`Advanced to pacman level ${this.currentLevel}`);
                return true;
            }
        } else {
            // Normal mode: advance through available level files (level1.json to level6.json)
            const maxNormalLevel = 6;
            if (this.currentLevel < maxNormalLevel) {
                this.currentLevel++;
                console.log(`Advanced to level ${this.currentLevel}`);
                return true;
            }
        }
        return false;
    }
    
    // Calculate ghost speed based on current level
    getGhostSpeed() {
        if (this.isClassicMode || this.gameMode === 'pacman_classic') {
            // Use the classic mode enemy speed system
            return this.getEnemySpeed();
        } else if (this.gameMode === 'pacman') {
            // Ghost speeds adjusted to match faster player speeds but still catchable
            switch (this.currentLevel) {
                case 1: return 14;   // Slightly slower than player (18) for training
                case 2: return 16;   // Slightly slower than player (20)
                case 3: return 18;   // Slightly slower than player (22)
                case 4: return 20;   // Slightly slower than player (24)
                case 5: return 22;   // Slightly slower than player (26)
                default: return 14 + (this.currentLevel - 1) * 2; // Continue progression
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
    
    // Calculate player speed based on current level for pacman mode
    getPlayerSpeed() {
        if (this.isClassicMode) {
            // Classic mode: progressive speed increases per wave, max 20
            return Math.min(this.classicPlayerSpeed, this.maxClassicSpeed);
        } else if (this.gameMode === 'pacman' || this.gameMode === 'pacman_classic') {
            // All levels use fast base speed (18) with slight increases for larger levels
            switch (this.currentLevel) {
                case 1: return 18;  // Fast base speed for training level
                case 2: return 20;  // Slightly faster for bigger level
                case 3: return 22;  // Faster for even bigger level
                case 4: return 24;  // Much faster for large level
                case 5: return 26;  // Fastest for biggest level
                default: return 18 + (this.currentLevel - 1) * 2; // Continue progression
            }
        } else {
            return 10; // Default speed for non-pacman modes
        }
    }
    
    // Calculate enemy speed for classic mode
    getEnemySpeed() {
        if (this.isClassicMode) {
            // Classic mode: progressive speed increases per wave, max 20
            return Math.min(this.classicEnemySpeed, this.maxClassicSpeed);
        } else {
            // Default enemy speeds for normal pacman mode
            switch (this.currentLevel) {
                case 1: return 14;
                case 2: return 16;
                case 3: return 18;
                case 4: return 20;
                case 5: return 22;
                default: return 14 + (this.currentLevel - 1) * 2;
            }
        }
    }
    
    // Get time limit for pacman level based on level number
    getPacmanTimeLimit() {
        if (this.gameMode === 'pacman') {
            switch (this.currentLevel) {
                case 1: return 300;  // 5 minutes (300 seconds)
                case 2: return 270;  // 4.5 minutes (270 seconds)
                case 3: return 240;  // 4 minutes (240 seconds)
                case 4: return 210;  // 3.5 minutes (210 seconds)
                case 5: return 180;  // 3 minutes (180 seconds)
                default: return Math.max(180 - (this.currentLevel - 5) * 30, 120); // Continue decreasing, min 2 minutes
            }
        }
        return 0;
    }
    
    // Start pacman timer for current level
    startPacmanTimer() {
        if (this.gameMode !== 'pacman') return;
        
        this.pacmanLevelTimeLimit = this.getPacmanTimeLimit();
        this.pacmanTimeRemaining = this.pacmanLevelTimeLimit;
        this.pacmanTimerStarted = true;
        
        console.log(`Starting pacman timer for level ${this.currentLevel}: ${this.pacmanLevelTimeLimit} seconds`);
    }
    
    // Update pacman timer (called from game loop)
    updatePacmanTimer(deltaTime) {
        // Don't update timer if paused or not in pacman mode or timer not started
        if (!this.pacmanTimerStarted || (this.gameMode !== 'pacman' && this.gameMode !== 'pacman_classic') || this.isPaused) return;
        
        // Classic mode doesn't use timer
        if (this.isClassicMode) return;
        
        this.pacmanTimeRemaining -= deltaTime;
        
        // Check if time ran out
        if (this.pacmanTimeRemaining <= 0) {
            this.pacmanTimeRemaining = 0;
            this.pacmanTimerStarted = false;
            console.log('Time is up! Game over.');
            this.handleGameOver();
        }
    }
    
    // Stop pacman timer
    stopPacmanTimer() {
        this.pacmanTimerStarted = false;
    }
    
    // Get time remaining as formatted string (MM:SS)
    getFormattedTimeRemaining() {
        const minutes = Math.floor(this.pacmanTimeRemaining / 60);
        const seconds = Math.floor(this.pacmanTimeRemaining % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Calculate time bonus points based on remaining time
    calculateTimeBonus() {
        if (this.gameMode !== 'pacman' || !this.pacmanTimerStarted) return 0;
        
        // Base bonus calculation: more remaining time = more points
        // Max bonus is 1000 points for completing quickly
        const timeUsed = this.pacmanLevelTimeLimit - this.pacmanTimeRemaining;
        const efficiency = Math.max(0, (this.pacmanLevelTimeLimit - timeUsed) / this.pacmanLevelTimeLimit);
        
        return Math.floor(efficiency * 1000);
    }
    
    // Pause screen handler for returning to main menu
    pauseToMainMenu() {
        console.log('Returning to main menu from pause');
        
        // Clear any active notifications
        if (this.uiManager) {
            this.uiManager.clearNotification();
        }
        
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
        
        // Clear any active notifications
        if (this.uiManager) {
            this.uiManager.clearNotification();
        }
        
        // Stop auto-save system (if it was running)
        this.stopAutoSave();
        
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
        
        // Clear any active notifications
        if (this.uiManager) {
            this.uiManager.clearNotification();
        }
        
        // Stop and reset pacman timer if in pacman mode
        if (this.gameMode === 'pacman') {
            this.stopPacmanTimer();
        }
        
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
            // Clear any active notifications
            if (this.uiManager) {
                this.uiManager.clearNotification();
            }
            
            // Stop and reset pacman timer if in pacman mode
            if (this.gameMode === 'pacman') {
                this.stopPacmanTimer();
            }
            
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
            
            // Clean up existing game objects before restarting
            if (this.gridManager) {
                this.gridManager.cleanupLevel();
            }
            
            // Clean up UI elements to prevent duplication
            this.cleanupUIElements();
            
            // Clean up existing player objects
            if (this.player) {
                if (this.player.mesh) {
                    this.scene.remove(this.player.mesh);
                }
                if (this.player.rotationHelper) {
                    this.scene.remove(this.player.rotationHelper);
                }
            }
            
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