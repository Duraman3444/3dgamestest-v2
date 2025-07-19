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
    
    // Comprehensive settings presets
    getPresets() {
        return {
            performance: {
                name: '🏃‍♂️ Performance',
                description: 'Maximum FPS for competitive gaming',
                settings: {
                    graphics: {
                        quality: 'low',
                        enableShadows: false,
                        enableFog: false,
                        enableAntiAliasing: false,
                        enableSSR: false,
                        enableBloom: false,
                        enableSSAO: false,
                        enableGodRays: false,
                        enableMotionBlur: false,
                        enableDOF: false,
                        enableFilmGrain: false,
                        enableVignette: false,
                        enableChromaticAberration: false,
                        enableColorGrading: false,
                        enableVolumetricFog: false,
                        particleQuality: 'low',
                        enableParticleEffects: true,
                        enableDynamicLighting: false
                    },
                    audio: {
                        masterVolume: 80,
                        musicVolume: 20,
                        sfxVolume: 100
                    }
                }
            },
            balanced: {
                name: '⚖️ Balanced',
                description: 'Good balance of quality and performance',
                settings: {
                    graphics: {
                        quality: 'medium',
                        enableShadows: true,
                        enableFog: true,
                        enableAntiAliasing: true,
                        enableSSR: false,
                        enableBloom: true,
                        bloomIntensity: 25,
                        enableSSAO: false,
                        enableGodRays: false,
                        enableMotionBlur: true,
                        motionBlurStrength: 20,
                        enableDOF: false,
                        enableFilmGrain: false,
                        enableVignette: false,
                        enableChromaticAberration: false,
                        enableColorGrading: true,
                        colorGradingPreset: 'cinematic',
                        enableVolumetricFog: true,
                        volumetricFogQuality: 'medium',
                        particleQuality: 'medium',
                        enableParticleEffects: true,
                        enableDynamicLighting: false
                    },
                    audio: {
                        masterVolume: 60,
                        musicVolume: 40,
                        sfxVolume: 80
                    }
                }
            },
            quality: {
                name: '💎 Maximum Quality',
                description: 'Best visuals for high-end systems',
                settings: {
                    graphics: {
                        quality: 'high',
                        enableShadows: true,
                        enableFog: true,
                        enableAntiAliasing: true,
                        enableSSR: true,
                        ssrIntensity: 70,
                        enableBloom: true,
                        bloomIntensity: 40,
                        enableSSAO: true,
                        ssaoIntensity: 60,
                        enableGodRays: true,
                        godRaysIntensity: 50,
                        enableMotionBlur: true,
                        motionBlurStrength: 35,
                        enableDOF: true,
                        dofFocus: 50,
                        enableFilmGrain: true,
                        filmGrainIntensity: 20,
                        enableVignette: true,
                        vignetteIntensity: 30,
                        enableChromaticAberration: true,
                        chromaticIntensity: 15,
                        enableColorGrading: true,
                        colorGradingPreset: 'cinematic',
                        enableVolumetricFog: true,
                        volumetricFogQuality: 'high',
                        particleQuality: 'high',
                        enableParticleEffects: true,
                        enableDynamicLighting: true
                    },
                    audio: {
                        masterVolume: 50,
                        musicVolume: 35,
                        sfxVolume: 70
                    }
                }
            },
            retro: {
                name: '🕹️ Retro Arcade',
                description: 'Optimized for Pacman mode with retro effects',
                settings: {
                    graphics: {
                        quality: 'medium',
                        enableShadows: true,
                        enableFog: false,
                        enableAntiAliasing: true,
                        enableSSR: false,
                        enableBloom: true,
                        bloomIntensity: 45,
                        enableSSAO: false,
                        enableGodRays: false,
                        enableMotionBlur: true,
                        motionBlurStrength: 25,
                        enableDOF: false,
                        enableFilmGrain: true,
                        filmGrainIntensity: 30,
                        enableVignette: true,
                        vignetteIntensity: 35,
                        enableChromaticAberration: true,
                        chromaticIntensity: 20,
                        enableColorGrading: true,
                        colorGradingPreset: 'vibrant',
                        enableVolumetricFog: false,
                        particleQuality: 'medium',
                        enableParticleEffects: true,
                        enableDynamicLighting: false
                    },
                    audio: {
                        masterVolume: 70,
                        musicVolume: 60,
                        sfxVolume: 90
                    }
                }
            },
            cinematic: {
                name: '🎬 Cinematic',
                description: 'Movie-like visuals for single player',
                settings: {
                    graphics: {
                        quality: 'high',
                        enableShadows: true,
                        enableFog: true,
                        enableAntiAliasing: true,
                        enableSSR: true,
                        ssrIntensity: 60,
                        enableBloom: true,
                        bloomIntensity: 30,
                        enableSSAO: true,
                        ssaoIntensity: 55,
                        enableGodRays: true,
                        godRaysIntensity: 45,
                        enableMotionBlur: true,
                        motionBlurStrength: 30,
                        enableDOF: true,
                        dofFocus: 50,
                        dofBlur: 25,
                        enableFilmGrain: true,
                        filmGrainIntensity: 15,
                        enableVignette: false,
                        enableChromaticAberration: false,
                        enableColorGrading: true,
                        colorGradingPreset: 'cinematic',
                        enableVolumetricFog: true,
                        volumetricFogQuality: 'high',
                        particleQuality: 'high',
                        enableParticleEffects: true,
                        enableDynamicLighting: true
                    },
                    audio: {
                        masterVolume: 45,
                        musicVolume: 50,
                        sfxVolume: 60
                    }
                }
            },
            competitive: {
                name: '⚔️ Battle/Competitive',
                description: 'Clear visibility for multiplayer battles',
                settings: {
                    graphics: {
                        quality: 'medium',
                        enableShadows: true,
                        enableFog: false,
                        enableAntiAliasing: true,
                        enableSSR: false,
                        enableBloom: false,
                        enableSSAO: false,
                        enableGodRays: false,
                        enableMotionBlur: false,
                        enableDOF: false,
                        enableFilmGrain: false,
                        enableVignette: false,
                        enableChromaticAberration: false,
                        enableColorGrading: false,
                        enableVolumetricFog: false,
                        particleQuality: 'medium',
                        enableParticleEffects: true,
                        enableDynamicLighting: false
                    },
                    audio: {
                        masterVolume: 85,
                        musicVolume: 15,
                        sfxVolume: 100
                    },
                    ui: {
                        showFPS: true,
                        showMinimap: true,
                        showCrosshair: true
                    }
                }
            }
        };
    }
    
    applyPreset(presetName) {
        const presets = this.getPresets();
        const preset = presets[presetName];
        
        if (!preset) {
            console.error(`Preset "${presetName}" not found`);
            return false;
        }
        
        // Apply all settings from the preset
        Object.keys(preset.settings).forEach(category => {
            Object.keys(preset.settings[category]).forEach(key => {
                this.setSetting(category, key, preset.settings[category][key]);
            });
        });
        
        console.log(`✨ Applied "${preset.name}" preset!`);
        this.showNotice(`✨ ${preset.name} preset applied!\n${preset.description}`, null, 3000);
        return true;
    }
    
    // Legacy mode-specific presets (kept for compatibility)
    applyPacmanPreset() {
        this.applyPreset('retro');
    }
    
    applyRegularPreset() {
        this.applyPreset('cinematic');
    }
    
    applyBattlePreset() {
        this.applyPreset('competitive');
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
            z-index: 9999;
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
        
        // Settings Presets Section (at the top)
        const presetsSection = this.createPresetsSection();
        
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
                label: '💡 Tip: Use the Settings Presets section above for quick configuration!'
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
        contentContainer.appendChild(presetsSection);
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
        
        // CRITICAL: Add ESC key handler to prevent breaking the game
        const escKeyHandler = (event) => {
            if (event.key === 'Escape' && this.currentSettingsPanel) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                
                console.log('🎮 ESC pressed in settings - closing settings panel cleanly');
                this.closeSettings();
                if (onClose) onClose();
            }
        };
        
        // Add event listener with highest priority (capture phase)
        document.addEventListener('keydown', escKeyHandler, true);
        
        // Store the handler so we can remove it later
        settingsOverlay.escKeyHandler = escKeyHandler;
        
        document.body.appendChild(settingsOverlay);
        this.currentSettingsPanel = settingsOverlay;
        
        return settingsOverlay;
    }
    
    createPresetsSection() {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 30px;
            padding: 25px;
            background: linear-gradient(135deg, #1a0033 0%, #330066 50%, #660099 100%);
            border-radius: 12px;
            border: 3px solid #FFD700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        `;
        
        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = '⚡ SETTINGS PRESETS ⚡';
        sectionTitle.style.cssText = `
            color: #FFD700;
            margin-bottom: 15px;
            font-size: 20px;
            font-weight: bold;
            text-shadow: 3px 3px 0px #ff00ff, 6px 6px 0px #000000;
            letter-spacing: 3px;
            text-align: center;
            text-transform: uppercase;
        `;
        
        const description = document.createElement('div');
        description.textContent = 'Choose a preset to instantly configure all settings for your preferred gaming experience';
        description.style.cssText = `
            color: #FFFFFF;
            margin-bottom: 20px;
            font-size: 14px;
            text-align: center;
            line-height: 1.4;
            opacity: 0.9;
        `;
        
        // Create presets grid
        const presetsGrid = document.createElement('div');
        presetsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
        `;
        
        // Get all presets
        const presets = this.getPresets();
        
        // Create buttons for each preset
        Object.keys(presets).forEach(presetKey => {
            const preset = presets[presetKey];
            const button = document.createElement('button');
            button.style.cssText = `
                background: linear-gradient(135deg, #003366 0%, #0066cc 100%);
                border: 2px solid #00FFFF;
                color: #FFFFFF;
                padding: 15px 10px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                border-radius: 8px;
                transition: all 0.3s ease;
                text-align: center;
                font-family: 'Courier New', monospace;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
                min-height: 80px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            `;
            
            button.innerHTML = `
                <div style="font-size: 16px; margin-bottom: 5px;">${preset.name}</div>
                <div style="font-size: 11px; opacity: 0.8; text-transform: none; line-height: 1.2;">${preset.description}</div>
            `;
            
            // Add hover effects
            button.addEventListener('mouseenter', () => {
                button.style.background = 'linear-gradient(135deg, #0066cc 0%, #00aaff 100%)';
                button.style.transform = 'scale(1.05)';
                button.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.5)';
                
                // Play hover sound
                if (window.game && window.game.audioManager) {
                    window.game.audioManager.playMenuHoverSound();
                }
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = 'linear-gradient(135deg, #003366 0%, #0066cc 100%)';
                button.style.transform = 'scale(1)';
                button.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.3)';
            });
            
            // Add click handler
            button.addEventListener('click', () => {
                // Play click sound
                if (window.game && window.game.audioManager) {
                    window.game.audioManager.playMenuClickSound();
                }
                
                // Apply the preset
                this.applyPreset(presetKey);
                
                // Refresh the settings panel to show new values
                setTimeout(() => {
                    this.closeSettings();
                    this.createSettingsPanel();
                }, 1000);
            });
            
            presetsGrid.appendChild(button);
        });
        
        // Add warning note
        const warningNote = document.createElement('div');
        warningNote.textContent = '⚠️ Applying a preset will override your current settings';
        warningNote.style.cssText = `
            color: #FFFF00;
            font-size: 12px;
            text-align: center;
            font-style: italic;
            opacity: 0.8;
            margin-top: 10px;
        `;
        
        section.appendChild(sectionTitle);
        section.appendChild(description);
        section.appendChild(presetsGrid);
        section.appendChild(warningNote);
        
        return section;
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
            // CRITICAL: Clean up ESC key event listener
            if (this.currentSettingsPanel.escKeyHandler) {
                document.removeEventListener('keydown', this.currentSettingsPanel.escKeyHandler, true);
                console.log('🎮 Settings ESC key handler removed');
            }
            
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