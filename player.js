import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
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
    
    createPlayerMesh() {
        // Create a properly scaled sphere geometry for the player
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        
        // Check game mode and level for theming
        const isPacmanMode = window.game && window.game.gameMode === 'pacman';
        const isNormalMode = window.game && window.game.gameMode === 'normal';
        const currentLevel = window.game ? window.game.currentLevel : 1;
        
        let material;
        
        if (isPacmanMode) {
            // Neon 80s/Tron theme for Pacman mode
            material = new THREE.MeshLambertMaterial({ 
                color: 0xFFFF00, // Bright yellow like classic Pacman
                emissive: 0x888800 // Strong yellow glow
            });
        } else if (isNormalMode) {
            // PS2 theme for single player mode - player color changes per level
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
            
            // Get player color for current level (cycle through colors)
            const colorIndex = ((currentLevel - 1) % 10) + 1;
            const playerColor = ps2PlayerColors[colorIndex];
            
            material = new THREE.MeshLambertMaterial({ 
                color: playerColor,
                emissive: playerColor,
                emissiveIntensity: 0.2
            });
        } else {
            // Create a colorful striped material for fallback mode
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const context = canvas.getContext('2d');
            
            // Create striped pattern
            const stripeHeight = 32;
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
            
            for (let i = 0; i < canvas.height; i += stripeHeight) {
                const colorIndex = Math.floor(i / stripeHeight) % colors.length;
                context.fillStyle = colors[colorIndex];
                context.fillRect(0, i, canvas.width, stripeHeight);
            }
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 2);
            
            material = new THREE.MeshLambertMaterial({ 
                map: texture,
                transparent: false
            });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = 'player'; // Add name for ghost AI to find player
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Create a helper object for rotation (for rolling effect)
        this.rotationHelper = new THREE.Object3D();
        this.rotationHelper.position.copy(this.position);
        this.scene.add(this.rotationHelper);
        
        // Track rotation for rolling
        this.rollRotation = new THREE.Vector3(0, 0, 0);
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
        
        // Simple ground check (y = 0 is ground level, account for sphere radius)
        if (this.position.y <= this.radius) {
            this.position.y = this.radius;
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
    
    isOutOfLives() {
        return this.lives <= 0;
    }
    
    resetLives() {
        this.lives = this.maxLives;
    }
} 