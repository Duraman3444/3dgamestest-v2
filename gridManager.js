import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class GridManager {
    constructor(scene, levelLoader = null) {
        this.scene = scene;
        this.levelLoader = levelLoader;
        this.tileSize = 5;
        this.tiles = new Map();
        this.obstacles = [];
        this.collectibles = [];
        this.keyObject = null;
        this.exitObject = null;
        this.walls = []; // For Pacman mode
        this.ghosts = []; // For Pacman mode
        
        // Get level data
        const levelData = this.levelLoader ? this.levelLoader.getCurrentLevel() : null;
        this.gridSize = levelData ? levelData.size.width : 20;
        this.levelType = levelData ? levelData.type : 'normal';
        
        // Grid properties
        this.gridOffset = { x: 0, z: 0 };
        
        // Materials
        this.groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        this.obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.collectibleMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFD700,
            emissive: 0x444400
        });
        this.keyMaterial = new THREE.MeshLambertMaterial({
            color: 0x00ffff,
            emissive: 0x004444
        });
        this.exitMaterial = new THREE.MeshLambertMaterial({
            color: 0x00ff00,
            emissive: 0x004400
        });
        // Pacman-specific materials
        this.wallMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
        this.ghostMaterials = {
            red: new THREE.MeshLambertMaterial({ color: 0xff0000 }),
            blue: new THREE.MeshLambertMaterial({ color: 0x0000ff }),
            green: new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
            pink: new THREE.MeshLambertMaterial({ color: 0xff69b4 })
        };
        
        this.generateLevel();
    }
    
    generateLevel() {
        if (this.levelLoader) {
            this.generateLevelFromData();
        } else {
            this.generateDefaultLevel();
        }
    }
    
    generateLevelFromData() {
        const levelData = this.levelLoader.getCurrentLevel();
        
        // Create ground plane
        const planeGeometry = new THREE.PlaneGeometry(levelData.size.width * this.tileSize, levelData.size.height * this.tileSize);
        const planeMesh = new THREE.Mesh(planeGeometry, this.groundMaterial);
        planeMesh.rotation.x = -Math.PI / 2;
        planeMesh.position.y = 0;
        planeMesh.receiveShadow = true;
        this.scene.add(planeMesh);
        
        // Generate tiles from level data
        this.generateTilesFromData(levelData.tiles);
        
        // Generate obstacles from level data (normal mode)
        if (levelData.obstacles) {
            this.generateObstaclesFromData(levelData.obstacles);
        }
        
        // Generate walls from level data (Pacman mode)
        if (levelData.walls) {
            this.generateWallsFromData(levelData.walls);
        }
        
        // Generate collectibles from level data
        this.generateCollectiblesFromData(levelData.coins);
        
        // Generate ghosts from level data (Pacman mode)
        if (levelData.ghosts) {
            this.generateGhostsFromData(levelData.ghosts);
        }
        
        // Generate key if present (normal mode)
        if (levelData.key) {
            this.generateKey(levelData.key);
        }
        
        // Generate exit if present
        if (levelData.exit) {
            this.generateExit(levelData.exit);
        }
    }
    
    generateDefaultLevel() {
        // Create ground plane
        const planeGeometry = new THREE.PlaneGeometry(this.gridSize * this.tileSize, this.gridSize * this.tileSize);
        const planeMesh = new THREE.Mesh(planeGeometry, this.groundMaterial);
        planeMesh.rotation.x = -Math.PI / 2;
        planeMesh.position.y = 0;
        planeMesh.receiveShadow = true;
        this.scene.add(planeMesh);
        
        // Generate individual tiles for more detailed control
        for (let x = 0; x < this.gridSize; x++) {
            for (let z = 0; z < this.gridSize; z++) {
                const tileKey = `${x},${z}`;
                const tile = this.createTile(x, z);
                this.tiles.set(tileKey, tile);
            }
        }
        
        this.generateObstacles();
        this.generateCollectibles();
        this.validateSpawnPoint();
    }
    
    generateTilesFromData(tilesData) {
        tilesData.forEach(tileData => {
            const tileKey = `${tileData.x},${tileData.z}`;
            const tile = this.createTile(tileData.x, tileData.z, tileData.height);
            this.tiles.set(tileKey, tile);
        });
    }
    
    createTile(x, z) {
        const worldX = (x - this.gridSize / 2) * this.tileSize;
        const worldZ = (z - this.gridSize / 2) * this.tileSize;
        
        return {
            x: x,
            z: z,
            worldX: worldX,
            worldZ: worldZ,
            occupied: false,
            type: 'ground',
            height: 0
        };
    }
    
    generateObstaclesFromData(obstaclesData) {
        obstaclesData.forEach(obstacleData => {
            const worldPos = this.levelLoader.gridToWorld(obstacleData.x, obstacleData.z, this.tileSize);
            const obstacleGeometry = new THREE.BoxGeometry(
                obstacleData.width || 2,
                obstacleData.height || 3,
                obstacleData.depth || 2
            );
            
            const obstacle = new THREE.Mesh(obstacleGeometry, this.obstacleMaterial);
            obstacle.position.set(worldPos.x, (obstacleData.height || 3) / 2, worldPos.z);
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            
            this.scene.add(obstacle);
            this.obstacles.push({
                mesh: obstacle,
                position: obstacle.position.clone(),
                gridX: obstacleData.x,
                gridZ: obstacleData.z,
                boundingBox: new THREE.Box3().setFromObject(obstacle)
            });
        });
    }
    
    generateWallsFromData(wallsData) {
        wallsData.forEach(wallData => {
            const worldPos = this.levelLoader.gridToWorld(wallData.x, wallData.z, this.tileSize);
            const wallGeometry = new THREE.BoxGeometry(
                this.tileSize * 0.8,
                wallData.height || 3,
                this.tileSize * 0.8
            );
            
            const wall = new THREE.Mesh(wallGeometry, this.wallMaterial);
            wall.position.set(worldPos.x, (wallData.height || 3) / 2, worldPos.z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            
            this.scene.add(wall);
            this.walls.push({
                mesh: wall,
                position: wall.position.clone(),
                gridX: wallData.x,
                gridZ: wallData.z,
                boundingBox: new THREE.Box3().setFromObject(wall)
            });
        });
    }
    
    generateGhostsFromData(ghostsData) {
        const ghostGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        
        ghostsData.forEach(ghostData => {
            // For pacman mode, spawn ghosts at top of map instead of their defined position
            let spawnX, spawnZ;
            if (this.levelType === 'pacman') {
                spawnX = ghostData.x;
                spawnZ = 1; // Top of map
            } else {
                spawnX = ghostData.x;
                spawnZ = ghostData.z;
            }
            
            const worldPos = this.levelLoader.gridToWorld(spawnX, spawnZ, this.tileSize);
            const ghostMaterial = this.ghostMaterials[ghostData.color] || this.ghostMaterials.red;
            const ghost = new THREE.Mesh(ghostGeometry, ghostMaterial);
            ghost.position.set(worldPos.x, ghostData.y || 1, worldPos.z);
            ghost.castShadow = true;
            
            this.scene.add(ghost);
            this.ghosts.push({
                mesh: ghost,
                position: ghost.position.clone(),
                gridX: spawnX,
                gridZ: spawnZ,
                color: ghostData.color,
                direction: { x: 1, z: 0 }, // Initial direction
                speed: ghostData.speed || 11.0, // Use individual ghost speed from level data
                lastDirectionChange: 0,
                chaseMode: this.levelType === 'pacman', // For pacman mode, always chase (enhanced tracking)
                chaseRange: this.levelType === 'pacman' ? 999.0 : 15.0, // Unlimited chase range for pacman mode
                lastPlayerPosition: null,
                stuckCounter: 0, // Track if ghost is stuck
                
                // Pacman-specific properties
                isActive: this.levelType !== 'pacman', // Start inactive for pacman mode (8 second delay)
                activationTime: this.levelType === 'pacman' ? 8.0 : 0, // 8 second head start
                spawnTime: performance.now() * 0.001
            });
        });
    }
    
    generateObstacles() {
        const obstacleCount = 30;
        const obstacleGeometry = new THREE.BoxGeometry(2, 3, 2);
        
        for (let i = 0; i < obstacleCount; i++) {
            const x = Math.floor(Math.random() * this.gridSize);
            const z = Math.floor(Math.random() * this.gridSize);
            const tileKey = `${x},${z}`;
            const tile = this.tiles.get(tileKey);
            
            if (tile && !tile.occupied) {
                const obstacle = new THREE.Mesh(obstacleGeometry, this.obstacleMaterial);
                obstacle.position.set(tile.worldX, 1.5, tile.worldZ);
                obstacle.castShadow = true;
                obstacle.receiveShadow = true;
                
                this.scene.add(obstacle);
                this.obstacles.push({
                    mesh: obstacle,
                    position: obstacle.position.clone(),
                    tile: tile,
                    boundingBox: new THREE.Box3().setFromObject(obstacle)
                });
                
                tile.occupied = true;
                tile.type = 'obstacle';
            }
        }
    }
    
    generateCollectiblesFromData(coinsData) {
        const collectibleGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        
        coinsData.forEach(coinData => {
            const worldPos = this.levelLoader.gridToWorld(coinData.x, coinData.z, this.tileSize);
            const collectible = new THREE.Mesh(collectibleGeometry, this.collectibleMaterial);
            collectible.position.set(worldPos.x, coinData.y || 1, worldPos.z);
            collectible.castShadow = true;
            
            this.scene.add(collectible);
            this.collectibles.push({
                mesh: collectible,
                position: collectible.position.clone(),
                gridX: coinData.x,
                gridZ: coinData.z,
                collected: false,
                rotationSpeed: Math.random() * 0.02 + 0.01,
                bounceSpeed: Math.random() * 0.02 + 0.01,
                bounceHeight: 0.5
            });
        });
    }
    
    generateKey(keyData) {
        const keyGeometry = new THREE.BoxGeometry(0.5, 0.2, 1);
        const worldPos = this.levelLoader.gridToWorld(keyData.x, keyData.z, this.tileSize);
        
        const key = new THREE.Mesh(keyGeometry, this.keyMaterial);
        key.position.set(worldPos.x, keyData.y || 1, worldPos.z);
        key.castShadow = true;
        
        this.scene.add(key);
        this.keyObject = {
            mesh: key,
            position: key.position.clone(),
            gridX: keyData.x,
            gridZ: keyData.z,
            collected: false,
            rotationSpeed: 0.02
        };
    }
    
    generateExit(exitData) {
        const exitGeometry = new THREE.BoxGeometry(
            exitData.width || 3,
            exitData.height || 4,
            exitData.depth || 3
        );
        const worldPos = this.levelLoader.gridToWorld(exitData.x, exitData.z, this.tileSize);
        
        const exit = new THREE.Mesh(exitGeometry, this.exitMaterial);
        exit.position.set(worldPos.x, (exitData.height || 4) / 2, worldPos.z);
        exit.castShadow = true;
        exit.receiveShadow = true;
        
        this.scene.add(exit);
        this.exitObject = {
            mesh: exit,
            position: exit.position.clone(),
            gridX: exitData.x,
            gridZ: exitData.z,
            activated: false
        };
    }
    
    generateCollectibles() {
        const collectibleCount = 15;
        const collectibleGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        
        for (let i = 0; i < collectibleCount; i++) {
            const x = Math.floor(Math.random() * this.gridSize);
            const z = Math.floor(Math.random() * this.gridSize);
            const tileKey = `${x},${z}`;
            const tile = this.tiles.get(tileKey);
            
            if (tile && !tile.occupied) {
                const collectible = new THREE.Mesh(collectibleGeometry, this.collectibleMaterial);
                collectible.position.set(tile.worldX, 1, tile.worldZ);
                collectible.castShadow = true;
                
                this.scene.add(collectible);
                this.collectibles.push({
                    mesh: collectible,
                    position: collectible.position.clone(),
                    tile: tile,
                    collected: false,
                    rotationSpeed: Math.random() * 0.02 + 0.01,
                    bounceSpeed: Math.random() * 0.02 + 0.01,
                    bounceHeight: 0.5
                });
                
                tile.occupied = true;
                tile.type = 'collectible';
            }
        }
    }
    
    update(deltaTime) {
        // Animate collectibles
        this.collectibles.forEach((collectible, index) => {
            if (!collectible.collected) {
                // Rotate collectible
                collectible.mesh.rotation.y += collectible.rotationSpeed;
                
                // Bounce collectible
                const time = performance.now() * 0.001;
                collectible.mesh.position.y = collectible.position.y + 
                    Math.sin(time * collectible.bounceSpeed * 10) * collectible.bounceHeight;
            }
        });
        
        // Animate key
        if (this.keyObject && !this.keyObject.collected) {
            this.keyObject.mesh.rotation.y += this.keyObject.rotationSpeed;
        }
        
        // Animate exit (subtle pulsing)
        if (this.exitObject) {
            const time = performance.now() * 0.001;
            const scale = 1 + Math.sin(time * 2) * 0.05;
            this.exitObject.mesh.scale.set(scale, scale, scale);
        }
        
        // Update ghosts (Pacman mode)
        if (this.levelType === 'pacman' && this.ghosts.length > 0) {
            this.updateGhosts(deltaTime);
        }
    }
    
    updateGhosts(deltaTime) {
        // Get player position for chase AI
        const playerPosition = this.getPlayerPosition();
        const currentTime = performance.now() * 0.001;
        
        this.ghosts.forEach((ghost, index) => {
            // Check if ghost should be active yet (8-second delay for pacman mode)
            if (!ghost.isActive) {
                if (currentTime - ghost.spawnTime >= ghost.activationTime) {
                    ghost.isActive = true;
                    console.log(`${ghost.color} ghost activated!`);
                } else {
                    return; // Skip this ghost if not active yet
                }
            }
            
            // Update ghost speed based on current level (for pacman mode)
            if (this.levelType === 'pacman' && window.game) {
                ghost.speed = window.game.getGhostSpeed();
            } else if (this.levelType !== 'pacman') {
                // For non-pacman modes, keep the individual ghost speed from level data
                // Don't override the speed - it was set during ghost creation
            }
            
            const moveDistance = ghost.speed * deltaTime;
            
            // Check if player is within chase range
            const distanceToPlayer = playerPosition ? 
                Math.sqrt(
                    Math.pow(ghost.mesh.position.x - playerPosition.x, 2) + 
                    Math.pow(ghost.mesh.position.z - playerPosition.z, 2)
                ) : Infinity;
            
            let targetDirection = null;
            
            // Determine if ghost should chase player
            if (playerPosition && distanceToPlayer <= ghost.chaseRange) {
                // For pacman mode, always chase (no line of sight requirement)
                // For normal mode, check line of sight
                if (this.levelType === 'pacman' || this.hasLineOfSight(ghost.mesh.position, playerPosition)) {
                    ghost.chaseMode = true;
                    ghost.lastPlayerPosition = playerPosition.clone();
                    
                    // Calculate direction toward player
                    const directionToPlayer = new THREE.Vector3(
                        playerPosition.x - ghost.mesh.position.x,
                        0,
                        playerPosition.z - ghost.mesh.position.z
                    ).normalize();
                    
                    targetDirection = {
                        x: directionToPlayer.x,
                        z: directionToPlayer.z
                    };
                } else {
                    ghost.chaseMode = false;
                }
            } else {
                ghost.chaseMode = false;
            }
            
            // If not chasing or no clear path, use normal AI
            if (!targetDirection) {
                targetDirection = ghost.direction;
            }
            
            // Smart pathfinding: try to move directly toward player first
            let newX = ghost.mesh.position.x + (targetDirection.x * moveDistance);
            let newZ = ghost.mesh.position.z + (targetDirection.z * moveDistance);
            
            // Check if direct path to player is clear
            if (this.canGhostMoveTo(newX, newZ)) {
                ghost.mesh.position.x = newX;
                ghost.mesh.position.z = newZ;
                ghost.direction = targetDirection;
                ghost.lastDirectionChange = currentTime;
                ghost.stuckCounter = 0; // Reset stuck counter
            } else {
                // Direct path blocked, find alternative path
                const alternativeDirection = this.findBestAlternativeDirection(ghost, playerPosition, moveDistance);
                
                if (alternativeDirection) {
                    newX = ghost.mesh.position.x + (alternativeDirection.x * moveDistance);
                    newZ = ghost.mesh.position.z + (alternativeDirection.z * moveDistance);
                    
                    if (this.canGhostMoveTo(newX, newZ)) {
                        ghost.mesh.position.x = newX;
                        ghost.mesh.position.z = newZ;
                        ghost.direction = alternativeDirection;
                        ghost.lastDirectionChange = currentTime;
                        ghost.stuckCounter = 0; // Reset stuck counter
                    } else {
                        // Still stuck, increment stuck counter
                        ghost.stuckCounter = (ghost.stuckCounter || 0) + 1;
                        
                        // If stuck for too long, try teleporting closer to player
                        if (ghost.stuckCounter > 120) { // 2 seconds at 60fps
                            this.unstuckGhost(ghost, playerPosition);
                        }
                    }
                } else {
                    // No alternative found, increment stuck counter
                    ghost.stuckCounter = (ghost.stuckCounter || 0) + 1;
                    
                    // If stuck for too long, try teleporting closer to player
                    if (ghost.stuckCounter > 120) { // 2 seconds at 60fps
                        this.unstuckGhost(ghost, playerPosition);
                    }
                }
            }
            
            // For pacman mode, ghosts should always be chasing (no random movement)
            // For normal mode, add some random movement when not chasing
            if (this.levelType !== 'pacman' && !ghost.chaseMode && currentTime - ghost.lastDirectionChange > 3 && Math.random() < 0.1) {
                const directions = [
                    { x: 1, z: 0 },   // Right
                    { x: -1, z: 0 },  // Left
                    { x: 0, z: 1 },   // Forward
                    { x: 0, z: -1 }   // Backward
                ];
                ghost.direction = directions[Math.floor(Math.random() * directions.length)];
                ghost.lastDirectionChange = currentTime;
            }
        });
    }
    
    canGhostMoveTo(worldX, worldZ) {
        // Check if position is within bounds
        if (!this.isInBounds(worldX, worldZ)) {
            return false;
        }
        
        // Check for wall collisions (more lenient for better movement)
        for (let wall of this.walls) {
            const distance = Math.sqrt(
                Math.pow(wall.position.x - worldX, 2) + 
                Math.pow(wall.position.z - worldZ, 2)
            );
            
            // Use ghost radius (0.4) plus small buffer instead of tileSize * 0.6
            if (distance < 0.8) { // 0.4 (ghost radius) + 0.4 (buffer)
                return false;
            }
        }
        
        return true;
    }
    
    // Find the best alternative direction when direct path to player is blocked
    findBestAlternativeDirection(ghost, playerPosition, moveDistance) {
        if (!playerPosition) return null;
        
        // Try more directions including diagonals for better pathfinding
        const directions = [
            { x: 1, z: 0 },   // Right
            { x: -1, z: 0 },  // Left
            { x: 0, z: 1 },   // Forward
            { x: 0, z: -1 },  // Backward
            { x: 1, z: 1 },   // Diagonal NE
            { x: -1, z: 1 },  // Diagonal NW
            { x: 1, z: -1 },  // Diagonal SE
            { x: -1, z: -1 }  // Diagonal SW
        ];
        
        // Score each direction based on how close it gets to the player
        const scoredDirections = directions.map(dir => {
            const testX = ghost.mesh.position.x + (dir.x * moveDistance * 3);
            const testZ = ghost.mesh.position.z + (dir.z * moveDistance * 3);
            
            // Check if this direction is passable
            if (!this.canGhostMoveTo(testX, testZ)) {
                return { direction: dir, score: -1 }; // Invalid direction
            }
            
            // Calculate distance to player from this new position
            const distanceToPlayer = Math.sqrt(
                Math.pow(testX - playerPosition.x, 2) + 
                Math.pow(testZ - playerPosition.z, 2)
            );
            
            // Lower distance = higher score
            return { direction: dir, score: -distanceToPlayer };
        });
        
        // Sort by score (highest first) and filter out invalid directions
        scoredDirections.sort((a, b) => b.score - a.score);
        const validDirections = scoredDirections.filter(d => d.score > -1);
        
        // Try the best directions first
        for (let dirData of validDirections) {
            const testX = ghost.mesh.position.x + (dirData.direction.x * moveDistance);
            const testZ = ghost.mesh.position.z + (dirData.direction.z * moveDistance);
            
            if (this.canGhostMoveTo(testX, testZ)) {
                return dirData.direction;
            }
        }
        
        return null; // No valid direction found
    }
    
    // Unstuck a ghost by finding the nearest open space closer to the player
    unstuckGhost(ghost, playerPosition) {
        if (!playerPosition) return;
        
        console.log(`Unstucking ${ghost.color} ghost...`);
        
        // Try to find a clear path closer to the player
        const directionToPlayer = new THREE.Vector3(
            playerPosition.x - ghost.mesh.position.x,
            0,
            playerPosition.z - ghost.mesh.position.z
        ).normalize();
        
        // Try positions at increasing distances from current position toward player
        for (let distance = this.tileSize; distance <= this.tileSize * 3; distance += this.tileSize) {
            const testX = ghost.mesh.position.x + (directionToPlayer.x * distance);
            const testZ = ghost.mesh.position.z + (directionToPlayer.z * distance);
            
            if (this.canGhostMoveTo(testX, testZ)) {
                ghost.mesh.position.x = testX;
                ghost.mesh.position.z = testZ;
                ghost.stuckCounter = 0;
                console.log(`${ghost.color} ghost unstuck!`);
                return;
            }
        }
        
        // If we can't find a spot toward the player, try a circular search around current position
        const searchRadius = this.tileSize * 2;
        const angleStep = Math.PI / 8; // 22.5 degrees
        
        for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
            const testX = ghost.mesh.position.x + Math.cos(angle) * searchRadius;
            const testZ = ghost.mesh.position.z + Math.sin(angle) * searchRadius;
            
            if (this.canGhostMoveTo(testX, testZ)) {
                ghost.mesh.position.x = testX;
                ghost.mesh.position.z = testZ;
                ghost.stuckCounter = 0;
                console.log(`${ghost.color} ghost unstuck to nearby position!`);
                return;
            }
        }
        
        // Last resort: reset stuck counter to prevent infinite attempts
        ghost.stuckCounter = 0;
        console.log(`Could not unstuck ${ghost.color} ghost, resetting counter`);
    }
    
    getPlayerPosition() {
        // First try to use direct player reference
        if (this.player) {
            return this.player.getPosition();
        }
        
        // Fallback: try to get player position from the scene
        const player = this.scene.getObjectByName('player');
        if (player) {
            return player.position.clone();
        }
        
        // No player found
        return null;
    }
    
    hasLineOfSight(ghostPosition, playerPosition) {
        // Simple line-of-sight check: cast a ray from ghost to player
        // and see if it hits any walls
        
        const direction = new THREE.Vector3(
            playerPosition.x - ghostPosition.x,
            0,
            playerPosition.z - ghostPosition.z
        ).normalize();
        
        const distance = Math.sqrt(
            Math.pow(playerPosition.x - ghostPosition.x, 2) + 
            Math.pow(playerPosition.z - ghostPosition.z, 2)
        );
        
        // Check for wall intersections along the path
        const checkPoints = Math.ceil(distance / (this.tileSize * 0.5));
        
        for (let i = 1; i < checkPoints; i++) {
            const checkX = ghostPosition.x + (direction.x * (distance * i / checkPoints));
            const checkZ = ghostPosition.z + (direction.z * (distance * i / checkPoints));
            
            // Check if this point intersects with any wall
            for (let wall of this.walls) {
                const wallDistance = Math.sqrt(
                    Math.pow(wall.position.x - checkX, 2) + 
                    Math.pow(wall.position.z - checkZ, 2)
                );
                
                if (wallDistance < this.tileSize * 0.4) {
                    return false; // Line of sight blocked by wall
                }
            }
        }
        
        return true; // Clear line of sight
    }
    
    getTileAt(worldX, worldZ) {
        const gridX = Math.floor((worldX + this.gridSize * this.tileSize / 2) / this.tileSize);
        const gridZ = Math.floor((worldZ + this.gridSize * this.tileSize / 2) / this.tileSize);
        
        if (gridX >= 0 && gridX < this.gridSize && gridZ >= 0 && gridZ < this.gridSize) {
            const tileKey = `${gridX},${gridZ}`;
            return this.tiles.get(tileKey);
        }
        return null;
    }
    
    getObstacles() {
        return this.obstacles;
    }
    
    getCollectibles() {
        return this.collectibles.filter(c => !c.collected);
    }
    
    getKey() {
        return this.keyObject;
    }
    
    getExit() {
        return this.exitObject;
    }
    
    // Get walls (for Pacman mode)
    getWalls() {
        return this.walls;
    }
    
    // Get ghosts (for Pacman mode)
    getGhosts() {
        return this.ghosts;
    }
    
    // Get walls (for Pacman mode)
    getWalls() {
        return this.walls;
    }
    
    // Get ghost positions for minimap
    getGhostPositions() {
        return this.ghosts.map(ghost => ({
            x: ghost.gridX,
            z: ghost.gridZ,
            worldX: ghost.mesh.position.x,
            worldZ: ghost.mesh.position.z,
            color: ghost.color,
            chaseMode: ghost.chaseMode
        }));
    }
    
    // Set player reference for better position access
    setPlayer(player) {
        this.player = player;
    }
    
    // Get key information
    getKeyInfo() {
        const hasKey = this.keyObject !== null;
        const isCollected = this.keyObject && this.keyObject.collected;
        
        return {
            totalKeys: hasKey ? 1 : 0,
            collectedKeys: isCollected ? 1 : 0
        };
    }

    collectItem(collectible) {
        if (!collectible.collected) {
            collectible.collected = true;
            collectible.mesh.visible = false;
            if (collectible.tile) {
                collectible.tile.occupied = false;
                collectible.tile.type = 'ground';
            }
            return true;
        }
        return false;
    }
    
    collectKey() {
        if (this.keyObject && !this.keyObject.collected) {
            this.keyObject.collected = true;
            this.keyObject.mesh.visible = false;
            return true;
        }
        return false;
    }
    
    canActivateExit() {
        // Different win conditions for different game modes
        if (this.levelType === 'pacman') {
            // In Pacman mode, just need to collect all collectibles (no key required)
            const remainingCollectibles = this.collectibles.filter(c => !c.collected);
            return remainingCollectibles.length === 0;
        } else {
            // In normal mode, check if key is collected (if key exists)
            if (this.keyObject && !this.keyObject.collected) {
                return false;
            }
            
            // Check if all collectibles are collected
            const remainingCollectibles = this.collectibles.filter(c => !c.collected);
            return remainingCollectibles.length === 0;
        }
    }
    
    activateExit() {
        if (this.exitObject && this.canActivateExit()) {
            this.exitObject.activated = true;
            // Change exit color to indicate it's active
            this.exitObject.mesh.material.color.setHex(0x00ff00);
            this.exitObject.mesh.material.emissive.setHex(0x004400);
            return true;
        }
        return false;
    }
    
    // Check if a position is within bounds
    isInBounds(x, z) {
        const halfSize = (this.gridSize * this.tileSize) / 2;
        return x >= -halfSize && x <= halfSize && z >= -halfSize && z <= halfSize;
    }
    
    // Get ground height at position (for collision system)
    getGroundHeight(x, z) {
        const tile = this.getTileAt(x, z);
        return tile ? tile.height : 0;
    }
    
    // Get all solid objects for collision detection
    getSolidObjects() {
        return this.obstacles.map(obstacle => ({
            boundingBox: obstacle.boundingBox,
            position: obstacle.position,
            type: 'obstacle'
        })).concat(this.walls.map(wall => ({
            boundingBox: wall.boundingBox,
            position: wall.position,
            type: 'wall'
        })));
    }
    
    // Utility method to add new obstacles dynamically
    addObstacle(x, z, height = 3) {
        const tile = this.getTileAt(x, z);
        if (tile && !tile.occupied) {
            const obstacleGeometry = new THREE.BoxGeometry(2, height, 2);
            const obstacle = new THREE.Mesh(obstacleGeometry, this.obstacleMaterial);
            obstacle.position.set(tile.worldX, height / 2, tile.worldZ);
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            
            this.scene.add(obstacle);
            this.obstacles.push({
                mesh: obstacle,
                position: obstacle.position.clone(),
                tile: tile,
                boundingBox: new THREE.Box3().setFromObject(obstacle)
            });
            
            tile.occupied = true;
            tile.type = 'obstacle';
            return true;
        }
        return false;
    }
    
    // Get remaining collectibles count
    getRemainingCollectibles() {
        return this.collectibles.filter(c => !c.collected).length;
    }
    
    // Get collectible positions for minimap
    getCollectiblePositions() {
        return this.collectibles
            .filter(c => !c.collected)
            .map(c => ({
                x: c.gridX,
                z: c.gridZ,
                worldX: c.position.x,
                worldZ: c.position.z
            }));
    }
    
    // Get key position for minimap
    getKeyPosition() {
        if (this.keyObject && !this.keyObject.collected) {
            return {
                x: this.keyObject.gridX,
                z: this.keyObject.gridZ,
                worldX: this.keyObject.position.x,
                worldZ: this.keyObject.position.z
            };
        }
        return null;
    }
    
    // Get exit position for minimap
    getExitPosition() {
        if (this.exitObject) {
            return {
                x: this.exitObject.gridX,
                z: this.exitObject.gridZ,
                worldX: this.exitObject.position.x,
                worldZ: this.exitObject.position.z,
                activated: this.exitObject.activated
            };
        }
        return null;
    }
    
    // Validate spawn point and ensure ground exists
    validateSpawnPoint() {
        const spawnPoint = { x: 0, y: 1, z: 0 }; // Adjusted for sphere radius (1 unit above ground)
        
        // Check if there's ground at spawn point
        const tile = this.getTileAt(spawnPoint.x, spawnPoint.z);
        if (!tile) {
            console.warn('No ground tile at spawn point, creating one');
            this.createGroundTileAt(spawnPoint.x, spawnPoint.z);
        }
        
        // Ensure spawn point is clear of obstacles (larger radius for sphere)
        this.clearObstaclesAtPosition(spawnPoint.x, spawnPoint.z, 4); // 4 tile radius for sphere
        
        return spawnPoint;
    }
    
    // Get spawn point from level data or use default
    getSpawnPoint(levelData) {
        if (levelData && levelData.spawnPoint) {
            return {
                x: levelData.spawnPoint.x || 0,
                y: Math.max(levelData.spawnPoint.y || 1, 1), // Ensure above ground (sphere radius)
                z: levelData.spawnPoint.z || 0
            };
        }
        return { x: 0, y: 1, z: 0 }; // Fallback default for sphere
    }
    
    // Create ground tile at specific position
    createGroundTileAt(worldX, worldZ) {
        const gridX = Math.floor((worldX + this.gridSize * this.tileSize / 2) / this.tileSize);
        const gridZ = Math.floor((worldZ + this.gridSize * this.tileSize / 2) / this.tileSize);
        
        if (gridX >= 0 && gridX < this.gridSize && gridZ >= 0 && gridZ < this.gridSize) {
            const tileKey = `${gridX},${gridZ}`;
            if (!this.tiles.has(tileKey)) {
                const tile = this.createTile(gridX, gridZ);
                this.tiles.set(tileKey, tile);
            }
        }
    }
    
    // Clear obstacles in a radius around a position
    clearObstaclesAtPosition(worldX, worldZ, radius) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const distance = Math.sqrt(
                Math.pow(obstacle.position.x - worldX, 2) + 
                Math.pow(obstacle.position.z - worldZ, 2)
            );
            
            if (distance <= radius) {
                // Remove obstacle from scene
                this.scene.remove(obstacle.mesh);
                // Mark tile as unoccupied
                if (obstacle.tile) {
                    obstacle.tile.occupied = false;
                    obstacle.tile.type = 'ground';
                }
                // Remove from obstacles array
                this.obstacles.splice(i, 1);
            }
        }
    }
} 