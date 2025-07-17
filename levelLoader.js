import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class LevelLoader {
    constructor() {
        this.currentLevel = null;
        this.levelData = null;
        this.defaultLevel = this.createDefaultLevel();
    }
    
    // Create a default level for fallback
    createDefaultLevel() {
        return {
            name: "Default Level",
            size: { width: 20, height: 20 },
            spawn: { x: 0, y: 1, z: 0 },
            tiles: this.generateDefaultTiles(20, 20),
            coins: this.generateDefaultCoins(15),
            key: { x: 8, z: 8 },
            exit: { x: 15, z: 15 }
        };
    }
    
    // Generate default ground tiles
    generateDefaultTiles(width, height) {
        const tiles = [];
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < height; z++) {
                tiles.push({
                    x: x,
                    z: z,
                    type: "ground"
                });
            }
        }
        return tiles;
    }
    
    // Generate default coin positions
    generateDefaultCoins(count) {
        const coins = [];
        for (let i = 0; i < count; i++) {
            coins.push({
                x: Math.floor(Math.random() * 18) + 1,
                z: Math.floor(Math.random() * 18) + 1
            });
        }
        return coins;
    }
    
    // Load level from JSON file
    async loadLevel(levelPath) {
        try {
            const response = await fetch(levelPath);
            if (!response.ok) {
                throw new Error(`Failed to load level: ${response.status}`);
            }
            
            const levelData = await response.json();
            this.levelData = this.validateLevel(levelData);
            this.currentLevel = levelPath;
            
            console.log(`Level loaded successfully: ${this.levelData.name}`);
            return this.levelData;
            
        } catch (error) {
            console.warn(`Failed to load level ${levelPath}:`, error);
            console.log('Using default level');
            this.levelData = this.defaultLevel;
            this.currentLevel = 'default';
            return this.levelData;
        }
    }
    
    // Load level from JSON object
    loadLevelFromData(levelData) {
        try {
            this.levelData = this.validateLevel(levelData);
            this.currentLevel = levelData.name || 'Custom Level';
            
            console.log(`Level loaded from data: ${this.levelData.name}`);
            return this.levelData;
            
        } catch (error) {
            console.warn('Failed to load level from data:', error);
            this.levelData = this.defaultLevel;
            this.currentLevel = 'default';
            return this.levelData;
        }
    }
    
    // Validate level data structure
    validateLevel(levelData) {
        const validated = {
            name: levelData.name || "Unnamed Level",
            type: levelData.type || "normal",
            size: {
                width: levelData.size?.width || 20,
                height: levelData.size?.height || 20
            },
            spawn: {
                x: levelData.spawn?.x || 0,
                y: Math.max(levelData.spawn?.y || 1, 1),
                z: levelData.spawn?.z || 0
            },
            tiles: this.validateTiles(levelData.tiles || []),
            coins: this.validateCoins(levelData.coins || []),
            obstacles: this.validateObstacles(levelData.obstacles || []),
            key: this.validateKey(levelData.key),
            exit: this.validateExit(levelData.exit)
        };
        
        // Add Pacman-specific fields if it's a Pacman level
        if (levelData.type === 'pacman') {
            validated.walls = this.validateWalls(levelData.walls || []);
            validated.ghosts = this.validateGhosts(levelData.ghosts || []);
        }
        
        // Add bounce pads if present
        validated.bouncePads = this.validateBouncePads(levelData.bouncePads || []);
        
        // Add spike traps if present
        validated.spikes = this.validateSpikes(levelData.spikes || []);
        
        // Add holes if present
        validated.holes = this.validateHoles(levelData.holes || []);
        
        // Add portals if present
        validated.portals = this.validatePortals(levelData.portals || []);
        
        // Add level-specific requirements
        validated.requireAllCoins = levelData.requireAllCoins || false;
        
        // Ensure we have at least some ground tiles
        if (validated.tiles.length === 0) {
            validated.tiles = this.generateDefaultTiles(validated.size.width, validated.size.height);
        }
        
        return validated;
    }
    
    // Validate tiles array
    validateTiles(tiles) {
        return tiles.filter(tile => 
            typeof tile.x === 'number' && 
            typeof tile.z === 'number' &&
            tile.type
        ).map(tile => ({
            x: Math.floor(tile.x),
            z: Math.floor(tile.z),
            type: tile.type || 'ground',
            height: tile.height || 0
        }));
    }
    
    // Validate coins array
    validateCoins(coins) {
        return coins.filter(coin => 
            typeof coin.x === 'number' && 
            typeof coin.z === 'number'
        ).map(coin => ({
            x: Math.floor(coin.x),
            z: Math.floor(coin.z),
            y: coin.y || 1
        }));
    }
    
    // Validate obstacles array
    validateObstacles(obstacles) {
        return obstacles.filter(obstacle => 
            typeof obstacle.x === 'number' && 
            typeof obstacle.z === 'number'
        ).map(obstacle => ({
            x: Math.floor(obstacle.x),
            z: Math.floor(obstacle.z),
            y: obstacle.y || 1.5,
            width: obstacle.width || 2,
            height: obstacle.height || 3,
            depth: obstacle.depth || 2,
            type: obstacle.type || 'box'
        }));
    }
    
    // Validate key object
    validateKey(key) {
        if (!key || typeof key.x !== 'number' || typeof key.z !== 'number') {
            return null;
        }
        return {
            x: Math.floor(key.x),
            z: Math.floor(key.z),
            y: key.y || 1
        };
    }
    
    // Validate exit object
    validateExit(exit) {
        if (!exit || typeof exit.x !== 'number' || typeof exit.z !== 'number') {
            return null;
        }
        return {
            x: Math.floor(exit.x),
            z: Math.floor(exit.z),
            y: exit.y || 1,
            width: exit.width || 3,
            height: exit.height || 4,
            depth: exit.depth || 3
        };
    }
    
    // Validate walls array (for Pacman mode)
    validateWalls(walls) {
        return walls.filter(wall => 
            typeof wall.x === 'number' && 
            typeof wall.z === 'number'
        ).map(wall => ({
            x: Math.floor(wall.x),
            z: Math.floor(wall.z),
            type: wall.type || 'wall',
            height: wall.height || 3
        }));
    }
    
    // Validate ghosts array (for Pacman mode)
    validateGhosts(ghosts) {
        return ghosts.filter(ghost => 
            typeof ghost.x === 'number' && 
            typeof ghost.z === 'number'
        ).map(ghost => ({
            x: Math.floor(ghost.x),
            z: Math.floor(ghost.z),
            color: ghost.color || 'red',
            y: ghost.y || 1
        }));
    }
    
    // Validate bounce pads array
    validateBouncePads(bouncePads) {
        return bouncePads.filter(pad => 
            typeof pad.x === 'number' && 
            typeof pad.z === 'number' &&
            pad.type
        ).map(pad => ({
            x: Math.floor(pad.x),
            z: Math.floor(pad.z),
            type: pad.type, // 'vertical' or 'horizontal'
            force: pad.force || 15,
            direction: pad.direction || 'up', // for horizontal: 'forward', 'backward', 'left', 'right'
            y: pad.y || 0.5
        }));
    }
    
    // Validate spike traps array
    validateSpikes(spikes) {
        return spikes.filter(spike => 
            typeof spike.x === 'number' && 
            typeof spike.z === 'number'
        ).map(spike => ({
            x: Math.floor(spike.x),
            z: Math.floor(spike.z),
            y: spike.y || 0.1,
            height: spike.height || 1.5,
            damage: spike.damage || 100 // Instant kill
        }));
    }
    
    // Validate portals array
    validatePortals(portals) {
        return portals.filter(portal =>
            typeof portal.x === 'number' &&
            typeof portal.z === 'number' &&
            portal.destination &&
            typeof portal.destination.x === 'number' &&
            typeof portal.destination.z === 'number'
        ).map(portal => ({
            x: Math.floor(portal.x),
            z: Math.floor(portal.z),
            y: portal.y ?? 1,
            destination: {
                x: Math.floor(portal.destination.x),
                z: Math.floor(portal.destination.z),
                y: portal.destination.y ?? 1
            },
            type: portal.type || 'default'
        }));
    }
    
    // Validate holes array
    validateHoles(holes) {
        return holes.filter(hole => 
            typeof hole.x === 'number' && 
            typeof hole.z === 'number'
        ).map(hole => ({
            x: Math.floor(hole.x),
            z: Math.floor(hole.z),
            width: hole.width || 1,
            depth: hole.depth || 1,
            underworldSpawn: hole.underworldSpawn || { x: hole.x, z: hole.z }
        }));
    }
    
    // Get current level data
    getCurrentLevel() {
        return this.levelData || this.defaultLevel;
    }
    
    // Get level name
    getLevelName() {
        return this.levelData?.name || 'Default Level';
    }
    
    // Get spawn point
    getSpawnPoint() {
        const level = this.getCurrentLevel();
        return new THREE.Vector3(level.spawn.x, level.spawn.y, level.spawn.z);
    }
    
    // Get tiles
    getTiles() {
        return this.getCurrentLevel().tiles;
    }
    
    // Get coins
    getCoins() {
        return this.getCurrentLevel().coins;
    }
    
    // Get obstacles
    getObstacles() {
        return this.getCurrentLevel().obstacles;
    }
    
    // Get key
    getKey() {
        return this.getCurrentLevel().key;
    }
    
    // Get exit
    getExit() {
        return this.getCurrentLevel().exit;
    }
    
    // Getter for portals
    getPortals() {
        return this.levelData?.portals || [];
    }
    
    // Get level size
    getLevelSize() {
        return this.getCurrentLevel().size;
    }
    
    // Get walls (for Pacman mode)
    getWalls() {
        const level = this.getCurrentLevel();
        return level.walls || [];
    }
    
    // Get ghosts (for Pacman mode)
    getGhosts() {
        const level = this.getCurrentLevel();
        return level.ghosts || [];
    }
    
    // Get bounce pads
    getBouncePads() {
        const level = this.getCurrentLevel();
        return level.bouncePads || [];
    }
    
    // Get spike traps
    getSpikes() {
        const level = this.getCurrentLevel();
        return level.spikes || [];
    }
    
    // Get holes
    getHoles() {
        const level = this.getCurrentLevel();
        return level.holes || [];
    }
    
    // Check if level requires all coins
    requiresAllCoins() {
        const level = this.getCurrentLevel();
        return level.requireAllCoins || false;
    }
    
    // Convert world coordinates to grid coordinates
    worldToGrid(worldX, worldZ, tileSize = 5) {
        const level = this.getCurrentLevel();
        const halfWidth = (level.size.width * tileSize) / 2;
        const halfHeight = (level.size.height * tileSize) / 2;
        
        const gridX = Math.floor((worldX + halfWidth) / tileSize);
        const gridZ = Math.floor((worldZ + halfHeight) / tileSize);
        
        return { x: gridX, z: gridZ };
    }
    
    // Convert grid coordinates to world coordinates
    gridToWorld(gridX, gridZ, tileSize = 5) {
        const level = this.getCurrentLevel();
        const halfWidth = (level.size.width * tileSize) / 2;
        const halfHeight = (level.size.height * tileSize) / 2;
        
        const worldX = (gridX * tileSize) - halfWidth + (tileSize / 2);
        const worldZ = (gridZ * tileSize) - halfHeight + (tileSize / 2);
        
        return { x: worldX, z: worldZ };
    }
    
    // Save level to JSON (for level editor)
    exportLevel() {
        const level = this.getCurrentLevel();
        return JSON.stringify(level, null, 2);
    }
    
    // Create a simple test level
    createTestLevel() {
        return {
            name: "Test Level",
            size: { width: 15, height: 15 },
            spawn: { x: 0, y: 1, z: 0 },
            tiles: [
                // Create a simple cross pattern
                { x: 5, z: 5, type: "ground" },
                { x: 6, z: 5, type: "ground" },
                { x: 7, z: 5, type: "ground" },
                { x: 8, z: 5, type: "ground" },
                { x: 9, z: 5, type: "ground" },
                { x: 7, z: 3, type: "ground" },
                { x: 7, z: 4, type: "ground" },
                { x: 7, z: 6, type: "ground" },
                { x: 7, z: 7, type: "ground" },
                // Add more tiles to make it playable
                ...this.generateDefaultTiles(15, 15)
            ],
            coins: [
                { x: 6, z: 6 },
                { x: 8, z: 4 },
                { x: 5, z: 7 },
                { x: 9, z: 3 }
            ],
            obstacles: [
                { x: 3, z: 3, type: "box" },
                { x: 11, z: 3, type: "box" },
                { x: 3, z: 11, type: "box" },
                { x: 11, z: 11, type: "box" }
            ],
            key: { x: 12, z: 12 },
            exit: { x: 1, z: 1 }
        };
    }
    
    // Create Pacman level
    createPacmanLevel() {
        const width = 13;
        const height = 15;
        
        // Generate full ground tiles
        const tiles = [];
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < height; z++) {
                tiles.push({
                    x: x,
                    z: z,
                    type: "ground"
                });
            }
        }
        
        // Create maze walls pattern
        const walls = [];
        for (let z = 0; z < height; z += 2) {
            for (let x = 0; x < width; x += 2) {
                walls.push({ x: x, z: z, type: "wall" });
            }
        }
        
        // Create coins (yellow orbs) in open spaces
        const coins = [];
        for (let x = 1; x < width; x += 2) {
            for (let z = 1; z < height; z += 2) {
                if (!(x === 6 && z === 7)) { // Don't put coin at center (ghost spawn)
                    coins.push({ x: x, z: z });
                }
            }
        }
        
        return {
            name: "Pacman Mode - Default Maze",
            type: "pacman",
            size: { width: width, height: height },
            spawn: { x: 6, y: 1, z: 13 },
            tiles: tiles,
            walls: walls,
            coins: coins,
            ghosts: [
                { x: 5, z: 7, color: "red" },
                { x: 6, z: 7, color: "blue" },
                { x: 7, z: 7, color: "green" },
                { x: 8, z: 7, color: "pink" }
            ],
            exit: { x: 6, z: 1 }
        };
    }
} 