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
            const worldPos = this.levelLoader.gridToWorld(ghostData.x, ghostData.z, this.tileSize);
            const ghostMaterial = this.ghostMaterials[ghostData.color] || this.ghostMaterials.red;
            const ghost = new THREE.Mesh(ghostGeometry, ghostMaterial);
            ghost.position.set(worldPos.x, ghostData.y || 1, worldPos.z);
            ghost.castShadow = true;
            
            this.scene.add(ghost);
            this.ghosts.push({
                mesh: ghost,
                position: ghost.position.clone(),
                gridX: ghostData.x,
                gridZ: ghostData.z,
                color: ghostData.color,
                direction: { x: 1, z: 0 }, // Initial direction
                speed: 11.0, // Slightly faster than player (player speed is 10)
                lastDirectionChange: 0,
                chaseMode: false, // Whether ghost is actively chasing player
                chaseRange: 15.0, // Distance at which ghost starts chasing
                lastPlayerPosition: null
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
        
        this.ghosts.forEach((ghost, index) => {
            const moveDistance = ghost.speed * deltaTime;
            const currentTime = performance.now() * 0.001;
            
            // Check if player is within chase range
            const distanceToPlayer = playerPosition ? 
                Math.sqrt(
                    Math.pow(ghost.mesh.position.x - playerPosition.x, 2) + 
                    Math.pow(ghost.mesh.position.z - playerPosition.z, 2)
                ) : Infinity;
            
            let targetDirection = null;
            
            // Determine if ghost should chase player
            if (playerPosition && distanceToPlayer <= ghost.chaseRange) {
                // Check if there's a clear line of sight to player
                if (this.hasLineOfSight(ghost.mesh.position, playerPosition)) {
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
            
            // Calculate new position
            const newX = ghost.mesh.position.x + (targetDirection.x * moveDistance);
            const newZ = ghost.mesh.position.z + (targetDirection.z * moveDistance);
            
            // Check for wall collisions
            const canMove = this.canGhostMoveTo(newX, newZ);
            
            if (canMove) {
                ghost.mesh.position.x = newX;
                ghost.mesh.position.z = newZ;
                
                // Update direction if chasing
                if (ghost.chaseMode && targetDirection !== ghost.direction) {
                    ghost.direction = targetDirection;
                    ghost.lastDirectionChange = currentTime;
                }
            } else {
                // Change direction when hitting wall
                if (currentTime - ghost.lastDirectionChange > 0.5) {
                    const directions = [
                        { x: 1, z: 0 },   // Right
                        { x: -1, z: 0 },  // Left
                        { x: 0, z: 1 },   // Forward
                        { x: 0, z: -1 }   // Backward
                    ];
                    
                    // If chasing, prefer directions that get closer to player
                    if (ghost.chaseMode && playerPosition) {
                        directions.sort((a, b) => {
                            const aDistance = Math.sqrt(
                                Math.pow((ghost.mesh.position.x + a.x * moveDistance * 2) - playerPosition.x, 2) + 
                                Math.pow((ghost.mesh.position.z + a.z * moveDistance * 2) - playerPosition.z, 2)
                            );
                            const bDistance = Math.sqrt(
                                Math.pow((ghost.mesh.position.x + b.x * moveDistance * 2) - playerPosition.x, 2) + 
                                Math.pow((ghost.mesh.position.z + b.z * moveDistance * 2) - playerPosition.z, 2)
                            );
                            return aDistance - bDistance;
                        });
                    }
                    
                    // Try each direction to find one that doesn't hit a wall
                    for (let dir of directions) {
                        const testX = ghost.mesh.position.x + (dir.x * moveDistance * 2);
                        const testZ = ghost.mesh.position.z + (dir.z * moveDistance * 2);
                        
                        if (this.canGhostMoveTo(testX, testZ)) {
                            ghost.direction = dir;
                            ghost.lastDirectionChange = currentTime;
                            break;
                        }
                    }
                }
            }
            
            // Less frequent random direction changes when not chasing
            if (!ghost.chaseMode && currentTime - ghost.lastDirectionChange > 3 && Math.random() < 0.1) {
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
        
        // Check for wall collisions
        for (let wall of this.walls) {
            const distance = Math.sqrt(
                Math.pow(wall.position.x - worldX, 2) + 
                Math.pow(wall.position.z - worldZ, 2)
            );
            
            if (distance < this.tileSize * 0.6) {
                return false;
            }
        }
        
        return true;
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