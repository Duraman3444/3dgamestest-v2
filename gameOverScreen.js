export class GameOverScreen {
    constructor(onReturnToMenu, onRetryLevel, onQuitGame) {
        this.onReturnToMenu = onReturnToMenu;
        this.onRetryLevel = onRetryLevel;
        this.onQuitGame = onQuitGame;
        this.screenElement = null;
        this.isVisible = false;
        this.currentOptionIndex = 0;
        this.options = [];
        this.keyboardListener = null;
        
        this.createScreen();
    }
    
    createScreen() {
        // Create game over screen container
        this.screenElement = document.createElement('div');
        this.screenElement.id = 'gameOverScreen';
        this.screenElement.style.cssText = `
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
            z-index: 2000;
            font-family: 'Courier New', monospace;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
        
        // Create "GAME OVER" title
        const title = document.createElement('h1');
        title.textContent = 'GAME OVER';
        title.style.cssText = `
            color: #00ffff;
            font-size: 84px;
            margin-bottom: 20px;
            text-shadow: 4px 4px 0px #ff00ff, 8px 8px 0px #000000, 0px 0px 20px rgba(0, 255, 255, 0.6);
            text-align: center;
            font-weight: 900;
            letter-spacing: 10px;
            text-transform: uppercase;
            font-family: "Segoe UI", 'Impact', 'Arial Black', sans-serif;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
        `;
        
        // Create subtitle
        const subtitle = document.createElement('h2');
        subtitle.textContent = 'You ran out of lives!';
        subtitle.style.cssText = `
            color: #ffff00;
            font-size: 28px;
            margin-bottom: 60px;
            text-shadow: 3px 3px 0px #000000, 0px 0px 10px rgba(255, 255, 0, 0.5);
            text-align: center;
            font-weight: 700;
            letter-spacing: 6px;
            text-transform: uppercase;
            font-family: "Segoe UI", 'Arial Black', sans-serif;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
        `;
        
        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
        `;
        
        // Create options
        const optionData = [
            { text: 'Retry Level', action: () => this.retryLevel() },
            { text: 'Return to Main Menu', action: () => this.returnToMenu() },
            { text: 'Quit Game', action: () => this.quitGame() }
        ];
        
        this.options = [];
        optionData.forEach((option, index) => {
            const optionElement = this.createOption(option.text, option.action, index);
            this.options.push(optionElement);
            optionsContainer.appendChild(optionElement);
        });
        
        // Create cursor controls info
        const controlsInfo = document.createElement('div');
        controlsInfo.textContent = 'Use ↑↓ arrow keys to navigate, ENTER to select, ESC to return to menu';
        controlsInfo.style.cssText = `
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            color: #00ffff;
            font-size: 14px;
            text-align: center;
            font-family: 'Courier New', monospace;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        // Assemble screen
        this.screenElement.appendChild(title);
        this.screenElement.appendChild(subtitle);
        this.screenElement.appendChild(optionsContainer);
        this.screenElement.appendChild(controlsInfo);
        
        document.body.appendChild(this.screenElement);
        
        // Set initial selection
        this.updateSelection();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
    }
    
    createOption(text, onClick, index) {
        const option = document.createElement('div');
        option.textContent = text;
        option.style.cssText = `
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
        
        option.addEventListener('click', onClick);
        
        return option;
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
                case 'Escape':
                    event.preventDefault();
                    this.returnToMenu();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyboardListener);
    }
    
    navigateUp() {
        this.currentOptionIndex = (this.currentOptionIndex - 1 + this.options.length) % this.options.length;
        this.updateSelection();
    }
    
    navigateDown() {
        this.currentOptionIndex = (this.currentOptionIndex + 1) % this.options.length;
        this.updateSelection();
    }
    
    updateSelection() {
        this.options.forEach((option, index) => {
            if (index === this.currentOptionIndex) {
                // Selected style - PS2 era bright selected state
                option.style.background = 'linear-gradient(135deg, #ff6600 0%, #ff9900 100%)';
                option.style.borderColor = '#ffff00';
                option.style.color = '#000000';
                option.style.transform = 'translateY(-2px)';
                option.style.boxShadow = '6px 6px 0px #000000';
            } else {
                // Unselected style - PS2 era blue gradient
                option.style.background = 'linear-gradient(135deg, #003366 0%, #0066cc 100%)';
                option.style.borderColor = '#00ffff';
                option.style.color = '#ffffff';
                option.style.transform = 'translateY(0)';
                option.style.boxShadow = '4px 4px 0px #000000';
            }
        });
    }
    
    selectCurrentOption() {
        if (this.options[this.currentOptionIndex]) {
            this.options[this.currentOptionIndex].click();
        }
    }
    
    retryLevel() {
        this.hide();
        if (this.onRetryLevel) {
            this.onRetryLevel();
        }
    }
    
    returnToMenu() {
        this.hide();
        if (this.onReturnToMenu) {
            this.onReturnToMenu();
        }
    }
    
    quitGame() {
        if (this.onQuitGame) {
            this.onQuitGame();
        }
    }
    
    show() {
        if (this.screenElement) {
            this.screenElement.style.display = 'flex';
            this.isVisible = true;
            this.currentOptionIndex = 0;
            this.updateSelection();
            
            // Fade in effect
            setTimeout(() => {
                this.screenElement.style.opacity = '1';
            }, 50);
        }
    }
    
    hide() {
        if (this.screenElement) {
            this.screenElement.style.opacity = '0';
            this.isVisible = false;
            
            setTimeout(() => {
                this.screenElement.style.display = 'none';
            }, 500);
        }
    }
    
    destroy() {
        if (this.keyboardListener) {
            document.removeEventListener('keydown', this.keyboardListener);
        }
        
        if (this.screenElement) {
            document.body.removeChild(this.screenElement);
            this.screenElement = null;
        }
    }
} 