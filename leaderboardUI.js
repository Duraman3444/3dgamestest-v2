export class LeaderboardUI {
    constructor(leaderboardManager) {
        this.leaderboardManager = leaderboardManager;
        this.uiElement = null;
        this.currentCategory = 'fullRun';
        this.currentLevel = 1;
        this.isVisible = false;
        this.onClose = null;
        
        // Cursor navigation properties
        this.currentOptionIndex = 0;
        this.actionButtons = [];
        this.categoryButtons = [];
        this.keyboardListener = null;
        
        // Action callbacks
        this.onStartNextLevel = null;
        this.onRestartLevel = null;
        this.onReturnToMenu = null;
        
        this.categoryDisplayNames = {
            fullRun: 'Full Run (Levels 1-6)',
            classicMode: 'Classic Mode',
            individualLevels: 'Individual Levels',
            battleTournament: 'Battle Tournament'
        };
        
        console.log('🏆 Leaderboard UI initialized');
    }
    
    // Show leaderboard UI with action callbacks
    show(category = 'fullRun', callbacks = {}) {
        if (this.isVisible) {
            this.hide();
        }
        
        this.currentCategory = category;
        this.onClose = callbacks.onClose || null;
        this.onStartNextLevel = callbacks.onStartNextLevel || null;
        this.onRestartLevel = callbacks.onRestartLevel || null;
        this.onReturnToMenu = callbacks.onReturnToMenu || null;
        
        this.createUI();
        this.isVisible = true;
        this.currentOptionIndex = 0;
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        this.updateSelection();
        
        console.log(`🏆 Leaderboard UI shown for category: ${category}`);
    }
    
    // Hide leaderboard UI
    hide() {
        if (this.uiElement) {
            document.body.removeChild(this.uiElement);
            this.uiElement = null;
        }
        
        this.isVisible = false;
        
        // Remove keyboard event listeners
        if (this.keyboardListener) {
            document.removeEventListener('keydown', this.keyboardListener);
            this.keyboardListener = null;
        }
        
        // Reset navigation state
        this.currentOptionIndex = 0;
        this.actionButtons = [];
        this.categoryButtons = [];
        
        if (this.onClose) {
            this.onClose();
        }
        
        console.log('🏆 Leaderboard UI hidden');
    }
    
    // Setup keyboard navigation
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
                    this.navigateLeft();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    this.navigateRight();
                    break;
                case 'Enter':
                    event.preventDefault();
                    this.selectCurrentOption();
                    break;
                case 'Escape':
                    event.preventDefault();
                    this.hide();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyboardListener);
    }
    
    // Navigation methods
    navigateUp() {
        if (this.getCurrentNavigationArea() === 'actions') {
            // If in action buttons, go to categories
            this.currentOptionIndex = this.categoryButtons.length - 1;
        } else {
            // Navigate within current area
            const totalOptions = this.getTotalNavigationOptions();
            this.currentOptionIndex = (this.currentOptionIndex - 1 + totalOptions) % totalOptions;
        }
        this.updateSelection();
    }
    
    navigateDown() {
        if (this.getCurrentNavigationArea() === 'categories') {
            // If in categories, go to action buttons
            this.currentOptionIndex = this.categoryButtons.length;
        } else {
            // Navigate within current area
            const totalOptions = this.getTotalNavigationOptions();
            this.currentOptionIndex = (this.currentOptionIndex + 1) % totalOptions;
        }
        this.updateSelection();
    }
    
    navigateLeft() {
        if (this.getCurrentNavigationArea() === 'categories') {
            // Navigate within categories horizontally
            const categoryCount = this.categoryButtons.length;
            this.currentOptionIndex = (this.currentOptionIndex - 1 + categoryCount) % categoryCount;
        } else {
            // Navigate within action buttons horizontally
            const actionCount = this.actionButtons.length;
            const actionIndex = this.currentOptionIndex - this.categoryButtons.length;
            const newActionIndex = (actionIndex - 1 + actionCount) % actionCount;
            this.currentOptionIndex = this.categoryButtons.length + newActionIndex;
        }
        this.updateSelection();
    }
    
    navigateRight() {
        if (this.getCurrentNavigationArea() === 'categories') {
            // Navigate within categories horizontally
            const categoryCount = this.categoryButtons.length;
            this.currentOptionIndex = (this.currentOptionIndex + 1) % categoryCount;
        } else {
            // Navigate within action buttons horizontally
            const actionCount = this.actionButtons.length;
            const actionIndex = this.currentOptionIndex - this.categoryButtons.length;
            const newActionIndex = (actionIndex + 1) % actionCount;
            this.currentOptionIndex = this.categoryButtons.length + newActionIndex;
        }
        this.updateSelection();
    }
    
    getCurrentNavigationArea() {
        if (this.currentOptionIndex < this.categoryButtons.length) {
            return 'categories';
        } else {
            return 'actions';
        }
    }
    
    getTotalNavigationOptions() {
        return this.categoryButtons.length + this.actionButtons.length;
    }
    
    selectCurrentOption() {
        if (this.currentOptionIndex < this.categoryButtons.length) {
            // Selecting a category
            this.categoryButtons[this.currentOptionIndex].click();
        } else {
            // Selecting an action button
            const actionIndex = this.currentOptionIndex - this.categoryButtons.length;
            if (this.actionButtons[actionIndex]) {
                this.actionButtons[actionIndex].click();
            }
        }
    }
    
    updateSelection() {
        // Update category buttons
        this.categoryButtons.forEach((button, index) => {
            if (index === this.currentOptionIndex && this.getCurrentNavigationArea() === 'categories') {
                // Selected style for categories
                button.style.background = 'linear-gradient(135deg, #ff6600 0%, #ff9900 100%)';
                button.style.borderColor = '#ffff00';
                button.style.color = '#000000';
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '6px 6px 0px #000000';
            } else {
                // Unselected style for categories - restore original logic
                if (this.currentCategory === Object.keys(this.categoryDisplayNames)[index]) {
                    button.style.background = '#00ffff';
                    button.style.color = '#000000';
                } else {
                    button.style.background = 'transparent';
                    button.style.color = '#00ffff';
                }
                button.style.borderColor = '#00ffff';
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            }
        });
        
        // Update action buttons
        this.actionButtons.forEach((button, index) => {
            const actionIndex = this.categoryButtons.length + index;
            if (actionIndex === this.currentOptionIndex && this.getCurrentNavigationArea() === 'actions') {
                // Selected style for actions
                button.style.background = 'linear-gradient(135deg, #ff6600 0%, #ff9900 100%)';
                button.style.borderColor = '#ffff00';
                button.style.color = '#000000';
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '6px 6px 0px #000000';
            } else {
                // Unselected style for actions
                button.style.background = 'linear-gradient(135deg, #003366 0%, #0066cc 100%)';
                button.style.borderColor = '#00ffff';
                button.style.color = '#ffffff';
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '4px 4px 0px #000000';
            }
        });
    }

    // Handle keyboard input (legacy method - now using setupKeyboardNavigation)
    handleKeyPress(event) {
        // This method is kept for backwards compatibility but functionality moved to keyboardListener
        if (event.key === 'Escape') {
            this.hide();
        }
    }
    
    // Create leaderboard UI
    createUI() {
        // Create main container
        this.uiElement = document.createElement('div');
        this.uiElement.id = 'leaderboard-ui';
        this.uiElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            z-index: 2000;
            font-family: 'Courier New', monospace;
            color: white;
            overflow-y: auto;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        // Create header
        const header = this.createHeader();
        this.uiElement.appendChild(header);
        
        // Create category selector
        const categorySelector = this.createCategorySelector();
        this.uiElement.appendChild(categorySelector);
        
        // Create main content area
        const contentArea = this.createContentArea();
        this.uiElement.appendChild(contentArea);
        
        // Create footer
        const footer = this.createFooter();
        this.uiElement.appendChild(footer);
        
        document.body.appendChild(this.uiElement);
        
        // Update display
        this.updateDisplay();
    }
    
    // Create header
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            text-align: center;
            margin-bottom: 30px;
        `;
        
        const title = document.createElement('h1');
        title.textContent = 'LEADERBOARDS';
        title.style.cssText = `
            color: #00ffff;
            font-size: 64px;
            font-weight: 900;
            margin: 0 0 10px 0;
            text-shadow: 4px 4px 0px #ff00ff, 8px 8px 0px #000000, 0px 0px 20px rgba(0, 255, 255, 0.5);
            text-align: center;
            letter-spacing: 8px;
            text-transform: uppercase;
            font-family: "Segoe UI", 'Impact', 'Arial Black', sans-serif;
        `;
        
        const subtitle = document.createElement('h2');
        subtitle.textContent = 'HALL OF FAME';
        subtitle.style.cssText = `
            color: #ffff00;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            text-shadow: 2px 2px 0px #000000, 0px 0px 10px rgba(255, 255, 0, 0.5);
            text-align: center;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-family: "Segoe UI", 'Arial Black', sans-serif;
        `;
        
        header.appendChild(title);
        header.appendChild(subtitle);
        
        return header;
    }
    
    // Create category selector
    createCategorySelector() {
        const selector = document.createElement('div');
        selector.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        `;
        
        this.categoryButtons = []; // Reset category buttons array
        
        Object.keys(this.categoryDisplayNames).forEach((category, index) => {
            const button = document.createElement('button');
            button.textContent = this.categoryDisplayNames[category];
            button.style.cssText = `
                padding: 12px 24px;
                font-size: 16px;
                font-weight: bold;
                border: 2px solid #00ffff;
                background: ${this.currentCategory === category ? '#00ffff' : 'transparent'};
                color: ${this.currentCategory === category ? '#000000' : '#00ffff'};
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Courier New', monospace;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-radius: 5px;
            `;
            
            button.addEventListener('mouseenter', () => {
                if (this.currentCategory !== category) {
                    button.style.background = 'rgba(0, 255, 255, 0.2)';
                    button.style.transform = 'translateY(-2px)';
                    button.style.boxShadow = '0 4px 8px rgba(0, 255, 255, 0.3)';
                }
            });
            
            button.addEventListener('mouseleave', () => {
                if (this.currentCategory !== category) {
                    button.style.background = 'transparent';
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = 'none';
                }
            });
            
            button.addEventListener('click', () => {
                this.currentCategory = category;
                this.updateDisplay();
                this.updateCategoryButtons();
                this.updateSelection(); // Update cursor selection
            });
            
            selector.appendChild(button);
            this.categoryButtons.push(button); // Store reference for cursor navigation
        });
        
        return selector;
    }
    
    // Create content area
    createContentArea() {
        const contentArea = document.createElement('div');
        contentArea.id = 'leaderboard-content';
        contentArea.style.cssText = `
            flex: 1;
            width: 100%;
            max-width: 1200px;
            display: flex;
            flex-direction: column;
            align-items: center;
        `;
        
        return contentArea;
    }
    
    // Create footer
    createFooter() {
        const footer = document.createElement('div');
        footer.style.cssText = `
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.3);
            width: 100%;
        `;
        
        // Create action buttons container
        const actionContainer = document.createElement('div');
        actionContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        `;
        
        this.actionButtons = []; // Reset action buttons array
        
        // Action button data
        const actionData = [
            { 
                text: '🚀 Start Next Level', 
                action: () => {
                    if (this.onStartNextLevel) {
                        this.onStartNextLevel();
                    }
                },
                condition: () => this.onStartNextLevel !== null
            },
            { 
                text: '🔄 Restart Level', 
                action: () => {
                    if (this.onRestartLevel) {
                        this.onRestartLevel();
                    }
                },
                condition: () => this.onRestartLevel !== null
            },
            { 
                text: '🏠 Return to Menu', 
                action: () => {
                    if (this.onReturnToMenu) {
                        this.onReturnToMenu();
                    } else {
                        this.hide();
                    }
                },
                condition: () => true // Always show
            }
        ];
        
        // Create action buttons
        actionData.forEach((actionInfo, index) => {
            if (actionInfo.condition()) {
                const button = document.createElement('button');
                button.textContent = actionInfo.text;
                button.style.cssText = `
                    padding: 15px 30px;
                    font-size: 16px;
                    font-weight: bold;
                    border: 2px solid #00ffff;
                    background: linear-gradient(135deg, #003366 0%, #0066cc 100%);
                    color: #ffffff;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Courier New', monospace;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border-radius: 5px;
                    min-width: 180px;
                    box-shadow: 4px 4px 0px #000000;
                `;
                
                button.addEventListener('mouseenter', () => {
                    if (this.getCurrentNavigationArea() !== 'actions' || 
                        this.currentOptionIndex !== this.categoryButtons.length + this.actionButtons.indexOf(button)) {
                        button.style.background = 'rgba(0, 255, 255, 0.2)';
                        button.style.transform = 'translateY(-2px)';
                        button.style.boxShadow = '6px 6px 0px #000000, 0 4px 8px rgba(0, 255, 255, 0.3)';
                    }
                });
                
                button.addEventListener('mouseleave', () => {
                    if (this.getCurrentNavigationArea() !== 'actions' || 
                        this.currentOptionIndex !== this.categoryButtons.length + this.actionButtons.indexOf(button)) {
                        button.style.background = 'linear-gradient(135deg, #003366 0%, #0066cc 100%)';
                        button.style.transform = 'translateY(0)';
                        button.style.boxShadow = '4px 4px 0px #000000';
                    }
                });
                
                button.addEventListener('click', () => {
                    // Visual feedback for click
                    button.style.transform = 'translateY(2px)';
                    button.style.boxShadow = '2px 2px 0px #000000';
                    setTimeout(() => {
                        button.style.transform = 'translateY(0)';
                        button.style.boxShadow = '4px 4px 0px #000000';
                    }, 100);
                    
                    actionInfo.action();
                });
                
                actionContainer.appendChild(button);
                this.actionButtons.push(button); // Store reference for cursor navigation
            }
        });
        
        // Add action container to footer
        footer.appendChild(actionContainer);
        
        // Create instructions
        const instructions = document.createElement('div');
        instructions.textContent = 'Use ↑↓←→ arrows to navigate • ENTER to select • ESC to close';
        instructions.style.cssText = `
            color: #00ffff;
            font-size: 14px;
            margin-bottom: 10px;
            font-family: 'Courier New', monospace;
        `;
        
        const stats = this.leaderboardManager.getStatistics();
        const statsText = document.createElement('div');
        statsText.textContent = `Total Scores: ${stats.totalScores} • Last Updated: ${stats.newestScore ? new Date(stats.newestScore.timestamp).toLocaleString() : 'Never'}`;
        statsText.style.cssText = `
            color: #ffff00;
            font-size: 12px;
            font-family: 'Courier New', monospace;
        `;
        
        footer.appendChild(instructions);
        footer.appendChild(statsText);
        
        return footer;
    }
    
    // Update category buttons
    updateCategoryButtons() {
        const buttons = this.uiElement.querySelectorAll('button');
        buttons.forEach((button, index) => {
            const category = Object.keys(this.categoryDisplayNames)[index];
            const isActive = this.currentCategory === category;
            
            button.style.background = isActive ? '#00ffff' : 'transparent';
            button.style.color = isActive ? '#000000' : '#00ffff';
        });
    }
    
    // Update display based on current category
    updateDisplay() {
        const contentArea = document.getElementById('leaderboard-content');
        contentArea.innerHTML = '';
        
        if (this.currentCategory === 'individualLevels') {
            this.displayIndividualLevels(contentArea);
        } else {
            this.displayCategoryScores(contentArea);
        }
    }
    
    // Display individual levels
    displayIndividualLevels(container) {
        // Create level selector
        const levelSelector = document.createElement('div');
        levelSelector.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        `;
        
        for (let i = 1; i <= 6; i++) {
            const button = document.createElement('button');
            button.textContent = `Level ${i}`;
            button.style.cssText = `
                padding: 10px 20px;
                font-size: 14px;
                font-weight: bold;
                border: 2px solid #ff00ff;
                background: ${this.currentLevel === i ? '#ff00ff' : 'transparent'};
                color: ${this.currentLevel === i ? '#000000' : '#ff00ff'};
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Courier New', monospace;
                text-transform: uppercase;
                border-radius: 5px;
            `;
            
            button.addEventListener('click', () => {
                this.currentLevel = i;
                this.updateDisplay();
            });
            
            levelSelector.appendChild(button);
            this.actionButtons.push(button); // Add to actionButtons array
        }
        
        container.appendChild(levelSelector);
        
        // Display scores for current level
        const scores = this.leaderboardManager.getTopScores('individualLevel', this.currentLevel);
        const scoresTable = this.createScoresTable(scores, `Level ${this.currentLevel}`);
        container.appendChild(scoresTable);
    }
    
    // Display category scores
    displayCategoryScores(container) {
        const scores = this.leaderboardManager.getTopScores(this.currentCategory);
        const scoresTable = this.createScoresTable(scores, this.categoryDisplayNames[this.currentCategory]);
        container.appendChild(scoresTable);
    }
    
    // Create scores table
    createScoresTable(scores, title) {
        const tableContainer = document.createElement('div');
        tableContainer.style.cssText = `
            width: 100%;
            max-width: 800px;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 10px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        const tableTitle = document.createElement('h3');
        tableTitle.textContent = title;
        tableTitle.style.cssText = `
            color: #00ffff;
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 20px 0;
            text-align: center;
            text-shadow: 2px 2px 0px #000000;
            font-family: 'Courier New', monospace;
        `;
        
        tableContainer.appendChild(tableTitle);
        
        if (scores.length === 0) {
            const noScores = document.createElement('div');
            noScores.textContent = 'No scores yet. Be the first to make it to the leaderboard!';
            noScores.style.cssText = `
                color: #ffff00;
                font-size: 18px;
                text-align: center;
                padding: 40px;
                font-family: 'Courier New', monospace;
                font-style: italic;
            `;
            tableContainer.appendChild(noScores);
            return tableContainer;
        }
        
        // Create table
        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-family: 'Courier New', monospace;
        `;
        
        // Create header
        const headerRow = document.createElement('tr');
        headerRow.style.cssText = `
            background: rgba(0, 255, 255, 0.2);
            border-bottom: 2px solid #00ffff;
        `;
        
        // Check if scores contain pacman mode entries to adjust header
        const hasPacmanMode = scores.some(score => score.gameMode === 'pacman');
        const timeHeaderText = hasPacmanMode ? 'Time Left' : 'Time';
        
        // Check if this is classic mode to include wave information
        const isClassicMode = this.currentCategory === 'classicMode';
        
        const headers = isClassicMode ? 
            ['Rank', 'Initials', 'Score', 'Wave', 'Date'] : 
            ['Rank', 'Initials', 'Score', timeHeaderText, 'Date'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.style.cssText = `
                padding: 15px;
                color: #00ffff;
                font-size: 16px;
                font-weight: bold;
                text-align: center;
                text-transform: uppercase;
                letter-spacing: 1px;
            `;
            headerRow.appendChild(th);
        });
        
        table.appendChild(headerRow);
        
        // Create score rows
        scores.forEach((score, index) => {
            const row = document.createElement('tr');
            row.style.cssText = `
                background: ${index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'};
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                transition: background 0.3s ease;
                cursor: pointer;
            `;
            
            row.addEventListener('mouseenter', () => {
                row.style.background = 'rgba(0, 255, 255, 0.1)';
                row.style.transform = 'scale(1.01)';
                row.style.boxShadow = '0 4px 8px rgba(0, 255, 255, 0.2)';
            });
            
            row.addEventListener('mouseleave', () => {
                row.style.background = index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)';
                row.style.transform = 'scale(1)';
                row.style.boxShadow = 'none';
            });
            
            // Add click handler for better user feedback
            row.addEventListener('click', () => {
                // Visual feedback for click
                row.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    row.style.transform = 'scale(1.01)';
                }, 100);
                
                console.log(`Selected score: ${score.initials} - ${this.leaderboardManager.formatScore(score.score)}`);
            });
            
            // Rank
            const rankCell = document.createElement('td');
            rankCell.textContent = this.getRankDisplay(index + 1);
            rankCell.style.cssText = `
                padding: 12px;
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                color: ${this.getRankColor(index + 1)};
            `;
            
            // Initials
            const initialsCell = document.createElement('td');
            initialsCell.textContent = score.initials;
            initialsCell.style.cssText = `
                padding: 12px;
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                color: white;
                letter-spacing: 2px;
            `;
            
            // Score
            const scoreCell = document.createElement('td');
            scoreCell.textContent = this.leaderboardManager.formatScore(score.score);
            scoreCell.style.cssText = `
                padding: 12px;
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                color: #ffff00;
            `;
            
            // Time or Wave (depending on mode)
            if (isClassicMode) {
                // Wave information for classic mode
                const waveCell = document.createElement('td');
                waveCell.textContent = score.wave ? `Wave ${score.wave}` : 'Wave 1';
                waveCell.style.cssText = `
                    padding: 12px;
                    text-align: center;
                    font-size: 16px;
                    color: #ff00ff;
                    font-weight: bold;
                `;
                
                // Date
                const dateCell = document.createElement('td');
                dateCell.textContent = score.date;
                dateCell.style.cssText = `
                    padding: 12px;
                    text-align: center;
                    font-size: 14px;
                    color: #cccccc;
                `;
                
                row.appendChild(rankCell);
                row.appendChild(initialsCell);
                row.appendChild(scoreCell);
                row.appendChild(waveCell);
                row.appendChild(dateCell);
            } else {
                // Time information for other modes
                const timeCell = document.createElement('td');
                timeCell.textContent = this.leaderboardManager.formatTime(score.completionTime);
                timeCell.style.cssText = `
                    padding: 12px;
                    text-align: center;
                    font-size: 16px;
                    color: #ff00ff;
                `;
                
                // Date
                const dateCell = document.createElement('td');
                dateCell.textContent = score.date;
                dateCell.style.cssText = `
                    padding: 12px;
                    text-align: center;
                    font-size: 14px;
                    color: #cccccc;
                `;
                
                row.appendChild(rankCell);
                row.appendChild(initialsCell);
                row.appendChild(scoreCell);
                row.appendChild(timeCell);
                row.appendChild(dateCell);
            }
            
            table.appendChild(row);
        });
        
        tableContainer.appendChild(table);
        
        return tableContainer;
    }
    
    // Get rank display text
    getRankDisplay(rank) {
        switch (rank) {
            case 1: return '🥇 1st';
            case 2: return '🥈 2nd';
            case 3: return '🥉 3rd';
            default: return `${rank}th`;
        }
    }
    
    // Get rank color
    getRankColor(rank) {
        switch (rank) {
            case 1: return '#FFD700'; // Gold
            case 2: return '#C0C0C0'; // Silver
            case 3: return '#CD7F32'; // Bronze
            default: return '#FFFFFF'; // White
        }
    }
    
    // Refresh the leaderboard display
    refresh() {
        if (this.isVisible) {
            this.updateDisplay();
        }
    }
} 