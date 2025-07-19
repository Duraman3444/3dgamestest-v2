export class PacmanMenu {
    constructor(onStartGame, onBackToMain) {
        this.onStartGame = onStartGame;
        this.onBackToMain = onBackToMain;
        this.menuElement = null;
        this.isVisible = false;
        this.currentOptionIndex = 0;
        this.menuButtons = [];
        this.keyboardListener = null;
        this.selectedLevel = 1;
        this.selectedDifficulty = 'normal';
        this.isInLevelSelect = false;
        this.levelSelectButtons = [];
        this.levelSelectIndex = 0;
        this.isClassicMode = false; // Flag for classic mode
        
        // Available pacman levels with their details
        this.availableLevels = [
            { id: 1, name: "Pacman Level 1 - Training Maze", file: "pacman1.json" },
            { id: 2, name: "Pacman Level 2 - Classic Maze", file: "pacman2.json" },
            { id: 3, name: "Pacman Level 3 - Challenge Maze", file: "pacman3.json" },
            { id: 4, name: "Pacman Level 4 - Speed Maze", file: "pacman4.json" },
            { id: 5, name: "Pacman Level 5 - Final Maze", file: "pacman5.json" }
        ];
        
        this.createMenu();
    }
    
    // Check if all regular levels are completed
    areAllLevelsCompleted() {
        const progress = this.getProgress();
        const requiredLevels = [1, 2, 3, 4, 5, 6]; // Regular levels that must be completed
        
        return requiredLevels.every(level => progress.completedLevels.includes(level));
    }
    
    // Get progress from localStorage
    getProgress() {
        try {
            const saved = localStorage.getItem('gameProgress');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
        
        return {
            completedLevels: [],
            pacmanLevelsUnlocked: false,
            completedPacmanLevels: []
        };
    }
    
    // Save progress to localStorage
    saveProgress(progress) {
        try {
            localStorage.setItem('gameProgress', JSON.stringify(progress));
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }
    
    // Unlock pacman mode (bypass function)
    unlockPacmanMode() {
        try {
            const progress = {
                completedLevels: [1, 2, 3, 4, 5, 6], // Mark all regular levels as completed
                pacmanLevelsUnlocked: true,
                completedPacmanLevels: []
            };
            
            localStorage.setItem('gameProgress', JSON.stringify(progress));
            console.log('Pacman mode unlocked via bypass button!');
            
            // Refresh the menu to show unlocked state
            this.refreshMenu();
        } catch (error) {
            console.error('Error unlocking pacman mode:', error);
        }
    }
    
    // Refresh the menu interface
    refreshMenu() {
        // Clear the main menu container
        this.mainMenuContainer.innerHTML = '';
        this.menuButtons = [];
        
        // Recreate the level select interface now that it's unlocked
        this.createLevelSelectInterface();
    }
    
    // Check if a pacman level is unlocked
    isPacmanLevelUnlocked(levelId) {
        const allLevelsCompleted = this.areAllLevelsCompleted();
        if (!allLevelsCompleted) return false;
        
        const progress = this.getProgress();
        // Level 1 is unlocked if all regular levels are completed
        if (levelId === 1) return true;
        
        // Other levels are unlocked if previous pacman level is completed
        return progress.completedPacmanLevels.includes(levelId - 1);
    }

    // Check if a pacman level is completed
    isPacmanLevelCompleted(levelId) {
        const progress = this.getProgress();
        return progress.completedPacmanLevels.includes(levelId);
    }
    
    createMenu() {
        // Create menu container
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'pacmanMenu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #0a0a0a 100%);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: 'Courier New', monospace;
        `;
        
        // Create title
        const title = document.createElement('h1');
        title.textContent = 'PACMAN MODE';
        title.style.cssText = `
            color: #ffff00;
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 3px 3px 0px #ff00ff, 6px 6px 0px #000000;
            text-align: center;
            letter-spacing: 6px;
            text-transform: uppercase;
            font-family: 'Courier New', monospace;
        `;
        
        // Create subtitle
        const subtitle = document.createElement('h2');
        subtitle.textContent = 'NEON MAZE ADVENTURE';
        subtitle.style.cssText = `
            color: #00ffff;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 30px;
            text-shadow: 2px 2px 0px #000000;
            text-align: center;
            letter-spacing: 3px;
            text-transform: uppercase;
            font-family: 'Courier New', monospace;
        `;
        
        // Create main menu container
        this.mainMenuContainer = document.createElement('div');
        this.mainMenuContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
        `;
        
        // Check if pacman mode is unlocked
        const allLevelsCompleted = this.areAllLevelsCompleted();
        
        if (!allLevelsCompleted) {
            // Show locked message
            const lockedMessage = document.createElement('div');
            lockedMessage.textContent = 'PACMAN MODE LOCKED';
            lockedMessage.style.cssText = `
                color: #ff0000;
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 20px;
                text-shadow: 2px 2px 0px #000000;
                text-align: center;
                letter-spacing: 4px;
                text-transform: uppercase;
                font-family: 'Courier New', monospace;
            `;
            
            const unlockMessage = document.createElement('div');
            unlockMessage.textContent = 'Complete all 4 regular levels to unlock Pacman Mode!';
            unlockMessage.style.cssText = `
                color: #ffffff;
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 30px;
                text-shadow: 1px 1px 0px #000000;
                text-align: center;
                font-family: 'Courier New', monospace;
            `;
            
            this.mainMenuContainer.appendChild(lockedMessage);
            this.mainMenuContainer.appendChild(unlockMessage);
            
            // Create unlock bypass button (for testing)
            const unlockButton = this.createTinyButton('Unlock Pacman Mode Now', () => this.unlockPacmanMode(), 0);
            this.mainMenuContainer.appendChild(unlockButton);
            
            // Create back button
            const backButton = this.createButton('Back to Main Menu', () => this.backToMain(), 1);
            this.menuButtons.push(backButton);
            this.mainMenuContainer.appendChild(backButton);
        } else {
            // Show level select options
            this.createLevelSelectInterface();
        }
        
        // Create level select container
        this.levelSelectContainer = document.createElement('div');
        this.levelSelectContainer.style.cssText = `
            display: none;
            flex-direction: column;
            align-items: center;
            width: 100%;
            height: 100%;
            justify-content: center;
        `;
        
        // Create level select title
        const levelSelectTitle = document.createElement('h2');
        levelSelectTitle.textContent = 'SELECT PACMAN LEVEL';
        levelSelectTitle.style.cssText = `
            color: #ffff00;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 30px;
            text-shadow: 2px 2px 0px #ff00ff, 4px 4px 0px #000000;
            text-align: center;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-family: 'Courier New', monospace;
        `;
        
        // Create level grid container
        const levelGridContainer = document.createElement('div');
        levelGridContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-gap: 20px;
            align-items: center;
            justify-items: center;
            margin-bottom: 30px;
            max-width: 800px;
        `;
        
        // Create level boxes
        this.levelSelectButtons = [];
        this.availableLevels.forEach((level, index) => {
            const levelBox = this.createLevelBox(level, index);
            this.levelSelectButtons.push(levelBox);
            levelGridContainer.appendChild(levelBox);
        });
        
        // Create back button container
        const backButtonContainer = document.createElement('div');
        backButtonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            margin-top: 20px;
        `;
        
        // Create back button for level select
        const backButton = this.createButton('Back to Menu', () => this.hideLevelSelect(), this.availableLevels.length);
        backButton.style.minWidth = '200px';
        this.levelSelectButtons.push(backButton);
        backButtonContainer.appendChild(backButton);
        
        this.levelSelectContainer.appendChild(levelSelectTitle);
        this.levelSelectContainer.appendChild(levelGridContainer);
        this.levelSelectContainer.appendChild(backButtonContainer);
        
        // Create controls info
        const controlsInfo = document.createElement('div');
        controlsInfo.textContent = 'Use ↑↓←→ arrow keys to navigate, ENTER to select, ESC to go back';
        controlsInfo.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            color: #00ffff;
            font-size: 14px;
            text-align: center;
            font-family: 'Courier New', monospace;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        // Create version info
        const versionInfo = document.createElement('div');
        versionInfo.textContent = 'PACMAN MODE v1.0';
        versionInfo.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            color: #ffff00;
            font-size: 12px;
            font-family: 'Courier New', monospace;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        // Assemble menu
        this.menuElement.appendChild(title);
        this.menuElement.appendChild(subtitle);
        this.menuElement.appendChild(this.mainMenuContainer);
        this.menuElement.appendChild(this.levelSelectContainer);
        this.menuElement.appendChild(controlsInfo);
        this.menuElement.appendChild(versionInfo);
        
        document.body.appendChild(this.menuElement);
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        this.updateLevelInfo();
    }
    
    createLevelSelectInterface() {
        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            align-items: center;
            margin-bottom: 30px;
        `;
        
        // Level selection
        const levelContainer = document.createElement('div');
        levelContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 20px;
            color: #ffffff;
            font-size: 18px;
            font-family: 'Courier New', monospace;
        `;
        
        const levelLabel = document.createElement('span');
        levelLabel.textContent = 'SELECTED LEVEL:';
        levelLabel.style.cssText = `
            color: #00ffff;
            font-weight: bold;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        const levelDisplay = document.createElement('span');
        levelDisplay.id = 'pacmanLevelDisplay';
        levelDisplay.textContent = this.isClassicMode ? 'CLASSIC MODE - Endless Level 2' : this.availableLevels[0].name;
        levelDisplay.style.cssText = `
            color: #ffff00;
            font-weight: bold;
            text-shadow: 1px 1px 0px #000000;
            min-width: 300px;
            text-align: center;
            font-size: 16px;
        `;
        
        levelContainer.appendChild(levelLabel);
        levelContainer.appendChild(levelDisplay);
        
        // Difficulty selection
        const difficultyContainer = document.createElement('div');
        difficultyContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 20px;
            color: #ffffff;
            font-size: 18px;
            font-family: 'Courier New', monospace;
        `;
        
        const difficultyLabel = document.createElement('span');
        difficultyLabel.textContent = 'DIFFICULTY:';
        difficultyLabel.style.cssText = `
            color: #00ffff;
            font-weight: bold;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        const difficultyDisplay = document.createElement('span');
        difficultyDisplay.id = 'pacmanDifficultyDisplay';
        difficultyDisplay.textContent = 'NORMAL';
        difficultyDisplay.style.cssText = `
            color: #ffff00;
            font-weight: bold;
            text-shadow: 1px 1px 0px #000000;
            min-width: 80px;
            text-align: center;
        `;
        
        difficultyContainer.appendChild(difficultyLabel);
        difficultyContainer.appendChild(difficultyDisplay);
        
        optionsContainer.appendChild(levelContainer);
        optionsContainer.appendChild(difficultyContainer);
        
        // Create menu buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            align-items: center;
        `;
        
        // Create menu buttons
        const buttons = [
            { text: 'Level Select', action: () => this.showLevelSelect() },
            { text: 'Classic Mode', action: () => this.toggleClassicMode() },
            { text: 'Change Difficulty', action: () => this.changeDifficulty() },
            { text: 'Start Game', action: () => this.startGame() },
            { text: 'Back to Main Menu', action: () => this.backToMain() }
        ];
        
        this.menuButtons = [];
        buttons.forEach((button, index) => {
            const buttonElement = this.createButton(button.text, button.action, index);
            this.menuButtons.push(buttonElement);
            buttonsContainer.appendChild(buttonElement);
        });
        
        this.mainMenuContainer.appendChild(optionsContainer);
        this.mainMenuContainer.appendChild(buttonsContainer);
    }
    
    createButton(text, onClick, index) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: linear-gradient(135deg, #333300 0%, #666600 100%);
            border: 3px solid #ffff00;
            color: #ffffff;
            padding: 12px 30px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 0px;
            transition: all 0.2s ease;
            min-width: 220px;
            text-align: center;
            user-select: none;
            font-family: 'Courier New', monospace;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-shadow: 1px 1px 0px #000000;
            box-shadow: 3px 3px 0px #000000;
        `;
        
        button.addEventListener('mouseenter', () => {
            if (!this.isInLevelSelect) {
                this.currentOptionIndex = index;
                this.updateButtonSelection();
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
    
    createTinyButton(text, onClick, index) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: linear-gradient(135deg, #ff6600 0%, #ff9900 100%);
            border: 2px solid #ffff00;
            color: #ffffff;
            padding: 6px 12px;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 0px;
            transition: all 0.2s ease;
            min-width: 140px;
            text-align: center;
            user-select: none;
            font-family: 'Courier New', monospace;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-shadow: 1px 1px 0px #000000;
            box-shadow: 2px 2px 0px #000000;
            margin: 10px 0;
            opacity: 0.8;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
            button.style.transform = 'translateY(-1px)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.opacity = '0.8';
            button.style.transform = 'translateY(0)';
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
    
    createLevelBox(level, index) {
        const levelBox = document.createElement('div');
        const isUnlocked = this.isPacmanLevelUnlocked(level.id);
        const isCompleted = this.isPacmanLevelCompleted(level.id);
        
        levelBox.style.cssText = `
            background: ${isUnlocked ? 'linear-gradient(135deg, #333300 0%, #666600 100%)' : 'linear-gradient(135deg, #330000 0%, #660000 100%)'};
            border: 4px solid ${isUnlocked ? '#ffff00' : '#ff0000'};
            color: ${isUnlocked ? '#ffffff' : '#888888'};
            padding: 20px;
            width: 200px;
            height: 120px;
            cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            user-select: none;
            font-family: 'Courier New', monospace;
            text-shadow: 1px 1px 0px #000000;
            box-shadow: 5px 5px 0px #000000;
            position: relative;
            opacity: ${isUnlocked ? '1' : '0.5'};
        `;
        
        // Add completion checkmark
        if (isCompleted) {
            const checkmark = document.createElement('div');
            checkmark.textContent = '✓';
            checkmark.style.cssText = `
                position: absolute;
                top: 8px;
                right: 12px;
                font-size: 24px;
                font-weight: bold;
                color: #00ff00;
                text-shadow: 2px 2px 0px #000000;
                z-index: 1;
            `;
            levelBox.appendChild(checkmark);
        }
        
        // Level number display
        const levelNumber = document.createElement('div');
        levelNumber.textContent = isUnlocked ? level.id : '🔒';
        levelNumber.style.cssText = `
            font-size: 36px;
            font-weight: bold;
            color: ${isCompleted ? '#00ff00' : (isUnlocked ? '#ffff00' : '#ff0000')};
            margin-bottom: 10px;
            text-shadow: 2px 2px 0px #000000;
        `;
        
        // Level name display
        const levelName = document.createElement('div');
        levelName.textContent = isUnlocked ? level.name : 'LOCKED';
        levelName.style.cssText = `
            font-size: 12px;
            font-weight: bold;
            color: ${isCompleted ? '#00ff00' : (isUnlocked ? '#00ffff' : '#ff0000')};
            text-align: center;
            line-height: 1.2;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        
        // Apply completed styling
        if (isCompleted) {
            levelBox.style.background = 'linear-gradient(135deg, #004d00 0%, #00b300 100%)';
            levelBox.style.borderColor = '#00ff00';
            levelBox.style.boxShadow = '5px 5px 0px #000000, 0px 0px 10px #00ff00';
        }
        
        levelBox.appendChild(levelNumber);
        levelBox.appendChild(levelName);
        
        // Add restart button for completed levels
        if (isCompleted) {
            const restartButton = document.createElement('button');
            restartButton.textContent = 'RESTART';
            restartButton.style.cssText = `
                position: absolute;
                bottom: 8px;
                right: 8px;
                background: linear-gradient(135deg, #ff6600 0%, #ff9900 100%);
                border: 2px solid #ffff00;
                color: #ffffff;
                padding: 4px 8px;
                font-size: 10px;
                font-weight: bold;
                font-family: 'Courier New', monospace;
                border-radius: 4px;
                cursor: pointer;
                text-shadow: 1px 1px 0px #000000;
                transition: all 0.2s ease;
                z-index: 2;
            `;
            
            restartButton.addEventListener('mouseenter', () => {
                restartButton.style.background = 'linear-gradient(135deg, #ff0000 0%, #ff4444 100%)';
                restartButton.style.transform = 'scale(1.1)';
            });
            
            restartButton.addEventListener('mouseleave', () => {
                restartButton.style.background = 'linear-gradient(135deg, #ff6600 0%, #ff9900 100%)';
                restartButton.style.transform = 'scale(1)';
            });
            
            restartButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent level selection
                this.restartLevel(level.id);
            });
            
            levelBox.appendChild(restartButton);
        }
        
        if (isUnlocked) {
            // Hover effects
            levelBox.addEventListener('mouseenter', () => {
                if (this.isInLevelSelect) {
                    this.levelSelectIndex = index;
                    this.updateLevelSelectButtons();
                }
            });
            
            // Click handler
            levelBox.addEventListener('click', () => {
                this.selectLevel(level.id);
            });
        }
        
        return levelBox;
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
                case 'ArrowLeft':
                    event.preventDefault();
                    if (this.isInLevelSelect) {
                        this.navigateLeft();
                    }
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    if (this.isInLevelSelect) {
                        this.navigateRight();
                    }
                    break;
                case 'Enter':
                    event.preventDefault();
                    this.selectCurrentOption();
                    break;
                case 'Escape':
                    event.preventDefault();
                    if (this.isInLevelSelect) {
                        this.hideLevelSelect();
                    } else {
                        this.backToMain();
                    }
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyboardListener);
    }
    
    navigateUp() {
        if (this.isInLevelSelect) {
            const columnsPerRow = 3;
            const totalLevels = this.availableLevels.length;
            
            if (this.levelSelectIndex === totalLevels) {
                // From back button to last row
                const lastRowStart = Math.floor((totalLevels - 1) / columnsPerRow) * columnsPerRow;
                this.levelSelectIndex = lastRowStart + (this.levelSelectIndex % columnsPerRow);
                if (this.levelSelectIndex >= totalLevels) {
                    this.levelSelectIndex = totalLevels - 1;
                }
            } else {
                const currentRow = Math.floor(this.levelSelectIndex / columnsPerRow);
                const currentCol = this.levelSelectIndex % columnsPerRow;
                
                if (currentRow === 0) {
                    // From first row to back button
                    this.levelSelectIndex = totalLevels;
                } else {
                    // Move up one row
                    this.levelSelectIndex = (currentRow - 1) * columnsPerRow + currentCol;
                }
            }
            this.updateLevelSelectButtons();
        } else {
            this.currentOptionIndex = (this.currentOptionIndex - 1 + this.menuButtons.length) % this.menuButtons.length;
            this.updateButtonSelection();
        }
    }
    
    navigateDown() {
        if (this.isInLevelSelect) {
            const columnsPerRow = 3;
            const totalLevels = this.availableLevels.length;
            
            if (this.levelSelectIndex === totalLevels) {
                // From back button to first row
                this.levelSelectIndex = 0;
            } else {
                const currentRow = Math.floor(this.levelSelectIndex / columnsPerRow);
                const currentCol = this.levelSelectIndex % columnsPerRow;
                const maxRow = Math.floor((totalLevels - 1) / columnsPerRow);
                
                if (currentRow === maxRow) {
                    // From last row to back button
                    this.levelSelectIndex = totalLevels;
                } else {
                    // Move down one row
                    const newIndex = (currentRow + 1) * columnsPerRow + currentCol;
                    this.levelSelectIndex = Math.min(newIndex, totalLevels - 1);
                }
            }
            this.updateLevelSelectButtons();
        } else {
            this.currentOptionIndex = (this.currentOptionIndex + 1) % this.menuButtons.length;
            this.updateButtonSelection();
        }
    }
    
    navigateLeft() {
        if (this.isInLevelSelect) {
            const columnsPerRow = 3;
            const totalLevels = this.availableLevels.length;
            
            if (this.levelSelectIndex === totalLevels) {
                // On back button, do nothing
                return;
            }
            
            const currentRow = Math.floor(this.levelSelectIndex / columnsPerRow);
            const currentCol = this.levelSelectIndex % columnsPerRow;
            
            if (currentCol === 0) {
                // Move to last column of same row
                const lastColInRow = Math.min(currentRow * columnsPerRow + (columnsPerRow - 1), totalLevels - 1);
                this.levelSelectIndex = lastColInRow;
            } else {
                // Move one column left
                this.levelSelectIndex = this.levelSelectIndex - 1;
            }
            this.updateLevelSelectButtons();
        }
    }
    
    navigateRight() {
        if (this.isInLevelSelect) {
            const columnsPerRow = 3;
            const totalLevels = this.availableLevels.length;
            
            if (this.levelSelectIndex === totalLevels) {
                // On back button, do nothing
                return;
            }
            
            const currentRow = Math.floor(this.levelSelectIndex / columnsPerRow);
            const currentCol = this.levelSelectIndex % columnsPerRow;
            const maxColInRow = Math.min(currentRow * columnsPerRow + (columnsPerRow - 1), totalLevels - 1);
            
            if (this.levelSelectIndex === maxColInRow) {
                // Move to first column of same row
                this.levelSelectIndex = currentRow * columnsPerRow;
            } else {
                // Move one column right
                this.levelSelectIndex = this.levelSelectIndex + 1;
            }
            this.updateLevelSelectButtons();
        }
    }
    
    updateButtonSelection() {
        this.menuButtons.forEach((button, index) => {
            if (index === this.currentOptionIndex) {
                // Selected style
                button.style.background = 'linear-gradient(135deg, #ffff00 0%, #ff9900 100%)';
                button.style.borderColor = '#ff00ff';
                button.style.color = '#000000';
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '5px 5px 0px #000000';
            } else {
                // Unselected style
                button.style.background = 'linear-gradient(135deg, #333300 0%, #666600 100%)';
                button.style.borderColor = '#ffff00';
                button.style.color = '#ffffff';
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '3px 3px 0px #000000';
            }
        });
    }
    
    updateLevelSelectButtons() {
        this.levelSelectButtons.forEach((element, index) => {
            if (index === this.levelSelectIndex) {
                // Selected style for level boxes
                if (index < this.availableLevels.length) {
                    const level = this.availableLevels[index];
                    const isUnlocked = this.isPacmanLevelUnlocked(level.id);
                    const isCompleted = this.isPacmanLevelCompleted(level.id);
                    
                    if (isCompleted) {
                        element.style.background = 'linear-gradient(135deg, #00ff00 0%, #66ff66 100%)';
                        element.style.borderColor = '#ffffff';
                        element.style.transform = 'translateY(-3px) scale(1.05)';
                        element.style.boxShadow = '7px 7px 0px #000000, 0px 0px 15px #00ff00';
                    } else if (isUnlocked) {
                        element.style.background = 'linear-gradient(135deg, #ffff00 0%, #ff9900 100%)';
                        element.style.borderColor = '#ff00ff';
                        element.style.transform = 'translateY(-3px) scale(1.05)';
                        element.style.boxShadow = '7px 7px 0px #000000';
                    } else {
                        element.style.background = 'linear-gradient(135deg, #660000 0%, #990000 100%)';
                        element.style.borderColor = '#ff0000';
                        element.style.transform = 'translateY(-3px) scale(1.05)';
                        element.style.boxShadow = '7px 7px 0px #000000';
                    }
                } else {
                    // Back button selected style
                    element.style.background = 'linear-gradient(135deg, #ffff00 0%, #ff9900 100%)';
                    element.style.borderColor = '#ff00ff';
                    element.style.color = '#000000';
                    element.style.transform = 'translateY(-2px)';
                    element.style.boxShadow = '5px 5px 0px #000000';
                }
            } else {
                // Unselected style for level boxes
                if (index < this.availableLevels.length) {
                    const level = this.availableLevels[index];
                    const isUnlocked = this.isPacmanLevelUnlocked(level.id);
                    const isCompleted = this.isPacmanLevelCompleted(level.id);
                    
                    if (isCompleted) {
                        element.style.background = 'linear-gradient(135deg, #004d00 0%, #00b300 100%)';
                        element.style.borderColor = '#00ff00';
                        element.style.transform = 'translateY(0) scale(1)';
                        element.style.boxShadow = '5px 5px 0px #000000, 0px 0px 10px #00ff00';
                    } else if (isUnlocked) {
                        element.style.background = 'linear-gradient(135deg, #333300 0%, #666600 100%)';
                        element.style.borderColor = '#ffff00';
                        element.style.transform = 'translateY(0) scale(1)';
                        element.style.boxShadow = '5px 5px 0px #000000';
                    } else {
                        element.style.background = 'linear-gradient(135deg, #330000 0%, #660000 100%)';
                        element.style.borderColor = '#ff0000';
                        element.style.transform = 'translateY(0) scale(1)';
                        element.style.boxShadow = '5px 5px 0px #000000';
                    }
                } else {
                    // Back button unselected style
                    element.style.background = 'linear-gradient(135deg, #333300 0%, #666600 100%)';
                    element.style.borderColor = '#ffff00';
                    element.style.color = '#ffffff';
                    element.style.transform = 'translateY(0)';
                    element.style.boxShadow = '3px 3px 0px #000000';
                }
            }
        });
    }
    
    selectCurrentOption() {
        if (this.isInLevelSelect) {
            if (this.levelSelectIndex < this.availableLevels.length) {
                // Select a level
                const level = this.availableLevels[this.levelSelectIndex];
                if (this.isPacmanLevelUnlocked(level.id)) {
                    this.selectLevel(level.id);
                }
            } else {
                // Select back button
                this.hideLevelSelect();
            }
        } else {
            if (this.menuButtons[this.currentOptionIndex]) {
                this.menuButtons[this.currentOptionIndex].click();
            }
        }
    }
    
    showLevelSelect() {
        this.isInLevelSelect = true;
        this.mainMenuContainer.style.display = 'none';
        this.levelSelectContainer.style.display = 'flex';
        this.levelSelectIndex = 0;
        this.updateLevelSelectButtons();
    }
    
    hideLevelSelect() {
        this.isInLevelSelect = false;
        this.levelSelectContainer.style.display = 'none';
        this.mainMenuContainer.style.display = 'flex';
        this.updateButtonSelection();
    }
    
    selectLevel(levelId) {
        this.selectedLevel = levelId;
        this.updateLevelInfo();
        this.hideLevelSelect();
    }
    
    changeDifficulty() {
        const difficulties = ['easy', 'normal', 'hard'];
        const currentIndex = difficulties.indexOf(this.selectedDifficulty);
        this.selectedDifficulty = difficulties[(currentIndex + 1) % difficulties.length];
        this.updateDifficultyDisplay();
    }
    
    updateLevelInfo() {
        const levelDisplay = document.getElementById('pacmanLevelDisplay');
        
        if (levelDisplay) {
            const selectedLevelData = this.availableLevels.find(level => level.id === this.selectedLevel);
            levelDisplay.textContent = selectedLevelData ? selectedLevelData.name : this.availableLevels[0].name;
        }
    }
    
    updateDifficultyDisplay() {
        const difficultyDisplay = document.getElementById('pacmanDifficultyDisplay');
        if (difficultyDisplay) {
            const difficultyInfo = this.getDifficultyInfo(this.selectedDifficulty);
            difficultyDisplay.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap; justify-content: center;">
                    <span style="font-size: 18px; font-weight: bold;">${this.selectedDifficulty.toUpperCase()}</span>
                    <span style="color: #ffff00; font-size: 14px; background: rgba(255, 255, 0, 0.1); padding: 2px 6px; border-radius: 3px;">⚡ ${difficultyInfo.performance}</span>
                    <span style="color: #ff00ff; font-size: 12px; background: rgba(255, 0, 255, 0.1); padding: 2px 6px; border-radius: 3px;">${difficultyInfo.bestFor}</span>
                </div>
            `;
        }
    }

    getDifficultyInfo(difficulty) {
        const difficultyData = {
            'easy': {
                performance: '80% Performance',
                bestFor: '👻 Slower Ghosts • Classic Mode • Beginners'
            },
            'normal': {
                performance: '100% Performance', 
                bestFor: '⚡ Standard Speed • All Modes • Balanced Fun'
            },
            'hard': {
                performance: '120% Performance',
                bestFor: '💀 Fast Ghosts • Score Attacks • Veterans'
            }
        };
        
        return difficultyData[difficulty] || difficultyData['normal'];
    }
    
    toggleClassicMode() {
        this.isClassicMode = !this.isClassicMode;
        this.updateLevelDisplay();
        this.updateClassicModeButton();
    }
    
    updateLevelDisplay() {
        const levelDisplay = document.getElementById('pacmanLevelDisplay');
        if (levelDisplay) {
            if (this.isClassicMode) {
                levelDisplay.textContent = 'CLASSIC MODE - Endless Level 2';
                levelDisplay.style.color = '#ff00ff'; // Pink for classic mode
            } else {
                levelDisplay.textContent = this.availableLevels[this.selectedLevel - 1].name;
                levelDisplay.style.color = '#ffff00'; // Yellow for normal
            }
        }
    }
    
    updateClassicModeButton() {
        const buttons = this.menuButtons;
        if (buttons && buttons[1]) { // Classic Mode button is at index 1
            if (this.isClassicMode) {
                buttons[1].textContent = '✓ CLASSIC MODE ACTIVE';
                buttons[1].style.background = 'linear-gradient(135deg, #660066 0%, #990099 100%)';
                buttons[1].style.borderColor = '#ff00ff';
            } else {
                buttons[1].textContent = 'CLASSIC MODE';
                buttons[1].style.background = 'linear-gradient(135deg, #333300 0%, #666600 100%)';
                buttons[1].style.borderColor = '#ffff00';
            }
        }
    }

    startGame() {
        this.hide();
        if (this.onStartGame) {
            if (this.isClassicMode) {
                this.onStartGame('pacman_classic', 2, this.selectedDifficulty); // Always use level 2 for classic mode
            } else {
                this.onStartGame('pacman', this.selectedLevel, this.selectedDifficulty);
            }
        }
    }
    
    // Restart a specific level by clearing its progress
    restartLevel(levelId) {
        console.log(`Restarting pacman level ${levelId}...`);
        
        // Clear per-level progress for this specific level
        try {
            const progressKey = `levelProgress_pacman_${levelId}`;
            localStorage.removeItem(progressKey);
            console.log(`Cleared progress for pacman level ${levelId}`);
        } catch (error) {
            console.error('Error clearing level progress:', error);
        }
        
        // Clear main game state if it exists
        try {
            localStorage.removeItem('gameState');
            console.log('Cleared main game state');
        } catch (error) {
            console.error('Error clearing game state:', error);
        }
        
        // Start the level fresh
        this.hide();
        if (this.onStartGame) {
            this.onStartGame('pacman', levelId, this.selectedDifficulty);
        }
    }
    
    backToMain() {
        this.hide();
        if (this.onBackToMain) {
            this.onBackToMain();
        }
    }
    
    show() {
        if (this.menuElement) {
            this.menuElement.style.display = 'flex';
            this.isVisible = true;
            this.currentOptionIndex = 2; // Start on "Start Game" button
            this.isInLevelSelect = false;
            this.hideLevelSelect();
            this.updateButtonSelection();
        }
    }
    
    hide() {
        if (this.menuElement) {
            this.menuElement.style.display = 'none';
            this.isVisible = false;
            this.isInLevelSelect = false;
        }
    }
    
    destroy() {
        if (this.keyboardListener) {
            document.removeEventListener('keydown', this.keyboardListener);
        }
        if (this.menuElement) {
            document.body.removeChild(this.menuElement);
        }
    }
} 