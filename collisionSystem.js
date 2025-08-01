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

        // Victory condition for cylinder
        this.cylinderVictoryTriggered = false;
        
        // Spike immunity system
        this.spikeImmunity = false;
        this.spikeImmunityDuration = 4000; // 4 seconds in milliseconds
        this.spikeImmunityStartTime = 0;
        
        // Ghost immunity system
        this.ghostImmunity = false;
        this.ghostImmunityDuration = 200; // 200ms to prevent rapid-fire collisions
        this.ghostImmunityStartTime = 0;
        
        // Level completion notification
        this.readyToLeaveNotificationShown = false;
        
        // Exit activation prevention (prevent spamming in classic mode)
        this.exitActivated = false;
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
    
    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }
    
    setVictoryMenu(victoryMenu) {
        this.victoryMenu = victoryMenu;
    }
    
    // Reset collision system state for new level
    resetForNewLevel() {
        this.readyToLeaveNotificationShown = false;
        this.spikeImmunity = false;
        this.spikeImmunityStartTime = 0;
        this.ghostImmunity = false;
        this.ghostImmunityStartTime = 0;
        console.log('Collision system reset for new level');
    }
    
    update(deltaTime) {
        if (!this.player || !this.gridManager) return;
        
        // Don't process collisions if game is paused (e.g., during leaderboard viewing)
        if (window.game && window.game.isPaused) return;
        
        // Check collision with obstacles
        this.checkObstacleCollisions();
        
        // Check collision with walls (Pacman mode)
        this.checkWallCollisions();
        
        // Check collision with elevated tiles
        this.checkElevatedTileCollisions();
        
        // Check collision with collectibles
        this.checkCollectibleCollisions();
        
        // Check collision with fruit
        this.checkFruitCollisions();
        
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
        
        // Check if player is ready to leave level (only in regular mode)
        this.checkReadyToLeaveNotification();
        
        // Check world boundaries
        this.checkWorldBoundaries();
        
        // Update debug visualizations
        if (this.enableCollisionDebug) {
            this.updateDebugHelpers();
        }
    }
    
    // Reset exit activation flag (call when starting new level or wave)
    resetExitActivation() {
        this.exitActivated = false;
        console.log('Exit activation flag reset');
    }
    
    checkObstacleCollisions() {
        const playerPosition = this.player.getPosition();
        const playerBounds = this.getPlayerBoundingBox(playerPosition);
        const obstacles = this.gridManager.getObstacles();
        
        for (let obstacle of obstacles) {
            if (obstacle.type === 'cylinder') {
                // Special handling for cylinder - check top collision and interior detection
                this.handleCylinderCollision(obstacle, playerPosition, playerBounds);
            } else if (this.checkBoxCollision(playerBounds, obstacle.boundingBox)) {
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
                    // Regular obstacle collision (for tall box obstacles)
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
    
    handleCylinderCollision(cylinder, playerPosition, playerBounds) {
        const cylinderPos = cylinder.position;
        const cylinderRadius = cylinder.radius;
        const cylinderHeight = cylinder.boundingBox.max.y - cylinder.boundingBox.min.y;
        const cylinderBottom = cylinderPos.y - cylinderHeight / 2;
        const cylinderTop = cylinderPos.y + cylinderHeight / 2;
        
        // Calculate 2D distance from player to cylinder center (ignore Y)
        const dx = playerPosition.x - cylinderPos.x;
        const dz = playerPosition.z - cylinderPos.z;
        const distance2D = Math.sqrt(dx * dx + dz * dz);
        
        // Check if player is inside the cylinder - but don't trigger victory
        // Victory will be triggered by the exit gate at the top of the cylinder
        if (distance2D < cylinderRadius - this.playerRadius && 
            playerPosition.y >= cylinderBottom && 
            playerPosition.y <= cylinderTop) {
            // Player is inside cylinder - allow free movement, no victory trigger
            return;
        }
        
        // Check for side collision (player hitting cylinder from the side)
        if (distance2D < cylinderRadius + this.playerRadius && 
            playerPosition.y >= cylinderBottom && 
            playerPosition.y <= cylinderTop) {
            
            // Push player away from cylinder sides
            const pushDistance = (cylinderRadius + this.playerRadius) - distance2D + this.collisionTolerance;
            if (pushDistance > 0) {
                const pushDirection = new THREE.Vector3(dx, 0, dz).normalize();
                const pushVector = pushDirection.multiplyScalar(pushDistance);
                const newPosition = playerPosition.clone().add(pushVector);
                this.player.setPosition(newPosition.x, newPosition.y, newPosition.z);
                this.player.velocity.multiplyScalar(0.8);
            }
        }
        
        // Check for top collision (player landing on cylinder top)
        if (distance2D < cylinderRadius && 
            playerPosition.y >= cylinderTop - this.playerRadius && 
            playerPosition.y <= cylinderTop + this.playerRadius) {
            
            // Support player on top of cylinder
            const supportHeight = cylinderTop + this.playerRadius;
            if (playerPosition.y < supportHeight) {
                this.player.setPosition(playerPosition.x, supportHeight, playerPosition.z);
                this.player.velocity.y = Math.max(0, this.player.velocity.y); // Stop downward movement
            }
        }
    }
    
    handleCylinderVictory() {
        // Only trigger victory once
        if (this.cylinderVictoryTriggered) return;
        this.cylinderVictoryTriggered = true;
        
        console.log('Player entered cylinder - Victory!');
        
        // Stop player movement
        this.player.velocity.set(0, 0, 0);
        
        // Show victory menu instead of just a message
        if (this.victoryMenu) {
            this.victoryMenu.show();
        } else {
            // Fallback to UI message if victory menu not available
            if (this.uiManager) {
                this.uiManager.showMessage('🎉 YOU BEAT WORLD 1! 🎉', 5000);
            }
            
            // Optional: trigger level completion after a delay
            setTimeout(() => {
                if (this.levelCompletionCallback) {
                    this.levelCompletionCallback();
                }
            }, 3000);
        }
    }
    
    checkWallCollisions() {
        // Only check wall collisions for pacman mode
        if (this.gridManager.levelType !== 'pacman') return;
        
        const playerPosition = this.player.getPosition();
        const playerBounds = this.getPlayerBoundingBox(playerPosition);
        const walls = this.gridManager.getWalls();
        const borderWalls = this.gridManager.getBorderWalls();
        
        // Check regular walls
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
        
        // Check border walls
        for (let borderWall of borderWalls) {
            const borderWallBounds = this.getWallBoundingBox(borderWall.position);
            
            if (this.checkBoxCollision(playerBounds, borderWallBounds)) {
                // Calculate collision response
                const response = this.calculateCollisionResponse(playerPosition, borderWall.position);
                
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
                        // Calculate level-based collectible score multiplier
                        const collectibleScore = this.calculateCollectibleScore(10);
                        this.score += collectibleScore;
                        this.collectiblesCollected++;
                        
                        console.log(`Collectible collected! Base: 10, Multiplied: ${collectibleScore}`);
                        
                        // Create collection effect (could be expanded)
                        this.createCollectionEffect(collectible.position);
                    }
                }
            }
        }
    }
    
    checkFruitCollisions() {
        const playerPosition = this.player.getPosition();
        const playerBounds = this.getPlayerBoundingBox(playerPosition);
        const fruits = this.gridManager.getFruit();
        
        for (let fruit of fruits) {
            if (!fruit.collected) {
                const fruitBounds = this.getFruitBoundingBox(fruit.position);
                
                if (this.checkBoxCollision(playerBounds, fruitBounds)) {
                    // Collect the fruit
                    if (this.gridManager.collectFruit(fruit)) {
                        // Calculate level-based fruit score multiplier
                        const fruitScore = this.calculateFruitScore(fruit.points || 500);
                        this.score += fruitScore;
                        
                        console.log(`Fruit collected! Base: ${fruit.points || 500}, Multiplied: ${fruitScore}`);
                        
                        // Create collection effect (could be expanded)
                        this.createCollectionEffect(fruit.position);
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
                    
                    // Play key pickup sound effect
                    if (window.game && window.game.audioManager) {
                        window.game.audioManager.playKeyPickupSound();
                    }
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
                    // Check if exit has already been activated to prevent spamming
                    if (!this.exitActivated) {
                        this.exitActivated = true; // Set flag to prevent multiple activations
                        this.gridManager.activateExit();
                        console.log('Level completed!');
                        
                        // Play level completion sound effect
                        if (window.game && window.game.audioManager) {
                            window.game.audioManager.playLevelCompleteSound();
                        }
                        
                        // Check if this is level 6 (World 1) to show victory menu
                        const currentLevel = window.game ? window.game.getCurrentLevel() : 1;
                        if (currentLevel === 6) {
                            // Level 6 completion - show victory menu
                            this.handleCylinderVictory();
                        } else {
                            // Regular level completion
                            if (this.levelCompletionCallback) {
                                this.levelCompletionCallback();
                            }
                        }
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
            // Check if ghost immunity has expired
            if (this.ghostImmunity && Date.now() - this.ghostImmunityStartTime > this.ghostImmunityDuration) {
                this.ghostImmunity = false;
                console.log('Ghost immunity expired');
            }
            
            // Skip collision detection if player has ghost immunity
            if (this.ghostImmunity) {
                console.log('Ghost collision blocked by immunity - remaining time:', this.ghostImmunityDuration - (Date.now() - this.ghostImmunityStartTime));
                return;
            }
            
            const playerPosition = this.player.getPosition();
            const playerBounds = this.getPlayerBoundingBox(playerPosition);
            
            for (let ghost of ghosts) {
                // Only check collision with active ghosts
                if (!ghost.isActive) {
                    continue; // Skip inactive ghosts (during head start periods)
                }
                
                const ghostBounds = this.getGhostBoundingBox(ghost.mesh.position);
                
                if (this.checkBoxCollision(playerBounds, ghostBounds)) {
                    console.log(`Ghost collision detected with ${ghost.color} ghost! Processing...`);
                    // Ghost touched player - reset player position or reduce health
                    this.handleGhostCollision(ghost);
                    break; // Only handle one ghost collision per frame
                }
            }
        }
    }
    
    handleGhostCollision(ghost) {
        console.log(`Ghost collision with ${ghost.color} ghost!`);
        
        // Lose a life first
        const remainingLives = this.player.loseLife();
        console.log(`Player lost a life! Remaining lives: ${remainingLives}`);
        
        // Play death sound effect
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playDeathSound();
        }
        
        // Activate ghost immunity to prevent rapid-fire kills
        this.ghostImmunity = true;
        this.ghostImmunityStartTime = Date.now();
        console.log('Ghost immunity activated for 200ms');
        
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
        
        // Show death notification popup
        if (window.game && window.game.uiManager) {
            const livesText = remainingLives === 1 ? 'life' : 'lives';
            if (remainingLives > 0) {
                window.game.uiManager.showNotification(`You died! ${remainingLives} ${livesText} remaining`, 'error', 3000);
            } else {
                window.game.uiManager.showNotification(`You died! Game Over!`, 'error', 3000);
            }
        }
        
        // Check if player is out of lives
        if (this.player.isOutOfLives()) {
            console.log('Game Over! Out of lives!');
            
            // Call game over callback if set - let main game handle life management
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
        
        // Play bounce sound effect
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playJumpSound();
        }
        
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
        
        // Check if spike immunity has expired
        if (this.spikeImmunity && Date.now() - this.spikeImmunityStartTime > this.spikeImmunityDuration) {
            this.spikeImmunity = false;
            console.log('Spike immunity expired');
        }
        
        // Skip collision detection if player has spike immunity
        if (this.spikeImmunity) return;
        
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
        
        // Play death sound effect
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playDeathSound();
        }
        
        // Reset player to spawn position (using safe spawn point)
        const levelData = this.gridManager.levelLoader.getCurrentLevel();
        const spawnPoint = this.getSafeSpawnPoint(levelData);
        this.player.setPosition(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        
        // Reset player velocity
        this.player.velocity.set(0, 0, 0);
        
        // Activate spike immunity
        this.spikeImmunity = true;
        this.spikeImmunityStartTime = Date.now();
        console.log('Spike immunity activated for 4 seconds');
        
        // Show death notification popup
        if (window.game && window.game.uiManager) {
            const livesText = remainingLives === 1 ? 'life' : 'lives';
            if (remainingLives > 0) {
                window.game.uiManager.showNotification(`You died! ${remainingLives} ${livesText} remaining`, 'error', 3000);
            } else {
                window.game.uiManager.showNotification(`You died! Game Over!`, 'error', 3000);
            }
        }
        
        // Check if player is out of lives
        if (this.player.isOutOfLives()) {
            console.log('Game Over! Out of lives!');
            
            // Call game over callback if set - let main game handle life management
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
    
    // Get safe spawn point away from spikes
    getSafeSpawnPoint(levelData) {
        const originalSpawn = levelData.spawn;
        const spikes = levelData.spikes || [];
        
        // For level 3, find a safe area away from spikes
        if (levelData.name && levelData.name.includes('Level 3')) {
                         // Look for safe spawn areas in level 3
            const safeSpawnCandidates = [
                { x: 12, y: 1, z: 1 },  // Main safe spawn (center)
                { x: 6, y: 1, z: 1 },   // Alternative safe spot
                { x: 18, y: 1, z: 1 },  // Alternative safe spot
                { x: 2, y: 1, z: 1 },   // Alternative safe spot
                { x: 10, y: 1, z: 1 },  // Alternative safe spot
                { x: 14, y: 1, z: 1 },  // Alternative safe spot
                { x: 22, y: 1, z: 1 }   // Alternative safe spot
            ];
            
            // Find the first safe spawn point (minimum 2 units away from any spike)
            for (const candidate of safeSpawnCandidates) {
                let isSafe = true;
                const minSafeDistance = 2.5; // Safety buffer
                
                for (const spike of spikes) {
                    const distance = Math.sqrt(
                        Math.pow(candidate.x - spike.x, 2) + 
                        Math.pow(candidate.z - spike.z, 2)
                    );
                    
                    if (distance < minSafeDistance) {
                        isSafe = false;
                        break;
                    }
                }
                
                if (isSafe) {
                    console.log(`Using safe spawn point: (${candidate.x}, ${candidate.y}, ${candidate.z})`);
                    return candidate;
                }
            }
        }
        
        // Fallback to original spawn point if no safe alternative found
        return originalSpawn;
    }
    
    // Check if player is ready to leave level and show notification
    checkReadyToLeaveNotification() {
        // Only show notification in regular mode, not in battle or pacman mode
        if (this.gridManager.levelType === 'pacman' || 
            (window.game && window.game.gameMode === 'battle')) {
            return;
        }
        
        // Check if all items are collected and notification hasn't been shown
        if (!this.readyToLeaveNotificationShown && this.gridManager.canActivateExit()) {
            this.readyToLeaveNotificationShown = true;
            
            // Show notification via UI Manager
            if (window.game && window.game.uiManager) {
                const levelData = this.gridManager.levelLoader.getCurrentLevel();
                const levelName = levelData.name || 'Level';
                const message = `🎉 All collectibles and keys found!<br>You are ready to leave ${levelName}!<br>Find and enter the exit to continue.`;
                
                window.game.uiManager.showNotification(message, 'success', 6000);
                console.log('Ready to leave level notification shown');
            }
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
        
        // Play teleportation sound effect
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playTeleportSound();
        }
        
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
        const levelData = this.gridManager.levelLoader.getCurrentLevel();
        const tileSize = this.gridManager.tileSize;
        
        // Use actual level dimensions instead of assuming square grid
        const levelWidth = levelData.size.width;
        const levelHeight = levelData.size.height;
        const halfWidth = (levelWidth * tileSize) / 2;
        const halfHeight = (levelHeight * tileSize) / 2;
        
        let corrected = false;
        
        // Check X boundaries (width)
        if (playerPosition.x < -halfWidth + this.playerRadius) {
            this.player.setPosition(-halfWidth + this.playerRadius, playerPosition.y, playerPosition.z);
            corrected = true;
        } else if (playerPosition.x > halfWidth - this.playerRadius) {
            this.player.setPosition(halfWidth - this.playerRadius, playerPosition.y, playerPosition.z);
            corrected = true;
        }
        
        // Check Z boundaries (height)
        if (playerPosition.z < -halfHeight + this.playerRadius) {
            this.player.setPosition(playerPosition.x, playerPosition.y, -halfHeight + this.playerRadius);
            corrected = true;
        } else if (playerPosition.z > halfHeight - this.playerRadius) {
            this.player.setPosition(playerPosition.x, playerPosition.y, halfHeight - this.playerRadius);
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

    getFruitBoundingBox(position) {
        const radius = 0.5; // Fruit is slightly larger than collectibles
        
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
        
        // Play collection sound effect
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playCollectSound();
        }
        
        // You could add visual effects here, like:
        // - Particle systems
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
            const borderWalls = this.gridManager.getBorderWalls();
            
            // Check regular walls
            for (let wall of walls) {
                const wallBounds = this.getWallBoundingBox(wall.position);
                if (this.checkBoxCollision(testBounds, wallBounds)) {
                    return false;
                }
            }
            
            // Check border walls
            for (let borderWall of borderWalls) {
                const borderWallBounds = this.getWallBoundingBox(borderWall.position);
                if (this.checkBoxCollision(testBounds, borderWallBounds)) {
                    return false;
                }
            }
        }
        
        // Check world boundaries (account for sphere radius)
        const levelData = this.gridManager.levelLoader.getCurrentLevel();
        const tileSize = this.gridManager.tileSize;
        const levelWidth = levelData.size.width;
        const levelHeight = levelData.size.height;
        const halfWidth = (levelWidth * tileSize) / 2;
        const halfHeight = (levelHeight * tileSize) / 2;
        
        if (position.x < -halfWidth + this.playerRadius || 
            position.x > halfWidth - this.playerRadius ||
            position.z < -halfHeight + this.playerRadius || 
            position.z > halfHeight - this.playerRadius ||
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
        this.cylinderVictoryTriggered = false; // Reset victory trigger
    }
    
    // Get current score
    getScore() {
        return this.score;
    }
    
    // Add points to score
    addScore(points) {
        this.score += points;
    }
    
    // Calculate level-based scoring for collectibles/pebbles
    calculateCollectibleScore(baseScore) {
        if (!window.game) return baseScore;
        
        const currentLevel = window.game.currentLevel;
        
        // Level-based multipliers for collectibles
        switch (currentLevel) {
            case 1: return 10;      // Level 1: 10 points
            case 2: return 50;      // Level 2: 50 points (5x)
            case 3: return 100;     // Level 3: 100 points (10x)
            case 4: return 200;     // Level 4: 200 points (20x)
            case 5: return 1000;    // Level 5: 1000 points (100x)
            default: return 10 + (currentLevel - 1) * 200; // Continue progression
        }
    }
    
    // Calculate level-based scoring for fruit
    calculateFruitScore(baseScore) {
        if (!window.game) return baseScore;
        
        const currentLevel = window.game.currentLevel;
        const isClassicMode = window.game.isClassicMode;
        
        // Classic mode uses wave-based scoring
        if (isClassicMode) {
            const wave = window.game.classicWave || 1;
            return 500 + (wave * 100); // Base 500 + 100 per wave
        }
        
        // Level-based multipliers for fruit (similar to collectibles but higher base)
        switch (currentLevel) {
            case 1: return 500;     // Level 1: 500 points
            case 2: return 1000;    // Level 2: 1000 points (2x)
            case 3: return 2000;    // Level 3: 2000 points (4x)
            case 4: return 4000;    // Level 4: 4000 points (8x)
            case 5: return 10000;   // Level 5: 10000 points (20x)
            default: return 500 + (currentLevel - 1) * 2000; // Continue progression
        }
    }
} 