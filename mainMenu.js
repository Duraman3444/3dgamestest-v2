
import { LocalMultiplayerBattle } from './localMultiplayerBattle.js';

export class MainMenu {
    constructor(onStartGame) {
        this.onStartGame = onStartGame;
        this.menuElement = null;
        this.isVisible = false;
        this.currentSettingsPanel = null;
        this.currentOptionIndex = 0;
        this.menuButtons = [];
        this.keyboardListener = null;

        
        this.createMenu();
    }
    
    createMenu() {
        // Create main menu container
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'mainMenu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: 'Courier New', monospace;
        `;
        
        // Create title
        const title = document.createElement('h1');
        title.textContent = 'BALL BLITZ';
        title.style.cssText = `
            color: #00ffff;
            font-size: 72px;
            font-weight: 900;
            margin-bottom: 30px;
            text-shadow: 4px 4px 0px #ff00ff, 8px 8px 0px #000000, 0px 0px 20px rgba(0, 255, 255, 0.5);
            text-align: center;
            letter-spacing: 10px;
            text-transform: uppercase;
            font-family: "Segoe UI", 'Impact', 'Arial Black', sans-serif;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
        `;
        
        // Create subtitle
        const subtitle = document.createElement('h2');
        subtitle.textContent = 'ARCADE EDITION';
        subtitle.style.cssText = `
            color: #ffff00;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 50px;
            text-shadow: 3px 3px 0px #000000, 0px 0px 10px rgba(255, 255, 0, 0.5);
            text-align: center;
            letter-spacing: 6px;
            text-transform: uppercase;
            font-family: "Segoe UI", 'Arial Black', sans-serif;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
        `;
        
        // Create menu buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
        `;
        
        // Create menu buttons
        const buttons = [
            { text: 'Continue', action: () => this.continueGame(), id: 'continue-button' },
            { text: 'Single Player', action: () => this.startSinglePlayer() },
            { text: 'Pacman Mode', action: () => this.startPacmanMode() },
            { text: 'Battle Mode', action: () => this.startBattleMode() },
            { text: 'Leaderboards', action: () => this.showLeaderboards() },
            { text: 'Multiplayer', action: () => this.showMultiplayerNotice() },
            { text: 'Settings', action: () => this.showSettings() },
            { text: 'Exit Game', action: () => this.exitGame() }
        ];
        
        this.menuButtons = [];
        buttons.forEach((button, index) => {
            const buttonElement = this.createButton(button.text, button.action, index);
            
            // Hide Continue button if no saved game exists
            if (button.id === 'continue-button' && !this.hasSavedGame()) {
                buttonElement.style.display = 'none';
            }
            
            this.menuButtons.push(buttonElement);
            buttonsContainer.appendChild(buttonElement);
        });
        
        // Create cursor controls info
        const controlsInfo = document.createElement('div');
        controlsInfo.textContent = 'Use ↑↓ arrow keys to navigate, ENTER to select';
        controlsInfo.style.cssText = `
            position: absolute;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            color: #00ffff;
            font-size: 16px;
            text-align: center;
            font-family: 'Courier New', monospace;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        // Create audio info with status
        const audioInfo = document.createElement('div');
        const updateAudioInfo = () => {
            if (window.game && window.game.audioManager) {
                const status = window.game.audioManager.getAudioStatus();
                audioInfo.textContent = `🎵 ${status.message}`;
                audioInfo.style.color = status.ready ? '#00ff00' : '#ffff00';
            } else {
                audioInfo.textContent = '🎵 Audio System Loading...';
                audioInfo.style.color = '#ffff00';
            }
        };
        
        updateAudioInfo();
        
        // Update audio info every second
        const audioInfoInterval = setInterval(updateAudioInfo, 1000);
        
        // Store interval for cleanup
        this.audioInfoInterval = audioInfoInterval;
        
        audioInfo.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            color: #ffff00;
            font-size: 14px;
            text-align: center;
            font-family: 'Courier New', monospace;
            text-shadow: 1px 1px 0px #000000;
            animation: pulse 2s infinite;
            cursor: pointer;
        `;
        
        // Add click handler to manually initialize audio
        audioInfo.addEventListener('click', async () => {
            if (window.game && window.game.audioManager) {
                const success = await window.game.audioManager.manualInitialize();
                if (success) {
                    updateAudioInfo();
                    // Play a test sound
                    setTimeout(() => {
                        window.game.audioManager.playMenuClickSound();
                    }, 500);
                }
            }
        });
        
        // Add pulsing animation for audio info
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
        `;
        document.head.appendChild(style);
        
        // Create version info
        const versionInfo = document.createElement('div');
        versionInfo.textContent = 'PS2 EDITION v2.0';
        versionInfo.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            color: #ffff00;
            font-size: 14px;
            font-family: 'Courier New', monospace;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        // Add copyright notice
        const copyrightInfo = document.createElement('div');
        copyrightInfo.textContent = '© 2024 ARCADE CLASSICS';
        copyrightInfo.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            color: #ff00ff;
            font-size: 12px;
            font-family: 'Courier New', monospace;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        // Assemble menu
        this.menuElement.appendChild(title);
        this.menuElement.appendChild(subtitle);
        this.menuElement.appendChild(buttonsContainer);
        this.menuElement.appendChild(controlsInfo);
        this.menuElement.appendChild(audioInfo);
        this.menuElement.appendChild(versionInfo);
        this.menuElement.appendChild(copyrightInfo);
        
        document.body.appendChild(this.menuElement);
        this.isVisible = true;
        
        // Set initial selection and setup keyboard navigation
        this.updateButtonSelection();
        this.setupKeyboardNavigation();
    }
    
    createButton(text, onClick, index) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: linear-gradient(135deg, #003366 0%, #0066cc 100%);
            border: 3px solid #00ffff;
            color: #ffffff;
            padding: 15px 40px;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 0px;
            transition: all 0.2s ease;
            min-width: 280px;
            text-align: center;
            user-select: none;
            font-family: 'Courier New', monospace;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 2px 2px 0px #000000;
            box-shadow: 4px 4px 0px #000000;
        `;
        
        // Add mouse hover effects (but keyboard navigation will override)
        button.addEventListener('mouseenter', () => {
            // Only update selection if button is visible
            if (button.style.display !== 'none') {
                this.currentOptionIndex = index;
                this.updateButtonSelection();
                
                // Play hover sound
                if (window.game && window.game.audioManager) {
                    window.game.audioManager.playMenuHoverSound();
                }
            }
        });
        
        button.addEventListener('click', () => {
            // Play click sound
            if (window.game && window.game.audioManager) {
                window.game.audioManager.playMenuClickSound();
            }
            onClick();
        });
        
        return button;
    }
    
