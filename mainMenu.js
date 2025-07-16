export class MainMenu {
    constructor(onStartGame) {
        this.onStartGame = onStartGame;
        this.menuElement = null;
        this.isVisible = false;
        this.currentSettingsPanel = null;
        
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
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: 'Arial', sans-serif;
        `;
        
        // Create title
        const title = document.createElement('h1');
        title.textContent = '3D ADVENTURE GAME';
        title.style.cssText = `
            color: #ffffff;
            font-size: 48px;
            margin-bottom: 50px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            text-align: center;
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
            { text: 'Multiplayer', action: () => this.showMultiplayerNotice() },
            { text: 'Settings', action: () => this.showSettings() },
            { text: 'Exit Game', action: () => this.exitGame() }
        ];
        
        buttons.forEach(button => {
            const buttonElement = this.createButton(button.text, button.action);
            buttonsContainer.appendChild(buttonElement);
        });
        
        // Create version info
        const versionInfo = document.createElement('div');
        versionInfo.textContent = 'v1.0.0';
        versionInfo.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            color: rgba(255,255,255,0.7);
            font-size: 12px;
        `;
        
        // Assemble menu
        this.menuElement.appendChild(title);
        this.menuElement.appendChild(buttonsContainer);
        this.menuElement.appendChild(versionInfo);
        
        document.body.appendChild(this.menuElement);
        this.isVisible = true;
    }
    
    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.3);
            color: #ffffff;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s ease;
            min-width: 200px;
            text-align: center;
        `;
        
        // Add hover effects
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(255,255,255,0.2)';
            button.style.borderColor = 'rgba(255,255,255,0.6)';
            button.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(255,255,255,0.1)';
            button.style.borderColor = 'rgba(255,255,255,0.3)';
            button.style.transform = 'translateY(0)';
        });
        
        button.addEventListener('click', onClick);
        
        return button;
    }
    
    startSinglePlayer() {
        this.hide();
        if (this.onStartGame) {
            this.onStartGame();
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
        }
    }
    
    hide() {
        if (this.menuElement) {
            this.menuElement.style.display = 'none';
            this.isVisible = false;
        }
    }
    
    destroy() {
        if (this.menuElement) {
            document.body.removeChild(this.menuElement);
            this.menuElement = null;
        }
        this.closeSettings();
    }
} 