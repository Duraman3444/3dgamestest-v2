import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class LocalMultiplayerBattle {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.isActive = false;
        this.gameState = 'waiting';
        
        // Arena properties
        this.arenaRadius = 12;
        this.arenaHeight = 1;
        this.fallThreshold = -15;
        this.arena = null;
        this.arenaEdge = null;
        this.currentArenaTheme = 0;
        this.arenaObjects = []; // Track arena objects for cleanup
        
        // Arena themes inspired by SNES games
        this.arenaThemes = [
            {
                name: "Jungle Temple",
                description: "Deep in the emerald jungle",
                colors: {
                    platform: 0x2D5016,
                    edge: 0x90EE90,
                    markers: 0x228B22,
                    fog: 0x1B4332
                },
                fog: { color: 0x1B4332, near: 25, far: 60 },
                lighting: { ambient: 0x404040, directional: 0x7CFC00 },
                particles: { color: 0x32CD32, count: 4 },
                hazards: [
                    { type: 'sinkhole', position: { x: 0, z: 0 }, radius: 2, strength: 8 },
                    { type: 'spikes', position: { x: 6, z: 0 }, size: 1.5, damage: 25 },
                    { type: 'spikes', position: { x: -6, z: 0 }, size: 1.5, damage: 25 },
                    { type: 'bounce', position: { x: 0, z: 6 }, radius: 1.5, force: 20 },
                    { type: 'bounce', position: { x: 0, z: -6 }, radius: 1.5, force: 20 }
                ]
            },
            {
                name: "Volcanic Crater",
                description: "Molten lava bubbles below",
                colors: {
                    platform: 0x8B0000,
                    edge: 0xFF4500,
                    markers: 0xFF6347,
                    fog: 0x660000
                },
                fog: { color: 0x660000, near: 20, far: 55 },
                lighting: { ambient: 0x440000, directional: 0xFF4500 },
                particles: { color: 0xFF6600, count: 6 },
                hazards: [
                    { type: 'lava_burst', position: { x: 4, z: 4 }, radius: 2, interval: 4, force: 25 },
                    { type: 'lava_burst', position: { x: -4, z: -4 }, radius: 2, interval: 4, force: 25 },
                    { type: 'lava_burst', position: { x: 4, z: -4 }, radius: 2, interval: 4, force: 25 },
                    { type: 'lava_burst', position: { x: -4, z: 4 }, radius: 2, interval: 4, force: 25 },
                    { type: 'ramp', position: { x: 0, z: 8 }, angle: 25, force: 18 },
                    { type: 'ramp', position: { x: 0, z: -8 }, angle: 25, force: 18 }
                ]
            },
            {
                name: "Sky Sanctuary",
                description: "Multi-level floating fortress with upper battle platform",
                colors: {
                    platform: 0x4682B4,
                    edge: 0x87CEEB,
                    markers: 0x1E90FF,
                    fog: 0x87CEEB
                },
                fog: { color: 0x87CEEB, near: 30, far: 80 },
                lighting: { ambient: 0x606060, directional: 0xFFFFFF },
                particles: { color: 0xFFFFFF, count: 12 },
                specialFeatures: {
                    upperLevel: {
                        enabled: true,
                        height: 8,
                        radius: 8,
                        platforms: [
                            { position: { x: 0, z: 0 }, radius: 6 }, // Main upper platform
                            { position: { x: 8, z: 0 }, radius: 3 }, // Side platform 1
                            { position: { x: -8, z: 0 }, radius: 3 }, // Side platform 2
                            { position: { x: 0, z: 8 }, radius: 3 }, // Side platform 3
                            { position: { x: 0, z: -8 }, radius: 3 }  // Side platform 4
                        ]
                    }
                },
                hazards: [
                    // Launch pads to reach upper level - positioned strategically
                    { type: 'launch_pad', position: { x: 0, z: 0 }, radius: 2, force: 60, targetLevel: 'upper' },
                    { type: 'launch_pad', position: { x: 6, z: 6 }, radius: 1.5, force: 55, targetLevel: 'upper' },
                    { type: 'launch_pad', position: { x: -6, z: -6 }, radius: 1.5, force: 55, targetLevel: 'upper' },
                    { type: 'launch_pad', position: { x: 6, z: -6 }, radius: 1.5, force: 55, targetLevel: 'upper' },
                    { type: 'launch_pad', position: { x: -6, z: 6 }, radius: 1.5, force: 55, targetLevel: 'upper' },
                    
                    // Upper level bounce pads for aerial combat
                    { type: 'bounce', position: { x: 0, z: 0 }, radius: 2, force: 40, level: 'upper', airCombo: true },
                    { type: 'bounce', position: { x: 4, z: 0 }, radius: 1.5, force: 35, level: 'upper', airCombo: true },
                    { type: 'bounce', position: { x: -4, z: 0 }, radius: 1.5, force: 35, level: 'upper', airCombo: true },
                    { type: 'bounce', position: { x: 0, z: 4 }, radius: 1.5, force: 35, level: 'upper', airCombo: true },
                    { type: 'bounce', position: { x: 0, z: -4 }, radius: 1.5, force: 35, level: 'upper', airCombo: true },
                    
                    // Ground level teleporters for quick repositioning
                    { type: 'teleporter', position: { x: 9, z: 0 }, radius: 1.5, destination: { x: -9, z: 0 }, damage: 8, stunDuration: 0.3 },
                    { type: 'teleporter', position: { x: -9, z: 0 }, radius: 1.5, destination: { x: 9, z: 0 }, damage: 8, stunDuration: 0.3 },
                    { type: 'teleporter', position: { x: 0, z: 9 }, radius: 1.5, destination: { x: 0, z: -9 }, damage: 8, stunDuration: 0.3 },
                    { type: 'teleporter', position: { x: 0, z: -9 }, radius: 1.5, destination: { x: 0, z: 9 }, damage: 8, stunDuration: 0.3 },
                    
                    // Upper level teleporters for platform hopping
                    { type: 'teleporter', position: { x: 8, z: 0 }, radius: 1.5, destination: { x: -8, z: 0 }, level: 'upper', damage: 8, stunDuration: 0.3 },
                    { type: 'teleporter', position: { x: -8, z: 0 }, radius: 1.5, destination: { x: 8, z: 0 }, level: 'upper', damage: 8, stunDuration: 0.3 },
                    { type: 'teleporter', position: { x: 0, z: 8 }, radius: 1.5, destination: { x: 0, z: -8 }, level: 'upper', damage: 8, stunDuration: 0.3 },
                    { type: 'teleporter', position: { x: 0, z: -8 }, radius: 1.5, destination: { x: 0, z: 8 }, level: 'upper', damage: 8, stunDuration: 0.3 },
                    
                    // Wind currents for aerial movement between levels
                    { type: 'wind_current', position: { x: 4, z: 4 }, radius: 2, force: 20, direction: { x: 0, y: 1, z: 0 } },
                    { type: 'wind_current', position: { x: -4, z: -4 }, radius: 2, force: 20, direction: { x: 0, y: 1, z: 0 } },
                    { type: 'wind_current', position: { x: 4, z: -4 }, radius: 2, force: 20, direction: { x: 0, y: 1, z: 0 } },
                    { type: 'wind_current', position: { x: -4, z: 4 }, radius: 2, force: 20, direction: { x: 0, y: 1, z: 0 } },
                    
                    // Sky lightning strikes on upper level
                    { type: 'sky_lightning', position: { x: 3, z: 3 }, radius: 2, damage: 25, stunDuration: 1.2, interval: 6, level: 'upper' },
                    { type: 'sky_lightning', position: { x: -3, z: -3 }, radius: 2, damage: 25, stunDuration: 1.2, interval: 6, level: 'upper' },
                    { type: 'sky_lightning', position: { x: 3, z: -3 }, radius: 2, damage: 25, stunDuration: 1.2, interval: 6, level: 'upper' },
                    { type: 'sky_lightning', position: { x: -3, z: 3 }, radius: 2, damage: 25, stunDuration: 1.2, interval: 6, level: 'upper' },
                    
                    // Floating cloud platforms for vertical movement
                    { type: 'cloud_platform', position: { x: 6, z: 0 }, radius: 1.5, interval: 5, duration: 4, height: 4 },
                    { type: 'cloud_platform', position: { x: -6, z: 0 }, radius: 1.5, interval: 5, duration: 4, height: 4 },
                    { type: 'cloud_platform', position: { x: 0, z: 6 }, radius: 1.5, interval: 5, duration: 4, height: 4 },
                    { type: 'cloud_platform', position: { x: 0, z: -6 }, radius: 1.5, interval: 5, duration: 4, height: 4 }
                ]
            },
            {
                name: "Desert Ruins",
                description: "Ancient stones in endless sand",
                colors: {
                    platform: 0xD2691E,
                    edge: 0xF4A460,
                    markers: 0xCD853F,
                    fog: 0xDEB887
                },
                fog: { color: 0xDEB887, near: 22, far: 65 },
                lighting: { ambient: 0x664400, directional: 0xFFD700 },
                particles: { color: 0xF5DEB3, count: 8 },
                hazards: [
                    // Enhanced sinkholes with sand effects
                    { type: 'sinkhole', position: { x: 4, z: 4 }, radius: 3, strength: 15, sandstorm: true },
                    { type: 'sinkhole', position: { x: -4, z: -4 }, radius: 3, strength: 15, sandstorm: true },
                    
                    // Enhanced ramps with ancient stone design
                    { type: 'ramp', position: { x: -7, z: 0 }, angle: 35, force: 25, ancient: true },
                    { type: 'ramp', position: { x: 7, z: 0 }, angle: 35, force: 25, ancient: true },
                    
                    // Enhanced central spike trap
                    { type: 'spikes', position: { x: 0, z: 0 }, size: 2.5, damage: 35, ancient: true },
                    
                    // New desert-themed hazards
                    { type: 'quicksand', position: { x: 0, z: 6 }, radius: 2.5, sinkRate: 0.8, damage: 15 },
                    { type: 'quicksand', position: { x: 0, z: -6 }, radius: 2.5, sinkRate: 0.8, damage: 15 },
                    { type: 'quicksand', position: { x: 6, z: 3 }, radius: 2, sinkRate: 0.6, damage: 12 },
                    { type: 'quicksand', position: { x: -6, z: -3 }, radius: 2, sinkRate: 0.6, damage: 12 },
                    
                    // Sandstorm vortex hazards
                    { type: 'sandstorm', position: { x: 5, z: -5 }, radius: 3, interval: 4, force: 20, damage: 18 },
                    { type: 'sandstorm', position: { x: -5, z: 5 }, radius: 3, interval: 4, force: 20, damage: 18 },
                    
                    // Ancient obelisk energy blasts
                    { type: 'obelisk_blast', position: { x: 8, z: 8 }, radius: 2.5, interval: 6, damage: 25, stunDuration: 1.0 },
                    { type: 'obelisk_blast', position: { x: -8, z: -8 }, radius: 2.5, interval: 6, damage: 25, stunDuration: 1.0 },
                    { type: 'obelisk_blast', position: { x: 8, z: -8 }, radius: 2.5, interval: 6, damage: 25, stunDuration: 1.0 },
                    { type: 'obelisk_blast', position: { x: -8, z: 8 }, radius: 2.5, interval: 6, damage: 25, stunDuration: 1.0 },
                    
                    // Desert mirage teleporters
                    { type: 'mirage_teleporter', position: { x: 3, z: -3 }, radius: 1.8, destination: { x: -3, z: 3 }, damage: 8 },
                    { type: 'mirage_teleporter', position: { x: -3, z: 3 }, radius: 1.8, destination: { x: 3, z: -3 }, damage: 8 }
                ]
            },
            {
                name: "Neon Grid",
                description: "Digital battlefield of the future",
                colors: {
                    platform: 0x1A1A2E,
                    edge: 0x00FFFF,
                    markers: 0xFF00FF,
                    fog: 0x0F0F23
                },
                fog: { color: 0x0F0F23, near: 18, far: 50 },
                lighting: { ambient: 0x220044, directional: 0x00FFFF },
                particles: { color: 0xFF00FF, count: 5 },
                hazards: [
                    { type: 'teleporter', position: { x: 0, z: 7 }, radius: 1.5, destination: { x: 0, z: -7 } },
                    { type: 'teleporter', position: { x: 0, z: -7 }, radius: 1.5, destination: { x: 0, z: 7 } },
                    { type: 'teleporter', position: { x: 7, z: 0 }, radius: 1.5, destination: { x: -7, z: 0 } },
                    { type: 'teleporter', position: { x: -7, z: 0 }, radius: 1.5, destination: { x: 7, z: 0 } },
                    { type: 'bounce', position: { x: 3, z: 3 }, radius: 1.5, force: 25 },
                    { type: 'bounce', position: { x: -3, z: -3 }, radius: 1.5, force: 25 }
                ]
            },
            {
                name: "Frozen Peaks",
                description: "Icy winds howl through the mountains",
                colors: {
                    platform: 0x4169E1,
                    edge: 0xE6E6FA,
                    markers: 0x6495ED,
                    fog: 0xF0F8FF
                },
                fog: { color: 0xF0F8FF, near: 25, far: 70 },
                lighting: { ambient: 0x444466, directional: 0xE6E6FA },
                particles: { color: 0xFFFFFF, count: 8 },
                hazards: [
                    { type: 'ice', position: { x: 0, z: 0 }, radius: 3, friction: 0.1 },
                    { type: 'ice', position: { x: 5, z: 5 }, radius: 2, friction: 0.05 },
                    { type: 'ice', position: { x: -5, z: -5 }, radius: 2, friction: 0.05 },
                    { type: 'ice', position: { x: 5, z: -5 }, radius: 2, friction: 0.05 },
                    { type: 'ice', position: { x: -5, z: 5 }, radius: 2, friction: 0.05 },
                    { type: 'spikes', position: { x: 0, z: 8 }, size: 1.5, damage: 20 },
                    { type: 'spikes', position: { x: 0, z: -8 }, size: 1.5, damage: 20 }
                ]
            },
            {
                name: "Ancient Temple",
                description: "Stone guardians watch over the arena",
                colors: {
                    platform: 0x654321,
                    edge: 0xD2691E,
                    markers: 0x8B4513,
                    fog: 0x8B7355
                },
                fog: { color: 0x8B7355, near: 28, far: 75 },
                lighting: { ambient: 0x332211, directional: 0xDEB887 },
                particles: { color: 0xCD853F, count: 4 },
                hazards: [
                    { type: 'spikes', position: { x: 4, z: 4 }, size: 2, damage: 35 },
                    { type: 'spikes', position: { x: -4, z: -4 }, size: 2, damage: 35 },
                    { type: 'spikes', position: { x: 4, z: -4 }, size: 2, damage: 35 },
                    { type: 'spikes', position: { x: -4, z: 4 }, size: 2, damage: 35 },
                    { type: 'ramp', position: { x: 0, z: 0 }, angle: 35, force: 22 },
                    { type: 'sinkhole', position: { x: 0, z: 6 }, radius: 2, strength: 15 },
                    { type: 'sinkhole', position: { x: 0, z: -6 }, radius: 2, strength: 15 }
                ]
            },
            {
                name: "Underwater Temple",
                description: "Submerged ruins with mysterious currents",
                colors: {
                    platform: 0x006994,
                    edge: 0x40E0D0,
                    markers: 0x20B2AA,
                    fog: 0x4682B4
                },
                fog: { color: 0x4682B4, near: 20, far: 60 },
                lighting: { ambient: 0x003366, directional: 0x40E0D0 },
                particles: { color: 0x00CED1, count: 12 },
                hazards: [
                    { type: 'ramp', position: { x: -6, z: 0 }, angle: 40, force: 28 },
                    { type: 'ramp', position: { x: 6, z: 0 }, angle: 40, force: 28 },
                    { type: 'ramp', position: { x: 0, z: -6 }, angle: 30, force: 24 },
                    { type: 'water_current', position: { x: 0, z: 0 }, radius: 4, force: 12 },
                    { type: 'bubble_geyser', position: { x: 4, z: 4 }, radius: 2, force: 35, interval: 4 },
                    { type: 'bubble_geyser', position: { x: -4, z: -4 }, radius: 2, force: 35, interval: 4 },
                    { type: 'whirlpool', position: { x: 0, z: 8 }, radius: 2.5, strength: 18 },
                    { type: 'whirlpool', position: { x: 0, z: -8 }, radius: 2.5, strength: 18 }
                ]
            },
            {
                name: "Crystal Caverns",
                description: "Magical crystals hum with ancient power",
                colors: {
                    platform: 0x4B0082,
                    edge: 0x9370DB,
                    markers: 0x8A2BE2,
                    fog: 0x6A5ACD
                },
                fog: { color: 0x6A5ACD, near: 15, far: 55 },
                lighting: { ambient: 0x330066, directional: 0x9370DB },
                particles: { color: 0xDA70D6, count: 10 },
                hazards: [
                    { type: 'ramp', position: { x: -8, z: 0 }, angle: 45, force: 32 },
                    { type: 'ramp', position: { x: 8, z: 0 }, angle: 45, force: 32 },
                    { type: 'crystal_resonance', position: { x: 0, z: 0 }, radius: 3, force: 25, interval: 3 },
                    { type: 'teleporter', position: { x: 5, z: 5 }, radius: 1.5, destination: { x: -5, z: -5 } },
                    { type: 'teleporter', position: { x: -5, z: -5 }, radius: 1.5, destination: { x: 5, z: 5 } },
                    { type: 'crystal_spikes', position: { x: 0, z: 6 }, size: 1.8, damage: 18 },
                    { type: 'crystal_spikes', position: { x: 0, z: -6 }, size: 1.8, damage: 18 }
                ]
            },
            {
                name: "Haunted Graveyard",
                description: "Restless spirits guard this cursed ground",
                colors: {
                    platform: 0x2F4F2F,
                    edge: 0x6B8E23,
                    markers: 0x8FBC8F,
                    fog: 0x696969
                },
                fog: { color: 0x696969, near: 12, far: 45 },
                lighting: { ambient: 0x1C1C1C, directional: 0x6B8E23 },
                particles: { color: 0x98FB98, count: 15 },
                hazards: [
                    { type: 'ramp', position: { x: -7, z: -7 }, angle: 50, force: 30 },
                    { type: 'ramp', position: { x: 7, z: 7 }, angle: 50, force: 30 },
                    { type: 'ghost_push', position: { x: 0, z: 0 }, radius: 5, force: 20, interval: 5 },
                    { type: 'tombstone', position: { x: 4, z: 0 }, size: 2, damage: 15 },
                    { type: 'tombstone', position: { x: -4, z: 0 }, size: 2, damage: 15 },
                    { type: 'grave_pit', position: { x: 0, z: 4 }, radius: 2, strength: 12 },
                    { type: 'grave_pit', position: { x: 0, z: -4 }, radius: 2, strength: 12 }
                ]
            },
            {
                name: "Space Station",
                description: "Zero gravity zones in the void of space",
                colors: {
                    platform: 0x2F2F2F,
                    edge: 0x00FFFF,
                    markers: 0xFF00FF,
                    fog: 0x000011
                },
                fog: { color: 0x000011, near: 25, far: 70 },
                lighting: { ambient: 0x111133, directional: 0x00FFFF },
                particles: { color: 0xFFFFFF, count: 20 },
                hazards: [
                    { type: 'ramp', position: { x: 0, z: 8 }, angle: 60, force: 35 },
                    { type: 'ramp', position: { x: 0, z: -8 }, angle: 60, force: 35 },
                    { type: 'zero_gravity', position: { x: 0, z: 0 }, radius: 4, strength: 0.3 },
                    { type: 'anti_gravity', position: { x: 6, z: 0 }, radius: 2, force: 15 },
                    { type: 'anti_gravity', position: { x: -6, z: 0 }, radius: 2, force: 15 },
                    { type: 'laser_beam', position: { x: 4, z: 4 }, radius: 1, damage: 20, interval: 4 },
                    { type: 'laser_beam', position: { x: -4, z: -4 }, radius: 1, damage: 20, interval: 4 }
                ]
            },
            {
                name: "Toxic Swamp",
                description: "Poisonous waters bubble with danger",
                colors: {
                    platform: 0x556B2F,
                    edge: 0x9ACD32,
                    markers: 0x32CD32,
                    fog: 0x6B8E23
                },
                fog: { color: 0x6B8E23, near: 18, far: 50 },
                lighting: { ambient: 0x2F4F2F, directional: 0x9ACD32 },
                particles: { color: 0x7FFF00, count: 8 },
                hazards: [
                    { type: 'ramp', position: { x: -5, z: -5 }, angle: 35, force: 26 },
                    { type: 'ramp', position: { x: 5, z: 5 }, angle: 35, force: 26 },
                    { type: 'acid_pool', position: { x: 0, z: 0 }, radius: 3, damage: 10 },
                    { type: 'acid_pool', position: { x: 6, z: 0 }, radius: 2, damage: 8 },
                    { type: 'acid_pool', position: { x: -6, z: 0 }, radius: 2, damage: 8 },
                    { type: 'poison_gas', position: { x: 0, z: 6 }, radius: 3, damage: 5, interval: 3 },
                    { type: 'poison_gas', position: { x: 0, z: -6 }, radius: 3, damage: 5, interval: 3 }
                ]
            },
            {
                name: "Clockwork Factory",
                description: "Mechanical gears and steam-powered chaos",
                colors: {
                    platform: 0x8B4513,
                    edge: 0xDAA520,
                    markers: 0xD2691E,
                    fog: 0xBC8F8F
                },
                fog: { color: 0xBC8F8F, near: 20, far: 60 },
                lighting: { ambient: 0x441111, directional: 0xDAA520 },
                particles: { color: 0xFFD700, count: 6 },
                hazards: [
                    { type: 'ramp', position: { x: 0, z: 0 }, angle: 40, force: 30 },
                    { type: 'ramp', position: { x: 8, z: 0 }, angle: 35, force: 25 },
                    { type: 'ramp', position: { x: -8, z: 0 }, angle: 35, force: 25 },
                    { type: 'steam_vent', position: { x: 4, z: 4 }, radius: 1.5, force: 40, interval: 4 },
                    { type: 'steam_vent', position: { x: -4, z: -4 }, radius: 1.5, force: 40, interval: 4 },
                    { type: 'spinning_gear', position: { x: 0, z: 6 }, radius: 2, force: 20 },
                    { type: 'spinning_gear', position: { x: 0, z: -6 }, radius: 2, force: 20 }
                ]
            },
            {
                name: "Floating Islands",
                description: "Sky islands connected by wind currents",
                colors: {
                    platform: 0x87CEEB,
                    edge: 0xF0F8FF,
                    markers: 0x4169E1,
                    fog: 0xB0E0E6
                },
                fog: { color: 0xB0E0E6, near: 30, far: 90 },
                lighting: { ambient: 0x444466, directional: 0xF0F8FF },
                particles: { color: 0xFFFFFF, count: 18 },
                hazards: [
                    { type: 'ramp', position: { x: -6, z: 6 }, angle: 55, force: 40 },
                    { type: 'ramp', position: { x: 6, z: -6 }, angle: 55, force: 40 },
                    { type: 'wind_current', position: { x: 0, z: 0 }, radius: 4, force: 18 },
                    { type: 'cloud_bounce', position: { x: 4, z: 0 }, radius: 2, force: 30 },
                    { type: 'cloud_bounce', position: { x: -4, z: 0 }, radius: 2, force: 30 },
                    { type: 'wind_vortex', position: { x: 0, z: 8 }, radius: 2.5, strength: 22 },
                    { type: 'wind_vortex', position: { x: 0, z: -8 }, radius: 2.5, strength: 22 }
                ]
            },
            {
                name: "Magma Core",
                description: "Molten rock erupts from the planet's heart",
                colors: {
                    platform: 0x8B0000,
                    edge: 0xFF4500,
                    markers: 0xFF6347,
                    fog: 0x8B0000
                },
                fog: { color: 0x8B0000, near: 15, far: 55 },
                lighting: { ambient: 0x440000, directional: 0xFF4500 },
                particles: { color: 0xFF4500, count: 12 },
                hazards: [
                    { type: 'ramp', position: { x: -7, z: 0 }, angle: 45, force: 35 },
                    { type: 'ramp', position: { x: 7, z: 0 }, angle: 45, force: 35 },
                    { type: 'lava_geyser', position: { x: 0, z: 0 }, radius: 2, force: 45, interval: 5, damage: 30 },
                    { type: 'lava_pool', position: { x: 4, z: 4 }, radius: 2.5, damage: 25 },
                    { type: 'lava_pool', position: { x: -4, z: -4 }, radius: 2.5, damage: 25 },
                    { type: 'magma_burst', position: { x: 0, z: 6 }, radius: 2, damage: 20, interval: 4 },
                    { type: 'magma_burst', position: { x: 0, z: -6 }, radius: 2, damage: 20, interval: 4 }
                ]
            },
            {
                name: "Pirate Ship",
                description: "Battle on the high seas with rolling waves",
                colors: {
                    platform: 0x8B4513,
                    edge: 0x4682B4,
                    markers: 0xDAA520,
                    fog: 0x4682B4
                },
                fog: { color: 0x4682B4, near: 25, far: 75 },
                lighting: { ambient: 0x334455, directional: 0xDAA520 },
                particles: { color: 0x87CEEB, count: 10 },
                hazards: [
                    { type: 'ramp', position: { x: 0, z: 8 }, angle: 30, force: 22 },
                    { type: 'ramp', position: { x: 6, z: -6 }, angle: 40, force: 28 },
                    { type: 'ramp', position: { x: -6, z: -6 }, angle: 40, force: 28 },
                    { type: 'cannon_blast', position: { x: 0, z: 0 }, radius: 3, force: 50, interval: 6, damage: 25 },
                    { type: 'wave_push', position: { x: 8, z: 0 }, radius: 4, force: 30, interval: 4 },
                    { type: 'wave_push', position: { x: -8, z: 0 }, radius: 4, force: 30, interval: 4 },
                    { type: 'barrel_roll', position: { x: 0, z: -4 }, radius: 2, force: 20 }
                ]
            }
        ];
        
        // Rigidbody physics properties
        this.ballRadius = 0.8;
        this.gravity = -20;
        this.airResistance = 0.995;
        this.groundFriction = 0.95;
        this.restitution = 0.6;
        
        // Damage and knockback system
        this.baseDamage = 8;        // Increased from 3 to 8 for higher initial damage
        this.damageVariation = 4;   // Increased from 2 to 4 for more damage range
        this.baseKnockback = 6;     // Increased from 4 to 6 for stronger knockback
        this.knockbackScaling = 0.08;
        this.maxKnockback = 35;     // Increased from 30 to 35 for more dramatic knockback
        this.hitstunTime = 0.4;     // Increased from 0.3 to 0.4 for longer stun
        
        // Collision and force properties
        this.collisionDamping = 0.8;
        this.minCollisionSpeed = 0.8;
        this.maxCollisionForce = 25;
        
        // Player system
        this.players = [];
        this.maxPlayers = 4;
        this.activePlayerCount = 4; // Default to 4 players for multiplayer
        this.alivePlayers = 0;
        
        // Round system
        this.currentRound = 1;
        this.maxRounds = 5;
        this.roundWinTarget = Math.ceil(this.maxRounds / 2);
        this.roundWinner = null;
        this.matchWinner = null;
        this.roundEndTimer = 0;
        this.roundRestartDelay = 3;
        this.isRoundEnding = false;
        this.arenaSelectionMode = 'sequential'; // 'sequential' or 'random'
        
        // Animation loop
        this.animationId = null;
        this.lastTime = 0;
        this.isRunning = false;
        
        // Game state
        this.roundTimer = 0;
        this.maxRoundTime = 120;
        this.winner = null;
        
        // Visual effects
        this.particles = [];
        this.cameraShake = 0;
        this.maxCameraShake = 1.5;
        this.atmosphericParticles = [];
        
        // Dynamic camera system
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.cameraPosition = new THREE.Vector3(0, 35, 30);
        this.cameraUpdateTimer = 0;
        this.cameraUpdateInterval = 0.1; // Update every 100ms for performance
        this.cameraLerpSpeed = 2.0;
        this.lastPlayerCenter = null;
        this.lastPlayerSpread = null;
        this.cameraConfig = {
            minHeight: 20,
            maxHeight: 50,
            minDistance: 15,
            maxDistance: 45,
            padding: 5, // Extra space around players
            heightOffset: 8, // How much higher than players to look
            // Zoom levels based on player count
            zoomLevels: {
                4: { height: 35, distance: 30, fov: 75 },
                3: { height: 30, distance: 25, fov: 70 },
                2: { height: 25, distance: 20, fov: 65 },
                1: { height: 20, distance: 15, fov: 60 }
            }
        };
        
        // Arena hazards system
        this.hazards = [];
        this.hazardUpdateTimer = 0;
        this.hazardEffects = [];
        
        // HUD elements
        this.playerHUDs = [];
        this.roundHUD = null;
        this.minimap = null;
        this.minimapCanvas = null;
        this.minimapSize = 150;
        
        // Player configurations with different masses for variety
        this.playerConfigs = [
            {
                id: 0,
                color: 0x00FF00,
                name: 'Player 1',
                mass: 1.0,
                moveForce: 18,
                controls: {
                    up: 'KeyW',
                    down: 'KeyS',
                    left: 'KeyA',
                    right: 'KeyD'
                },
                spawnPosition: new THREE.Vector3(-8, 2, 0)
            },
            {
                id: 1,
                color: 0xFF0000,
                name: 'Player 2',
                mass: 1.1,
                moveForce: 16,
                controls: {
                    up: 'ArrowUp',
                    down: 'ArrowDown',
                    left: 'ArrowLeft',
                    right: 'ArrowRight'
                },
                spawnPosition: new THREE.Vector3(8, 2, 0)
            },
            {
                id: 2,
                color: 0x0000FF,
                name: 'Player 3',
                mass: 0.9,
                moveForce: 20,
                controls: {
                    up: 'KeyI',
                    down: 'KeyK',
                    left: 'KeyJ',
                    right: 'KeyL'
                },
                spawnPosition: new THREE.Vector3(0, 2, -8)
            },
            {
                id: 3,
                color: 0xFFFF00,
                name: 'Player 4',
                mass: 1.2,
                moveForce: 14,
                controls: {
                    up: 'KeyT',
                    down: 'KeyG',
                    left: 'KeyF',
                    right: 'KeyH'
                },
                spawnPosition: new THREE.Vector3(0, 2, 8)
            }
        ];
        
        // Input handling
        this.keys = {};
        this.setupInputHandling();
        
        // Initialize canvas settings
        this.initializeCanvas();
        
        console.log('🥊 Local Multiplayer Battle system initialized');
    }
    
    // Initialize canvas settings
    initializeCanvas() {
        // Ensure canvas is visible and properly sized
        const canvas = this.renderer.domElement;
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '1';
        
        // Set renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Setup input handling for all players
    setupInputHandling() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
    }
    
    // Set number of active players
    setPlayerCount(count) {
        this.activePlayerCount = Math.min(Math.max(count, 2), this.maxPlayers);
        console.log(`👥 Set active players: ${this.activePlayerCount}`);
    }
    
    // Initialize the battle
    initialize() {
        this.selectArenaTheme();
        this.createArena();
        this.createPlayers();
        this.setupCamera();
        this.showPlayerSetup();
        
        // Start the animation loop
        this.startAnimationLoop();
        
        console.log('🏟️ Local multiplayer battle arena initialized');
        return true;
    }
    
    // Start the animation loop
    startAnimationLoop() {
        this.isRunning = true;
        this.lastTime = performance.now();
        
        const animate = (currentTime) => {
            if (!this.isRunning) return;
            
            const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
        console.log('🎮 Battle animation started');
    }
    
    // Stop the animation loop
    stopAnimationLoop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        console.log('🎮 Animation loop stopped');
    }
    
    // Select arena theme for current round
    selectArenaTheme() {
        if (this.arenaSelectionMode === 'random') {
            this.currentArenaTheme = Math.floor(Math.random() * this.arenaThemes.length);
        } else {
            // Sequential - cycle through themes
            this.currentArenaTheme = (this.currentRound - 1) % this.arenaThemes.length;
        }
        
        const theme = this.arenaThemes[this.currentArenaTheme];
        console.log(`🎨 Selected arena theme: ${theme.name} - ${theme.description}`);
    }
    
    // Create themed battle arena
    createArena() {
        // Clear existing arena objects
        this.clearArenaObjects();
        
        const theme = this.arenaThemes[this.currentArenaTheme];
        
        // Set fog for atmospheric effect
        this.scene.fog = new THREE.Fog(theme.fog.color, theme.fog.near, theme.fog.far);
        
        // Clear existing lights
        this.clearLights();
        
        // Create themed lighting
        this.createThemedLighting(theme);
        
        // Set skybox theme for battle arena
        if (window.game && window.game.skyboxManager) {
            const skyboxTheme = window.game.skyboxManager.getBattleTheme(theme.name);
            window.game.skyboxManager.setSkyboxTheme(skyboxTheme);
        }
        
        // Main arena platform with enhanced materials
        const arenaGeometry = new THREE.CylinderGeometry(this.arenaRadius, this.arenaRadius, this.arenaHeight, 64);
        const arenaMaterial = new THREE.MeshPhongMaterial({ 
            color: theme.colors.platform,
            transparent: true,
            opacity: 0.95,
            shininess: 60,
            specular: 0x444444,
            emissive: theme.colors.platform,
            emissiveIntensity: 0.1
        });
        this.arena = new THREE.Mesh(arenaGeometry, arenaMaterial);
        this.arena.position.y = -this.arenaHeight / 2;
        this.arena.name = 'themed_arena';
        this.arena.castShadow = true;
        this.arena.receiveShadow = true;
        this.scene.add(this.arena);
        this.arenaObjects.push(this.arena);
        
        // Arena edge ring with enhanced materials
        const edgeGeometry = new THREE.TorusGeometry(this.arenaRadius, 0.3, 16, 64);
        const edgeMaterial = new THREE.MeshPhongMaterial({ 
            color: theme.colors.edge,
            transparent: true,
            opacity: 0.9,
            shininess: 80,
            specular: 0xFFFFFF,
            emissive: theme.colors.edge,
            emissiveIntensity: 0.2
        });
        this.arenaEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        this.arenaEdge.position.y = 0.3;
        this.arenaEdge.rotation.x = Math.PI / 2;
        this.arenaEdge.name = 'themed_edge';
        this.arenaEdge.castShadow = true;
        this.arenaEdge.receiveShadow = true;
        this.scene.add(this.arenaEdge);
        this.arenaObjects.push(this.arenaEdge);
        
        // Create themed visual elements
        this.createThemedMarkers(theme);
        this.createThemedEnvironment(theme);
        this.createDangerZone(theme);
        this.createAtmosphericParticles(theme);
        
        // Create special features (like upper level platforms)
        this.createSpecialFeatures(theme);
        
        // Create arena hazards
        this.createArenaHazards(theme);
        
        console.log(`🏟️ ${theme.name} arena created with atmospheric effects`);
    }
    
    // Create themed lighting
    createThemedLighting(theme) {
        // Enhanced ambient lighting
        const ambientLight = new THREE.AmbientLight(theme.lighting.ambient, 0.4);
        ambientLight.name = 'themed_ambient';
        this.scene.add(ambientLight);
        this.arenaObjects.push(ambientLight);
        
        // Enhanced directional light with high-quality shadows
        const directionalLight = new THREE.DirectionalLight(theme.lighting.directional, 0.8);
        directionalLight.position.set(20, 30, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 4096;  // High resolution shadows
        directionalLight.shadow.mapSize.height = 4096;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        directionalLight.shadow.bias = -0.0001;
        directionalLight.shadow.radius = 4;  // Soft shadows
        directionalLight.shadow.blurSamples = 25;
        directionalLight.name = 'themed_directional';
        this.scene.add(directionalLight);
        this.arenaObjects.push(directionalLight);
        
        // Add rim lighting for dramatic effect
        const rimLight = new THREE.DirectionalLight(theme.colors.edge, 0.3);
        rimLight.position.set(-20, 15, -10);
        rimLight.name = 'themed_rim';
        this.scene.add(rimLight);
        this.arenaObjects.push(rimLight);
        
        // Add atmospheric spotlight for dramatic lighting
        const spotLight = new THREE.SpotLight(theme.colors.fog, 0.6, 50, Math.PI / 6, 0.2, 2);
        spotLight.position.set(0, 40, 0);
        spotLight.target.position.set(0, 0, 0);
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        spotLight.shadow.radius = 4;
        spotLight.shadow.blurSamples = 20;
        spotLight.name = 'themed_spotlight';
        this.scene.add(spotLight);
        this.scene.add(spotLight.target);
        this.arenaObjects.push(spotLight);
        this.arenaObjects.push(spotLight.target);
        
        // Special lighting effects based on theme
        if (theme.name === "Volcanic Crater") {
            // Enhanced lava lighting with shadows
            const lavaLight = new THREE.PointLight(0xFF4500, 2, 30);
            lavaLight.position.set(0, -5, 0);
            lavaLight.castShadow = true;
            lavaLight.shadow.mapSize.width = 1024;
            lavaLight.shadow.mapSize.height = 1024;
            lavaLight.name = 'lava_light';
            this.scene.add(lavaLight);
            this.arenaObjects.push(lavaLight);
        } else if (theme.name === "Neon Grid") {
            // Enhanced neon lights with shadows
            const neonLight1 = new THREE.PointLight(0x00FFFF, 1.5, 25);
            neonLight1.position.set(15, 5, 0);
            neonLight1.castShadow = true;
            neonLight1.shadow.mapSize.width = 1024;
            neonLight1.shadow.mapSize.height = 1024;
            neonLight1.name = 'neon_light1';
            this.scene.add(neonLight1);
            this.arenaObjects.push(neonLight1);
            
            const neonLight2 = new THREE.PointLight(0xFF00FF, 1.5, 25);
            neonLight2.position.set(-15, 5, 0);
            neonLight2.castShadow = true;
            neonLight2.shadow.mapSize.width = 1024;
            neonLight2.shadow.mapSize.height = 1024;
            neonLight2.name = 'neon_light2';
            this.scene.add(neonLight2);
            this.arenaObjects.push(neonLight2);
        } else if (theme.name === "Sky Sanctuary") {
            // Sky lighting with god rays effect
            const skyLight = new THREE.PointLight(0x87CEEB, 1.2, 40);
            skyLight.position.set(0, 25, 0);
            skyLight.castShadow = true;
            skyLight.shadow.mapSize.width = 1024;
            skyLight.shadow.mapSize.height = 1024;
            skyLight.name = 'sky_light';
            this.scene.add(skyLight);
            this.arenaObjects.push(skyLight);
        }
        
        console.log(`💡 Enhanced themed lighting created for ${theme.name} with high-quality shadows`);
    }
    
    // Create themed markers around arena
    createThemedMarkers(theme) {
        const markerCount = 12;
        for (let i = 0; i < markerCount; i++) {
            const angle = (i / markerCount) * Math.PI * 2;
            const x = Math.cos(angle) * (this.arenaRadius + 2);
            const z = Math.sin(angle) * (this.arenaRadius + 2);
            
            let markerGeometry, markerMaterial;
            
            // Theme-specific marker designs
            if (theme.name === "Jungle Temple") {
                markerGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 6);
                markerMaterial = new THREE.MeshLambertMaterial({ color: theme.colors.markers });
            } else if (theme.name === "Volcanic Crater") {
                markerGeometry = new THREE.ConeGeometry(0.4, 3, 8);
                markerMaterial = new THREE.MeshLambertMaterial({ 
                    color: theme.colors.markers,
                    emissive: 0x330000,
                    emissiveIntensity: 0.3
                });
            } else if (theme.name === "Sky Sanctuary") {
                markerGeometry = new THREE.OctahedronGeometry(0.5, 0);
                markerMaterial = new THREE.MeshLambertMaterial({ 
                    color: theme.colors.markers,
                    transparent: true,
                    opacity: 0.8
                });
            } else if (theme.name === "Desert Ruins") {
                markerGeometry = new THREE.BoxGeometry(0.4, 3, 0.4);
                markerMaterial = new THREE.MeshLambertMaterial({ color: theme.colors.markers });
            } else if (theme.name === "Neon Grid") {
                markerGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
                markerMaterial = new THREE.MeshLambertMaterial({ 
                    color: theme.colors.markers,
                    emissive: theme.colors.markers,
                    emissiveIntensity: 0.5
                });
            } else if (theme.name === "Frozen Peaks") {
                markerGeometry = new THREE.ConeGeometry(0.3, 3, 6);
                markerMaterial = new THREE.MeshLambertMaterial({ 
                    color: theme.colors.markers,
                    transparent: true,
                    opacity: 0.9
                });
            } else { // Ancient Temple
                markerGeometry = new THREE.BoxGeometry(0.6, 3, 0.3);
                markerMaterial = new THREE.MeshLambertMaterial({ color: theme.colors.markers });
            }
            
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(x, 1.5, z);
            marker.name = 'themed_marker';
            this.scene.add(marker);
            this.arenaObjects.push(marker);
        }
    }
    
    // Create theme-specific environment elements
    createThemedEnvironment(theme) {
        if (theme.name === "Jungle Temple") {
            // Add vine-like structures
            for (let i = 0; i < 4; i++) {
                const vineGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8, 8);
                const vineMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                const vine = new THREE.Mesh(vineGeometry, vineMaterial);
                vine.position.set(
                    Math.random() * 20 - 10,
                    4,
                    Math.random() * 20 - 10
                );
                vine.name = 'jungle_vine';
                this.scene.add(vine);
                this.arenaObjects.push(vine);
            }
        } else if (theme.name === "Neon Grid") {
            // Add grid lines on the ground
            const gridSize = 30;
            const gridMaterial = new THREE.LineBasicMaterial({ color: 0x00FFFF });
            
            for (let i = -gridSize; i <= gridSize; i += 2) {
                const geometry1 = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(i, -0.4, -gridSize),
                    new THREE.Vector3(i, -0.4, gridSize)
                ]);
                const line1 = new THREE.Line(geometry1, gridMaterial);
                line1.name = 'neon_grid';
                this.scene.add(line1);
                this.arenaObjects.push(line1);
                
                const geometry2 = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(-gridSize, -0.4, i),
                    new THREE.Vector3(gridSize, -0.4, i)
                ]);
                const line2 = new THREE.Line(geometry2, gridMaterial);
                line2.name = 'neon_grid';
                this.scene.add(line2);
                this.arenaObjects.push(line2);
            }
        } else if (theme.name === "Desert Ruins") {
            // Add sand dunes
            for (let i = 0; i < 6; i++) {
                const duneGeometry = new THREE.SphereGeometry(Math.random() * 3 + 2, 16, 8);
                const duneMaterial = new THREE.MeshLambertMaterial({ color: 0xF4A460 });
                const dune = new THREE.Mesh(duneGeometry, duneMaterial);
                dune.position.set(
                    Math.random() * 40 - 20,
                    -1,
                    Math.random() * 40 - 20
                );
                dune.scale.y = 0.3;
                dune.name = 'sand_dune';
                this.scene.add(dune);
                this.arenaObjects.push(dune);
            }
        }
    }
    
    // Create themed danger zone
    createDangerZone(theme) {
        const dangerGeometry = new THREE.CylinderGeometry(this.arenaRadius * 1.5, this.arenaRadius * 1.5, 0.5, 32);
        const dangerMaterial = new THREE.MeshLambertMaterial({ 
            color: theme.colors.fog,
            transparent: true,
            opacity: 0.3
        });
        const dangerZone = new THREE.Mesh(dangerGeometry, dangerMaterial);
        dangerZone.position.y = this.fallThreshold + 5;
        dangerZone.name = 'themed_danger_zone';
        this.scene.add(dangerZone);
        this.arenaObjects.push(dangerZone);
    }
    
    // Create enhanced atmospheric particles
    createAtmosphericParticles(theme) {
        this.atmosphericParticles = [];
        
        for (let i = 0; i < theme.particles.count; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.12, 16, 16);
            const particleMaterial = new THREE.MeshPhongMaterial({ 
                color: theme.particles.color,
                transparent: true,
                opacity: 0.7,
                shininess: 60,
                specular: 0xFFFFFF,
                emissive: theme.particles.color,
                emissiveIntensity: 0.3
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random starting position
            particle.position.set(
                Math.random() * 30 - 15,
                Math.random() * 20 + 5,
                Math.random() * 30 - 15
            );
            
            // Enhanced velocity with theme-based movement
            particle.velocity = new THREE.Vector3(
                Math.random() * 3 - 1.5,
                Math.random() * 3 - 1.5,
                Math.random() * 3 - 1.5
            );
            
            // Add rotation properties
            particle.rotationSpeed = new THREE.Vector3(
                Math.random() * 0.05 - 0.025,
                Math.random() * 0.05 - 0.025,
                Math.random() * 0.05 - 0.025
            );
            
            particle.name = 'atmospheric_particle';
            particle.castShadow = true;
            particle.receiveShadow = true;
            this.scene.add(particle);
            this.arenaObjects.push(particle);
            this.atmosphericParticles.push(particle);
        }
    }
    
    // Update enhanced atmospheric particles
    updateAtmosphericParticles(deltaTime) {
        this.atmosphericParticles.forEach(particle => {
            // Move particle
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            
            // Add rotation animation
            if (particle.rotationSpeed) {
                particle.rotation.x += particle.rotationSpeed.x;
                particle.rotation.y += particle.rotationSpeed.y;
                particle.rotation.z += particle.rotationSpeed.z;
            }
            
            // Add subtle pulsing effect
            const time = performance.now() * 0.001;
            const pulse = 1 + Math.sin(time * 2 + particle.position.x) * 0.1;
            particle.scale.setScalar(pulse);
            
            // Enhanced opacity animation
            const opacity = 0.7 + Math.sin(time * 1.5 + particle.position.z) * 0.2;
            particle.material.opacity = opacity;
            
            // Wrap around boundaries
            if (particle.position.x > 20) particle.position.x = -20;
            if (particle.position.x < -20) particle.position.x = 20;
            if (particle.position.z > 20) particle.position.z = -20;
            if (particle.position.z < -20) particle.position.z = 20;
            if (particle.position.y > 25) particle.position.y = 5;
            if (particle.position.y < 5) particle.position.y = 25;
            
            // Enhanced floating motion with multiple sine waves
            particle.position.y += Math.sin(time * 0.8 + particle.position.x) * 0.03;
            particle.position.x += Math.sin(time * 0.6 + particle.position.z) * 0.01;
            particle.position.z += Math.sin(time * 0.5 + particle.position.x) * 0.01;
        });
    }
    
    // Clear existing arena objects
    clearArenaObjects() {
        this.arenaObjects.forEach(obj => {
            this.scene.remove(obj);
        });
        this.arenaObjects = [];
        this.atmosphericParticles = [];
    }
    
    // Clear existing lights
    clearLights() {
        const lightsToRemove = [];
        this.scene.traverse((child) => {
            if (child.isLight && (child.name?.includes('themed_') || child.name?.includes('lava_') || child.name?.includes('neon_'))) {
                lightsToRemove.push(child);
            }
        });
        lightsToRemove.forEach(light => this.scene.remove(light));
    }
    
    // Create all player balls with rigidbody physics
    createPlayers() {
        this.players = [];
        this.alivePlayers = this.activePlayerCount;
        
        for (let i = 0; i < this.activePlayerCount; i++) {
            const config = this.playerConfigs[i];
            
            // Create high-quality player ball
            const ballGeometry = new THREE.SphereGeometry(this.ballRadius, 32, 32);
            const ballMaterial = new THREE.MeshPhongMaterial({ 
                color: config.color,
                transparent: true,
                opacity: 0.95,
                shininess: 80,
                specular: 0xFFFFFF,
                emissive: config.color,
                emissiveIntensity: 0.2
            });
            const ball = new THREE.Mesh(ballGeometry, ballMaterial);
            ball.position.copy(config.spawnPosition);
            ball.name = `player_${i}_ball`;
            ball.castShadow = true;
            ball.receiveShadow = true;
            this.scene.add(ball);
            
            // Create player rigidbody object
            const player = {
                id: i,
                name: config.name,
                color: config.color,
                controls: config.controls,
                ball: ball,
                
                // Rigidbody physics properties
                mass: config.mass,
                velocity: new THREE.Vector3(0, 0, 0),
                acceleration: new THREE.Vector3(0, 0, 0),
                force: new THREE.Vector3(0, 0, 0),
                moveForce: config.moveForce,
                
                // Physics state
                isOnGround: true,
                isAlive: true,
                lastCollisionTime: 0,
                
                // Damage system
                damage: 0,
                maxDamage: 999,
                hitstunTimer: 0,
                lastHitBy: null,
                
                // Escalating damage system
                consecutiveHits: new Map(), // Track consecutive hits from each attacker
                lastHitTime: 0,
                hitResetTime: 3.0, // Reset consecutive hits after 3 seconds
                
                // Round system
                roundWins: 0,
                
                // Visual
                spawnPosition: config.spawnPosition.clone(),
                originalColor: config.color,
                
                // Ball rotation tracking
                rollRotation: new THREE.Vector3(0, 0, 0)
            };
            
            this.players.push(player);
            
            // Add name label above player
            this.createPlayerLabel(player);
            
            // Add mass indicator (size variation)
            const massScale = 0.8 + (player.mass - 0.9) * 0.4;
            player.ball.scale.setScalar(massScale);
        }
        
        console.log(`👥 Created ${this.activePlayerCount} players with rigidbody physics and damage system`);
    }
    
    // Create enhanced name label for player
    createPlayerLabel(player) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 100;
        
        // Enable high-quality text rendering
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.textBaseline = 'middle';
        
        // Background with better contrast
        context.fillStyle = 'rgba(0, 0, 0, 0.85)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Border with gradient effect
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `#${player.color.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(1, `#${Math.floor(player.color * 0.7).toString(16).padStart(6, '0')}`);
        context.strokeStyle = gradient;
        context.lineWidth = 4;
        context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Player name with outline for clarity
        context.font = 'bold 28px "Segoe UI", Arial, sans-serif';
        context.textAlign = 'center';
        
        // Text outline for better visibility
        context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        context.lineWidth = 4;
        context.strokeText(player.name, canvas.width / 2, 32);
        
        // Main text
        context.fillStyle = `#${player.color.toString(16).padStart(6, '0')}`;
        context.fillText(player.name, canvas.width / 2, 32);
        
        // Control scheme with better formatting
        context.fillStyle = 'white';
        context.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        const controls = `${player.controls.up.replace('Key', '').replace('Arrow', '⬆')} ${player.controls.down.replace('Key', '').replace('Arrow', '⬇')} ${player.controls.left.replace('Key', '').replace('Arrow', '⬅')} ${player.controls.right.replace('Key', '').replace('Arrow', '➡')}`;
        
        // Control text outline
        context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        context.lineWidth = 2;
        context.strokeText(controls, canvas.width / 2, 58);
        context.fillText(controls, canvas.width / 2, 58);
        
        // Mass indicator with better styling
        context.fillStyle = '#E0E0E0';
        context.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        
        // Mass text outline
        context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        context.lineWidth = 2;
        context.strokeText(`Mass: ${player.mass}`, canvas.width / 2, 80);
        context.fillText(`Mass: ${player.mass}`, canvas.width / 2, 80);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(6, 1.5, 1);
        sprite.position.copy(player.ball.position);
        sprite.position.y += 3;
        sprite.name = `player_${player.id}_label`;
        this.scene.add(sprite);
        
        player.label = sprite;
    }
    
    // Setup camera for multiplayer view
    setupCamera() {
        // Position camera higher and further back to show all players
        this.camera.position.set(0, 35, 30);
        this.camera.lookAt(0, 0, 0);
        this.camera.fov = 75; // Wider field of view
        this.camera.updateProjectionMatrix();
    }
    
    // Calculate bounding box of all active players
    calculatePlayersBoundingBox() {
        const activePlayers = this.players.filter(p => p.isAlive);
        if (activePlayers.length === 0) return null;
        
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        activePlayers.forEach(player => {
            const pos = player.ball.position;
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minZ = Math.min(minZ, pos.z);
            maxZ = Math.max(maxZ, pos.z);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
        });
        
        return {
            min: new THREE.Vector3(minX, minY, minZ),
            max: new THREE.Vector3(maxX, maxY, maxZ),
            center: new THREE.Vector3(
                (minX + maxX) / 2,
                (minY + maxY) / 2,
                (minZ + maxZ) / 2
            ),
            size: new THREE.Vector3(
                maxX - minX,
                maxY - minY,
                maxZ - minZ
            )
        };
    }
    
    // Update camera to fit all players with dynamic zoom
    updateDynamicCamera(deltaTime) {
        this.cameraUpdateTimer += deltaTime;
        
        // Only update camera periodically for performance
        if (this.cameraUpdateTimer < this.cameraUpdateInterval) return;
        this.cameraUpdateTimer = 0;
        
        const bbox = this.calculatePlayersBoundingBox();
        if (!bbox) return;
        
        // Performance optimization: Skip update if players haven't moved much
        const currentCenter = bbox.center;
        const lastCenter = this.lastPlayerCenter || currentCenter;
        const centerMovement = currentCenter.distanceTo(lastCenter);
        const currentSpread = Math.max(bbox.size.x, bbox.size.z);
        const lastSpread = this.lastPlayerSpread || currentSpread;
        const spreadChange = Math.abs(currentSpread - lastSpread);
        
        // Only update if significant movement or spread change
        if (centerMovement < 1 && spreadChange < 2) {
            this.lastPlayerCenter = currentCenter.clone();
            this.lastPlayerSpread = currentSpread;
            return;
        }
        
        this.lastPlayerCenter = currentCenter.clone();
        this.lastPlayerSpread = currentSpread;
        
        const activePlayerCount = this.players.filter(p => p.isAlive).length;
        const config = this.cameraConfig.zoomLevels[activePlayerCount] || this.cameraConfig.zoomLevels[4];
        
        // Calculate required distance based on player spread
        const maxSpread = Math.max(bbox.size.x, bbox.size.z);
        const requiredDistance = Math.max(
            maxSpread + this.cameraConfig.padding,
            config.distance
        );
        
        // Clamp distance to reasonable limits
        const clampedDistance = Math.max(
            this.cameraConfig.minDistance,
            Math.min(this.cameraConfig.maxDistance, requiredDistance)
        );
        
        // Calculate height based on distance and player count
        let targetHeight = config.height;
        if (maxSpread > 15) { // If players are very spread out
            targetHeight = Math.max(targetHeight, maxSpread * 1.5);
        }
        
        // Clamp height to reasonable limits
        const clampedHeight = Math.max(
            this.cameraConfig.minHeight,
            Math.min(this.cameraConfig.maxHeight, targetHeight)
        );
        
        // Set target camera position
        this.cameraTarget.copy(bbox.center);
        this.cameraTarget.y += this.cameraConfig.heightOffset;
        
        // Calculate camera position based on target
        const targetCameraPosition = new THREE.Vector3(
            bbox.center.x,
            clampedHeight,
            bbox.center.z + clampedDistance
        );
        
        // Ensure camera doesn't go too far from arena center
        const arenaCenter = new THREE.Vector3(0, 0, 0);
        const distanceFromArenaCenter = targetCameraPosition.distanceTo(arenaCenter);
        if (distanceFromArenaCenter > this.arenaRadius * 3) {
            // Pull camera back towards arena center
            const pullDirection = arenaCenter.clone().sub(targetCameraPosition).normalize();
            targetCameraPosition.add(pullDirection.multiplyScalar(distanceFromArenaCenter - this.arenaRadius * 3));
        }
        
        // Smoothly interpolate camera position
        this.cameraPosition.lerp(targetCameraPosition, this.cameraLerpSpeed * deltaTime);
        
        // Update FOV based on player count
        const targetFOV = config.fov;
        if (Math.abs(this.camera.fov - targetFOV) > 1) {
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, this.cameraLerpSpeed * deltaTime);
            this.camera.updateProjectionMatrix();
        }
        
        // Special handling for edge cases
        if (activePlayerCount === 1) {
            // Follow the last player more closely
            const lastPlayer = this.players.find(p => p.isAlive);
            if (lastPlayer) {
                this.cameraTarget.copy(lastPlayer.ball.position);
                this.cameraTarget.y += this.cameraConfig.heightOffset;
                
                // Closer follow for single player
                this.cameraPosition.set(
                    lastPlayer.ball.position.x,
                    config.height,
                    lastPlayer.ball.position.z + config.distance
                );
            }
        }
    }
    
    // Apply camera position and handle shake
    applyCameraTransform() {
        // Apply dynamic camera position
        this.camera.position.copy(this.cameraPosition);
        
        // Apply camera shake if active
        if (this.cameraShake > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
            this.camera.position.z += (Math.random() - 0.5) * this.cameraShake;
            this.cameraShake *= 0.92;
        }
        
        // Make camera look at target
        this.camera.lookAt(this.cameraTarget);
    }
    
    // Handle special camera scenarios
    handleSpecialCameraScenarios() {
        const activePlayers = this.players.filter(p => p.isAlive);
        
        if (activePlayers.length === 2) {
            // Tighter framing for 1v1 battles
            const player1 = activePlayers[0];
            const player2 = activePlayers[1];
            
            // Calculate midpoint between players
            const midpoint = new THREE.Vector3()
                .addVectors(player1.ball.position, player2.ball.position)
                .multiplyScalar(0.5);
            
            // Adjust camera to focus on the action
            this.cameraTarget.copy(midpoint);
            this.cameraTarget.y += this.cameraConfig.heightOffset;
            
            // Distance based on how far apart they are
            const distance = player1.ball.position.distanceTo(player2.ball.position);
            const adjustedDistance = Math.max(12, distance * 1.2 + 8);
            
            this.cameraPosition.set(
                midpoint.x,
                this.cameraConfig.zoomLevels[2].height,
                midpoint.z + adjustedDistance
            );
        } else if (activePlayers.length === 1) {
            // Cinematic follow for victory/defeat
            const lastPlayer = activePlayers[0];
            this.cameraTarget.copy(lastPlayer.ball.position);
            this.cameraTarget.y += this.cameraConfig.heightOffset;
            
            // Orbit around the last player
            const orbitRadius = 18;
            const orbitSpeed = 0.5;
            const angle = Date.now() * 0.001 * orbitSpeed;
            
            this.cameraPosition.set(
                lastPlayer.ball.position.x + Math.cos(angle) * orbitRadius,
                this.cameraConfig.zoomLevels[1].height,
                lastPlayer.ball.position.z + Math.sin(angle) * orbitRadius
            );
        }
    }
    
    // Show player setup information
    showPlayerSetup() {
        const setupInfo = document.createElement('div');
        setupInfo.id = 'multiplayer-setup';
        setupInfo.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 15px;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            text-align: center;
            border: 3px solid #FFD700;
            z-index: 1000;
        `;
        
        let controlsHTML = '<h2 style="color: #FFD700;">🥊 SUMO BATTLE TOURNAMENT</h2>';
        controlsHTML += '<p style="margin-bottom: 10px;">Knock opponents off the platform!</p>';
        controlsHTML += '<p style="margin-bottom: 10px; color: #FF6B6B;"><strong>⚠️ NO WALLS - Falling off eliminates you!</strong></p>';
        controlsHTML += '<p style="margin-bottom: 10px; color: #FFD700;"><strong>💥 Damage System: Higher damage = easier to knock off!</strong></p>';
        controlsHTML += `<p style="margin-bottom: 10px; color: #00FF00;"><strong>🏆 First to ${this.roundWinTarget} rounds wins!</strong></p>`;
        controlsHTML += `<p style="margin-bottom: 20px; color: #87CEEB;"><strong>🎨 16 Themed Arenas: Each round brings new challenges!</strong></p>`;
        
        for (let i = 0; i < this.activePlayerCount; i++) {
            const player = this.players[i];
            const colorHex = `#${player.color.toString(16).padStart(6, '0')}`;
            
            controlsHTML += `
                <div style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <div style="color: ${colorHex}; font-weight: bold; font-size: 20px;">${player.name}</div>
                    <div style="font-size: 14px; margin-top: 5px;">
                        Controls: ${player.controls.up.replace('Key', '').replace('Arrow', '⬆')} 
                        ${player.controls.down.replace('Key', '').replace('Arrow', '⬇')} 
                        ${player.controls.left.replace('Key', '').replace('Arrow', '⬅')} 
                        ${player.controls.right.replace('Key', '').replace('Arrow', '➡')}
                    </div>
                    <div style="font-size: 12px; color: #ccc;">
                        Mass: ${player.mass} | Force: ${player.moveForce}
                    </div>
                </div>
            `;
        }
        
        controlsHTML += '<p style="margin-top: 20px; font-size: 16px;">Press SPACE to start the tournament!</p>';
        
        setupInfo.innerHTML = controlsHTML;
        document.body.appendChild(setupInfo);
        
        // Wait for space key to start
        const startHandler = (event) => {
            if (event.code === 'Space') {
                document.removeEventListener('keydown', startHandler);
                document.body.removeChild(setupInfo);
                this.startBattle();
            }
        };
        
        document.addEventListener('keydown', startHandler);
    }
    
    // Start the battle
    startBattle() {
        console.log('🥊 Starting Local Multiplayer Battle Tournament!');
        
        this.gameState = 'countdown';
        this.isActive = true;
        this.roundTimer = 0;
        this.isRoundEnding = false;
        
        // Show arena introduction
        this.showArenaIntroduction();
        
        // Show countdown after introduction
        setTimeout(() => {
            this.showCountdown();
        }, 2500);
    }
    
    // Show arena introduction
    showArenaIntroduction() {
        const theme = this.arenaThemes[this.currentArenaTheme];
        const introDiv = document.createElement('div');
        introDiv.id = 'arena-intro';
        introDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 30px 50px;
            border-radius: 20px;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            text-align: center;
            border: 3px solid #FFD700;
            z-index: 1010;
        `;
        
        introDiv.innerHTML = `
            <h2 style="color: #FFD700; margin-bottom: 20px;">🎨 ARENA SELECTED</h2>
            <div style="font-size: 32px; margin-bottom: 15px; color: #${theme.colors.edge.toString(16).padStart(6, '0')}">
                ${theme.name}
            </div>
            <div style="font-size: 18px; color: #ccc; font-style: italic;">
                ${theme.description}
            </div>
        `;
        
        document.body.appendChild(introDiv);
        
        // Remove after 2 seconds
        setTimeout(() => {
            if (introDiv.parentNode) {
                document.body.removeChild(introDiv);
            }
        }, 2000);
    }
    
    // Show countdown
    showCountdown() {
        let countdown = 3;
        
        const countdownDiv = document.createElement('div');
        countdownDiv.id = 'battle-countdown';
        countdownDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 140px;
            font-weight: 900;
            color: #FFD700;
            text-shadow: 6px 6px 12px rgba(0, 0, 0, 0.8), 0px 0px 20px rgba(255, 215, 0, 0.8);
            z-index: 1010;
            pointer-events: none;
            font-family: "Segoe UI", 'Impact', 'Arial Black', sans-serif;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            text-align: center;
        `;
        document.body.appendChild(countdownDiv);
        
        const updateCountdown = () => {
            if (countdown > 0) {
                countdownDiv.textContent = countdown;
                countdown--;
                setTimeout(updateCountdown, 1000);
            } else {
                countdownDiv.textContent = 'FIGHT!';
                setTimeout(() => {
                    document.body.removeChild(countdownDiv);
                    this.gameState = 'active';
                    this.createGameHUD();
                    this.createDamageHUD();
                    this.createRoundHUD();
                    this.createMinimap();
                }, 500);
            }
        };
        
        updateCountdown();
    }
    
    // Create game HUD
    createGameHUD() {
        const hudDiv = document.createElement('div');
        hudDiv.id = 'multiplayer-hud';
        hudDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 220px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            border: 2px solid #FFD700;
            z-index: 1000;
            min-width: 120px;
        `;
        
        document.body.appendChild(hudDiv);
        this.hudElement = hudDiv;
        
        this.updateHUD();
    }
    
    // Create round counter HUD
    createRoundHUD() {
        const roundDiv = document.createElement('div');
        roundDiv.id = 'round-hud';
        roundDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            border: 2px solid #FFD700;
            z-index: 1000;
            min-width: 120px;
            text-align: center;
        `;
        
        document.body.appendChild(roundDiv);
        this.roundHUD = roundDiv;
        
        this.updateRoundHUD();
    }
    
    // Create minimap
    createMinimap() {
        // Create minimap container
        const minimapDiv = document.createElement('div');
        minimapDiv.id = 'minimap';
        minimapDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: ${this.minimapSize}px;
            height: ${this.minimapSize}px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #FFD700;
            border-radius: 10px;
            overflow: hidden;
            z-index: 1000;
        `;
        
        // Create canvas for minimap
        this.minimapCanvas = document.createElement('canvas');
        this.minimapCanvas.width = this.minimapSize;
        this.minimapCanvas.height = this.minimapSize;
        this.minimapCanvas.style.cssText = `
            width: 100%;
            height: 100%;
            display: block;
        `;
        
        minimapDiv.appendChild(this.minimapCanvas);
        document.body.appendChild(minimapDiv);
        this.minimap = minimapDiv;
        
        console.log('🗺️ Minimap created');
    }
    
    // Update minimap with player positions
    updateMinimap() {
        if (!this.minimapCanvas) return;
        
        const ctx = this.minimapCanvas.getContext('2d');
        const theme = this.arenaThemes[this.currentArenaTheme];
        
        // Clear canvas
        ctx.clearRect(0, 0, this.minimapSize, this.minimapSize);
        
        // Draw arena background
        ctx.fillStyle = `#${theme.colors.platform.toString(16).padStart(6, '0')}`;
        ctx.beginPath();
        ctx.arc(this.minimapSize / 2, this.minimapSize / 2, this.minimapSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw arena edge
        ctx.strokeStyle = `#${theme.colors.edge.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.minimapSize / 2, this.minimapSize / 2, this.minimapSize * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw hazards
        this.hazards.forEach(hazard => {
            const scale = this.minimapSize * 0.4 / this.arenaRadius;
            const x = this.minimapSize / 2 + hazard.position.x * scale;
            const y = this.minimapSize / 2 + hazard.position.z * scale;
            
            ctx.fillStyle = this.getHazardColor(hazard.type);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw players
        this.players.forEach(player => {
            if (!player.isAlive) return;
            
            const scale = this.minimapSize * 0.4 / this.arenaRadius;
            const x = this.minimapSize / 2 + player.ball.position.x * scale;
            const y = this.minimapSize / 2 + player.ball.position.z * scale;
            
            // Player dot
            ctx.fillStyle = `#${player.color.toString(16).padStart(6, '0')}`;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Player outline
            ctx.strokeStyle = player.hitstunTimer > 0 ? '#FFFF00' : '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.stroke();
            
            // Damage indicator ring
            if (player.damage > 0) {
                const damageRatio = Math.min(player.damage / 100, 1);
                ctx.strokeStyle = `hsl(${60 - (damageRatio * 60)}, 100%, 50%)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2 * damageRatio);
                ctx.stroke();
            }
        });
        
        // Draw center dot
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.minimapSize / 2, this.minimapSize / 2, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Add minimap title for clarity
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MAP', this.minimapSize / 2, 15);
    }
    
    // Get hazard color for minimap
    getHazardColor(type) {
        switch (type) {
            case 'ice': return '#87CEEB';
            case 'lava_burst': return '#FF4500';
            case 'ramp': return '#FFD700';
            case 'sinkhole': return '#4F4F4F';
            case 'bounce': return '#00FF00';
            case 'spikes': return '#FF0000';
            case 'teleporter': return '#9400D3';
            case 'wind_gust': return '#F0F8FF';
            case 'sky_lightning': return '#FFFF00';
            case 'cloud_platform': return '#FFFFFF';
            case 'quicksand': return '#F4A460';
            case 'sandstorm': return '#CD853F';
            case 'obelisk_blast': return '#FFD700';
            case 'mirage_teleporter': return '#87CEEB';
            default: return '#FFFFFF';
        }
    }
    
    // Update round HUD
    updateRoundHUD() {
        if (!this.roundHUD) return;
        
        const theme = this.arenaThemes[this.currentArenaTheme];
        let roundHTML = `<div style="font-size: 18px; color: #FFD700; margin-bottom: 10px;">📊 ROUND ${this.currentRound}</div>`;
        roundHTML += `<div style="font-size: 12px; color: #${theme.colors.edge.toString(16).padStart(6, '0')}; margin-bottom: 10px;">${theme.name}</div>`;
        roundHTML += `<div style="margin-bottom: 10px;">Target: ${this.roundWinTarget} wins</div>`;
        roundHTML += '<div style="font-size: 12px;">Round Wins:</div>';
        
        this.players.forEach(player => {
            const colorHex = `#${player.color.toString(16).padStart(6, '0')}`;
            roundHTML += `<div style="color: ${colorHex}; font-size: 12px;">${player.name}: ${player.roundWins}</div>`;
        });
        
        this.roundHUD.innerHTML = roundHTML;
    }
    
    // Create individual player HUDs
    createDamageHUD() {
        this.playerHUDs = [];
        
        // HUD positions for up to 4 players - repositioned to avoid overlap
        const hudPositions = [
            { top: '20px', left: '20px' },        // Player 1 - Top Left
            { top: '20px', right: '200px' },      // Player 2 - Top Right (avoid round HUD)
            { bottom: '180px', left: '20px' },    // Player 3 - Bottom Left (above minimap)
            { bottom: '180px', right: '200px' }   // Player 4 - Bottom Right (above minimap)
        ];
        
        for (let i = 0; i < this.activePlayerCount; i++) {
            const player = this.players[i];
            const position = hudPositions[i];
            
            const playerHUD = document.createElement('div');
            playerHUD.id = `player-hud-${i}`;
            playerHUD.style.cssText = `
                position: fixed;
                ${position.top ? `top: ${position.top};` : ''}
                ${position.bottom ? `bottom: ${position.bottom};` : ''}
                ${position.left ? `left: ${position.left};` : ''}
                ${position.right ? `right: ${position.right};` : ''}
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px;
                border-radius: 15px;
                font-family: "Segoe UI", 'Impact', Arial, sans-serif;
                font-size: 18px;
                font-weight: 600;
                border: 3px solid #${player.color.toString(16).padStart(6, '0')};
                min-width: 140px;
                text-align: center;
                z-index: 1000;
                box-shadow: 0 6px 12px rgba(0,0,0,0.5);
                backdrop-filter: blur(4px);
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                text-rendering: optimizeLegibility;
                -webkit-font-smoothing: antialiased;
            `;
            
            document.body.appendChild(playerHUD);
            this.playerHUDs.push(playerHUD);
        }
        
        this.updateDamageHUD();
    }
    
    // Update individual player HUDs
    updateDamageHUD() {
        if (!this.playerHUDs || this.playerHUDs.length === 0) return;
        
        this.players.forEach((player, index) => {
            if (index >= this.playerHUDs.length) return;
            
            const playerHUD = this.playerHUDs[index];
            const colorHex = `#${player.color.toString(16).padStart(6, '0')}`;
            const isAlive = player.isAlive;
            const damagePercent = Math.floor(player.damage);
            
            // Calculate damage color with better gradient
            let damageColor = '#FFFFFF';
            let damageBackground = 'rgba(0, 0, 0, 0.3)';
            
            if (damagePercent > 80) {
                damageColor = '#FF0000';
                damageBackground = 'rgba(255, 0, 0, 0.2)';
            } else if (damagePercent > 60) {
                damageColor = '#FF3300';
                damageBackground = 'rgba(255, 51, 0, 0.2)';
            } else if (damagePercent > 40) {
                damageColor = '#FF6600';
                damageBackground = 'rgba(255, 102, 0, 0.2)';
            } else if (damagePercent > 20) {
                damageColor = '#FFAA00';
                damageBackground = 'rgba(255, 170, 0, 0.2)';
            }
            
            // Status indicator
            let statusIcon = '🟢';
            let statusText = 'READY';
            let statusColor = '#00FF00';
            
            if (!isAlive) {
                statusIcon = '💀';
                statusText = 'ELIMINATED';
                statusColor = '#FF0000';
            } else if (player.hitstunTimer > 0) {
                statusIcon = '💥';
                statusText = 'STUNNED';
                statusColor = '#FFAA00';
            }
            
            // Round wins display
            const roundWinsDisplay = '⭐'.repeat(player.roundWins);
            
            // Damage danger indicator
            let dangerText = '';
            if (damagePercent > 80) {
                dangerText = '<div style="color: #FF0000; font-size: 12px; font-weight: bold; animation: blink 1s infinite;">⚠️ DANGER ZONE ⚠️</div>';
            } else if (damagePercent > 60) {
                dangerText = '<div style="color: #FF6600; font-size: 12px;">⚠️ HIGH DAMAGE</div>';
            }
            
            let hudHTML = `
                <div style="color: ${colorHex}; font-weight: bold; font-size: 18px; margin-bottom: 10px;">
                    ${player.name}
                </div>
                <div style="
                    color: ${damageColor}; 
                    font-size: 36px; 
                    font-weight: bold; 
                    margin-bottom: 10px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    background: ${damageBackground};
                    padding: 5px;
                    border-radius: 8px;
                ">
                    ${damagePercent}%
                </div>
                ${dangerText}
                <div style="color: ${statusColor}; font-size: 14px; margin-bottom: 10px;">
                    ${statusIcon} ${statusText}
                </div>
                <div style="color: #FFD700; font-size: 12px; margin-bottom: 5px;">
                    Rounds: ${player.roundWins}/${this.roundWinTarget}
                </div>
                <div style="color: #FFD700; font-size: 16px;">
                    ${roundWinsDisplay}
                </div>
            `;
            
            // Update HUD opacity based on player status
            playerHUD.style.opacity = isAlive ? '1.0' : '0.6';
            
            // Update border color (pulsing for stunned players)
            if (player.hitstunTimer > 0) {
                const pulseIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
                playerHUD.style.borderColor = `rgba(255, 170, 0, ${pulseIntensity})`;
            } else {
                playerHUD.style.borderColor = colorHex;
            }
            
            // Add danger zone pulsing
            if (damagePercent > 80) {
                const pulseIntensity = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
                playerHUD.style.backgroundColor = `rgba(255, 0, 0, ${pulseIntensity * 0.3})`;
            } else {
                playerHUD.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            }
            
            playerHUD.innerHTML = hudHTML;
        });
    }
    
    // Update HUD
    updateHUD() {
        if (!this.hudElement) return;
        
        const minutes = Math.floor(this.roundTimer / 60);
        const seconds = Math.floor(this.roundTimer % 60);
        
        let hudHTML = '<div style="font-size: 18px; color: #FFD700; margin-bottom: 10px;">🥊 SUMO BATTLE</div>';
        hudHTML += `<div>Time: ${minutes}:${seconds.toString().padStart(2, '0')}</div>`;
        hudHTML += `<div>Players Alive: ${this.alivePlayers}</div>`;
        hudHTML += '<div style="margin-top: 10px; font-size: 12px;">Status:</div>';
        
        this.players.forEach(player => {
            const colorHex = `#${player.color.toString(16).padStart(6, '0')}`;
            const status = player.isAlive ? '🟢' : '💀';
            hudHTML += `<div style="color: ${colorHex}; font-size: 12px;">${status} ${player.name}</div>`;
        });
        
        this.hudElement.innerHTML = hudHTML;
    }
    
    // Update game state
    update(deltaTime) {
        if (!this.isActive) return;
        
        if (this.gameState === 'active') {
            this.roundTimer += deltaTime;
            
            // Update atmospheric particles
            this.updateAtmosphericParticles(deltaTime);
            
            // Update hazards
            this.updateHazards(deltaTime);
            
            // Update players with rigidbody physics
            this.updateRigidbodyPhysics(deltaTime);
            
            // Update damage effects
            this.updateDamageEffects(deltaTime);
            
            // Check collisions
            this.checkCollisions();
            
            // Check fall-offs
            this.checkFallOffs();
            
            // Update visual effects
            this.updateVisualEffects(deltaTime);
            
            // Update dynamic camera
            this.updateDynamicCamera(deltaTime);
            this.handleSpecialCameraScenarios();
            
            // Update HUD
            this.updateHUD();
            this.updateDamageHUD();
            this.updateMinimap();
            
            // Check win condition
            this.checkWinCondition();
            
            // Check timeout
            if (this.roundTimer >= this.maxRoundTime) {
                this.endRound('timeout');
            }
        } else if (this.gameState === 'round_ending') {
            // Handle round ending delay
            this.roundEndTimer += deltaTime;
            
            // Continue camera updates during round ending
            this.updateDynamicCamera(deltaTime);
            this.handleSpecialCameraScenarios();
            
            if (this.roundEndTimer >= this.roundRestartDelay) {
                this.startNextRound();
            }
        }
        
        // Apply camera transform with shake
        this.applyCameraTransform();
        
        // Render the scene
        if (this.scene && this.camera && this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // Update damage effects (hitstun, visual effects)
    updateDamageEffects(deltaTime) {
        this.players.forEach(player => {
            if (!player.isAlive) return;
            
            // Update hitstun timer
            if (player.hitstunTimer > 0) {
                player.hitstunTimer -= deltaTime;
                
                // Flash effect during hitstun
                const flashIntensity = Math.sin(player.hitstunTimer * 20) * 0.3 + 0.7;
                player.ball.material.opacity = flashIntensity;
            } else {
                player.ball.material.opacity = 0.9;
            }
            
            // Update ball color based on damage
            if (player.damage > 0) {
                const damageIntensity = Math.min(player.damage / 150, 1);
                const red = Math.floor(255 * damageIntensity);
                const green = Math.floor(255 * (1 - damageIntensity * 0.5));
                const blue = Math.floor(255 * (1 - damageIntensity));
                
                // Mix with original color
                const originalColor = new THREE.Color(player.originalColor);
                const damageColor = new THREE.Color().setRGB(red/255, green/255, blue/255);
                
                player.ball.material.color.lerpColors(originalColor, damageColor, damageIntensity * 0.5);
            }
        });
    }
    
    // Update all players with proper rigidbody physics
    updateRigidbodyPhysics(deltaTime) {
        this.players.forEach(player => {
            if (!player.isAlive) return;
            
            // Reset forces and ice status
            player.force.set(0, 0, 0);
            player.onIce = false;
            
            // Apply gravity
            player.force.y = -player.mass * Math.abs(this.gravity);
            
            // Get player input and apply movement forces (reduced during hitstun)
            const inputForce = new THREE.Vector3(0, 0, 0);
            const hitstunMultiplier = player.hitstunTimer > 0 ? 0.3 : 1.0;
            
            if (this.keys[player.controls.up]) inputForce.z -= player.moveForce * hitstunMultiplier;
            if (this.keys[player.controls.down]) inputForce.z += player.moveForce * hitstunMultiplier;
            if (this.keys[player.controls.left]) inputForce.x -= player.moveForce * hitstunMultiplier;
            if (this.keys[player.controls.right]) inputForce.x += player.moveForce * hitstunMultiplier;
            
            // Apply input forces
            player.force.add(inputForce);
            
            // Calculate acceleration (F = ma)
            player.acceleration.copy(player.force).divideScalar(player.mass);
            
            // Update velocity (v = v + a*t)
            player.velocity.add(player.acceleration.clone().multiplyScalar(deltaTime));
            
            // Apply air resistance
            player.velocity.multiplyScalar(this.airResistance);
            
            // Check if player is on ground
            const distanceFromCenter = Math.sqrt(
                player.ball.position.x ** 2 + player.ball.position.z ** 2
            );
            const isOnPlatform = distanceFromCenter <= this.arenaRadius && player.ball.position.y <= this.ballRadius + 0.1;
            
            // Apply ground friction if on platform
            if (isOnPlatform && player.ball.position.y <= this.ballRadius + 0.1) {
                // Only apply normal ground friction if not on ice
                if (!player.onIce) {
                    player.velocity.x *= this.groundFriction;
                    player.velocity.z *= this.groundFriction;
                }
                player.isOnGround = true;
            } else {
                player.isOnGround = false;
            }
            
            // Update position (x = x + v*t)
            player.ball.position.add(player.velocity.clone().multiplyScalar(deltaTime));
            
            // Ground collision (only if on platform)
            if (isOnPlatform && player.ball.position.y <= this.ballRadius) {
                player.ball.position.y = this.ballRadius;
                player.velocity.y = Math.max(0, player.velocity.y * -this.restitution);
            }
            
            // Update ball rotation based on movement (rolling physics)
            if (player.velocity.length() > 0.1) {
                const rollSpeed = player.velocity.length() / this.ballRadius;
                player.rollRotation.x += player.velocity.z * rollSpeed * deltaTime;
                player.rollRotation.z -= player.velocity.x * rollSpeed * deltaTime;
                
                player.ball.rotation.x = player.rollRotation.x;
                player.ball.rotation.z = player.rollRotation.z;
            }
            
            // Update label position
            if (player.label) {
                player.label.position.copy(player.ball.position);
                player.label.position.y += 3;
                
                // Update label opacity based on player status
                if (player.hitstunTimer > 0) {
                    const flashIntensity = Math.sin(player.hitstunTimer * 15) * 0.3 + 0.7;
                    player.label.material.opacity = flashIntensity;
                } else {
                    player.label.material.opacity = player.isAlive ? 1.0 : 0.5;
                }
            }
        });
    }
    
    // Check collisions between players with proper momentum transfer
    checkCollisions() {
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                const player1 = this.players[i];
                const player2 = this.players[j];
                
                if (!player1.isAlive || !player2.isAlive) continue;
                
                const distance = player1.ball.position.distanceTo(player2.ball.position);
                const minDistance = this.ballRadius * 2;
                
                if (distance < minDistance) {
                    this.handleRigidbodyCollision(player1, player2);
                }
            }
        }
    }
    
    // Handle collision between two players with damage system
    handleRigidbodyCollision(player1, player2) {
        // Calculate collision normal
        const normal = new THREE.Vector3()
            .subVectors(player2.ball.position, player1.ball.position)
            .normalize();
        
        // Separate balls to prevent overlap
        const overlap = (this.ballRadius * 2) - player1.ball.position.distanceTo(player2.ball.position);
        if (overlap > 0) {
            const separation = normal.clone().multiplyScalar(overlap * 0.5);
            player1.ball.position.sub(separation);
            player2.ball.position.add(separation);
        }
        
        // Calculate relative velocity
        const relativeVelocity = new THREE.Vector3()
            .subVectors(player2.velocity, player1.velocity);
        
        // Calculate relative velocity in collision normal direction
        const velAlongNormal = relativeVelocity.dot(normal);
        
        // Don't resolve if velocities are separating
        if (velAlongNormal > 0) return;
        
        // Check if collision is strong enough to cause damage
        const impactSpeed = Math.abs(velAlongNormal);
        if (impactSpeed > this.minCollisionSpeed) {
            // Calculate damage based on impact speed and masses
            const damageAmount = this.baseDamage + (Math.random() * this.damageVariation);
            
            // Determine who is the attacker and who is the victim based on momentum
            const player1Momentum = player1.velocity.length() * player1.mass;
            const player2Momentum = player2.velocity.length() * player2.mass;
            
            // The player with higher momentum is the attacker, the other takes damage
            if (player1Momentum > player2Momentum) {
                // Player 1 is attacking, Player 2 takes damage
                const massRatio = player1.mass / player2.mass; // Heavier attackers deal more damage
                this.applyDamage(player2, damageAmount * massRatio, player1);
            } else {
                // Player 2 is attacking, Player 1 takes damage
                const massRatio = player2.mass / player1.mass; // Heavier attackers deal more damage
                this.applyDamage(player1, damageAmount * massRatio, player2);
            }
        }
        
        // Calculate collision impulse magnitude
        const e = this.restitution;
        const j = -(1 + e) * velAlongNormal;
        const impulse = j / (1/player1.mass + 1/player2.mass);
        
        // Apply impulse to velocities
        const impulseVector = normal.clone().multiplyScalar(impulse);
        player1.velocity.sub(impulseVector.clone().divideScalar(player1.mass));
        player2.velocity.add(impulseVector.clone().divideScalar(player2.mass));
        
        // Apply knockback based on damage percentages
        this.applyKnockback(player1, normal.clone().multiplyScalar(-1), impactSpeed);
        this.applyKnockback(player2, normal, impactSpeed);
        
        // Create collision effect if significant impact
        if (impactSpeed > this.minCollisionSpeed) {
            this.createCollisionEffect(player1.ball.position.clone().lerp(player2.ball.position, 0.5));
            
            // Add camera shake based on impact
            this.cameraShake = Math.min(this.maxCameraShake, impactSpeed * 0.4);
        }
        
        // Update collision timers
        const currentTime = Date.now();
        player1.lastCollisionTime = currentTime;
        player2.lastCollisionTime = currentTime;
    }
    
    // Apply damage to a player with escalating damage system
    applyDamage(player, damage, attacker) {
        const currentTime = performance.now() / 1000; // Convert to seconds
        let finalDamage = damage;
        let hitMultiplier = 1.0;
        
        // Only apply escalating damage if there's an attacker (not environmental damage)
        if (attacker && attacker.id !== undefined) {
            // Reset consecutive hits if too much time has passed
            if (currentTime - player.lastHitTime > player.hitResetTime) {
                player.consecutiveHits.clear();
            }
            
            // Get current consecutive hit count for this attacker
            const currentHits = player.consecutiveHits.get(attacker.id) || 0;
            const newHitCount = currentHits + 1;
            
            // Calculate damage multiplier based on consecutive hits
            // 1st hit: 1.0x, 2nd hit: 1.3x, 3rd hit: 1.6x, 4th hit: 2.0x, 5th+ hit: 2.5x
            if (newHitCount >= 5) {
                hitMultiplier = 2.5;
            } else if (newHitCount >= 4) {
                hitMultiplier = 2.0;
            } else if (newHitCount >= 3) {
                hitMultiplier = 1.6;
            } else if (newHitCount >= 2) {
                hitMultiplier = 1.3;
            } else {
                hitMultiplier = 1.0;
            }
            
            // Apply damage multiplier
            finalDamage = damage * hitMultiplier;
            
            // Update consecutive hit tracking
            player.consecutiveHits.set(attacker.id, newHitCount);
            player.lastHitTime = currentTime;
            
            console.log(`💥 ${player.name} took ${finalDamage.toFixed(1)} damage (${hitMultiplier.toFixed(1)}x multiplier, hit #${newHitCount} from ${attacker.name})! Total: ${(player.damage + finalDamage).toFixed(1)}%`);
        } else {
            console.log(`💥 ${player.name} took ${finalDamage.toFixed(1)} environmental damage! Total: ${(player.damage + finalDamage).toFixed(1)}%`);
        }
        
        // Apply the final damage
        player.damage += finalDamage;
        player.damage = Math.min(player.damage, player.maxDamage);
        player.lastHitBy = attacker;
        
        // Apply hitstun
        player.hitstunTimer = this.hitstunTime;
        
        // Create enhanced damage number effect with multiplier info
        this.createDamageNumberEffect(player.ball.position.clone(), finalDamage, hitMultiplier);
    }
    
    // Apply knockback based on damage percentage
    applyKnockback(player, direction, impactSpeed) {
        // Calculate knockback force with exponential scaling for high damage
        const damageRatio = player.damage / 100; // Convert to 0-1 scale
        const exponentialMultiplier = Math.pow(damageRatio, 1.5); // Exponential curve
        const knockbackForce = this.baseKnockback + (this.maxKnockback - this.baseKnockback) * exponentialMultiplier;
        
        // Clamp to maximum
        const finalKnockback = Math.min(knockbackForce, this.maxKnockback);
        
        // Apply knockback in the collision direction
        const knockbackVector = direction.clone().normalize().multiplyScalar(finalKnockback);
        player.velocity.add(knockbackVector.divideScalar(player.mass));
        
        // Add some upward knockback for dramatic effect (more at high damage)
        const upwardKnockback = finalKnockback * (0.2 + exponentialMultiplier * 0.3);
        player.velocity.y += upwardKnockback / player.mass;
    }
    
    // Create damage number effect with multiplier support
    createDamageNumberEffect(position, damage, multiplier = 1.0) {
        // Create ultra-high-quality canvas for the damage number
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 240;
        canvas.height = 120;
        
        // Enable maximum quality text rendering
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.textBaseline = 'middle';
        context.textRenderingOptimizeLegibility = true;
        
        // Determine damage color with enhanced gradient effects and multiplier scaling
        let damageColor = '#FF0000';
        let glowColor = '#FF4444';
        let multiplierColor = '#FFFF00';
        
        // Base damage color
        if (damage >= 40) {
            damageColor = '#FF0000'; // Red for massive damage
            glowColor = '#FF4444';
        } else if (damage >= 20) {
            damageColor = '#FF6600'; // Orange for heavy damage
            glowColor = '#FF8844';
        } else if (damage >= 10) {
            damageColor = '#FFAA00'; // Yellow for moderate damage
            glowColor = '#FFCC44';
        } else {
            damageColor = '#FFFFFF'; // White for light damage
            glowColor = '#FFFFFF';
        }
        
        // Enhanced colors for multiplied damage
        if (multiplier >= 2.5) {
            damageColor = '#FF0066'; // Hot pink for max multiplier
            glowColor = '#FF4488';
            multiplierColor = '#FF00FF';
        } else if (multiplier >= 2.0) {
            damageColor = '#FF0033'; // Bright red for high multiplier
            glowColor = '#FF4466';
            multiplierColor = '#FF6600';
        } else if (multiplier >= 1.5) {
            damageColor = '#FF3300'; // Orange-red for medium multiplier
            glowColor = '#FF6644';
            multiplierColor = '#FFAA00';
        }
        
        // Enhanced font with better stack
        context.font = 'bold 42px "Segoe UI", "Helvetica Neue", Arial, sans-serif';
        context.textAlign = 'center';
        
        // Prepare damage text with multiplier
        const damageText = `${damage.toFixed(0)}%`;
        const multiplierText = multiplier > 1.0 ? `x${multiplier.toFixed(1)}` : '';
        
        // Triple-layer outline for ultra-clarity
        context.strokeStyle = 'rgba(0, 0, 0, 1.0)';
        context.lineWidth = 8;
        context.strokeText(damageText, 120, multiplierText ? 50 : 60);
        
        context.strokeStyle = 'rgba(64, 64, 64, 0.9)';
        context.lineWidth = 4;
        context.strokeText(damageText, 120, multiplierText ? 50 : 60);
        
        context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        context.lineWidth = 2;
        context.strokeText(damageText, 120, multiplierText ? 50 : 60);
        
        // Add glow effect
        context.shadowColor = glowColor;
        context.shadowBlur = 20;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        
        // Main damage text with gradient
        const gradient = context.createLinearGradient(0, 40, 0, 80);
        gradient.addColorStop(0, damageColor);
        gradient.addColorStop(1, glowColor);
        context.fillStyle = gradient;
        context.fillText(damageText, 120, multiplierText ? 50 : 60);
        
        // Add multiplier text if applicable
        if (multiplierText) {
            context.font = 'bold 24px "Segoe UI", "Helvetica Neue", Arial, sans-serif';
            
            // Multiplier outline
            context.strokeStyle = 'rgba(0, 0, 0, 1.0)';
            context.lineWidth = 4;
            context.strokeText(multiplierText, 120, 80);
            
            context.strokeStyle = 'rgba(64, 64, 64, 0.9)';
            context.lineWidth = 2;
            context.strokeText(multiplierText, 120, 80);
            
            // Multiplier fill with glow
            context.shadowColor = multiplierColor;
            context.shadowBlur = 12;
            context.fillStyle = multiplierColor;
            context.fillText(multiplierText, 120, 80);
        }
        
        // Create sprite with ultra-high-quality texture settings
        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.flipY = false;
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(3, 1.5, 1);
        sprite.position.copy(position);
        sprite.position.y += 1;
        this.scene.add(sprite);
        
        // Add to particles for animation
        this.particles.push({
            mesh: sprite,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                8,
                (Math.random() - 0.5) * 5
            ),
            life: 1.5,
            maxLife: 1.5
        });
    }
    
    // Create collision effect
    createCollisionEffect(position) {
        const effectGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const effectMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.8
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(position);
        this.scene.add(effect);
        
        // Create multiple spark particles
        for (let i = 0; i < 8; i++) {
            const sparkGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const sparkMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFFAA00,
                transparent: true,
                opacity: 0.9
            });
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.copy(position);
            spark.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ));
            this.scene.add(spark);
            
            // Add spark to particles
            this.particles.push({
                mesh: spark,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 15,
                    Math.random() * 10,
                    (Math.random() - 0.5) * 15
                ),
                life: 0.8,
                maxLife: 0.8
            });
        }
        
        // Add main effect to particles
        this.particles.push({
            mesh: effect,
            life: 0.3,
            maxLife: 0.3
        });
    }
    
    // Update visual effects
    updateVisualEffects(deltaTime) {
        // Update particles
        this.particles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            // Move particles if they have velocity
            if (particle.velocity) {
                particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
                particle.velocity.y -= 20 * deltaTime; // Gravity on particles
            }
            
            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                this.particles.splice(index, 1);
            } else {
                // Fade out
                particle.mesh.material.opacity = particle.life / particle.maxLife;
                // Scale up
                const scale = 1 + (1 - particle.life / particle.maxLife) * 2;
                particle.mesh.scale.setScalar(scale);
            }
        });
    }
    
    // Check if players fell off (NO WALLS - only elimination method)
    checkFallOffs() {
        this.players.forEach(player => {
            if (player.isAlive && player.ball.position.y < this.fallThreshold) {
                this.eliminatePlayer(player);
            }
        });
    }
    
    // Eliminate a player with animation
    eliminatePlayer(player) {
        player.isAlive = false;
        this.alivePlayers--;
        
        // Log elimination with damage info
        console.log(`💀 ${player.name} eliminated with ${player.damage.toFixed(1)}% damage!`);
        if (player.lastHitBy) {
            console.log(`🎯 Last hit by: ${player.lastHitBy.name}`);
        }
        
        // Create dramatic elimination effect
        this.createEliminationEffect(player.ball.position.clone());
        
        // Show elimination message
        this.showEliminationMessage(player);
        
        // Hide player model and label
        player.ball.visible = false;
        if (player.label) {
            player.label.visible = false;
        }
        
        // Add camera shake for dramatic effect
        this.cameraShake = Math.min(this.maxCameraShake, 1.2);
    }
    
    // Show elimination message
    showEliminationMessage(player) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: #FF0000;
            padding: 20px 40px;
            border-radius: 15px;
            font-family: 'Courier New', monospace;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            border: 3px solid #FF0000;
            z-index: 1005;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        `;
        
        const colorHex = `#${player.color.toString(16).padStart(6, '0')}`;
        messageDiv.innerHTML = `
            <div style="color: ${colorHex}; margin-bottom: 10px;">${player.name}</div>
            <div style="color: #FF0000;">ELIMINATED!</div>
            <div style="font-size: 18px; color: #FFFFFF; margin-top: 10px;">
                ${player.damage.toFixed(0)}% damage
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remove message after 2 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                document.body.removeChild(messageDiv);
            }
        }, 2000);
    }
    
    // Create elimination effect
    createEliminationEffect(position) {
        // Large red explosion effect
        const effectGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const effectMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF0000,
            transparent: true,
            opacity: 0.8
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(position);
        this.scene.add(effect);
        
        // Create multiple explosion particles
        for (let i = 0; i < 15; i++) {
            const sparkGeometry = new THREE.SphereGeometry(0.2, 6, 6);
            const sparkMaterial = new THREE.MeshBasicMaterial({ 
                color: Math.random() > 0.5 ? 0xFF0000 : 0xFF6600,
                transparent: true,
                opacity: 0.9
            });
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.copy(position);
            this.scene.add(spark);
            
            // Add spark to particles with random velocities
            this.particles.push({
                mesh: spark,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 25,
                    Math.random() * 15 + 5,
                    (Math.random() - 0.5) * 25
                ),
                life: 1.5,
                maxLife: 1.5
            });
        }
        
        // Add main effect to particles
        this.particles.push({
            mesh: effect,
            life: 1.0,
            maxLife: 1.0
        });
    }
    
    // Check win condition
    checkWinCondition() {
        if (this.alivePlayers <= 1 && !this.isRoundEnding) {
            const winner = this.players.find(p => p.isAlive);
            this.endRound('elimination', winner);
        }
    }
    
    // End current round
    endRound(reason, winner = null) {
        this.isRoundEnding = true;
        this.gameState = 'round_ending';
        this.roundEndTimer = 0;
        this.roundWinner = winner;
        
        console.log(`🏁 Round ${this.currentRound} ended: ${reason}`);
        
        // Award round win to winner
        if (winner) {
            winner.roundWins++;
            console.log(`🎯 ${winner.name} wins round ${this.currentRound}! Total wins: ${winner.roundWins}`);
        }
        
        // Check if someone won the match
        if (winner && winner.roundWins >= this.roundWinTarget) {
            this.endMatch(winner);
        } else {
            this.showRoundResults(reason, winner);
        }
    }
    
    // Show round results
    showRoundResults(reason, winner) {
        const theme = this.arenaThemes[this.currentArenaTheme];
        const resultsDiv = document.createElement('div');
        resultsDiv.id = 'round-results';
        resultsDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 40px;
            border-radius: 20px;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            text-align: center;
            border: 3px solid #FFD700;
            z-index: 1000;
        `;
        
        let resultHTML = `<h2 style="color: #FFD700;">🏁 ROUND ${this.currentRound} RESULTS</h2>`;
        resultHTML += `<div style="font-size: 16px; color: #${theme.colors.edge.toString(16).padStart(6, '0')}; margin-bottom: 20px;">${theme.name}</div>`;
        
        if (reason === 'elimination' && winner) {
            const colorHex = `#${winner.color.toString(16).padStart(6, '0')}`;
            resultHTML += `
                <div style="font-size: 32px; color: ${colorHex}; margin: 20px 0;">
                    🏆 ${winner.name} WINS! 🏆
                </div>
                <div style="font-size: 16px; color: #ccc; margin-bottom: 20px;">
                    Round Wins: ${winner.roundWins}/${this.roundWinTarget}
                </div>
            `;
        } else if (reason === 'timeout') {
            resultHTML += '<div style="font-size: 32px; color: #FF6B6B; margin: 20px 0;">⏰ TIME OUT!</div>';
        }
        
        // Show current standings
        resultHTML += '<div style="margin: 20px 0; font-size: 18px;">Current Standings:</div>';
        
        const sortedPlayers = [...this.players].sort((a, b) => b.roundWins - a.roundWins);
        sortedPlayers.forEach((player, index) => {
            const colorHex = `#${player.color.toString(16).padStart(6, '0')}`;
            resultHTML += `
                <div style="margin: 10px 0; color: ${colorHex}; font-size: 16px;">
                    ${index + 1}. ${player.name} - ${player.roundWins} wins
                </div>
            `;
        });
        
        resultHTML += '<div style="margin-top: 30px; font-size: 16px;">Next arena loading in 3 seconds...</div>';
        
        resultsDiv.innerHTML = resultHTML;
        document.body.appendChild(resultsDiv);
        
        // Remove results after 3 seconds
        setTimeout(() => {
            if (resultsDiv.parentNode) {
                document.body.removeChild(resultsDiv);
            }
        }, 3000);
    }
    
    // Start next round
    startNextRound() {
        this.currentRound++;
        this.isRoundEnding = false;
        this.gameState = 'countdown';
        this.roundTimer = 0;
        
        // Select new arena theme
        this.selectArenaTheme();
        
        // Recreate arena with new theme
        this.createArena();
        
        // Reset all players for new round
        this.resetPlayersForNewRound();
        
        console.log(`🔄 Starting Round ${this.currentRound}`);
        
        // Update round HUD
        this.updateRoundHUD();
        
        // Show arena introduction then countdown
        this.showArenaIntroduction();
        setTimeout(() => {
            this.showCountdown();
        }, 2500);
    }
    
    // Reset players for new round
    resetPlayersForNewRound() {
        this.alivePlayers = this.activePlayerCount;
        
        // Reset camera for new round
        this.cameraUpdateTimer = 0;
        const config = this.cameraConfig.zoomLevels[this.activePlayerCount] || this.cameraConfig.zoomLevels[4];
        this.cameraPosition.set(0, config.height, config.distance);
        this.cameraTarget.set(0, this.cameraConfig.heightOffset, 0);
        this.camera.fov = config.fov;
        this.camera.updateProjectionMatrix();
        
        this.players.forEach(player => {
            // Reset physics state
            player.isAlive = true;
            player.damage = 0;
            player.hitstunTimer = 0;
            player.lastHitBy = null;
            player.velocity.set(0, 0, 0);
            player.acceleration.set(0, 0, 0);
            player.force.set(0, 0, 0);
            
            // Reset escalating damage system
            player.consecutiveHits.clear();
            player.lastHitTime = 0;
            
            // Reset ball rotation
            player.rollRotation.set(0, 0, 0);
            player.ball.rotation.set(0, 0, 0);
            
            // Reset position
            player.ball.position.copy(player.spawnPosition);
            player.ball.visible = true;
            player.ball.material.opacity = 0.9;
            player.ball.material.color.setHex(player.originalColor);
            
            // Reset label
            if (player.label) {
                player.label.visible = true;
                player.label.material.opacity = 1.0;
                player.label.position.copy(player.ball.position);
                player.label.position.y += 3;
            }
        });
    }
    
    // End match (someone won the tournament)
    endMatch(winner) {
        this.isActive = false;
        this.gameState = 'match_ended';
        this.matchWinner = winner;
        
        console.log(`🏆 Match ended - ${winner.name} wins the tournament!`);
        
        // Show match results
        this.showMatchResults(winner);
    }
    
    // Show match results
    showMatchResults(winner) {
        const resultsDiv = document.createElement('div');
        resultsDiv.id = 'match-results';
        resultsDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 40px;
            border-radius: 20px;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            text-align: center;
            border: 3px solid #FFD700;
            z-index: 1000;
        `;
        
        const colorHex = `#${winner.color.toString(16).padStart(6, '0')}`;
        let resultHTML = '<h2 style="color: #FFD700;">🏆 TOURNAMENT CHAMPION! 🏆</h2>';
        
        resultHTML += `
            <div style="font-size: 48px; color: ${colorHex}; margin: 30px 0;">
                ${winner.name} WINS!
            </div>
            <div style="font-size: 20px; color: #FFD700; margin-bottom: 30px;">
                Champion across ${this.arenaThemes.length} themed arenas!
            </div>
        `;
        
        // Show final standings
        resultHTML += '<div style="margin: 20px 0; font-size: 18px;">Final Tournament Standings:</div>';
        
        const sortedPlayers = [...this.players].sort((a, b) => b.roundWins - a.roundWins);
        sortedPlayers.forEach((player, index) => {
            const playerColorHex = `#${player.color.toString(16).padStart(6, '0')}`;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            resultHTML += `
                <div style="margin: 10px 0; color: ${playerColorHex}; font-size: 16px;">
                    ${medal} ${index + 1}. ${player.name} - ${player.roundWins} wins
                </div>
            `;
        });
        
        resultHTML += '<div style="margin-top: 30px; font-size: 16px;">Press SPACE to return to menu</div>';
        
        resultsDiv.innerHTML = resultHTML;
        document.body.appendChild(resultsDiv);
        
        // Handle return to menu
        const returnHandler = (event) => {
            if (event.code === 'Space') {
                document.removeEventListener('keydown', returnHandler);
                document.body.removeChild(resultsDiv);
                this.cleanup();
                // Return to main menu
                window.location.reload();
            }
        };
        
        document.addEventListener('keydown', returnHandler);
    }
    
    // Cleanup
    cleanup() {
        // Stop animation loop
        this.stopAnimationLoop();
        
        this.isActive = false;
        
        // Remove fog
        if (this.scene) {
            this.scene.fog = null;
        }
        
        // Remove HUD elements
        if (this.hudElement) {
            document.body.removeChild(this.hudElement);
            this.hudElement = null;
        }
        
        if (this.playerHUDs) {
            this.playerHUDs.forEach(hud => {
                if (hud.parentNode) {
                    document.body.removeChild(hud);
                }
            });
            this.playerHUDs = null;
        }
        
        if (this.roundHUD) {
            document.body.removeChild(this.roundHUD);
            this.roundHUD = null;
        }
        
        if (this.minimap) {
            document.body.removeChild(this.minimap);
            this.minimap = null;
            this.minimapCanvas = null;
        }
        
        // Clear arena objects
        this.clearArenaObjects();
        
        // Clear hazards
        this.clearHazards();
        
        // Remove all battle objects
        const battleObjects = this.scene.children.filter(child => 
            child.name?.includes('player_') ||
            child.name?.includes('_ball')
        );
        battleObjects.forEach(obj => this.scene.remove(obj));
        
        // Clear particles
        this.particles.forEach(particle => {
            this.scene.remove(particle.mesh);
        });
        this.particles = [];
        
        // Clear players
        this.players = [];
        
        console.log('🧹 Local multiplayer battle tournament with themed arenas cleaned up');
    }
    
    // Create arena hazards based on theme
    createArenaHazards(theme) {
        this.clearHazards();
        
        console.log(`🏗️ Creating hazards for ${theme.name}:`, theme.hazards.length);
        
        theme.hazards.forEach((hazardData, index) => {
            console.log(`   Creating hazard ${index + 1}/${theme.hazards.length}: ${hazardData.type} at (${hazardData.position.x}, ${hazardData.position.z})`);
            const hazard = this.createHazard(hazardData, theme);
            if (hazard) {
                this.hazards.push(hazard);
                console.log(`   ✅ Successfully created ${hazardData.type} hazard`);
            } else {
                console.warn(`   ❌ Failed to create ${hazardData.type} hazard`);
            }
        });
        
        console.log(`⚠️ Created ${this.hazards.length} hazards for ${theme.name}`);
        this.hazards.forEach(hazard => {
            console.log(`   - ${hazard.type} at (${hazard.position.x}, ${hazard.position.z}) radius/size: ${hazard.radius || hazard.size}`);
        });
    }
    
    // Create individual hazard
    createHazard(hazardData, theme) {
        const hazard = {
            type: hazardData.type,
            position: new THREE.Vector3(hazardData.position.x, 0, hazardData.position.z),
            ...hazardData,
            isActive: true,
            timer: 0,
            lastActivation: 0,
            affectedPlayers: new Set(),
            mesh: null,
            effectMesh: null
        };
        
        // Create visual representation based on type
        switch (hazardData.type) {
            case 'ice':
                hazard.mesh = this.createIceTile(hazard, theme);
                break;
            case 'lava_burst':
                hazard.mesh = this.createLavaBurstMarker(hazard, theme);
                break;
            case 'lava_geyser':
                hazard.mesh = this.createLavaGeyser(hazard, theme);
                break;
            case 'magma_burst':
                hazard.mesh = this.createMagmaBurst(hazard, theme);
                break;
            case 'lava_pool':
                hazard.mesh = this.createLavaPool(hazard, theme);
                break;
            case 'ramp':
                hazard.mesh = this.createRamp(hazard, theme);
                break;
            case 'sinkhole':
                hazard.mesh = this.createSinkhole(hazard, theme);
                break;
            case 'bounce':
                hazard.mesh = this.createBounceZone(hazard, theme);
                break;
            case 'spikes':
                hazard.mesh = this.createSpikes(hazard, theme);
                break;
            case 'teleporter':
                hazard.mesh = this.createTeleporter(hazard, theme);
                break;
            case 'wind_gust':
                hazard.mesh = this.createWindGust(hazard, theme);
                break;
            case 'sky_lightning':
                hazard.mesh = this.createSkyLightning(hazard, theme);
                break;
            case 'cloud_platform':
                hazard.mesh = this.createCloudPlatform(hazard, theme);
                break;
            case 'quicksand':
                hazard.mesh = this.createQuicksand(hazard, theme);
                break;
            case 'sandstorm':
                hazard.mesh = this.createSandstorm(hazard, theme);
                break;
            case 'obelisk_blast':
                hazard.mesh = this.createObeliskBlast(hazard, theme);
                break;
            case 'mirage_teleporter':
                hazard.mesh = this.createMirageTeleporter(hazard, theme);
                break;
            case 'launch_pad':
                hazard.mesh = this.createLaunchPad(hazard, theme);
                break;
            case 'wind_current':
                hazard.mesh = this.createWindCurrent(hazard, theme);
                break;
        }
        
        return hazard;
    }
    
    // Create ice tile hazard
    createIceTile(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius, 0.1, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.7
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.05;
        mesh.name = 'ice_tile';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add ice crystal decorations
        for (let i = 0; i < 6; i++) {
            const crystalGeometry = new THREE.ConeGeometry(0.1, 0.3, 6);
            const crystalMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xE6E6FA,
                transparent: true,
                opacity: 0.8
            });
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            const angle = (i / 6) * Math.PI * 2;
            crystal.position.set(
                hazard.position.x + Math.cos(angle) * hazard.radius * 0.7,
                0.2,
                hazard.position.z + Math.sin(angle) * hazard.radius * 0.7
            );
            crystal.name = 'ice_crystal';
            this.scene.add(crystal);
            this.arenaObjects.push(crystal);
        }
        
        return mesh;
    }
    
    // Create lava burst marker
    createLavaBurstMarker(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius, 0.2, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x8B0000,
            emissive: 0x330000,
            emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.1;
        mesh.name = 'lava_marker';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add warning ring
        const ringGeometry = new THREE.TorusGeometry(hazard.radius * 1.2, 0.1, 8, 16);
        const ringMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF4500,
            emissive: 0xFF4500,
            emissiveIntensity: 0.5
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(hazard.position);
        ring.position.y = 0.15;
        ring.rotation.x = Math.PI / 2;
        ring.name = 'lava_warning';
        this.scene.add(ring);
        this.arenaObjects.push(ring);
        
        return mesh;
    }
    
    // Create lava geyser hazard
    createLavaGeyser(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius * 0.8, 1.5, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xFF4500,
            emissive: 0xFF2200,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.75;
        mesh.name = 'lava_geyser';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add geyser spout effect
        const spoutGeometry = new THREE.CylinderGeometry(0.3, 0.8, 3, 8);
        const spoutMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF6600,
            emissive: 0xFF4400,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7
        });
        const spout = new THREE.Mesh(spoutGeometry, spoutMaterial);
        spout.position.copy(hazard.position);
        spout.position.y = 2.5;
        spout.name = 'geyser_spout';
        this.scene.add(spout);
        this.arenaObjects.push(spout);
        
        return mesh;
    }
    
    // Create magma burst hazard
    createMagmaBurst(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius * 0.6, 0.8, 12);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xCC2200,
            emissive: 0xAA1100,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.4;
        mesh.name = 'magma_burst';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add magma bubbles
        for (let i = 0; i < 8; i++) {
            const bubbleGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const bubbleMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFF3300,
                emissive: 0xDD2200,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            });
            const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
            const angle = (i / 8) * Math.PI * 2;
            bubble.position.set(
                hazard.position.x + Math.cos(angle) * hazard.radius * 0.7,
                0.2,
                hazard.position.z + Math.sin(angle) * hazard.radius * 0.7
            );
            bubble.name = 'magma_bubble';
            this.scene.add(bubble);
            this.arenaObjects.push(bubble);
        }
        
        return mesh;
    }
    
    // Create lava pool hazard
    createLavaPool(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius, 0.2, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xDD3300,
            emissive: 0xBB2200,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.1;
        mesh.name = 'lava_pool';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add bubbling effect
        for (let i = 0; i < 6; i++) {
            const bubbleGeometry = new THREE.SphereGeometry(0.1, 6, 6);
            const bubbleMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFF4400,
                emissive: 0xDD3300,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.8
            });
            const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
            const angle = (i / 6) * Math.PI * 2;
            bubble.position.set(
                hazard.position.x + Math.cos(angle) * hazard.radius * 0.5,
                0.15,
                hazard.position.z + Math.sin(angle) * hazard.radius * 0.5
            );
            bubble.name = 'lava_bubble';
            this.scene.add(bubble);
            this.arenaObjects.push(bubble);
        }
        
        return mesh;
    }
    
    // Create ramp hazard
    createRamp(hazard, theme) {
        // Enhanced ancient ramp design
        const geometry = new THREE.BoxGeometry(3.5, 1, 2);
        const color = hazard.ancient ? 0x8B4513 : theme.colors.markers;
        const material = new THREE.MeshLambertMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.5;
        mesh.rotation.x = (hazard.angle * Math.PI) / 180;
        mesh.name = 'ramp';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add enhanced arrow indicators
        const arrowGeometry = new THREE.ConeGeometry(0.4, 1.2, 6);
        const arrowColor = hazard.ancient ? 0xFFD700 : 0xFFD700;
        const arrowMaterial = new THREE.MeshLambertMaterial({ 
            color: arrowColor,
            emissive: arrowColor,
            emissiveIntensity: 0.3
        });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.copy(hazard.position);
        arrow.position.y = 1.5;
        arrow.rotation.x = -Math.PI / 2;
        arrow.name = 'ramp_arrow';
        this.scene.add(arrow);
        this.arenaObjects.push(arrow);
        
        // Add ancient stone details
        if (hazard.ancient) {
            // Add stone blocks
            for (let i = 0; i < 3; i++) {
                const blockGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
                const blockMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x654321,
                    transparent: true,
                    opacity: 0.8
                });
                const block = new THREE.Mesh(blockGeometry, blockMaterial);
                block.position.copy(hazard.position);
                block.position.x += (i - 1) * 1.2;
                block.position.y = 0.15;
                block.name = 'ancient_block';
                this.scene.add(block);
                this.arenaObjects.push(block);
            }
            
            // Add hieroglyphic markings
            const symbolGeometry = new THREE.BoxGeometry(2, 0.1, 0.8);
            const symbolMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFD700,
                emissive: 0xFFD700,
                emissiveIntensity: 0.4
            });
            const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
            symbol.position.copy(hazard.position);
            symbol.position.y = 0.6;
            symbol.rotation.x = (hazard.angle * Math.PI) / 180;
            symbol.name = 'ramp_hieroglyph';
            this.scene.add(symbol);
            this.arenaObjects.push(symbol);
        }
        
        return mesh;
    }
    
    // Create sinkhole hazard
    createSinkhole(hazard, theme) {
        // Enhanced desert sinkhole with sand effects
        const color = hazard.sandstorm ? 0xF4A460 : 0x2F2F2F;
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius * 0.3, 0.5, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = -0.25;
        mesh.name = 'sinkhole';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add enhanced swirling effect ring
        const ringColor = hazard.sandstorm ? 0xDEB887 : 0x4F4F4F;
        const ringGeometry = new THREE.TorusGeometry(hazard.radius * 0.8, 0.08, 8, 16);
        const ringMaterial = new THREE.MeshLambertMaterial({ 
            color: ringColor,
            emissive: ringColor,
            emissiveIntensity: hazard.sandstorm ? 0.3 : 0.5
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(hazard.position);
        ring.position.y = 0.05;
        ring.rotation.x = Math.PI / 2;
        ring.name = 'sinkhole_ring';
        this.scene.add(ring);
        this.arenaObjects.push(ring);
        
        // Add sand particles for desert theme
        if (hazard.sandstorm) {
            for (let i = 0; i < 15; i++) {
                const sandGeometry = new THREE.SphereGeometry(0.06, 8, 8);
                const sandMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0xF5DEB3,
                    transparent: true,
                    opacity: 0.7
                });
                const sand = new THREE.Mesh(sandGeometry, sandMaterial);
                const angle = (i / 15) * Math.PI * 2;
                const radius = Math.random() * hazard.radius * 0.9;
                sand.position.set(
                    hazard.position.x + Math.cos(angle) * radius,
                    0.2,
                    hazard.position.z + Math.sin(angle) * radius
                );
                sand.name = 'sand_particle_sinkhole';
                this.scene.add(sand);
                this.arenaObjects.push(sand);
            }
        }
        
        return mesh;
    }
    
    // Create bounce zone hazard
    createBounceZone(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius, 0.3, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x00FF00,
            transparent: true,
            opacity: 0.6
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.15;
        mesh.name = 'bounce_zone';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add bounce indicators
        for (let i = 0; i < 4; i++) {
            const indicatorGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const indicatorMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x00FF00,
                emissive: 0x003300,
                emissiveIntensity: 0.3
            });
            const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            const angle = (i / 4) * Math.PI * 2;
            indicator.position.set(
                hazard.position.x + Math.cos(angle) * hazard.radius * 0.8,
                0.5,
                hazard.position.z + Math.sin(angle) * hazard.radius * 0.8
            );
            indicator.name = 'bounce_indicator';
            this.scene.add(indicator);
            this.arenaObjects.push(indicator);
        }
        
        return mesh;
    }
    
    // Create spikes hazard
    createSpikes(hazard, theme) {
        const group = new THREE.Group();
        group.position.copy(hazard.position);
        group.name = 'spikes_group';
        
        // Create multiple spikes with ancient design
        const spikeCount = hazard.ancient ? 7 : 5;
        const spikeColor = hazard.ancient ? 0x8B4513 : 0x666666;
        
        for (let i = 0; i < spikeCount; i++) {
            const spikeGeometry = new THREE.ConeGeometry(0.35, 2.5, 8);
            const spikeMaterial = new THREE.MeshLambertMaterial({ 
                color: spikeColor,
                transparent: true,
                opacity: 0.9
            });
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            
            const angle = (i / spikeCount) * Math.PI * 2;
            const radius = hazard.size * 0.5;
            spike.position.set(
                Math.cos(angle) * radius,
                1.25,
                Math.sin(angle) * radius
            );
            spike.name = 'spike';
            group.add(spike);
        }
        
        // Add enhanced warning base
        const baseColor = hazard.ancient ? 0x8B4513 : 0x8B0000;
        const baseGeometry = new THREE.CylinderGeometry(hazard.size, hazard.size, 0.2, 16);
        const baseMaterial = new THREE.MeshLambertMaterial({ 
            color: baseColor,
            emissive: baseColor,
            emissiveIntensity: 0.3
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.1;
        base.name = 'spike_base';
        group.add(base);
        
        // Add ancient details
        if (hazard.ancient) {
            // Add stone pillars around the spikes
            for (let i = 0; i < 4; i++) {
                const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
                const pillarMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x654321,
                    transparent: true,
                    opacity: 0.8
                });
                const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
                
                const angle = (i / 4) * Math.PI * 2;
                const radius = hazard.size * 0.8;
                pillar.position.set(
                    Math.cos(angle) * radius,
                    1.5,
                    Math.sin(angle) * radius
                );
                pillar.name = 'ancient_pillar';
                group.add(pillar);
            }
            
            // Add glowing hieroglyphs on the base
            const symbolGeometry = new THREE.CylinderGeometry(hazard.size * 0.9, hazard.size * 0.9, 0.05, 16);
            const symbolMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFD700,
                emissive: 0xFFD700,
                emissiveIntensity: 0.5
            });
            const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
            symbol.position.y = 0.25;
            symbol.name = 'spike_hieroglyph';
            group.add(symbol);
        }
        
        this.scene.add(group);
        this.arenaObjects.push(group);
        
        return group;
    }
    
    // Create teleporter hazard
    createTeleporter(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius, 0.5, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x9400D3,
            transparent: true,
            opacity: 0.7,
            emissive: 0x4B0082,
            emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.25;
        mesh.name = 'teleporter';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add swirling energy effect
        const energyGeometry = new THREE.TorusGeometry(hazard.radius * 0.8, 0.1, 8, 16);
        const energyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF00FF,
            emissive: 0xFF00FF,
            emissiveIntensity: 0.5
        });
        const energy = new THREE.Mesh(energyGeometry, energyMaterial);
        energy.position.copy(hazard.position);
        energy.position.y = 0.6;
        energy.rotation.x = Math.PI / 2;
        energy.name = 'teleporter_energy';
        this.scene.add(energy);
        this.arenaObjects.push(energy);
        
        // Add destination marker
        const destGeometry = new THREE.CylinderGeometry(hazard.radius * 0.5, hazard.radius * 0.5, 0.1, 16);
        const destMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF00FF,
            transparent: true,
            opacity: 0.5,
            emissive: 0x4B0082,
            emissiveIntensity: 0.2
        });
        const destMesh = new THREE.Mesh(destGeometry, destMaterial);
        destMesh.position.set(hazard.destination.x, 0.05, hazard.destination.z);
        destMesh.name = 'teleporter_destination';
        this.scene.add(destMesh);
        this.arenaObjects.push(destMesh);
        
        return mesh;
    }
    
    // Create wind gust hazard
    createWindGust(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius * 0.8, 0.5, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xF0F8FF,
            transparent: true,
            opacity: 0.6,
            emissive: 0x87CEEB,
            emissiveIntensity: 0.2
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.25;
        mesh.name = 'wind_gust';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add wind effect particles
        for (let i = 0; i < 8; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.7
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            const angle = (i / 8) * Math.PI * 2;
            particle.position.set(
                hazard.position.x + Math.cos(angle) * hazard.radius * 0.8,
                0.5,
                hazard.position.z + Math.sin(angle) * hazard.radius * 0.8
            );
            particle.name = 'wind_particle';
            this.scene.add(particle);
            this.arenaObjects.push(particle);
        }
        
        return mesh;
    }
    
    // Create sky lightning hazard
    createSkyLightning(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius * 0.5, 0.2, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8,
            emissive: 0x87CEEB,
            emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.1;
        mesh.name = 'sky_lightning';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add lightning rod indicator
        const rodGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
        const rodMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xC0C0C0,
            emissive: 0x404040,
            emissiveIntensity: 0.2
        });
        const rod = new THREE.Mesh(rodGeometry, rodMaterial);
        rod.position.copy(hazard.position);
        rod.position.y = 1.5;
        rod.name = 'lightning_rod';
        this.scene.add(rod);
        this.arenaObjects.push(rod);
        
        return mesh;
    }
    
    // Create cloud platform hazard
    createCloudPlatform(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius, 0.3, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9,
            emissive: 0xF0F8FF,
            emissiveIntensity: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = hazard.height;
        mesh.name = 'cloud_platform';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add cloud puff effects
        for (let i = 0; i < 5; i++) {
            const puffGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const puffMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.6
            });
            const puff = new THREE.Mesh(puffGeometry, puffMaterial);
            const angle = (i / 5) * Math.PI * 2;
            puff.position.set(
                hazard.position.x + Math.cos(angle) * hazard.radius * 0.9,
                hazard.height + 0.2,
                hazard.position.z + Math.sin(angle) * hazard.radius * 0.9
            );
            puff.name = 'cloud_puff';
            this.scene.add(puff);
            this.arenaObjects.push(puff);
        }
        
        return mesh;
    }
    
    // Create quicksand hazard
    createQuicksand(hazard, theme) {
        try {
            const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius * 0.8, 0.3, 16);
            const material = new THREE.MeshLambertMaterial({ 
                color: 0xF4A460,
                transparent: true,
                opacity: 0.8
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(hazard.position);
            mesh.position.y = 0.15;
            mesh.name = 'quicksand';
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.arenaObjects.push(mesh);
            
            // Add bubbling sand particles
            for (let i = 0; i < 12; i++) {
                const bubbleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
                const bubbleMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0xDEB887,
                    transparent: true,
                    opacity: 0.6
                });
                const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
                const angle = (i / 12) * Math.PI * 2;
                const radius = Math.random() * hazard.radius * 0.8;
                bubble.position.set(
                    hazard.position.x + Math.cos(angle) * radius,
                    0.2,
                    hazard.position.z + Math.sin(angle) * radius
                );
                bubble.name = 'sand_bubble';
                bubble.castShadow = true;
                bubble.receiveShadow = true;
                this.scene.add(bubble);
                this.arenaObjects.push(bubble);
            }
            
            console.log(`🏖️ Quicksand hazard created at (${hazard.position.x}, ${hazard.position.z}) with radius ${hazard.radius}`);
            return mesh;
        } catch (error) {
            console.error('Failed to create quicksand hazard:', error);
            return null;
        }
    }
    
    // Create sandstorm hazard
    createSandstorm(hazard, theme) {
        // Create tornado-like vortex shape (cone that gets wider at the top)
        const geometry = new THREE.ConeGeometry(hazard.radius * 0.3, 6, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xCD853F,
            transparent: true,
            opacity: 0.5,
            emissive: 0x8B4513,
            emissiveIntensity: 0.2
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 3; // Raise the vortex higher
        mesh.name = 'sandstorm';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add base swirl effect
        const baseGeometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius * 0.6, 0.3, 16);
        const baseMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xF4A460,
            transparent: true,
            opacity: 0.6,
            emissive: 0xCD853F,
            emissiveIntensity: 0.3
        });
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.copy(hazard.position);
        baseMesh.position.y = 0.15;
        baseMesh.name = 'sandstorm_base';
        this.scene.add(baseMesh);
        this.arenaObjects.push(baseMesh);
        
        // Add enhanced swirling sand particles in a spiral pattern
        for (let i = 0; i < 30; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 6, 6);
            const particleMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xF5DEB3,
                transparent: true,
                opacity: 0.8,
                emissive: 0xFFD700,
                emissiveIntensity: 0.1
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            const angle = (i / 30) * Math.PI * 2;
            const radius = Math.random() * hazard.radius * 0.8;
            const height = Math.random() * 5 + 0.5; // Particles go higher
            particle.position.set(
                hazard.position.x + Math.cos(angle) * radius,
                height,
                hazard.position.z + Math.sin(angle) * radius
            );
            particle.name = 'sand_particle';
            this.scene.add(particle);
            this.arenaObjects.push(particle);
        }
        
        // Add warning arrows pointing up
        for (let i = 0; i < 4; i++) {
            const arrowGeometry = new THREE.ConeGeometry(0.3, 1, 6);
            const arrowMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFD700,
                emissive: 0xFFD700,
                emissiveIntensity: 0.6
            });
            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
            const angle = (i / 4) * Math.PI * 2;
            arrow.position.set(
                hazard.position.x + Math.cos(angle) * (hazard.radius * 0.8),
                1.5,
                hazard.position.z + Math.sin(angle) * (hazard.radius * 0.8)
            );
            arrow.rotation.x = -Math.PI / 2; // Point upward
            arrow.name = 'vortex_arrow';
            this.scene.add(arrow);
            this.arenaObjects.push(arrow);
        }
        
        return mesh;
    }
    
    // Create obelisk blast hazard
    createObeliskBlast(hazard, theme) {
        // Create tall obelisk
        const obeliskGeometry = new THREE.BoxGeometry(0.8, 6, 0.8);
        const obeliskMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            emissive: 0x654321,
            emissiveIntensity: 0.2
        });
        const obelisk = new THREE.Mesh(obeliskGeometry, obeliskMaterial);
        obelisk.position.copy(hazard.position);
        obelisk.position.y = 3;
        obelisk.name = 'obelisk';
        this.scene.add(obelisk);
        this.arenaObjects.push(obelisk);
        
        // Create blast zone marker
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius * 0.8, 0.2, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xFFD700,
            transparent: true,
            opacity: 0.6,
            emissive: 0xFFD700,
            emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.1;
        mesh.name = 'obelisk_blast_zone';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add hieroglyphic details
        for (let i = 0; i < 4; i++) {
            const symbolGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.05);
            const symbolMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFD700,
                emissive: 0xFFD700,
                emissiveIntensity: 0.4
            });
            const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
            symbol.position.copy(hazard.position);
            symbol.position.y = 1.5 + i * 1.2;
            
            // Position symbols on different faces
            if (i % 2 === 0) {
                symbol.position.x += 0.4;
            } else {
                symbol.position.z += 0.4;
                symbol.rotation.y = Math.PI / 2;
            }
            
            symbol.name = 'hieroglyph';
            this.scene.add(symbol);
            this.arenaObjects.push(symbol);
        }
        
        return mesh;
    }
    
    // Create mirage teleporter hazard
    createMirageTeleporter(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius * 0.9, 0.4, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.5,
            emissive: 0x87CEEB,
            emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.2;
        mesh.name = 'mirage_teleporter';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add shimmering effect
        for (let i = 0; i < 8; i++) {
            const shimmerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const shimmerMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.8,
                emissive: 0xFFFFFF,
                emissiveIntensity: 0.5
            });
            const shimmer = new THREE.Mesh(shimmerGeometry, shimmerMaterial);
            const angle = (i / 8) * Math.PI * 2;
            shimmer.position.set(
                hazard.position.x + Math.cos(angle) * hazard.radius * 0.7,
                0.3,
                hazard.position.z + Math.sin(angle) * hazard.radius * 0.7
            );
            shimmer.name = 'mirage_shimmer';
            this.scene.add(shimmer);
            this.arenaObjects.push(shimmer);
        }
        
        // Add destination marker
        const destGeometry = new THREE.CylinderGeometry(hazard.radius * 0.6, hazard.radius * 0.6, 0.1, 16);
        const destMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.3,
            emissive: 0x87CEEB,
            emissiveIntensity: 0.2
        });
        const destMesh = new THREE.Mesh(destGeometry, destMaterial);
        destMesh.position.set(hazard.destination.x, 0.05, hazard.destination.z);
        destMesh.name = 'mirage_destination';
        this.scene.add(destMesh);
        this.arenaObjects.push(destMesh);
        
        return mesh;
    }
    
    // Update hazards
    updateHazards(deltaTime) {
        this.hazardUpdateTimer += deltaTime;
        
        this.hazards.forEach(hazard => {
            hazard.timer += deltaTime;
            
            // Update hazard-specific behaviors
            switch (hazard.type) {
                case 'lava_burst':
                    this.updateLavaBurst(hazard, deltaTime);
                    break;
                case 'lava_geyser':
                    this.updateLavaGeyser(hazard, deltaTime);
                    break;
                case 'magma_burst':
                    this.updateMagmaBurst(hazard, deltaTime);
                    break;
                case 'lava_pool':
                    this.updateLavaPool(hazard, deltaTime);
                    break;
                case 'sinkhole':
                    this.updateSinkhole(hazard, deltaTime);
                    break;
                case 'teleporter':
                    this.updateTeleporter(hazard, deltaTime);
                    break;
                case 'bounce':
                    this.updateBounceZone(hazard, deltaTime);
                    break;
                case 'wind_gust':
                    this.updateWindGust(hazard, deltaTime);
                    break;
                case 'sky_lightning':
                    this.updateSkyLightning(hazard, deltaTime);
                    break;
                case 'cloud_platform':
                    this.updateCloudPlatform(hazard, deltaTime);
                    break;
                case 'quicksand':
                    this.updateQuicksand(hazard, deltaTime);
                    break;
                case 'sandstorm':
                    this.updateSandstorm(hazard, deltaTime);
                    break;
                case 'obelisk_blast':
                    this.updateObeliskBlast(hazard, deltaTime);
                    break;
                case 'mirage_teleporter':
                    this.updateMirageTeleporter(hazard, deltaTime);
                    break;
                case 'launch_pad':
                    // Animate launch pad effects
                    this.updateLaunchPad(hazard, deltaTime);
                    break;
                case 'wind_current':
                    // Wind currents are always active, no special update needed
                    break;
            }
            
            // Check player collisions
            this.checkHazardCollisions(hazard);
        });
        
        // Update hazard effects
        this.updateHazardEffects(deltaTime);
    }
    
    // Update lava burst hazard
    updateLavaBurst(hazard, deltaTime) {
        if (hazard.timer >= hazard.interval) {
            hazard.timer = 0;
            this.triggerLavaBurst(hazard);
        }
        
        // Pulse warning effect - find ring near this hazard
        this.scene.traverse((child) => {
            if (child.name === 'lava_warning') {
                const ringDistance = child.position.distanceTo(hazard.position);
                if (ringDistance < 1) { // Ring should be very close to hazard center
                    const timeToErupt = hazard.interval - hazard.timer;
                    const pulseIntensity = Math.max(0.3, 1 - (timeToErupt / hazard.interval));
                    child.material.emissiveIntensity = pulseIntensity;
                }
            }
        });
    }
    
    // Trigger lava burst
    triggerLavaBurst(hazard) {
        console.log(`🌋 Lava burst triggered at (${hazard.position.x}, ${hazard.position.z})`);
        
        // Create lava burst effect
        const burstGeometry = new THREE.CylinderGeometry(hazard.radius * 1.5, hazard.radius * 0.5, 8, 16);
        const burstMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF4500,
            emissive: 0xFF4500,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8
        });
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.position.copy(hazard.position);
        burst.position.y = 4;
        burst.name = 'lava_burst_effect';
        this.scene.add(burst);
        
        // Add to hazard effects for cleanup
        this.hazardEffects.push({
            mesh: burst,
            life: 1.5,
            maxLife: 1.5,
            velocity: new THREE.Vector3(0, -5, 0),
            type: 'falling_lava',
            radius: hazard.radius * 1.5,
            extraDamage: 15,
            affectedPlayers: new Set()
        });
        
        // Check for players in range
        this.players.forEach(player => {
            if (!player.isAlive) return;
            
            const distance = player.ball.position.distanceTo(hazard.position);
            if (distance <= hazard.radius) {
                // Enhanced dramatic launch effect
                const launchForce = Math.max(45, hazard.force * 1.8); // Minimum 45 force, or 1.8x hazard force
                const minLaunchVelocity = 35; // Ensure minimum launch height
                
                // Apply powerful upward launch
                player.velocity.y = Math.max(player.velocity.y + launchForce, minLaunchVelocity);
                
                // Add more dramatic horizontal spread based on distance from center
                const centerOffset = new THREE.Vector3()
                    .subVectors(player.ball.position, hazard.position)
                    .normalize();
                const horizontalForce = 8 + (Math.random() * 4); // 8-12 horizontal force
                
                player.velocity.x += centerOffset.x * horizontalForce + (Math.random() - 0.5) * 6;
                player.velocity.z += centerOffset.z * horizontalForce + (Math.random() - 0.5) * 6;
                
                // Add dramatic screen shake
                this.cameraShake = Math.max(this.cameraShake, 1.0);
                
                // Apply damage
                this.applyDamage(player, 8, null);
                
                console.log(`🌋🚀 ${player.name} LAUNCHED by volcano explosion! Launch force: ${launchForce}, Min velocity: ${minLaunchVelocity}`);
            }
        });
    }
    
    // Update lava geyser hazard
    updateLavaGeyser(hazard, deltaTime) {
        if (hazard.timer >= hazard.interval) {
            hazard.timer = 0;
            this.triggerLavaGeyser(hazard);
        }
        
        // Animate geyser spout
        this.scene.traverse((child) => {
            if (child.name === 'geyser_spout') {
                const spoutDistance = child.position.distanceTo(hazard.position);
                if (spoutDistance < 1) {
                    const timeToErupt = hazard.interval - hazard.timer;
                    const intensity = Math.max(0.4, 1 - (timeToErupt / hazard.interval));
                    child.material.emissiveIntensity = intensity;
                    
                    // Pulsing scale effect
                    const pulseScale = 1 + Math.sin(hazard.timer * 6) * 0.2 * intensity;
                    child.scale.setScalar(pulseScale);
                }
            }
        });
    }
    
    // Update magma burst hazard
    updateMagmaBurst(hazard, deltaTime) {
        if (hazard.timer >= hazard.interval) {
            hazard.timer = 0;
            this.triggerMagmaBurst(hazard);
        }
        
        // Animate magma bubbles
        this.scene.traverse((child) => {
            if (child.name === 'magma_bubble') {
                const bubbleDistance = child.position.distanceTo(hazard.position);
                if (bubbleDistance < hazard.radius * 1.2) {
                    const timeToErupt = hazard.interval - hazard.timer;
                    const intensity = Math.max(0.3, 1 - (timeToErupt / hazard.interval));
                    child.material.emissiveIntensity = intensity;
                    
                    // Bubbling effect
                    child.position.y = 0.2 + Math.sin(hazard.timer * 8 + bubbleDistance * 10) * 0.1 * intensity;
                }
            }
        });
    }
    
    // Trigger lava geyser
    triggerLavaGeyser(hazard) {
        console.log(`🌋💨 Lava geyser erupting at (${hazard.position.x}, ${hazard.position.z})`);
        
        // Create massive geyser eruption effect
        const eruptionGeometry = new THREE.CylinderGeometry(hazard.radius * 2, hazard.radius * 0.5, 12, 16);
        const eruptionMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF6600,
            emissive: 0xFF4400,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        });
        const eruption = new THREE.Mesh(eruptionGeometry, eruptionMaterial);
        eruption.position.copy(hazard.position);
        eruption.position.y = 6;
        eruption.name = 'geyser_eruption';
        this.scene.add(eruption);
        
        // Add to hazard effects for cleanup
        this.hazardEffects.push({
            mesh: eruption,
            life: 2.0,
            maxLife: 2.0,
            type: 'geyser_eruption'
        });
    }
    
    // Trigger magma burst
    triggerMagmaBurst(hazard) {
        console.log(`🌋🔥 Magma burst erupting at (${hazard.position.x}, ${hazard.position.z})`);
        
        // Create magma burst effect
        const burstGeometry = new THREE.SphereGeometry(hazard.radius * 1.2, 12, 12);
        const burstMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF3300,
            emissive: 0xDD2200,
            emissiveIntensity: 0.9,
            transparent: true,
            opacity: 0.8
        });
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.position.copy(hazard.position);
        burst.position.y = 1;
        burst.name = 'magma_burst_effect';
        this.scene.add(burst);
        
        // Add to hazard effects for cleanup
        this.hazardEffects.push({
            mesh: burst,
            life: 1.2,
            maxLife: 1.2,
            type: 'magma_burst'
        });
    }
    
    // Update lava pool hazard
    updateLavaPool(hazard, deltaTime) {
        // Animate lava bubbles
        this.scene.traverse((child) => {
            if (child.name === 'lava_bubble') {
                const bubbleDistance = child.position.distanceTo(hazard.position);
                if (bubbleDistance < hazard.radius * 1.2) {
                    // Bubbling animation
                    child.position.y = 0.15 + Math.sin(hazard.timer * 4 + bubbleDistance * 8) * 0.05;
                    
                    // Pulsing glow
                    const glowIntensity = 0.6 + Math.sin(hazard.timer * 6 + bubbleDistance * 12) * 0.2;
                    child.material.emissiveIntensity = glowIntensity;
                }
            }
        });
    }
    
    // Update sinkhole hazard
    updateSinkhole(hazard, deltaTime) {
        // Rotate the swirling ring - find it by searching near the hazard position
        this.scene.traverse((child) => {
            if (child.name === 'sinkhole_ring') {
                const ringDistance = child.position.distanceTo(hazard.position);
                if (ringDistance < 1) { // Ring should be very close to hazard center
                    child.rotation.z += deltaTime * 3; // Faster rotation for more dramatic effect
                }
            }
            
            // Animate sand particles for desert sinkholes
            if (child.name === 'sand_particle_sinkhole') {
                const particleDistance = child.position.distanceTo(hazard.position);
                if (particleDistance < hazard.radius * 1.2) {
                    // Spiral particles inward
                    const angle = hazard.timer * 4 + particleDistance;
                    const radius = particleDistance * 0.95; // Gradually spiral inward
                    child.position.x = hazard.position.x + Math.cos(angle) * radius;
                    child.position.z = hazard.position.z + Math.sin(angle) * radius;
                    child.position.y = Math.max(0.1, child.position.y - deltaTime * 0.5); // Sink down
                }
            }
        });
        
        // Pull nearby players with enhanced mechanics
        this.players.forEach(player => {
            if (!player.isAlive) return;
            
            const distance = player.ball.position.distanceTo(hazard.position);
            if (distance <= hazard.radius) {
                // Calculate pull force (stronger closer to center)
                const pullStrength = hazard.strength * (1 - distance / hazard.radius);
                const direction = new THREE.Vector3()
                    .subVectors(hazard.position, player.ball.position)
                    .normalize();
                
                // Apply much stronger horizontal pull force directly to velocity
                const horizontalPull = direction.clone();
                horizontalPull.y = 0; // Remove vertical component
                horizontalPull.normalize();
                
                player.velocity.add(horizontalPull.multiplyScalar(pullStrength * 1.2)); // Increased from 0.5 to 1.2
                
                // Massive downward pull - make players sink into the map
                const downwardPull = Math.max(15, pullStrength * 1.5); // Increased minimum from 8 to 15, multiplier from 0.8 to 1.5
                player.velocity.y -= downwardPull;
                
                // If player is getting pulled down, accelerate the process
                if (player.ball.position.y < 0) {
                    player.velocity.y = Math.min(player.velocity.y, -30); // Increased from -25 to -30
                    console.log(`🕳️💀 ${player.name} being sucked underground! Y: ${player.ball.position.y.toFixed(1)}`);
                }
                
                // If player is deep enough, make them fall through the map completely
                if (player.ball.position.y < -5) {
                    player.velocity.y = Math.min(player.velocity.y, -50); // Massive acceleration
                    console.log(`🕳️💀 ${player.name} falling through the map! Y: ${player.ball.position.y.toFixed(1)}`);
                }
                
                // Add screen shake when players are being pulled
                this.cameraShake = Math.max(this.cameraShake, 0.3);
                
                // Debug logging only on first contact
                if (!hazard.affectedPlayers.has(player.id)) {
                    hazard.affectedPlayers.add(player.id);
                    console.log(`🕳️🌪️ ${player.name} pulled by sinkhole! Pull strength: ${pullStrength.toFixed(1)}, Downward: ${downwardPull.toFixed(1)}`);
                }
            } else {
                hazard.affectedPlayers.delete(player.id);
            }
        });
    }
    
    // Update teleporter hazard
    updateTeleporter(hazard, deltaTime) {
        // Rotate energy ring - find it near this hazard
        this.scene.traverse((child) => {
            if (child.name === 'teleporter_energy') {
                const ringDistance = child.position.distanceTo(hazard.position);
                if (ringDistance < 1) { // Ring should be very close to hazard center
                    child.rotation.z += deltaTime * 3;
                }
            }
        });
        
        // Pulse effect
        if (hazard.mesh) {
            const pulseIntensity = Math.sin(hazard.timer * 4) * 0.2 + 0.3;
            hazard.mesh.material.emissiveIntensity = pulseIntensity;
        }
    }
    
    // Update bounce zone hazard
    updateBounceZone(hazard, deltaTime) {
        // Bounce indicators up and down
        this.scene.traverse((child) => {
            if (child.name === 'bounce_indicator') {
                const baseY = 0.5;
                const bounce = Math.sin(hazard.timer * 6 + child.position.x) * 0.3;
                child.position.y = baseY + bounce;
            }
        });
    }
    
    // Update wind gust hazard
    updateWindGust(hazard, deltaTime) {
        if (hazard.timer >= hazard.interval) {
            hazard.timer = 0;
            this.triggerWindGust(hazard);
        }
        
        // Animate wind particles
        this.scene.traverse((child) => {
            if (child.name === 'wind_particle') {
                const particleDistance = child.position.distanceTo(hazard.position);
                if (particleDistance < hazard.radius * 1.2) {
                    const windSpeed = hazard.timer / hazard.interval;
                    const intensity = Math.sin(hazard.timer * 4) * 0.3 + 0.7;
                    child.material.opacity = intensity * windSpeed;
                    
                    // Move particles in wind direction
                    child.position.x += hazard.direction.x * deltaTime * 2;
                    child.position.z += hazard.direction.z * deltaTime * 2;
                }
            }
        });
    }
    
    // Update sky lightning hazard
    updateSkyLightning(hazard, deltaTime) {
        if (hazard.timer >= hazard.interval) {
            hazard.timer = 0;
            this.triggerSkyLightning(hazard);
        }
        
        // Charging effect on lightning rod
        this.scene.traverse((child) => {
            if (child.name === 'lightning_rod') {
                const rodDistance = child.position.distanceTo(hazard.position);
                if (rodDistance < 1) {
                    const chargeIntensity = Math.min(hazard.timer / hazard.interval, 1);
                    child.material.emissiveIntensity = 0.2 + chargeIntensity * 0.5;
                    
                    // Sparking effect when almost ready
                    if (chargeIntensity > 0.8) {
                        const spark = Math.sin(hazard.timer * 20) * 0.3 + 0.7;
                        child.material.emissive.setHex(0x87CEEB);
                        child.material.emissiveIntensity = spark;
                    }
                }
            }
        });
    }
    
    // Update cloud platform hazard
    updateCloudPlatform(hazard, deltaTime) {
        if (hazard.timer >= hazard.interval) {
            hazard.timer = 0;
            hazard.isVisible = !hazard.isVisible;
        }
        
        // Animate cloud platform visibility
        this.scene.traverse((child) => {
            if (child.name === 'cloud_platform' || child.name === 'cloud_puff') {
                const platformDistance = child.position.distanceTo(hazard.position);
                if (platformDistance < hazard.radius * 1.5) {
                    const fadeTime = 1.0; // 1 second fade
                    const timeSinceToggle = hazard.timer;
                    
                    if (hazard.isVisible) {
                        // Fading in
                        child.material.opacity = Math.min(timeSinceToggle / fadeTime, 0.9);
                        child.visible = true;
                    } else {
                        // Fading out
                        child.material.opacity = Math.max(0.9 - (timeSinceToggle / fadeTime), 0);
                        if (child.material.opacity <= 0) {
                            child.visible = false;
                        }
                    }
                }
            }
        });
    }
    
    // Update quicksand hazard
    updateQuicksand(hazard, deltaTime) {
        // Animate sand bubbles
        this.scene.traverse((child) => {
            if (child.name === 'sand_bubble') {
                const bubbleDistance = child.position.distanceTo(hazard.position);
                if (bubbleDistance < hazard.radius * 1.2) {
                    child.position.y = 0.2 + Math.sin(hazard.timer * 3 + child.position.x * 5) * 0.1;
                    child.material.opacity = 0.6 + Math.sin(hazard.timer * 2) * 0.3;
                }
            }
        });
    }
    
    // Update sandstorm hazard
    updateSandstorm(hazard, deltaTime) {
        if (hazard.timer >= hazard.interval) {
            hazard.timer = 0;
            this.triggerSandstorm(hazard);
        }
        
        // Animate vortex effects
        this.scene.traverse((child) => {
            // Animate main vortex cone
            if (child.name === 'sandstorm') {
                const vortexDistance = child.position.distanceTo(hazard.position);
                if (vortexDistance < 1) {
                    // Rotate the vortex
                    child.rotation.y += deltaTime * 4;
                    
                    // Pulse the vortex intensity
                    const pulseIntensity = Math.sin(hazard.timer * 3) * 0.3 + 0.7;
                    child.material.opacity = 0.5 * pulseIntensity;
                    child.material.emissiveIntensity = 0.2 * pulseIntensity;
                    
                    // Scale pulsing
                    const scaleMultiplier = 1 + Math.sin(hazard.timer * 2) * 0.1;
                    child.scale.setScalar(scaleMultiplier);
                }
            }
            
            // Animate base swirl
            if (child.name === 'sandstorm_base') {
                const baseDistance = child.position.distanceTo(hazard.position);
                if (baseDistance < 1) {
                    // Rotate base in opposite direction
                    child.rotation.y -= deltaTime * 6;
                    
                    // Pulse base intensity
                    const pulseIntensity = Math.sin(hazard.timer * 4) * 0.4 + 0.6;
                    child.material.emissiveIntensity = 0.3 * pulseIntensity;
                }
            }
            
            // Animate warning arrows
            if (child.name === 'vortex_arrow') {
                const arrowDistance = child.position.distanceTo(hazard.position);
                if (arrowDistance < hazard.radius * 1.2) {
                    // Bobbing animation
                    const bobOffset = Math.sin(hazard.timer * 8 + child.position.x) * 0.2;
                    child.position.y = 1.5 + bobOffset;
                    
                    // Pulsing glow
                    const glowIntensity = Math.sin(hazard.timer * 6) * 0.4 + 0.6;
                    child.material.emissiveIntensity = 0.6 * glowIntensity;
                }
            }
            
            // Animate sand particles in spiral
            if (child.name === 'sand_particle') {
                const particleDistance = child.position.distanceTo(hazard.position);
                if (particleDistance < hazard.radius * 1.5) {
                    // Enhanced spiral motion
                    const angle = hazard.timer * 5 + child.position.x + child.position.z;
                    const radius = particleDistance * 0.9;
                    const heightFactor = child.position.y / 6; // Higher particles move faster
                    
                    child.position.x = hazard.position.x + Math.cos(angle) * radius;
                    child.position.z = hazard.position.z + Math.sin(angle) * radius;
                    child.position.y = Math.max(0.5, child.position.y + Math.sin(hazard.timer * 3) * 0.3);
                    
                    // Pulsing opacity and glow
                    const pulseIntensity = Math.sin(hazard.timer * 4 + child.position.y) * 0.3 + 0.7;
                    child.material.opacity = 0.8 * pulseIntensity;
                    child.material.emissiveIntensity = 0.1 * pulseIntensity;
                }
            }
        });
    }
    
    // Update obelisk blast hazard
    updateObeliskBlast(hazard, deltaTime) {
        if (hazard.timer >= hazard.interval) {
            hazard.timer = 0;
            this.triggerObeliskBlast(hazard);
        }
        
        // Charging effect on obelisk
        this.scene.traverse((child) => {
            if (child.name === 'obelisk') {
                const obeliskDistance = child.position.distanceTo(hazard.position);
                if (obeliskDistance < 1) {
                    const chargeIntensity = Math.min(hazard.timer / hazard.interval, 1);
                    child.material.emissiveIntensity = 0.2 + chargeIntensity * 0.6;
                    
                    // Glowing effect when almost ready
                    if (chargeIntensity > 0.7) {
                        const glow = Math.sin(hazard.timer * 15) * 0.4 + 0.6;
                        child.material.emissive.setHex(0xFFD700);
                        child.material.emissiveIntensity = glow;
                    }
                }
            }
            
            // Animate hieroglyphs
            if (child.name === 'hieroglyph') {
                const hieroglyphDistance = child.position.distanceTo(hazard.position);
                if (hieroglyphDistance < 2) {
                    const chargeIntensity = Math.min(hazard.timer / hazard.interval, 1);
                    child.material.emissiveIntensity = 0.4 + chargeIntensity * 0.4;
                    
                    if (chargeIntensity > 0.8) {
                        const pulse = Math.sin(hazard.timer * 20) * 0.3 + 0.7;
                        child.material.emissiveIntensity = pulse;
                    }
                }
            }
        });
    }
    
    // Update launch pad hazard
    updateLaunchPad(hazard, deltaTime) {
        // Animate launch pad effects
        this.scene.traverse((child) => {
            if (child.name === 'launch_pad') {
                const padDistance = child.position.distanceTo(hazard.position);
                if (padDistance < 1) {
                    // Pulsing intensity effect
                    const pulseIntensity = Math.sin(hazard.timer * 4) * 0.3 + 0.7;
                    child.material.emissiveIntensity = pulseIntensity;
                    
                    // Slight scale pulsing
                    const scaleMultiplier = 1 + Math.sin(hazard.timer * 4) * 0.05;
                    child.scale.setScalar(scaleMultiplier);
                }
            }
            
            // Animate launch arrows
            if (child.name === 'launch_arrow') {
                const arrowDistance = child.position.distanceTo(hazard.position);
                if (arrowDistance < 2) {
                    // Bobbing animation
                    const bobOffset = Math.sin(hazard.timer * 6 + child.position.y) * 0.1;
                    child.position.y = child.userData.originalY + bobOffset;
                    
                    // Store original Y position if not already stored
                    if (!child.userData.originalY) {
                        child.userData.originalY = child.position.y;
                    }
                    
                    // Pulsing glow
                    const glowIntensity = Math.sin(hazard.timer * 5) * 0.4 + 0.8;
                    child.material.emissiveIntensity = glowIntensity;
                }
            }
            
            // Animate energy rings
            if (child.name === 'launch_ring') {
                const ringDistance = child.position.distanceTo(hazard.position);
                if (ringDistance < 2) {
                    // Rotating rings
                    child.rotation.z += deltaTime * 2;
                    
                    // Pulsing opacity
                    const pulseIntensity = Math.sin(hazard.timer * 3 + child.position.y * 10) * 0.3 + 0.7;
                    child.material.opacity = child.userData.originalOpacity * pulseIntensity;
                    child.material.emissiveIntensity = 0.6 + pulseIntensity * 0.4;
                    
                    // Store original opacity if not already stored
                    if (!child.userData.originalOpacity) {
                        child.userData.originalOpacity = child.material.opacity;
                    }
                }
            }
        });
    }
    
    // Update mirage teleporter hazard
    updateMirageTeleporter(hazard, deltaTime) {
        // Animate shimmering effect
        this.scene.traverse((child) => {
            if (child.name === 'mirage_shimmer') {
                const shimmerDistance = child.position.distanceTo(hazard.position);
                if (shimmerDistance < hazard.radius * 1.2) {
                    child.material.opacity = 0.8 + Math.sin(hazard.timer * 6 + child.position.x * 3) * 0.2;
                    child.material.emissiveIntensity = 0.5 + Math.sin(hazard.timer * 4) * 0.3;
                    child.position.y = 0.3 + Math.sin(hazard.timer * 3 + child.position.x) * 0.1;
                }
            }
        });
    }
    
    // Trigger wind gust
    triggerWindGust(hazard) {
        console.log(`💨 Wind gust activated at (${hazard.position.x}, ${hazard.position.z})`);
        
        // Apply wind force to all players in range
        this.players.forEach(player => {
            if (!player.isAlive) return;
            
            const distance = player.ball.position.distanceTo(hazard.position);
            if (distance <= hazard.radius) {
                const windForce = hazard.force * (1 - distance / hazard.radius);
                const windDirection = new THREE.Vector3(hazard.direction.x, 0, hazard.direction.z).normalize();
                
                // Apply wind force
                player.velocity.add(windDirection.multiplyScalar(windForce));
                
                // Add upward lift for dramatic effect
                player.velocity.y += windForce * 0.3;
                
                console.log(`🌪️ ${player.name} caught in wind gust! Force: ${windForce.toFixed(1)}`);
            }
        });
    }
    
    // Trigger sky lightning
    triggerSkyLightning(hazard) {
        console.log(`⚡ Sky lightning strikes at (${hazard.position.x}, ${hazard.position.z})`);
        
        // Create lightning bolt effect
        const lightningGeometry = new THREE.CylinderGeometry(0.2, 0.2, 15, 8);
        const lightningMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFFFFF,
            emissive: 0x87CEEB,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        });
        const lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);
        lightning.position.copy(hazard.position);
        lightning.position.y = 7.5;
        lightning.name = 'lightning_bolt';
        this.scene.add(lightning);
        
        // Add to hazard effects for cleanup
        this.hazardEffects.push({
            mesh: lightning,
            life: 0.3,
            maxLife: 0.3
        });
        
        // Check for players in range
        this.players.forEach(player => {
            if (!player.isAlive) return;
            
            const distance = player.ball.position.distanceTo(hazard.position);
            if (distance <= hazard.radius) {
                // Apply lightning damage and stun
                this.applyDamage(player, hazard.damage, null);
                player.hitstunTimer = Math.max(player.hitstunTimer, hazard.stunDuration);
                
                // Lightning shock effect
                player.velocity.multiplyScalar(0.1);
                
                // Screen flash effect
                this.cameraShake = Math.max(this.cameraShake, 0.6);
                
                console.log(`⚡💥 ${player.name} struck by lightning! Damage: ${hazard.damage}, stunned for ${hazard.stunDuration}s!`);
            }
                 });
     }
     
     // Trigger sandstorm
     triggerSandstorm(hazard) {
         console.log(`🌪️ Sandstorm vortex activated at (${hazard.position.x}, ${hazard.position.z})`);
         
         // Apply sandstorm damage and force to all players in range
         this.players.forEach(player => {
             if (!player.isAlive) return;
             
             const distance = player.ball.position.distanceTo(hazard.position);
             if (distance <= hazard.radius) {
                 const stormForce = hazard.force * (1 - distance / hazard.radius);
                 
                 // Enhanced vortex launch effect - powerful upward spiral
                 const launchForce = Math.max(35, stormForce * 1.5); // Minimum 35 force
                 const minLaunchVelocity = 30; // Ensure minimum launch height
                 
                 // Create spiral vortex effect - players get launched up in a spiral
                 const spiralAngle = hazard.timer * 5 + distance; // Spiral based on time and distance
                 const spiralRadius = 8 + Math.random() * 4; // 8-12 horizontal force
                 
                 // Apply powerful upward launch
                 player.velocity.y = Math.max(player.velocity.y + launchForce, minLaunchVelocity);
                 
                 // Apply spiral horizontal forces
                 player.velocity.x += Math.cos(spiralAngle) * spiralRadius;
                 player.velocity.z += Math.sin(spiralAngle) * spiralRadius;
                 
                 // Add dramatic screen shake
                 this.cameraShake = Math.max(this.cameraShake, 0.9);
                 
                 // Apply sandstorm damage
                 this.applyDamage(player, hazard.damage, null);
                 
                 // Temporary vision impairment (hitstun)
                 player.hitstunTimer = Math.max(player.hitstunTimer, 0.8);
                 
                 console.log(`🌪️🚀 ${player.name} LAUNCHED by sandstorm vortex! Launch force: ${launchForce}, Min velocity: ${minLaunchVelocity}`);
             }
         });
     }
     
     // Trigger obelisk blast
     triggerObeliskBlast(hazard) {
         console.log(`🏛️ Obelisk energy blast at (${hazard.position.x}, ${hazard.position.z})`);
         
         // Create energy blast effect
         const blastGeometry = new THREE.CylinderGeometry(hazard.radius * 1.2, hazard.radius * 0.3, 10, 16);
         const blastMaterial = new THREE.MeshLambertMaterial({ 
             color: 0xFFD700,
             emissive: 0xFFD700,
             emissiveIntensity: 1.0,
             transparent: true,
             opacity: 0.8
         });
         const blast = new THREE.Mesh(blastGeometry, blastMaterial);
         blast.position.copy(hazard.position);
         blast.position.y = 5;
         blast.name = 'obelisk_blast_beam';
         this.scene.add(blast);
         
         // Add to hazard effects for cleanup
         this.hazardEffects.push({
             mesh: blast,
             life: 0.5,
             maxLife: 0.5
         });
         
         // Check for players in range
         this.players.forEach(player => {
             if (!player.isAlive) return;
             
             const distance = player.ball.position.distanceTo(hazard.position);
             if (distance <= hazard.radius) {
                 // Apply obelisk damage and stun
                 this.applyDamage(player, hazard.damage, null);
                 player.hitstunTimer = Math.max(player.hitstunTimer, hazard.stunDuration);
                 
                 // Knockback from blast
                 const knockbackDirection = new THREE.Vector3()
                     .subVectors(player.ball.position, hazard.position)
                     .normalize();
                 knockbackDirection.y = 0.5; // Add upward component
                 
                 player.velocity.add(knockbackDirection.multiplyScalar(15));
                 
                 // Screen flash effect
                 this.cameraShake = Math.max(this.cameraShake, 0.7);
                 
                 console.log(`🏛️⚡ ${player.name} hit by obelisk blast! Damage: ${hazard.damage}, stunned for ${hazard.stunDuration}s!`);
             }
         });
     }
     
     // Check hazard collisions with players
     checkHazardCollisions(hazard) {
        this.players.forEach(player => {
            if (!player.isAlive) return;
            
            const distance = player.ball.position.distanceTo(hazard.position);
            
            switch (hazard.type) {
                case 'ice':
                    if (distance <= hazard.radius) {
                        // Apply ice friction (much more slippery than normal)
                        // Normal ground friction is 0.95, ice should be much closer to 1.0
                        // Lower friction values = more slippery
                        const iceFriction = 1.0 - (hazard.friction * 0.02);  // 0.1 -> 0.998, 0.05 -> 0.999
                        player.velocity.x *= iceFriction;
                        player.velocity.z *= iceFriction;
                        
                        // Mark player as on ice to prevent normal ground friction
                        player.onIce = true;
                        
                        // Debug logging only on first contact
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            console.log(`🧊 ${player.name} stepped on ice! Friction: ${iceFriction.toFixed(3)}`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'sinkhole':
                    if (distance <= hazard.radius) {
                        // Continuous sinkhole pull effect
                        const pullStrength = hazard.strength * (1 - distance / hazard.radius);
                        const direction = new THREE.Vector3()
                            .subVectors(hazard.position, player.ball.position)
                            .normalize();
                        
                        // Apply continuous horizontal pull
                        const horizontalPull = direction.clone();
                        horizontalPull.y = 0;
                        horizontalPull.normalize();
                        player.velocity.add(horizontalPull.multiplyScalar(pullStrength * 0.8));
                        
                        // Apply continuous downward pull
                        const downwardPull = Math.max(12, pullStrength * 1.2);
                        player.velocity.y -= downwardPull * 0.5; // Continuous pull
                        
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            console.log(`🕳️ ${player.name} caught in sinkhole! Pull strength: ${pullStrength.toFixed(1)}`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'ramp':
                    if (distance <= 2 && Math.abs(player.ball.position.y - hazard.position.y) < 1) {
                        // Launch player upward and forward
                        const launchDirection = new THREE.Vector3(0, 1, 1).normalize();
                        const launchForce = launchDirection.multiplyScalar(hazard.force);
                        player.velocity.add(launchForce);
                        
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            console.log(`🚀 ${player.name} launched by ramp with force ${hazard.force}!`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    

                    
                case 'spikes':
                    if (distance <= hazard.size) {
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            
                            // Apply massive damage (increased from base 25 to 40)
                            const massiveDamage = Math.max(40, hazard.damage * 1.6);
                            this.applyDamage(player, massiveDamage, null);
                            
                            // Complete stunning effect - stop movement and apply long hitstun
                            player.velocity.multiplyScalar(0.05); // Almost complete stop
                            player.hitstunTimer = 2.5; // Much longer stun duration
                            
                            // Add screen shake for dramatic effect
                            this.cameraShake = Math.max(this.cameraShake, 0.8);
                            
                            this.createSpikeEffect(player.ball.position.clone());
                            console.log(`🔪💀 ${player.name} impaled by spikes! Massive damage: ${massiveDamage}, stunned for 2.5s!`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'teleporter':
                    if (distance <= hazard.radius) {
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            
                            // Apply teleporter damage and stun if enhanced
                            if (hazard.damage) {
                                this.applyDamage(player, hazard.damage, null);
                                player.hitstunTimer = Math.max(player.hitstunTimer, hazard.stunDuration);
                            }
                            
                            // Teleport player to destination
                            const destX = hazard.destination.x + (Math.random() - 0.5) * 2;
                            const destZ = hazard.destination.z + (Math.random() - 0.5) * 2;
                            
                            // Check if destination is off the arena (dangerous teleport)
                            const destDistance = Math.sqrt(destX * destX + destZ * destZ);
                            if (destDistance > this.arenaRadius) {
                                console.log(`💀 ${player.name} teleported off the arena!`);
                                player.ball.position.set(destX, 5, destZ);
                            } else {
                                player.ball.position.set(destX, 2, destZ);
                            }
                            
                            // Reset velocity
                            player.velocity.set(0, 0, 0);
                            
                            this.createTeleportEffect(hazard.position.clone());
                            this.createTeleportEffect(new THREE.Vector3(destX, 2, destZ));
                            
                            console.log(`🌀 ${player.name} teleported!`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'bounce':
                    if (distance <= hazard.radius) {
                        // Apply strong upward bounce
                        let bounceForce = hazard.force;
                        
                        // Air combo system for enhanced bounce pads
                        if (hazard.airCombo && player.ball.position.y > 2) {
                            bounceForce *= 1.5; // 50% more force for air combos
                            this.applyDamage(player, 3, null); // Small damage for air combos
                            console.log(`🚀💥 ${player.name} air combo bounce!`);
                        }
                        
                        player.velocity.y = Math.max(player.velocity.y, bounceForce);
                        
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            this.createBounceEffect(player.ball.position.clone());
                            console.log(`🦘 ${player.name} bounced high!`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'wind_gust':
                    // Wind gust collision is handled by the trigger method
                    break;
                    
                case 'sky_lightning':
                    // Lightning collision is handled by the trigger method
                    break;
                    
                case 'launch_pad':
                    if (distance <= hazard.radius) {
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            
                            // Enhanced dramatic launch effect similar to volcano
                            const launchForce = Math.max(50, hazard.force * 1.2); // Minimum 50 force, or 1.2x hazard force
                            const minLaunchVelocity = 40; // Ensure minimum launch height for upper level
                            
                            // Apply powerful upward launch (additive, not max)
                            player.velocity.y = Math.max(player.velocity.y + launchForce, minLaunchVelocity);
                            
                            // Add directional spread based on distance from center
                            const centerOffset = new THREE.Vector3()
                                .subVectors(player.ball.position, hazard.position)
                                .normalize();
                            const horizontalForce = 6 + (Math.random() * 3); // 6-9 horizontal force
                            
                            player.velocity.x += centerOffset.x * horizontalForce + (Math.random() - 0.5) * 4;
                            player.velocity.z += centerOffset.z * horizontalForce + (Math.random() - 0.5) * 4;
                            
                            // Add dramatic screen shake
                            this.cameraShake = Math.max(this.cameraShake, 0.8);
                            
                            this.createBounceEffect(player.ball.position.clone());
                            console.log(`🚀💨 ${player.name} LAUNCHED to upper level! Launch force: ${launchForce}, Min velocity: ${minLaunchVelocity}`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'wind_current':
                    if (distance <= hazard.radius) {
                        // Apply continuous wind force
                        const windDirection = new THREE.Vector3(
                            hazard.direction.x, 
                            hazard.direction.y, 
                            hazard.direction.z
                        ).normalize();
                        
                        // Apply wind force scaled by distance
                        const windForce = hazard.force * (1 - distance / hazard.radius) * 0.5;
                        player.velocity.add(windDirection.multiplyScalar(windForce));
                        
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            console.log(`💨 ${player.name} caught in wind current!`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'cloud_platform':
                    if (distance <= hazard.radius && hazard.isVisible) {
                        // Platform collision - players can land on it
                        if (player.ball.position.y <= hazard.height + 0.5 && player.ball.position.y >= hazard.height - 0.5) {
                            if (player.velocity.y < 0) { // Falling
                                player.ball.position.y = hazard.height + 0.5;
                                player.velocity.y = Math.max(0, player.velocity.y * -0.3);
                                player.isOnGround = true;
                                
                                if (!hazard.affectedPlayers.has(player.id)) {
                                    hazard.affectedPlayers.add(player.id);
                                    console.log(`☁️ ${player.name} landed on cloud platform!`);
                                }
                            }
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'quicksand':
                    if (distance <= hazard.radius) {
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            console.log(`🏖️ ${player.name} stepped into quicksand!`);
                        }
                        
                        // Gradually sink player and apply damage
                        if (player.ball.position.y > -hazard.sinkRate) {
                            player.ball.position.y -= hazard.sinkRate * 0.016; // Approximate deltaTime
                            player.velocity.y = Math.min(player.velocity.y, -hazard.sinkRate);
                            
                            // Apply periodic damage
                            if (hazard.timer % 1 < 0.1) {
                                this.applyDamage(player, hazard.damage, null);
                            }
                        }
                        
                        // Slow movement
                        player.velocity.x *= 0.7;
                        player.velocity.z *= 0.7;
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'sandstorm':
                    if (distance <= hazard.radius) {
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            
                            // Continuous vortex launch effect - always active
                            const vortexForce = Math.max(40, hazard.force * 2.0); // Minimum 40 force, 2x hazard force
                            const minLaunchVelocity = 35; // High launch velocity
                            
                            // Create powerful upward spiral launch
                            const spiralAngle = hazard.timer * 8 + distance * 3; // Fast spiral
                            const spiralRadius = 10 + Math.random() * 5; // 10-15 horizontal force
                            
                            // Apply massive upward launch
                            player.velocity.y = Math.max(player.velocity.y + vortexForce, minLaunchVelocity);
                            
                            // Apply strong spiral horizontal forces
                            player.velocity.x += Math.cos(spiralAngle) * spiralRadius;
                            player.velocity.z += Math.sin(spiralAngle) * spiralRadius;
                            
                            // Apply damage
                            this.applyDamage(player, hazard.damage, null);
                            
                            // Dramatic screen shake
                            this.cameraShake = Math.max(this.cameraShake, 1.0);
                            
                            console.log(`🌪️🚀 ${player.name} LAUNCHED by sandstorm vortex! Force: ${vortexForce}, Min velocity: ${minLaunchVelocity}`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'obelisk_blast':
                    // Obelisk blast collision is handled by the trigger method
                    break;
                    
                case 'lava_geyser':
                    if (distance <= hazard.radius) {
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            
                            // Powerful geyser launch effect - even stronger than volcano
                            const geyserForce = Math.max(60, hazard.force * 2.0); // Minimum 60 force, or 2x hazard force
                            const minLaunchVelocity = 50; // Very high launch for geyser
                            
                            // Apply explosive upward launch
                            player.velocity.y = Math.max(player.velocity.y + geyserForce, minLaunchVelocity);
                            
                            // Add dramatic horizontal spread
                            const centerOffset = new THREE.Vector3()
                                .subVectors(player.ball.position, hazard.position)
                                .normalize();
                            const horizontalForce = 12 + (Math.random() * 6); // 12-18 horizontal force
                            
                            player.velocity.x += centerOffset.x * horizontalForce + (Math.random() - 0.5) * 8;
                            player.velocity.z += centerOffset.z * horizontalForce + (Math.random() - 0.5) * 8;
                            
                            // Apply geyser damage
                            this.applyDamage(player, hazard.damage, null);
                            
                            // Massive screen shake for geyser
                            this.cameraShake = Math.max(this.cameraShake, 1.2);
                            
                            console.log(`🌋💨 ${player.name} BLASTED by lava geyser! Force: ${geyserForce}, Min velocity: ${minLaunchVelocity}`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'magma_burst':
                    if (distance <= hazard.radius) {
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            
                            // Magma burst launch effect - medium strength
                            const magmaForce = Math.max(40, hazard.force * 1.5); // Minimum 40 force, or 1.5x hazard force
                            const minLaunchVelocity = 30; // Good launch height
                            
                            // Apply upward launch
                            player.velocity.y = Math.max(player.velocity.y + magmaForce, minLaunchVelocity);
                            
                            // Add horizontal spread
                            const centerOffset = new THREE.Vector3()
                                .subVectors(player.ball.position, hazard.position)
                                .normalize();
                            const horizontalForce = 8 + (Math.random() * 4); // 8-12 horizontal force
                            
                            player.velocity.x += centerOffset.x * horizontalForce + (Math.random() - 0.5) * 6;
                            player.velocity.z += centerOffset.z * horizontalForce + (Math.random() - 0.5) * 6;
                            
                            // Apply magma damage
                            this.applyDamage(player, hazard.damage, null);
                            
                            // Screen shake for magma burst
                            this.cameraShake = Math.max(this.cameraShake, 0.8);
                            
                            console.log(`🌋🔥 ${player.name} hit by magma burst! Force: ${magmaForce}, Min velocity: ${minLaunchVelocity}`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
                    
                case 'lava_pool':
                    if (distance <= hazard.radius) {
                        // Continuous damage and slowing effect
                        this.applyDamage(player, hazard.damage * deltaTime * 2, null); // Damage over time
                        
                        // Slow player movement in lava
                        player.velocity.x *= 0.7;
                        player.velocity.z *= 0.7;
                        
                        // Occasional small upward push from bubbling lava
                        if (Math.random() < 0.1) {
                            player.velocity.y += 5 + Math.random() * 3;
                        }
                        
                        console.log(`🌋🔥 ${player.name} is burning in lava pool!`);
                    }
                    break;
                    
                case 'mirage_teleporter':
                    if (distance <= hazard.radius) {
                        if (!hazard.affectedPlayers.has(player.id)) {
                            hazard.affectedPlayers.add(player.id);
                            
                            // Apply mirage damage
                            this.applyDamage(player, hazard.damage, null);
                            
                            // Teleport player to destination
                            const destX = hazard.destination.x + (Math.random() - 0.5) * 2;
                            const destZ = hazard.destination.z + (Math.random() - 0.5) * 2;
                            
                            player.ball.position.set(destX, 2, destZ);
                            player.velocity.set(0, 0, 0);
                            
                            // Create mirage effect
                            this.createMirageEffect(hazard.position.clone());
                            this.createMirageEffect(new THREE.Vector3(destX, 2, destZ));
                            
                            console.log(`🏜️✨ ${player.name} fell for the mirage!`);
                        }
                    } else {
                        hazard.affectedPlayers.delete(player.id);
                    }
                    break;
            }
        });
    }
    
    // Create bounce effect
    createBounceEffect(position) {
        const effectGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const effectMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00FF00,
            transparent: true,
            opacity: 0.6
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(position);
        this.scene.add(effect);
        
        this.hazardEffects.push({
            mesh: effect,
            life: 0.5,
            maxLife: 0.5
        });
    }
    
    // Create spike effect
    createSpikeEffect(position) {
        // Blood splash effect
        for (let i = 0; i < 8; i++) {
            const splashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const splashMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x8B0000,
                transparent: true,
                opacity: 0.8
            });
            const splash = new THREE.Mesh(splashGeometry, splashMaterial);
            splash.position.copy(position);
            this.scene.add(splash);
            
            this.hazardEffects.push({
                mesh: splash,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    Math.random() * 5 + 2,
                    (Math.random() - 0.5) * 10
                ),
                life: 1.2,
                maxLife: 1.2
            });
        }
    }
    
    // Create teleport effect
    createTeleportEffect(position) {
        const effectGeometry = new THREE.CylinderGeometry(0.5, 1.5, 3, 16);
        const effectMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x9400D3,
            transparent: true,
            opacity: 0.7,
            emissive: 0x4B0082,
            emissiveIntensity: 0.5
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(position);
        effect.position.y += 1.5;
        this.scene.add(effect);
        
        this.hazardEffects.push({
            mesh: effect,
            life: 0.8,
            maxLife: 0.8
        });
    }
    
    // Create mirage effect
    createMirageEffect(position) {
        const effectGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const effectMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.6,
            emissive: 0x87CEEB,
            emissiveIntensity: 0.5
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(position);
        effect.position.y += 1;
        this.scene.add(effect);
        
        this.hazardEffects.push({
            mesh: effect,
            life: 0.8,
            maxLife: 0.8
        });
    }
    
    // Update hazard effects
    updateHazardEffects(deltaTime) {
        this.hazardEffects.forEach((effect, index) => {
            effect.life -= deltaTime;
            
            // Move effects with velocity
            if (effect.velocity) {
                effect.mesh.position.add(effect.velocity.clone().multiplyScalar(deltaTime));
                effect.velocity.y -= 20 * deltaTime; // Gravity
            }
            
            // Check for falling lava collision with players
            if (effect.type === 'falling_lava' && effect.mesh.position.y > 0) {
                this.players.forEach(player => {
                    if (!player.isAlive) return;
                    
                    const distance = player.ball.position.distanceTo(effect.mesh.position);
                    if (distance <= effect.radius) {
                        if (!effect.affectedPlayers.has(player.id)) {
                            effect.affectedPlayers.add(player.id);
                            
                            // Apply extra damage for falling lava
                            this.applyDamage(player, effect.extraDamage, null);
                            
                            // Add dramatic knockback
                            const knockbackDirection = new THREE.Vector3()
                                .subVectors(player.ball.position, effect.mesh.position)
                                .normalize();
                            knockbackDirection.y = Math.max(0.3, knockbackDirection.y); // Ensure some upward force
                            
                            const knockbackForce = 18;
                            player.velocity.add(knockbackDirection.multiplyScalar(knockbackForce));
                            
                            // Extended hitstun for falling lava
                            player.hitstunTimer = Math.max(player.hitstunTimer, 1.2);
                            
                            console.log(`🌋💥 ${player.name} struck by falling lava! Extra damage: ${effect.extraDamage}`);
                        }
                    }
                });
            }
            
            if (effect.life <= 0) {
                this.scene.remove(effect.mesh);
                this.hazardEffects.splice(index, 1);
            } else {
                // Fade out
                effect.mesh.material.opacity = effect.life / effect.maxLife;
                // Scale effect
                const scale = 1 + (1 - effect.life / effect.maxLife) * 0.5;
                effect.mesh.scale.setScalar(scale);
            }
        });
    }
    
    // Clear hazards
    clearHazards() {
        this.hazards.forEach(hazard => {
            if (hazard.mesh) {
                this.scene.remove(hazard.mesh);
            }
        });
        this.hazards = [];
        
        // Clear hazard effects
        this.hazardEffects.forEach(effect => {
            this.scene.remove(effect.mesh);
        });
        this.hazardEffects = [];
    }

    // Create special features (like upper level platforms for Sky Sanctuary)
    createSpecialFeatures(theme) {
        if (!theme.specialFeatures) return;
        
        // Create upper level platforms
        if (theme.specialFeatures.upperLevel && theme.specialFeatures.upperLevel.enabled) {
            const upperLevel = theme.specialFeatures.upperLevel;
            
            upperLevel.platforms.forEach(platformData => {
                const geometry = new THREE.CylinderGeometry(platformData.radius, platformData.radius, 0.5, 32);
                const material = new THREE.MeshLambertMaterial({ 
                    color: theme.colors.platform,
                    transparent: true,
                    opacity: 0.9
                });
                const platform = new THREE.Mesh(geometry, material);
                platform.position.set(
                    platformData.position.x,
                    upperLevel.height,
                    platformData.position.z
                );
                platform.name = 'upper_platform';
                platform.receiveShadow = true;
                platform.castShadow = true;
                this.scene.add(platform);
                this.arenaObjects.push(platform);
                
                // Add platform edge
                const edgeGeometry = new THREE.TorusGeometry(platformData.radius, 0.1, 8, 16);
                const edgeMaterial = new THREE.MeshLambertMaterial({ 
                    color: theme.colors.edge,
                    emissive: theme.colors.edge,
                    emissiveIntensity: 0.3
                });
                const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
                edge.position.set(
                    platformData.position.x,
                    upperLevel.height + 0.25,
                    platformData.position.z
                );
                edge.rotation.x = Math.PI / 2;
                edge.name = 'upper_platform_edge';
                this.scene.add(edge);
                this.arenaObjects.push(edge);
                
                // Add floating crystals around platform
                for (let i = 0; i < 6; i++) {
                    const crystalGeometry = new THREE.OctahedronGeometry(0.3);
                    const crystalMaterial = new THREE.MeshLambertMaterial({ 
                        color: theme.colors.markers,
                        emissive: theme.colors.markers,
                        emissiveIntensity: 0.4,
                        transparent: true,
                        opacity: 0.8
                    });
                    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
                    const angle = (i / 6) * Math.PI * 2;
                    crystal.position.set(
                        platformData.position.x + Math.cos(angle) * (platformData.radius + 1),
                        upperLevel.height + 1.5,
                        platformData.position.z + Math.sin(angle) * (platformData.radius + 1)
                    );
                    crystal.name = 'floating_crystal';
                    this.scene.add(crystal);
                    this.arenaObjects.push(crystal);
                }
            });
            
            console.log(`🏰 Created ${upperLevel.platforms.length} upper level platforms at height ${upperLevel.height}`);
        }
    }

    // Create launch pad hazard
    createLaunchPad(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius, 0.3, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x00FF00,
            emissive: 0x00FF00,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.15;
        mesh.name = 'launch_pad';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add multiple launch arrow indicators for better visibility
        for (let i = 0; i < 3; i++) {
            const arrowGeometry = new THREE.ConeGeometry(0.4, 1.2, 6);
            const arrowMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFFF00,
                emissive: 0xFFFF00,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.9 - i * 0.2
            });
            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
            arrow.position.copy(hazard.position);
            arrow.position.y = 1.5 + i * 0.8;
            arrow.rotation.x = -Math.PI / 2;
            arrow.name = 'launch_arrow';
            this.scene.add(arrow);
            this.arenaObjects.push(arrow);
        }
        
        // Add enhanced energy ring effects
        for (let i = 0; i < 4; i++) {
            const ringGeometry = new THREE.TorusGeometry(hazard.radius * (0.7 + i * 0.15), 0.08, 8, 16);
            const ringMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x00FFFF,
                emissive: 0x00FFFF,
                emissiveIntensity: 0.6 - i * 0.1,
                transparent: true,
                opacity: 0.8 - i * 0.15
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(hazard.position);
            ring.position.y = 0.2 + i * 0.08;
            ring.rotation.x = Math.PI / 2;
            ring.name = 'launch_ring';
            this.scene.add(ring);
            this.arenaObjects.push(ring);
        }
        
        return mesh;
    }

    // Create wind current hazard
    createWindCurrent(hazard, theme) {
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius * 0.7, 1.5, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.3,
            emissive: 0x87CEEB,
            emissiveIntensity: 0.2
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(hazard.position);
        mesh.position.y = 0.75;
        mesh.name = 'wind_current';
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);
        
        // Add swirling wind particles
        for (let i = 0; i < 15; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const particleMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            const angle = (i / 15) * Math.PI * 2;
            const radius = Math.random() * hazard.radius * 0.9;
            const height = Math.random() * 2;
            particle.position.set(
                hazard.position.x + Math.cos(angle) * radius,
                height,
                hazard.position.z + Math.sin(angle) * radius
            );
            particle.name = 'wind_particle';
            this.scene.add(particle);
            this.arenaObjects.push(particle);
        }
        
        return mesh;
    }
} 