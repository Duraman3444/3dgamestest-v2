import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class CollisionSystem {
    constructor() {
        this.player = null;
        this.gridManager = null;
        this.collisionTolerance = 0.1;
        this.playerRadius = 1; // Match the sphere geometry radius
        this.playerHeight = 2; // Sphere diameter for height calculations
        
        // Collision detection settings
        this.enableCollisionDebug = false;
        this.debugHelpers = [];
        
        // Score tracking
        this.score = 0;
        this.collectiblesCollected = 0;
        
        // Game over callback
        this.gameOverCallback = null;
    }
    
    setPlayer(player) {
        this.player = player;
    }
    
    setGrid(gridManager) {
        this.gridManager = gridManager;
    }
    
    setGameOverCallback(callback) {
        this.gameOverCallback = callback;
    }
    
    update(deltaTime) {
        if (!this.player || !this.gridManager) return;
        
        // Check collision with obstacles
        this.checkObstacleCollisions();
        
        // Check collision with collectibles
        this.checkCollectibleCollisions();
        
        // Check collision with key
        this.checkKeyCollision();
        
        // Check collision with exit
        this.checkExitCollision();
        
        // Check collision with ghosts (Pacman mode)
        this.checkGhostCollisions();
        
        // Check world boundaries
        this.checkWorldBoundaries();
        
        // Update debug visualizations
        if (this.enableCollisionDebug) {
            this.updateDebugHelpers();
        }
    }
    
    checkObstacleCollisions() {
        const playerPosition = this.player.getPosition();
        const playerBounds = this.getPlayerBoundingBox(playerPosition);
        const obstacles = this.gridManager.getObstacles();
        
        for (let obstacle of obstacles) {
            if (this.checkBoxCollision(playerBounds, obstacle.boundingBox)) {
                // Calculate collision response
                const response = this.calculateCollisionResponse(playerPosition, obstacle.position);
                
                // Apply collision response
                if (response.length() > 0) {
                    const newPosition = playerPosition.clone().add(response);
                    this.player.setPosition(newPosition.x, newPosition.y, newPosition.z);
                    
                    // Stop player movement in collision direction
                    this.player.velocity.multiplyScalar(0.8);
                }
            }
        }
    }
    
    checkCollectibleCollisions() {
        const playerPosition = this.player.getPosition();
        const playerBounds = this.getPlayerBoundingBox(playerPosition);
        const collectibles = this.gridManager.getCollectibles();
        
        for (let collectible of collectibles) {
            if (!collectible.collected) {
                const collectibleBounds = this.getCollectibleBoundingBox(collectible.position);
                
                if (this.checkBoxCollision(playerBounds, collectibleBounds)) {
                    // Collect the item
                    if (this.gridManager.collectItem(collectible)) {
                        this.score += 10;
                        this.collectiblesCollected++;
                        
                        // Create collection effect (could be expanded)
                        this.createCollectionEffect(collectible.position);
                    }
                }
            }
        }
    }
    
    checkKeyCollision() {
        const key = this.gridManager.getKey();
        if (key && !key.collected) {
            const playerPosition = this.player.getPosition();
            const keyBounds = this.getKeyBoundingBox(key.position);
            const playerBounds = this.getPlayerBoundingBox(playerPosition);
            
            if (this.checkBoxCollision(playerBounds, keyBounds)) {
                if (this.gridManager.collectKey()) {
                    this.score += 50; // Key gives more points
                    console.log('Key collected!');
                    this.createCollectionEffect(key.position);
                }
            }
        }
    }
    
    checkExitCollision() {
        const exit = this.gridManager.getExit();
        if (exit) {
            const playerPosition = this.player.getPosition();
            const exitBounds = this.getExitBoundingBox(exit.position);
            const playerBounds = this.getPlayerBoundingBox(playerPosition);
            
            if (this.checkBoxCollision(playerBounds, exitBounds)) {
                if (this.gridManager.canActivateExit()) {
                    this.gridManager.activateExit();
                    console.log('Level completed!');
                    // Could trigger level completion event here
                } else {
                    console.log('Collect all items and the key first!');
                }
            }
        }
    }
    
    checkGhostCollisions() {
        const ghosts = this.gridManager.getGhosts();
        if (ghosts && ghosts.length > 0) {
            const playerPosition = this.player.getPosition();
            const playerBounds = this.getPlayerBoundingBox(playerPosition);
            
            for (let ghost of ghosts) {
                const ghostBounds = this.getGhostBoundingBox(ghost.mesh.position);
                
                if (this.checkBoxCollision(playerBounds, ghostBounds)) {
                    // Ghost touched player - reset player position or reduce health
                    this.handleGhostCollision(ghost);
                }
            }
        }
    }
    
    handleGhostCollision(ghost) {
        console.log(`Ghost collision with ${ghost.color} ghost!`);
        
        // Lose a life
        const remainingLives = this.player.loseLife();
        
        // Reset player to spawn position
        const levelData = this.gridManager.levelLoader.getCurrentLevel();
        const spawnPoint = levelData.spawn;
        this.player.setPosition(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        
        // Reset player velocity
        this.player.velocity.set(0, 0, 0);
        
        // Check if player is out of lives
        if (this.player.isOutOfLives()) {
            console.log('Game Over! Out of lives!');
            
            // Reset lives for next game
            this.player.resetLives();
            
            // Call game over callback if set
            if (this.gameOverCallback) {
                this.gameOverCallback();
            }
        } else {
            console.log(`Player respawned! Lives remaining: ${remainingLives}`);
        }
        
        // Optional: reduce score slightly
        this.score = Math.max(0, this.score - 10);
    }
    
    getGhostBoundingBox(position) {
        const radius = 0.4; // Match ghost sphere radius
        
        return new THREE.Box3(
            new THREE.Vector3(
                position.x - radius,
                position.y - radius,
                position.z - radius
            ),
            new THREE.Vector3(
                position.x + radius,
                position.y + radius,
                position.z + radius
            )
        );
    }
    
    getKeyBoundingBox(position) {
        const width = 0.5;
        const height = 0.2;
        const depth = 1;
        
        return new THREE.Box3(
            new THREE.Vector3(
                position.x - width/2,
                position.y - height/2,
                position.z - depth/2
            ),
            new THREE.Vector3(
                position.x + width/2,
                position.y + height/2,
                position.z + depth/2
            )
        );
    }
    
    getExitBoundingBox(position) {
        const width = 3;
        const height = 4;
        const depth = 3;
        
        return new THREE.Box3(
            new THREE.Vector3(
                position.x - width/2,
                position.y - height/2,
                position.z - depth/2
            ),
            new THREE.Vector3(
                position.x + width/2,
                position.y + height/2,
                position.z + depth/2
            )
        );
    }
    
    checkWorldBoundaries() {
        const playerPosition = this.player.getPosition();
        const gridSize = this.gridManager.gridSize;
        const tileSize = this.gridManager.tileSize;
        const halfWorld = (gridSize * tileSize) / 2;
        
        let corrected = false;
        
        // Check X boundaries
        if (playerPosition.x < -halfWorld + this.playerRadius) {
            this.player.setPosition(-halfWorld + this.playerRadius, playerPosition.y, playerPosition.z);
            corrected = true;
        } else if (playerPosition.x > halfWorld - this.playerRadius) {
            this.player.setPosition(halfWorld - this.playerRadius, playerPosition.y, playerPosition.z);
            corrected = true;
        }
        
        // Check Z boundaries
        if (playerPosition.z < -halfWorld + this.playerRadius) {
            this.player.setPosition(playerPosition.x, playerPosition.y, -halfWorld + this.playerRadius);
            corrected = true;
        } else if (playerPosition.z > halfWorld - this.playerRadius) {
            this.player.setPosition(playerPosition.x, playerPosition.y, halfWorld - this.playerRadius);
            corrected = true;
        }
        
        // If position was corrected, stop velocity in that direction
        if (corrected) {
            this.player.velocity.multiplyScalar(0.5);
        }
    }
    
    getPlayerBoundingBox(position) {
        const radius = this.playerRadius;
        
        return new THREE.Box3(
            new THREE.Vector3(
                position.x - radius,
                position.y - radius,
                position.z - radius
            ),
            new THREE.Vector3(
                position.x + radius,
                position.y + radius,
                position.z + radius
            )
        );
    }
    
    getCollectibleBoundingBox(position) {
        const radius = 0.3;
        
        return new THREE.Box3(
            new THREE.Vector3(
                position.x - radius,
                position.y - radius,
                position.z - radius
            ),
            new THREE.Vector3(
                position.x + radius,
                position.y + radius,
                position.z + radius
            )
        );
    }
    
    checkBoxCollision(box1, box2) {
        return box1.intersectsBox(box2);
    }
    
    calculateCollisionResponse(playerPos, obstaclePos) {
        const direction = playerPos.clone().sub(obstaclePos);
        
        // For sphere collision, we need to consider 3D distance
        const distance = direction.length();
        const minDistance = this.playerRadius + 1; // obstacle half-width + sphere radius
        
        if (distance < minDistance && distance > 0) {
            direction.normalize();
            const pushDistance = minDistance - distance + this.collisionTolerance;
            
            // For sphere, we can push in any direction, but limit vertical push
            const response = direction.multiplyScalar(pushDistance);
            
            // Limit vertical response to prevent sphere from flying up
            if (response.y > 0) {
                response.y = Math.min(response.y, this.playerRadius * 0.5);
            }
            
            return response;
        }
        
        return new THREE.Vector3(0, 0, 0);
    }
    
    createCollectionEffect(position) {
        // Simple effect - could be expanded with particles, sound, etc.
        console.log(`Collected item at position: ${position.x}, ${position.y}, ${position.z}`);
        
        // You could add visual effects here, like:
        // - Particle systems
        // - Sound effects
        // - Score popup animations
    }
    
    // Raycasting for more precise collision detection
    raycast(origin, direction, distance = 10) {
        const raycaster = new THREE.Raycaster(origin, direction, 0, distance);
        const obstacles = this.gridManager.getObstacles();
        const intersects = [];
        
        for (let obstacle of obstacles) {
            const result = raycaster.intersectObject(obstacle.mesh);
            if (result.length > 0) {
                intersects.push(...result);
            }
        }
        
        return intersects.sort((a, b) => a.distance - b.distance);
    }
    
    // Check if player can move to a specific position
    canMoveTo(position) {
        const testBounds = this.getPlayerBoundingBox(position);
        const obstacles = this.gridManager.getObstacles();
        
        // Check against obstacles
        for (let obstacle of obstacles) {
            if (this.checkBoxCollision(testBounds, obstacle.boundingBox)) {
                return false;
            }
        }
        
        // Check world boundaries (account for sphere radius)
        const gridSize = this.gridManager.gridSize;
        const tileSize = this.gridManager.tileSize;
        const halfWorld = (gridSize * tileSize) / 2;
        
        if (position.x < -halfWorld + this.playerRadius || 
            position.x > halfWorld - this.playerRadius ||
            position.z < -halfWorld + this.playerRadius || 
            position.z > halfWorld - this.playerRadius ||
            position.y < this.playerRadius) { // Prevent sphere from going below ground
            return false;
        }
        
        return true;
    }
    
    // Get the closest obstacle in a direction
    getClosestObstacle(position, direction, maxDistance = 10) {
        const intersects = this.raycast(position, direction, maxDistance);
        return intersects.length > 0 ? intersects[0] : null;
    }
    
    // Enable/disable collision debug visualization
    setCollisionDebug(enabled) {
        this.enableCollisionDebug = enabled;
        
        if (!enabled) {
            this.clearDebugHelpers();
        }
    }
    
    updateDebugHelpers() {
        this.clearDebugHelpers();
        
        if (!this.player || !this.gridManager) return;
        
        // Add debug visualization for player bounding box
        const playerBounds = this.getPlayerBoundingBox(this.player.getPosition());
        const playerHelper = new THREE.Box3Helper(playerBounds, 0x00ff00);
        this.debugHelpers.push(playerHelper);
        
        // Add debug visualization for obstacle bounding boxes
        const obstacles = this.gridManager.getObstacles();
        for (let obstacle of obstacles) {
            const obstacleHelper = new THREE.Box3Helper(obstacle.boundingBox, 0xff0000);
            this.debugHelpers.push(obstacleHelper);
        }
    }
    
    clearDebugHelpers() {
        this.debugHelpers.forEach(helper => {
            if (helper.parent) {
                helper.parent.remove(helper);
            }
        });
        this.debugHelpers = [];
    }
    
    // Get collision statistics
    getStats() {
        return {
            score: this.score,
            collectiblesCollected: this.collectiblesCollected,
            remainingCollectibles: this.gridManager ? this.gridManager.getRemainingCollectibles() : 0
        };
    }
    
    // Reset collision system
    reset() {
        this.score = 0;
        this.collectiblesCollected = 0;
        this.clearDebugHelpers();
    }
    
    // Get current score
    getScore() {
        return this.score;
    }
    
    // Add points to score
    addScore(points) {
        this.score += points;
    }
} 