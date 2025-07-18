export class GameLoop {
    constructor(renderer, scene, camera, systems) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.systems = systems;
        
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateInterval = 1000; // Update FPS every 1 second
        this.lastFpsUpdate = 0;
        
        // Bind the animate method to preserve 'this' context
        this.animate = this.animate.bind(this);
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.animate);
        }
    }
    
    stop() {
        this.isRunning = false;
    }
    
    animate(currentTime) {
        if (!this.isRunning) return;
        
        // Validate currentTime to prevent NaN
        if (isNaN(currentTime) || !isFinite(currentTime) || currentTime < 0) {
            console.warn('Invalid currentTime in animate:', currentTime);
            currentTime = this.lastTime || performance.now();
        }
        
        // Calculate delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        
        // Validate deltaTime to prevent NaN propagation
        if (isNaN(this.deltaTime) || !isFinite(this.deltaTime) || this.deltaTime < 0 || this.deltaTime > 1) {
            console.warn('Invalid deltaTime calculated:', this.deltaTime, 'currentTime:', currentTime, 'lastTime:', this.lastTime);
            this.deltaTime = 1/60; // Default to 60 FPS (16.67ms)
        }
        
        this.lastTime = currentTime;
        
        // Update FPS counter
        this.updateFPS(currentTime);
        
        // Update all systems
        this.update(this.deltaTime);
        
        // Render the scene
        this.render();
        
        // Continue the loop
        requestAnimationFrame(this.animate);
    }
    
    update(deltaTime) {
        // Update pacman timer if in pacman mode
        if (window.game && window.game.gameMode === 'pacman') {
            window.game.updatePacmanTimer(deltaTime);
        }
        
        // Update player
        if (this.systems.player) {
            this.systems.player.update(deltaTime);
            
            // Send multiplayer position updates
            if (window.game && window.game.isMultiplayerMode && window.game.multiplayerManager) {
                const position = this.systems.player.position;
                const velocity = this.systems.player.velocity;
                window.game.multiplayerManager.sendPlayerPosition(position, velocity);
            }
        }
        
        // Update camera system
        if (this.systems.cameraSystem) {
            this.systems.cameraSystem.update(deltaTime);
        }
        
        // Update skybox manager
        if (window.game && window.game.skyboxManager) {
            window.game.skyboxManager.update(deltaTime);
        }
        
        // Update graphics enhancer
        if (window.game && window.game.graphicsEnhancer) {
            window.game.graphicsEnhancer.update(deltaTime);
        }
        
        // Update grid manager
        if (this.systems.gridManager) {
            this.systems.gridManager.update(deltaTime);
        }
        
        // Handle collisions
        if (this.systems.collisionSystem) {
            this.systems.collisionSystem.update(deltaTime);
        }
        
        // Update battle system if in battle mode
        if (this.systems.battleSystem && this.systems.battleSystem.isActive) {
            this.systems.battleSystem.update(deltaTime);
        }
        
        // Update battle UI if in battle mode
        if (this.systems.battleUI && this.systems.battleSystem && this.systems.battleSystem.isActive) {
            this.systems.battleUI.update(deltaTime, {
                playerDamage: this.systems.battleSystem.playerDamage,
                botDamages: this.systems.battleSystem.bots.map(bot => bot.damage),
                currentLevel: this.systems.battleSystem.currentLevel,
                levelName: this.systems.battleSystem.levelConfigs[this.systems.battleSystem.currentLevel].name,
                roundTimer: Date.now() - this.systems.battleSystem.roundStartTime
            });
        }
        
        // Update multiplayer game modes
        if (window.game && window.game.multiplayerGameModes && window.game.isMultiplayerMode) {
            const playerPosition = this.systems.player ? this.systems.player.position : null;
            window.game.multiplayerGameModes.update(deltaTime, playerPosition);
        }
        
        // Update UI
        if (this.systems.uiManager && (!this.systems.battleSystem || !this.systems.battleSystem.isActive)) {
            this.systems.uiManager.update(deltaTime, {
                fps: this.fps,
                playerPosition: this.systems.player ? this.systems.player.position : null,
                playerHealth: this.systems.player ? this.systems.player.health : null,
                playerLives: this.systems.player ? this.systems.player.getLives() : 3,
                score: this.systems.collisionSystem ? this.systems.collisionSystem.getScore() : 0,
                collectibles: this.systems.gridManager ? this.systems.gridManager.getRemainingCollectibles() : 0,
                cameraMode: this.systems.cameraSystem ? this.systems.cameraSystem.getCameraMode() : 'firstPerson',
                keyInfo: this.systems.gridManager ? this.systems.gridManager.getKeyInfo() : { totalKeys: 0, collectedKeys: 0 },
                collectiblePositions: this.systems.gridManager ? this.systems.gridManager.getCollectiblePositions() : [],
                keyPosition: this.systems.gridManager ? this.systems.gridManager.getKeyPosition() : null,
                exitPosition: this.systems.gridManager ? this.systems.gridManager.getExitPosition() : null,
                ghostPositions: this.systems.gridManager ? this.systems.gridManager.getGhostPositions() : [],
                gameMode: window.game ? window.game.gameMode : 'normal',
                pacmanTimeRemaining: window.game && window.game.gameMode === 'pacman' ? window.game.pacmanTimeRemaining : null,
                pacmanFormattedTime: window.game && window.game.gameMode === 'pacman' ? window.game.getFormattedTimeRemaining() : null,
                isClassicMode: window.game ? window.game.isClassicMode : false,
                classicLives: window.game ? window.game.classicLives : null,
                classicWave: window.game ? window.game.classicWave : null,
                isMultiplayerMode: window.game ? window.game.isMultiplayerMode : false,
                multiplayerPlayers: window.game && window.game.multiplayerManager ? window.game.multiplayerManager.getOtherPlayers() : []
            });
        }
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }
    
    // Utility methods for managing game state
    pause() {
        this.isRunning = false;
    }
    
    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();
        }
    }
    
    // Method to add new systems dynamically
    addSystem(name, system) {
        this.systems[name] = system;
    }
    
    // Method to remove systems
    removeSystem(name) {
        delete this.systems[name];
    }
    
    // Get current FPS
    getFPS() {
        return this.fps;
    }
    
    // Get delta time
    getDeltaTime() {
        return this.deltaTime;
    }
} 