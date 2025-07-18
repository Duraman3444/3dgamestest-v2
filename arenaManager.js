import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class ArenaManager {
    constructor(scene) {
        this.scene = scene;
        this.currentArena = null;
        this.arenaSize = 20;
        this.arenaObjects = [];
        this.platforms = [];
        this.environmentalObjects = [];
        this.lightingSetup = null;
        
        // Arena generation parameters
        this.gridSize = 0.5;
        this.platformHeight = 0.5;
        this.wallHeight = 8;
        
        // Material library for SNES-style themes
        this.materials = {};
        this.initializeMaterials();
    }
    
    initializeMaterials() {
        // Create reusable materials for different themes
        this.materials.ground = {};
        this.materials.walls = {};
        this.materials.accents = {};
        this.materials.special = {};
        
        // Candy Plains Materials
        this.materials.ground.candy = new THREE.MeshLambertMaterial({ 
            color: 0xff69b4,
            transparent: true,
            opacity: 0.9
        });
        this.materials.walls.candy = new THREE.MeshLambertMaterial({ 
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.8
        });
        this.materials.accents.candy = new THREE.MeshLambertMaterial({ 
            color: 0xffc0cb,
            emissive: 0x221122,
            emissiveIntensity: 0.1
        });
        
        // Forest Materials
        this.materials.ground.forest = new THREE.MeshLambertMaterial({ 
            color: 0x228b22,
            roughness: 0.8
        });
        this.materials.walls.forest = new THREE.MeshLambertMaterial({ 
            color: 0x8b4513,
            roughness: 0.9
        });
        this.materials.accents.forest = new THREE.MeshLambertMaterial({ 
            color: 0x32cd32,
            emissive: 0x001100,
            emissiveIntensity: 0.05
        });
        
        // Volcano Materials
        this.materials.ground.volcano = new THREE.MeshLambertMaterial({ 
            color: 0x8b0000,
            emissive: 0x331100,
            emissiveIntensity: 0.3
        });
        this.materials.walls.volcano = new THREE.MeshLambertMaterial({ 
            color: 0x2f4f4f,
            roughness: 0.7
        });
        this.materials.accents.volcano = new THREE.MeshLambertMaterial({ 
            color: 0xff4500,
            emissive: 0x442200,
            emissiveIntensity: 0.4
        });
        
        // Ice Materials
        this.materials.ground.ice = new THREE.MeshPhongMaterial({ 
            color: 0x4169e1,
            transparent: true,
            opacity: 0.8,
            shininess: 100
        });
        this.materials.walls.ice = new THREE.MeshPhongMaterial({ 
            color: 0xfffafa,
            transparent: true,
            opacity: 0.9,
            shininess: 80
        });
        this.materials.accents.ice = new THREE.MeshPhongMaterial({ 
            color: 0x00bfff,
            transparent: true,
            opacity: 0.7,
            shininess: 120
        });
        
        // Cyber Materials
        this.materials.ground.cyber = new THREE.MeshPhongMaterial({ 
            color: 0x4b0082,
            emissive: 0x220044,
            emissiveIntensity: 0.2,
            shininess: 100
        });
        this.materials.walls.cyber = new THREE.MeshPhongMaterial({ 
            color: 0x8a2be2,
            emissive: 0x441166,
            emissiveIntensity: 0.3,
            shininess: 90
        });
        this.materials.accents.cyber = new THREE.MeshPhongMaterial({ 
            color: 0x00ffff,
            emissive: 0x004444,
            emissiveIntensity: 0.5,
            shininess: 120
        });
        
        // Storm Materials
        this.materials.ground.storm = new THREE.MeshLambertMaterial({ 
            color: 0x696969,
            roughness: 0.8
        });
        this.materials.walls.storm = new THREE.MeshLambertMaterial({ 
            color: 0x2f4f4f,
            roughness: 0.9
        });
        this.materials.accents.storm = new THREE.MeshLambertMaterial({ 
            color: 0xffff00,
            emissive: 0x444400,
            emissiveIntensity: 0.3
        });
        
        // Space Materials
        this.materials.ground.space = new THREE.MeshLambertMaterial({ 
            color: 0x000000,
            emissive: 0x110000,
            emissiveIntensity: 0.1
        });
        this.materials.walls.space = new THREE.MeshLambertMaterial({ 
            color: 0x8b0000,
            emissive: 0x440000,
            emissiveIntensity: 0.2
        });
        this.materials.accents.space = new THREE.MeshLambertMaterial({ 
            color: 0xff0000,
            emissive: 0x440000,
            emissiveIntensity: 0.4
        });
        
        // Special effect materials
        this.materials.special.glow = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        this.materials.special.wireframe = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.6
        });
    }
    
    createArena(levelConfig) {
        // Clear existing arena
        this.clearArena();
        
        const theme = levelConfig.theme;
        
        // Create base arena structure
        this.createArenaBase(theme);
        
        // Create theme-specific elements
        switch(theme) {
            case 'candy':
                this.createCandyArena(levelConfig);
                break;
            case 'forest':
                this.createForestArena(levelConfig);
                break;
            case 'volcano':
                this.createVolcanoArena(levelConfig);
                break;
            case 'ice':
                this.createIceArena(levelConfig);
                break;
            case 'cyber':
                this.createCyberArena(levelConfig);
                break;
            case 'storm':
                this.createStormArena(levelConfig);
                break;
            case 'space':
                this.createSpaceArena(levelConfig);
                break;
        }
        
        // Setup lighting for theme
        this.setupLighting(theme, levelConfig.colors);
        
        // Add environmental decorations
        this.addEnvironmentalElements(theme);
        
        this.currentArena = { theme, config: levelConfig };
        
        console.log(`Arena created: ${levelConfig.name} (${theme})`);
    }
    
    createArenaBase(theme) {
        // Create main arena floor
        const floorGeometry = new THREE.CircleGeometry(this.arenaSize, 32);
        const floorMaterial = this.materials.ground[theme];
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.arenaObjects.push(floor);
        
        // Create arena walls (invisible barriers)
        const wallGeometry = new THREE.CylinderGeometry(this.arenaSize, this.arenaSize, this.wallHeight, 32, 1, true);
        const wallMaterial = this.materials.walls[theme];
        wallMaterial.transparent = true;
        wallMaterial.opacity = 0.3;
        const walls = new THREE.Mesh(wallGeometry, wallMaterial);
        walls.position.y = this.wallHeight / 2;
        this.scene.add(walls);
        this.arenaObjects.push(walls);
        
        // Create outer platform ring for larger arenas
        if (this.arenaSize > 15) {
            const outerRingGeometry = new THREE.RingGeometry(this.arenaSize * 0.8, this.arenaSize * 1.2, 32);
            const outerRingMaterial = this.materials.accents[theme];
            const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
            outerRing.rotation.x = -Math.PI / 2;
            outerRing.position.y = -0.1;
            this.scene.add(outerRing);
            this.arenaObjects.push(outerRing);
        }
    }
    
    createCandyArena(levelConfig) {
        // Create candy-themed platforms
        const platformPositions = [
            { x: 0, z: 8, width: 4, height: 1 },
            { x: 8, z: 0, width: 4, height: 1 },
            { x: -8, z: 0, width: 4, height: 1 },
            { x: 0, z: -8, width: 4, height: 1 }
        ];
        
        platformPositions.forEach(pos => {
            const platformGeometry = new THREE.BoxGeometry(pos.width, pos.height, pos.width);
            const platformMaterial = this.materials.accents.candy;
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(pos.x, pos.height / 2, pos.z);
            platform.castShadow = true;
            platform.receiveShadow = true;
            this.scene.add(platform);
            this.arenaObjects.push(platform);
        });
        
        // Add candy decorations
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 12;
            const candyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
            const candyMaterial = new THREE.MeshLambertMaterial({ 
                color: i % 2 === 0 ? 0xff1493 : 0x00ff7f 
            });
            const candy = new THREE.Mesh(candyGeometry, candyMaterial);
            candy.position.set(
                Math.cos(angle) * radius,
                1,
                Math.sin(angle) * radius
            );
            this.scene.add(candy);
            this.environmentalObjects.push(candy);
        }
    }
    
    createForestArena(levelConfig) {
        // Create tree-like pillars
        const treePositions = [
            { x: 6, z: 6 }, { x: -6, z: 6 }, { x: 6, z: -6 }, { x: -6, z: -6 },
            { x: 10, z: 0 }, { x: -10, z: 0 }, { x: 0, z: 10 }, { x: 0, z: -10 }
        ];
        
        treePositions.forEach(pos => {
            // Tree trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.8, 1.2, 6, 8);
            const trunkMaterial = this.materials.walls.forest;
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(pos.x, 3, pos.z);
            trunk.castShadow = true;
            this.scene.add(trunk);
            this.arenaObjects.push(trunk);
            
            // Tree crown
            const crownGeometry = new THREE.SphereGeometry(2, 8, 6);
            const crownMaterial = this.materials.accents.forest;
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.set(pos.x, 7, pos.z);
            crown.castShadow = true;
            this.scene.add(crown);
            this.arenaObjects.push(crown);
        });
        
        // Create elevated platforms connecting trees
        const platformData = [
            { start: { x: 6, z: 6 }, end: { x: -6, z: 6 } },
            { start: { x: -6, z: 6 }, end: { x: -6, z: -6 } },
            { start: { x: -6, z: -6 }, end: { x: 6, z: -6 } },
            { start: { x: 6, z: -6 }, end: { x: 6, z: 6 } }
        ];
        
        platformData.forEach(data => {
            const midpoint = {
                x: (data.start.x + data.end.x) / 2,
                z: (data.start.z + data.end.z) / 2
            };
            const distance = Math.sqrt(
                Math.pow(data.end.x - data.start.x, 2) + 
                Math.pow(data.end.z - data.start.z, 2)
            );
            
            const platformGeometry = new THREE.BoxGeometry(distance, 0.5, 2);
            const platformMaterial = this.materials.walls.forest;
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(midpoint.x, 4, midpoint.z);
            
            // Rotate to align with connection
            const angle = Math.atan2(data.end.z - data.start.z, data.end.x - data.start.x);
            platform.rotation.y = angle;
            
            platform.castShadow = true;
            platform.receiveShadow = true;
            this.scene.add(platform);
            this.platforms.push(platform);
            this.arenaObjects.push(platform);
        });
    }
    
    createVolcanoArena(levelConfig) {
        // Create central volcano structure
        const volcanoGeometry = new THREE.ConeGeometry(6, 8, 8);
        const volcanoMaterial = this.materials.walls.volcano;
        const volcano = new THREE.Mesh(volcanoGeometry, volcanoMaterial);
        volcano.position.set(0, 4, 0);
        volcano.castShadow = true;
        this.scene.add(volcano);
        this.arenaObjects.push(volcano);
        
        // Create floating platforms around volcano
        const platformAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        platformAngles.forEach((angle, index) => {
            const radius = 12;
            const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.8, 8);
            const platformMaterial = this.materials.ground.volcano;
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(
                Math.cos(angle) * radius,
                2 + Math.sin(index * 0.5) * 2,
                Math.sin(angle) * radius
            );
            platform.castShadow = true;
            platform.receiveShadow = true;
            this.scene.add(platform);
            this.platforms.push(platform);
            this.arenaObjects.push(platform);
        });
        
        // Add lava pools
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const radius = 8;
            const lavaGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 8);
            const lavaMaterial = this.materials.accents.volcano;
            const lava = new THREE.Mesh(lavaGeometry, lavaMaterial);
            lava.position.set(
                Math.cos(angle) * radius,
                0.1,
                Math.sin(angle) * radius
            );
            this.scene.add(lava);
            this.environmentalObjects.push(lava);
        }
    }
    
    createIceArena(levelConfig) {
        // Create ice crystal formations
        const crystalPositions = [
            { x: 0, z: 12 }, { x: 12, z: 0 }, { x: 0, z: -12 }, { x: -12, z: 0 },
            { x: 8, z: 8 }, { x: -8, z: 8 }, { x: 8, z: -8 }, { x: -8, z: -8 }
        ];
        
        crystalPositions.forEach(pos => {
            const crystalGeometry = new THREE.ConeGeometry(1.5, 5, 6);
            const crystalMaterial = this.materials.accents.ice;
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            crystal.position.set(pos.x, 2.5, pos.z);
            crystal.castShadow = true;
            this.scene.add(crystal);
            this.arenaObjects.push(crystal);
        });
        
        // Create slippery ice patches
        const icePatches = [
            { x: 4, z: 4, size: 3 },
            { x: -4, z: 4, size: 3 },
            { x: 4, z: -4, size: 3 },
            { x: -4, z: -4, size: 3 },
            { x: 0, z: 0, size: 4 }
        ];
        
        icePatches.forEach(patch => {
            const patchGeometry = new THREE.CylinderGeometry(patch.size, patch.size, 0.05, 8);
            const patchMaterial = this.materials.ground.ice;
            const icePatch = new THREE.Mesh(patchGeometry, patchMaterial);
            icePatch.position.set(patch.x, 0.05, patch.z);
            this.scene.add(icePatch);
            this.environmentalObjects.push(icePatch);
        });
    }
    
    createCyberArena(levelConfig) {
        // Create wireframe grid floor overlay
        const gridSize = 40;
        const gridGeometry = new THREE.PlaneGeometry(gridSize, gridSize, 20, 20);
        const gridMaterial = this.materials.special.wireframe;
        const grid = new THREE.Mesh(gridGeometry, gridMaterial);
        grid.rotation.x = -Math.PI / 2;
        grid.position.y = 0.01;
        this.scene.add(grid);
        this.arenaObjects.push(grid);
        
        // Create neon pillars
        const pillarPositions = [
            { x: 8, z: 8 }, { x: -8, z: 8 }, { x: 8, z: -8 }, { x: -8, z: -8 }
        ];
        
        pillarPositions.forEach(pos => {
            const pillarGeometry = new THREE.BoxGeometry(1, 8, 1);
            const pillarMaterial = this.materials.accents.cyber;
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(pos.x, 4, pos.z);
            pillar.castShadow = true;
            this.scene.add(pillar);
            this.arenaObjects.push(pillar);
            
            // Add glow effect
            const glowGeometry = new THREE.BoxGeometry(1.2, 8.2, 1.2);
            const glowMaterial = this.materials.special.glow;
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.set(pos.x, 4, pos.z);
            this.scene.add(glow);
            this.environmentalObjects.push(glow);
        });
        
        // Create floating platforms with neon edges
        const platformPositions = [
            { x: 0, z: 10, y: 3 },
            { x: 10, z: 0, y: 3 },
            { x: 0, z: -10, y: 3 },
            { x: -10, z: 0, y: 3 }
        ];
        
        platformPositions.forEach(pos => {
            const platformGeometry = new THREE.BoxGeometry(4, 0.5, 4);
            const platformMaterial = this.materials.ground.cyber;
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(pos.x, pos.y, pos.z);
            platform.castShadow = true;
            platform.receiveShadow = true;
            this.scene.add(platform);
            this.platforms.push(platform);
            this.arenaObjects.push(platform);
        });
    }
    
    createStormArena(levelConfig) {
        // Create rocky outcroppings
        const rockPositions = [
            { x: 6, z: 6, scale: 1.5 },
            { x: -6, z: 6, scale: 1.2 },
            { x: 6, z: -6, scale: 1.8 },
            { x: -6, z: -6, scale: 1.3 },
            { x: 0, z: 10, scale: 1.0 },
            { x: 10, z: 0, scale: 1.1 },
            { x: 0, z: -10, scale: 1.4 },
            { x: -10, z: 0, scale: 1.6 }
        ];
        
        rockPositions.forEach(pos => {
            const rockGeometry = new THREE.DodecahedronGeometry(2, 0);
            const rockMaterial = this.materials.walls.storm;
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(pos.x, 1, pos.z);
            rock.scale.setScalar(pos.scale);
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            this.scene.add(rock);
            this.arenaObjects.push(rock);
        });
        
        // Create storm clouds (visual only)
        for (let i = 0; i < 8; i++) {
            const cloudGeometry = new THREE.SphereGeometry(3, 8, 6);
            const cloudMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x444444,
                transparent: true,
                opacity: 0.6
            });
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 40,
                15 + Math.random() * 5,
                (Math.random() - 0.5) * 40
            );
            cloud.scale.set(
                1 + Math.random() * 0.5,
                0.6 + Math.random() * 0.3,
                1 + Math.random() * 0.5
            );
            this.scene.add(cloud);
            this.environmentalObjects.push(cloud);
        }
    }
    
    createSpaceArena(levelConfig) {
        // Create the main platform floating in space
        const mainPlatformGeometry = new THREE.CylinderGeometry(15, 15, 1, 16);
        const mainPlatformMaterial = this.materials.ground.space;
        const mainPlatform = new THREE.Mesh(mainPlatformGeometry, mainPlatformMaterial);
        mainPlatform.position.y = 0.5;
        mainPlatform.castShadow = true;
        mainPlatform.receiveShadow = true;
        this.scene.add(mainPlatform);
        this.arenaObjects.push(mainPlatform);
        
        // Create smaller floating platforms
        const smallPlatforms = [
            { x: 8, z: 8, y: 4 },
            { x: -8, z: 8, y: 3 },
            { x: 8, z: -8, y: 5 },
            { x: -8, z: -8, y: 3.5 }
        ];
        
        smallPlatforms.forEach(pos => {
            const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.8, 8);
            const platformMaterial = this.materials.walls.space;
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(pos.x, pos.y, pos.z);
            platform.castShadow = true;
            platform.receiveShadow = true;
            this.scene.add(platform);
            this.platforms.push(platform);
            this.arenaObjects.push(platform);
        });
        
        // Create energy barriers
        const barrierPositions = [
            { x: 0, z: 12 }, { x: 12, z: 0 }, { x: 0, z: -12 }, { x: -12, z: 0 }
        ];
        
        barrierPositions.forEach(pos => {
            const barrierGeometry = new THREE.BoxGeometry(1, 6, 1);
            const barrierMaterial = this.materials.accents.space;
            const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            barrier.position.set(pos.x, 3, pos.z);
            this.scene.add(barrier);
            this.arenaObjects.push(barrier);
        });
        
        // Add distant stars
        this.createStarField();
    }
    
    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 200;
            positions[i3 + 1] = (Math.random() - 0.5) * 200;
            positions[i3 + 2] = (Math.random() - 0.5) * 200;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
        this.environmentalObjects.push(stars);
    }
    
    setupLighting(theme, colors) {
        // Clear existing lighting
        if (this.lightingSetup) {
            this.lightingSetup.forEach(light => {
                this.scene.remove(light);
            });
        }
        this.lightingSetup = [];
        
        // Set scene background
        this.scene.background = new THREE.Color(colors.ambient);
        
        // Create theme-appropriate lighting
        switch(theme) {
            case 'candy':
                this.setupCandyLighting(colors);
                break;
            case 'forest':
                this.setupForestLighting(colors);
                break;
            case 'volcano':
                this.setupVolcanoLighting(colors);
                break;
            case 'ice':
                this.setupIceLighting(colors);
                break;
            case 'cyber':
                this.setupCyberLighting(colors);
                break;
            case 'storm':
                this.setupStormLighting(colors);
                break;
            case 'space':
                this.setupSpaceLighting(colors);
                break;
        }
    }
    
    setupCandyLighting(colors) {
        // Soft ambient light
        const ambientLight = new THREE.AmbientLight(colors.ambient, 0.6);
        this.scene.add(ambientLight);
        this.lightingSetup.push(ambientLight);
        
        // Warm directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        this.lightingSetup.push(directionalLight);
        
        // Colored point lights for ambiance
        const pointLight1 = new THREE.PointLight(colors.accent, 0.5, 30);
        pointLight1.position.set(8, 5, 8);
        this.scene.add(pointLight1);
        this.lightingSetup.push(pointLight1);
        
        const pointLight2 = new THREE.PointLight(colors.ground, 0.5, 30);
        pointLight2.position.set(-8, 5, -8);
        this.scene.add(pointLight2);
        this.lightingSetup.push(pointLight2);
    }
    
    setupForestLighting(colors) {
        // Dim ambient light for forest atmosphere
        const ambientLight = new THREE.AmbientLight(colors.ambient, 0.3);
        this.scene.add(ambientLight);
        this.lightingSetup.push(ambientLight);
        
        // Filtered directional light
        const directionalLight = new THREE.DirectionalLight(0x90ee90, 0.6);
        directionalLight.position.set(15, 25, 15);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        this.lightingSetup.push(directionalLight);
        
        // Add fog for atmosphere
        this.scene.fog = new THREE.Fog(colors.ambient, 10, 50);
    }
    
    setupVolcanoLighting(colors) {
        // Warm ambient light
        const ambientLight = new THREE.AmbientLight(colors.ambient, 0.4);
        this.scene.add(ambientLight);
        this.lightingSetup.push(ambientLight);
        
        // Strong directional light
        const directionalLight = new THREE.DirectionalLight(0xff6600, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        this.lightingSetup.push(directionalLight);
        
        // Lava glow point lights
        const lavaLight1 = new THREE.PointLight(colors.accent, 1, 25);
        lavaLight1.position.set(0, 2, 0);
        this.scene.add(lavaLight1);
        this.lightingSetup.push(lavaLight1);
        
        const lavaLight2 = new THREE.PointLight(colors.accent, 0.8, 20);
        lavaLight2.position.set(8, 1, 8);
        this.scene.add(lavaLight2);
        this.lightingSetup.push(lavaLight2);
    }
    
    setupIceLighting(colors) {
        // Cool ambient light
        const ambientLight = new THREE.AmbientLight(colors.ambient, 0.5);
        this.scene.add(ambientLight);
        this.lightingSetup.push(ambientLight);
        
        // Bright directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        this.lightingSetup.push(directionalLight);
        
        // Crystal reflection lights
        const crystalLight1 = new THREE.PointLight(colors.accent, 0.6, 20);
        crystalLight1.position.set(12, 5, 0);
        this.scene.add(crystalLight1);
        this.lightingSetup.push(crystalLight1);
        
        const crystalLight2 = new THREE.PointLight(colors.accent, 0.6, 20);
        crystalLight2.position.set(-12, 5, 0);
        this.scene.add(crystalLight2);
        this.lightingSetup.push(crystalLight2);
    }
    
    setupCyberLighting(colors) {
        // Dark ambient light
        const ambientLight = new THREE.AmbientLight(colors.ambient, 0.2);
        this.scene.add(ambientLight);
        this.lightingSetup.push(ambientLight);
        
        // Neon directional light
        const directionalLight = new THREE.DirectionalLight(colors.accent, 0.7);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        this.lightingSetup.push(directionalLight);
        
        // Neon pillar lights
        const pillarPositions = [
            { x: 8, z: 8 }, { x: -8, z: 8 }, { x: 8, z: -8 }, { x: -8, z: -8 }
        ];
        
        pillarPositions.forEach(pos => {
            const neonLight = new THREE.PointLight(colors.accent, 1, 15);
            neonLight.position.set(pos.x, 4, pos.z);
            this.scene.add(neonLight);
            this.lightingSetup.push(neonLight);
        });
    }
    
    setupStormLighting(colors) {
        // Dark ambient light
        const ambientLight = new THREE.AmbientLight(colors.ambient, 0.3);
        this.scene.add(ambientLight);
        this.lightingSetup.push(ambientLight);
        
        // Dim directional light
        const directionalLight = new THREE.DirectionalLight(0x666666, 0.5);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        this.lightingSetup.push(directionalLight);
        
        // Lightning effect light (will be animated)
        this.lightningLight = new THREE.PointLight(colors.accent, 0, 50);
        this.lightningLight.position.set(0, 30, 0);
        this.scene.add(this.lightningLight);
        this.lightingSetup.push(this.lightningLight);
    }
    
    setupSpaceLighting(colors) {
        // Very dark ambient light
        const ambientLight = new THREE.AmbientLight(colors.ambient, 0.1);
        this.scene.add(ambientLight);
        this.lightingSetup.push(ambientLight);
        
        // Harsh directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(20, 30, 20);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        this.lightingSetup.push(directionalLight);
        
        // Red energy lights
        const energyLight1 = new THREE.PointLight(colors.accent, 0.8, 25);
        energyLight1.position.set(0, 5, 12);
        this.scene.add(energyLight1);
        this.lightingSetup.push(energyLight1);
        
        const energyLight2 = new THREE.PointLight(colors.accent, 0.8, 25);
        energyLight2.position.set(12, 5, 0);
        this.scene.add(energyLight2);
        this.lightingSetup.push(energyLight2);
    }
    
    addEnvironmentalElements(theme) {
        // Add theme-specific environmental elements
        switch(theme) {
            case 'storm':
                this.addStormEffects();
                break;
            case 'space':
                this.addSpaceEffects();
                break;
            case 'volcano':
                this.addVolcanoEffects();
                break;
            case 'cyber':
                this.addCyberEffects();
                break;
        }
    }
    
    addStormEffects() {
        // Lightning animation will be handled by battle system
        // Add wind effect (particle system would go here)
    }
    
    addSpaceEffects() {
        // Rotating space debris
        for (let i = 0; i < 5; i++) {
            const debrisGeometry = new THREE.DodecahedronGeometry(0.5, 0);
            const debrisMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            debris.position.set(
                (Math.random() - 0.5) * 60,
                20 + Math.random() * 10,
                (Math.random() - 0.5) * 60
            );
            debris.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            this.scene.add(debris);
            this.environmentalObjects.push(debris);
        }
    }
    
    addVolcanoEffects() {
        // Particle system for lava bubbles would go here
        // For now, just add some glowing embers
        for (let i = 0; i < 20; i++) {
            const emberGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const emberMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff4500,
                emissive: 0xff2200,
                emissiveIntensity: 0.5
            });
            const ember = new THREE.Mesh(emberGeometry, emberMaterial);
            ember.position.set(
                (Math.random() - 0.5) * 20,
                Math.random() * 15,
                (Math.random() - 0.5) * 20
            );
            this.scene.add(ember);
            this.environmentalObjects.push(ember);
        }
    }
    
    addCyberEffects() {
        // Add flowing data streams
        for (let i = 0; i < 6; i++) {
            const streamGeometry = new THREE.BoxGeometry(0.2, 0.2, 20);
            const streamMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff,
                transparent: true,
                opacity: 0.6
            });
            const stream = new THREE.Mesh(streamGeometry, streamMaterial);
            stream.position.set(
                (Math.random() - 0.5) * 30,
                2 + Math.random() * 8,
                0
            );
            stream.rotation.y = Math.random() * Math.PI;
            this.scene.add(stream);
            this.environmentalObjects.push(stream);
        }
    }
    
    update(deltaTime) {
        // Update animated environmental elements
        this.updateAnimatedElements(deltaTime);
        
        // Update lighting effects
        this.updateLightingEffects(deltaTime);
    }
    
    updateAnimatedElements(deltaTime) {
        if (!this.currentArena) return;
        
        const theme = this.currentArena.theme;
        const time = Date.now() * 0.001;
        
        switch(theme) {
            case 'space':
                // Rotate space debris
                this.environmentalObjects.forEach((obj, index) => {
                    if (obj.geometry && obj.geometry.type === 'DodecahedronGeometry') {
                        obj.rotation.x += deltaTime * 0.5;
                        obj.rotation.y += deltaTime * 0.3;
                        obj.rotation.z += deltaTime * 0.2;
                    }
                });
                break;
                
            case 'volcano':
                // Animate lava glow
                this.environmentalObjects.forEach((obj, index) => {
                    if (obj.material && obj.material.emissive) {
                        const intensity = 0.3 + Math.sin(time * 2 + index) * 0.2;
                        obj.material.emissiveIntensity = intensity;
                    }
                });
                break;
                
            case 'cyber':
                // Animate data streams
                this.environmentalObjects.forEach((obj, index) => {
                    if (obj.geometry && obj.geometry.type === 'BoxGeometry') {
                        obj.position.z = Math.sin(time * 2 + index) * 10;
                        const opacity = 0.4 + Math.sin(time * 3 + index) * 0.3;
                        obj.material.opacity = opacity;
                    }
                });
                break;
        }
    }
    
    updateLightingEffects(deltaTime) {
        if (!this.currentArena) return;
        
        const theme = this.currentArena.theme;
        const time = Date.now() * 0.001;
        
        switch(theme) {
            case 'storm':
                // Lightning flicker effect
                if (this.lightningLight) {
                    if (Math.random() < 0.01) { // 1% chance per frame
                        this.lightningLight.intensity = 5;
                        setTimeout(() => {
                            this.lightningLight.intensity = 0;
                        }, 100);
                    }
                }
                break;
                
            case 'volcano':
                // Lava light pulsing
                this.lightingSetup.forEach(light => {
                    if (light.color && light.color.r > 0.5) {
                        light.intensity = 0.8 + Math.sin(time * 2) * 0.3;
                    }
                });
                break;
                
            case 'cyber':
                // Neon light pulsing
                this.lightingSetup.forEach(light => {
                    if (light.color && light.color.b > 0.5) {
                        light.intensity = 0.8 + Math.sin(time * 3) * 0.4;
                    }
                });
                break;
        }
    }
    
    clearArena() {
        // Remove all arena objects
        this.arenaObjects.forEach(obj => {
            this.scene.remove(obj);
        });
        this.arenaObjects = [];
        
        this.platforms.forEach(platform => {
            this.scene.remove(platform);
        });
        this.platforms = [];
        
        this.environmentalObjects.forEach(obj => {
            this.scene.remove(obj);
        });
        this.environmentalObjects = [];
        
        // Clear lighting
        if (this.lightingSetup) {
            this.lightingSetup.forEach(light => {
                this.scene.remove(light);
            });
            this.lightingSetup = null;
        }
        
        // Clear fog
        if (this.scene) {
            this.scene.fog = null;
            // Reset background
            this.scene.background = null;
        }
        
        this.currentArena = null;
    }
    
    getCurrentArena() {
        return this.currentArena;
    }
    
    getPlatforms() {
        return this.platforms;
    }
    
    getEnvironmentalObjects() {
        return this.environmentalObjects;
    }
} 