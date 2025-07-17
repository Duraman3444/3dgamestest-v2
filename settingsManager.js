export class SettingsManager {
    constructor() {
        this.settings = {
            audio: {
                masterVolume: 50,
                musicVolume: 30,
                sfxVolume: 70
            },
            graphics: {
                quality: 'medium',
                enableShadows: true,
                enableFog: true,
                enableAntiAliasing: true
            },
            controls: {
                mouseSensitivity: 50,
                invertY: false
            },
            ui: {
                showFPS: true,
                showMinimap: true,
                showCrosshair: true
            }
        };
        
        this.currentSettingsPanel = null;
        this.onSettingsChanged = null;
        
        this.loadSettings();
    }
    
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('gameSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('gameSettings', JSON.stringify(this.settings));
            console.log('Settings saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }
    
    getSettings() {
        return { ...this.settings };
    }
    
    getSetting(category, key) {
        return this.settings[category] && this.settings[category][key];
    }
    
    setSetting(category, key, value) {
        if (this.settings[category]) {
            this.settings[category][key] = value;
            this.saveSettings();
            
            // Trigger settings changed callback
            if (this.onSettingsChanged) {
                this.onSettingsChanged(category, key, value);
            }
        }
    }
    
    setOnSettingsChanged(callback) {
        this.onSettingsChanged = callback;
    }
    
    createSettingsPanel(onClose = null) {
        // Create settings overlay
        const settingsOverlay = document.createElement('div');
        settingsOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2001;
            font-family: 'Courier New', monospace;
        `;
        
        // Create settings panel
        const settingsPanel = document.createElement('div');
        settingsPanel.style.cssText = `
            background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
            padding: 40px;
            border-radius: 12px;
            border: 3px solid #00ffff;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        `;
        
        // Settings title
        const title = document.createElement('h2');
        title.textContent = 'GAME SETTINGS';
        title.style.cssText = `
            color: #00ffff;
            margin-bottom: 30px;
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            text-shadow: 3px 3px 0px #ff00ff, 6px 6px 0px #000000;
            letter-spacing: 3px;
            text-transform: uppercase;
        `;
        
        // Create scrollable content container
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            max-height: 400px;
            overflow-y: auto;
            padding-right: 10px;
        `;
        
        // Audio Settings Section
        const audioSection = this.createSettingsSection('AUDIO SETTINGS', [
            { 
                type: 'slider', 
                label: 'Master Volume', 
                value: this.settings.audio.masterVolume,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('audio', 'masterVolume', value)
            },
            { 
                type: 'slider', 
                label: 'Music Volume', 
                value: this.settings.audio.musicVolume,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('audio', 'musicVolume', value)
            },
            { 
                type: 'slider', 
                label: 'SFX Volume', 
                value: this.settings.audio.sfxVolume,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('audio', 'sfxVolume', value)
            }
        ]);
        
        // Graphics Settings Section
        const graphicsSection = this.createSettingsSection('GRAPHICS SETTINGS', [
            { 
                type: 'select', 
                label: 'Graphics Quality', 
                value: this.settings.graphics.quality,
                options: [
                    { value: 'low', text: 'Low' },
                    { value: 'medium', text: 'Medium' },
                    { value: 'high', text: 'High' }
                ],
                onChange: (value) => this.setSetting('graphics', 'quality', value)
            },
            { 
                type: 'checkbox', 
                label: 'Enable Shadows', 
                value: this.settings.graphics.enableShadows,
                onChange: (value) => this.setSetting('graphics', 'enableShadows', value)
            },
            { 
                type: 'checkbox', 
                label: 'Enable Fog', 
                value: this.settings.graphics.enableFog,
                onChange: (value) => this.setSetting('graphics', 'enableFog', value)
            },
            { 
                type: 'checkbox', 
                label: 'Enable Anti-Aliasing', 
                value: this.settings.graphics.enableAntiAliasing,
                onChange: (value) => this.setSetting('graphics', 'enableAntiAliasing', value)
            }
        ]);
        
        // Controls Settings Section
        const controlsSection = this.createSettingsSection('CONTROLS SETTINGS', [
            { 
                type: 'slider', 
                label: 'Mouse Sensitivity', 
                value: this.settings.controls.mouseSensitivity,
                min: 1,
                max: 100,
                onChange: (value) => this.setSetting('controls', 'mouseSensitivity', value)
            },
            { 
                type: 'checkbox', 
                label: 'Invert Y-Axis', 
                value: this.settings.controls.invertY,
                onChange: (value) => this.setSetting('controls', 'invertY', value)
            }
        ]);
        
        // UI Settings Section
        const uiSection = this.createSettingsSection('UI SETTINGS', [
            { 
                type: 'checkbox', 
                label: 'Show FPS Counter', 
                value: this.settings.ui.showFPS,
                onChange: (value) => this.setSetting('ui', 'showFPS', value)
            },
            { 
                type: 'checkbox', 
                label: 'Show Minimap', 
                value: this.settings.ui.showMinimap,
                onChange: (value) => this.setSetting('ui', 'showMinimap', value)
            },
            { 
                type: 'checkbox', 
                label: 'Show Crosshair', 
                value: this.settings.ui.showCrosshair,
                onChange: (value) => this.setSetting('ui', 'showCrosshair', value)
            }
        ]);
        
        // Add sections to content container
        contentContainer.appendChild(audioSection);
        contentContainer.appendChild(graphicsSection);
        contentContainer.appendChild(controlsSection);
        contentContainer.appendChild(uiSection);
        
        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 30px;
        `;
        
        const saveButton = this.createButton('SAVE SETTINGS', () => {
            if (this.saveSettings()) {
                this.showNotice('Settings saved successfully!', () => {
                    this.closeSettings();
                    if (onClose) onClose();
                });
            } else {
                this.showNotice('Failed to save settings!');
            }
        });
        
        const cancelButton = this.createButton('CANCEL', () => {
            this.closeSettings();
            if (onClose) onClose();
        });
        
        const resetButton = this.createButton('RESET TO DEFAULT', () => {
            this.resetToDefaults();
            this.closeSettings();
            if (onClose) onClose();
        });
        
        buttonsContainer.appendChild(saveButton);
        buttonsContainer.appendChild(cancelButton);
        buttonsContainer.appendChild(resetButton);
        
        // Instructions
        const instructions = document.createElement('div');
        instructions.textContent = 'Settings are automatically saved when changed';
        instructions.style.cssText = `
            color: #ffff00;
            font-size: 14px;
            text-align: center;
            margin-top: 20px;
            text-shadow: 2px 2px 0px #000000;
        `;
        
        settingsPanel.appendChild(title);
        settingsPanel.appendChild(contentContainer);
        settingsPanel.appendChild(buttonsContainer);
        settingsPanel.appendChild(instructions);
        settingsOverlay.appendChild(settingsPanel);
        
        document.body.appendChild(settingsOverlay);
        this.currentSettingsPanel = settingsOverlay;
        
        return settingsOverlay;
    }
    
    createSettingsSection(title, controls) {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 25px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = title;
        sectionTitle.style.cssText = `
            color: #ffff00;
            margin-bottom: 15px;
            font-size: 18px;
            font-weight: bold;
            text-shadow: 2px 2px 0px #000000;
            letter-spacing: 2px;
        `;
        
        section.appendChild(sectionTitle);
        
        controls.forEach(control => {
            const controlElement = this.createControl(control);
            section.appendChild(controlElement);
        });
        
        return section;
    }
    
    createControl(control) {
        const container = document.createElement('div');
        container.style.cssText = `
            margin-bottom: 15px;
        `;
        
        const label = document.createElement('label');
        label.textContent = control.label;
        label.style.cssText = `
            display: block;
            margin-bottom: 8px;
            color: #ffffff;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        let inputElement;
        
        switch (control.type) {
            case 'slider':
                inputElement = document.createElement('input');
                inputElement.type = 'range';
                inputElement.min = control.min;
                inputElement.max = control.max;
                inputElement.value = control.value;
                inputElement.style.cssText = `
                    width: 100%;
                    margin-bottom: 5px;
                `;
                
                const valueDisplay = document.createElement('div');
                valueDisplay.textContent = control.value;
                valueDisplay.style.cssText = `
                    color: #00ffff;
                    font-size: 12px;
                    text-align: center;
                    font-weight: bold;
                `;
                
                inputElement.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    valueDisplay.textContent = value;
                    control.onChange(value);
                });
                
                container.appendChild(label);
                container.appendChild(inputElement);
                container.appendChild(valueDisplay);
                break;
                
            case 'select':
                inputElement = document.createElement('select');
                inputElement.style.cssText = `
                    width: 100%;
                    padding: 8px;
                    background: rgba(0, 0, 0, 0.5);
                    border: 2px solid #00ffff;
                    color: #ffffff;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    border-radius: 4px;
                `;
                
                control.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.text;
                    optionElement.selected = option.value === control.value;
                    optionElement.style.cssText = `
                        background: #1a0033;
                        color: #ffffff;
                    `;
                    inputElement.appendChild(optionElement);
                });
                
                inputElement.addEventListener('change', (e) => {
                    control.onChange(e.target.value);
                });
                
                container.appendChild(label);
                container.appendChild(inputElement);
                break;
                
            case 'checkbox':
                const checkboxContainer = document.createElement('div');
                checkboxContainer.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                `;
                
                inputElement = document.createElement('input');
                inputElement.type = 'checkbox';
                inputElement.checked = control.value;
                inputElement.style.cssText = `
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                `;
                
                label.style.cursor = 'pointer';
                label.style.margin = '0';
                
                inputElement.addEventListener('change', (e) => {
                    control.onChange(e.target.checked);
                });
                
                checkboxContainer.appendChild(inputElement);
                checkboxContainer.appendChild(label);
                container.appendChild(checkboxContainer);
                break;
        }
        
        return container;
    }
    
    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
            border: 2px solid #00ffff;
            color: #00ffff;
            padding: 12px 25px;
            font-size: 14px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            border-radius: 6px;
            cursor: pointer;
            text-shadow: 2px 2px 0px #000000;
            letter-spacing: 1px;
            transition: all 0.3s ease;
            min-width: 120px;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = 'linear-gradient(135deg, #ff6600 0%, #ff9900 100%)';
            button.style.color = '#000000';
            button.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'linear-gradient(135deg, #1a0033 0%, #330066 100%)';
            button.style.color = '#00ffff';
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', onClick);
        
        return button;
    }
    
    showNotice(message, onClose = null) {
        const noticeOverlay = document.createElement('div');
        noticeOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2002;
            font-family: 'Courier New', monospace;
        `;
        
        const noticePanel = document.createElement('div');
        noticePanel.style.cssText = `
            background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
            padding: 30px;
            border-radius: 12px;
            border: 3px solid #00ffff;
            max-width: 350px;
            width: 90%;
            text-align: center;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        `;
        
        const messageText = document.createElement('p');
        messageText.textContent = message;
        messageText.style.cssText = `
            color: #ffffff;
            font-size: 16px;
            margin-bottom: 20px;
            text-shadow: 1px 1px 0px #000000;
        `;
        
        const okButton = this.createButton('OK', () => {
            document.body.removeChild(noticeOverlay);
            if (onClose) onClose();
        });
        
        noticePanel.appendChild(messageText);
        noticePanel.appendChild(okButton);
        noticeOverlay.appendChild(noticePanel);
        
        document.body.appendChild(noticeOverlay);
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            if (document.body.contains(noticeOverlay)) {
                document.body.removeChild(noticeOverlay);
                if (onClose) onClose();
            }
        }, 3000);
    }
    
    closeSettings() {
        if (this.currentSettingsPanel) {
            document.body.removeChild(this.currentSettingsPanel);
            this.currentSettingsPanel = null;
        }
    }
    
    resetToDefaults() {
        this.settings = {
            audio: {
                masterVolume: 50,
                musicVolume: 30,
                sfxVolume: 70
            },
            graphics: {
                quality: 'medium',
                enableShadows: true,
                enableFog: true,
                enableAntiAliasing: true
            },
            controls: {
                mouseSensitivity: 50,
                invertY: false
            },
            ui: {
                showFPS: true,
                showMinimap: true,
                showCrosshair: true
            }
        };
        
        this.saveSettings();
        this.showNotice('Settings reset to defaults!');
    }
    
    applySettings() {
        // Apply settings to game systems
        if (this.onSettingsChanged) {
            // Apply all settings
            Object.keys(this.settings).forEach(category => {
                Object.keys(this.settings[category]).forEach(key => {
                    this.onSettingsChanged(category, key, this.settings[category][key]);
                });
            });
        }
    }
} 