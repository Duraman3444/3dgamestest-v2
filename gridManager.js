import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class GridManager {
    constructor(scene, levelLoader = null) {

        this.scene = scene;
        this.levelLoader = levelLoader;
        this.tileSize = 5;
        this.tiles = new Map();
        this.obstacles = [];
        this.collectibles = [];
        this.fruit = []; // For Pacman mode fruit
        this.keyObject = null;
        this.exitObject = null;
        this.walls = []; // For Pacman mode
        this.ghosts = []; // For Pacman mode
        this.borderWalls = []; // For Pacman mode border
        this.bouncePads = []; // For bounce pad mechanics
        this.spikes = []; // For spike trap mechanics
        this.holes = []; // For hole mechanics
        this.portals = []; // For portal mechanics
        
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
        
        // Enhanced material system - define material varieties for each object type
        this.materialVarieties = {
            obstacles: {
                1: ['metal', 'stone', 'plastic'], // Level 1: Forest theme
                2: ['stone', 'metal', 'plastic'], // Level 2: Desert theme  
                3: ['plastic', 'metal', 'rubber'], // Level 3: Tech theme
                4: ['gem', 'stone', 'glow'], // Level 4: Mystical theme
                5: ['metal', 'stone', 'glow'], // Level 5: Volcanic theme
                6: ['hologram', 'metal', 'neon'] // Level 6: Space theme
            },
            walls: {
                1: ['stone', 'wood', 'metal'],
                2: ['stone', 'sandstone', 'metal'], 
                3: ['plastic', 'metal', 'glass'],
                4: ['gem', 'crystal', 'magic'],
                5: ['volcanic_rock', 'metal', 'obsidian'],
                6: ['hologram', 'energy', 'metal']
            },
            grounds: {
                1: ['stone', 'dirt', 'grass'],
                2: ['sand', 'sandstone', 'rock'],
                3: ['metal_grating', 'concrete', 'plastic'],
                4: ['crystal', 'marble', 'magic_stone'],
                5: ['volcanic_rock', 'lava_stone', 'obsidian'], 
                6: ['energy_platform', 'metal', 'glass']
            },
            collectibles: {
                1: ['gem', 'crystal', 'metal'],
                2: ['gem', 'gold', 'crystal'],
                3: ['hologram', 'energy', 'metal'],
                4: ['magic_crystal', 'gem', 'glow'],
                5: ['fire_crystal', 'ruby', 'metal'],
                6: ['energy_core', 'hologram', 'plasma']
            }
        };
        
        // PS2 Color Themes for Single Player Mode
        const ps2Themes = {
            1: { // Classic PS2 Blue
                ground: 0x003366,
                groundEmissive: 0x000033,
                obstacle: 0x0066CC,
                obstacleEmissive: 0x001155,
                accent: 0x00FFFF
            },
            2: { // PS2 Bright Cyan/Teal - Much more visible
                ground: 0x00AAAA,
                groundEmissive: 0x006666,
                obstacle: 0x00FFFF,
                obstacleEmissive: 0x008888,
                accent: 0x00FFFF
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
            this.fruitMaterial = new THREE.MeshLambertMaterial({
                color: 0xFF4500, // Orange-red for fruit
                emissive: 0xFF2200 // Bright orange-red glow
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
            
            // Portal materials for different portal types (Pacman mode)
            this.portalMaterials = {
                blue: new THREE.MeshLambertMaterial({ 
                    color: 0x0099FF,
                    emissive: 0x0066AA,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                red: new THREE.MeshLambertMaterial({ 
                    color: 0xFF3333,
                    emissive: 0xAA2222,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                green: new THREE.MeshLambertMaterial({ 
                    color: 0x33FF33,
                    emissive: 0x22AA22,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                yellow: new THREE.MeshLambertMaterial({ 
                    color: 0xFFFF33,
                    emissive: 0xAAAA22,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                purple: new THREE.MeshLambertMaterial({ 
                    color: 0x9933FF,
                    emissive: 0x6622AA,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                orange: new THREE.MeshLambertMaterial({ 
                    color: 0xFF6633,
                    emissive: 0xAA4422,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                default: new THREE.MeshLambertMaterial({ 
                    color: 0x9999FF,
                    emissive: 0x6666AA,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
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
            
            // Portal materials for different portal types (PS2 mode)
            this.portalMaterials = {
                blue: new THREE.MeshLambertMaterial({ 
                    color: 0x0099FF,
                    emissive: 0x0066AA,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                red: new THREE.MeshLambertMaterial({ 
                    color: 0xFF3333,
                    emissive: 0xAA2222,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                green: new THREE.MeshLambertMaterial({ 
                    color: 0x33FF33,
                    emissive: 0x22AA22,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                yellow: new THREE.MeshLambertMaterial({ 
                    color: 0xFFFF33,
                    emissive: 0xAAAA22,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                purple: new THREE.MeshLambertMaterial({ 
                    color: 0x9933FF,
                    emissive: 0x6622AA,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                orange: new THREE.MeshLambertMaterial({ 
                    color: 0xFF6633,
                    emissive: 0xAA4422,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                default: new THREE.MeshLambertMaterial({ 
                    color: 0x9999FF,
                    emissive: 0x6666AA,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                })
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
            
            // Portal materials for different portal types
            this.portalMaterials = {
                blue: new THREE.MeshLambertMaterial({ 
                    color: 0x0099FF,
                    emissive: 0x0066AA,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                red: new THREE.MeshLambertMaterial({ 
                    color: 0xFF3333,
                    emissive: 0xAA2222,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                green: new THREE.MeshLambertMaterial({ 
                    color: 0x33FF33,
                    emissive: 0x22AA22,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                yellow: new THREE.MeshLambertMaterial({ 
                    color: 0xFFFF33,
                    emissive: 0xAAAA22,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                purple: new THREE.MeshLambertMaterial({ 
                    color: 0x9933FF,
                    emissive: 0x6622AA,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                orange: new THREE.MeshLambertMaterial({ 
                    color: 0xFF6633,
                    emissive: 0xAA4422,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                }),
                default: new THREE.MeshLambertMaterial({ 
                    color: 0x9999FF,
                    emissive: 0x6666AA,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8
                })
            };
        }
        
        this.generateLevel();
    }

    // Enhanced material creation methods
    getEnhancedMaterial(objectType, level = null, index = 0) {
        if (!window.game || !window.game.graphicsEnhancer) {
            // Fallback to basic materials if graphics enhancer not available
            return this.getBasicFallbackMaterial(objectType);
        }

        const currentLevel = level || (window.game ? window.game.currentLevel : 1);
        const varieties = this.materialVarieties[objectType];
        
        if (!varieties || !varieties[currentLevel]) {
            // Use default material if no varieties defined
            const materialType = this.getDefaultMaterialType(objectType);
            const baseColor = this.getDefaultColor(objectType, currentLevel);
            const eraTheme = this.getEraTheme();
            
            return window.game.graphicsEnhancer.createEnhancedMaterial(materialType, baseColor, eraTheme);
        }

        // Get material variety for this level
        const availableMaterials = varieties[currentLevel];
        const materialType = availableMaterials[index % availableMaterials.length];
        
        // Map special material types to supported ones
        const mappedMaterialType = this.mapMaterialType(materialType);
        const baseColor = this.getMaterialColor(materialType, currentLevel);
        const eraTheme = this.getEraTheme();
        
        return window.game.graphicsEnhancer.createEnhancedMaterial(mappedMaterialType, baseColor, eraTheme);
    }

    // Map special material names to supported material types  
    mapMaterialType(materialType) {
        const materialMap = {
            'wood': 'plastic',
            'rubber': 'plastic', 
            'glass': 'gem',
            'crystal': 'gem',
            'magic': 'glow',
            'sandstone': 'stone',
            'dirt': 'stone',
            'grass': 'stone',
            'sand': 'stone',
            'concrete': 'stone',
            'metal_grating': 'metal',
            'marble': 'stone',
            'magic_stone': 'glow',
            'volcanic_rock': 'stone',
            'lava_stone': 'glow',
            'obsidian': 'stone',
            'energy_platform': 'hologram',
            'gold': 'metal',
            'magic_crystal': 'gem',
            'fire_crystal': 'gem',
            'ruby': 'gem',
            'energy_core': 'glow',
            'plasma': 'hologram',
            'energy': 'glow'
        };
        
        return materialMap[materialType] || materialType;
    }

    // Get appropriate colors for different material types
    getMaterialColor(materialType, level) {
        const colorPalettes = {
            1: { // Forest
                'stone': 0x696969, 'wood': 0x8B4513, 'metal': 0x708090,
                'gem': 0x32CD32, 'crystal': 0x98FB98, 'dirt': 0x8B4513,
                'grass': 0x228B22, 'gold': 0xFFD700, 'magic_crystal': 0x7FFF00
            },
            2: { // Desert
                'stone': 0xD2691E, 'sandstone': 0xF4A460, 'metal': 0xCD853F,
                'gem': 0xFFD700, 'crystal': 0xFFFAF0, 'sand': 0xF4A460,
                'rock': 0xA0522D, 'gold': 0xFFD700
            },
            3: { // Tech
                'plastic': 0x4169E1, 'metal': 0x708090, 'rubber': 0x2F4F4F,
                'metal_grating': 0x696969, 'concrete': 0x808080, 'glass': 0x87CEEB,
                'hologram': 0x00CED1, 'energy': 0x00FFFF
            },
            4: { // Mystical
                'gem': 0x9370DB, 'stone': 0x483D8B, 'glow': 0xDDA0DD,
                'crystal': 0xE6E6FA, 'magic': 0xBA55D3, 'marble': 0xF5F5F5,
                'magic_stone': 0x8A2BE2, 'magic_crystal': 0xDA70D6
            },
            5: { // Volcanic
                'metal': 0x696969, 'stone': 0x2F4F4F, 'glow': 0xFF4500,
                'volcanic_rock': 0x8B0000, 'lava_stone': 0xFF6347, 'obsidian': 0x1C1C1C,
                'fire_crystal': 0xFF1493, 'ruby': 0xDC143C
            },
            6: { // Space
                'hologram': 0x00FFFF, 'metal': 0x4682B4, 'neon': 0x00FF00,
                'energy_platform': 0x1E90FF, 'glass': 0x87CEFA, 'energy_core': 0x7B68EE,
                'plasma': 0xFF00FF
            }
        };
        
        const palette = colorPalettes[level] || colorPalettes[1];
        return palette[materialType] || 0x808080;
    }

    // Get era theme based on game mode
    getEraTheme() {
        if (window.game && window.game.graphicsEnhancer) {
            return window.game.graphicsEnhancer.getEraThemeForGameMode(window.game.gameMode || 'normal');
        }
        return 'ps2';
    }

    // Get default material type for object type
    getDefaultMaterialType(objectType) {
        const defaults = {
            'obstacles': 'stone',
            'walls': 'stone', 
            'grounds': 'stone',
            'collectibles': 'gem'
        };
        return defaults[objectType] || 'plastic';
    }

    // Get default color for object type
    getDefaultColor(objectType, level) {
        const defaults = {
            'obstacles': 0x8B4513,
            'walls': 0x0000FF,
            'grounds': 0x228B22, 
            'collectibles': 0xFFD700
        };
        return defaults[objectType] || 0x808080;
    }

    // Fallback to basic materials if enhanced system not available
    getBasicFallbackMaterial(objectType) {
        const materials = {
            'obstacles': new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
            'walls': new THREE.MeshLambertMaterial({ color: 0x0000FF }),
            'grounds': new THREE.MeshLambertMaterial({ color: 0x228B22 }),
            'collectibles': new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        };
        return materials[objectType] || new THREE.MeshLambertMaterial({ color: 0x808080 });
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
        
        // Remove all fruit
        this.fruit.forEach(fruit => {
            if (fruit.mesh) {
                this.scene.remove(fruit.mesh);
            }
        });
        this.fruit = [];
        
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
        
        // Remove portals
        this.portals.forEach(portal => {
            if (portal.mesh) {
                this.scene.remove(portal.mesh);
            }
        });
        this.portals = [];
        
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
        
        // Create ground plane with enhanced materials
        const planeGeometry = new THREE.PlaneGeometry(levelData.size.width * this.tileSize, levelData.size.height * this.tileSize);
        const enhancedGroundMaterial = this.getEnhancedMaterial('grounds', null, 0);
        const planeMesh = new THREE.Mesh(planeGeometry, enhancedGroundMaterial);
        planeMesh.rotation.x = -Math.PI / 2;
        planeMesh.position.y = 0;
        planeMesh.receiveShadow = true;
        planeMesh.name = 'ground_plane';
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
        
        // Generate fruit from level data (Pacman mode)
        if (levelData.fruit) {
            this.generateFruitFromData(levelData.fruit);
        }
        
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
        
        // Generate portals if present
        if (levelData.portals && levelData.portals.length > 0) {
            this.generatePortalsFromData(levelData.portals);
        }
        
        // Add spiral staircase for Level 6 - Tower Climb
        if (levelData.name === "Level 6 - Tower Climb") {
            const centerX = (levelData.size.width * this.tileSize) / 2;
            const centerZ = (levelData.size.height * this.tileSize) / 2;
            const center = { x: 0, z: 0 }; // Center of the world (0,0 in world coordinates)
            
            console.log(`🏗️ Adding spiral staircase for Level 6 at center (${center.x}, ${center.z})`);
            this.addSpiralStaircase(center, 25, 60, 1.5); // 60 steps, 1.5 units height each, 25 radius (90 units total height)
        }
    }
    
    generateDefaultLevel() {
        // Create ground plane with enhanced materials
        const planeGeometry = new THREE.PlaneGeometry(this.gridSize * this.tileSize, this.gridSize * this.tileSize);
        const enhancedGroundMaterial = this.getEnhancedMaterial('grounds', null, 0);
        const planeMesh = new THREE.Mesh(planeGeometry, enhancedGroundMaterial);
        planeMesh.rotation.x = -Math.PI / 2;
        planeMesh.position.y = 0;
        planeMesh.receiveShadow = true;
        planeMesh.name = 'ground_plane_default';
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
        console.log('🏗️ Generating tiles from data:', tilesData.length, 'tiles');
        
        tilesData.forEach(tileData => {
            const tileKey = `${tileData.x},${tileData.z}`;
            const tile = this.createTile(tileData.x, tileData.z, tileData.height);
            this.tiles.set(tileKey, tile);
            
            // Debug elevated tiles
            if (tileData.height > 0) {
                console.log(`🏔️ Created elevated tile at (${tileData.x}, ${tileData.z}) with height ${tileData.height}`);
            }
        });
    }
    
    createTile(x, z, height = 0) {
        const worldPos = this.levelLoader.gridToWorld(x, z, this.tileSize);
        
        // Create visual tile if it has height (elevated platform)
        if (height > 0) {
            console.log(`🎯 Creating elevated tile mesh at grid (${x}, ${z}) world (${worldPos.x}, ${worldPos.z}) height ${height}`);
            
            const tileGeometry = new THREE.BoxGeometry(this.tileSize, height, this.tileSize);
            // Temporarily use bright red material to make elevated tiles visible
            const elevatedMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFF0000, // Bright red
                emissive: 0x330000,
                emissiveIntensity: 0.3
            });
            const tileMesh = new THREE.Mesh(tileGeometry, elevatedMaterial);
            tileMesh.position.set(worldPos.x, height / 2, worldPos.z);
            tileMesh.castShadow = true;
            tileMesh.receiveShadow = true;
            
            this.scene.add(tileMesh);
            
            console.log(`✅ Added elevated tile mesh to scene at position (${worldPos.x}, ${height / 2}, ${worldPos.z})`);
            console.log(`📦 Tile geometry: ${this.tileSize}x${height}x${this.tileSize}, Material: red`);
            
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
        // Get level data to check for ground tiles
        const levelData = this.levelLoader.getCurrentLevel();
        const groundTiles = levelData.tiles || [];
        
        obstaclesData.forEach((obstacleData, index) => {
            // Check if there's a ground tile at this position
            const hasGroundTile = groundTiles.some(tile => 
                tile.x === obstacleData.x && tile.z === obstacleData.z && tile.type === 'ground'
            );
            
            // Only create obstacle if there's a ground tile beneath it
            if (!hasGroundTile) {
                console.log(`🚫 Skipping obstacle at (${obstacleData.x}, ${obstacleData.z}) - no ground tile`);
                return;
            }
            
            const worldPos = this.levelLoader.gridToWorld(obstacleData.x, obstacleData.z, this.tileSize);
            const obstacleGeometry = new THREE.BoxGeometry(
                obstacleData.width || 2,
                obstacleData.height || 3,
                obstacleData.depth || 2
            );
            
            // Use enhanced materials with variety
            const enhancedMaterial = this.getEnhancedMaterial('obstacles', null, index);
            const obstacle = new THREE.Mesh(obstacleGeometry, enhancedMaterial);
            obstacle.position.set(worldPos.x, (obstacleData.height || 3) / 2, worldPos.z);
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            obstacle.name = `obstacle_${index}`;
            
            this.scene.add(obstacle);
            this.obstacles.push({
                mesh: obstacle,
                position: obstacle.position.clone(),
                gridX: obstacleData.x,
                gridZ: obstacleData.z,
                boundingBox: new THREE.Box3().setFromObject(obstacle),
                type: 'box',
                width: obstacleData.width || 2,
                height: obstacleData.height || 3,
                depth: obstacleData.depth || 2
            });
        });
    }
    
    generateWallsFromData(wallsData) {
        // Get level data to check for ground tiles
        const levelData = this.levelLoader.getCurrentLevel();
        const groundTiles = levelData.tiles || [];
        
        wallsData.forEach((wallData, index) => {
            // Check if there's a ground tile at this position
            const hasGroundTile = groundTiles.some(tile => 
                tile.x === wallData.x && tile.z === wallData.z && tile.type === 'ground'
            );
            
            // Only create wall if there's a ground tile beneath it
            if (!hasGroundTile) {
                console.log(`🚫 Skipping wall at (${wallData.x}, ${wallData.z}) - no ground tile`);
                return;
            }
            
            const worldPos = this.levelLoader.gridToWorld(wallData.x, wallData.z, this.tileSize);
            const wallGeometry = new THREE.BoxGeometry(
                this.tileSize * 0.8,
                wallData.height || 3,
                this.tileSize * 0.8
            );
            
            // Use enhanced materials with variety for walls
            const enhancedMaterial = this.getEnhancedMaterial('walls', null, index);
            const wall = new THREE.Mesh(wallGeometry, enhancedMaterial);
            wall.position.set(worldPos.x, (wallData.height || 3) / 2, worldPos.z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            wall.name = `wall_${index}`;
            
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
        bouncePadsData.forEach((padData, index) => {
            const worldPos = this.levelLoader.gridToWorld(padData.x, padData.z, this.tileSize);
            
            // Create bounce pad geometry - cylinder for vertical, box for horizontal
            let geometry;
            if (padData.type === 'vertical') {
                geometry = new THREE.CylinderGeometry(1, 1, 0.5, 8);
            } else {
                geometry = new THREE.BoxGeometry(2, 0.5, 2);
            }
            
            // Use enhanced rubber/plastic material for bounce pads
            let padMaterial;
            if (window.game && window.game.graphicsEnhancer) {
                const eraTheme = this.getEraTheme();
                padMaterial = window.game.graphicsEnhancer.createEnhancedMaterial('plastic', 0x00FF00, eraTheme);
            } else {
                padMaterial = this.bouncePadMaterial;
            }
            
            const pad = new THREE.Mesh(geometry, padMaterial);
            pad.position.set(worldPos.x, padData.y || 0.5, worldPos.z);
            pad.castShadow = true;
            pad.receiveShadow = true;
            pad.name = `bouncepad_${index}`;
            
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
    
    // Generate portals from level data
    generatePortalsFromData(portalsData) {
        portalsData.forEach(portalData => {
            const worldPos = this.levelLoader.gridToWorld(portalData.x, portalData.z, this.tileSize);
            
            // Create portal geometry - glowing cylinder
            const geometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 16);
            const portalMaterial = this.portalMaterials[portalData.type] || this.portalMaterials.default;
            const portal = new THREE.Mesh(geometry, portalMaterial);
            
            // Position portal at the specified coordinates and height
            portal.position.set(worldPos.x, (portalData.y || 1) + 1.5, worldPos.z);
            portal.castShadow = true;
            portal.receiveShadow = true;
            
            this.scene.add(portal);
            
            this.portals.push({
                mesh: portal,
                x: portalData.x,
                z: portalData.z,
                y: portalData.y || 1,
                type: portalData.type || 'default',
                destination: portalData.destination
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
                // Use enhanced materials with variety for default obstacles
                const enhancedMaterial = this.getEnhancedMaterial('obstacles', null, i);
                const obstacle = new THREE.Mesh(obstacleGeometry, enhancedMaterial);
                obstacle.position.set(tile.worldX, 1.5, tile.worldZ);
                obstacle.castShadow = true;
                obstacle.receiveShadow = true;
                obstacle.name = `obstacle_default_${i}`;
                
                this.scene.add(obstacle);
                this.obstacles.push({
                    mesh: obstacle,
                    position: obstacle.position.clone(),
                    tile: tile,
                    boundingBox: new THREE.Box3().setFromObject(obstacle),
                    type: 'box',
                    width: 2,
                    height: 3,
                    depth: 2
                });
                
                tile.occupied = true;
                tile.type = 'obstacle';
            }
        }
    }
    
    generateCollectiblesFromData(coinsData) {
        // Get level data to check for ground tiles
        const levelData = this.levelLoader.getCurrentLevel();
        const groundTiles = levelData.tiles || [];
        
        const collectibleGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        
        coinsData.forEach((coinData, index) => {
            // Check if there's a ground tile at this position
            const hasGroundTile = groundTiles.some(tile => 
                tile.x === coinData.x && tile.z === coinData.z && tile.type === 'ground'
            );
            
            // Only create collectible if there's a ground tile beneath it
            if (!hasGroundTile) {
                console.log(`🚫 Skipping collectible at (${coinData.x}, ${coinData.z}) - no ground tile`);
                return;
            }
            
            const worldPos = this.levelLoader.gridToWorld(coinData.x, coinData.z, this.tileSize);
            
            // Get tile height to position collectible correctly
            const tileKey = `${coinData.x},${coinData.z}`;
            const tile = this.tiles.get(tileKey);
            const tileHeight = tile ? tile.height : 0;
            
            // Use enhanced materials with variety for collectibles
            const enhancedMaterial = this.getEnhancedMaterial('collectibles', null, index);
            const collectible = new THREE.Mesh(collectibleGeometry, enhancedMaterial);
            collectible.position.set(worldPos.x, tileHeight + (coinData.y || 1), worldPos.z);
            collectible.castShadow = true;
            collectible.name = `collectible_${index}`;
            
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
    
    generateFruitFromData(fruitData) {
        // Handle both single fruit object and array of fruit
        const fruits = Array.isArray(fruitData) ? fruitData : [fruitData];
        
        fruits.forEach(fruit => {
            // Create fruit geometry - different shapes based on type
            let fruitGeometry;
            switch (fruit.type) {
                case 'cherry':
                    fruitGeometry = new THREE.SphereGeometry(0.4, 8, 8);
                    break;
                case 'apple':
                    fruitGeometry = new THREE.SphereGeometry(0.5, 10, 10);
                    break;
                case 'banana':
                    fruitGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 6);
                    break;
                case 'bonus':
                default:
                    fruitGeometry = new THREE.OctahedronGeometry(0.5, 0);
                    break;
            }
            
            const worldPos = this.levelLoader.gridToWorld(fruit.x, fruit.z, this.tileSize);
            
            // Get tile height to position fruit correctly
            const tileKey = `${fruit.x},${fruit.z}`;
            const tile = this.tiles.get(tileKey);
            const tileHeight = tile ? tile.height : 0;
            
            const fruitMesh = new THREE.Mesh(fruitGeometry, this.fruitMaterial);
            fruitMesh.position.set(worldPos.x, tileHeight + (fruit.y || 1.2), worldPos.z);
            fruitMesh.castShadow = true;
            
            this.scene.add(fruitMesh);
            this.fruit.push({
                mesh: fruitMesh,
                position: fruitMesh.position.clone(),
                gridX: fruit.x,
                gridZ: fruit.z,
                collected: false,
                type: fruit.type || 'bonus',
                points: fruit.points || 500,
                rotationSpeed: Math.random() * 0.03 + 0.02,
                bounceSpeed: Math.random() * 0.015 + 0.01,
                bounceHeight: 0.8
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
        
        // Use explicit Y coordinate if provided, otherwise calculate from tile height
        let exitY;
        if (exitData.y !== undefined) {
            // Use explicit Y coordinate (for special cases like cylinder top)
            exitY = exitData.y;
        } else {
            // Calculate from tile height (normal case)
            const tileKey = `${exitData.x},${exitData.z}`;
            const tile = this.tiles.get(tileKey);
            const tileHeight = tile ? tile.height : 0;
            exitY = tileHeight + (exitData.height || 4) / 2;
        }
        
        const exit = new THREE.Mesh(exitGeometry, this.exitMaterial);
        exit.position.set(worldPos.x, exitY, worldPos.z);
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
        
        // Animate fruit
        this.fruit.forEach((fruit, index) => {
            if (!fruit.collected) {
                // Rotate fruit
                fruit.mesh.rotation.y += fruit.rotationSpeed;
                fruit.mesh.rotation.x += fruit.rotationSpeed * 0.5;
                
                // Bounce fruit
                const time = performance.now() * 0.001;
                fruit.mesh.position.y = fruit.position.y + 
                    Math.sin(time * fruit.bounceSpeed * 12) * fruit.bounceHeight;
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
        
        // Animate portals
        if (this.portals && this.portals.length > 0) {
            const time = performance.now() * 0.001;
            this.portals.forEach(portal => {
                if (portal.mesh) {
                    // Rotate portal
                    portal.mesh.rotation.y += 0.02;
                    
                    // Gentle pulsing effect
                    const pulseScale = 1 + Math.sin(time * 3) * 0.1;
                    portal.mesh.scale.set(pulseScale, 1, pulseScale);
                    
                    // Subtle up/down floating motion
                    const originalY = (portal.y || 1) + 1.5;
                    portal.mesh.position.y = originalY + Math.sin(time * 2) * 0.2;
                }
            });
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
                    
                    // Play ghost sound effect when activated
                    if (window.game && window.game.audioManager) {
                        window.game.audioManager.playGhostSound();
                    }
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
    
    // Get tile by grid coordinates (for addRandomFruit and similar functions)
    getTile(gridX, gridZ) {
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
    
    getFruit() {
        return this.fruit.filter(f => !f.collected);
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
    
    getBorderWalls() {
        return this.borderWalls;
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
    
    collectFruit(fruit) {
        if (!fruit.collected) {
            fruit.collected = true;
            fruit.mesh.visible = false;
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
            const levelData = this.levelLoader.getCurrentLevel();
            
            // Special case for Level 6 - Tower Climb: no key or coins required
            if (levelData.name === "Level 6 - Tower Climb") {
                return true;
            }
            
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
        
        // Get level data to check for ground tiles at the edges
        const levelData = this.levelLoader ? this.levelLoader.getCurrentLevel() : null;
        
        // Create border walls outside the playable area
        // Left and right borders (x = -1 and x = width)
        for (let z = -1; z <= height; z++) {
            // Left border
            const leftWorldPos = this.levelLoader.gridToWorld(-1, z, this.tileSize);
            const leftBorderWall = new THREE.Mesh(borderGeometry, borderMaterial.clone());
            leftBorderWall.position.set(leftWorldPos.x, borderHeight / 2, leftWorldPos.z);
            leftBorderWall.castShadow = true;
            leftBorderWall.receiveShadow = true;
            this.scene.add(leftBorderWall);
            this.borderWalls.push({
                mesh: leftBorderWall,
                position: leftBorderWall.position.clone()
            });
            
            // Right border
            const rightWorldPos = this.levelLoader.gridToWorld(width, z, this.tileSize);
            const rightBorderWall = new THREE.Mesh(borderGeometry, borderMaterial.clone());
            rightBorderWall.position.set(rightWorldPos.x, borderHeight / 2, rightWorldPos.z);
            rightBorderWall.castShadow = true;
            rightBorderWall.receiveShadow = true;
            this.scene.add(rightBorderWall);
            this.borderWalls.push({
                mesh: rightBorderWall,
                position: rightBorderWall.position.clone()
            });
        }
        
        // Top and bottom borders - but only where there are no ground tiles
        for (let x = 0; x < width; x++) {
            // Check if there are ground tiles at z = 0 (bottom edge)
            const hasBottomGroundTile = levelData && levelData.tiles && 
                levelData.tiles.some(tile => tile.x === x && tile.z === 0 && tile.type === 'ground');
            
            // Only create bottom border if there's no ground tile at this position
            if (!hasBottomGroundTile) {
                const bottomWorldPos = this.levelLoader.gridToWorld(x, -1, this.tileSize);
                const bottomBorderWall = new THREE.Mesh(borderGeometry, borderMaterial.clone());
                bottomBorderWall.position.set(bottomWorldPos.x, borderHeight / 2, bottomWorldPos.z);
                bottomBorderWall.castShadow = true;
                bottomBorderWall.receiveShadow = true;
                this.scene.add(bottomBorderWall);
                this.borderWalls.push({
                    mesh: bottomBorderWall,
                    position: bottomBorderWall.position.clone()
                });
            }
            
            // Check if there are ground tiles at z = height-1 (top edge)
            const hasTopGroundTile = levelData && levelData.tiles && 
                levelData.tiles.some(tile => tile.x === x && tile.z === height - 1 && tile.type === 'ground');
            
            // Only create top border if there's no ground tile at this position
            if (!hasTopGroundTile) {
                const topWorldPos = this.levelLoader.gridToWorld(x, height, this.tileSize);
                const topBorderWall = new THREE.Mesh(borderGeometry, borderMaterial.clone());
                topBorderWall.position.set(topWorldPos.x, borderHeight / 2, topWorldPos.z);
                topBorderWall.castShadow = true;
                topBorderWall.receiveShadow = true;
                this.scene.add(topBorderWall);
                this.borderWalls.push({
                    mesh: topBorderWall,
                    position: topBorderWall.position.clone()
                });
            }
        }
    }
    
    addSpiralStaircase(center, radius, steps, heightPerStep) {
        // Create the central brown cylinder pillar - EXTRA SOLID
        const pillarHeight = steps * heightPerStep + 10; // Make it taller than the staircase
        const pillarRadius = 5; // Make pillar extra solid and thick
        const pillarGeometry = new THREE.CylinderGeometry(pillarRadius, pillarRadius, pillarHeight);
        const pillarMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513, // Brown color
            emissive: 0x2A1A09,
            emissiveIntensity: 0.2 // More emissive for solid appearance
        });
        const pillarMesh = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillarMesh.position.set(center.x, pillarHeight / 2, center.z);
        pillarMesh.castShadow = true;
        pillarMesh.receiveShadow = true;
        
        this.scene.add(pillarMesh);
        
        // Add pillar to obstacles for collision
        this.obstacles.push({
            mesh: pillarMesh,
            position: pillarMesh.position.clone(),
            gridX: Math.round(center.x / this.tileSize),
            gridZ: Math.round(center.z / this.tileSize),
            boundingBox: new THREE.Box3().setFromObject(pillarMesh),
            type: 'cylinder',
            radius: pillarRadius
        });
        
        // Create spiral staircase steps
        const angleStep = (Math.PI * 2) / steps; // Full rotation divided by number of steps
        const stepWidth = this.tileSize * 1.8; // Make steps even wider for easier rolling
        const stepDepth = this.tileSize * 1.5; // Make steps even deeper for easier rolling
        const stepHeight = heightPerStep * 0.3; // Make steps very thin for easy rolling
        
        // Red material for steps
        const stepMaterial = new THREE.MeshLambertMaterial({
            color: 0xFF0000, // Bright red
            emissive: 0x330000,
            emissiveIntensity: 0.3
        });
        
        // Collectible geometry for coins
        const collectibleGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        
        for (let i = 0; i < steps; i++) {
            const angle = i * angleStep;
            const stepRadius = radius + (i * 0.03); // Even smaller radius increase per step
            const stepHeight_y = i * heightPerStep;
            
            // Calculate position using polar coordinates
            const stepX = center.x + Math.cos(angle) * stepRadius;
            const stepZ = center.z + Math.sin(angle) * stepRadius;
            
            // Create step geometry
            const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
            const stepMesh = new THREE.Mesh(stepGeometry, stepMaterial);
            
            // Position the step at the exact height (not elevated by half step height)
            stepMesh.position.set(stepX, stepHeight_y + stepHeight / 2, stepZ);
            
            // Rotate the step to face the center and add slight rotation for spiral effect
            stepMesh.rotation.y = angle + Math.PI / 2; // Face tangent to the circle
            
            // Add shadows
            stepMesh.castShadow = true;
            stepMesh.receiveShadow = true;
            
            // Add to scene
            this.scene.add(stepMesh);
            
            // Add to obstacles for collision
            this.obstacles.push({
                mesh: stepMesh,
                position: stepMesh.position.clone(),
                gridX: Math.round(stepX / this.tileSize),
                gridZ: Math.round(stepZ / this.tileSize),
                boundingBox: new THREE.Box3().setFromObject(stepMesh),
                type: 'box',
                width: stepWidth,
                height: stepHeight,
                depth: stepDepth
            });
            
            // Create bounce pad on each step
            const padGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 8);
            const bouncepad = new THREE.Mesh(padGeometry, this.bouncePadMaterial);
            const padHeight = stepHeight_y + stepHeight + 0.15; // Position bounce pad on top of the step
            bouncepad.position.set(stepX, padHeight, stepZ);
            bouncepad.castShadow = true;
            bouncepad.receiveShadow = true;
            
            this.scene.add(bouncepad);
            
            // Give the last bounce pad a super bounce to reach the top of the tower
            const isLastStep = (i === steps - 1);
            const bounceForce = isLastStep ? 50 : 5; // MEGA SUPER BOUNCE on last step, gentle boost on others
            
            this.bouncePads.push({
                mesh: bouncepad,
                x: Math.round(stepX / this.tileSize),
                z: Math.round(stepZ / this.tileSize),
                type: 'vertical',
                force: bounceForce,
                direction: 'up'
            });

            // Create collectible (coin) on each step (only every 3rd step to avoid too many coins)
            if (i % 3 === 0) {
                const collectible = new THREE.Mesh(collectibleGeometry, this.collectibleMaterial);
                const coinHeight = stepHeight_y + stepHeight + 1.2; // Position coin above the bounce pad
                collectible.position.set(stepX, coinHeight, stepZ);
                collectible.castShadow = true;
                
                this.scene.add(collectible);
                this.collectibles.push({
                    mesh: collectible,
                    position: collectible.position.clone(),
                    gridX: Math.round(stepX / this.tileSize),
                    gridZ: Math.round(stepZ / this.tileSize),
                    collected: false,
                    rotationSpeed: Math.random() * 0.02 + 0.01,
                    bounceSpeed: Math.random() * 0.02 + 0.01,
                    bounceHeight: 0.3
                });
            }
            
            // Also add to tiles map for gameplay mechanics
            const gridX = Math.round(stepX / this.tileSize);
            const gridZ = Math.round(stepZ / this.tileSize);
            const tileKey = `${gridX},${gridZ}`;
            
            this.tiles.set(tileKey, {
                x: gridX,
                z: gridZ,
                worldX: stepX,
                worldZ: stepZ,
                occupied: false,
                type: 'stair',
                height: stepHeight_y + stepHeight,
                mesh: stepMesh
            });
        }
        
        // Create a top platform at the end of the staircase - NOW ON TOP OF SOLID TOWER
        // Remove the solid top platform to allow entry into the cylinder
        /*
        const topPlatformHeight = steps * heightPerStep + 2; // 2 units above the last step
        const topPlatformGeometry = new THREE.CylinderGeometry(pillarRadius + 1, pillarRadius + 1, 2, 16); // Circular platform slightly wider than solid tower
        const topPlatformMaterial = new THREE.MeshLambertMaterial({
            color: 0x228B22, // Green color for the top platform
            emissive: 0x004400,
            emissiveIntensity: 0.2
        });
        const topPlatformMesh = new THREE.Mesh(topPlatformGeometry, topPlatformMaterial);
        topPlatformMesh.position.set(center.x, topPlatformHeight, center.z);
        topPlatformMesh.castShadow = true;
        topPlatformMesh.receiveShadow = true;
        
        this.scene.add(topPlatformMesh);
        */
        
        // Instead, create a ring platform around the cylinder opening
        const ringHeight = steps * heightPerStep + 2;
        const ringGeometry = new THREE.RingGeometry(pillarRadius + 0.5, pillarRadius + 2, 16);
        const ringMaterial = new THREE.MeshLambertMaterial({
            color: 0x228B22, // Green color for the ring platform
            emissive: 0x004400,
            emissiveIntensity: 0.2,
            side: THREE.DoubleSide
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.position.set(center.x, ringHeight, center.z);
        ringMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        ringMesh.castShadow = true;
        ringMesh.receiveShadow = true;
        
        this.scene.add(ringMesh);

        console.log(`✅ Created spiral staircase with ${steps} steps around center (${center.x}, ${center.z})`);
        console.log(`🏗️ Central SOLID pillar: radius ${pillarRadius}, height ${pillarHeight}`);
        console.log(`🪜 Steps: width ${stepWidth}, depth ${stepDepth}, height per step ${heightPerStep}`);
        console.log(`🚀 Added ${steps} bounce pads on every step`);
        console.log(`🪙 Added ${Math.ceil(steps / 3)} collectibles on the staircase steps (every 3rd step)`);
        console.log(`🟢 Added ring platform around cylinder opening at height ${ringHeight}`);
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