import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.gridManager = null; // Will be set later
        // Set safe default spawn position (adjusted for sphere radius)
        this.spawnPoint = new THREE.Vector3(0, 1, 0);
        this.position = this.spawnPoint.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(0, 0, 0);
        
        // Player properties
        this.health = 100;
        this.maxHealth = 100;
        this.lives = 3; // Lives system for Pacman mode
        this.maxLives = 3;
        this.speed = 10;
        this.jumpHeight = 8;
        this.isOnGround = false;
        this.gravity = -20;
        
        // Sphere physics properties
        this.radius = 1; // Match the sphere geometry radius
        this.sphereHeight = this.radius * 2; // Diameter for physics calculations
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        
        // Mouse controls
        this.mouseSensitivity = 0.002;
        this.pitch = 0;
        this.yaw = 0;
        this.invertY = false;
        this.controlsEnabled = false;
        
        // Create player mesh (simple capsule)
        this.createPlayerMesh();
        
        // Setup input handlers
        this.setupInputHandlers();
    }
    
    setGridManager(gridManager) {
        this.gridManager = gridManager;
    }
    
    createPlayerMesh() {
        // Create high-quality sphere geometry for the player
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        
        // Check game mode and level for theming
        const isPacmanMode = window.game && window.game.gameMode === 'pacman';
        const isNormalMode = window.game && window.game.gameMode === 'normal';
        const currentLevel = window.game ? window.game.currentLevel : 1;
        
        let material;
        
        if (isPacmanMode) {
            // Create visible rotation pattern for Pacman mode
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext('2d');
            
            // Yellow base
            context.fillStyle = '#FFFF00';
            context.fillRect(0, 0, 512, 512);
            
            // Add visible rotation stripes
            context.strokeStyle = '#FF8800';
            context.lineWidth = 8;
            
            // Horizontal stripes
            for (let i = 0; i < 512; i += 64) {
                context.beginPath();
                context.moveTo(0, i);
                context.lineTo(512, i);
                context.stroke();
            }
            
            // Vertical stripes
            for (let i = 0; i < 512; i += 64) {
                context.beginPath();
                context.moveTo(i, 0);
                context.lineTo(i, 512);
                context.stroke();
            }
            
            // Add dots for better rotation visibility
            context.fillStyle = '#FF0000';
            for (let x = 32; x < 512; x += 64) {
                for (let y = 32; y < 512; y += 64) {
                    context.beginPath();
                    context.arc(x, y, 8, 0, Math.PI * 2);
                    context.fill();
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            material = new THREE.MeshStandardMaterial({ 
                map: texture,
                color: 0xFFFF00,
                emissive: 0x888800,
                emissiveIntensity: 0.4,
                metalness: 0.1,
                roughness: 0.2,
                envMapIntensity: 1.0,
                transparent: true,
                opacity: 0.95
            });
        } else if (isNormalMode) {
            // Enhanced PS2 materials with visible rotation patterns
            const ps2PlayerColors = {
                1: 0x00FFFF, // Cyan
                2: 0xFF00FF, // Magenta
                3: 0x00FF00, // Green
                4: 0xFF6600, // Orange
                5: 0x00CCCC, // Cyan
                6: 0xFFFF00, // Yellow
                7: 0xFF0099, // Pink
                8: 0x3333FF, // Blue
                9: 0xCC00CC, // Purple
                10: 0x9999FF // Light Purple
            };
            
            const colorIndex = ((currentLevel - 1) % 10) + 1;
            const playerColor = ps2PlayerColors[colorIndex];
            
            // Create visible rotation pattern
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext('2d');
            
            // Base color
            const color = new THREE.Color(playerColor);
            context.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
            context.fillRect(0, 0, 512, 512);
            
            // Add diagonal stripes for rotation visibility
            context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            context.lineWidth = 6;
            
            // Diagonal stripes
            for (let i = -512; i < 1024; i += 32) {
                context.beginPath();
                context.moveTo(i, 0);
                context.lineTo(i + 512, 512);
                context.stroke();
            }
            
            // Add contrasting dots
            context.fillStyle = 'rgba(255, 255, 255, 0.9)';
            for (let x = 16; x < 512; x += 64) {
                for (let y = 16; y < 512; y += 64) {
                    context.beginPath();
                    context.arc(x, y, 6, 0, Math.PI * 2);
                    context.fill();
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            material = new THREE.MeshStandardMaterial({ 
                map: texture,
                color: playerColor,
                emissive: playerColor,
                emissiveIntensity: 0.3,
                metalness: 0.2,
                roughness: 0.3,
                envMapIntensity: 1.0,
                transparent: true,
                opacity: 0.95
            });
        } else {
            // Enhanced procedural material with visible rotation patterns
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext('2d');
            
            // Enable high-quality rendering
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            
            // Create enhanced gradient pattern
            const gradient = context.createLinearGradient(0, 0, 512, 512);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(0.2, '#4ecdc4');
            gradient.addColorStop(0.4, '#45b7d1');
            gradient.addColorStop(0.6, '#f9ca24');
            gradient.addColorStop(0.8, '#f0932b');
            gradient.addColorStop(1, '#eb4d4b');
            
            context.fillStyle = gradient;
            context.fillRect(0, 0, 512, 512);
            
            // Add visible rotation grid pattern
            context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            context.lineWidth = 4;
            
            // Grid pattern for rotation visibility
            for (let i = 0; i < 512; i += 32) {
                context.beginPath();
                context.moveTo(i, 0);
                context.lineTo(i, 512);
                context.stroke();
                
                context.beginPath();
                context.moveTo(0, i);
                context.lineTo(512, i);
                context.stroke();
            }
            
            // Add circular patterns for better rotation visibility
            context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            context.lineWidth = 3;
            for (let x = 64; x < 512; x += 128) {
                for (let y = 64; y < 512; y += 128) {
                    context.beginPath();
                    context.arc(x, y, 20, 0, Math.PI * 2);
                    context.stroke();
                }
            }
            
            // Add metallic overlay
            const metallic = context.createRadialGradient(256, 256, 0, 256, 256, 256);
            metallic.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            metallic.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
            metallic.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
            
            context.fillStyle = metallic;
            context.fillRect(0, 0, 512, 512);
            
            // Create enhanced texture
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.generateMipmaps = false; // Disable mipmaps for canvas textures
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            material = new THREE.MeshPhongMaterial({ 
                map: texture,
                shininess: 100,
                specular: 0xFFFFFF,
                transparent: true,
                opacity: 0.95
            });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = 'player';
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Create a helper object for rotation (for rolling effect)
        this.rotationHelper = new THREE.Object3D();
        this.rotationHelper.position.copy(this.position);
        this.scene.add(this.rotationHelper);
        
        // Track rotation for rolling
        this.rollRotation = new THREE.Vector3(0, 0, 0);
        
        console.log('🎨 Enhanced player mesh created with visible rotation patterns');
    }
    
    setupInputHandlers() {
        // Keyboard event listeners
        document.addEventListener('keydown', (event) => {
            if (!this.controlsEnabled) return;
            
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    this.canJump = true;
                    event.preventDefault();
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
                case 'Space':
                    this.canJump = false;
                    break;
            }
        });
        
        // Mouse event listeners
        document.addEventListener('mousemove', (event) => {
            if (!this.controlsEnabled) return;
            
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            
            this.yaw -= movementX * this.mouseSensitivity;
            this.pitch -= movementY * this.mouseSensitivity * (this.invertY ? -1 : 1);
            
            // Limit pitch
            this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        });
    }
    
    update(deltaTime) {
        // Update movement direction based on input
        this.direction.set(0, 0, 0);
        
        if (this.moveForward) this.direction.z -= 1;
        if (this.moveBackward) this.direction.z += 1;
        if (this.moveLeft) this.direction.x -= 1;
        if (this.moveRight) this.direction.x += 1;
        
        // Normalize direction
        if (this.direction.length() > 0) {
            this.direction.normalize();
        }
        
        // Apply rotation to direction
        this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        
        // Update velocity based on direction
        this.velocity.x = this.direction.x * this.speed;
        this.velocity.z = this.direction.z * this.speed;
        
        // Handle jumping
        if (this.canJump && this.isOnGround) {
            this.velocity.y = this.jumpHeight;
            this.isOnGround = false;
        }
        
        // Apply gravity
        this.velocity.y += this.gravity * deltaTime;
        
        // Update position with validation
        const deltaMovement = this.velocity.clone().multiplyScalar(deltaTime);
        if (this.isValidPosition(deltaMovement.x, deltaMovement.y, deltaMovement.z)) {
            this.position.add(deltaMovement);
        } else {
            console.warn('Invalid movement detected, stopping player');
            this.velocity.set(0, 0, 0);
        }
        
        // Validate final position
        if (!this.isValidPosition(this.position.x, this.position.y, this.position.z)) {
            console.warn('Player position became invalid, resetting to spawn');
            this.resetToSpawn();
            return;
        }
        
        // Ground check with elevated tiles support
        const groundHeight = this.gridManager ? this.gridManager.getGroundHeight(this.position.x, this.position.z) : 0;
        const minPlayerHeight = groundHeight + this.radius;
        
        if (this.position.y <= minPlayerHeight) {
            this.position.y = minPlayerHeight;
            this.velocity.y = 0;
            this.isOnGround = true;
        }
        
        // Update mesh position and rolling rotation
        this.mesh.position.copy(this.position);
        this.rotationHelper.position.copy(this.position);
        this.rotationHelper.rotation.y = this.yaw;
        this.rotationHelper.rotation.x = this.pitch;
        
        // Add rolling physics - sphere rotates based on movement
        if (this.velocity.length() > 0.1) {
            const rollSpeed = this.velocity.length() / this.radius;
            this.rollRotation.x += this.velocity.z * rollSpeed * deltaTime;
            this.rollRotation.z -= this.velocity.x * rollSpeed * deltaTime;
            
            this.mesh.rotation.x = this.rollRotation.x;
            this.mesh.rotation.z = this.rollRotation.z;
        }
    }
    
    enableControls() {
        this.controlsEnabled = true;
    }
    
    disableControls() {
        this.controlsEnabled = false;
        // Reset movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    getRotation() {
        return {
            pitch: this.pitch,
            yaw: this.yaw
        };
    }
    
    setPosition(x, y, z) {
        // Validate position values to prevent NaN
        if (this.isValidPosition(x, y, z)) {
            this.position.set(x, y, z);
            this.mesh.position.copy(this.position);
            this.rotationHelper.position.copy(this.position);
        } else {
            console.warn('Invalid position detected, using spawn point');
            this.resetToSpawn();
        }
    }
    
    // Validate position values
    isValidPosition(x, y, z) {
        return !isNaN(x) && !isNaN(y) && !isNaN(z) && 
               isFinite(x) && isFinite(y) && isFinite(z);
    }
    
    // Reset player to spawn point
    resetToSpawn() {
        this.position.copy(this.spawnPoint);
        this.velocity.set(0, 0, 0);
        this.mesh.position.copy(this.position);
        this.rotationHelper.position.copy(this.position);
    }
    
    // Set spawn point from level data or use fallback
    setSpawnPoint(spawnData) {
        if (spawnData && this.isValidPosition(spawnData.x, spawnData.y, spawnData.z)) {
            // Clamp spawn position to valid surface above Y=0
            this.spawnPoint.set(
                spawnData.x,
                Math.max(spawnData.y, 1), // Ensure above ground
                spawnData.z
            );
        } else {
            // Fallback default spawn point (adjusted for sphere)
            this.spawnPoint.set(0, 1, 0);
        }
        this.resetToSpawn();
    }
    
    // Get forward direction for camera
    getForwardDirection() {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        return forward;
    }
    
    // Get right direction for camera
    getRightDirection() {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        return right;
    }
    
    // Lives management methods
    loseLife() {
        this.lives = Math.max(0, this.lives - 1);
        return this.lives;
    }
    
    getLives() {
        return this.lives;
    }
    
    setLives(newLives) {
        // Ensure lives never exceed maxLives (3) and never go below 0
        this.lives = Math.max(0, Math.min(newLives, this.maxLives));
        return this.lives;
    }
    
    isOutOfLives() {
        return this.lives <= 0;
    }
    
    resetLives() {
        this.lives = this.maxLives;
    }
} 