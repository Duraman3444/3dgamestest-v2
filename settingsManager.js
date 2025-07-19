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
                enableAntiAliasing: true,
                enableSSR: false,
                ssrIntensity: 50,
                ssrMaxDistance: 30,
                ssrThickness: 0.5,
                // Advanced Graphics Effects
                enableBloom: false,
                bloomIntensity: 30,
                bloomThreshold: 85,
                bloomRadius: 40,
                enableSSAO: false,
                ssaoIntensity: 50,
                ssaoRadius: 20,
                enableGodRays: false,
                godRaysIntensity: 40,
                godRaysExposure: 25,
                enableMotionBlur: false,
                motionBlurStrength: 30,
                enableDOF: false,
                dofFocus: 50,
                dofBlur: 20,
                enableFilmGrain: false,
                filmGrainIntensity: 15,
                enableVignette: false,
                vignetteIntensity: 25,
                enableChromaticAberration: false,
                chromaticIntensity: 10,
                enableColorGrading: false,
                colorGradingPreset: 'cinematic',
                enableVolumetricFog: true,
                volumetricFogQuality: 'medium',
                volumetricFogDensity: 50,
                volumetricFogScattering: 50,
                enableParticleEffects: true,
                particleQuality: 'medium',
                enableDynamicLighting: false
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
    
    // Mode-specific presets
    applyPacmanPreset() {
        // Retro/Arcade optimized settings
        this.setSetting('graphics', 'enableSSR', false);
        this.setSetting('graphics', 'enableBloom', true);
        this.setSetting('graphics', 'bloomIntensity', 40);
        this.setSetting('graphics', 'enableSSAO', false);
        this.setSetting('graphics', 'enableGodRays', false);
        this.setSetting('graphics', 'enableMotionBlur', true);
        this.setSetting('graphics', 'motionBlurStrength', 25);
        this.setSetting('graphics', 'enableDOF', false);
        this.setSetting('graphics', 'enableFilmGrain', true);
        this.setSetting('graphics', 'filmGrainIntensity', 25);
        this.setSetting('graphics', 'enableVignette', true);
        this.setSetting('graphics', 'vignetteIntensity', 30);
        this.setSetting('graphics', 'enableChromaticAberration', true);
        this.setSetting('graphics', 'chromaticIntensity', 15);
        this.setSetting('graphics', 'enableColorGrading', true);
        this.setSetting('graphics', 'colorGradingPreset', 'vibrant');
        this.setSetting('graphics', 'enableVolumetricFog', false);
        this.setSetting('graphics', 'enableParticleEffects', true);
        this.setSetting('graphics', 'particleQuality', 'medium');
        this.setSetting('graphics', 'enableDynamicLighting', false);
        
        console.log('🎯 Applied Pacman Mode preset - Retro arcade feel!');
        alert('🎯 Pacman Mode preset applied! Optimized for retro arcade experience.');
    }
    
    applyRegularPreset() {
        // Modern/Cinematic optimized settings
        this.setSetting('graphics', 'enableSSR', true);
        this.setSetting('graphics', 'ssrIntensity', 50);
        this.setSetting('graphics', 'enableBloom', true);
        this.setSetting('graphics', 'bloomIntensity', 35);
        this.setSetting('graphics', 'enableSSAO', true);
        this.setSetting('graphics', 'ssaoIntensity', 50);
        this.setSetting('graphics', 'enableGodRays', true);
        this.setSetting('graphics', 'godRaysIntensity', 40);
        this.setSetting('graphics', 'enableMotionBlur', true);
        this.setSetting('graphics', 'motionBlurStrength', 30);
        this.setSetting('graphics', 'enableDOF', true);
        this.setSetting('graphics', 'dofFocus', 50);
        this.setSetting('graphics', 'enableFilmGrain', true);
        this.setSetting('graphics', 'filmGrainIntensity', 15);
        this.setSetting('graphics', 'enableVignette', false);
        this.setSetting('graphics', 'enableChromaticAberration', false);
        this.setSetting('graphics', 'enableColorGrading', true);
        this.setSetting('graphics', 'colorGradingPreset', 'cinematic');
        this.setSetting('graphics', 'enableVolumetricFog', true);
        this.setSetting('graphics', 'enableParticleEffects', true);
        this.setSetting('graphics', 'particleQuality', 'high');
        this.setSetting('graphics', 'enableDynamicLighting', true);
        
        console.log('🎮 Applied Regular Mode preset - Cinematic experience!');
        alert('🎮 Regular Mode preset applied! Optimized for modern cinematic experience.');
    }
    
    applyBattlePreset() {
        // Performance/Competitive optimized settings
        this.setSetting('graphics', 'enableSSR', false);
        this.setSetting('graphics', 'enableBloom', true);
        this.setSetting('graphics', 'bloomIntensity', 25);
        this.setSetting('graphics', 'enableSSAO', false);
        this.setSetting('graphics', 'enableGodRays', false);
        this.setSetting('graphics', 'enableMotionBlur', false);
        this.setSetting('graphics', 'enableDOF', false);
        this.setSetting('graphics', 'enableFilmGrain', false);
        this.setSetting('graphics', 'enableVignette', false);
        this.setSetting('graphics', 'enableChromaticAberration', false);
        this.setSetting('graphics', 'enableColorGrading', true);
        this.setSetting('graphics', 'colorGradingPreset', 'vibrant');
        this.setSetting('graphics', 'enableVolumetricFog', false);
        this.setSetting('graphics', 'enableParticleEffects', true);
        this.setSetting('graphics', 'particleQuality', 'medium');
        this.setSetting('graphics', 'enableDynamicLighting', false);
        
        console.log('⚔️ Applied Battle Mode preset - Performance optimized!');
        alert('⚔️ Battle Mode preset applied! Optimized for competitive performance and clarity.');
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
            },
            { 
                type: 'checkbox', 
                label: 'Enable Screen Space Reflections - 📍 Best for: Regular Mode | Skip for: Pacman, Battle', 
                value: this.settings.graphics.enableSSR,
                onChange: (value) => this.setSetting('graphics', 'enableSSR', value)
            },
            { 
                type: 'slider', 
                label: 'SSR Intensity', 
                value: this.settings.graphics.ssrIntensity,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'ssrIntensity', value)
            },
            { 
                type: 'slider', 
                label: 'SSR Max Distance', 
                value: this.settings.graphics.ssrMaxDistance,
                min: 10,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'ssrMaxDistance', value)
            },
            { 
                type: 'slider', 
                label: 'SSR Surface Thickness', 
                value: Math.round(this.settings.graphics.ssrThickness * 100),
                min: 10,
                max: 200,
                onChange: (value) => this.setSetting('graphics', 'ssrThickness', value / 100)
            },
            
            // Advanced Graphics Effects with Difficulty Indicators and Mode Recommendations
            { 
                type: 'header',
                label: '🌟 ADVANCED GRAPHICS EFFECTS 🌟'
            },
            { 
                type: 'text',
                label: '📍 Mode Recommendations: Regular Mode (modern/cinematic), Pacman Mode (retro/arcade), Battle Mode (competitive/performance)'
            },
            { 
                type: 'button',
                label: '🎯 Auto-Apply Preset for Pacman Mode',
                onClick: () => this.applyPacmanPreset()
            },
            { 
                type: 'button',
                label: '🎮 Auto-Apply Preset for Regular Mode',
                onClick: () => this.applyRegularPreset()
            },
            { 
                type: 'button',
                label: '⚔️ Auto-Apply Preset for Battle Mode',
                onClick: () => this.applyBattlePreset()
            },
            { 
                type: 'checkbox', 
                label: '🌸 Bloom Effect (Difficulty: ⭐⭐☆) - Beautiful glow around bright objects | 📍 Excellent for: All Modes', 
                value: this.settings.graphics.enableBloom,
                onChange: (value) => this.setSetting('graphics', 'enableBloom', value)
            },
            { 
                type: 'slider', 
                label: 'Bloom Intensity', 
                value: this.settings.graphics.bloomIntensity,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'bloomIntensity', value)
            },
            { 
                type: 'slider', 
                label: 'Bloom Threshold', 
                value: this.settings.graphics.bloomThreshold,
                min: 50,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'bloomThreshold', value)
            },
            { 
                type: 'slider', 
                label: 'Bloom Radius', 
                value: this.settings.graphics.bloomRadius,
                min: 10,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'bloomRadius', value)
            },
            
            { 
                type: 'checkbox', 
                label: '🌫️ Screen Space Ambient Occlusion (Difficulty: ⭐⭐⭐) - Realistic shadows | 📍 Best for: Regular Mode | Optional: Battle', 
                value: this.settings.graphics.enableSSAO,
                onChange: (value) => this.setSetting('graphics', 'enableSSAO', value)
            },
            { 
                type: 'slider', 
                label: 'SSAO Intensity', 
                value: this.settings.graphics.ssaoIntensity,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'ssaoIntensity', value)
            },
            { 
                type: 'slider', 
                label: 'SSAO Radius', 
                value: this.settings.graphics.ssaoRadius,
                min: 5,
                max: 50,
                onChange: (value) => this.setSetting('graphics', 'ssaoRadius', value)
            },
            
            { 
                type: 'checkbox', 
                label: '☀️ God Rays/Volumetric Light (Difficulty: ⭐⭐⭐) - Dramatic light shafts | 📍 Best for: Regular Mode | Skip for: Pacman, Battle', 
                value: this.settings.graphics.enableGodRays,
                onChange: (value) => this.setSetting('graphics', 'enableGodRays', value)
            },
            { 
                type: 'slider', 
                label: 'God Rays Intensity', 
                value: this.settings.graphics.godRaysIntensity,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'godRaysIntensity', value)
            },
            { 
                type: 'slider', 
                label: 'God Rays Exposure', 
                value: this.settings.graphics.godRaysExposure,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'godRaysExposure', value)
            },
            
            { 
                type: 'checkbox', 
                label: '💨 Motion Blur (Difficulty: ⭐⭐☆) - Speed blur effects | 📍 Best for: Regular Mode | Fun for: Pacman | Skip for: Battle', 
                value: this.settings.graphics.enableMotionBlur,
                onChange: (value) => this.setSetting('graphics', 'enableMotionBlur', value)
            },
            { 
                type: 'slider', 
                label: 'Motion Blur Strength', 
                value: this.settings.graphics.motionBlurStrength,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'motionBlurStrength', value)
            },
            
            { 
                type: 'checkbox', 
                label: '🎯 Depth of Field (Difficulty: ⭐⭐☆) - Camera focus effects | 📍 Best for: Regular Mode | Skip for: Pacman, Battle', 
                value: this.settings.graphics.enableDOF,
                onChange: (value) => this.setSetting('graphics', 'enableDOF', value)
            },
            { 
                type: 'slider', 
                label: 'DOF Focus Distance', 
                value: this.settings.graphics.dofFocus,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'dofFocus', value)
            },
            { 
                type: 'slider', 
                label: 'DOF Blur Strength', 
                value: this.settings.graphics.dofBlur,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'dofBlur', value)
            },
            
            { 
                type: 'checkbox', 
                label: '📺 Film Grain (Difficulty: ⭐☆☆) - Vintage film texture | 📍 Perfect for: Pacman Mode | Good for: Regular | Skip for: Battle', 
                value: this.settings.graphics.enableFilmGrain,
                onChange: (value) => this.setSetting('graphics', 'enableFilmGrain', value)
            },
            { 
                type: 'slider', 
                label: 'Film Grain Intensity', 
                value: this.settings.graphics.filmGrainIntensity,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'filmGrainIntensity', value)
            },
            
            { 
                type: 'checkbox', 
                label: '⚫ Vignette (Difficulty: ⭐☆☆) - Screen edge darkening | 📍 Perfect for: Pacman Mode | Optional: Regular | Skip for: Battle', 
                value: this.settings.graphics.enableVignette,
                onChange: (value) => this.setSetting('graphics', 'enableVignette', value)
            },
            { 
                type: 'slider', 
                label: 'Vignette Intensity', 
                value: this.settings.graphics.vignetteIntensity,
                min: 0,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'vignetteIntensity', value)
            },
            
            { 
                type: 'checkbox', 
                label: '🌈 Chromatic Aberration (Difficulty: ⭐☆☆) - Color fringing effect | 📍 Perfect for: Pacman Mode | Subtle for: Regular | Skip for: Battle', 
                value: this.settings.graphics.enableChromaticAberration,
                onChange: (value) => this.setSetting('graphics', 'enableChromaticAberration', value)
            },
            { 
                type: 'slider', 
                label: 'Chromatic Intensity', 
                value: this.settings.graphics.chromaticIntensity,
                min: 0,
                max: 50,
                onChange: (value) => this.setSetting('graphics', 'chromaticIntensity', value)
            },
            
            { 
                type: 'checkbox', 
                label: '🎨 Color Grading/Tone Mapping (Difficulty: ⭐⭐☆) - Cinematic colors | 📍 Great for: All Modes (use Vibrant for Pacman, Cinematic for Regular)', 
                value: this.settings.graphics.enableColorGrading,
                onChange: (value) => this.setSetting('graphics', 'enableColorGrading', value)
            },
            { 
                type: 'select', 
                label: 'Color Grading Preset', 
                value: this.settings.graphics.colorGradingPreset,
                options: [
                    { value: 'cinematic', text: 'Cinematic' },
                    { value: 'vibrant', text: 'Vibrant' },
                    { value: 'warm', text: 'Warm' },
                    { value: 'cool', text: 'Cool' },
                    { value: 'noir', text: 'Film Noir' }
                ],
                onChange: (value) => this.setSetting('graphics', 'colorGradingPreset', value)
            },
            
            { 
                type: 'checkbox', 
                label: '🌫️ Volumetric Fog (Difficulty: ⭐⭐⭐) - Realistic atmospheric fog | 📍 Best for: Regular Mode | Skip for: Pacman, Battle', 
                value: this.settings.graphics.enableVolumetricFog,
                onChange: (value) => this.setSetting('graphics', 'enableVolumetricFog', value)
            },
            { 
                type: 'select', 
                label: 'Volumetric Fog Quality', 
                value: this.settings.graphics.volumetricFogQuality,
                options: [
                    { value: 'low', text: 'Low (Performance)' },
                    { value: 'medium', text: 'Medium' },
                    { value: 'high', text: 'High (Quality)' }
                ],
                onChange: (value) => this.setSetting('graphics', 'volumetricFogQuality', value)
            },
            { 
                type: 'slider', 
                label: 'Fog Density', 
                value: this.settings.graphics.volumetricFogDensity,
                min: 10,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'volumetricFogDensity', value)
            },
            { 
                type: 'slider', 
                label: 'Light Scattering', 
                value: this.settings.graphics.volumetricFogScattering,
                min: 10,
                max: 100,
                onChange: (value) => this.setSetting('graphics', 'volumetricFogScattering', value)
            },
            
            { 
                type: 'checkbox', 
                label: '✨ Enhanced Particle Effects (Difficulty: ⭐⭐☆) - Beautiful particles | 📍 Great for: All Modes', 
                value: this.settings.graphics.enableParticleEffects,
                onChange: (value) => this.setSetting('graphics', 'enableParticleEffects', value)
            },
            { 
                type: 'select', 
                label: 'Particle Quality', 
                value: this.settings.graphics.particleQuality,
                options: [
                    { value: 'low', text: 'Low' },
                    { value: 'medium', text: 'Medium' },
                    { value: 'high', text: 'High' },
                    { value: 'ultra', text: 'Ultra' }
                ],
                onChange: (value) => this.setSetting('graphics', 'particleQuality', value)
            },
            
            { 
                type: 'checkbox', 
                label: '💡 Dynamic Lighting (Difficulty: ⭐⭐⭐) - Advanced light physics | 📍 Best for: Regular Mode | Optional: Battle | Skip for: Pacman', 
                value: this.settings.graphics.enableDynamicLighting,
                onChange: (value) => this.setSetting('graphics', 'enableDynamicLighting', value)
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
                
            case 'header':
                const headerElement = document.createElement('h4');
                headerElement.textContent = control.label;
                headerElement.style.cssText = `
                    color: #ffff00;
                    margin: 20px 0 15px 0;
                    font-size: 16px;
                    font-weight: bold;
                    text-shadow: 3px 3px 0px #ff00ff, 5px 5px 0px #000000;
                    letter-spacing: 2px;
                    text-align: center;
                    background: rgba(255, 255, 0, 0.1);
                    padding: 10px;
                    border-radius: 8px;
                    border: 2px solid rgba(255, 255, 0, 0.3);
                `;
                
                container.appendChild(headerElement);
                break;
                
            case 'button':
                const buttonElement = document.createElement('button');
                buttonElement.textContent = control.label;
                buttonElement.style.cssText = `
                    width: 100%;
                    background: linear-gradient(135deg, #006600 0%, #00cc00 100%);
                    border: 2px solid #00ff88;
                    color: #ffffff;
                    padding: 12px 20px;
                    font-size: 14px;
                    font-weight: bold;
                    font-family: 'Courier New', monospace;
                    border-radius: 6px;
                    cursor: pointer;
                    text-shadow: 2px 2px 0px #000000;
                    letter-spacing: 1px;
                    transition: all 0.3s ease;
                    margin: 5px 0;
                `;
                
                buttonElement.addEventListener('mouseenter', () => {
                    buttonElement.style.background = 'linear-gradient(135deg, #cc6600 0%, #ff9900 100%)';
                    buttonElement.style.transform = 'scale(1.02)';
                });
                
                buttonElement.addEventListener('mouseleave', () => {
                    buttonElement.style.background = 'linear-gradient(135deg, #006600 0%, #00cc00 100%)';
                    buttonElement.style.transform = 'scale(1)';
                });
                
                buttonElement.addEventListener('click', control.onClick);
                
                container.appendChild(buttonElement);
                break;
                
            case 'text':
                const textElement = document.createElement('div');
                textElement.textContent = control.label;
                textElement.style.cssText = `
                    color: #cccccc;
                    font-size: 13px;
                    margin: 10px 0;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.3);
                    border-left: 4px solid #00ffff;
                    border-radius: 4px;
                    text-shadow: 1px 1px 0px #000000;
                    line-height: 1.4;
                `;
                
                container.appendChild(textElement);
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
                enableAntiAliasing: true,
                enableSSR: false,
                ssrIntensity: 50,
                ssrMaxDistance: 30,
                ssrThickness: 0.5,
                // Advanced Graphics Effects
                enableBloom: false,
                bloomIntensity: 30,
                bloomThreshold: 85,
                bloomRadius: 40,
                enableSSAO: false,
                ssaoIntensity: 50,
                ssaoRadius: 20,
                enableGodRays: false,
                godRaysIntensity: 40,
                godRaysExposure: 25,
                enableMotionBlur: false,
                motionBlurStrength: 30,
                enableDOF: false,
                dofFocus: 50,
                dofBlur: 20,
                enableFilmGrain: false,
                filmGrainIntensity: 15,
                enableVignette: false,
                vignetteIntensity: 25,
                enableChromaticAberration: false,
                chromaticIntensity: 10,
                enableColorGrading: false,
                colorGradingPreset: 'cinematic',
                enableVolumetricFog: true,
                volumetricFogQuality: 'medium',
                volumetricFogDensity: 50,
                volumetricFogScattering: 50,
                enableParticleEffects: true,
                particleQuality: 'medium',
                enableDynamicLighting: false
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