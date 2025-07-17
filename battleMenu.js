export class BattleMenu {
    constructor(onStartBattle, onBackToMain) {
        this.onStartBattle = onStartBattle;
        this.onBackToMain = onBackToMain;
        this.menuElement = null;
        this.isVisible = false;
        this.currentOptionIndex = 0;
        this.menuButtons = [];
        this.keyboardListener = null;
        this.selectedDifficulty = 'normal';
        this.isInLevelSelect = false;
        this.levelSelectIndex = 0;
        this.levelSelectButtons = [];
        
        // Available difficulties
        this.difficulties = [
            { 
                id: 'easy', 
                name: 'Easy', 
                description: 'Recommended for beginners\n• Slower bot AI\n• Less damage taken\n• Longer attack cooldowns',
                color: '#00ff00',
                multiplier: 0.7
            },
            { 
                id: 'normal', 
                name: 'Normal', 
                description: 'Standard battle experience\n• Balanced AI and damage\n• Default settings\n• Good for most players',
                color: '#ffff00',
                multiplier: 1.0
            },
            { 
                id: 'hard', 
                name: 'Hard', 
                description: 'For experienced fighters\n• Faster bot AI\n• Increased damage\n• Shorter attack cooldowns',
                color: '#ff8800',
                multiplier: 1.3
            },
            { 
                id: 'nightmare', 
                name: 'Nightmare', 
                description: 'Ultimate challenge\n• Extremely aggressive AI\n• Maximum damage\n• Instant attacks',
                color: '#ff0000',
                multiplier: 1.6
            }
        ];
        
        // Level preview data
        this.levelPreviews = [
            { 
                level: 1, 
                name: 'Candy Plains', 
                theme: 'candy',
                description: 'Sweet introduction to battle',
                opponents: 1,
                hazards: 'Bounce Pads',
                unlocked: true
            },
            { 
                level: 2, 
                name: 'Forest Brawl', 
                theme: 'forest',
                description: 'Fight among the trees',
                opponents: 1,
                hazards: 'Moving Platforms',
                unlocked: false
            },
            { 
                level: 3, 
                name: 'Volcano Clash', 
                theme: 'volcano',
                description: 'Battle in the heat',
                opponents: 2,
                hazards: 'Lava Spurts',
                unlocked: false
            },
            { 
                level: 4, 
                name: 'Frostbite Field', 
                theme: 'ice',
                description: 'Slippery combat zone',
                opponents: 2,
                hazards: 'Ice Spikes',
                unlocked: false
            },
            { 
                level: 5, 
                name: 'Retro Grid', 
                theme: 'cyber',
                description: 'Neon-lit arena',
                opponents: 2,
                hazards: 'Energy Beams',
                unlocked: false
            },
            { 
                level: 6, 
                name: 'Storm Zone', 
                theme: 'storm',
                description: 'Lightning-filled battlefield',
                opponents: 3,
                hazards: 'Lightning Strikes',
                unlocked: false
            },
            { 
                level: 7, 
                name: 'Final Smash', 
                theme: 'space',
                description: 'Ultimate showdown',
                opponents: 3,
                hazards: 'Void Zones',
                unlocked: false
            }
        ];
        
        this.createMenu();
    }
    
    createMenu() {
        // Create main menu container
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'battle-menu';
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
            overflow-y: auto;
            padding: 20px;
        `;
        
        // Create title
        const title = document.createElement('h1');
        title.textContent = 'BATTLE MODE';
        title.style.cssText = `
            color: #ffd700;
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
            text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
            letter-spacing: 3px;
        `;
        
        // Create subtitle
        const subtitle = document.createElement('div');
        subtitle.textContent = '7-Level Smash Bros Campaign';
        subtitle.style.cssText = `
            color: #ffffff;
            font-size: 18px;
            text-align: center;
            margin-bottom: 30px;
            opacity: 0.9;
        `;
        
        // Create main menu buttons
        this.createMainMenuButtons();
        
        // Create level select screen
        this.createLevelSelectScreen();
        
        // Append elements
        this.menuElement.appendChild(title);
        this.menuElement.appendChild(subtitle);
        this.menuElement.appendChild(this.mainMenuContainer);
        this.menuElement.appendChild(this.levelSelectContainer);
        
        document.body.appendChild(this.menuElement);
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        console.log('Battle Menu created');
    }
    
    createMainMenuButtons() {
        this.mainMenuContainer = document.createElement('div');
        this.mainMenuContainer.id = 'battle-main-menu';
        this.mainMenuContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            max-width: 600px;
            width: 100%;
        `;
        
        // Create menu options
        const menuOptions = [
            { text: 'Start Campaign', action: () => this.startCampaign() },
            { text: 'Level Select', action: () => this.showLevelSelect() },
            { text: 'Settings', action: () => this.showSettings() },
            { text: 'Back to Main Menu', action: () => this.backToMain() }
        ];
        
        menuOptions.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option.text;
            button.style.cssText = `
                background: linear-gradient(45deg, #333366, #444477);
                color: #ffffff;
                border: 2px solid #666699;
                padding: 15px 40px;
                font-size: 18px;
                font-weight: bold;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 250px;
                text-align: center;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            `;
            
            button.addEventListener('click', option.action);
            button.addEventListener('mouseenter', () => {
                this.currentOptionIndex = index;
                this.updateButtonSelection();
            });
            
            this.mainMenuContainer.appendChild(button);
            this.menuButtons.push(button);
        });
        
        // Create difficulty selector
        this.createDifficultySelector();
    }
    
    createDifficultySelector() {
        const difficultyContainer = document.createElement('div');
        difficultyContainer.style.cssText = `
            margin-top: 30px;
            padding: 20px;
            border: 2px solid #666699;
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 500px;
        `;
        
        const difficultyLabel = document.createElement('div');
        difficultyLabel.textContent = 'Select Difficulty:';
        difficultyLabel.style.cssText = `
            color: #ffd700;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
        `;
        
        const difficultyButtons = document.createElement('div');
        difficultyButtons.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            margin-bottom: 15px;
        `;
        
        this.difficulties.forEach(difficulty => {
            const button = document.createElement('button');
            button.textContent = difficulty.name;
            button.style.cssText = `
                background: linear-gradient(45deg, #333366, #444477);
                color: ${difficulty.color};
                border: 2px solid ${difficulty.color};
                padding: 10px 20px;
                font-size: 14px;
                font-weight: bold;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 80px;
                opacity: ${this.selectedDifficulty === difficulty.id ? 1 : 0.7};
            `;
            
            button.addEventListener('click', () => {
                this.selectedDifficulty = difficulty.id;
                this.updateDifficultySelection();
            });
            
            difficultyButtons.appendChild(button);
        });
        
        const difficultyDescription = document.createElement('div');
        difficultyDescription.id = 'difficulty-description';
        difficultyDescription.style.cssText = `
            color: #ffffff;
            font-size: 14px;
            line-height: 1.4;
            text-align: center;
            min-height: 60px;
            white-space: pre-line;
        `;
        
        difficultyContainer.appendChild(difficultyLabel);
        difficultyContainer.appendChild(difficultyButtons);
        difficultyContainer.appendChild(difficultyDescription);
        
        this.mainMenuContainer.appendChild(difficultyContainer);
        this.difficultyContainer = difficultyContainer;
        this.difficultyButtons = difficultyButtons;
        this.difficultyDescription = difficultyDescription;
        
        // Update initial selection
        this.updateDifficultySelection();
    }
    
    createLevelSelectScreen() {
        this.levelSelectContainer = document.createElement('div');
        this.levelSelectContainer.id = 'battle-level-select';
        this.levelSelectContainer.style.cssText = `
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            max-width: 800px;
            width: 100%;
        `;
        
        const levelSelectTitle = document.createElement('h2');
        levelSelectTitle.textContent = 'SELECT LEVEL';
        levelSelectTitle.style.cssText = `
            color: #ffd700;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;
        
        const levelGrid = document.createElement('div');
        levelGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            width: 100%;
            margin-bottom: 20px;
        `;
        
        // Create level cards
        this.levelPreviews.forEach((level, index) => {
            const levelCard = document.createElement('div');
            levelCard.style.cssText = `
                background: linear-gradient(135deg, #2a2a3e 0%, #3e3e5e 100%);
                border: 2px solid ${level.unlocked ? '#00ff00' : '#666666'};
                border-radius: 10px;
                padding: 20px;
                cursor: ${level.unlocked ? 'pointer' : 'default'};
                transition: all 0.3s ease;
                opacity: ${level.unlocked ? 1 : 0.5};
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            `;
            
            const levelNumber = document.createElement('div');
            levelNumber.textContent = `Level ${level.level}`;
            levelNumber.style.cssText = `
                color: #ffd700;
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 8px;
            `;
            
            const levelName = document.createElement('div');
            levelName.textContent = level.name;
            levelName.style.cssText = `
                color: #ffffff;
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 10px;
            `;
            
            const levelDescription = document.createElement('div');
            levelDescription.textContent = level.description;
            levelDescription.style.cssText = `
                color: #cccccc;
                font-size: 14px;
                margin-bottom: 15px;
                line-height: 1.3;
            `;
            
            const levelStats = document.createElement('div');
            levelStats.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="color: #ffff00;">Opponents:</span>
                    <span style="color: #ffffff;">${level.opponents}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #ffff00;">Hazards:</span>
                    <span style="color: #ffffff;">${level.hazards}</span>
                </div>
            `;
            levelStats.style.cssText = `
                font-size: 12px;
                line-height: 1.4;
            `;
            
            levelCard.appendChild(levelNumber);
            levelCard.appendChild(levelName);
            levelCard.appendChild(levelDescription);
            levelCard.appendChild(levelStats);
            
            if (level.unlocked) {
                levelCard.addEventListener('click', () => this.startLevel(level.level));
                levelCard.addEventListener('mouseenter', () => {
                    levelCard.style.borderColor = '#00ffff';
                    levelCard.style.transform = 'scale(1.02)';
                });
                levelCard.addEventListener('mouseleave', () => {
                    levelCard.style.borderColor = '#00ff00';
                    levelCard.style.transform = 'scale(1)';
                });
            }
            
            levelGrid.appendChild(levelCard);
            this.levelSelectButtons.push(levelCard);
        });
        
        const backButton = document.createElement('button');
        backButton.textContent = 'Back to Main Menu';
        backButton.style.cssText = `
            background: linear-gradient(45deg, #666666, #444444);
            color: #ffffff;
            border: 2px solid #888888;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        
        backButton.addEventListener('click', () => this.hideLevelSelect());
        
        this.levelSelectContainer.appendChild(levelSelectTitle);
        this.levelSelectContainer.appendChild(levelGrid);
        this.levelSelectContainer.appendChild(backButton);
    }
    
    setupKeyboardNavigation() {
        this.keyboardListener = (event) => {
            if (!this.isVisible) return;
            
            switch(event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    if (!this.isInLevelSelect) {
                        this.currentOptionIndex = Math.max(0, this.currentOptionIndex - 1);
                        this.updateButtonSelection();
                    }
                    break;
                    
                case 'ArrowDown':
                    event.preventDefault();
                    if (!this.isInLevelSelect) {
                        this.currentOptionIndex = Math.min(this.menuButtons.length - 1, this.currentOptionIndex + 1);
                        this.updateButtonSelection();
                    }
                    break;
                    
                case 'Enter':
                    event.preventDefault();
                    if (!this.isInLevelSelect) {
                        this.menuButtons[this.currentOptionIndex].click();
                    }
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
    
    updateButtonSelection() {
        this.menuButtons.forEach((button, index) => {
            if (index === this.currentOptionIndex) {
                button.style.background = 'linear-gradient(45deg, #4466aa, #5577bb)';
                button.style.borderColor = '#66aaff';
                button.style.transform = 'scale(1.05)';
            } else {
                button.style.background = 'linear-gradient(45deg, #333366, #444477)';
                button.style.borderColor = '#666699';
                button.style.transform = 'scale(1)';
            }
        });
    }
    
    updateDifficultySelection() {
        const selectedDifficulty = this.difficulties.find(d => d.id === this.selectedDifficulty);
        
        // Update button appearances
        Array.from(this.difficultyButtons.children).forEach((button, index) => {
            const difficulty = this.difficulties[index];
            if (difficulty.id === this.selectedDifficulty) {
                button.style.opacity = '1';
                button.style.background = `linear-gradient(45deg, ${difficulty.color}33, ${difficulty.color}55)`;
                button.style.transform = 'scale(1.05)';
            } else {
                button.style.opacity = '0.7';
                button.style.background = 'linear-gradient(45deg, #333366, #444477)';
                button.style.transform = 'scale(1)';
            }
        });
        
        // Update description
        this.difficultyDescription.textContent = selectedDifficulty.description;
    }
    
    startCampaign() {
        console.log(`Starting Battle Mode campaign on ${this.selectedDifficulty} difficulty`);
        if (this.onStartBattle) {
            this.onStartBattle('campaign', 1, this.selectedDifficulty);
        }
    }
    
    startLevel(levelNumber) {
        console.log(`Starting Battle Mode level ${levelNumber} on ${this.selectedDifficulty} difficulty`);
        if (this.onStartBattle) {
            this.onStartBattle('level', levelNumber, this.selectedDifficulty);
        }
    }
    
    showLevelSelect() {
        this.isInLevelSelect = true;
        this.mainMenuContainer.style.display = 'none';
        this.levelSelectContainer.style.display = 'flex';
        this.updateLevelUnlocks();
    }
    
    hideLevelSelect() {
        this.isInLevelSelect = false;
        this.levelSelectContainer.style.display = 'none';
        this.mainMenuContainer.style.display = 'flex';
        this.currentOptionIndex = 1; // Level Select button
        this.updateButtonSelection();
    }
    
    showSettings() {
        // Placeholder for settings screen
        console.log('Battle Mode settings not implemented yet');
    }
    
    backToMain() {
        this.hide();
        if (this.onBackToMain) {
            this.onBackToMain();
        }
    }
    
    updateLevelUnlocks() {
        // Check localStorage for completed levels
        const completedLevels = this.getCompletedLevels();
        
        this.levelPreviews.forEach((level, index) => {
            const wasUnlocked = level.unlocked;
            level.unlocked = index === 0 || completedLevels.includes(index);
            
            // Update card appearance if unlock status changed
            if (wasUnlocked !== level.unlocked) {
                const card = this.levelSelectButtons[index];
                card.style.borderColor = level.unlocked ? '#00ff00' : '#666666';
                card.style.opacity = level.unlocked ? '1' : '0.5';
                card.style.cursor = level.unlocked ? 'pointer' : 'default';
            }
        });
    }
    
    getCompletedLevels() {
        try {
            const completed = localStorage.getItem('battle_mode_completed_levels');
            return completed ? JSON.parse(completed) : [];
        } catch (error) {
            console.error('Error loading completed levels:', error);
            return [];
        }
    }
    
    markLevelCompleted(levelNumber) {
        try {
            const completedLevels = this.getCompletedLevels();
            if (!completedLevels.includes(levelNumber)) {
                completedLevels.push(levelNumber);
                localStorage.setItem('battle_mode_completed_levels', JSON.stringify(completedLevels));
            }
            this.updateLevelUnlocks();
        } catch (error) {
            console.error('Error saving completed level:', error);
        }
    }
    
    show() {
        this.isVisible = true;
        this.menuElement.style.display = 'flex';
        this.hideLevelSelect();
        this.currentOptionIndex = 0;
        this.updateButtonSelection();
        this.updateLevelUnlocks();
        console.log('Battle Menu shown');
    }
    
    hide() {
        this.isVisible = false;
        this.menuElement.style.display = 'none';
        console.log('Battle Menu hidden');
    }
    
    cleanup() {
        if (this.keyboardListener) {
            document.removeEventListener('keydown', this.keyboardListener);
        }
        
        if (this.menuElement) {
            this.menuElement.remove();
        }
    }
} 