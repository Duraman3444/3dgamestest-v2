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
            this.animate();
        }
    }
    
    stop() {
        this.isRunning = false;
    }
    
    animate(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
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
        // Update player
        if (this.systems.player) {
            this.systems.player.update(deltaTime);
        }
        
        // Update camera system
        if (this.systems.cameraSystem) {
            this.systems.cameraSystem.update(deltaTime);
        }
        
        // Update grid manager
        if (this.systems.gridManager) {
            this.systems.gridManager.update(deltaTime);
        }
        
        // Handle collisions
        if (this.systems.collisionSystem) {
            this.systems.collisionSystem.update(deltaTime);
        }
        
        // Update UI
        if (this.systems.uiManager) {
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
                ghostPositions: this.systems.gridManager ? this.systems.gridManager.getGhostPositions() : []
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