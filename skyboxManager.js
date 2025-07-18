import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class SkyboxManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.currentSkybox = null;
        this.skyboxObjects = [];
        this.animatedElements = [];
        
        // Initialize skybox themes
        this.themes = {
            // Default theme for main menu
            default: {
                type: 'gradient',
                colors: [0x87CEEB, 0x4682B4, 0x191970],
                fog: { color: 0x87CEEB, near: 50, far: 200 }
            },
            
            // Single-player game themes by level
            level1: {
                type: 'forest',
                colors: [0x87CEEB, 0x228B22, 0x006400],
                fog: { color: 0x228B22, near: 40, far: 150 }
            },
            level2: {
                type: 'mountain',
                colors: [0x87CEEB, 0x8B7355, 0x696969],
                fog: { color: 0x8B7355, near: 60, far: 200 }
            },
            level3: {
                type: 'desert',
                colors: [0xFFE4B5, 0xDEB887, 0xD2691E],
                fog: { color: 0xDEB887, near: 50, far: 180 }
            },
            level4: {
                type: 'mystical',
                colors: [0x4B0082, 0x8A2BE2, 0xDA70D6],
                fog: { color: 0x8A2BE2, near: 30, far: 120 }
            },
            level5: {
                type: 'volcanic',
                colors: [0x8B0000, 0xFF4500, 0xFFD700],
                fog: { color: 0xFF4500, near: 25, far: 100 }
            },
            level6: {
                type: 'space',
                colors: [0x000000, 0x191970, 0x4B0082],
                fog: { color: 0x191970, near: 80, far: 300 }
            },
            
            // Pacman themes
            pacman: {
                type: 'neon',
                colors: [0x0a0a1a, 0x000033, 0x000000],
                fog: { color: 0x000033, near: 20, far: 80 }
            },
            
            // Battle mode themes
            battle_jungle: {
                type: 'jungle',
                colors: [0x228B22, 0x006400, 0x004d00],
                fog: { color: 0x1B4332, near: 25, far: 60 }
            },
            battle_volcano: {
                type: 'volcanic',
                colors: [0x8B0000, 0xFF4500, 0xFFD700],
                fog: { color: 0x660000, near: 20, far: 55 }
            },
            battle_sky: {
                type: 'sky',
                colors: [0x87CEEB, 0x4682B4, 0x1E90FF],
                fog: { color: 0x87CEEB, near: 30, far: 80 }
            },
            battle_desert: {
                type: 'desert',
                colors: [0xFFE4B5, 0xDEB887, 0xD2691E],
                fog: { color: 0xDEB887, near: 22, far: 65 }
            },
            battle_neon: {
                type: 'neon',
                colors: [0x0F0F23, 0x1A1A2E, 0x000000],
                fog: { color: 0x0F0F23, near: 18, far: 50 }
            },
            battle_islands: {
                type: 'sky',
                colors: [0xB0E0E6, 0x87CEEB, 0x4682B4],
                fog: { color: 0xB0E0E6, near: 30, far: 90 }
            },
            battle_magma: {
                type: 'volcanic',
                colors: [0x8B0000, 0xFF4500, 0xFFD700],
                fog: { color: 0x8B0000, near: 15, far: 55 }
            },
            battle_pirate: {
                type: 'ocean',
                colors: [0x87CEEB, 0x4682B4, 0x2F4F4F],
                fog: { color: 0x4682B4, near: 25, far: 75 }
            }
        };
    }

    // Set skybox theme
    setSkyboxTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Skybox theme '${themeName}' not found, using default`);
            themeName = 'default';
        }

        this.clearSkybox();
        const theme = this.themes[themeName];
        
        // Set fog
        this.scene.fog = new THREE.Fog(theme.fog.color, theme.fog.near, theme.fog.far);
        
        // Create skybox based on type
        switch (theme.type) {
            case 'gradient':
                this.createGradientSkybox(theme.colors);
                break;
            case 'forest':
                this.createForestSkybox(theme.colors);
                break;
            case 'mountain':
                this.createMountainSkybox(theme.colors);
                break;
            case 'desert':
                this.createDesertSkybox(theme.colors);
                break;
            case 'mystical':
                this.createMysticalSkybox(theme.colors);
                break;
            case 'volcanic':
                this.createVolcanicSkybox(theme.colors);
                break;
            case 'space':
                this.createSpaceSkybox(theme.colors);
                break;
            case 'neon':
                this.createNeonSkybox(theme.colors);
                break;
            case 'jungle':
                this.createJungleSkybox(theme.colors);
                break;
            case 'sky':
                this.createSkySkybox(theme.colors);
                break;
            case 'ocean':
                this.createOceanSkybox(theme.colors);
                break;
            default:
                this.createGradientSkybox(theme.colors);
        }
        
        this.currentSkybox = themeName;
        console.log(`🌅 Skybox theme set to: ${themeName}`);
    }

    // Create gradient skybox
    createGradientSkybox(colors) {
        const skyGeometry = new THREE.SphereGeometry(500, 32, 16);
        const skyMaterial = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: {
                topColor: { value: new THREE.Color(colors[0]) },
                middleColor: { value: new THREE.Color(colors[1]) },
                bottomColor: { value: new THREE.Color(colors[2]) },
                offset: { value: 0.33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 middleColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition).y;
                    float h1 = max(0.0, h);
                    float h2 = max(0.0, -h);
                    vec3 color = mix(middleColor, topColor, pow(h1, exponent));
                    color = mix(color, bottomColor, pow(h2, exponent));
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });
        
        const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(skyMesh);
        this.skyboxObjects.push(skyMesh);
    }

    // Create forest skybox
    createForestSkybox(colors) {
        this.createGradientSkybox(colors);
        
        // Add floating particles (leaves)
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 200;
            positions[i3 + 1] = Math.random() * 50 + 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 200;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x90EE90,
            size: 0.8,
            transparent: true,
            opacity: 0.6
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        this.skyboxObjects.push(particles);
        this.animatedElements.push({
            mesh: particles,
            type: 'float',
            speed: 0.5
        });
    }

    // Create volcanic skybox
    createVolcanicSkybox(colors) {
        this.createGradientSkybox(colors);
        
        // Add floating ash particles
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 300;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 200;
            positions[i3 + 1] = Math.random() * 100 + 20;
            positions[i3 + 2] = (Math.random() - 0.5) * 200;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xFF4500,
            size: 1.2,
            transparent: true,
            opacity: 0.8
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        this.skyboxObjects.push(particles);
        this.animatedElements.push({
            mesh: particles,
            type: 'rise',
            speed: 1.0
        });
    }

    // Create space skybox
    createSpaceSkybox(colors) {
        this.createGradientSkybox(colors);
        
        // Add stars
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 1000;
            positions[i3 + 1] = (Math.random() - 0.5) * 1000;
            positions[i3 + 2] = (Math.random() - 0.5) * 1000;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1.5,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
        this.skyboxObjects.push(stars);
        this.animatedElements.push({
            mesh: stars,
            type: 'twinkle',
            speed: 0.5
        });
        
        // Add distant planets
        const planetGeometry = new THREE.SphereGeometry(8, 16, 16);
        const planetMaterial = new THREE.MeshBasicMaterial({
            color: 0x4169E1,
            transparent: true,
            opacity: 0.7
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.set(150, 80, -200);
        this.scene.add(planet);
        this.skyboxObjects.push(planet);
    }

    // Create neon skybox
    createNeonSkybox(colors) {
        this.createGradientSkybox(colors);
        
        // Add neon grid lines
        const gridSize = 50;
        const gridDivisions = 20;
        
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x00FFFF, 0xFF00FF);
        gridHelper.position.y = -20;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;
        this.scene.add(gridHelper);
        this.skyboxObjects.push(gridHelper);
        
        // Add floating neon particles
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 150;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = Math.random() * 50 + 5;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00FFFF,
            size: 2.0,
            transparent: true,
            opacity: 0.8
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        this.skyboxObjects.push(particles);
        this.animatedElements.push({
            mesh: particles,
            type: 'pulse',
            speed: 2.0
        });
    }

    // Create other skybox types
    createMountainSkybox(colors) { this.createGradientSkybox(colors); }
    createDesertSkybox(colors) { this.createGradientSkybox(colors); }
    createMysticalSkybox(colors) { this.createGradientSkybox(colors); }
    createJungleSkybox(colors) { this.createForestSkybox(colors); }
    createSkySkybox(colors) { this.createGradientSkybox(colors); }
    createOceanSkybox(colors) { this.createGradientSkybox(colors); }

    // Update animated elements
    update(deltaTime) {
        const time = Date.now() * 0.001;
        
        this.animatedElements.forEach(element => {
            switch (element.type) {
                case 'float':
                    element.mesh.rotation.y += deltaTime * element.speed * 0.1;
                    break;
                case 'rise':
                    element.mesh.rotation.y += deltaTime * element.speed * 0.05;
                    break;
                case 'twinkle':
                    element.mesh.material.opacity = 0.6 + Math.sin(time * element.speed) * 0.2;
                    break;
                case 'pulse':
                    element.mesh.material.opacity = 0.6 + Math.sin(time * element.speed) * 0.3;
                    break;
            }
        });
    }

    // Clear current skybox
    clearSkybox() {
        this.skyboxObjects.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        this.skyboxObjects = [];
        this.animatedElements = [];
        if (this.scene) {
            this.scene.fog = null;
        }
    }

    // Get theme for game mode and level
    getThemeForLevel(gameMode, level) {
        switch (gameMode) {
            case 'pacman':
            case 'pacman_classic':
                return 'pacman';
            case 'battle':
                return 'battle_jungle'; // Default battle theme
            case 'multiplayer':
                return 'battle_jungle'; // Default multiplayer theme
            default:
                return `level${level}`;
        }
    }

    // Get theme for battle arena
    getBattleTheme(arenaName) {
        const themeMap = {
            'Jungle Temple': 'battle_jungle',
            'Volcanic Crater': 'battle_volcano',
            'Sky Sanctuary': 'battle_sky',
            'Desert Ruins': 'battle_desert',
            'Neon Grid': 'battle_neon',
            'Floating Islands': 'battle_islands',
            'Magma Core': 'battle_magma',
            'Pirate Ship': 'battle_pirate'
        };
        return themeMap[arenaName] || 'battle_jungle';
    }
} 