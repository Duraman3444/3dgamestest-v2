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
        try {
            this.scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    this.enhanceMeshMaterial(child, gameMode);
                }
            });
            
            console.log(`🎨 Enhanced materials for ${gameMode} mode`);
        } catch (error) {
            console.warn('Failed to enhance scene materials:', error);
        }
    }

    enhanceMeshMaterial(mesh, gameMode) {
        try {
            if (!mesh.material || !mesh.material.color) return;
            
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
            } else if (meshName.includes('quicksand') || meshName.includes('sand')) {
                materialType = 'stone'; // Use stone material for sand/mud effects
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
            
            // Apply enhanced material (without shadow properties)
            const enhancedMaterial = this.createEnhancedMaterial(materialType, baseColor);
            
            mesh.material = enhancedMaterial;
            // Set shadow properties on the mesh, not the material
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        } catch (error) {
            console.warn(`Failed to enhance material for mesh ${mesh.name}:`, error);
        }
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
        try {
            // Create a simple color-based environment instead of problematic cube texture
            let envColor;
            
            switch (gameMode) {
                case 'pacman':
                    envColor = new THREE.Color(0x000033);
                    break;
                case 'battle':
                    envColor = new THREE.Color(0x87CEEB);
                    break;
                default:
                    envColor = new THREE.Color(0x87CEEB);
            }
            
            // Create a simple data texture for environment mapping
            const size = 64; // Smaller size for better performance
            const data = new Uint8Array(size * size * 3);
            
            for (let i = 0; i < data.length; i += 3) {
                data[i] = envColor.r * 255;     // Red
                data[i + 1] = envColor.g * 255; // Green
                data[i + 2] = envColor.b * 255; // Blue
            }
            
            const texture = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
            texture.needsUpdate = true;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            
            // Set as scene environment (this is safer than cube textures)
            this.scene.environment = texture;
            
            console.log(`🌍 Environment map created for ${gameMode} mode`);
        } catch (error) {
            console.warn('Failed to create environment map:', error);
            // Fallback: disable environment mapping
            this.scene.environment = null;
        }
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