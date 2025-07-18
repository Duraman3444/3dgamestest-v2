import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class GraphicsEnhancer {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.enhancedMaterials = new Map();
        this.particleSystems = [];
        this.environmentEffects = [];
        
        // Initialize enhanced renderer settings
        this.setupEnhancedRenderer();
    }

    setupEnhancedRenderer() {
        // Enhanced renderer settings for better quality
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        
        // Enhanced tone mapping and color space
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Enhanced pixel ratio and anti-aliasing
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable high-quality features
        this.renderer.useLegacyLights = false;
        this.renderer.physicallyCorrectLights = true;
        
        console.log('🎨 Graphics enhancer initialized with premium settings');
    }

    // Create enhanced material for different surface types
    createEnhancedMaterial(type, baseColor, options = {}) {
        const materialKey = `${type}_${baseColor.toString(16)}`;
        
        if (this.enhancedMaterials.has(materialKey)) {
            return this.enhancedMaterials.get(materialKey).clone();
        }
        
        let material;
        
        switch (type) {
            case 'metal':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.9,
                    roughness: 0.1,
                    envMapIntensity: 1.0,
                    ...options
                });
                break;
                
            case 'plastic':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.3,
                    envMapIntensity: 0.5,
                    ...options
                });
                break;
                
            case 'gem':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.0,
                    transparent: true,
                    opacity: 0.8,
                    envMapIntensity: 1.5,
                    ...options
                });
                break;
                
            case 'stone':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.8,
                    envMapIntensity: 0.3,
                    ...options
                });
                break;
                
            case 'glow':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    emissive: baseColor,
                    emissiveIntensity: 0.3,
                    metalness: 0.0,
                    roughness: 0.5,
                    ...options
                });
                break;
                
            case 'hologram':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    transparent: true,
                    opacity: 0.6,
                    emissive: baseColor,
                    emissiveIntensity: 0.2,
                    metalness: 0.0,
                    roughness: 0.0,
                    ...options
                });
                break;
                
            case 'slime':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    transparent: true,
                    opacity: 0.85,
                    metalness: 0.0,
                    roughness: 0.1,
                    envMapIntensity: 0.8,
                    emissive: new THREE.Color(baseColor).multiplyScalar(0.1),
                    emissiveIntensity: 0.15,
                    ...options
                });
                break;
                
            case 'mud':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.9,
                    envMapIntensity: 0.2,
                    emissive: new THREE.Color(baseColor).multiplyScalar(0.05),
                    emissiveIntensity: 0.1,
                    ...options
                });
                break;
                
            default:
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.5,
                    ...options
                });
        }
        
        this.enhancedMaterials.set(materialKey, material);
        return material.clone();
    }

    // Enhance existing meshes in the scene
    enhanceSceneMaterials(gameMode = 'normal') {
        this.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                this.enhanceMeshMaterial(child, gameMode);
            }
        });
    }

    enhanceMeshMaterial(mesh, gameMode) {
        if (!mesh.material.color) return;
        
        const baseColor = mesh.material.color.getHex();
        const meshName = mesh.name.toLowerCase();
        
        // Determine material type based on mesh name and game mode
        let materialType = 'plastic';
        
        if (meshName.includes('slime')) {
            materialType = 'slime';
        } else if (meshName.includes('mud')) {
            materialType = 'mud';
        } else if (meshName.includes('ground') || meshName.includes('platform') || meshName.includes('tile')) {
            materialType = 'stone';
        } else if (meshName.includes('metal') || meshName.includes('arena') || meshName.includes('obstacle')) {
            materialType = 'metal';
        } else if (meshName.includes('collectible') || meshName.includes('coin') || meshName.includes('pebble')) {
            materialType = 'gem';
        } else if (meshName.includes('glow') || meshName.includes('neon') || meshName.includes('light')) {
            materialType = 'glow';
        } else if (meshName.includes('ghost') || meshName.includes('hologram')) {
            materialType = 'hologram';
        }
        
        // Special handling for different game modes
        if (gameMode === 'pacman') {
            if (meshName.includes('wall')) {
                materialType = 'glow';
            } else if (meshName.includes('ground')) {
                materialType = 'metal';
            }
        } else if (gameMode === 'battle') {
            if (meshName.includes('arena')) {
                materialType = 'metal';
            } else if (meshName.includes('hazard')) {
                materialType = 'glow';
            }
        }
        
        // Apply enhanced material
        const enhancedMaterial = this.createEnhancedMaterial(materialType, baseColor, {
            castShadow: true,
            receiveShadow: true
        });
        
        mesh.material = enhancedMaterial;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    // Create particle effect for enhanced atmosphere
    createParticleEffect(type, position, options = {}) {
        const particleCount = options.count || 50;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const color = new THREE.Color(options.color || 0xffffff);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Position
            positions[i3] = position.x + (Math.random() - 0.5) * (options.spread || 10);
            positions[i3 + 1] = position.y + Math.random() * (options.height || 5);
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * (options.spread || 10);
            
            // Color
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // Size
            sizes[i] = options.size || 0.5;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: options.size || 0.5,
            transparent: true,
            opacity: options.opacity || 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particleSystem);
        
        this.particleSystems.push({
            system: particleSystem,
            type: type,
            startTime: Date.now(),
            duration: options.duration || 5000,
            velocity: options.velocity || new THREE.Vector3(0, 1, 0),
            spread: options.spread || 10
        });
        
        return particleSystem;
    }

    // Create environment cube map for reflections
    createEnvironmentMap(gameMode = 'normal') {
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        
        // Create procedural environment map based on game mode
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        // Generate gradient based on game mode
        const gradient = context.createLinearGradient(0, 0, 0, size);
        
        switch (gameMode) {
            case 'pacman':
                gradient.addColorStop(0, '#000033');
                gradient.addColorStop(1, '#000000');
                break;
            case 'battle':
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#4682B4');
                break;
            default:
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#191970');
        }
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);
        
        const texture = new THREE.CanvasTexture(canvas);
        const cubeTexture = new THREE.CubeTexture([texture, texture, texture, texture, texture, texture]);
        cubeTexture.needsUpdate = true;
        
        this.scene.environment = cubeTexture;
        
        console.log(`🌍 Environment map created for ${gameMode} mode`);
    }

    // Create jungle atmosphere effects for slime and mud tiles
    createJungleAtmosphere(tileType, position) {
        if (tileType === 'slime') {
            // Create slime bubbles
            this.createParticleEffect('slime_bubbles', position, {
                count: 15,
                color: 0x32CD32,
                size: 0.3,
                opacity: 0.6,
                spread: 0.8,
                height: 2,
                duration: 8000,
                velocity: new THREE.Vector3(0, 0.5, 0)
            });
            
            // Create glowing spores
            this.createParticleEffect('spores', position, {
                count: 8,
                color: 0x90EE90,
                size: 0.15,
                opacity: 0.8,
                spread: 1.2,
                height: 1.5,
                duration: 12000,
                velocity: new THREE.Vector3(0, 0.2, 0)
            });
        } else if (tileType === 'mud') {
            // Create mud steam
            this.createParticleEffect('mud_steam', position, {
                count: 12,
                color: 0x8B4513,
                size: 0.4,
                opacity: 0.4,
                spread: 0.6,
                height: 2.5,
                duration: 10000,
                velocity: new THREE.Vector3(0, 0.3, 0)
            });
            
            // Create earthy particles
            this.createParticleEffect('earth_particles', position, {
                count: 6,
                color: 0xA0522D,
                size: 0.2,
                opacity: 0.7,
                spread: 0.9,
                height: 1.8,
                duration: 15000,
                velocity: new THREE.Vector3(0, 0.1, 0)
            });
        }
    }

    // Update particle systems
    update(deltaTime) {
        const currentTime = Date.now();
        
        this.particleSystems.forEach((particleData, index) => {
            const elapsed = currentTime - particleData.startTime;
            const progress = elapsed / particleData.duration;
            
            if (progress >= 1.0) {
                // Remove expired particle system
                this.scene.remove(particleData.system);
                this.particleSystems.splice(index, 1);
                return;
            }
            
            // Update particle positions
            const positions = particleData.system.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += particleData.velocity.x * deltaTime;
                positions[i + 1] += particleData.velocity.y * deltaTime;
                positions[i + 2] += particleData.velocity.z * deltaTime;
            }
            
            particleData.system.geometry.attributes.position.needsUpdate = true;
            
            // Fade out particles
            particleData.system.material.opacity = (1.0 - progress) * 0.8;
        });
    }

    // Apply post-processing effects
    applyPostProcessing(composer) {
        // This method would be used with EffectComposer for advanced post-processing
        console.log('Post-processing effects applied');
    }

    // Clean up resources
    dispose() {
        this.particleSystems.forEach(particleData => {
            this.scene.remove(particleData.system);
            particleData.system.geometry.dispose();
            particleData.system.material.dispose();
        });
        
        this.enhancedMaterials.forEach(material => {
            material.dispose();
        });
        
        this.particleSystems = [];
        this.enhancedMaterials.clear();
        
        console.log('🧹 Graphics enhancer resources disposed');
    }
} 