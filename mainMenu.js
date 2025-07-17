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
            font-size: 64px;
            font-weight: bold;
            margin-bottom: 30px;
            text-shadow: 3px 3px 0px #ff00ff, 6px 6px 0px #000000;
            text-align: center;
            letter-spacing: 8px;
            text-transform: uppercase;
            font-family: 'Courier New', monospace;
        `;
        
        // Create subtitle
        const subtitle = document.createElement('h2');
        subtitle.textContent = 'ARCADE EDITION';
        subtitle.style.cssText = `
            color: #ffff00;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 50px;
            text-shadow: 2px 2px 0px #000000;
            text-align: center;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-family: 'Courier New', monospace;
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
            { text: 'Single Player', action: () => this.startSinglePlayer() },
            { text: 'Pacman Mode', action: () => this.startPacmanMode() },
            { text: 'Multiplayer', action: () => this.showMultiplayerNotice() },
            { text: 'Settings', action: () => this.showSettings() },
            { text: 'Exit Game', action: () => this.exitGame() }
        ];
        
        this.menuButtons = [];
        buttons.forEach((button, index) => {
            const buttonElement = this.createButton(button.text, button.action, index);
            this.menuButtons.push(buttonElement);
            buttonsContainer.appendChild(buttonElement);
        });
        
        // Create cursor controls info
        const controlsInfo = document.createElement('div');
        controlsInfo.textContent = 'Use ↑↓ arrow keys to navigate, ENTER to select';
        controlsInfo.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            color: #00ffff;
            font-size: 16px;
            text-align: center;
            font-family: 'Courier New', monospace;
            text-shadow: 1px 1px 0px #000000;
        `;
        
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
                case 'Enter':
                    event.preventDefault();
                    this.selectCurrentOption();
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
    
    updateButtonSelection() {
        this.menuButtons.forEach((button, index) => {
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
    
    showMultiplayerNotice() {
        this.showNotice('Multiplayer', 'Multiplayer mode is not yet implemented. Stay tuned for future updates!');
    }
    
    showSettings() {
        this.createSettingsPanel();
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
            this.menuElement.style.display = 'flex';
            this.isVisible = true;
            this.currentOptionIndex = 0;
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
            this.menuElement = null;
        }
        this.closeSettings();
    }
}