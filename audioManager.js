export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.currentGameMode = 'normal';
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
        this.isInitialized = false;
        this.backgroundMusic = null;
        this.soundProfiles = {};
        this.waitingForUserInteraction = false;
        this.userInteractionHandlerSet = false;
        
        // Initialize audio context
        this.initializeAudio();
    }
    
    async initializeAudio() {
        try {
            console.log('🎵 Starting audio initialization...');
            
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log(`🎵 Audio context created, state: ${this.audioContext.state}`);
            
            // Check if audio context is suspended (requires user interaction)
            if (this.audioContext.state === 'suspended') {
                console.log('🎵 Audio context suspended, waiting for user interaction...');
                this.waitingForUserInteraction = true;
                this.setupUserInteractionHandler();
                return;
            }
            
            // If context is running, complete initialization immediately
            if (this.audioContext.state === 'running') {
                console.log('🎵 Audio context is running, completing initialization...');
                await this.completeInitialization();
            } else {
                console.log('🎵 Audio context state is:', this.audioContext.state);
                this.setupUserInteractionHandler();
            }
            
        } catch (error) {
            console.error('Failed to initialize AudioManager:', error);
            this.isInitialized = false;
            this.showAudioInitMessage('🎵 Audio initialization failed - browser may not support Web Audio API', 'error');
        }
    }
    
    async completeInitialization() {
        try {
            console.log('🎵 Starting complete audio initialization...');
            
            // Set flags first to prevent issues if generation fails
            this.waitingForUserInteraction = false;
            
            // Create sound profiles for different game modes
            this.createSoundProfiles();
            console.log('🎵 Sound profiles created');
            
            // Generate procedural sounds for each profile
            try {
                await this.generateProceduralSounds();
                console.log('🎵 Procedural sounds generated');
            } catch (soundError) {
                console.warn('🎵 Failed to generate some sounds, but audio system will continue:', soundError);
                // Don't fail completely if sound generation has issues
            }
            
            this.isInitialized = true;
            console.log('🎵 AudioManager initialized successfully');
            
            // Show audio ready notification
            if (window.game && window.game.uiManager) {
                window.game.uiManager.showNotification('🎵 Audio System Ready!', 'success', 2000);
            } else {
                // If no UI manager, show our own notification
                this.showAudioInitMessage('🎵 Audio System Ready!', 'success');
            }
            
        } catch (error) {
            console.error('Failed to complete audio initialization:', error);
            this.isInitialized = false;
            this.waitingForUserInteraction = false; // Ensure flag is false
            this.showAudioInitMessage('🎵 Audio initialization failed', 'error');
        }
    }
    
    setupUserInteractionHandler() {
        // Prevent multiple handlers from being set up
        if (this.userInteractionHandlerSet) {
            return;
        }
        this.userInteractionHandlerSet = true;
        
        const handleUserInteraction = async (event) => {
            console.log('🎵 User interaction detected, attempting to initialize audio...');
            
            // Immediately set flag to false to prevent multiple attempts
            this.waitingForUserInteraction = false;
            
            // Remove the event listeners immediately to prevent multiple calls
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
            
            try {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                    console.log('🎵 Audio context resumed after user interaction');
                } else if (!this.audioContext) {
                    // Try to create audio context again
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    await this.audioContext.resume();
                    console.log('🎵 Audio context created and resumed');
                }
                
                // Complete initialization
                await this.completeInitialization();
                
                // Show success message
                this.showAudioInitMessage('🎵 Audio System Ready!', 'success');
                
            } catch (error) {
                console.error('Failed to initialize audio after user interaction:', error);
                this.showAudioInitMessage('🎵 Audio initialization failed', 'error');
                this.waitingForUserInteraction = false; // Ensure flag is false even on error
                this.isInitialized = false;
            }
        };
        
        // Add event listeners for user interaction
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);
        
        console.log('🎵 Waiting for user interaction to enable audio...');
        this.showAudioInitMessage('🎵 Click anywhere to enable audio', 'info');
    }
    
    showAudioInitMessage(message, type) {
        // Remove any existing audio messages
        const existingMessages = document.querySelectorAll('.audio-init-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const messageEl = document.createElement('div');
        messageEl.className = 'audio-init-message';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(0, 255, 0, 0.9)' : 
                        type === 'error' ? 'rgba(255, 0, 0, 0.9)' : 
                        'rgba(255, 255, 0, 0.9)'};
            color: ${type === 'error' ? 'white' : 'black'};
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 10000;
            pointer-events: none;
            font-family: 'Courier New', monospace;
            animation: fadeInOut 3s ease-in-out;
        `;
        
        // Add fade animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-10px); }
                10% { opacity: 1; transform: translateY(0); }
                90% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(messageEl);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (document.body.contains(messageEl)) {
                document.body.removeChild(messageEl);
            }
        }, 3000);
    }
    
    createSoundProfiles() {
        // PS2 Era Profile (Single Player)
        this.soundProfiles.ps2 = {
            // Synthesized orchestral/electronic sounds
            collect: { type: 'synthesized', waveform: 'sine', frequencies: [523, 659, 784], duration: 0.3, reverb: true },
            keyPickup: { type: 'synthesized', waveform: 'square', frequencies: [440, 554, 659, 784], duration: 0.5, reverb: true },
            levelComplete: { type: 'synthesized', waveform: 'triangle', frequencies: [523, 659, 784, 1047], duration: 1.2, reverb: true },
            death: { type: 'synthesized', waveform: 'sawtooth', frequencies: [220, 185, 147, 110], duration: 1.5, reverb: true, fade: true },
            jump: { type: 'synthesized', waveform: 'sine', frequencies: [294, 370], duration: 0.2, reverb: false },
            footstep: { type: 'noise', frequencies: [100, 200], duration: 0.1, reverb: false },
            teleport: { type: 'synthesized', waveform: 'sine', frequencies: [880, 1108, 1397], duration: 0.6, reverb: true },
            hit: { type: 'synthesized', waveform: 'sawtooth', frequencies: [150, 200], duration: 0.3, reverb: false },
            roll: { type: 'noise', frequencies: [50, 100], duration: 0.2, reverb: false },
            // Menu and UI sounds
            menuHover: { type: 'synthesized', waveform: 'sine', frequencies: [440], duration: 0.1, reverb: false },
            menuClick: { type: 'synthesized', waveform: 'square', frequencies: [523, 659], duration: 0.2, reverb: true },
            menuBack: { type: 'synthesized', waveform: 'sine', frequencies: [330, 294], duration: 0.3, reverb: true },
            pause: { type: 'synthesized', waveform: 'triangle', frequencies: [440, 523], duration: 0.4, reverb: true },
            resume: { type: 'synthesized', waveform: 'sine', frequencies: [523, 659], duration: 0.4, reverb: true },
            levelStart: { type: 'synthesized', waveform: 'triangle', frequencies: [392, 523, 659], duration: 0.8, reverb: true },
            ambientMusic: { type: 'ambient', tempo: 'slow', mood: 'atmospheric' }
        };
        
        // SNES Era Profile (Battle Mode)
        this.soundProfiles.snes = {
            // 16-bit style chiptune sounds
            collect: { type: 'chiptune', waveform: 'square', frequencies: [659, 784], duration: 0.2, bitCrush: true },
            keyPickup: { type: 'chiptune', waveform: 'square', frequencies: [523, 659, 784], duration: 0.4, bitCrush: true },
            levelComplete: { type: 'chiptune', waveform: 'square', frequencies: [523, 659, 784, 1047, 1319], duration: 1.0, bitCrush: true },
            death: { type: 'chiptune', waveform: 'square', frequencies: [294, 247, 220, 185], duration: 1.0, bitCrush: true },
            battle: { type: 'chiptune', waveform: 'square', frequencies: [440, 523, 659], duration: 0.3, bitCrush: true },
            victory: { type: 'chiptune', waveform: 'square', frequencies: [659, 784, 988, 1175], duration: 1.5, bitCrush: true },
            defeat: { type: 'chiptune', waveform: 'square', frequencies: [220, 185, 147], duration: 1.2, bitCrush: true },
            jump: { type: 'chiptune', waveform: 'square', frequencies: [440, 523], duration: 0.2, bitCrush: true },
            footstep: { type: 'noise', frequencies: [80, 160], duration: 0.1, bitCrush: true },
            teleport: { type: 'chiptune', waveform: 'square', frequencies: [880, 1108, 1397], duration: 0.6, bitCrush: true },
            hit: { type: 'chiptune', waveform: 'square', frequencies: [150, 200], duration: 0.3, bitCrush: true },
            roll: { type: 'noise', frequencies: [50, 100], duration: 0.2, bitCrush: true },
            // Menu and UI sounds
            menuHover: { type: 'chiptune', waveform: 'square', frequencies: [659], duration: 0.1, bitCrush: true },
            menuClick: { type: 'chiptune', waveform: 'square', frequencies: [784, 988], duration: 0.2, bitCrush: true },
            menuBack: { type: 'chiptune', waveform: 'square', frequencies: [523, 440], duration: 0.3, bitCrush: true },
            pause: { type: 'chiptune', waveform: 'square', frequencies: [523, 659], duration: 0.4, bitCrush: true },
            resume: { type: 'chiptune', waveform: 'square', frequencies: [659, 784], duration: 0.4, bitCrush: true },
            levelStart: { type: 'chiptune', waveform: 'square', frequencies: [523, 659, 784], duration: 0.8, bitCrush: true },
            battleMusic: { type: 'chiptune', tempo: 'upbeat', mood: 'energetic' }
        };
        
        // Arcade Era Profile (Pacman Mode)
        this.soundProfiles.arcade = {
            // Classic arcade sounds
            collect: { type: 'arcade', waveform: 'sine', frequencies: [659, 784], duration: 0.15, reverb: false },
            keyPickup: { type: 'arcade', waveform: 'square', frequencies: [523, 659, 784], duration: 0.3, reverb: false },
            levelComplete: { type: 'arcade', waveform: 'sine', frequencies: [523, 659, 784, 1047, 1319], duration: 1.2, reverb: false },
            death: { type: 'arcade', waveform: 'sawtooth', frequencies: [294, 247, 220, 185], duration: 1.0, reverb: false },
            jump: { type: 'arcade', waveform: 'sine', frequencies: [440, 523], duration: 0.2, reverb: false },
            footstep: { type: 'noise', frequencies: [80, 160], duration: 0.1, reverb: false },
            teleport: { type: 'arcade', waveform: 'sine', frequencies: [880, 1108, 1397], duration: 0.6, reverb: false },
            hit: { type: 'arcade', waveform: 'sawtooth', frequencies: [150, 200], duration: 0.3, reverb: false },
            roll: { type: 'noise', frequencies: [50, 100], duration: 0.2, reverb: false },
            // Pacman-specific sounds
            ghost: { type: 'arcade', waveform: 'square', frequencies: [110, 147, 185], duration: 0.4, reverb: false },
            powerPellet: { type: 'arcade', waveform: 'sine', frequencies: [220, 277, 330, 392], duration: 0.8, reverb: false },
            siren: { type: 'arcade', waveform: 'sawtooth', frequencies: [185, 220, 247, 294], duration: 2.0, reverb: false },
            // Menu and UI sounds
            menuHover: { type: 'arcade', waveform: 'sine', frequencies: [659], duration: 0.1, reverb: false },
            menuClick: { type: 'arcade', waveform: 'sine', frequencies: [784, 988], duration: 0.2, reverb: false },
            menuBack: { type: 'arcade', waveform: 'sine', frequencies: [523, 440], duration: 0.3, reverb: false },
            pause: { type: 'arcade', waveform: 'sine', frequencies: [523, 659], duration: 0.4, reverb: false },
            resume: { type: 'arcade', waveform: 'sine', frequencies: [659, 784], duration: 0.4, reverb: false },
            levelStart: { type: 'arcade', waveform: 'sine', frequencies: [523, 659, 784], duration: 0.8, reverb: false },
            pacmanMusic: { type: 'arcade', tempo: 'medium', mood: 'nostalgic' }
        };
    }
    
    async generateProceduralSounds() {
        if (!this.audioContext) return;
        
        for (const [profileName, profile] of Object.entries(this.soundProfiles)) {
            this.sounds[profileName] = {};
            
            for (const [soundName, config] of Object.entries(profile)) {
                try {
                    if (config.type === 'synthesized') {
                        this.sounds[profileName][soundName] = this.createSynthesizedSound(config);
                    } else if (config.type === 'chiptune') {
                        this.sounds[profileName][soundName] = this.createChiptuneSound(config);
                    } else if (config.type === 'arcade') {
                        this.sounds[profileName][soundName] = this.createArcadeSound(config);
                    } else if (config.type === 'noise') {
                        this.sounds[profileName][soundName] = this.createNoiseSound(config);
                    }
                } catch (error) {
                    console.warn(`Failed to create sound ${soundName} for profile ${profileName}:`, error);
                    // Create a silent fallback sound
                    this.sounds[profileName][soundName] = this.createSilentSound(0.1);
                }
            }
        }
        
        console.log('🎵 Generated procedural sounds for all profiles');
    }
    
    createSynthesizedSound(config) {
        // Validate duration
        const duration = Math.max(0.1, config.duration || 0.3);
        const bufferLength = Math.max(1, Math.floor(this.audioContext.sampleRate * duration));
        
        const audioBuffer = this.audioContext.createBuffer(1, bufferLength, this.audioContext.sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            let sample = 0;
            const time = i / this.audioContext.sampleRate;
            
            // Create complex waveform with multiple frequencies
            const frequencies = config.frequencies || [440]; // Default to A4 if no frequencies
            frequencies.forEach((freq, index) => {
                const amplitude = 1 / (index + 1); // Harmonic decay
                sample += amplitude * this.generateWaveform(config.waveform, freq, time);
            });
            
            // Apply envelope
            const envelope = this.createEnvelope(time, duration, config.fade);
            sample *= envelope;
            
            // Apply reverb simulation
            if (config.reverb) {
                sample += sample * 0.3 * Math.sin(time * 1000) * 0.1;
            }
            
            channelData[i] = sample * 0.3;
        }
        
        return audioBuffer;
    }
    
    createChiptuneSound(config) {
        // Validate duration
        const duration = Math.max(0.1, config.duration || 0.3);
        const bufferLength = Math.max(1, Math.floor(this.audioContext.sampleRate * duration));
        
        const audioBuffer = this.audioContext.createBuffer(1, bufferLength, this.audioContext.sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            let sample = 0;
            const time = i / this.audioContext.sampleRate;
            
            // Create square wave with duty cycle
            const frequencies = config.frequencies || [440]; // Default to A4 if no frequencies
            frequencies.forEach((freq, index) => {
                const amplitude = 1 / (index + 1);
                sample += amplitude * this.generateSquareWave(freq, time, 0.5);
            });
            
            // Apply envelope
            const envelope = this.createEnvelope(time, duration);
            sample *= envelope;
            
            // Apply bit crushing effect
            if (config.bitCrush) {
                sample = Math.round(sample * 15) / 15;
            }
            
            channelData[i] = sample * 0.4;
        }
        
        return audioBuffer;
    }
    
    createArcadeSound(config) {
        // Validate duration
        const duration = Math.max(0.1, config.duration || 0.3);
        const bufferLength = Math.max(1, Math.floor(this.audioContext.sampleRate * duration));
        
        const audioBuffer = this.audioContext.createBuffer(1, bufferLength, this.audioContext.sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            let sample = 0;
            const time = i / this.audioContext.sampleRate;
            
            // Create pure sine waves for classic arcade feel
            const frequencies = config.frequencies || [440]; // Default to A4 if no frequencies
            frequencies.forEach((freq, index) => {
                const amplitude = 1 / Math.sqrt(index + 1);
                sample += amplitude * this.generateWaveform(config.waveform, freq, time);
            });
            
            // Apply envelope with sharp attack
            const envelope = this.createSharpEnvelope(time, duration);
            sample *= envelope;
            
            // Add slight distortion for authenticity
            sample = Math.tanh(sample * 2) * 0.5;
            
            channelData[i] = sample * 0.5;
        }
        
        return audioBuffer;
    }
    
    createNoiseSound(config) {
        // Validate duration
        const duration = Math.max(0.1, config.duration || 0.3);
        const bufferLength = Math.max(1, Math.floor(this.audioContext.sampleRate * duration));
        
        const audioBuffer = this.audioContext.createBuffer(1, bufferLength, this.audioContext.sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            const time = i / this.audioContext.sampleRate;
            
            // Generate filtered noise
            let sample = (Math.random() * 2 - 1);
            
            // Apply low-pass filter for footsteps
            const frequencies = config.frequencies || [100]; // Default frequency if not specified
            const cutoff = frequencies[0] / this.audioContext.sampleRate;
            sample *= Math.exp(-time * cutoff * 10);
            
            const envelope = this.createEnvelope(time, duration);
            sample *= envelope;
            
            channelData[i] = sample * 0.2;
        }
        
        return audioBuffer;
    }
    
    createSilentSound(duration) {
        // Create a silent sound as fallback
        const bufferLength = Math.max(1, Math.floor(this.audioContext.sampleRate * duration));
        const audioBuffer = this.audioContext.createBuffer(1, bufferLength, this.audioContext.sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Fill with silence (zeros)
        for (let i = 0; i < channelData.length; i++) {
            channelData[i] = 0;
        }
        
        return audioBuffer;
    }
    
    generateWaveform(type, frequency, time) {
        const phase = 2 * Math.PI * frequency * time;
        
        switch (type) {
            case 'sine':
                return Math.sin(phase);
            case 'square':
                return Math.sign(Math.sin(phase));
            case 'triangle':
                return 2 * Math.abs(2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5))) - 1;
            case 'sawtooth':
                return 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
            default:
                return Math.sin(phase);
        }
    }
    
    generateSquareWave(frequency, time, dutyCycle = 0.5) {
        const phase = (frequency * time) % 1;
        return phase < dutyCycle ? 1 : -1;
    }
    
    createEnvelope(time, duration, fade = false) {
        const attack = 0.02;
        const decay = 0.1;
        const sustain = 0.7;
        const release = fade ? duration * 0.5 : 0.1;
        
        if (time < attack) {
            return time / attack;
        } else if (time < attack + decay) {
            return 1 - (1 - sustain) * (time - attack) / decay;
        } else if (time < duration - release) {
            return sustain;
        } else {
            return sustain * (duration - time) / release;
        }
    }
    
    createSharpEnvelope(time, duration) {
        const attack = 0.005;
        const release = 0.05;
        
        if (time < attack) {
            return time / attack;
        } else if (time < duration - release) {
            return 1;
        } else {
            return (duration - time) / release;
        }
    }
    
    setGameMode(mode) {
        this.currentGameMode = mode;
        
        // Stop current background music
        this.stopBackgroundMusic();
        
        // Set appropriate sound profile
        let profile;
        if (mode === 'battle') {
            profile = 'snes';
        } else if (mode === 'pacman' || mode === 'pacman_classic') {
            profile = 'arcade';
        } else {
            profile = 'ps2';
        }
        
        this.currentProfile = profile;
        console.log(`🎵 Audio profile set to: ${profile} for game mode: ${mode}`);
        
        // Start background music for the mode
        this.startBackgroundMusic();
    }
    
    playSound(soundName, volume = 1.0) {
        if (!this.isInitialized || !this.audioContext) {
            if (this.waitingForUserInteraction) {
                console.log(`🎵 Audio waiting for user interaction, skipping sound: ${soundName}`);
                return;
            } else {
                console.log(`🎵 Audio not ready, attempting to initialize for sound: ${soundName}`);
                // Try to initialize audio
                this.initializeAudio();
                return;
            }
        }
        
        // Additional check for audio context state
        if (this.audioContext.state === 'suspended') {
            console.log(`🎵 Audio context suspended, attempting to resume for sound: ${soundName}`);
            this.audioContext.resume().then(() => {
                console.log('🎵 Audio context resumed, retrying sound playback');
                this.playSound(soundName, volume);
            }).catch(error => {
                console.error('Failed to resume audio context:', error);
            });
            return;
        }
        
        // Check if audio context is suspended
        if (this.audioContext.state === 'suspended') {
            console.log(`🎵 Audio context suspended, skipping sound: ${soundName}`);
            return;
        }
        
        const profile = this.currentProfile || 'ps2';
        const soundBuffer = this.sounds[profile]?.[soundName];
        
        if (!soundBuffer) {
            console.warn(`Sound '${soundName}' not found in profile '${profile}'`);
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = soundBuffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Set volume
            gainNode.gain.value = volume * this.sfxVolume * this.masterVolume;
            
            source.start();
            console.log(`🎵 Playing sound: ${soundName} (${profile} profile)`);
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
    
    showSoundFeedback(soundName) {
        // Create a small visual indicator when sounds play
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 255, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            font-family: monospace;
        `;
        indicator.textContent = `🔊 ${soundName}`;
        document.body.appendChild(indicator);
        
        // Remove after 1 second
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                document.body.removeChild(indicator);
            }
        }, 1000);
    }
    
    startBackgroundMusic() {
        if (!this.isInitialized) return;
        
        // Generate and play background music based on current profile
        const profile = this.currentProfile || 'ps2';
        this.generateAndPlayBackgroundMusic(profile);
    }
    
    generateAndPlayBackgroundMusic(profile) {
        // Create ambient background music
        const musicConfig = this.soundProfiles[profile];
        
        try {
            if (profile === 'ps2') {
                this.createPS2BackgroundMusic();
            } else if (profile === 'snes') {
                this.createSNESBackgroundMusic();
            } else if (profile === 'arcade') {
                this.createArcadeBackgroundMusic();
            }
        } catch (error) {
            console.warn(`Failed to create background music for profile ${profile}:`, error);
        }
    }
    
    createPS2BackgroundMusic() {
        // Create atmospheric PS2-style background music
        const duration = 30; // 30 second loop
        const bufferLength = Math.max(1, Math.floor(this.audioContext.sampleRate * duration));
        const audioBuffer = this.audioContext.createBuffer(1, bufferLength, this.audioContext.sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            const time = i / this.audioContext.sampleRate;
            
            // Create layered ambient sounds
            let sample = 0;
            sample += 0.1 * Math.sin(2 * Math.PI * 110 * time); // Deep bass
            sample += 0.05 * Math.sin(2 * Math.PI * 220 * time * (1 + 0.1 * Math.sin(time * 0.5))); // Modulated tone
            sample += 0.03 * Math.sin(2 * Math.PI * 330 * time * (1 + 0.2 * Math.sin(time * 0.3))); // Higher harmony
            
            // Add reverb simulation
            sample += sample * 0.2 * Math.sin(time * 100) * 0.1;
            
            channelData[i] = sample;
        }
        
        this.playBackgroundLoop(audioBuffer);
    }
    
    createSNESBackgroundMusic() {
        // Create energetic SNES-style chiptune music
        const duration = 20; // 20 second loop
        const bufferLength = Math.max(1, Math.floor(this.audioContext.sampleRate * duration));
        const audioBuffer = this.audioContext.createBuffer(1, bufferLength, this.audioContext.sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            const time = i / this.audioContext.sampleRate;
            
            // Create chiptune melody
            let sample = 0;
            const beat = Math.floor(time * 4) % 8; // 8-beat pattern
            
            // Bass line
            const bassFreq = beat % 2 === 0 ? 110 : 147;
            sample += 0.2 * this.generateSquareWave(bassFreq, time, 0.3);
            
            // Melody
            const melodyFreqs = [440, 494, 523, 587, 659, 523, 440, 392];
            const melodyFreq = melodyFreqs[beat];
            sample += 0.15 * this.generateSquareWave(melodyFreq, time, 0.5);
            
            // Harmony
            sample += 0.1 * this.generateSquareWave(melodyFreq * 1.5, time, 0.7);
            
            // Bit crush
            sample = Math.round(sample * 15) / 15;
            
            channelData[i] = sample;
        }
        
        this.playBackgroundLoop(audioBuffer);
    }
    
    createArcadeBackgroundMusic() {
        // Create classic arcade ambient sound
        const duration = 15; // 15 second loop
        const bufferLength = Math.max(1, Math.floor(this.audioContext.sampleRate * duration));
        const audioBuffer = this.audioContext.createBuffer(1, bufferLength, this.audioContext.sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < channelData.length; i++) {
            const time = i / this.audioContext.sampleRate;
            
            // Create pulsing arcade ambience
            let sample = 0;
            sample += 0.1 * Math.sin(2 * Math.PI * 200 * time); // Base tone
            sample += 0.05 * Math.sin(2 * Math.PI * 400 * time * (1 + 0.5 * Math.sin(time * 2))); // Siren effect
            sample += 0.03 * Math.sin(2 * Math.PI * 800 * time * (1 + 0.3 * Math.sin(time * 3))); // High frequency
            
            // Add classic arcade pulse
            if (Math.floor(time * 2) % 2 === 0) {
                sample *= 0.8;
            }
            
            channelData[i] = sample;
        }
        
        this.playBackgroundLoop(audioBuffer);
    }
    
    playBackgroundLoop(audioBuffer) {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.loop = true;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.value = this.musicVolume * this.masterVolume * 0.3;
        
        source.start();
        this.backgroundMusic = source;
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
            this.backgroundMusic = null;
        }
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        // Update background music volume
        if (this.backgroundMusic) {
            this.stopBackgroundMusic();
            this.startBackgroundMusic();
        }
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        // Update background music volume
        if (this.backgroundMusic) {
            this.stopBackgroundMusic();
            this.startBackgroundMusic();
        }
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    // Game event sound methods
    playCollectSound() {
        this.playSound('collect', 0.6);
    }
    
    playKeyPickupSound() {
        this.playSound('keyPickup', 0.8);
    }
    
    playLevelCompleteSound() {
        this.playSound('levelComplete', 1.0);
    }
    
    playDeathSound() {
        this.playSound('death', 0.9);
    }
    
    playJumpSound() {
        this.playSound('jump', 0.5);
    }
    
    playFootstepSound() {
        this.playSound('footstep', 0.3);
    }
    
    playBattleSound() {
        this.playSound('battle', 0.7);
    }
    
    playVictorySound() {
        this.playSound('victory', 1.0);
    }
    
    playHighScoreSound() {
        // Play a celebratory high score sound
        this.playSound('victory', 1.0);
    }
    
    playSuccessSound() {
        // Play a success sound for score submission
        this.playSound('powerUp', 0.8);
    }
    
    playDefeatSound() {
        this.playSound('defeat', 0.8);
    }
    
    playGhostSound() {
        this.playSound('ghost', 0.6);
    }
    
    playPowerPelletSound() {
        this.playSound('powerPellet', 0.5);
    }
    
    playSirenSound() {
        this.playSound('siren', 0.4);
    }
    
    // Menu and UI sound methods
    playMenuHoverSound() {
        this.playSound('menuHover', 0.5);
    }
    
    playMenuClickSound() {
        this.playSound('menuClick', 0.7);
    }
    
    playMenuBackSound() {
        this.playSound('menuBack', 0.6);
    }
    
    playPauseSound() {
        this.playSound('pause', 0.8);
    }
    
    playResumeSound() {
        this.playSound('resume', 0.8);
    }
    
    playLevelStartSound() {
        this.playSound('levelStart', 0.9);
    }
    
    playTeleportSound() {
        this.playSound('teleport', 0.8);
    }
    
    playHitSound() {
        this.playSound('hit', 0.7);
    }
    
    playRollSound() {
        this.playSound('roll', 0.4);
    }
    
    // Manual audio initialization (can be called from UI)
    async manualInitialize() {
        console.log('🎵 Manual audio initialization requested...');
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            await this.completeInitialization();
            return true;
            
        } catch (error) {
            console.error('Manual audio initialization failed:', error);
            this.showAudioInitMessage('🎵 Audio initialization failed', 'error');
            return false;
        }
    }
    
    // Get audio status
    getAudioStatus() {
        if (!this.audioContext) {
            return { ready: false, message: 'Audio context not created' };
        }
        
        if (this.audioContext.state === 'suspended') {
            return { ready: false, message: 'Audio context suspended - click to enable' };
        }
        
        if (!this.isInitialized) {
            return { ready: false, message: 'Audio not initialized' };
        }
        
        return { ready: true, message: 'Audio ready' };
    }
    
    // Cleanup
    destroy() {
        console.log('🎵 AudioManager cleanup initiated...');
        
        // Stop background music
        this.stopBackgroundMusic();
        
        // Close audio context if it exists
        if (this.audioContext) {
            try {
                this.audioContext.close();
                console.log('🎵 Audio context closed');
            } catch (error) {
                console.warn('Error closing audio context:', error);
            }
        }
        
        // Clear all sounds
        this.sounds = {};
        this.soundProfiles = {};
        
        // Reset state
        this.isInitialized = false;
        this.waitingForUserInteraction = false;
        this.audioContext = null;
        this.backgroundMusic = null;
        this.currentProfile = null;
        
        // Remove any remaining audio messages
        const audioMessages = document.querySelectorAll('.audio-init-message');
        audioMessages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
        
        console.log('🎵 AudioManager destroyed');
    }
} 