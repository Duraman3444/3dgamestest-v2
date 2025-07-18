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
            lives: 3, // Always start with exactly 3 lives
            collectibles: 0,
            keyInfo: { totalKeys: 0, collectedKeys: 0 },
            fps: 0,
            position: { x: 0, y: 0, z: 0 },
            gameTime: 0,
            gameStartTime: performance.now()
        };
        
        // UI settings
        this.settings = {
            showFPS: true,
            showPosition: true,
            showScore: true,
            showCollectibles: true,
            showInstructions: true
        };
        
        // Notification system
        this.notification = {
            isActive: false,
            message: '',
            type: 'info', // 'info', 'success', 'warning', 'error'
            duration: 5000, // 5 seconds
            startTime: 0
        };
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) {
            console.warn('UIManager already initialized, skipping...');
            return;
        }
        
        // Clean up any existing UI elements first
        this.cleanupExistingElements();
        
        this.setupUIElements();
        this.setupEventListeners();
        this.startUpdateLoop();
        
        this.isInitialized = true;
        console.log('✅ UIManager initialized successfully');
    }
    
    cleanupExistingElements() {
        // Remove any existing UI elements that might interfere
        const existingElements = [
            'fps-counter',
            'position-display',
            'collectibles-counter',
            'keys-counter',
            'lives-counter',
            'game-timer',
            'camera-mode',
            'minimap',
            'pause-menu',
            'notification-system',
            'multiplayer-display',
            'classic-wave-display'
        ];
        
        existingElements.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.parentNode) {
                try {
                    element.parentNode.removeChild(element);
                    console.log(`Cleaned up existing UI element: ${id}`);
                } catch (e) {
                    console.warn(`Could not remove existing UI element ${id}:`, e);
                }
            }
        });
    }
    
    setupUIElements() {
        // Get existing UI elements from HTML
        this.elements.scoreElement = document.getElementById('score');
        this.elements.instructionsElement = document.getElementById('instructions');
        this.elements.uiContainer = document.getElementById('ui');
        
        // Create additional UI elements
        this.createFPSCounter();
        this.createPositionDisplay();
        this.createCollectiblesCounter();
        this.createKeysCounter();
        this.createLivesCounter();
        this.createGameTimer();
        this.createCameraModeDisplay();
        this.createMinimap();
        this.createPauseMenu();
        this.createNotificationSystem();

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
            font-family: "Segoe UI", "Consolas", "Monaco", monospace;
            font-size: 13px;
            font-weight: 500;
            background: rgba(0, 0, 0, 0.8);
            padding: 8px 12px;
            border-radius: 6px;
            z-index: 101;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(4px);
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
            top: 50px;
            left: 10px;
            color: #FFD700;
            font-family: "Segoe UI", Arial, sans-serif;
            font-size: 16px;
            font-weight: 600;
            z-index: 101;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            background: rgba(0, 0, 0, 0.3);
            padding: 6px 10px;
            border-radius: 4px;
            backdrop-filter: blur(2px);
        `;
        collectiblesElement.textContent = 'Collectibles: 0';
        document.body.appendChild(collectiblesElement);
        this.elements.collectiblesElement = collectiblesElement;
    }
    
    createKeysCounter() {
        const keysElement = document.createElement('div');
        keysElement.id = 'keys-counter';
        keysElement.style.cssText = `
            position: absolute;
            top: 110px;
            left: 10px;
            color: #00FFFF;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            z-index: 101;
        `;
        keysElement.textContent = 'Keys: 0/0';
        document.body.appendChild(keysElement);
        this.elements.keysElement = keysElement;
    }
    
    createLivesCounter() {
        const livesElement = document.createElement('div');
        livesElement.id = 'lives-counter';
        livesElement.style.cssText = `
            position: absolute;
            top: 90px;
            left: 10px;
            color: #FF0000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            z-index: 101;
        `;
        livesElement.textContent = 'Lives: 3';
        document.body.appendChild(livesElement);
        this.elements.livesElement = livesElement;
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
            font-family: "Segoe UI", Arial, sans-serif;
            font-size: 20px;
            font-weight: 700;
            z-index: 101;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            background: rgba(0, 0, 0, 0.4);
            padding: 8px 16px;
            border-radius: 8px;
            backdrop-filter: blur(3px);
            border: 1px solid rgba(255, 255, 255, 0.1);
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
            top: 130px;
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
    
    createNotificationSystem() {
        const notificationElement = document.createElement('div');
        notificationElement.id = 'notification-system';
        notificationElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            font-family: Arial, sans-serif;
            font-size: 18px;
            font-weight: bold;
            padding: 20px 30px;
            border-radius: 10px;
            border: 2px solid #ffd700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            z-index: 1001;
            display: none;
            text-align: center;
            max-width: 400px;
            animation: fadeIn 0.3s ease-in-out;
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notificationElement);
        this.elements.notificationElement = notificationElement;
    }
    
    setupEventListeners() {
        // Keyboard shortcuts for UI
        this.keyboardListener = (event) => {
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
        };
        
        document.addEventListener('keydown', this.keyboardListener);
        
        // Handle window resize
        this.resizeListener = () => {
            this.updateLayout();
        };
        
        window.addEventListener('resize', this.resizeListener);
    }
    
    update(deltaTime, gameData) {
        if (!this.isInitialized) return;
        
        // Validate deltaTime to prevent NaN
        const validDeltaTime = (isNaN(deltaTime) || !isFinite(deltaTime)) ? 0 : deltaTime;
        
        // Update game state with validation
        this.gameState.fps = gameData.fps || 0;
        this.gameState.score = gameData.score || 0;
        this.gameState.health = gameData.playerHealth || 100;
        this.gameState.lives = Math.max(0, Math.min(gameData.playerLives || 3, 3)); // Cap at 3 lives
        this.gameState.collectibles = gameData.collectibles || 0;
        this.gameState.keyInfo = gameData.keyInfo || { totalKeys: 0, collectedKeys: 0 };
        this.gameState.cameraMode = gameData.cameraMode || 'firstPerson';
        this.gameState.collectiblePositions = gameData.collectiblePositions || [];
        this.gameState.keyPosition = gameData.keyPosition || null;
        this.gameState.exitPosition = gameData.exitPosition || null;
        this.gameState.ghostPositions = gameData.ghostPositions || [];
        this.gameState.gameMode = gameData.gameMode || 'normal';
        
        // Update pacman timer data
        this.gameState.pacmanTimeRemaining = gameData.pacmanTimeRemaining || null;
        this.gameState.pacmanFormattedTime = gameData.pacmanFormattedTime || null;
        
        // Update classic mode data
        this.gameState.isClassicMode = gameData.isClassicMode || false;
        this.gameState.classicLives = gameData.classicLives !== undefined ? Math.max(0, Math.min(gameData.classicLives, 3)) : undefined; // Cap at 3 lives
        this.gameState.classicWave = gameData.classicWave;
        
        // Update multiplayer data

        
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
        this.updateNotifications();
    }
    
    // Validate position object
    isValidPosition(position) {
        return position && 
               !isNaN(position.x) && !isNaN(position.y) && !isNaN(position.z) &&
               isFinite(position.x) && isFinite(position.y) && isFinite(position.z);
    }
    
    updateUIElements() {
        const isPacmanMode = this.gameState.gameMode === 'pacman' || this.gameState.gameMode === 'pacman_classic';
        
        // Create or update classic mode wave display
        this.updateClassicModeDisplay();
        
        // Update score
        if (this.elements.scoreElement && this.settings.showScore) {
            this.elements.scoreElement.textContent = `Score: ${this.gameState.score}`;
        }
        

        
        // Update FPS - hide for pacman mode
        if (this.elements.fpsElement && this.settings.showFPS) {
            if (isPacmanMode) {
                this.elements.fpsElement.style.display = 'none';
            } else {
                this.elements.fpsElement.style.display = 'block';
                this.elements.fpsElement.textContent = `FPS: ${this.gameState.fps}`;
            }
        }
        
        // Update position - hide for pacman mode
        if (this.elements.positionElement && this.settings.showPosition) {
            if (isPacmanMode) {
                this.elements.positionElement.style.display = 'none';
            } else {
                this.elements.positionElement.style.display = 'block';
                const pos = this.gameState.position;
                this.elements.positionElement.textContent = `Position: (${pos.x}, ${pos.y}, ${pos.z})`;
            }
        }
        
        // Update collectibles - always show
        if (this.elements.collectiblesElement && this.settings.showCollectibles) {
            this.elements.collectiblesElement.textContent = `Collectibles: ${this.gameState.collectibles}`;
        }
        
        // Update keys - hide for pacman mode
        if (this.elements.keysElement) {
            if (isPacmanMode) {
                this.elements.keysElement.style.display = 'none';
            } else {
                this.elements.keysElement.style.display = 'block';
                const keyInfo = this.gameState.keyInfo;
                this.elements.keysElement.textContent = `Keys: ${keyInfo.collectedKeys}/${keyInfo.totalKeys}`;
            }
        }

        // Update lives - show classic mode lives or normal lives
        if (this.elements.livesElement) {
            // Always use the player's actual lives count for immediate updates
            const safeLives = Math.max(0, Math.min(this.gameState.lives, 3));
            this.elements.livesElement.textContent = `Lives: ${safeLives}`;
            
            // Check for classic mode styling and visibility
            if (this.gameState.isClassicMode) {
                this.elements.livesElement.style.color = '#FF00FF'; // Pink for classic mode
                this.elements.livesElement.style.display = 'block'; // Always show in classic mode
            } else {
                this.elements.livesElement.style.color = '#FF0000'; // Red for normal mode
                // Hide lives in pacman mode unless it's classic mode
                if (isPacmanMode) {
                    this.elements.livesElement.style.display = 'none';
                } else {
                    this.elements.livesElement.style.display = 'block';
                }
            }
        }
        
        // Update camera mode - hide for pacman mode
        if (this.elements.cameraModeElement) {
            if (isPacmanMode) {
                this.elements.cameraModeElement.style.display = 'none';
            } else {
                this.elements.cameraModeElement.style.display = 'block';
                const modeNames = {
                    'firstPerson': 'First Person',
                    'thirdPerson': 'Third Person',
                    'isometric': 'Isometric'
                };
                const displayName = modeNames[this.gameState.cameraMode] || 'Unknown';
                this.elements.cameraModeElement.textContent = `Camera: ${displayName}`;
            }
        }
        
        // Update timer - show countdown for pacman mode, normal timer for others
        if (this.elements.timerElement) {
            this.elements.timerElement.style.display = 'block';
            
            if (isPacmanMode) {
                // Classic mode doesn't use timer, hide it
                if (this.gameState.isClassicMode) {
                    this.elements.timerElement.style.display = 'none';
                } else {
                    // Show countdown timer for normal pacman mode
                    this.elements.timerElement.style.display = 'block';
                    if (this.gameState.pacmanFormattedTime) {
                        const timeRemaining = this.gameState.pacmanTimeRemaining || 0;
                        const formattedTime = this.gameState.pacmanFormattedTime;
                        
                        // Change color based on remaining time
                        if (timeRemaining <= 30) {
                            this.elements.timerElement.style.color = '#ff0000'; // Red for critical time
                            this.elements.timerElement.style.fontWeight = 'bold';
                        } else if (timeRemaining <= 60) {
                            this.elements.timerElement.style.color = '#ffff00'; // Yellow for low time
                            this.elements.timerElement.style.fontWeight = 'bold';
                        } else {
                            this.elements.timerElement.style.color = '#00ff00'; // Green for good time
                            this.elements.timerElement.style.fontWeight = 'normal';
                        }
                        
                        this.elements.timerElement.textContent = `Time: ${formattedTime}`;
                    } else {
                        this.elements.timerElement.textContent = 'Time: --:--';
                        this.elements.timerElement.style.color = 'white';
                    }
                }
            } else {
                // Show normal elapsed time for other modes
                this.elements.timerElement.style.color = 'white';
                this.elements.timerElement.style.fontWeight = 'normal';
                
                const gameTime = isNaN(this.gameState.gameTime) ? 0 : this.gameState.gameTime;
                const minutes = Math.floor(gameTime / 60);
                const seconds = Math.floor(gameTime % 60);
                
                // Ensure values are valid numbers
                const displayMinutes = isNaN(minutes) ? 0 : Math.max(0, minutes);
                const displaySeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
                
                this.elements.timerElement.textContent = `Time: ${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
            }
        }
        

    }




    
    // Create or update classic mode wave display
    updateClassicModeDisplay() {
        // Only show wave display in classic mode
        if (this.gameState.isClassicMode && this.gameState.classicWave) {
            // Create the element if it doesn't exist
            if (!this.elements.classicWaveElement) {
                const classicWaveElement = document.createElement('div');
                classicWaveElement.id = 'classic-wave-display';
                classicWaveElement.style.cssText = `
                    position: absolute;
                    top: 60px;
                    left: 10px;
                    color: #FF00FF;
                    font-family: Arial, sans-serif;
                    font-size: 16px;
                    font-weight: bold;
                    z-index: 101;
                    text-shadow: 2px 2px 0px #000000;
                `;
                document.body.appendChild(classicWaveElement);
                this.elements.classicWaveElement = classicWaveElement;
            }
            
            // Show and update the wave display
            this.elements.classicWaveElement.style.display = 'block';
            this.elements.classicWaveElement.textContent = `Wave: ${this.gameState.classicWave}`;
        } else {
            // Hide the wave display when not in classic mode
            if (this.elements.classicWaveElement) {
                this.elements.classicWaveElement.style.display = 'none';
            }
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
        
        // Calculate scale and offset for minimap
        const mapSize = 16 * 5; // 16 tiles * 5 tile size from gridManager
        const scale = Math.min(canvas.width, canvas.height) / mapSize;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Get player position for tracking
        const playerPos = this.gameState.position;
        const playerOffsetX = playerPos.x * scale;
        const playerOffsetZ = playerPos.z * scale;
        
        // Draw collectibles (yellow dots)
        if (this.gameState.collectiblePositions && this.gameState.collectiblePositions.length > 0) {
            ctx.fillStyle = '#FFD700'; // Gold/yellow color
            this.gameState.collectiblePositions.forEach(collectible => {
                const mapX = centerX + (collectible.worldX * scale) - playerOffsetX;
                const mapY = centerY + (collectible.worldZ * scale) - playerOffsetZ;
                
                // Only draw if within minimap bounds
                if (mapX >= 0 && mapX <= canvas.width && mapY >= 0 && mapY <= canvas.height) {
                    ctx.beginPath();
                    ctx.arc(mapX, mapY, 2, 0, 2 * Math.PI);
                    ctx.fill();
                }
            });
        }
        
        // Draw key (blue dot)
        if (this.gameState.keyPosition) {
            ctx.fillStyle = '#00FFFF'; // Cyan/blue color
            const mapX = centerX + (this.gameState.keyPosition.worldX * scale) - playerOffsetX;
            const mapY = centerY + (this.gameState.keyPosition.worldZ * scale) - playerOffsetZ;
            
            // Only draw if within minimap bounds
            if (mapX >= 0 && mapX <= canvas.width && mapY >= 0 && mapY <= canvas.height) {
                ctx.beginPath();
                ctx.arc(mapX, mapY, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        
        // Draw exit door (green/red rectangle based on activation status)
        if (this.gameState.exitPosition) {
            const exit = this.gameState.exitPosition;
            ctx.fillStyle = exit.activated ? '#00FF00' : '#FF4444'; // Green if activated, red if not
            const mapX = centerX + (exit.worldX * scale) - playerOffsetX;
            const mapY = centerY + (exit.worldZ * scale) - playerOffsetZ;
            
            // Only draw if within minimap bounds
            if (mapX >= -5 && mapX <= canvas.width + 5 && mapY >= -5 && mapY <= canvas.height + 5) {
                ctx.fillRect(mapX - 4, mapY - 4, 8, 8);
                
                // Add a border to make it stand out
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.strokeRect(mapX - 4, mapY - 4, 8, 8);
            }
        }
        
        // Draw ghosts (colored dots with chase mode indication)
        if (this.gameState.ghostPositions && this.gameState.ghostPositions.length > 0) {
            this.gameState.ghostPositions.forEach(ghost => {
                const mapX = centerX + (ghost.worldX * scale) - playerOffsetX;
                const mapY = centerY + (ghost.worldZ * scale) - playerOffsetZ;
                
                // Only draw if within minimap bounds
                if (mapX >= -5 && mapX <= canvas.width + 5 && mapY >= -5 && mapY <= canvas.height + 5) {
                    // Set color based on ghost color
                    const ghostColors = {
                        red: '#FF0000',
                        blue: '#0000FF',
                        green: '#00FF00',
                        pink: '#FF69B4'
                    };
                    
                    ctx.fillStyle = ghostColors[ghost.color] || '#FF0000';
                    
                    // Draw ghost as circle
                    ctx.beginPath();
                    ctx.arc(mapX, mapY, ghost.chaseMode ? 4 : 3, 0, 2 * Math.PI);
                    ctx.fill();
                    
                    // Add white outline for better visibility
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(mapX, mapY, ghost.chaseMode ? 4 : 3, 0, 2 * Math.PI);
                    ctx.stroke();
                    
                    // Draw chase mode indicator (pulsing effect)
                    if (ghost.chaseMode) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.beginPath();
                        ctx.arc(mapX, mapY, 6, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
            });
        }
        
        // Draw player position (always centered)
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
    
    updateVisibility() {
        // Update visibility of UI elements based on settings
        if (this.elements.fpsDisplay) {
            this.elements.fpsDisplay.style.display = this.settings.showFPS ? 'block' : 'none';
        }
        
        if (this.elements.positionDisplay) {
            this.elements.positionDisplay.style.display = this.settings.showPosition ? 'block' : 'none';
        }
        
        if (this.elements.minimap) {
            this.elements.minimap.style.display = this.settings.showMinimap ? 'block' : 'none';
        }
        
        if (this.elements.scoreElement) {
            this.elements.scoreElement.style.display = this.settings.showScore ? 'block' : 'none';
        }
        

        
        if (this.elements.instructionsElement) {
            this.elements.instructionsElement.style.display = this.settings.showInstructions ? 'block' : 'none';
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
    
    // Show notification
    showNotification(message, type = 'info', duration = 5000) {
        this.notification.isActive = true;
        this.notification.message = message;
        this.notification.type = type;
        this.notification.duration = duration;
        this.notification.startTime = Date.now();
        
        if (this.elements.notificationElement) {
            this.elements.notificationElement.innerHTML = message;
            this.elements.notificationElement.style.display = 'block';
            
            // Update colors based on type
            const colors = {
                info: '#ffd700',
                success: '#00ff00',
                warning: '#ff8800',
                error: '#ff0000'
            };
            
            this.elements.notificationElement.style.borderColor = colors[type] || colors.info;
            this.elements.notificationElement.style.boxShadow = `0 0 20px ${colors[type]}50`;
        }
    }
    
    // Hide notification
    hideNotification() {
        this.notification.isActive = false;
        
        if (this.elements.notificationElement) {
            this.elements.notificationElement.style.animation = 'fadeOut 0.3s ease-in-out';
            setTimeout(() => {
                this.elements.notificationElement.style.display = 'none';
                this.elements.notificationElement.style.animation = 'fadeIn 0.3s ease-in-out';
            }, 300);
        }
    }
    
    // Force clear notification immediately (for level transitions)
    clearNotification() {
        this.notification.isActive = false;
        
        if (this.elements.notificationElement) {
            this.elements.notificationElement.style.display = 'none';
            this.elements.notificationElement.style.animation = 'fadeIn 0.3s ease-in-out';
        }
    }
    
    // Update notifications
    updateNotifications() {
        if (this.notification.isActive) {
            const elapsed = Date.now() - this.notification.startTime;
            if (elapsed >= this.notification.duration) {
                this.hideNotification();
            }
        }
    }
    
    destroy() {
        console.log('🧹 Destroying UIManager...');
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Remove created elements
        Object.values(this.elements).forEach(element => {
            if (element && element.parentNode) {
                try {
                    element.parentNode.removeChild(element);
                    console.log(`Removed UI element from UIManager`);
                } catch (e) {
                    console.warn('Could not remove UI element:', e);
                }
            }
        });
        
        // Clear the elements object
        this.elements = {};
        
        // Reset state
        this.isInitialized = false;
        this.notification.isActive = false;
        
        // Remove event listeners
        if (this.keyboardListener) {
            document.removeEventListener('keydown', this.keyboardListener);
            this.keyboardListener = null;
        }
        
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }
        
        console.log('✅ UIManager destroyed successfully');
    }
} 