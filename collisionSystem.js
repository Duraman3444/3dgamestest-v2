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
        
        // Portal teleport cooldown
        this.lastPortalTeleportTime = 0;
        this.portalCooldown = 1000; // milliseconds
        
        // Game over callback
        this.gameOverCallback = null;
        
        // Level completion callback
        this.levelCompletionCallback = null;
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
    
    setLevelCompletionCallback(callback) {
        this.levelCompletionCallback = callback;
    }
    
    update(deltaTime) {
        if (!this.player || !this.gridManager) return;
        
        // Check collision with obstacles
        this.checkObstacleCollisions();
        
        // Check collision with walls (Pacman mode)
        this.checkWallCollisions();
        
        // Check collision with elevated tiles
        this.checkElevatedTileCollisions();
        
        // Check collision with collectibles
        this.checkCollectibleCollisions();
        
        // Check collision with key
        this.checkKeyCollision();
        
        // Check collision with exit
        this.checkExitCollision();
        
        // Check collision with ghosts (Pacman mode)
        this.checkGhostCollisions();
        
        // Check collision with bounce pads
        this.checkBouncePadCollisions();
        
        // Check collision with spikes
        this.checkSpikeCollisions();
        
        // Check collision with holes
        this.checkHoleCollisions();
        
        // Check collision with portals
        this.checkPortalCollisions();
        
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
                // Special handling for stair steps - they should be walkable
                if (obstacle.type === 'box' && obstacle.height < 2) {
                    // This is likely a stair step (low height box)
                    // Check if player is above the step (trying to walk on it)
                    const stepTop = obstacle.position.y + obstacle.height / 2;
                    const playerBottom = playerPosition.y - this.playerRadius;
                    
                    // If player is close to the top of the step, support them
                    if (playerBottom <= stepTop + 1.0 && playerBottom >= stepTop - 1.0) {
                        // Support the player on top of the step
                        const supportHeight = stepTop + this.playerRadius;
                        if (playerPosition.y < supportHeight) {
                            this.player.setPosition(playerPosition.x, supportHeight, playerPosition.z);
                            this.player.velocity.y = Math.max(0, this.player.velocity.y); // Stop downward movement
                        }
                        continue; // Don't treat as blocking obstacle
                    }
                    
                    // Only block if player is significantly below the step
                    if (playerPosition.y < stepTop - 2) {
                        const response = this.calculateCollisionResponse(playerPosition, obstacle.position);
                        if (response.length() > 0) {
                            const newPosition = playerPosition.clone().add(response);
                            this.player.setPosition(newPosition.x, newPosition.y, newPosition.z);
                            this.player.velocity.multiplyScalar(0.8);
                        }
                    }
                } else {
                    // Regular obstacle collision (for cylinder and tall obstacles)
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
    }
    
    checkWallCollisions() {
        // Only check wall collisions for pacman mode
        if (this.gridManager.levelType !== 'pacman') return;
        
        const playerPosition = this.player.getPosition();
        const playerBounds = this.getPlayerBoundingBox(playerPosition);
        const walls = this.gridManager.getWalls();
        
        for (let wall of walls) {
            const wallBounds = this.getWallBoundingBox(wall.position);
            
            if (this.checkBoxCollision(playerBounds, wallBounds)) {
                // Calculate collision response
                const response = this.calculateCollisionResponse(playerPosition, wall.position);
                
                // Apply collision response
                if (response.length() > 0) {
                    const newPosition = playerPosition.clone().add(response);
                    this.player.setPosition(newPosition.x, newPosition.y, newPosition.z);
                    
                    // Stop player movement in collision direction
                    this.player.velocity.multiplyScalar(0.5);
                }
            }
        }
    }
    
    checkElevatedTileCollisions() {
        const playerPosition = this.player.getPosition();
        const playerBounds = this.getPlayerBoundingBox(playerPosition);
        const tiles = this.gridManager.getTiles();
        
        for (let [tileKey, tile] of tiles) {
            // Only check collision with elevated tiles that have a mesh
            if (tile.height > 0 && tile.mesh) {
                const tileBounds = this.getElevatedTileBoundingBox(tile);
                
                if (this.checkBoxCollision(playerBounds, tileBounds)) {
                    // Calculate collision response for elevated tiles
                    const response = this.calculateElevatedTileCollisionResponse(playerPosition, tile);
                    
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
                    
                    // Trigger level completion callback
                    if (this.levelCompletionCallback) {
                        this.levelCompletionCallback();
                    }
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
        
        // Reset ghosts and give head start (classic Pacman behavior)
        if (this.gridManager.resetGhostsAfterPlayerDeath) {
            this.gridManager.resetGhostsAfterPlayerDeath();
        }
        
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
    
    // Check collision with bounce pads
    checkBouncePadCollisions() {
        if (!this.gridManager.bouncePads) return;
        
        const playerPos = this.player.position;
        const playerRadius = this.player.radius;
        
        this.gridManager.bouncePads.forEach(pad => {
            const padPos = pad.mesh.position;
            const distance = Math.sqrt(
                Math.pow(playerPos.x - padPos.x, 2) + 
                Math.pow(playerPos.z - padPos.z, 2)
            );
            
            if (distance <= (playerRadius + 1.5) && 
                playerPos.y <= padPos.y + 1 && 
                playerPos.y >= padPos.y - 0.5) {
                
                this.handleBouncePadCollision(pad);
            }
        });
    }
    
    // Handle bounce pad collision
    handleBouncePadCollision(pad) {
        console.log(`Bounce pad activated: ${pad.type}!`);
        
        if (pad.type === 'vertical') {
            // Vertical bounce - launch upward
            this.player.velocity.y = pad.force;
            this.player.isOnGround = false;
        } else if (pad.type === 'horizontal') {
            // Horizontal bounce - launch in direction
            const force = pad.force;
            switch(pad.direction) {
                case 'forward':
                    this.player.velocity.z = -force;
                    break;
                case 'backward':
                    this.player.velocity.z = force;
                    break;
                case 'left':
                    this.player.velocity.x = -force;
                    break;
                case 'right':
                    this.player.velocity.x = force;
                    break;
            }
        }
        
        // Visual feedback - make pad flash
        if (pad.mesh && pad.mesh.material && pad.mesh.material.color && pad.mesh.material.emissive) {
            const originalColor = pad.mesh.material.color.getHex();
            const originalEmissive = pad.mesh.material.emissive.getHex();
            
            pad.mesh.material.color.setHex(0xffffff);
            pad.mesh.material.emissive.setHex(0x666666);
            
            setTimeout(() => {
                pad.mesh.material.color.setHex(originalColor);
                pad.mesh.material.emissive.setHex(originalEmissive);
            }, 200);
        }
    }
    
    // Check collision with spikes
    checkSpikeCollisions() {
        if (!this.gridManager.spikes) return;
        
        const playerPos = this.player.position;
        const playerRadius = this.player.radius;
        
        this.gridManager.spikes.forEach(spike => {
            const spikePos = spike.mesh.position;
            const distance = Math.sqrt(
                Math.pow(playerPos.x - spikePos.x, 2) + 
                Math.pow(playerPos.z - spikePos.z, 2)
            );
            
            if (distance <= (playerRadius + 0.5) && 
                playerPos.y <= spikePos.y + 1 && 
                playerPos.y >= spikePos.y - 1) {
                
                this.handleSpikeCollision(spike);
            }
        });
    }
    
    // Handle spike collision
    handleSpikeCollision(spike) {
        console.log('Player hit spikes! Player killed!');
        
        // Kill the player - lose a life
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
            console.log(`Player killed by spikes! Lives remaining: ${remainingLives}`);
        }
        
        // Visual feedback - make spike flash red
        if (spike.mesh.material && spike.mesh.material.color && spike.mesh.material.emissive) {
            const originalColor = spike.mesh.material.color.getHex();
            const originalEmissive = spike.mesh.material.emissive.getHex();
            
            spike.mesh.material.color.setHex(0xff0000);
            spike.mesh.material.emissive.setHex(0x660000);
            
            setTimeout(() => {
                spike.mesh.material.color.setHex(originalColor);
                spike.mesh.material.emissive.setHex(originalEmissive);
            }, 500);
        }
    }
    
    // Check collision with holes
    checkHoleCollisions() {
        if (!this.gridManager.holes) return;
        
        const playerPos = this.player.position;
        const playerRadius = this.player.radius;
        
        this.gridManager.holes.forEach(hole => {
            const holePos = hole.mesh.position;
            const distance = Math.sqrt(
                Math.pow(playerPos.x - holePos.x, 2) + 
                Math.pow(playerPos.z - holePos.z, 2)
            );
            
            const holeRadius = Math.max(hole.width, hole.depth) * 2.5; // Tile size factor
            
            if (distance <= holeRadius && playerPos.y <= holePos.y + 1) {
                this.handleHoleCollision(hole);
            }
        });
    }
    
    // Handle hole collision
    handleHoleCollision(hole) {
        console.log('Player fell into hole! Teleporting to underworld...');
        
        // For now, just teleport to underworld spawn (same position but lower)
        // In future, this could load a separate underworld level
        const underworldSpawn = hole.underworldSpawn;
        this.player.setPosition(
            underworldSpawn.x, 
            underworldSpawn.y || -10, // Go to underworld level
            underworldSpawn.z
        );
        
        // Reset player velocity
        this.player.velocity.set(0, 0, 0);
        
        // Visual feedback - make hole flash
        if (hole.mesh.material) {
            const originalColor = hole.mesh.material.color.getHex();
            
            hole.mesh.material.color.setHex(0x333333);
            
            setTimeout(() => {
                hole.mesh.material.color.setHex(originalColor);
            }, 500);
        }
    }
    
    // Check collision with portals
    checkPortalCollisions() {
        const now = performance.now();
        if (now - this.lastPortalTeleportTime < this.portalCooldown) return;
        
        const levelData = this.gridManager.levelLoader.getCurrentLevel();
        const portals = levelData.portals || [];
        if (portals.length === 0) return;
        
        const playerPos = this.player.getPosition();
        const playerRadius = this.playerRadius;
        const tileSize = this.gridManager.tileSize;
        
        for (let portal of portals) {
            // Convert portal grid position to world coordinates
            const portalWorld = this.gridManager.levelLoader.gridToWorld(portal.x, portal.z, tileSize);
            const dx = playerPos.x - portalWorld.x;
            const dz = playerPos.z - portalWorld.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= playerRadius + tileSize * 0.15 && Math.abs(playerPos.y - (portal.y ?? 1)) <= 2) {
                this.handlePortalCollision(portal);
                this.lastPortalTeleportTime = now;
                break;
            }
        }
    }
    
    // Handle portal collision (teleport player)
    handlePortalCollision(portal) {
        const tileSize = this.gridManager.tileSize;
        const destWorld = this.gridManager.levelLoader.gridToWorld(portal.destination.x, portal.destination.z, tileSize);
        const destY = portal.destination.y ?? 1;
        console.log(`Teleporting via ${portal.type || 'portal'} to (grid ${portal.destination.x}, ${portal.destination.z}) => world (${destWorld.x.toFixed(2)}, ${destY}, ${destWorld.z.toFixed(2)})`);
        
        this.player.setPosition(destWorld.x, destY, destWorld.z);
        this.player.velocity.set(0, 0, 0);
        
        // Optional: add small visual effect or sound here
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
    
    getWallBoundingBox(position) {
        const halfSize = 2.5; // Wall size from tileSize (5/2)
        const height = 3; // Wall height
        
        return new THREE.Box3(
            new THREE.Vector3(
                position.x - halfSize,
                position.y - 0.5,
                position.z - halfSize
            ),
            new THREE.Vector3(
                position.x + halfSize,
                position.y + height,
                position.z + halfSize
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
    
    getElevatedTileBoundingBox(tile) {
        const tileSize = this.gridManager.tileSize;
        const halfTileSize = tileSize / 2;
        
        return new THREE.Box3(
            new THREE.Vector3(
                tile.worldX - halfTileSize,
                0,
                tile.worldZ - halfTileSize
            ),
            new THREE.Vector3(
                tile.worldX + halfTileSize,
                tile.height,
                tile.worldZ + halfTileSize
            )
        );
    }
    
    calculateElevatedTileCollisionResponse(playerPos, tile) {
        const tileSize = this.gridManager.tileSize;
        const halfTileSize = tileSize / 2;
        
        // Calculate the closest point on the tile to the player
        const tileCenter = new THREE.Vector3(tile.worldX, tile.height / 2, tile.worldZ);
        const direction = playerPos.clone().sub(tileCenter);
        
        // Check if player is above the tile (standing on it)
        // Only allow standing on elevated tiles if player is already at the correct height
        // This prevents the "ramp" effect where players can walk up to elevated tiles
        const heightTolerance = 3; // Allow some tolerance for landing on tiles after teleporting
        const isAtCorrectHeight = Math.abs(playerPos.y - tile.height) <= heightTolerance;
        
        if (isAtCorrectHeight && 
            playerPos.y >= tile.height - this.playerRadius && 
            playerPos.y <= tile.height + this.playerRadius &&
            Math.abs(direction.x) <= halfTileSize + this.playerRadius &&
            Math.abs(direction.z) <= halfTileSize + this.playerRadius) {
            
            // Player is on top of the tile - push them up to stand on it
            return new THREE.Vector3(0, tile.height + this.playerRadius - playerPos.y, 0);
        }
        
        // Check side collisions - treat elevated tiles as solid blocks
        // Players at ground level should be blocked by the sides of elevated tiles
        if (Math.abs(direction.x) <= halfTileSize + this.playerRadius &&
            Math.abs(direction.z) <= halfTileSize + this.playerRadius &&
            playerPos.y >= 0 && playerPos.y <= tile.height + this.playerRadius) {
            
            // Determine which side of the tile the player is approaching from
            const absX = Math.abs(direction.x);
            const absZ = Math.abs(direction.z);
            
            if (absX > absZ) {
                // Collision from X direction (left/right side)
                const pushX = direction.x > 0 ? halfTileSize + this.playerRadius : -(halfTileSize + this.playerRadius);
                const targetX = tile.worldX + pushX;
                return new THREE.Vector3(targetX - playerPos.x, 0, 0);
            } else {
                // Collision from Z direction (front/back side)
                const pushZ = direction.z > 0 ? halfTileSize + this.playerRadius : -(halfTileSize + this.playerRadius);
                const targetZ = tile.worldZ + pushZ;
                return new THREE.Vector3(0, 0, targetZ - playerPos.z);
            }
        }
        
        return new THREE.Vector3(0, 0, 0);
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
        
        // Find the obstacle to get its type and radius
        let obstacleRadius = 1; // Default radius for box obstacles
        const obstacles = this.gridManager.getObstacles();
        for (let obstacle of obstacles) {
            if (obstacle.position.equals(obstaclePos)) {
                // Use stored radius if available, otherwise calculate from bounding box
                if (obstacle.type === 'cylinder' && obstacle.radius) {
                    obstacleRadius = obstacle.radius;
                } else {
                    // For box obstacles, use half the width as radius
                    const boundingBox = obstacle.boundingBox;
                    const boxWidth = boundingBox.max.x - boundingBox.min.x;
                    obstacleRadius = boxWidth / 2;
                }
                break;
            }
        }
        
        const minDistance = this.playerRadius + obstacleRadius;
        
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
        
        // Check against walls (Pacman mode only)
        if (this.gridManager.levelType === 'pacman') {
            const walls = this.gridManager.getWalls();
            for (let wall of walls) {
                const wallBounds = this.getWallBoundingBox(wall.position);
                if (this.checkBoxCollision(testBounds, wallBounds)) {
                    return false;
                }
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