export class SinglePlayerMenu {
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
        
        // Available levels with their details
        this.availableLevels = [
            { id: 1, name: "Level 1 - Coin and Key Intro", file: "level1.json" },
            { id: 2, name: "Level 2 - Bounce Pad Challenges", file: "level2.json" },
            { id: 3, name: "Level 3 - Deadly Spike Maze", file: "level3.json" },
            { id: 4, name: "Level 4 - Portal Maze: Teleportation Challenge", file: "level4.json" },
            { id: 5, name: "Level 5 - Spike Parkour Challenge", file: "level5.json" },
            { id: 6, name: "Level 6 - Tower Climb", file: "level6.json" }
        ];
        
        this.createMenu();
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

    // Check if a level is completed
    isLevelCompleted(levelId) {
        const progress = this.getProgress();
        return progress.completedLevels.includes(levelId);
    }
    
    createMenu() {
        // Create menu container
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'singlePlayerMenu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: 'Courier New', monospace;
        `;
        
        // Create title
        const title = document.createElement('h1');
        title.textContent = 'SINGLE PLAYER';
        title.style.cssText = `
            color: #00ffff;
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
        subtitle.textContent = 'PS2 THEMED ADVENTURE';
        subtitle.style.cssText = `
            color: #ffff00;
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
        levelDisplay.id = 'levelDisplay';
        levelDisplay.textContent = this.availableLevels[0].name;
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
        difficultyDisplay.id = 'difficultyDisplay';
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
        levelSelectTitle.textContent = 'SELECT LEVEL';
        levelSelectTitle.style.cssText = `
            color: #00ffff;
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
        versionInfo.textContent = 'PS2 SINGLE PLAYER v1.0';
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
    
    createButton(text, onClick, index) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: linear-gradient(135deg, #003366 0%, #0066cc 100%);
            border: 3px solid #00ffff;
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
        
        button.addEventListener('click', onClick);
        
        return button;
    }
    
    createLevelBox(level, index) {
        const levelBox = document.createElement('div');
        const isCompleted = this.isLevelCompleted(level.id);
        
        levelBox.style.cssText = `
            background: linear-gradient(135deg, #003366 0%, #0066cc 100%);
            border: 4px solid #00ffff;
            color: #ffffff;
            padding: 20px;
            width: 200px;
            height: 120px;
            cursor: pointer;
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
        levelNumber.textContent = level.id;
        levelNumber.style.cssText = `
            font-size: 36px;
            font-weight: bold;
            color: ${isCompleted ? '#00ff00' : '#ffff00'};
            margin-bottom: 10px;
            text-shadow: 2px 2px 0px #000000;
        `;
        
        // Level name display
        const levelName = document.createElement('div');
        levelName.textContent = level.name;
        levelName.style.cssText = `
            font-size: 12px;
            font-weight: bold;
            color: ${isCompleted ? '#00ff00' : '#00ffff'};
            text-align: center;
            line-height: 1.2;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        
        // Special styling for Pacman level
        if (level.file === 'pacman.json') {
            levelBox.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)';
            levelBox.style.borderColor = '#ffff00';
            levelNumber.style.color = '#ffff00';
            levelName.style.color = '#ff00ff';
        }
        
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
                button.style.background = 'linear-gradient(135deg, #ff6600 0%, #ff9900 100%)';
                button.style.borderColor = '#ffff00';
                button.style.color = '#000000';
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '5px 5px 0px #000000';
            } else {
                // Unselected style
                button.style.background = 'linear-gradient(135deg, #003366 0%, #0066cc 100%)';
                button.style.borderColor = '#00ffff';
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
                    const isCompleted = this.isLevelCompleted(level.id);
                    
                    if (level.file === 'pacman.json') {
                        element.style.background = 'linear-gradient(135deg, #ffff00 0%, #ff9900 100%)';
                        element.style.borderColor = '#ff00ff';
                        element.style.transform = 'translateY(-3px) scale(1.05)';
                        element.style.boxShadow = '7px 7px 0px #000000';
                    } else if (isCompleted) {
                        element.style.background = 'linear-gradient(135deg, #00ff00 0%, #66ff66 100%)';
                        element.style.borderColor = '#ffffff';
                        element.style.transform = 'translateY(-3px) scale(1.05)';
                        element.style.boxShadow = '7px 7px 0px #000000, 0px 0px 15px #00ff00';
                    } else {
                        element.style.background = 'linear-gradient(135deg, #ff6600 0%, #ff9900 100%)';
                        element.style.borderColor = '#ffff00';
                        element.style.transform = 'translateY(-3px) scale(1.05)';
                        element.style.boxShadow = '7px 7px 0px #000000';
                    }
                } else {
                    // Back button selected style
                    element.style.background = 'linear-gradient(135deg, #ff6600 0%, #ff9900 100%)';
                    element.style.borderColor = '#ffff00';
                    element.style.color = '#000000';
                    element.style.transform = 'translateY(-2px)';
                    element.style.boxShadow = '5px 5px 0px #000000';
                }
            } else {
                // Unselected style for level boxes
                if (index < this.availableLevels.length) {
                    const level = this.availableLevels[index];
                    const isCompleted = this.isLevelCompleted(level.id);
                    
                    if (level.file === 'pacman.json') {
                        element.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)';
                        element.style.borderColor = '#ffff00';
                        element.style.transform = 'translateY(0) scale(1)';
                        element.style.boxShadow = '5px 5px 0px #000000';
                    } else if (isCompleted) {
                        element.style.background = 'linear-gradient(135deg, #004d00 0%, #00b300 100%)';
                        element.style.borderColor = '#00ff00';
                        element.style.transform = 'translateY(0) scale(1)';
                        element.style.boxShadow = '5px 5px 0px #000000, 0px 0px 10px #00ff00';
                    } else {
                        element.style.background = 'linear-gradient(135deg, #003366 0%, #0066cc 100%)';
                        element.style.borderColor = '#00ffff';
                        element.style.transform = 'translateY(0) scale(1)';
                        element.style.boxShadow = '5px 5px 0px #000000';
                    }
                } else {
                    // Back button unselected style
                    element.style.background = 'linear-gradient(135deg, #003366 0%, #0066cc 100%)';
                    element.style.borderColor = '#00ffff';
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
                this.selectLevel(this.availableLevels[this.levelSelectIndex].id);
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
        
        // Refresh the level boxes to show updated completion status
        this.refreshLevelBoxes();
        this.updateLevelSelectButtons();
    }

    // Refresh level boxes to show updated completion status
    refreshLevelBoxes() {
        // Clear existing level boxes
        const levelGridContainer = this.levelSelectContainer.querySelector('div:nth-child(2)');
        if (levelGridContainer) {
            // Remove all level boxes but keep the grid container
            while (levelGridContainer.firstChild) {
                levelGridContainer.removeChild(levelGridContainer.firstChild);
            }
            
            // Recreate level boxes with updated completion status
            this.levelSelectButtons = [];
            this.availableLevels.forEach((level, index) => {
                const levelBox = this.createLevelBox(level, index);
                this.levelSelectButtons.push(levelBox);
                levelGridContainer.appendChild(levelBox);
            });
        }
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
        const levelDisplay = document.getElementById('levelDisplay');
        
        if (levelDisplay) {
            const selectedLevelData = this.availableLevels.find(level => level.id === this.selectedLevel);
            levelDisplay.textContent = selectedLevelData ? selectedLevelData.name : this.availableLevels[0].name;
        }
    }
    
    updateDifficultyDisplay() {
        const difficultyDisplay = document.getElementById('difficultyDisplay');
        if (difficultyDisplay) {
            difficultyDisplay.textContent = this.selectedDifficulty.toUpperCase();
        }
    }
    
    startGame() {
        this.hide();
        if (this.onStartGame) {
            this.onStartGame('normal', this.selectedLevel, this.selectedDifficulty);
        }
    }
    
    // Restart a specific level by clearing its progress
    restartLevel(levelId) {
        console.log(`Restarting level ${levelId}...`);
        
        // Clear per-level progress for this specific level
        try {
            const progressKey = `levelProgress_normal_${levelId}`;
            localStorage.removeItem(progressKey);
            console.log(`Cleared progress for level ${levelId}`);
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
            this.onStartGame('normal', levelId, this.selectedDifficulty);
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