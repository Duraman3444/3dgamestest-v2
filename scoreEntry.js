export class ScoreEntry {
    constructor(leaderboardManager) {
        this.leaderboardManager = leaderboardManager;
        this.uiElement = null;
        this.isVisible = false;
        this.currentInitials = ['A', 'A', 'A'];
        this.currentIndex = 0;
        this.scoreData = null;
        this.category = null;
        this.onComplete = null;
        this.onCancel = null;
        
        console.log('📝 Score Entry system initialized');
    }
    
    // Show score entry UI
    show(scoreData, category, onComplete = null, onCancel = null) {
        if (this.isVisible) {
            this.hide();
        }
        
        this.scoreData = scoreData;
        this.category = category;
        this.onComplete = onComplete;
        this.onCancel = onCancel;
        this.currentInitials = ['A', 'A', 'A'];
        this.currentIndex = 0;
        
        this.createUI();
        this.isVisible = true;
        
        // Add keyboard event listeners
        this.handleKeyPress = this.handleKeyPress.bind(this);
        document.addEventListener('keydown', this.handleKeyPress);
        
        // Play entry sound if available
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playHighScoreSound();
        }
        
        console.log('📝 Score entry UI shown for category:', category);
    }
    
    // Hide score entry UI
    hide() {
        if (this.uiElement) {
            document.body.removeChild(this.uiElement);
            this.uiElement = null;
        }
        
        this.isVisible = false;
        
        // Remove keyboard event listeners
        document.removeEventListener('keydown', this.handleKeyPress);
        
        console.log('📝 Score entry UI hidden');
    }
    
    // Handle keyboard input
    handleKeyPress(event) {
        if (!this.isVisible) return;
        
        event.preventDefault();
        
        switch (event.key) {
            case 'ArrowUp':
                this.changeCurrentLetter(1);
                break;
            case 'ArrowDown':
                this.changeCurrentLetter(-1);
                break;
            case 'ArrowLeft':
                this.moveCursor(-1);
                break;
            case 'ArrowRight':
                this.moveCursor(1);
                break;
            case 'Enter':
                this.submitScore();
                break;
            case 'Escape':
                this.cancelEntry();
                break;
            default:
                // Handle direct letter input
                if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
                    this.currentInitials[this.currentIndex] = event.key.toUpperCase();
                    this.updateDisplay();
                    this.moveCursor(1);
                }
                break;
        }
    }
    
    // Change current letter
    changeCurrentLetter(direction) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const currentIndex = alphabet.indexOf(this.currentInitials[this.currentIndex]);
        let newIndex = currentIndex + direction;
        
        if (newIndex < 0) newIndex = alphabet.length - 1;
        if (newIndex >= alphabet.length) newIndex = 0;
        
        this.currentInitials[this.currentIndex] = alphabet[newIndex];
        this.updateDisplay();
        
        // Play navigation sound
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playMenuClickSound();
        }
    }
    
    // Move cursor
    moveCursor(direction) {
        this.currentIndex += direction;
        
        if (this.currentIndex < 0) this.currentIndex = 2;
        if (this.currentIndex > 2) this.currentIndex = 0;
        
        this.updateDisplay();
        
        // Play navigation sound
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playMenuClickSound();
        }
    }
    
    // Submit score
    submitScore() {
        const initials = this.currentInitials.join('');
        const finalScoreData = {
            ...this.scoreData,
            initials: initials
        };
        
        // Add to leaderboard
        this.leaderboardManager.addScore(this.category, finalScoreData, (isNewRecord, rank) => {
            console.log(`🏆 Score submitted: ${initials} - ${finalScoreData.score}`);
            
            if (this.onComplete) {
                this.onComplete(finalScoreData, isNewRecord, rank);
            }
        });
        
        // Play success sound
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playSuccessSound();
        }
        
        this.hide();
    }
    
    // Cancel entry
    cancelEntry() {
        if (this.onCancel) {
            this.onCancel();
        }
        
        this.hide();
    }
    
    // Create score entry UI
    createUI() {
        // Create main container
        this.uiElement = document.createElement('div');
        this.uiElement.id = 'score-entry-ui';
        this.uiElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            font-family: 'Courier New', monospace;
            color: white;
            backdrop-filter: blur(10px);
        `;
        
        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            border: 3px solid #00ffff;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 0 50px rgba(0, 255, 255, 0.3);
            animation: pulse 2s infinite;
            max-width: 600px;
            width: 90%;
        `;
        
        // Add pulsing animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 50px rgba(0, 255, 255, 0.3); }
                50% { transform: scale(1.02); box-shadow: 0 0 80px rgba(0, 255, 255, 0.5); }
            }
        `;
        document.head.appendChild(style);
        
        // Create header
        const header = this.createHeader();
        contentContainer.appendChild(header);
        
        // Create score display
        const scoreDisplay = this.createScoreDisplay();
        contentContainer.appendChild(scoreDisplay);
        
        // Create initials input
        const initialsInput = this.createInitialsInput();
        contentContainer.appendChild(initialsInput);
        
        // Create instructions
        const instructions = this.createInstructions();
        contentContainer.appendChild(instructions);
        
        // Create buttons
        const buttons = this.createButtons();
        contentContainer.appendChild(buttons);
        
        this.uiElement.appendChild(contentContainer);
        document.body.appendChild(this.uiElement);
        
        this.updateDisplay();
    }
    
    // Create header
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            margin-bottom: 30px;
        `;
        
        const title = document.createElement('h1');
        title.textContent = 'NEW HIGH SCORE!';
        title.style.cssText = `
            color: #FFD700;
            font-size: 48px;
            font-weight: 900;
            margin: 0 0 10px 0;
            text-shadow: 4px 4px 0px #FF6B00, 8px 8px 0px #000000, 0px 0px 20px rgba(255, 215, 0, 0.8);
            text-align: center;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-family: "Segoe UI", 'Impact', 'Arial Black', sans-serif;
            animation: glow 2s ease-in-out infinite alternate;
        `;
        
        // Add glowing animation
        const glowStyle = document.createElement('style');
        glowStyle.textContent = `
            @keyframes glow {
                from { text-shadow: 4px 4px 0px #FF6B00, 8px 8px 0px #000000, 0px 0px 20px rgba(255, 215, 0, 0.8); }
                to { text-shadow: 4px 4px 0px #FF6B00, 8px 8px 0px #000000, 0px 0px 40px rgba(255, 215, 0, 1); }
            }
        `;
        document.head.appendChild(glowStyle);
        
        const subtitle = document.createElement('h2');
        subtitle.textContent = 'Enter Your Initials';
        subtitle.style.cssText = `
            color: #00ffff;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            text-shadow: 2px 2px 0px #000000;
            text-align: center;
            letter-spacing: 2px;
            text-transform: uppercase;
            font-family: "Segoe UI", 'Arial Black', sans-serif;
        `;
        
        header.appendChild(title);
        header.appendChild(subtitle);
        
        return header;
    }
    
    // Create score display
    createScoreDisplay() {
        const scoreDisplay = document.createElement('div');
        scoreDisplay.style.cssText = `
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #ffff00;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        `;
        
        const scoreLabel = document.createElement('div');
        scoreLabel.textContent = 'Final Score';
        scoreLabel.style.cssText = `
            color: #ffff00;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        
        const scoreValue = document.createElement('div');
        scoreValue.textContent = this.leaderboardManager.formatScore(this.scoreData.score);
        scoreValue.style.cssText = `
            color: #FFD700;
            font-size: 36px;
            font-weight: 900;
            margin-bottom: 10px;
            text-shadow: 2px 2px 0px #000000;
        `;
        
        const timeLabel = document.createElement('div');
        timeLabel.textContent = 'Completion Time';
        timeLabel.style.cssText = `
            color: #ff00ff;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        
        const timeValue = document.createElement('div');
        timeValue.textContent = this.leaderboardManager.formatTime(this.scoreData.completionTime);
        timeValue.style.cssText = `
            color: #ff00ff;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        scoreDisplay.appendChild(scoreLabel);
        scoreDisplay.appendChild(scoreValue);
        scoreDisplay.appendChild(timeLabel);
        scoreDisplay.appendChild(timeValue);
        
        return scoreDisplay;
    }
    
    // Create initials input
    createInitialsInput() {
        const inputContainer = document.createElement('div');
        inputContainer.id = 'initials-input';
        inputContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 30px 0;
        `;
        
        for (let i = 0; i < 3; i++) {
            const letterContainer = document.createElement('div');
            letterContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            `;
            
            const letterBox = document.createElement('div');
            letterBox.id = `letter-${i}`;
            letterBox.style.cssText = `
                width: 80px;
                height: 80px;
                border: 3px solid #00ffff;
                background: rgba(0, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 48px;
                font-weight: 900;
                color: #00ffff;
                text-shadow: 2px 2px 0px #000000;
                border-radius: 10px;
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            
            const arrows = document.createElement('div');
            arrows.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            `;
            
            const upArrow = document.createElement('div');
            upArrow.textContent = '▲';
            upArrow.style.cssText = `
                color: #ffffff;
                font-size: 16px;
                cursor: pointer;
                transition: color 0.3s ease;
            `;
            
            const downArrow = document.createElement('div');
            downArrow.textContent = '▼';
            downArrow.style.cssText = `
                color: #ffffff;
                font-size: 16px;
                cursor: pointer;
                transition: color 0.3s ease;
            `;
            
            // Add click handlers
            letterBox.addEventListener('click', () => {
                this.currentIndex = i;
                this.updateDisplay();
            });
            
            upArrow.addEventListener('click', () => {
                this.currentIndex = i;
                this.changeCurrentLetter(1);
            });
            
            downArrow.addEventListener('click', () => {
                this.currentIndex = i;
                this.changeCurrentLetter(-1);
            });
            
            upArrow.addEventListener('mouseenter', () => {
                upArrow.style.color = '#00ffff';
            });
            
            upArrow.addEventListener('mouseleave', () => {
                upArrow.style.color = '#ffffff';
            });
            
            downArrow.addEventListener('mouseenter', () => {
                downArrow.style.color = '#00ffff';
            });
            
            downArrow.addEventListener('mouseleave', () => {
                downArrow.style.color = '#ffffff';
            });
            
            arrows.appendChild(upArrow);
            arrows.appendChild(downArrow);
            
            letterContainer.appendChild(letterBox);
            letterContainer.appendChild(arrows);
            
            inputContainer.appendChild(letterContainer);
        }
        
        return inputContainer;
    }
    
    // Create instructions
    createInstructions() {
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            color: #ffffff;
            font-size: 14px;
            line-height: 1.6;
        `;
        
        instructions.innerHTML = `
            <div style="color: #00ffff; font-weight: bold; margin-bottom: 10px;">CONTROLS:</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>↑↓ Arrow Keys:</span>
                <span>Change Letter</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>←→ Arrow Keys:</span>
                <span>Move Cursor</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>A-Z Keys:</span>
                <span>Direct Input</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>ENTER:</span>
                <span>Submit Score</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>ESC:</span>
                <span>Cancel</span>
            </div>
        `;
        
        return instructions;
    }
    
    // Create buttons
    createButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 30px;
        `;
        
        const submitButton = document.createElement('button');
        submitButton.textContent = 'SUBMIT SCORE';
        submitButton.style.cssText = `
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            border: 2px solid #00ff00;
            background: rgba(0, 255, 0, 0.2);
            color: #00ff00;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Courier New', monospace;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-radius: 5px;
        `;
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'CANCEL';
        cancelButton.style.cssText = `
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            border: 2px solid #ff0000;
            background: rgba(255, 0, 0, 0.2);
            color: #ff0000;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Courier New', monospace;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-radius: 5px;
        `;
        
        // Add hover effects
        submitButton.addEventListener('mouseenter', () => {
            submitButton.style.background = '#00ff00';
            submitButton.style.color = '#000000';
        });
        
        submitButton.addEventListener('mouseleave', () => {
            submitButton.style.background = 'rgba(0, 255, 0, 0.2)';
            submitButton.style.color = '#00ff00';
        });
        
        cancelButton.addEventListener('mouseenter', () => {
            cancelButton.style.background = '#ff0000';
            cancelButton.style.color = '#000000';
        });
        
        cancelButton.addEventListener('mouseleave', () => {
            cancelButton.style.background = 'rgba(255, 0, 0, 0.2)';
            cancelButton.style.color = '#ff0000';
        });
        
        // Add click handlers
        submitButton.addEventListener('click', () => this.submitScore());
        cancelButton.addEventListener('click', () => this.cancelEntry());
        
        buttonContainer.appendChild(submitButton);
        buttonContainer.appendChild(cancelButton);
        
        return buttonContainer;
    }
    
    // Update display
    updateDisplay() {
        for (let i = 0; i < 3; i++) {
            const letterBox = document.getElementById(`letter-${i}`);
            if (letterBox) {
                letterBox.textContent = this.currentInitials[i];
                
                // Highlight current selection
                if (i === this.currentIndex) {
                    letterBox.style.background = '#00ffff';
                    letterBox.style.color = '#000000';
                    letterBox.style.transform = 'scale(1.1)';
                    letterBox.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.8)';
                } else {
                    letterBox.style.background = 'rgba(0, 255, 255, 0.1)';
                    letterBox.style.color = '#00ffff';
                    letterBox.style.transform = 'scale(1)';
                    letterBox.style.boxShadow = 'none';
                }
            }
        }
    }
} 