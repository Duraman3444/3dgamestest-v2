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

import { LocalMultiplayerBattle } from './localMultiplayerBattle.js';
import { SkyboxManager } from './skyboxManager.js';
import { GraphicsEnhancer } from './graphicsEnhancer.js';
import { AudioManager } from './audioManager.js';
import { LeaderboardManager } from './leaderboardManager.js';
import { LeaderboardUI } from './leaderboardUI.js';
import { ScoreEntry } from './scoreEntry.js';

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
        this.localMultiplayerBattle = null;
        this.skyboxManager = null;
        this.graphicsEnhancer = null;
        this.audioManager = null;
        this.leaderboardManager = null;
        this.leaderboardUI = null;
        this.scoreEntry = null;
        this.isGameInitialized = false;
        this.areSystemsInitialized = false;
        this.isPaused = false;
        this.pauseOverlay = null;
        
        // Level progression system for pacman mode
        this.currentLevel = 1;
        this.maxLevel = 10; // Maximum number of levels
        this.gameMode = 'normal'; // 'normal', 'pacman', 'battle', or 'multiplayer'
        
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
    
    handleMainMenuSelection(mode, level, difficulty) {
        if (mode === 'normal') {
            // Show single player options menu
            this.showSinglePlayerMenu();
        } else if (mode === 'pacman') {
            // Show pacman mode menu
            this.showPacmanMenu();
        } else if (mode === 'battle') {
            // Show battle mode menu (now for bot battles)
            this.showBattleMenu();
        } else {
            // For other modes, start directly with proper parameters
            this.startGame(mode, level, difficulty);
        }
    }
    
    showMainMenu() {
        // Clear any active notifications
        if (this.uiManager) {
            this.uiManager.clearNotification();
        }
        
        // Reset systems so they can be re-initialized when starting a new game
        this.resetSystems();
        
        // Clean up ALL game mode UI elements
        this.cleanupAllGameModeUI();
        
        // Hide game elements
        this.canvas.style.display = 'none';
        const gameUI = document.getElementById('ui');
        const crosshair = document.getElementById('crosshair');
        const instructions = document.getElementById('instructions');
        
        if (gameUI) gameUI.style.display = 'none';
        if (crosshair) crosshair.style.display = 'none';
        if (instructions) instructions.style.display = 'none';
        
        // Hide all other menus
        if (this.singlePlayerMenu) this.singlePlayerMenu.hide();
        if (this.pacmanMenu) this.pacmanMenu.hide();
        if (this.battleMenu) this.battleMenu.hide();
        if (this.gameOverScreen) this.gameOverScreen.hide();
        
        // Show main menu
        this.mainMenu.show();
    }
    
    showErrorAndReturnToMenu(errorMessage) {
        console.error(errorMessage);
        
        // Hide game elements
        this.canvas.style.display = 'none';
        const gameUI = document.getElementById('ui');
        const crosshair = document.getElementById('crosshair');
        const instructions = document.getElementById('instructions');
        
        if (gameUI) gameUI.style.display = 'none';
        if (crosshair) crosshair.style.display = 'none';
        if (instructions) instructions.style.display = 'none';
        
        // Show error message overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;
        
        errorOverlay.innerHTML = `
            <div style="background: #1a1a1a; padding: 30px; border-radius: 10px; text-align: center; color: #ff6b6b;">
                <h2 style="margin: 0 0 20px 0;">Game Initialization Error</h2>
                <p style="margin: 0 0 20px 0;">${errorMessage}</p>
                <button onclick="this.parentElement.parentElement.remove(); window.game.showMainMenu();" 
                        style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    Return to Main Menu
                </button>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
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
        this.mainMenu = new MainMenu((mode, level, difficulty) => this.handleMainMenuSelection(mode, level, difficulty));
        
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
        
        // Set global game reference for settings
        window.game = this;
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
        
        // Try to initialize audio immediately if possible
        setTimeout(() => {
            if (this.audioManager && !this.audioManager.isInitialized) {
                this.audioManager.manualInitialize();
            }
        }, 1000);
        
        console.log('🎵 AudioManager initialized');
        
        // Initialize leaderboard system
        this.leaderboardManager = new LeaderboardManager();
        this.leaderboardUI = new LeaderboardUI(this.leaderboardManager);
        this.scoreEntry = new ScoreEntry(this.leaderboardManager);
        
        console.log('🏆 Leaderboard system initialized');
    }
    
    // Show score entry screen for level completion
    async showScoreEntryForCompletion(showLeaderboardAfter = false) {
        if (!this.leaderboardManager || !this.scoreEntry || !this.collisionSystem) {
            return;
        }
        
        const currentScore = this.collisionSystem.getScore();
        let completionTime = 0;
        
        // Calculate completion time based on game mode
        if (this.gameMode === 'pacman' && this.pacmanTimerStarted) {
            // For pacman mode, use remaining time (better score = more time left)
            completionTime = this.pacmanTimeRemaining || 0;
        } else {
            // For other modes, use elapsed time
            const gameStartTime = this.uiManager ? this.uiManager.gameState.gameStartTime : Date.now();
            completionTime = (Date.now() - gameStartTime) / 1000; // Convert to seconds
        }
        
        let category = null;
        let scoreData = {
            score: currentScore,
            completionTime: completionTime,
            level: this.currentLevel,
            gameMode: this.gameMode,
            timestamp: Date.now()
        };
        
        // Determine score category based on game mode and completion status
        if (this.isClassicMode) {
            category = 'classicMode';
            scoreData.wave = this.classicWave;
        } else if (this.gameMode === 'normal') {
            // Check if this is a full run completion (level 6 is the last level)
            if (this.currentLevel === 6) {
                category = 'fullRun';
                scoreData.levelsCompleted = 6;
            } else {
                category = 'individualLevel';
                scoreData.level = this.currentLevel;
            }
        } else if (this.gameMode === 'pacman') {
            category = 'individualLevel';
            scoreData.level = this.currentLevel;
            scoreData.gameMode = 'pacman';
        }
        
        // Always show score entry screen for level completion
        if (category) {
            console.log(`🏆 Level completed! Category: ${category}, Score: ${currentScore}`);
            
            // Show score entry screen
            await this.showScoreEntryScreen(scoreData, category);
            
            // Optionally show leaderboard with next level options
            if (showLeaderboardAfter && this.leaderboardUI) {
                await this.showLeaderboardWithActions(category);
            }
        }
    }
    
    // Show leaderboard with action buttons after level completion
    async showLeaderboardWithActions(category) {
        return new Promise((resolve) => {
            this.leaderboardUI.show(category, {
                onClose: () => {
                    resolve();
                },
                onStartNextLevel: () => {
                    this.leaderboardUI.hide();
                    resolve('nextLevel');
                },
                onRestartLevel: () => {
                    this.leaderboardUI.hide();
                    resolve('restart');
                },
                onReturnToMenu: () => {
                    this.leaderboardUI.hide();
                    resolve('menu');
                }
            });
        });
    }
    
    // Check for high score and show entry screen if qualified (legacy function - kept for battle mode)
    async checkForHighScore() {
        if (!this.leaderboardManager || !this.scoreEntry || !this.collisionSystem) {
            return;
        }
        
        const currentScore = this.collisionSystem.getScore();
        const gameStartTime = this.uiManager ? this.uiManager.gameState.gameStartTime : Date.now();
        const completionTime = (Date.now() - gameStartTime) / 1000; // Convert to seconds
        
        let category = null;
        let scoreData = {
            score: currentScore,
            completionTime: completionTime,
            level: this.currentLevel,
            gameMode: this.gameMode,
            timestamp: Date.now()
        };
        
        // Determine score category based on game mode and completion status
        if (this.isClassicMode) {
            category = 'classicMode';
            scoreData.wave = this.classicWave;
        } else if (this.gameMode === 'normal') {
            // Check if this is a full run completion (level 6 is the last level)
            if (this.currentLevel === 6) {
                category = 'fullRun';
                scoreData.levelsCompleted = 6;
            } else {
                category = 'individualLevel';
                scoreData.level = this.currentLevel;
            }
        } else if (this.gameMode === 'pacman') {
            category = 'individualLevel';
            scoreData.level = this.currentLevel;
            scoreData.gameMode = 'pacman';
        }
        
        // Check if score qualifies for leaderboard
        if (category && this.leaderboardManager.qualifiesForLeaderboard(category, currentScore, scoreData.level, completionTime)) {
            console.log(`🏆 High score detected! Category: ${category}, Score: ${currentScore}`);
            
            // Show score entry screen
            await this.showScoreEntryScreen(scoreData, category);
        }
    }
    
    // Show score entry screen and handle completion
    async showScoreEntryScreen(scoreData, category) {
        return new Promise((resolve) => {
            // Hide game UI temporarily
            this.canvas.style.display = 'none';
            const gameUI = document.getElementById('ui');
            if (gameUI) gameUI.style.display = 'none';
            
            // Show score entry screen
            this.scoreEntry.show(scoreData, category, 
                (finalScoreData, isNewRecord, rank) => {
                    console.log(`🏆 Score submitted: ${finalScoreData.initials} - Rank: ${rank}`);
                    
                    // Show brief success message
                    if (isNewRecord) {
                        console.log('🎉 NEW RECORD!');
                    }
                    
                    // Restore game UI
                    this.canvas.style.display = 'block';
                    if (gameUI) gameUI.style.display = 'block';
                    
                    resolve();
                }, 
                () => {
                    // Score entry cancelled
                    console.log('Score entry cancelled');
                    
                    // Restore game UI
                    this.canvas.style.display = 'block';
                    if (gameUI) gameUI.style.display = 'block';
                    
                    resolve();
                }
            );
        });
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
        
        // Audio enable button (only show if audio is not initialized)
        let audioEnableButton = null;
        if (this.audioManager && !this.audioManager.isInitialized && this.audioManager.waitingForUserInteraction) {
            audioEnableButton = document.createElement('button');
            audioEnableButton.textContent = '🎵 ENABLE AUDIO';
            audioEnableButton.style.cssText = `
                background: linear-gradient(135deg, #1a3300 0%, #336600 100%);
                border: 2px solid #00ff88;
                color: #00ff88;
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
                animation: audioButtonPulse 2s infinite;
            `;
            
            // Add pulsing animation for audio button
            const audioButtonStyle = document.createElement('style');
            audioButtonStyle.textContent = `
                @keyframes audioButtonPulse {
                    0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.5); }
                    50% { box-shadow: 0 0 15px rgba(0, 255, 136, 0.8); }
                }
            `;
            document.head.appendChild(audioButtonStyle);
        }
        
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
        if (audioEnableButton) {
            addHoverEffect(audioEnableButton, '#00ff88');
        }
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
        
        if (audioEnableButton) {
            audioEnableButton.addEventListener('click', async () => {
                audioEnableButton.disabled = true;
                audioEnableButton.textContent = '🎵 ENABLING...';
                audioEnableButton.style.background = 'linear-gradient(135deg, #666666 0%, #999999 100%)';
                
                try {
                    const success = await this.audioManager.manualInitialize();
                    if (success) {
                        // Remove the audio button after successful initialization
                        audioEnableButton.style.display = 'none';
                        console.log('🎵 Audio successfully enabled from pause menu');
                    }
                } catch (error) {
                    console.error('Failed to enable audio from pause menu:', error);
                    audioEnableButton.textContent = '🎵 ENABLE AUDIO';
                    audioEnableButton.disabled = false;
                    audioEnableButton.style.background = 'linear-gradient(135deg, #1a3300 0%, #336600 100%)';
                }
            });
        }
        
        quitButton.addEventListener('click', () => {
            this.quitGame();
        });
        
        // Add elements to containers
        buttonsContainer.appendChild(resumeButton);
        buttonsContainer.appendChild(restartLevelButton);
        buttonsContainer.appendChild(mainMenuButton);
        buttonsContainer.appendChild(settingsButton);
        if (audioEnableButton) {
            buttonsContainer.appendChild(audioEnableButton);
        }
        buttonsContainer.appendChild(quitButton);
        
        pauseOverlay.appendChild(pauseTitle);
        pauseOverlay.appendChild(pauseInstructions);
        pauseOverlay.appendChild(buttonsContainer);
        
        return pauseOverlay;
    }
    
    togglePause() {
        console.log('🎮 togglePause() called');
        
        // Prevent pausing during certain states
        if (this.gameOverScreen && this.gameOverScreen.isVisible) {
            console.log('Cannot pause during game over screen');
            return;
        }
        
        console.log(`🎮 Current isPaused state: ${this.isPaused}`);
        
        if (this.isPaused) {
            console.log('🎮 Resuming game...');
            // Resume game
            this.isPaused = false;
            if (this.pauseOverlay) {
                console.log('🎮 Removing pause overlay...');
                document.body.removeChild(this.pauseOverlay);
                this.pauseOverlay = null;
            }
            
            // Play resume sound
            if (this.audioManager) {
                this.audioManager.playResumeSound();
            }
            
            // Enable player controls
            if (this.player) {
                this.player.enableControls();
            }
            
            // Resume game loop
            if (this.gameLoop) {
                console.log('🎮 Starting game loop...');
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
            console.log('🎮 Pausing game...');
            // Pause game
            this.isPaused = true;
            
            // Play pause sound
            if (this.audioManager) {
                this.audioManager.playPauseSound();
            }
            
            // Disable player controls
            if (this.player) {
                this.player.disableControls();
            }
            
            // Pause game loop
            if (this.gameLoop) {
                console.log('🎮 Stopping game loop...');
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
            console.log('🎮 Creating pause overlay...');
            this.pauseOverlay = this.createPauseOverlay();
            document.body.appendChild(this.pauseOverlay);
            console.log('🎮 Pause overlay added to DOM');
            
            // Debug: Check overlay properties
            setTimeout(() => {
                if (this.pauseOverlay) {
                    const computed = window.getComputedStyle(this.pauseOverlay);
                    console.log('🎮 Pause overlay computed styles:');
                    console.log(`   Display: ${computed.display}`);
                    console.log(`   Visibility: ${computed.visibility}`);
                    console.log(`   Z-index: ${computed.zIndex}`);
                    console.log(`   Position: ${computed.position}`);
                    console.log(`   Top: ${computed.top}`);
                    console.log(`   Left: ${computed.left}`);
                    console.log(`   Width: ${computed.width}`);
                    console.log(`   Height: ${computed.height}`);
                }
            }, 100);
            
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
                // Apply master volume to audio manager
                if (this.audioManager) {
                    this.audioManager.setMasterVolume(value / 100);
                }
                console.log(`Master volume set to ${value}%`);
                break;
            case 'musicVolume':
                // Apply music volume to audio manager
                if (this.audioManager) {
                    this.audioManager.setMusicVolume(value / 100);
                }
                console.log(`Music volume set to ${value}%`);
                break;
            case 'sfxVolume':
                // Apply SFX volume to audio manager
                if (this.audioManager) {
                    this.audioManager.setSFXVolume(value / 100);
                }
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
                
            // SSR Settings
            case 'enableSSR':
                this.applySSRSetting(value);
                break;
            case 'ssrIntensity':
            case 'ssrMaxDistance':
            case 'ssrThickness':
                this.updateSSRSettings();
                break;
                
            // Bloom Settings
            case 'enableBloom':
                this.applyBloomSetting(value);
                break;
            case 'bloomIntensity':
            case 'bloomThreshold':
            case 'bloomRadius':
                this.updateBloomSettings();
                break;
                
            // SSAO Settings
            case 'enableSSAO':
                this.applySSAOSetting(value);
                break;
            case 'ssaoIntensity':
            case 'ssaoRadius':
                this.updateSSAOSettings();
                break;
                
            // God Rays Settings
            case 'enableGodRays':
                this.applyGodRaysSetting(value);
                break;
            case 'godRaysIntensity':
            case 'godRaysExposure':
                this.updateGodRaysSettings();
                break;
                
            // Motion Blur Settings
            case 'enableMotionBlur':
                this.applyMotionBlurSetting(value);
                break;
            case 'motionBlurStrength':
                this.updateMotionBlurSettings();
                break;
                
            // Depth of Field Settings
            case 'enableDOF':
                this.applyDOFSetting(value);
                break;
            case 'dofFocus':
            case 'dofBlur':
                this.updateDOFSettings();
                break;
                
            // Film Grain Settings
            case 'enableFilmGrain':
                this.applyFilmGrainSetting(value);
                break;
            case 'filmGrainIntensity':
                this.updateFilmGrainSettings();
                break;
                
            // Vignette Settings
            case 'enableVignette':
                this.applyVignetteSetting(value);
                break;
            case 'vignetteIntensity':
                this.updateVignetteSettings();
                break;
                
            // Chromatic Aberration Settings
            case 'enableChromaticAberration':
                this.applyChromaticSetting(value);
                break;
            case 'chromaticIntensity':
                this.updateChromaticSettings();
                break;
                
            // Color Grading Settings
            case 'enableColorGrading':
                this.applyColorGradingSetting(value);
                break;
            case 'colorGradingPreset':
                this.updateColorGradingSettings();
                break;
                
            // Particle Effects Settings
            case 'enableParticleEffects':
                this.applyParticleEffectsSetting(value);
                break;
            case 'particleQuality':
                this.updateParticleSettings();
                break;
                
            // Dynamic Lighting Settings
            case 'enableDynamicLighting':
                this.applyDynamicLightingSetting(value);
                break;
                
            // Volumetric Fog Settings
            case 'enableVolumetricFog':
                this.applyVolumetricFogSetting(value);
                break;
            case 'volumetricFogQuality':
            case 'volumetricFogDensity':
            case 'volumetricFogScattering':
                this.updateVolumetricFogSettings();
                break;
        }
    }
    
    applySSRSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableSSR) {
            this.graphicsEnhancer.enableSSR(enabled);
            console.log(`🌊 Screen Space Reflections ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
    
    updateSSRSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.updateSSRSettings && this.settingsManager) {
            const settings = this.settingsManager.getSettings();
            const ssrSettings = {
                intensity: settings.graphics.ssrIntensity / 100, // Convert 0-100 to 0-1
                maxDistance: settings.graphics.ssrMaxDistance,
                thickness: settings.graphics.ssrThickness,
                maxRoughness: 0.3 // Keep this constant for now
            };
            this.graphicsEnhancer.updateSSRSettings(ssrSettings);
        }
    }

    // Bloom effect methods
    applyBloomSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableBloom) {
            this.graphicsEnhancer.enableBloom(enabled);
            console.log(`🌸 Bloom Effect ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    updateBloomSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.updateBloomSettings && this.settingsManager) {
            const settings = this.settingsManager.getSettings();
            this.graphicsEnhancer.updateBloomSettings({
                intensity: settings.graphics.bloomIntensity,
                threshold: settings.graphics.bloomThreshold,
                radius: settings.graphics.bloomRadius
            });
        }
    }

    // SSAO methods
    applySSAOSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableSSAO) {
            this.graphicsEnhancer.enableSSAO(enabled);
            console.log(`🌫️ SSAO ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    updateSSAOSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.updateSSAOSettings && this.settingsManager) {
            const settings = this.settingsManager.getSettings();
            this.graphicsEnhancer.updateSSAOSettings({
                intensity: settings.graphics.ssaoIntensity,
                radius: settings.graphics.ssaoRadius
            });
        }
    }

    // God Rays methods
    applyGodRaysSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableGodRays) {
            this.graphicsEnhancer.enableGodRays(enabled);
            console.log(`☀️ God Rays ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    updateGodRaysSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.updateGodRaysSettings && this.settingsManager) {
            const settings = this.settingsManager.getSettings();
            this.graphicsEnhancer.updateGodRaysSettings({
                intensity: settings.graphics.godRaysIntensity,
                exposure: settings.graphics.godRaysExposure
            });
        }
    }

    // Test graphics settings - can be called from console
    testGraphicsSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.testAllGraphicsSettings) {
            return this.graphicsEnhancer.testAllGraphicsSettings();
        }
        return null;
    }

    // Test particle effects system
    testParticleEffects() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.testParticleEffects) {
            return this.graphicsEnhancer.testParticleEffects();
        }
        return null;
    }

    // Test SSR system
    testSSR() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.testSSR) {
            return this.graphicsEnhancer.testSSR();
        }
        return null;
    }

    // Cycle through graphics effects for testing
    startGraphicsTest() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.cycleEffectsTest) {
            this.graphicsTestInterval = this.graphicsEnhancer.cycleEffectsTest();
            return this.graphicsTestInterval;
        }
        return null;
    }

    stopGraphicsTest() {
        if (this.graphicsTestInterval) {
            clearInterval(this.graphicsTestInterval);
            this.graphicsTestInterval = null;
            console.log('🛑 Graphics test stopped');
        }
    }

    // Motion Blur methods
    applyMotionBlurSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableMotionBlur) {
            this.graphicsEnhancer.enableMotionBlur(enabled);
            console.log(`💨 Motion Blur ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    updateMotionBlurSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.updateMotionBlurSettings && this.settingsManager) {
            const settings = this.settingsManager.getSettings();
            this.graphicsEnhancer.updateMotionBlurSettings({
                strength: settings.graphics.motionBlurStrength
            });
        }
    }

    // Depth of Field methods
    applyDOFSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableDOF) {
            this.graphicsEnhancer.enableDOF(enabled);
            console.log(`🎯 Depth of Field ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    updateDOFSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.updateDOFSettings && this.settingsManager) {
            const settings = this.settingsManager.getSettings();
            this.graphicsEnhancer.updateDOFSettings({
                focus: settings.graphics.dofFocus,
                blur: settings.graphics.dofBlur
            });
        }
    }

    // Film Grain methods
    applyFilmGrainSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableFilmGrain) {
            this.graphicsEnhancer.enableFilmGrain(enabled);
            console.log(`📺 Film Grain ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    updateFilmGrainSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.updateFilmGrainSettings && this.settingsManager) {
            try {
                const settings = this.settingsManager.getSettings();
                this.graphicsEnhancer.updateFilmGrainSettings({
                    intensity: settings.graphics.filmGrainIntensity
                });
            } catch (error) {
                console.warn('Failed to update film grain settings:', error);
                // Disable film grain if it's causing issues
                if (this.settingsManager) {
                    this.settingsManager.setSetting('graphics', 'enableFilmGrain', false);
                }
            }
        }
    }

    // Vignette methods
    applyVignetteSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableVignette) {
            this.graphicsEnhancer.enableVignette(enabled);
            console.log(`⚫ Vignette ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    updateVignetteSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.updateVignetteSettings && this.settingsManager) {
            const settings = this.settingsManager.getSettings();
            this.graphicsEnhancer.updateVignetteSettings({
                intensity: settings.graphics.vignetteIntensity
            });
        }
    }

    // Chromatic Aberration methods
    applyChromaticSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableChromaticAberration) {
            this.graphicsEnhancer.enableChromaticAberration(enabled);
            console.log(`🌈 Chromatic Aberration ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    updateChromaticSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.updateChromaticSettings && this.settingsManager) {
            const settings = this.settingsManager.getSettings();
            this.graphicsEnhancer.updateChromaticSettings({
                intensity: settings.graphics.chromaticIntensity
            });
        }
    }

    // Color Grading methods
    applyColorGradingSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableColorGrading) {
            this.graphicsEnhancer.enableColorGrading(enabled);
            console.log(`🎨 Color Grading ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    updateColorGradingSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.updateColorGradingSettings && this.settingsManager) {
            const settings = this.settingsManager.getSettings();
            this.graphicsEnhancer.updateColorGradingSettings({
                preset: settings.graphics.colorGradingPreset
            });
        }
    }

    // Particle Effects methods
    applyParticleEffectsSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableParticleEffects) {
            this.graphicsEnhancer.enableParticleEffects(enabled);
            console.log(`✨ Particle Effects ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    updateParticleSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.updateParticleSettings && this.settingsManager) {
            const settings = this.settingsManager.getSettings();
            this.graphicsEnhancer.updateParticleSettings({
                quality: settings.graphics.particleQuality
            });
        }
    }

    // Dynamic Lighting methods
    applyDynamicLightingSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableDynamicLighting) {
            this.graphicsEnhancer.enableDynamicLighting(enabled);
            console.log(`💡 Dynamic Lighting ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    // Volumetric Fog methods
    applyVolumetricFogSetting(enabled) {
        if (this.graphicsEnhancer && this.graphicsEnhancer.enableVolumetricFog) {
            this.graphicsEnhancer.enableVolumetricFog(enabled);
            console.log(`🌫️ Volumetric Fog ${enabled ? 'enabled' : 'disabled'}`);
            
            // Apply initial theme if enabled
            if (enabled && this.gameMode) {
                this.updateVolumetricFogTheme();
            }
        }
    }

    updateVolumetricFogSettings() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.setVolumetricFogParameters) {
            const settings = this.settingsManager.settings.graphics;
            
            // Convert quality setting to numeric values
            const qualityMap = {
                'low': 0.5,
                'medium': 1.0,
                'high': 2.0
            };
            
            const params = {
                quality: qualityMap[settings.volumetricFogQuality] || 1.0,
                density: settings.volumetricFogDensity / 1000, // Convert to decimal
                scatteringStrength: settings.volumetricFogScattering / 500, // Convert to usable range
                raySteps: settings.volumetricFogQuality === 'high' ? 64 : 
                         settings.volumetricFogQuality === 'medium' ? 32 : 16
            };
            
            this.graphicsEnhancer.setVolumetricFogParameters(params);
            console.log(`🌫️ Updated volumetric fog settings:`, params);
        }
    }

    updateVolumetricFogTheme() {
        if (this.graphicsEnhancer && this.graphicsEnhancer.applyVolumetricFogTheme) {
            let theme = 'default';
            
            // Map game modes to volumetric fog themes
            switch (this.gameMode) {
                case 'pacman':
                    theme = 'pacman';
                    break;
                case 'battle':
                case 'local_multiplayer':
                    theme = 'battle';
                    break;
                default:
                    // Map levels to themes
                    if (this.currentLevel) {
                        const levelThemes = {
                            1: 'forest',
                            2: 'desert',
                            3: 'desert',
                            4: 'mystical',
                            5: 'volcanic',
                            6: 'space'
                        };
                        theme = levelThemes[this.currentLevel] || 'default';
                    }
                    break;
            }
            
            this.graphicsEnhancer.applyVolumetricFogTheme(theme);
            console.log(`🌫️ Applied volumetric fog theme: ${theme}`);
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
                    this.renderer.antialias = false;
                    this.renderer.toneMappingExposure = 1.0;
                    break;
                case 'medium':
                    this.renderer.setPixelRatio(1);
                    this.renderer.shadowMap.enabled = true;
                    this.renderer.shadowMap.type = THREE.PCFShadowMap;
                    this.renderer.antialias = true;
                    this.renderer.toneMappingExposure = 1.1;
                    break;
                case 'high':
                    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                    this.renderer.shadowMap.enabled = true;
                    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                    this.renderer.antialias = true;
                    this.renderer.toneMappingExposure = 1.2;
                    break;
                case 'ultra':
                    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                    this.renderer.shadowMap.enabled = true;
                    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                    this.renderer.antialias = true;
                    this.renderer.toneMappingExposure = 1.3;
                    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
                    break;
            }
            console.log(`🎨 Graphics quality set to: ${quality}`);
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
        console.log(`🎮 Starting game with mode: ${mode}, level: ${level}, difficulty: ${difficulty}`);
        
        // Force cleanup of existing systems to ensure clean level switching
        this.cleanupSystems();
        this.areSystemsInitialized = false;
        
        this.gameMode = mode; // Store game mode
        this.difficulty = difficulty; // Store difficulty
        
        // Set audio profile for the game mode
        if (this.audioManager) {
            this.audioManager.setGameMode(mode);
        }
        
        // Update graphics enhancement for new game mode
        if (this.graphicsEnhancer && this.scene) {
            setTimeout(() => {
                try {
                    this.graphicsEnhancer.enhanceSceneMaterials(mode);
                } catch (error) {
                    console.warn('Failed to enhance scene materials for mode change:', error);
                }
            }, 200);
        }
        
        // Reset pacman timer state
        this.stopPacmanTimer();
        
        // Handle multiplayer mode
        if (mode === 'local_multiplayer') {
            console.log('🥊 Local multiplayer mode detected, setting up battle arena...');
            this.isMultiplayerMode = false;
            this.multiplayerData = null;
            this.currentLevel = 1;
            
            // Show the game canvas
            this.canvas.style.display = 'block';
            
            // Hide UI elements that aren't needed for battle
            const gameUI = document.getElementById('ui');
            const crosshair = document.getElementById('crosshair');
            const instructions = document.getElementById('instructions');
            
            if (gameUI) gameUI.style.display = 'none';
            if (crosshair) crosshair.style.display = 'none';
            if (instructions) instructions.style.display = 'none';
            
            // Initialize 3D environment if not already done
            if (!this.isGameInitialized) {
                await this.init();
                this.isGameInitialized = true;
            }
            
            // Initialize basic systems needed for local multiplayer
            if (!this.cameraSystem) {
                // Create a proper player object with all required methods
                this.player = {
                    position: { x: 0, y: 0, z: 0 },
                    pitch: 0,
                    yaw: 0,
                    getPosition: () => ({ x: 0, y: 0, z: 0 }),
                    getRotation: () => ({ pitch: 0, yaw: 0 }),
                    enableControls: () => {},
                    disableControls: () => {}
                };
                this.cameraSystem = new CameraSystem(this.player);
            }
            
            // Start local multiplayer battle with player count
            const playerCount = level || 2; // level parameter contains player count
            this.startLocalMultiplayerBattle(playerCount);
            return; // Exit early since battle handles its own game loop
        } else if (mode === 'bot_battle') {
            console.log('🤖 Bot battle mode detected, setting up bot battle...');
            this.isMultiplayerMode = false;
            this.multiplayerData = null;
            this.currentLevel = 1;
            this.gameMode = 'battle'; // Set to battle mode for battle system initialization
            this.botCount = level || 3; // level parameter contains bot count
            
            // Show the game canvas
            this.canvas.style.display = 'block';
            
            // Show game UI elements for battle
            const gameUI = document.getElementById('ui');
            const crosshair = document.getElementById('crosshair');
            const instructions = document.getElementById('instructions');
            
            if (gameUI) gameUI.style.display = 'block';
            if (crosshair) crosshair.style.display = 'block';
            if (instructions) instructions.style.display = 'block';
            
            // Initialize 3D environment if not already done
            if (!this.isGameInitialized) {
                try {
                    await this.init();
                    this.isGameInitialized = true;
                } catch (error) {
                    console.error('Failed to initialize game for bot battle:', error);
                    // Show error message and return to main menu
                    this.showErrorAndReturnToMenu('Failed to initialize the battle system. Please try again or restart the game.');
                    return;
                }
            }
            
            // Continue with battle system initialization below
        } else {
            this.isMultiplayerMode = false;
            this.multiplayerData = null;
        }
        
        // Handle classic pacman mode
        if (mode === 'pacman_classic') {
            this.isClassicMode = true;
            this.currentLevel = 2; // Always use level 2 for classic mode
            try {
                this.setClassicLives(3); // Reset lives using safe method
            } catch (error) {
                console.warn('Failed to set classic lives, using default:', error);
                this.classicLives = 3; // Fallback assignment
            }
            this.classicWave = 1; // Reset wave counter
            this.classicPlayerSpeed = 12; // Reset speeds
            this.classicEnemySpeed = 8;
        } else {
            this.isClassicMode = false;
            // Set starting level (for single player mode and pacman mode with level selection)
            if ((mode === 'normal' || mode === 'pacman') && level && mode !== 'multiplayer') {
                this.currentLevel = level;
                console.log(`🎯 Level explicitly set to: ${level}`);
            } else if (mode !== 'multiplayer') {
                this.currentLevel = 1; // Default to level 1 for other modes
            }
        }
        
        // Clear any saved game state that might conflict with the new level selection
        if (this.currentLevel && this.currentLevel !== 1) {
            try {
                localStorage.removeItem('gameState');
                console.log('🗑️ Cleared saved game state to prevent level conflicts');
            } catch (error) {
                console.warn('Error clearing saved game state:', error);
            }
        }
        
        // Clear any active notifications
        if (this.uiManager) {
            this.uiManager.clearNotification();
        }
        
        // Clean up ALL UI elements before starting new game
        this.cleanupAllGameModeUI();
        
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
            try {
                await this.init();
                this.isGameInitialized = true;
            } catch (error) {
                console.error('Failed to initialize game:', error);
                this.showErrorAndReturnToMenu('Failed to initialize the game. Please try again.');
                return;
            }
        }
        
        // Setup all game systems
        try {
            await this.setupSystems();
        } catch (error) {
            console.error('Failed to setup game systems:', error);
            this.showErrorAndReturnToMenu('Failed to setup game systems. Please try again.');
            return;
        }
        
        // Start the game loop only if initialization was successful
        if (this.gameLoop) {
            this.gameLoop.start();
            
            // Play level start sound
            if (this.audioManager) {
                this.audioManager.playLevelStartSound();
            }
        } else {
            console.error('Game loop not initialized');
            this.showErrorAndReturnToMenu('Game loop failed to initialize. Please try again.');
            return;
        }
        
        // Start auto-save system (but not in pacman modes or multiplayer)
        if (!this.isClassicMode && this.gameMode !== 'pacman' && this.gameMode !== 'pacman_classic' && this.gameMode !== 'multiplayer') {
            this.startAutoSave();
        }
        
        // Apply initial settings
        if (this.settingsManager) {
            this.settingsManager.applySettings();
        }
    }
    

    
    startLocalMultiplayerBattle(playerCount = 2) {
        console.log(`🥊 Initializing ${playerCount}-Player Local Multiplayer Battle Arena...`);
        console.log(`🎯 Player count parameter received: ${playerCount}`);
        
        // Hide ALL menu elements
        if (this.mainMenu) {
            this.mainMenu.hide();
        }
        if (this.singlePlayerMenu) {
            this.singlePlayerMenu.hide();
        }
        if (this.pacmanMenu) {
            this.pacmanMenu.hide();
        }
        if (this.battleMenu) {
            this.battleMenu.hide();
        }
        
        // Hide any existing UI elements
        const gameUI = document.getElementById('ui');
        const crosshair = document.getElementById('crosshair');
        const instructions = document.getElementById('instructions');
        
        if (gameUI) gameUI.style.display = 'none';
        if (crosshair) crosshair.style.display = 'none';
        if (instructions) instructions.style.display = 'none';
        
        // Clear any existing game state
        this.clearGameState();
        
        // Create the local multiplayer battle system
        this.localMultiplayerBattle = new LocalMultiplayerBattle(this.scene, this.cameraSystem.camera, this.renderer);
        
        // Set the player count
        console.log(`🎯 Setting player count to: ${playerCount}`);
        this.localMultiplayerBattle.setPlayerCount(playerCount);
        
        // Set up callbacks
        this.localMultiplayerBattle.onBackToMenu = () => {
            console.log('🥊 Returning to main menu from local multiplayer battle');
            this.localMultiplayerBattle.cleanup();
            this.localMultiplayerBattle = null;
            this.showMainMenu();
        };
        
        // Set up cleanup callback for when battle ends
        this.localMultiplayerBattle.onMatchEnd = () => {
            console.log('🥊 Match ended, returning to main menu');
            this.localMultiplayerBattle.cleanup();
            this.localMultiplayerBattle = null;
            this.showMainMenu();
        };
        
        // Initialize and start the battle
        this.localMultiplayerBattle.initialize();
    }
    
    clearGameState() {
        // Clear any existing game objects from the scene
        if (this.scene) {
            const objectsToRemove = [];
            this.scene.traverse((child) => {
                if (child.isMesh && child.name !== 'background') {
                    objectsToRemove.push(child);
                }
            });
            objectsToRemove.forEach(obj => this.scene.remove(obj));
        }
        
        // Stop any existing game loop
        if (this.gameLoop) {
            this.gameLoop.stop();
            this.gameLoop = null;
        }
        
        // Clean up systems
        if (this.player) {
            // Remove player mesh from scene if it exists
            if (this.player.mesh) {
                this.scene.remove(this.player.mesh);
            }
            this.player = null;
        }
        
        if (this.gridManager) {
            this.gridManager.cleanupLevel();
            this.gridManager = null;
        }
        
        if (this.battleSystem) {
            this.battleSystem.cleanup();
            this.battleSystem = null;
        }
        
        if (this.battleUI) {
            this.battleUI.cleanup();
            this.battleUI = null;
        }
        
        // Reset systems initialization flag
        this.resetSystems();
        
        console.log('🧹 Game state cleared');
    }
    

    
    async init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLighting();
        this.setupEventListeners();
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
        
        // Enhanced visual settings
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Set background color based on game mode - enhanced with gradients
        if (this.gameMode === 'pacman') {
            this.renderer.setClearColor(0x0a0a1a); // Darker for better neon contrast
        } else {
            this.renderer.setClearColor(0x87CEEB); // Sky blue background for normal mode
        }
        
        // Enhanced shadow settings
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        
        // Enable additional rendering features
        this.renderer.useLegacyLights = false;
        
        console.log('🎨 Enhanced renderer initialized with high-quality settings');
    }

    
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Fog will be set by skybox manager
        // this.scene.fog = new THREE.Fog(0x87CEEB, 80, 300);
    }
    
    setupLighting() {
        // Enhanced ambient light with better color space
        const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
        this.scene.add(ambientLight);
        
        if (this.gameMode === 'pacman') {
            // Ultra-enhanced neon lighting for Pacman mode
            ambientLight.intensity = 0.8;
            ambientLight.color = new THREE.Color(0x223344);
            
            // High-quality neon directional lights
            const neonLight1 = new THREE.DirectionalLight(0x00FFFF, 1.5);
            neonLight1.position.set(10, 10, 10);
            neonLight1.castShadow = true;
            neonLight1.shadow.mapSize.width = 4096;
            neonLight1.shadow.mapSize.height = 4096;
            neonLight1.shadow.camera.near = 0.1;
            neonLight1.shadow.camera.far = 100;
            neonLight1.shadow.bias = -0.0001;
            neonLight1.shadow.normalBias = 0.02;
            this.scene.add(neonLight1);
            
            const neonLight2 = new THREE.DirectionalLight(0xFF00FF, 1.2);
            neonLight2.position.set(-10, 10, -10);
            neonLight2.castShadow = true;
            neonLight2.shadow.mapSize.width = 4096;
            neonLight2.shadow.mapSize.height = 4096;
            neonLight2.shadow.camera.near = 0.1;
            neonLight2.shadow.camera.far = 100;
            neonLight2.shadow.bias = -0.0001;
            neonLight2.shadow.normalBias = 0.02;
            this.scene.add(neonLight2);
            
            // Enhanced point lights with better falloff
            const pointLight1 = new THREE.PointLight(0xFFFF00, 3, 35, 2);
            pointLight1.position.set(0, 5, 0);
            pointLight1.castShadow = true;
            pointLight1.shadow.mapSize.width = 2048;
            pointLight1.shadow.mapSize.height = 2048;
            this.scene.add(pointLight1);
            
            const pointLight2 = new THREE.PointLight(0x00FF00, 2.5, 30, 2);
            pointLight2.position.set(0, 8, 0);
            pointLight2.castShadow = true;
            pointLight2.shadow.mapSize.width = 2048;
            pointLight2.shadow.mapSize.height = 2048;
            this.scene.add(pointLight2);
            
            // Add hemisphere light for better neon ambience
            const hemiLight = new THREE.HemisphereLight(0x00ffff, 0xff00ff, 0.3);
            this.scene.add(hemiLight);
            
        } else if (this.gameMode === 'normal') {
            // Ultra-enhanced PS2 lighting with improved shadows
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
            
            ambientLight.intensity = 0.9;
            ambientLight.color = new THREE.Color(0x444466);
            
            // Enhanced PS2 directional lights with better shadows
            const ps2Light1 = new THREE.DirectionalLight(lightTheme.primary, 1.3);
            ps2Light1.position.set(10, 10, 10);
            ps2Light1.castShadow = true;
            ps2Light1.shadow.mapSize.width = 4096;
            ps2Light1.shadow.mapSize.height = 4096;
            ps2Light1.shadow.camera.near = 0.1;
            ps2Light1.shadow.camera.far = 100;
            ps2Light1.shadow.bias = -0.0001;
            ps2Light1.shadow.normalBias = 0.02;
            this.scene.add(ps2Light1);
            
            const ps2Light2 = new THREE.DirectionalLight(lightTheme.secondary, 1.0);
            ps2Light2.position.set(-10, 10, -10);
            ps2Light2.castShadow = true;
            ps2Light2.shadow.mapSize.width = 4096;
            ps2Light2.shadow.mapSize.height = 4096;
            ps2Light2.shadow.camera.near = 0.1;
            ps2Light2.shadow.camera.far = 100;
            ps2Light2.shadow.bias = -0.0001;
            ps2Light2.shadow.normalBias = 0.02;
            this.scene.add(ps2Light2);
            
            // Enhanced PS2 point lights with improved falloff
            const ps2PointLight = new THREE.PointLight(lightTheme.primary, 2.5, 35, 2);
            ps2PointLight.position.set(0, 6, 0);
            ps2PointLight.castShadow = true;
            ps2PointLight.shadow.mapSize.width = 2048;
            ps2PointLight.shadow.mapSize.height = 2048;
            this.scene.add(ps2PointLight);
            
            // Add hemisphere light for better PS2 ambience
            const hemiLight = new THREE.HemisphereLight(lightTheme.primary, lightTheme.secondary, 0.2);
            this.scene.add(hemiLight);
            
        } else {
            // Ultra-enhanced standard lighting
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
            directionalLight.position.set(10, 10, 5);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 4096;
            directionalLight.shadow.mapSize.height = 4096;
            directionalLight.shadow.camera.near = 0.1;
            directionalLight.shadow.camera.far = 100;
            directionalLight.shadow.camera.left = -50;
            directionalLight.shadow.camera.right = 50;
            directionalLight.shadow.camera.top = 50;
            directionalLight.shadow.camera.bottom = -50;
            directionalLight.shadow.bias = -0.0001;
            directionalLight.shadow.normalBias = 0.02;
            this.scene.add(directionalLight);
            
            // Enhanced point light with better falloff
            const pointLight = new THREE.PointLight(0xffffff, 2, 60, 2);
            pointLight.position.set(0, 10, 0);
            pointLight.castShadow = true;
            pointLight.shadow.mapSize.width = 2048;
            pointLight.shadow.mapSize.height = 2048;
            this.scene.add(pointLight);
            
            // Add hemisphere light for better overall illumination
            const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
            this.scene.add(hemiLight);
        }
        
        console.log('🌟 Ultra-enhanced lighting setup complete with 4K shadows and improved falloff');
    }
    
    async setupSystems() {
        // Clean up existing systems before creating new ones
        this.cleanupSystems();
        
        // Reset the systems initialized flag to ensure proper reinitialization
        this.areSystemsInitialized = false;
        
        // Initialize skybox manager 
        this.skyboxManager = new SkyboxManager(this.scene, this.renderer);
        console.log('🌅 Skybox manager initialized');
        
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
            console.log(`🎯 Loading level file: ${levelFile} (currentLevel: ${this.currentLevel})`);
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
        
        // Now that player is created, initialize camera system and graphics enhancer
        this.cameraSystem = new CameraSystem(this.player);
        console.log('📷 Camera system initialized');
        
        this.graphicsEnhancer = new GraphicsEnhancer(this.scene, this.renderer, this.cameraSystem.camera);
        console.log('✨ Graphics enhancer initialized with SSR support');
        
        // Initialize comprehensive graphics enhancements for all game modes
        this.graphicsEnhancer.enhanceAllLevels();
        
        // Sync player lives with classic mode lives if in classic mode
        if (this.isClassicMode) {
            try {
                this.player.setLives(this.classicLives);
            } catch (error) {
                console.warn('Failed to set player lives in classic mode:', error);
                // Fallback: set lives directly
                this.player.lives = this.classicLives;
            }
        }
        
        // Set level-specific player speed
        this.player.speed = this.getPlayerSpeed();
        
        // Set appropriate skybox theme
        if (this.skyboxManager) {
            const skyboxTheme = this.skyboxManager.getThemeForLevel(this.gameMode, this.currentLevel);
            this.skyboxManager.setSkyboxTheme(skyboxTheme);
        }
        
        // Update volumetric fog theme for the level/mode
        if (this.settingsManager.settings.graphics.enableVolumetricFog) {
            this.updateVolumetricFogTheme();
        }
        
        // Enhance graphics and materials
        if (this.graphicsEnhancer) {
            try {
                this.graphicsEnhancer.createEnvironmentMap(this.gameMode);
                // Delay material enhancement to allow all objects to be created
                setTimeout(() => {
                    try {
                        this.graphicsEnhancer.enhanceSceneMaterials(this.gameMode);
                    } catch (error) {
                        console.warn('Failed to enhance scene materials:', error);
                    }
                }, 100);
            } catch (error) {
                console.warn('Failed to create environment map:', error);
            }
        }
        
        // Get spawn point from level
        const spawnPoint = this.levelLoader.getSpawnPoint();
        this.player.setSpawnPoint(spawnPoint);
        
        // Set cross-references between player and grid manager
        this.gridManager.setPlayer(this.player);
        this.player.setGridManager(this.gridManager);
        
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
            try {
                this.battleSystem = new BattleSystem(this.scene, this.player);
                this.battleUI = new BattleUI();
                
                // Connect battle system and UI
                this.battleSystem.setBattleUI(this.battleUI);
                
                // Setup battle system callbacks
                this.battleSystem.setVictoryCallback(() => this.handleBattleVictory());
                this.battleSystem.setDefeatCallback(() => this.handleBattleDefeat());
                
                // Start battle at specified level with bot count if available
                this.battleSystem.startBattle(this.currentLevel, this.botCount);
                
                console.log('🥊 Battle system initialized successfully');
            } catch (error) {
                console.error('Failed to initialize battle system:', error);
                // Show error message and return to main menu
                this.showErrorAndReturnToMenu('Failed to start the battle system. Please try again or check your browser console for more details.');
                return; // Exit early to prevent game loop creation
            }
        }

        // Setup game loop only if we reach this point successfully
        try {
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
            
            console.log('🎮 Game loop initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game loop:', error);
            this.showErrorAndReturnToMenu('Failed to initialize the game loop. Please try again.');
            return;
        }
        
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
        
        // Start auto-save system (but not in pacman modes or multiplayer)
        if (!this.isClassicMode && this.gameMode !== 'pacman' && this.gameMode !== 'pacman_classic' && this.gameMode !== 'multiplayer') {
            this.startAutoSave();
        }
        
        // Apply initial settings with error handling
        if (this.settingsManager) {
            try {
                this.settingsManager.applySettings();
            } catch (error) {
                console.warn('Failed to apply some settings during setup, but continuing with defaults:', error);
                // Don't fail the entire setup for settings issues
            }
        }
        
        // Reset exit activation flag for new game/level
        if (this.collisionSystem) {
            this.collisionSystem.resetExitActivation();
        }
        
        // Mark systems as initialized
        this.areSystemsInitialized = true;
        console.log('🎮 Systems initialization complete');
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
            
            // Update graphics enhancer post-processing pipeline
            if (this.graphicsEnhancer && this.graphicsEnhancer.onWindowResize) {
                this.graphicsEnhancer.onWindowResize();
            }
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
                if (this.player) this.player.enableControls();
            } else {
                if (this.player) this.player.disableControls();
            }
        });
        
        // Handle O key for pause functionality and ESC key for main menu - use capture phase for highest priority
        document.addEventListener('keydown', (event) => {
            // Handle O key for pause functionality
            if (event.key === 'o' || event.key === 'O') {
                event.preventDefault();
                event.stopPropagation(); // Prevent other listeners from handling this
                
                console.log('🎮 O key pressed - checking pause conditions...');
                console.log(`🎮 Game initialized: ${this.isGameInitialized}`);
                
                // Check if game is initialized and active
                if (this.isGameInitialized) {
                    // Check if any menus are visible and prevent pause
                    const menuVisible = this.mainMenu.isVisible || 
                                      this.singlePlayerMenu.isVisible || 
                                      this.pacmanMenu.isVisible || 
                                      this.battleMenu.isVisible ||
                                      this.gameOverScreen.isVisible;
                    
                    console.log(`🎮 Menu visibility check: ${menuVisible}`);
                    console.log(`🎮 Main menu: ${this.mainMenu.isVisible}, Single player: ${this.singlePlayerMenu.isVisible}, Pacman: ${this.pacmanMenu.isVisible}, Battle: ${this.battleMenu.isVisible}, Game over: ${this.gameOverScreen.isVisible}`);
                    console.log(`🎮 Current pause state: ${this.isPaused}`);
                    
                    // Only handle pause if no menus are visible and game is active
                    if (!menuVisible) {
                        console.log('🎮 Conditions met - calling togglePause()');
                        this.togglePause();
                    } else {
                        console.log('🎮 Pause blocked - menu is visible');
                    }
                } else {
                    console.log('🎮 Pause blocked - game not initialized');
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
        }, true); // Use capture phase for highest priority
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
            
            // Clean up all game mode UI elements when going to main menu
            this.cleanupAllGameModeUI();
            
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
    
    async handleGameOver() {
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
                // No more lives, game over - show score entry screen
                console.log('Classic Mode: All lives lost! Game Over!');
                
                // Show score entry for classic mode completion
                await this.showScoreEntryForCompletion();
                
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
            
            // In classic mode, just advance to next wave - don't show score entry until game over
            
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
            
            // Show wave completion notification
            if (this.uiManager) {
                this.uiManager.showNotification(`Wave ${this.classicWave-1} Complete!<br>Starting Wave ${this.classicWave}`, 'success', 3000);
            }
            
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
        
        // Show score entry for level completion
        await this.showScoreEntryForCompletion();
        
        // Show leaderboard with action options
        const category = this.isClassicMode ? 'classicMode' : 
                        (this.gameMode === 'normal' && this.currentLevel === 6) ? 'fullRun' : 'individualLevel';
        const userChoice = await this.showLeaderboardWithActions(category);
        
        // Stop the game loop
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
        
        // Handle user choice from leaderboard
        if (userChoice === 'menu') {
            // Return to main menu
            this.returnToMainMenu();
        } else if (userChoice === 'restart') {
            // Restart current level
            try {
                await this.restartCurrentLevel();
                console.log(`🔄 Restarted level ${this.currentLevel}`);
            } catch (error) {
                console.error('Error restarting level:', error);
                this.handleGameOver();
            }
        } else if (userChoice === 'nextLevel') {
            // Advance to next level
            const hasNextLevel = this.nextLevel();
            
            if (hasNextLevel) {
                try {
                    // Brief pause to show completion
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Reload the game with the new level
                    await this.restartCurrentLevel();
                    
                    console.log(`🚀 Started level ${this.currentLevel}`);
                } catch (error) {
                    console.error('Error advancing to next level:', error);
                    // Fall back to game over if level loading fails
                    this.handleGameOver();
                }
            } else {
                // No more levels - show game completion
                console.log('🏁 All levels completed!');
                this.clearSavedGameState(); // Clear save since game is completed
                alert('🏁 Congratulations! You\'ve completed all available levels!');
                this.returnToMainMenu();
            }
        } else {
            // Default behavior (closed leaderboard without action) - auto-advance like before
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
    }
    
    // Handle battle victory
    async handleBattleVictory() {
        console.log('Battle victory!');
        if (this.battleSystem && this.battleUI) {
            const currentConfig = this.battleSystem.levelConfigs[this.battleSystem.currentLevel];
            const isLastLevel = this.battleSystem.currentLevel >= this.battleSystem.maxLevel;
            
            // Check for battle tournament high score if it's the last level
            if (isLastLevel) {
                await this.checkForBattleHighScore();
            }
            
            this.battleUI.showVictoryScreen(currentConfig, isLastLevel);
            
            if (!isLastLevel) {
                // Auto-advance to next level after victory screen
                setTimeout(() => {
                    this.battleSystem.startBattle(this.battleSystem.currentLevel + 1);
                }, 6000);
            }
        }
    }
    
    // Check for battle tournament high score
    async checkForBattleHighScore() {
        if (!this.leaderboardManager || !this.scoreEntry || !this.battleSystem) {
            return;
        }
        
        // Calculate battle score based on levels completed and time taken
        const levelsCompleted = this.battleSystem.currentLevel;
        const battleStartTime = this.battleSystem.battleStartTime || Date.now();
        const completionTime = (Date.now() - battleStartTime) / 1000;
        const baseScore = levelsCompleted * 1000; // 1000 points per level
        const timeBonus = Math.max(0, 300 - completionTime); // Bonus for faster completion
        const totalScore = Math.floor(baseScore + timeBonus);
        
        const scoreData = {
            score: totalScore,
            completionTime: completionTime,
            levelsCompleted: levelsCompleted,
            gameMode: 'battle',
            timestamp: Date.now()
        };
        
        // Check if score qualifies for battle tournament leaderboard
        if (this.leaderboardManager.qualifiesForLeaderboard('battleTournament', totalScore, null, completionTime)) {
            console.log(`🏆 Battle tournament high score detected! Score: ${totalScore}`);
            
            // Show score entry screen
            await this.showScoreEntryScreen(scoreData, 'battleTournament');
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
        this.resetSystems();
        
        // Reinitialize systems with current level (always level 2 for classic)
        await this.setupSystems();
        
        // Reset exit activation flag to prevent spamming
        if (this.collisionSystem) {
            this.collisionSystem.resetExitActivation();
        }
        
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
        console.log('🧹 Cleaning up UI elements...');
        
        // Remove any existing UI elements by ID
        const uiElementIds = [
            'minimap',
            'fps-counter',
            'position-display',
            'collectibles-counter',
            'keys-counter',
            'lives-counter',
            'game-timer',
            'camera-mode',
            'classic-wave-display',
            'notification-system',
            'pause-menu',
            'multiplayer-display'
        ];
        
        uiElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.parentNode) {
                try {
                    element.parentNode.removeChild(element);
                    console.log(`Removed UI element: ${id}`);
                } catch (e) {
                    console.warn(`Could not remove UI element ${id}:`, e);
                }
            }
        });
        
        // Remove any dynamically created UI elements by class patterns
        const uiClassPatterns = [
            '[class*="ui-"]',
            '[class*="hud-"]',
            '[class*="game-"]',
            '[class*="battle-"]',
            '[class*="multiplayer-"]'
        ];
        
        uiClassPatterns.forEach(pattern => {
            const elements = document.querySelectorAll(pattern);
            elements.forEach(element => {
                // Don't remove the main menu or game canvas
                if (element.id !== 'mainMenu' && element.id !== 'gameCanvas' && 
                    !element.closest('#mainMenu') && element.parentNode) {
                    try {
                        element.parentNode.removeChild(element);
                        console.log(`Removed UI element with class pattern: ${pattern}`);
                    } catch (e) {
                        console.warn(`Could not remove UI element with pattern ${pattern}:`, e);
                    }
                }
            });
        });
        
        // Destroy UI Manager if it exists
        if (this.uiManager) {
            try {
                this.uiManager.destroy();
                console.log('UI Manager destroyed');
            } catch (e) {
                console.warn('Could not destroy UI Manager:', e);
            }
        }
        
        console.log('🧹 UI elements cleanup complete');
    }
    
    // Reset the systems initialization flag to allow re-initialization
    resetSystems() {
        this.areSystemsInitialized = false;
        console.log('🔄 Systems reset flag cleared - systems can be re-initialized');
    }
    
    cleanupSystems() {
        // Clean up existing systems to prevent duplicates
        console.log('🧹 Cleaning up existing systems...');
        
        // Clean up grid manager and its objects
        if (this.gridManager) {
            this.gridManager.cleanupLevel();
        }
        
        // Clean up player objects
        if (this.player && this.player.mesh) {
            this.scene.remove(this.player.mesh);
            if (this.player.rotationHelper) {
                this.scene.remove(this.player.rotationHelper);
            }
        }
        
        // Clean up battle system
        if (this.battleSystem) {
            this.battleSystem.cleanup();
        }
        
        // Clean up battle UI
        if (this.battleUI) {
            this.battleUI.cleanup();
        }
        
        // Clean up collision system
        if (this.collisionSystem) {
            this.collisionSystem.resetForNewLevel();
        }
        
        // Clean up game objects from scene
        if (this.scene) {
            const objectsToRemove = [];
            this.scene.traverse((child) => {
                if (child.isMesh && child.userData.gameObject) {
                    objectsToRemove.push(child);
                }
            });
            objectsToRemove.forEach(obj => this.scene.remove(obj));
        }
        
        console.log('🧹 System cleanup complete');
    }
    
    cleanupAllGameModeUI() {
        console.log('🧹 Cleaning up all game mode UI elements...');
        
        // First, clean up standard UI elements
        this.cleanupUIElements();
        
        // Clean up local multiplayer battle UI
        if (this.localMultiplayerBattle) {
            this.localMultiplayerBattle.cleanupAllBattleUI();
        }
        
        // Clean up battle system UI
        if (this.battleSystem) {
            this.battleSystem.cleanup();
        }
        
        if (this.battleUI) {
            this.battleUI.cleanup();
        }
        

        
        // Clean up audio manager
        if (this.audioManager) {
            this.audioManager.destroy();
        }
        
        // Remove any remaining game UI elements by comprehensive ID patterns
        const gameUIElements = [
            // Standard UI elements
            'minimap',
            'fps-counter',
            'position-display',
            'collectibles-counter',
            'keys-counter',
            'lives-counter',
            'game-timer',
            'camera-mode',
            'classic-wave-display',
            'notification-system',
            'pause-menu',
            'multiplayer-display',
            
            // Battle and multiplayer elements
            'multiplayer-setup',
            'arena-intro',
            'battle-countdown',
            'multiplayer-hud',
            'round-hud',
            'player-count-dialog',
            'multiplayer-type-dialog',
            'multiplayer-room-dialog',
            'multiplayer-lobby',
            'game-setup-dialog',
            'waiting-room',
            'player-list',
            'game-results',
            'match-results',
            'tournament-results',
            'elimination-message',
            'round-end-message',
            'victory-screen',
            'defeat-screen',
            'battle-results',
            'final-results',
            
            // Pause and overlay elements
            'pauseOverlay',
            'game-over-overlay',
            'level-complete-overlay',
            'loading-overlay',
            'connection-status'
        ];
        
        gameUIElements.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.parentNode) {
                try {
                    element.parentNode.removeChild(element);
                    console.log(`Removed game UI element: ${id}`);
                } catch (e) {
                    console.warn(`Could not remove game UI element ${id}:`, e);
                }
            }
        });
        
        // Remove any player HUD elements (up to 8 players)
        for (let i = 0; i < 8; i++) {
            const playerHUD = document.getElementById(`player-hud-${i}`);
            if (playerHUD && playerHUD.parentNode) {
                try {
                    playerHUD.parentNode.removeChild(playerHUD);
                    console.log(`Removed player HUD: player-hud-${i}`);
                } catch (e) {
                    console.warn(`Could not remove player HUD ${i}:`, e);
                }
            }
        }
        
        // Remove any notification elements
        const notifications = document.querySelectorAll('[id*="notification"], [class*="notification"]');
        notifications.forEach(notification => {
            if (notification.parentNode && notification.id !== 'mainMenu') {
                try {
                    notification.parentNode.removeChild(notification);
                    console.log('Removed notification element');
                } catch (e) {
                    console.warn('Could not remove notification:', e);
                }
            }
        });
        
        // Remove any game over or result screens
        const gameOverElements = document.querySelectorAll('[id*="game-over"], [id*="result"], [id*="victory"], [id*="defeat"], [id*="match-end"], [id*="tournament-end"]');
        gameOverElements.forEach(element => {
            if (element.parentNode && element.id !== 'mainMenu') {
                try {
                    element.parentNode.removeChild(element);
                    console.log('Removed game over element');
                } catch (e) {
                    console.warn('Could not remove game over element:', e);
                }
            }
        });
        
        // Remove any remaining UI elements with battle/multiplayer/game patterns
        const remainingElements = document.querySelectorAll('[id*="battle"], [id*="multiplayer"], [id*="player-"], [id*="round-"], [id*="arena-"], [id*="game-"], [class*="battle"], [class*="multiplayer"], [class*="player-"], [class*="game-"], [class*="ui-"]');
        remainingElements.forEach(element => {
            // Only remove elements that are clearly game-related, not the main menu or canvas
            if (element.id !== 'mainMenu' && element.id !== 'gameCanvas' && 
                !element.closest('#mainMenu') && element.parentNode) {
                try {
                    element.parentNode.removeChild(element);
                    console.log(`Removed remaining UI element: ${element.id || element.className}`);
                } catch (e) {
                    console.warn('Could not remove remaining UI element:', e);
                }
            }
        });
        
        // Remove any battle-related style elements
        const battleStyles = document.querySelectorAll('style[data-battle-style], style[data-game-style], style[data-ui-style]');
        battleStyles.forEach(style => {
            if (style.parentNode) {
                try {
                    document.head.removeChild(style);
                    console.log('Removed battle style element');
                } catch (e) {
                    console.warn('Could not remove battle style element:', e);
                }
            }
        });
        
        // Clear any remaining event listeners on the document
        const newDocument = document.cloneNode(true);
        // Note: We can't actually replace the document, but we can remove specific event listeners
        
        console.log('🧹 All game mode UI elements cleanup complete');
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
        
        // Validate timer values to prevent NaN
        if (isNaN(this.pacmanLevelTimeLimit) || !isFinite(this.pacmanLevelTimeLimit) || this.pacmanLevelTimeLimit <= 0) {
            console.warn('Invalid pacmanLevelTimeLimit, using default 300 seconds');
            this.pacmanLevelTimeLimit = 300;
            this.pacmanTimeRemaining = 300;
        }
        
        if (isNaN(this.pacmanTimeRemaining) || !isFinite(this.pacmanTimeRemaining)) {
            console.warn('Invalid pacmanTimeRemaining, resetting to time limit');
            this.pacmanTimeRemaining = this.pacmanLevelTimeLimit;
        }
        
        this.pacmanTimerStarted = true;
        
        console.log(`Starting pacman timer for level ${this.currentLevel}: ${this.pacmanLevelTimeLimit} seconds`);
    }
    
    // Update pacman timer (called from game loop)
    updatePacmanTimer(deltaTime) {
        // Don't update timer if paused or not in pacman mode or timer not started
        if (!this.pacmanTimerStarted || (this.gameMode !== 'pacman' && this.gameMode !== 'pacman_classic') || this.isPaused) return;
        
        // Classic mode doesn't use timer
        if (this.isClassicMode) return;
        
        // Validate deltaTime to prevent NaN
        if (isNaN(deltaTime) || !isFinite(deltaTime) || deltaTime < 0 || deltaTime > 1) {
            console.warn('Invalid deltaTime in updatePacmanTimer:', deltaTime);
            return;
        }
        
        // Validate current timer value
        if (isNaN(this.pacmanTimeRemaining) || !isFinite(this.pacmanTimeRemaining)) {
            console.warn('Invalid pacmanTimeRemaining, resetting timer');
            this.pacmanTimeRemaining = this.pacmanLevelTimeLimit || 0;
            return;
        }
        
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
        // Validate timer value to prevent NaN display
        if (isNaN(this.pacmanTimeRemaining) || !isFinite(this.pacmanTimeRemaining) || this.pacmanTimeRemaining < 0) {
            return '00:00';
        }
        
        const minutes = Math.floor(this.pacmanTimeRemaining / 60);
        const seconds = Math.floor(this.pacmanTimeRemaining % 60);
        
        // Double-check that calculated values are valid
        const displayMinutes = isNaN(minutes) ? 0 : Math.max(0, minutes);
        const displaySeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
        
        return `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
    }
    
    // Calculate time bonus points based on remaining time
    calculateTimeBonus() {
        if (this.gameMode !== 'pacman' || !this.pacmanTimerStarted) return 0;
        
        // Validate timer values to prevent NaN in calculations
        if (isNaN(this.pacmanTimeRemaining) || !isFinite(this.pacmanTimeRemaining) || 
            isNaN(this.pacmanLevelTimeLimit) || !isFinite(this.pacmanLevelTimeLimit) || 
            this.pacmanLevelTimeLimit <= 0) {
            console.warn('Invalid timer values in calculateTimeBonus, returning 0');
            return 0;
        }
        
        // Base bonus calculation: more remaining time = more points
        // Max bonus is 1000 points for completing quickly
        const timeUsed = this.pacmanLevelTimeLimit - this.pacmanTimeRemaining;
        const efficiency = Math.max(0, (this.pacmanLevelTimeLimit - timeUsed) / this.pacmanLevelTimeLimit);
        
        // Validate efficiency calculation
        if (isNaN(efficiency) || !isFinite(efficiency)) {
            console.warn('Invalid efficiency calculation, returning 0');
            return 0;
        }
        
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
            
            // Clean up ALL UI elements to prevent duplication
            this.cleanupAllGameModeUI();
            
            // Clean up existing player objects
            if (this.player) {
                if (this.player.mesh) {
                    this.scene.remove(this.player.mesh);
                }
                if (this.player.rotationHelper) {
                    this.scene.remove(this.player.rotationHelper);
                }
            }
            
            // Reset systems flag to allow reinitialization
            this.resetSystems();
            
            // Reinitialize the game systems with current level
            await this.setupSystems();
            
            // Reset exit activation flag to prevent spamming
            if (this.collisionSystem) {
                this.collisionSystem.resetExitActivation();
            }
            
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