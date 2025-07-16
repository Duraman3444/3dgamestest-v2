export class UIManager {
    constructor() {
        this.elements = {};
        this.isInitialized = false;
        this.animationFrameId = null;
        
        // Game state tracking
        this.gameState = {
            score: 0,
            health: 100,
            maxHealth: 100,
            collectibles: 0,
            fps: 0,
            position: { x: 0, y: 0, z: 0 },
            gameTime: 0,
            gameStartTime: performance.now()
        };
        
        // UI settings
        this.settings = {
            showFPS: true,
            showPosition: true,
            showHealth: true,
            showScore: true,
            showCollectibles: true,
            showInstructions: true
        };
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.setupUIElements();
        this.setupEventListeners();
        this.startUpdateLoop();
        
        this.isInitialized = true;
    }
    
    setupUIElements() {
        // Get existing UI elements from HTML
        this.elements.scoreElement = document.getElementById('score');
        this.elements.healthElement = document.getElementById('health');
        this.elements.instructionsElement = document.getElementById('instructions');
        this.elements.uiContainer = document.getElementById('ui');
        
        // Create additional UI elements
        this.createFPSCounter();
        this.createPositionDisplay();
        this.createCollectiblesCounter();
        this.createGameTimer();
        this.createCameraModeDisplay();
        this.createMinimap();
        this.createPauseMenu();
    }
    
    createFPSCounter() {
        const fpsElement = document.createElement('div');
        fpsElement.id = 'fps-counter';
        fpsElement.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            color: white;
            font-family: monospace;
            font-size: 12px;
            background: rgba(0, 0, 0, 0.5);
            padding: 5px;
            border-radius: 3px;
            z-index: 101;
        `;
        fpsElement.textContent = 'FPS: 0';
        document.body.appendChild(fpsElement);
        this.elements.fpsElement = fpsElement;
    }
    
    createPositionDisplay() {
        const positionElement = document.createElement('div');
        positionElement.id = 'position-display';
        positionElement.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 10px;
            color: white;
            font-family: monospace;
            font-size: 12px;
            background: rgba(0, 0, 0, 0.5);
            padding: 5px;
            border-radius: 3px;
            z-index: 101;
        `;
        positionElement.textContent = 'Position: (0, 0, 0)';
        document.body.appendChild(positionElement);
        this.elements.positionElement = positionElement;
    }
    
    createCollectiblesCounter() {
        const collectiblesElement = document.createElement('div');
        collectiblesElement.id = 'collectibles-counter';
        collectiblesElement.style.cssText = `
            position: absolute;
            top: 60px;
            left: 10px;
            color: #FFD700;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            z-index: 101;
        `;
        collectiblesElement.textContent = 'Collectibles: 0';
        document.body.appendChild(collectiblesElement);
        this.elements.collectiblesElement = collectiblesElement;
    }
    
    createGameTimer() {
        const timerElement = document.createElement('div');
        timerElement.id = 'game-timer';
        timerElement.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-family: Arial, sans-serif;
            font-size: 16px;
            font-weight: bold;
            z-index: 101;
        `;
        timerElement.textContent = 'Time: 00:00';
        document.body.appendChild(timerElement);
        this.elements.timerElement = timerElement;
    }
    
    createCameraModeDisplay() {
        const cameraModeElement = document.createElement('div');
        cameraModeElement.id = 'camera-mode';
        cameraModeElement.style.cssText = `
            position: absolute;
            top: 80px;
            left: 10px;
            color: #87CEEB;
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: bold;
            z-index: 101;
        `;
        cameraModeElement.textContent = 'Camera: First Person';
        document.body.appendChild(cameraModeElement);
        this.elements.cameraModeElement = cameraModeElement;
    }
    
    createMinimap() {
        const minimapContainer = document.createElement('div');
        minimapContainer.id = 'minimap';
        minimapContainer.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            width: 150px;
            height: 150px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid white;
            border-radius: 5px;
            z-index: 101;
        `;
        
        const minimapCanvas = document.createElement('canvas');
        minimapCanvas.width = 146;
        minimapCanvas.height = 146;
        minimapCanvas.style.cssText = `
            width: 100%;
            height: 100%;
            display: block;
        `;
        
        minimapContainer.appendChild(minimapCanvas);
        document.body.appendChild(minimapContainer);
        
        this.elements.minimapContainer = minimapContainer;
        this.elements.minimapCanvas = minimapCanvas;
        this.elements.minimapContext = minimapCanvas.getContext('2d');
    }
    
    createPauseMenu() {
        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pause-menu';
        pauseMenu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            display: none;
            z-index: 200;
        `;
        
        pauseMenu.innerHTML = `
            <h2>Game Paused</h2>
            <p>Press ESC to continue</p>
            <div style="margin-top: 20px;">
                <button onclick="this.parentElement.parentElement.style.display='none'">Resume</button>
                <button onclick="location.reload()">Restart</button>
            </div>
        `;
        
        document.body.appendChild(pauseMenu);
        this.elements.pauseMenu = pauseMenu;
    }
    
    setupEventListeners() {
        // Keyboard shortcuts for UI
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Escape':
                    this.togglePause();
                    break;
                case 'F1':
                    this.toggleFPS();
                    event.preventDefault();
                    break;
                case 'F2':
                    this.togglePosition();
                    event.preventDefault();
                    break;
                case 'F3':
                    this.toggleMinimap();
                    event.preventDefault();
                    break;
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateLayout();
        });
    }
    
    update(deltaTime, gameData) {
        if (!this.isInitialized) return;
        
        // Validate deltaTime to prevent NaN
        const validDeltaTime = (isNaN(deltaTime) || !isFinite(deltaTime)) ? 0 : deltaTime;
        
        // Update game state with validation
        this.gameState.fps = gameData.fps || 0;
        this.gameState.score = gameData.score || 0;
        this.gameState.health = gameData.playerHealth || 100;
        this.gameState.collectibles = gameData.collectibles || 0;
        this.gameState.cameraMode = gameData.cameraMode || 'firstPerson';
        
        // Update timer with validation
        if (validDeltaTime > 0 && validDeltaTime < 1) { // Reasonable deltaTime range
            this.gameState.gameTime += validDeltaTime;
        }
        
        // Update position with validation
        if (gameData.playerPosition && this.isValidPosition(gameData.playerPosition)) {
            this.gameState.position = {
                x: Math.round(gameData.playerPosition.x * 10) / 10,
                y: Math.round(gameData.playerPosition.y * 10) / 10,
                z: Math.round(gameData.playerPosition.z * 10) / 10
            };
        } else {
            // Keep last valid position or use default
            if (!this.gameState.position || !this.isValidPosition(this.gameState.position)) {
                this.gameState.position = { x: 0, y: 0, z: 0 };
            }
        }
        
        // Update UI elements
        this.updateUIElements();
        this.updateMinimap();
    }
    
    // Validate position object
    isValidPosition(position) {
        return position && 
               !isNaN(position.x) && !isNaN(position.y) && !isNaN(position.z) &&
               isFinite(position.x) && isFinite(position.y) && isFinite(position.z);
    }
    
    updateUIElements() {
        // Update score
        if (this.elements.scoreElement && this.settings.showScore) {
            this.elements.scoreElement.textContent = `Score: ${this.gameState.score}`;
        }
        
        // Update health
        if (this.elements.healthElement && this.settings.showHealth) {
            this.elements.healthElement.textContent = `Health: ${this.gameState.health}`;
            
            // Color health based on value
            const healthPercent = this.gameState.health / this.gameState.maxHealth;
            if (healthPercent > 0.6) {
                this.elements.healthElement.style.color = '#00ff00';
            } else if (healthPercent > 0.3) {
                this.elements.healthElement.style.color = '#ffff00';
            } else {
                this.elements.healthElement.style.color = '#ff0000';
            }
        }
        
        // Update FPS
        if (this.elements.fpsElement && this.settings.showFPS) {
            this.elements.fpsElement.textContent = `FPS: ${this.gameState.fps}`;
        }
        
        // Update position
        if (this.elements.positionElement && this.settings.showPosition) {
            const pos = this.gameState.position;
            this.elements.positionElement.textContent = `Position: (${pos.x}, ${pos.y}, ${pos.z})`;
        }
        
        // Update collectibles
        if (this.elements.collectiblesElement && this.settings.showCollectibles) {
            this.elements.collectiblesElement.textContent = `Collectibles: ${this.gameState.collectibles}`;
        }
        
        // Update camera mode
        if (this.elements.cameraModeElement) {
            const modeNames = {
                'firstPerson': 'First Person',
                'thirdPerson': 'Third Person',
                'isometric': 'Isometric'
            };
            const displayName = modeNames[this.gameState.cameraMode] || 'Unknown';
            this.elements.cameraModeElement.textContent = `Camera: ${displayName}`;
        }
        
        // Update timer with validation
        if (this.elements.timerElement) {
            const gameTime = isNaN(this.gameState.gameTime) ? 0 : this.gameState.gameTime;
            const minutes = Math.floor(gameTime / 60);
            const seconds = Math.floor(gameTime % 60);
            
            // Ensure values are valid numbers
            const displayMinutes = isNaN(minutes) ? 0 : Math.max(0, minutes);
            const displaySeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
            
            this.elements.timerElement.textContent = `Time: ${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateMinimap() {
        if (!this.elements.minimapContext) return;
        
        const ctx = this.elements.minimapContext;
        const canvas = this.elements.minimapCanvas;
        
        // Clear minimap
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid background
        ctx.fillStyle = 'rgba(0, 100, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw player position
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw player direction
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - 10);
        ctx.stroke();
    }
    
    togglePause() {
        if (this.elements.pauseMenu.style.display === 'none') {
            this.elements.pauseMenu.style.display = 'block';
            document.exitPointerLock();
        } else {
            this.elements.pauseMenu.style.display = 'none';
        }
    }
    
    toggleFPS() {
        this.settings.showFPS = !this.settings.showFPS;
        if (this.elements.fpsElement) {
            this.elements.fpsElement.style.display = this.settings.showFPS ? 'block' : 'none';
        }
    }
    
    togglePosition() {
        this.settings.showPosition = !this.settings.showPosition;
        if (this.elements.positionElement) {
            this.elements.positionElement.style.display = this.settings.showPosition ? 'block' : 'none';
        }
    }
    
    toggleMinimap() {
        this.settings.showMinimap = !this.settings.showMinimap;
        if (this.elements.minimapContainer) {
            this.elements.minimapContainer.style.display = this.settings.showMinimap ? 'block' : 'none';
        }
    }
    
    updateLayout() {
        // Handle responsive layout updates
        // This could be expanded for mobile support
    }
    
    startUpdateLoop() {
        // This is handled by the main game loop
        // No need for separate animation frame here
    }
    
    showMessage(message, duration = 3000) {
        const messageElement = document.createElement('div');
        messageElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 18px;
            text-align: center;
            z-index: 300;
        `;
        messageElement.textContent = message;
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, duration);
    }
    
    showNotification(text, type = 'info', duration = 2000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 300;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        notification.textContent = text;
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Remove created elements
        Object.values(this.elements).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        this.isInitialized = false;
    }
} 