    setupKeyboardNavigation() {
        this.keyboardListener = (event) => {
            if (!this.isVisible) return;
            
            switch(event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    this.navigateUp();
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    this.navigateDown();
                    break;
                case 'Enter':
                    event.preventDefault();
                    this.selectCurrentOption();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyboardListener);
    }
    
    navigateUp() {
        let newIndex = this.currentOptionIndex;
        do {
            newIndex = (newIndex - 1 + this.menuButtons.length) % this.menuButtons.length;
        } while (this.menuButtons[newIndex].style.display === 'none');
        this.currentOptionIndex = newIndex;
        this.updateButtonSelection();
        
        // Play navigation sound
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playMenuHoverSound();
        }
    }
    
    navigateDown() {
        let newIndex = this.currentOptionIndex;
        do {
            newIndex = (newIndex + 1) % this.menuButtons.length;
        } while (this.menuButtons[newIndex].style.display === 'none');
        this.currentOptionIndex = newIndex;
        this.updateButtonSelection();
        
        // Play navigation sound
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playMenuHoverSound();
        }
    }
    
    updateButtonSelection() {
        this.menuButtons.forEach((button, index) => {
            // Skip hidden buttons
            if (button.style.display === 'none') {
                return;
            }
            
            if (index === this.currentOptionIndex) {
                // Selected style - PS2 era bright selected state
                button.style.background = 'linear-gradient(135deg, #ff6600 0%, #ff9900 100%)';
                button.style.borderColor = '#ffff00';
                button.style.color = '#000000';
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '6px 6px 0px #000000';
            } else {
                // Unselected style - PS2 era blue gradient
                button.style.background = 'linear-gradient(135deg, #003366 0%, #0066cc 100%)';
                button.style.borderColor = '#00ffff';
                button.style.color = '#ffffff';
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '4px 4px 0px #000000';
            }
        });
    }
    
    selectCurrentOption() {
        if (this.menuButtons[this.currentOptionIndex]) {
            // Play select sound
            if (window.game && window.game.audioManager) {
                window.game.audioManager.playMenuClickSound();
            }
            this.menuButtons[this.currentOptionIndex].click();
        }
    }
    
    startSinglePlayer() {
        this.hide();
        if (this.onStartGame) {
            this.onStartGame('normal'); // Pass 'normal' mode to trigger single player menu
        }
    }
    
    startPacmanMode() {
        this.hide();
        if (this.onStartGame) {
            this.onStartGame('pacman'); // Pass 'pacman' as mode identifier
        }
    }

    startBattleMode() {
        this.hide();
        if (this.onStartGame) {
            this.onStartGame('battle'); // Pass 'battle' as mode identifier
        }
    }

    continueGame() {
        this.hide();
        if (window.game && window.game.continueFromSavedState) {
            window.game.continueFromSavedState();
        }
    }

    hasSavedGame() {
        if (!window.game || !window.game.hasSavedGameState || !window.game.hasSavedGameState()) {
            return false;
        }
        
        // Check if the saved game is not a pacman mode (pacman modes don't support continue)
        try {
            const savedState = window.game.loadSavedGameState();
            if (savedState && (savedState.gameMode === 'pacman' || savedState.gameMode === 'pacman_classic')) {
                return false; // Don't show continue for pacman modes
            }
        } catch (error) {
            console.error('Error checking saved game mode:', error);
        }
        
        return true;
    }

    updateContinueButtonVisibility() {
        if (this.menuButtons.length > 0) {
            const continueButton = this.menuButtons[0]; // Continue button is first
            if (this.hasSavedGame()) {
                continueButton.style.display = 'block';
            } else {
                continueButton.style.display = 'none';
            }
        }
    }

    getFirstVisibleButtonIndex() {
        for (let i = 0; i < this.menuButtons.length; i++) {
            if (this.menuButtons[i].style.display !== 'none') {
                return i;
            }
        }
        return 0; // Fallback
    }
    
    showMultiplayerNotice() {
        this.showMultiplayerTypeChoice();
    }
    
    showMultiplayerTypeChoice() {
        // Hide main menu
        this.hide();
        
        // Create multiplayer type selection dialog
        const typeDialog = document.createElement('div');
        typeDialog.id = 'multiplayer-type-dialog';
        typeDialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: 'Courier New', monospace;
            color: white;
        `;
        
        typeDialog.innerHTML = `
            <div style="text-align: center; max-width: 500px; padding: 20px;">
                <h1 style="
                    color: #00ffff;
                    font-size: 48px;
                    font-weight: bold;
                    margin-bottom: 30px;
                    text-shadow: 3px 3px 0px #ff00ff, 6px 6px 0px #000000;
                    letter-spacing: 4px;
                ">MULTIPLAYER</h1>
                
                <p style="
                    font-size: 18px;
                    color: #ffffff;
                    margin-bottom: 40px;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                ">Choose your multiplayer mode:</p>
                
                <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
                    <button id="local-multiplayer-btn" style="
                        padding: 20px 40px;
                        font-size: 24px;
                        font-weight: bold;
                        background: linear-gradient(45deg, #4CAF50, #45a049);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        transition: all 0.3s;
                        font-family: 'Courier New', monospace;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        width: 300px;
                    ">🎮 Local Multiplayer</button>
                    

                    
                    <button id="back-from-multiplayer-btn" style="
                        padding: 15px 30px;
                        font-size: 18px;
                        background: linear-gradient(45deg, #f44336, #d32f2f);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        transition: all 0.3s;
                        font-family: 'Courier New', monospace;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        width: 200px;
                        margin-top: 20px;
                    ">← Back</button>
                </div>
                
                <div style="margin-top: 30px; font-size: 14px; color: #aaa; text-align: left;">
                    <p><strong>🎮 Local Multiplayer:</strong> Play with friends on the same device using split-screen</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(typeDialog);
        
        // Add hover effects
        const buttons = typeDialog.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            });
        });
        
        // Add event listeners
        document.getElementById('local-multiplayer-btn').addEventListener('click', () => {
            document.body.removeChild(typeDialog);
            this.startLocalMultiplayer();
        });
        

        
        document.getElementById('back-from-multiplayer-btn').addEventListener('click', () => {
            document.body.removeChild(typeDialog);
            this.show();
        });
    }
    
    startLocalMultiplayer() {
        console.log('🥊 Starting Local Multiplayer Battle Arena!');
        
        // Show player count selection
        this.showPlayerCountSelection();
    }
    
    showPlayerCountSelection() {
        const countDialog = document.createElement('div');
        countDialog.id = 'player-count-dialog';
        countDialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: 'Courier New', monospace;
            color: white;
        `;
        
        countDialog.innerHTML = `
            <div style="text-align: center; max-width: 600px; padding: 40px; background: rgba(0,0,0,0.3); border-radius: 20px; backdrop-filter: blur(10px);">
                <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                    🥊 SUMO BATTLE ARENA
                </h1>
                
                <h2 style="margin-bottom: 30px; font-size: 24px; color: #FFD700;">
                    Select Number of Players
                </h2>
                
                <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px; flex-wrap: wrap;">
                    <button id="player-count-2" style="
                        padding: 20px 30px;
                        font-size: 24px;
                        background: linear-gradient(45deg, #4CAF50, #45a049);
                        color: white;
                        border: none;
                        border-radius: 15px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        transition: all 0.3s;
                        font-family: 'Courier New', monospace;
                        width: 120px;
                        height: 120px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div style="font-size: 36px; margin-bottom: 5px;">2</div>
                        <div style="font-size: 14px;">Players</div>
                    </button>
                    
                    <button id="player-count-3" style="
                        padding: 20px 30px;
                        font-size: 24px;
                        background: linear-gradient(45deg, #2196F3, #1976D2);
                        color: white;
                        border: none;
                        border-radius: 15px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        transition: all 0.3s;
                        font-family: 'Courier New', monospace;
                        width: 120px;
                        height: 120px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div style="font-size: 36px; margin-bottom: 5px;">3</div>
                        <div style="font-size: 14px;">Players</div>
                    </button>
                    
                    <button id="player-count-4" style="
                        padding: 20px 30px;
                        font-size: 24px;
                        background: linear-gradient(45deg, #FF9800, #F57C00);
                        color: white;
                        border: none;
                        border-radius: 15px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        transition: all 0.3s;
                        font-family: 'Courier New', monospace;
                        width: 120px;
                        height: 120px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div style="font-size: 36px; margin-bottom: 5px;">4</div>
                        <div style="font-size: 14px;">Players</div>
                    </button>
                </div>
                
                <div style="margin-bottom: 30px; font-size: 16px; color: #ccc; text-align: center;">
                    <p style="margin-bottom: 10px;">🎮 <strong>Control Schemes:</strong></p>
                    <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; font-size: 14px;">
                        <div style="background: rgba(0,255,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid #00FF00;">
                            <div style="color: #00FF00; font-weight: bold;">Player 1</div>
                            <div>WASD</div>
                        </div>
                        <div style="background: rgba(255,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid #FF0000;">
                            <div style="color: #FF0000; font-weight: bold;">Player 2</div>
                            <div>Arrow Keys</div>
                        </div>
                        <div style="background: rgba(0,0,255,0.2); padding: 10px; border-radius: 8px; border: 1px solid #0000FF;">
                            <div style="color: #0000FF; font-weight: bold;">Player 3</div>
                            <div>IJKL</div>
                        </div>
                        <div style="background: rgba(255,255,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid #FFFF00;">
                            <div style="color: #FFFF00; font-weight: bold;">Player 4</div>
                            <div>TFGH</div>
                        </div>
                    </div>
                </div>
                
                <button id="back-from-count-btn" style="
                    padding: 15px 30px;
                    font-size: 18px;
                    background: linear-gradient(45deg, #f44336, #d32f2f);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    transition: all 0.3s;
                    font-family: 'Courier New', monospace;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    width: 200px;
                ">← Back</button>
            </div>
        `;
        
        document.body.appendChild(countDialog);
        
        // Add hover effects
        const buttons = countDialog.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px) scale(1.05)';
                button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0) scale(1)';
                button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            });
        });
        
        // Add event listeners for player count selection
        document.getElementById('player-count-2').addEventListener('click', () => {
            document.body.removeChild(countDialog);
            this.startLocalMultiplayerBattle(2);
        });
        
        document.getElementById('player-count-3').addEventListener('click', () => {
            document.body.removeChild(countDialog);
            this.startLocalMultiplayerBattle(3);
        });
        
        document.getElementById('player-count-4').addEventListener('click', () => {
            document.body.removeChild(countDialog);
            this.startLocalMultiplayerBattle(4);
        });
        
        document.getElementById('back-from-count-btn').addEventListener('click', () => {
            document.body.removeChild(countDialog);
            this.showMultiplayerTypeChoice();
        });
    }
    
    startLocalMultiplayerBattle(playerCount) {
        console.log(`🥊 Starting ${playerCount}-Player Local Multiplayer Battle!`);
        
        // Start the game in local multiplayer battle mode
        if (this.onStartGame) {
            this.onStartGame('local_multiplayer', playerCount);
        }
    }
    

    
    showSettings() {
        // Use the global game settings manager if available
        if (window.game && window.game.settingsManager) {
            window.game.settingsManager.createSettingsPanel(() => {
                // Settings panel closed - no additional action needed
            });
        } else {
            // Fallback to local settings panel if game not available
            this.createSettingsPanel();
        }
    }
    
    showLeaderboards() {
        // Use the global game leaderboard UI if available
        if (window.game && window.game.leaderboardUI) {
            window.game.leaderboardUI.show('fullRun', {
                onClose: () => {
                    // Leaderboards closed - no additional action needed
                },
                onStartNextLevel: () => {
                    this.startNextLevel();
                },
                onRestartLevel: () => {
                    this.restartCurrentLevel();
                },
                onReturnToMenu: () => {
                    // Already in menu, just close leaderboard
                    window.game.leaderboardUI.hide();
                }
            });
        } else {
            console.error('Leaderboard system not available');
        }
    }
    
    // Start next level from leaderboard
    startNextLevel() {
        if (window.game) {
            // Close leaderboard
            window.game.leaderboardUI.hide();
            
            // Check if there is a next level available
            const currentLevel = window.game.getCurrentLevel();
            const hasNext = window.game.nextLevel();
            
            if (hasNext) {
                // Hide main menu and start the game
                this.hideMenu();
                window.game.startGame();
                console.log(`🚀 Starting level ${window.game.getCurrentLevel()} from leaderboard`);
            } else {
                // No more levels - show completion message
                console.log('🏁 All levels completed! Congratulations!');
                // Could show a completion screen here
                alert('🏁 Congratulations! You\'ve completed all available levels!');
            }
        }
    }
    
    // Restart current level from leaderboard
    restartCurrentLevel() {
        if (window.game) {
            // Close leaderboard
            window.game.leaderboardUI.hide();
            
            // Hide main menu and restart the game
            this.hideMenu();
            window.game.startGame();
            console.log(`🔄 Restarting level ${window.game.getCurrentLevel()} from leaderboard`);
        }
    }
    
    createSettingsPanel() {
        // Create settings overlay
        const settingsOverlay = document.createElement('div');
        settingsOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1001;
        `;
        
        // Create settings panel
        const settingsPanel = document.createElement('div');
        settingsPanel.style.cssText = `
            background: #2a5298;
            padding: 40px;
            border-radius: 12px;
            border: 2px solid rgba(255,255,255,0.3);
            max-width: 400px;
            width: 90%;
        `;
        
        // Settings title
        const title = document.createElement('h2');
        title.textContent = 'Settings';
        title.style.cssText = `
            color: #ffffff;
            margin-bottom: 30px;
            text-align: center;
            font-size: 24px;
        `;
        
        // Settings content
        const settingsContent = document.createElement('div');
        settingsContent.innerHTML = `
            <div style="color: #ffffff; margin-bottom: 20px;">
                <h3 style="margin-bottom: 10px; color: #ffffff;">Audio Settings</h3>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Master Volume</label>
                    <input type="range" min="0" max="100" value="50" style="width: 100%;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Music Volume</label>
                    <input type="range" min="0" max="100" value="30" style="width: 100%;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">SFX Volume</label>
                    <input type="range" min="0" max="100" value="70" style="width: 100%;">
                </div>
            </div>
            <div style="color: #ffffff; margin-bottom: 20px;">
                <h3 style="margin-bottom: 10px; color: #ffffff;">Graphics Settings</h3>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Graphics Quality</label>
                    <select style="width: 100%; padding: 5px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: #ffffff;">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" checked> Enable Shadows
                    </label>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" checked> Enable Fog
                    </label>
                </div>
            </div>
        `;
        
        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 30px;
        `;
        
        const saveButton = this.createButton('Save', () => {
            this.showNotice('Settings', 'Settings saved successfully!');
            this.closeSettings();
        });
        
        const cancelButton = this.createButton('Cancel', () => {
            this.closeSettings();
        });
        
        buttonsContainer.appendChild(saveButton);
        buttonsContainer.appendChild(cancelButton);
        
        settingsPanel.appendChild(title);
        settingsPanel.appendChild(settingsContent);
        settingsPanel.appendChild(buttonsContainer);
        settingsOverlay.appendChild(settingsPanel);
        
        document.body.appendChild(settingsOverlay);
        this.currentSettingsPanel = settingsOverlay;
    }
    
    closeSettings() {
        if (this.currentSettingsPanel) {
            document.body.removeChild(this.currentSettingsPanel);
            this.currentSettingsPanel = null;
        }
    }
    
    showNotice(title, message) {
        const noticeOverlay = document.createElement('div');
        noticeOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
        `;
        
        const noticePanel = document.createElement('div');
        noticePanel.style.cssText = `
            background: #2a5298;
            padding: 30px;
            border-radius: 12px;
            border: 2px solid rgba(255,255,255,0.3);
            max-width: 350px;
            width: 90%;
            text-align: center;
        `;
        
        const noticeTitle = document.createElement('h3');
        noticeTitle.textContent = title;
        noticeTitle.style.cssText = `
            color: #ffffff;
            margin-bottom: 20px;
            font-size: 20px;
        `;
        
        const noticeMessage = document.createElement('p');
        noticeMessage.textContent = message;
        noticeMessage.style.cssText = `
            color: #ffffff;
            margin-bottom: 25px;
            line-height: 1.4;
        `;
        
        const okButton = this.createButton('OK', () => {
            document.body.removeChild(noticeOverlay);
        });
        
        noticePanel.appendChild(noticeTitle);
        noticePanel.appendChild(noticeMessage);
        noticePanel.appendChild(okButton);
        noticeOverlay.appendChild(noticePanel);
        
        document.body.appendChild(noticeOverlay);
    }
    
    exitGame() {
        this.showNotice('Exit Game', 'Thanks for playing! Close the browser tab to exit.');
    }
    
    show() {
        if (this.menuElement) {
            // Clear any active notifications when showing main menu
            if (window.game && window.game.uiManager) {
                window.game.uiManager.clearNotification();
            }
            
            this.menuElement.style.display = 'flex';
            this.isVisible = true;
            
            // Update Continue button visibility
            this.updateContinueButtonVisibility();
            
            // Find first visible button for initial selection
            this.currentOptionIndex = this.getFirstVisibleButtonIndex();
            this.updateButtonSelection();
        }
    }
    
    hide() {
        if (this.menuElement) {
            this.menuElement.style.display = 'none';
            this.isVisible = false;
            
            // Remove keyboard listener
            if (this.keyboardListener) {
                document.removeEventListener('keydown', this.keyboardListener);
                this.keyboardListener = null;
            }
            
            // Clean up audio info interval
            if (this.audioInfoInterval) {
                clearInterval(this.audioInfoInterval);
                this.audioInfoInterval = null;
            }
        }
        
        // Close settings if open
        this.closeSettings();
    }
    
    destroy() {
        if (this.keyboardListener) {
            document.removeEventListener('keydown', this.keyboardListener);
        }
        
        if (this.menuElement) {
            document.body.removeChild(this.menuElement);
            this.menuElement = null;
        }
        this.closeSettings();
        if (this.audioInfoInterval) {
            clearInterval(this.audioInfoInterval);
        }
    }
}