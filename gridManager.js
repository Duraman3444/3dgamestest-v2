import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class GridManager {
    constructor(scene) {
        this.scene = scene;
        this.gridSize = 20;
        this.tileSize = 5;
        this.tiles = new Map();
        this.obstacles = [];
        this.collectibles = [];
        
        // Grid properties
        this.gridOffset = { x: 0, z: 0 };
        
        // Materials
        this.groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        this.obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.collectibleMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFD700,
            emissive: 0x444400
        });
        
        this.generateGrid();
        this.generateObstacles();
        this.generateCollectibles();
        this.validateSpawnPoint();
    }
    
    generateGrid() {
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
    
    collectItem(collectible) {
        if (!collectible.collected) {
            collectible.collected = true;
            collectible.mesh.visible = false;
            collectible.tile.occupied = false;
            collectible.tile.type = 'ground';
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
        }));
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