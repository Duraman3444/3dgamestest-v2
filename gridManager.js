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
        this.borderWalls = []; // For Pacman mode border
        this.bouncePads = []; // For bounce pad mechanics
        this.spikes = []; // For spike trap mechanics
        this.holes = []; // For hole mechanics
        
        // Get level data
        const levelData = this.levelLoader ? this.levelLoader.getCurrentLevel() : null;
        this.gridSize = levelData ? levelData.size.width : 20;
        this.levelType = levelData ? levelData.type : 'normal';
        
        // Grid properties
        this.gridOffset = { x: 0, z: 0 };
        
        // Check if we're in Pacman mode to apply neon theme
        const isPacmanMode = this.levelType === 'pacman';
        
        // Get current level number for PS2 theme variation
        const currentLevel = window.game ? window.game.currentLevel : 1;
        
        // PS2 Color Themes for Single Player Mode
        const ps2Themes = {
            1: { // Classic PS2 Blue
                ground: 0x003366,
                groundEmissive: 0x000033,
                obstacle: 0x0066CC,
                obstacleEmissive: 0x001155,
                accent: 0x00FFFF
            },
            2: { // PS2 Purple/Magenta
                ground: 0x330066,
                groundEmissive: 0x220033,
                obstacle: 0x6600CC,
                obstacleEmissive: 0x330055,
                accent: 0xFF00FF
            },
            3: { // PS2 Green
                ground: 0x003300,
                groundEmissive: 0x001100,
                obstacle: 0x006600,
                obstacleEmissive: 0x003300,
                accent: 0x00FF00
            },
            4: { // PS2 Orange/Red
                ground: 0x663300,
                groundEmissive: 0x331100,
                obstacle: 0xCC6600,
                obstacleEmissive: 0x663300,
                accent: 0xFF6600
            },
            5: { // PS2 Cyan
                ground: 0x003333,
                groundEmissive: 0x001111,
                obstacle: 0x006666,
                obstacleEmissive: 0x003333,
                accent: 0x00CCCC
            },
            6: { // PS2 Yellow/Gold
                ground: 0x333300,
                groundEmissive: 0x221100,
                obstacle: 0x666600,
                obstacleEmissive: 0x443300,
                accent: 0xFFFF00
            },
            7: { // PS2 Pink
                ground: 0x660033,
                groundEmissive: 0x330011,
                obstacle: 0xCC0066,
                obstacleEmissive: 0x660033,
                accent: 0xFF0099
            },
            8: { // PS2 Deep Blue
                ground: 0x000066,
                groundEmissive: 0x000033,
                obstacle: 0x0000CC,
                obstacleEmissive: 0x000066,
                accent: 0x3333FF
            },
            9: { // PS2 Deep Purple
                ground: 0x330033,
                groundEmissive: 0x220022,
                obstacle: 0x660066,
                obstacleEmissive: 0x440044,
                accent: 0xCC00CC
            },
            10: { // PS2 Rainbow/Final Level
                ground: 0x333366,
                groundEmissive: 0x222244,
                obstacle: 0x6666CC,
                obstacleEmissive: 0x444488,
                accent: 0x9999FF
            }
        };
        
        // Get current theme (cycle through themes if level > 10)
        const themeIndex = ((currentLevel - 1) % 10) + 1;
        const currentTheme = ps2Themes[themeIndex];
        const isPS2Mode = this.levelType === 'normal' && currentTheme; // PS2 theme for normal mode
        
        // Materials - Apply neon theme for Pacman mode
        if (isPacmanMode) {
            // Neon 80s/Tron theme for Pacman
            this.groundMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x000022, // Very dark blue, almost black
                emissive: 0x000011 // Subtle blue glow
            });
            this.obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            this.collectibleMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFFF00, // Bright yellow
                emissive: 0x888800 // Strong yellow glow
            });
            this.keyMaterial = new THREE.MeshLambertMaterial({
                color: 0x00ffff,
                emissive: 0x004444
            });
            this.exitMaterial = new THREE.MeshLambertMaterial({
                color: 0x00ff00,
                emissive: 0x008800 // Bright green glow
            });
            // Neon Pacman-specific materials
            this.wallMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x00FFFF, // Bright cyan
                emissive: 0x006666 // Cyan glow
            });
            this.ghostMaterials = {
                red: new THREE.MeshLambertMaterial({ 
                    color: 0xFF0000, // Pure bright red - classic Pacman red
                    emissive: 0xFF0000, // Strong red glow for high visibility
                    emissiveIntensity: 0.3,
                    transparent: false
                }),
                blue: new THREE.MeshLambertMaterial({ 
                    color: 0x00BFFF, // Bright sky blue - classic Pacman blue
                    emissive: 0x0080FF, // Strong blue glow for visibility
                    emissiveIntensity: 0.3,
                    transparent: false
                }),
                green: new THREE.MeshLambertMaterial({ 
                    color: 0x00FF00, // Pure bright green - easy to distinguish
                    emissive: 0x00FF00, // Strong green glow for visibility
                    emissiveIntensity: 0.3,
                    transparent: false
                }),
                pink: new THREE.MeshLambertMaterial({ 
                    color: 0xFF69B4, // Classic hot pink - distinctive
                    emissive: 0xFF1493, // Strong pink glow for visibility
                    emissiveIntensity: 0.3,
                    transparent: false
                })
            };
        } else if (isPS2Mode) {
            // PS2 theme for single player mode with per-level colors
            this.groundMaterial = new THREE.MeshLambertMaterial({
                color: currentTheme.ground,
                emissive: currentTheme.groundEmissive,
                emissiveIntensity: 0.2
            });
            
            this.obstacleMaterial = new THREE.MeshLambertMaterial({
                color: currentTheme.obstacle,
                emissive: currentTheme.obstacleEmissive,
                emissiveIntensity: 0.3
            });
            
            this.collectibleMaterial = new THREE.MeshLambertMaterial({
                color: 0xFFD700, // Gold coins
                emissive: 0x666600,
                emissiveIntensity: 0.4
            });
            
            this.keyMaterial = new THREE.MeshLambertMaterial({
                color: currentTheme.accent,
                emissive: currentTheme.accent,
                emissiveIntensity: 0.3
            });
            
            this.exitMaterial = new THREE.MeshLambertMaterial({
                color: 0x00FF00, // Bright green exit
                emissive: 0x008800,
                emissiveIntensity: 0.4
            });
            
            // PS2 Pacman-specific materials (if needed)
            this.wallMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
            this.ghostMaterials = {
                red: new THREE.MeshLambertMaterial({ color: 0xff0000 }),
                blue: new THREE.MeshLambertMaterial({ color: 0x0000ff }),
                green: new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
                pink: new THREE.MeshLambertMaterial({ color: 0xff69b4 })
            };
        } else {
            // Standard theme for normal mode (fallback)
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
            // Normal Pacman-specific materials
            this.wallMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
            this.ghostMaterials = {
                red: new THREE.MeshLambertMaterial({ color: 0xff0000 }),
                blue: new THREE.MeshLambertMaterial({ color: 0x0000ff }),
                green: new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
                pink: new THREE.MeshLambertMaterial({ color: 0xff69b4 })
            };
            
            // New level mechanics materials
            this.bouncePadMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x00ff00,
                emissive: 0x003300
            });
            this.spikeMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xff0000,
                emissive: 0x330000
            });
            this.holeMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x000000,
                emissive: 0x000000
            });
        }
        
        this.generateLevel();
    }
    
    // Clean up all existing scene objects before generating new level
    cleanupLevel() {
        // Remove all tiles
        this.tiles.forEach(tile => {
            if (tile.mesh) {
                this.scene.remove(tile.mesh);
            }
        });
        this.tiles.clear();
        
        // Remove all obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.mesh) {
                this.scene.remove(obstacle.mesh);
            }
        });
        this.obstacles = [];
        
        // Remove all collectibles
        this.collectibles.forEach(collectible => {
            if (collectible.mesh) {
                this.scene.remove(collectible.mesh);
            }
        });
        this.collectibles = [];
        
        // Remove key object
        if (this.keyObject && this.keyObject.mesh) {
            this.scene.remove(this.keyObject.mesh);
            this.keyObject = null;
        }
        
        // Remove exit object
        if (this.exitObject && this.exitObject.mesh) {
            this.scene.remove(this.exitObject.mesh);
            this.exitObject = null;
        }
        
        // Remove walls (Pacman mode)
        this.walls.forEach(wall => {
            if (wall.mesh) {
                this.scene.remove(wall.mesh);
            }
        });
        this.walls = [];
        
        // Remove ghosts (Pacman mode)
        this.ghosts.forEach(ghost => {
            if (ghost.mesh) {
                this.scene.remove(ghost.mesh);
            }
        });
        this.ghosts = [];
        
        // Remove border walls (Pacman mode)
        this.borderWalls.forEach(borderWall => {
            if (borderWall.mesh) {
                this.scene.remove(borderWall.mesh);
            }
        });
        this.borderWalls = [];
        
        // Remove bounce pads
        this.bouncePads.forEach(pad => {
            if (pad.mesh) {
                this.scene.remove(pad.mesh);
            }
        });
        this.bouncePads = [];
        
        // Remove spikes
        this.spikes.forEach(spike => {
            if (spike.mesh) {
                this.scene.remove(spike.mesh);
            }
        });
        this.spikes = [];
        
        // Remove holes
        this.holes.forEach(hole => {
            if (hole.mesh) {
                this.scene.remove(hole.mesh);
            }
        });
        this.holes = [];
        
        // Remove ground plane if it exists
        // Find and remove ground plane by traversing scene children
        const objectsToRemove = [];
        this.scene.traverse(child => {
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry) {
                objectsToRemove.push(child);
            }
        });
        objectsToRemove.forEach(obj => this.scene.remove(obj));
        
        console.log('Level cleanup completed');
    }
    
    generateLevel() {
        // Clean up existing level objects before generating new ones
        this.cleanupLevel();
        
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
        
        // Add border for Pacman mode
        if (this.levelType === 'pacman') {
            this.generateMapBorder(levelData.size.width, levelData.size.height);
        }
        
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
        
        // Generate bounce pads if present
        if (levelData.bouncePads) {
            this.generateBouncePadsFromData(levelData.bouncePads);
        }
        
        // Generate spike traps if present
        if (levelData.spikes) {
            this.generateSpikesFromData(levelData.spikes);
        }
        
        // Generate holes if present
        if (levelData.holes) {
            this.generateHolesFromData(levelData.holes);
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
    
    createTile(x, z, height = 0) {
        const worldPos = this.levelLoader.gridToWorld(x, z, this.tileSize);
        
        // Create visual tile if it has height (elevated platform)
        if (height > 0) {
            const tileGeometry = new THREE.BoxGeometry(this.tileSize, height, this.tileSize);
            const tileMesh = new THREE.Mesh(tileGeometry, this.groundMaterial);
            tileMesh.position.set(worldPos.x, height / 2, worldPos.z);
            tileMesh.castShadow = true;
            tileMesh.receiveShadow = true;
            
            this.scene.add(tileMesh);
            
            return {
                x: x,
                z: z,
                worldX: worldPos.x,
                worldZ: worldPos.z,
                occupied: false,
                type: 'ground',
                height: height,
                mesh: tileMesh
            };
        }
        
        return {
            x: x,
            z: z,
            worldX: worldPos.x,
            worldZ: worldPos.z,
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
        ghostsData.forEach(ghostData => {
            // Create uniform geometry for all ghosts - classic Pacman style
            // All ghosts same shape and size for easy recognition by color
            const ghostGeometry = new THREE.CylinderGeometry(0.9, 0.9, 1.8, 12);
            const ghostScale = 1.0;
            const ghostHeight = 1.8;
            
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
            ghost.position.set(worldPos.x, ghostData.y || ghostHeight/2, worldPos.z);
            ghost.scale.set(ghostScale, ghostScale, ghostScale);
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
                spawnTime: performance.now() * 0.001,
                
                // Respawn system properties
                originalPosition: { x: spawnX, z: spawnZ }, // Store original spawn position
                isRespawning: false, // Whether ghost is in respawn state
                respawnHeadStart: 3.0, // 3 seconds head start after player death
                respawnStartTime: 0 // When respawn head start began
            });
        });
    }
    
    // Generate bounce pads from level data
    generateBouncePadsFromData(bouncePadsData) {
        bouncePadsData.forEach(padData => {
            const worldPos = this.levelLoader.gridToWorld(padData.x, padData.z, this.tileSize);
            
            // Create bounce pad geometry - cylinder for vertical, box for horizontal
            let geometry;
            if (padData.type === 'vertical') {
                geometry = new THREE.CylinderGeometry(1, 1, 0.5, 8);
            } else {
                geometry = new THREE.BoxGeometry(2, 0.5, 2);
            }
            
            const pad = new THREE.Mesh(geometry, this.bouncePadMaterial);
            pad.position.set(worldPos.x, padData.y || 0.5, worldPos.z);
            pad.castShadow = true;
            pad.receiveShadow = true;
            
            this.scene.add(pad);
            
            this.bouncePads.push({
                mesh: pad,
                x: padData.x,
                z: padData.z,
                type: padData.type,
                force: padData.force || 15,
                direction: padData.direction || 'up'
            });
        });
    }
    
    // Generate spikes from level data
    generateSpikesFromData(spikesData) {
        spikesData.forEach(spikeData => {
            const worldPos = this.levelLoader.gridToWorld(spikeData.x, spikeData.z, this.tileSize);
            
            // Create spike geometry - cone
            const geometry = new THREE.ConeGeometry(0.5, spikeData.height || 1.5, 4);
            const spike = new THREE.Mesh(geometry, this.spikeMaterial);
            spike.position.set(worldPos.x, (spikeData.height || 1.5) / 2, worldPos.z);
            spike.castShadow = true;
            spike.receiveShadow = true;
            
            this.scene.add(spike);
            
            this.spikes.push({
                mesh: spike,
                x: spikeData.x,
                z: spikeData.z,
                damage: spikeData.damage || 100
            });
        });
    }
    
    // Generate holes from level data
    generateHolesFromData(holesData) {
        holesData.forEach(holeData => {
            const worldPos = this.levelLoader.gridToWorld(holeData.x, holeData.z, this.tileSize);
            
            // Create hole geometry - dark plane below ground level
            const geometry = new THREE.PlaneGeometry(
                (holeData.width || 1) * this.tileSize,
                (holeData.depth || 1) * this.tileSize
            );
            const hole = new THREE.Mesh(geometry, this.holeMaterial);
            hole.position.set(worldPos.x, -0.1, worldPos.z);
            hole.rotation.x = -Math.PI / 2;
            hole.receiveShadow = true;
            
            this.scene.add(hole);
            
            this.holes.push({
                mesh: hole,
                x: holeData.x,
                z: holeData.z,
                width: holeData.width || 1,
                depth: holeData.depth || 1,
                underworldSpawn: holeData.underworldSpawn || { x: holeData.x, z: holeData.z }
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
            
            // Get tile height to position collectible correctly
            const tileKey = `${coinData.x},${coinData.z}`;
            const tile = this.tiles.get(tileKey);
            const tileHeight = tile ? tile.height : 0;
            
            const collectible = new THREE.Mesh(collectibleGeometry, this.collectibleMaterial);
            collectible.position.set(worldPos.x, tileHeight + (coinData.y || 1), worldPos.z);
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
        
        // Get tile height to position key correctly
        const tileKey = `${keyData.x},${keyData.z}`;
        const tile = this.tiles.get(tileKey);
        const tileHeight = tile ? tile.height : 0;
        
        const key = new THREE.Mesh(keyGeometry, this.keyMaterial);
        key.position.set(worldPos.x, tileHeight + (keyData.y || 1), worldPos.z);
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
        
        // Get tile height to position exit correctly
        const tileKey = `${exitData.x},${exitData.z}`;
        const tile = this.tiles.get(tileKey);
        const tileHeight = tile ? tile.height : 0;
        
        const exit = new THREE.Mesh(exitGeometry, this.exitMaterial);
        exit.position.set(worldPos.x, tileHeight + (exitData.height || 4) / 2, worldPos.z);
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
        
        // Seamless color transitions for walls and border in Pacman mode
        if (this.levelType === 'pacman') {
            const time = performance.now() * 0.001;
            const colorCycleSpeed = 0.5; // Slower for smoother transitions
            
            // Create smooth color transitions: blue -> pink -> yellow -> repeat
            const colorPhase = (time * colorCycleSpeed) % 3; // 3 colors in cycle
            
            let currentColor, currentEmissive;
            
            if (colorPhase < 1) {
                // Blue to Pink transition
                const t = colorPhase;
                currentColor = this.lerpColor(0x00FFFF, 0xFF0080, t); // Cyan to Neon Pink
                currentEmissive = this.lerpColor(0x006666, 0x440022, t);
            } else if (colorPhase < 2) {
                // Pink to Yellow transition
                const t = colorPhase - 1;
                currentColor = this.lerpColor(0xFF0080, 0xFFFF00, t); // Neon Pink to Yellow
                currentEmissive = this.lerpColor(0x440022, 0x666600, t);
            } else {
                // Yellow to Blue transition
                const t = colorPhase - 2;
                currentColor = this.lerpColor(0xFFFF00, 0x00FFFF, t); // Yellow to Cyan
                currentEmissive = this.lerpColor(0x666600, 0x006666, t);
            }
            
            // Apply color to walls
            if (this.walls && this.walls.length > 0) {
                this.walls.forEach(wall => {
                    if (wall.mesh && wall.mesh.material) {
                        wall.mesh.material.color.setHex(currentColor);
                        wall.mesh.material.emissive.setHex(currentEmissive);
                        
                        // Gentle breathing effect
                        const breathingScale = 1 + Math.sin(time * 2) * 0.03;
                        wall.mesh.scale.set(breathingScale, breathingScale, breathingScale);
                    }
                });
            }
            
            // Apply same color to border walls
            if (this.borderWalls && this.borderWalls.length > 0) {
                this.borderWalls.forEach(borderWall => {
                    if (borderWall.mesh && borderWall.mesh.material) {
                        borderWall.mesh.material.color.setHex(currentColor);
                        borderWall.mesh.material.emissive.setHex(currentEmissive);
                        
                        // Gentle breathing effect
                        const breathingScale = 1 + Math.sin(time * 2.2) * 0.03;
                        borderWall.mesh.scale.set(breathingScale, breathingScale, breathingScale);
                    }
                });
            }
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
            // Check if ghost should be active yet (8-second delay for pacman mode or respawn head start)
            if (!ghost.isActive) {
                // Check for respawn head start first
                if (ghost.isRespawning) {
                    if (currentTime - ghost.respawnStartTime >= ghost.respawnHeadStart) {
                        ghost.isRespawning = false;
                        ghost.isActive = true;
                        console.log(`${ghost.color} ghost finished respawn head start and is now active!`);
                    } else {
                        // Show visual indicator during head start (make ghost semi-transparent)
                        ghost.mesh.material.opacity = 0.5;
                        ghost.mesh.material.transparent = true;
                        return; // Skip this ghost during head start
                    }
                } else if (currentTime - ghost.spawnTime >= ghost.activationTime) {
                    ghost.isActive = true;
                    console.log(`${ghost.color} ghost activated!`);
                } else {
                    return; // Skip this ghost if not active yet
                }
            }
            
            // Make sure ghost is fully opaque when active
            if (ghost.isActive && !ghost.isRespawning) {
                ghost.mesh.material.opacity = 1.0;
                ghost.mesh.material.transparent = false;
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
            
            // Simple visual effects - subtle breathing for all ghosts
            if (!ghost.isRespawning) {
                const time = currentTime;
                const subtlePulse = 1 + Math.sin(time * 2) * 0.05; // Very subtle breathing
                ghost.mesh.scale.set(subtlePulse, subtlePulse, subtlePulse);
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
                console.log(`${ghost.color} ghost unstuck!`);
                return;
            }
        }
    }
    
    // Reset ghosts after player death - give head start
    resetGhostsAfterPlayerDeath() {
        const currentTime = performance.now() * 0.001;
        
        this.ghosts.forEach(ghost => {
            // Return ghost to original spawn position
            const worldPos = this.levelLoader.gridToWorld(ghost.originalPosition.x, ghost.originalPosition.z, this.tileSize);
            ghost.mesh.position.set(worldPos.x, 1, worldPos.z);
            
            // Reset ghost state
            ghost.gridX = ghost.originalPosition.x;
            ghost.gridZ = ghost.originalPosition.z;
            ghost.direction = { x: 1, z: 0 }; // Reset direction
            ghost.stuckCounter = 0;
            
            // Start respawn head start period
            ghost.isRespawning = true;
            ghost.respawnStartTime = currentTime;
            ghost.isActive = false; // Temporarily deactivate
            
            console.log(`${ghost.color} ghost returned to spawn and giving ${ghost.respawnHeadStart}s head start`);
        });
    }
    
    getPlayerPosition() {
        if (this.player) {
            return this.player.getPosition();
        }
        
        const player = this.scene.getObjectByName('player');
        if (player) {
            return player.position.clone();
        }
        
        return null;
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
    
    getWalls() {
        return this.walls;
    }
    
    getTiles() {
        return this.tiles;
    }
    
    getGhosts() {
        return this.ghosts;
    }
    
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
    
    setPlayer(player) {
        this.player = player;
    }
    
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
        if (this.levelType === 'pacman') {
            const remainingCollectibles = this.collectibles.filter(c => !c.collected);
            return remainingCollectibles.length === 0;
        } else {
            if (this.keyObject && !this.keyObject.collected) {
                return false;
            }
            
            const remainingCollectibles = this.collectibles.filter(c => !c.collected);
            return remainingCollectibles.length === 0;
        }
    }
    
    activateExit() {
        if (this.exitObject && this.canActivateExit()) {
            this.exitObject.activated = true;
            this.exitObject.mesh.material.color.setHex(0x00ff00);
            this.exitObject.mesh.material.emissive.setHex(0x004400);
            return true;
        }
        return false;
    }
    
    isInBounds(x, z) {
        const halfSize = (this.gridSize * this.tileSize) / 2;
        return x >= -halfSize && x <= halfSize && z >= -halfSize && z <= halfSize;
    }
    
    getGroundHeight(x, z) {
        const tile = this.getTileAt(x, z);
        return tile ? tile.height : 0;
    }
    
    getSolidObjects() {
        return this.obstacles.map(obstacle => ({
            boundingBox: obstacle.boundingBox,
            position: obstacle.position,
            type: 'obstacle'
        })).concat(this.walls.map(wall => ({
            boundingBox: wall.boundingBox,
            position: wall.position,
            type: 'wall'
        })).concat(this.borderWalls.map(borderWall => ({
            boundingBox: borderWall.mesh.geometry.boundingBox,
            position: borderWall.position,
            type: 'border'
        }))));
    }
    
    getRemainingCollectibles() {
        return this.collectibles.filter(c => !c.collected).length;
    }
    
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

    generateMapBorder(width, height) {
        const borderHeight = 2;
        const borderGeometry = new THREE.BoxGeometry(this.tileSize, borderHeight, this.tileSize);
        const borderMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00FFFF,
            emissive: 0x006666
        });
        
        this.borderWalls = [];
        
        for (let x = -1; x <= width; x++) {
            for (let z = -1; z <= height; z++) {
                if (x === -1 || x === width || z === -1 || z === height) {
                    const worldPos = this.levelLoader.gridToWorld(x, z, this.tileSize);
                    const borderWall = new THREE.Mesh(borderGeometry, borderMaterial.clone());
                    borderWall.position.set(worldPos.x, borderHeight / 2, worldPos.z);
                    borderWall.castShadow = true;
                    borderWall.receiveShadow = true;
                    
                    this.scene.add(borderWall);
                    this.borderWalls.push({
                        mesh: borderWall,
                        position: borderWall.position.clone()
                    });
                }
            }
        }
    }
    
    lerpColor(color1, color2, t) {
        const r1 = (color1 >> 16) & 0xff;
        const g1 = (color1 >> 8) & 0xff;
        const b1 = color1 & 0xff;
        
        const r2 = (color2 >> 16) & 0xff;
        const g2 = (color2 >> 8) & 0xff;
        const b2 = color2 & 0xff;
        
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        
        return (r << 16) | (g << 8) | b;
    }
}