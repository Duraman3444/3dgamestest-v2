export class LeaderboardUI {
    constructor(leaderboardManager) {
        this.leaderboardManager = leaderboardManager;
        this.uiElement = null;
        this.currentCategory = 'fullRun';
        this.currentLevel = 1;
        this.isVisible = false;
        this.onClose = null;
        
        this.categoryDisplayNames = {
            fullRun: 'Full Run (Levels 1-6)',
            classicMode: 'Classic Mode',
            individualLevels: 'Individual Levels',
            battleTournament: 'Battle Tournament'
        };
        
        console.log('🏆 Leaderboard UI initialized');
    }
    
    // Show leaderboard UI
    show(category = 'fullRun', onClose = null) {
        if (this.isVisible) {
            this.hide();
        }
        
        this.currentCategory = category;
        this.onClose = onClose;
        this.createUI();
        this.isVisible = true;
        
        // Add ESC key handler
        this.handleKeyPress = this.handleKeyPress.bind(this);
        document.addEventListener('keydown', this.handleKeyPress);
        
        console.log(`🏆 Leaderboard UI shown for category: ${category}`);
    }
    
    // Hide leaderboard UI
    hide() {
        if (this.uiElement) {
            document.body.removeChild(this.uiElement);
            this.uiElement = null;
        }
        
        this.isVisible = false;
        
        // Remove ESC key handler
        document.removeEventListener('keydown', this.handleKeyPress);
        
        if (this.onClose) {
            this.onClose();
        }
        
        console.log('🏆 Leaderboard UI hidden');
    }
    
    // Handle keyboard input
    handleKeyPress(event) {
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
        
        Object.keys(this.categoryDisplayNames).forEach(category => {
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
                }
            });
            
            button.addEventListener('mouseleave', () => {
                if (this.currentCategory !== category) {
                    button.style.background = 'transparent';
                }
            });
            
            button.addEventListener('click', () => {
                this.currentCategory = category;
                this.updateDisplay();
                this.updateCategoryButtons();
            });
            
            selector.appendChild(button);
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
        
        const instructions = document.createElement('div');
        instructions.textContent = 'Press ESC to close • Click category buttons to switch views';
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
        
        const headers = ['Rank', 'Initials', 'Score', timeHeaderText, 'Date'];
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
            `;
            
            row.addEventListener('mouseenter', () => {
                row.style.background = 'rgba(0, 255, 255, 0.1)';
            });
            
            row.addEventListener('mouseleave', () => {
                row.style.background = index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)';
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
            
            // Time
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