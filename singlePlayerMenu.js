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
        
        this.createMenu();
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
        levelLabel.textContent = 'LEVEL:';
        levelLabel.style.cssText = `
            color: #00ffff;
            font-weight: bold;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        const levelDisplay = document.createElement('span');
        levelDisplay.id = 'levelDisplay';
        levelDisplay.textContent = '1';
        levelDisplay.style.cssText = `
            color: #ffff00;
            font-weight: bold;
            text-shadow: 1px 1px 0px #000000;
            min-width: 30px;
            text-align: center;
        `;
        
        const levelInfo = document.createElement('div');
        levelInfo.id = 'levelInfo';
        levelInfo.textContent = '(Classic PS2 Blue)';
        levelInfo.style.cssText = `
            color: #ff00ff;
            font-size: 14px;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        levelContainer.appendChild(levelLabel);
        levelContainer.appendChild(levelDisplay);
        levelContainer.appendChild(levelInfo);
        
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
            { text: 'Previous Level', action: () => this.previousLevel() },
            { text: 'Next Level', action: () => this.nextLevel() },
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
        
        // Create controls info
        const controlsInfo = document.createElement('div');
        controlsInfo.textContent = 'Use ↑↓ arrow keys to navigate, ENTER to select, ←→ to change values';
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
        this.menuElement.appendChild(optionsContainer);
        this.menuElement.appendChild(buttonsContainer);
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
            this.currentOptionIndex = index;
            this.updateButtonSelection();
        });
        
        button.addEventListener('click', onClick);
        
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
                case 'ArrowLeft':
                    event.preventDefault();
                    this.handleLeftAction();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    this.handleRightAction();
                    break;
                case 'Enter':
                    event.preventDefault();
                    this.selectCurrentOption();
                    break;
                case 'Escape':
                    event.preventDefault();
                    this.backToMain();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyboardListener);
    }
    
    navigateUp() {
        this.currentOptionIndex = (this.currentOptionIndex - 1 + this.menuButtons.length) % this.menuButtons.length;
        this.updateButtonSelection();
    }
    
    navigateDown() {
        this.currentOptionIndex = (this.currentOptionIndex + 1) % this.menuButtons.length;
        this.updateButtonSelection();
    }
    
    handleLeftAction() {
        // Handle left arrow for changing values
        if (this.currentOptionIndex === 0) { // Previous Level button
            this.previousLevel();
        } else if (this.currentOptionIndex === 2) { // Change Difficulty button
            this.changeDifficulty();
        }
    }
    
    handleRightAction() {
        // Handle right arrow for changing values
        if (this.currentOptionIndex === 1) { // Next Level button
            this.nextLevel();
        } else if (this.currentOptionIndex === 2) { // Change Difficulty button
            this.changeDifficulty();
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
    
    selectCurrentOption() {
        if (this.menuButtons[this.currentOptionIndex]) {
            this.menuButtons[this.currentOptionIndex].click();
        }
    }
    
    previousLevel() {
        this.selectedLevel = Math.max(1, this.selectedLevel - 1);
        this.updateLevelInfo();
    }
    
    nextLevel() {
        this.selectedLevel = Math.min(10, this.selectedLevel + 1);
        this.updateLevelInfo();
    }
    
    changeDifficulty() {
        const difficulties = ['easy', 'normal', 'hard'];
        const currentIndex = difficulties.indexOf(this.selectedDifficulty);
        this.selectedDifficulty = difficulties[(currentIndex + 1) % difficulties.length];
        this.updateDifficultyDisplay();
    }
    
    updateLevelInfo() {
        const levelDisplay = document.getElementById('levelDisplay');
        const levelInfo = document.getElementById('levelInfo');
        
        if (levelDisplay) {
            levelDisplay.textContent = this.selectedLevel.toString();
        }
        
        if (levelInfo) {
            const levelThemes = {
                1: '(Classic PS2 Blue)',
                2: '(PS2 Purple/Magenta)',
                3: '(PS2 Green)',
                4: '(PS2 Orange/Red)',
                5: '(PS2 Cyan)',
                6: '(PS2 Yellow/Gold)',
                7: '(PS2 Pink)',
                8: '(PS2 Deep Blue)',
                9: '(PS2 Deep Purple)',
                10: '(PS2 Rainbow/Final)'
            };
            
            levelInfo.textContent = levelThemes[this.selectedLevel] || '(PS2 Theme)';
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
            this.currentOptionIndex = 3; // Start on "Start Game" button
            this.updateButtonSelection();
        }
    }
    
    hide() {
        if (this.menuElement) {
            this.menuElement.style.display = 'none';
            this.isVisible = false;
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