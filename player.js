import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.gridManager = null; // Will be set later
        // Set safe default spawn position (adjusted for sphere radius)
        this.spawnPoint = new THREE.Vector3(0, 1, 0);
        this.position = this.spawnPoint.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(0, 0, 0);
        
        // Player properties
        this.health = 100;
        this.maxHealth = 100;
        this.lives = 3; // Lives system for Pacman mode
        this.maxLives = 3;
        this.speed = 10;
        this.jumpHeight = 8;
        this.isOnGround = false;
        this.gravity = -20;
        
        // Sphere physics properties
        this.radius = 1; // Match the sphere geometry radius
        this.sphereHeight = this.radius * 2; // Diameter for physics calculations
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        
        // Mouse controls
        this.mouseSensitivity = 0.002;
        this.pitch = 0;
        this.yaw = 0;
        this.invertY = false;
        this.controlsEnabled = false;
        
        // Create player mesh (simple capsule)
        this.createPlayerMesh();
        
        // Setup input handlers
        this.setupInputHandlers();
    }
    
    setGridManager(gridManager) {
        this.gridManager = gridManager;
    }
    
    createPlayerMesh() {
        // Create high-quality sphere geometry for the player
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        
        // Check game mode and level for theming
        const isPacmanMode = window.game && window.game.gameMode === 'pacman';
        const isNormalMode = window.game && window.game.gameMode === 'normal';
        const currentLevel = window.game ? window.game.currentLevel : 1;
        
        console.log('🎨 Ball customization debug - gameMode:', window.game?.gameMode, 'isPacman:', isPacmanMode, 'isNormal:', isNormalMode);
        
        // Load ball customization for single player and pacman modes
        let customization = null;
        if (isPacmanMode || isNormalMode) {
            try {
                const saved = localStorage.getItem('ballCustomization');
                if (saved) {
                    customization = JSON.parse(saved);
                    console.log('🎨 Applying saved ball customization:', customization);
                }
                // If no saved customization, leave customization as null to use level-specific themes
            } catch (error) {
                console.error('Failed to load ball customization:', error);
                // Leave customization as null to use default level themes
            }
        }
        
        let material;
        
        // Apply ball customization for single player and pacman modes
        if (customization) {
            try {
                material = this.createCustomizedMaterial(customization, isPacmanMode);
                console.log('🎨 Successfully created customized material:', customization);
                
                // Verify material was created properly
                if (!material) {
                    console.error('❌ Customized material creation failed, falling back to default');
                    throw new Error('Material creation failed');
                }
            } catch (error) {
                console.error('❌ Error creating customized material:', error);
                console.log('🔄 Falling back to default material for level', currentLevel);
                material = null; // Will fall through to default material creation
            }
        }
        
        if (!material && isPacmanMode) {
            // Create visible rotation pattern for Pacman mode
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext('2d');
            
            // Yellow base
            context.fillStyle = '#FFFF00';
            context.fillRect(0, 0, 512, 512);
            
            // Add visible rotation stripes
            context.strokeStyle = '#FF8800';
            context.lineWidth = 8;
            
            // Horizontal stripes
            for (let i = 0; i < 512; i += 64) {
                context.beginPath();
                context.moveTo(0, i);
                context.lineTo(512, i);
                context.stroke();
            }
            
            // Vertical stripes
            for (let i = 0; i < 512; i += 64) {
                context.beginPath();
                context.moveTo(i, 0);
                context.lineTo(i, 512);
                context.stroke();
            }
            
            // Add dots for better rotation visibility
            context.fillStyle = '#FF0000';
            for (let x = 32; x < 512; x += 64) {
                for (let y = 32; y < 512; y += 64) {
                    context.beginPath();
                    context.arc(x, y, 8, 0, Math.PI * 2);
                    context.fill();
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            material = new THREE.MeshStandardMaterial({ 
                map: texture,
                color: 0xFFFF00,
                emissive: 0x888800,
                emissiveIntensity: 0.4,
                metalness: 0.1,
                roughness: 0.2,
                envMapIntensity: 1.0,
                transparent: true,
                opacity: 0.95
            });
        } else if (!material && isNormalMode) {
            // Enhanced PS2 materials with visible rotation patterns
            const ps2PlayerColors = {
                1: 0x00FFFF, // Cyan
                2: 0xFF00FF, // Magenta
                3: 0x00FF00, // Green
                4: 0xFF6600, // Orange
                5: 0x00CCCC, // Cyan
                6: 0xFFFF00, // Yellow
                7: 0xFF0099, // Pink
                8: 0x3333FF, // Blue
                9: 0xCC00CC, // Purple
                10: 0x9999FF // Light Purple
            };
            
            const colorIndex = ((currentLevel - 1) % 10) + 1;
            const playerColor = ps2PlayerColors[colorIndex];
            
            // Create visible rotation pattern
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext('2d');
            
            // Base color
            const color = new THREE.Color(playerColor);
            context.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
            context.fillRect(0, 0, 512, 512);
            
            // Add diagonal stripes for rotation visibility
            context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            context.lineWidth = 6;
            
            // Diagonal stripes
            for (let i = -512; i < 1024; i += 32) {
                context.beginPath();
                context.moveTo(i, 0);
                context.lineTo(i + 512, 512);
                context.stroke();
            }
            
            // Add contrasting dots
            context.fillStyle = 'rgba(255, 255, 255, 0.9)';
            for (let x = 16; x < 512; x += 64) {
                for (let y = 16; y < 512; y += 64) {
                    context.beginPath();
                    context.arc(x, y, 6, 0, Math.PI * 2);
                    context.fill();
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            material = new THREE.MeshStandardMaterial({ 
                map: texture,
                color: playerColor,
                emissive: playerColor,
                emissiveIntensity: 0.3,
                metalness: 0.2,
                roughness: 0.3,
                envMapIntensity: 1.0,
                transparent: true,
                opacity: 0.95
            });
        } else if (!material) {
            // Enhanced procedural material with visible rotation patterns (fallback)
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext('2d');
            
            // Enable high-quality rendering
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            
            // Create enhanced gradient pattern
            const gradient = context.createLinearGradient(0, 0, 512, 512);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(0.2, '#4ecdc4');
            gradient.addColorStop(0.4, '#45b7d1');
            gradient.addColorStop(0.6, '#f9ca24');
            gradient.addColorStop(0.8, '#f0932b');
            gradient.addColorStop(1, '#eb4d4b');
            
            context.fillStyle = gradient;
            context.fillRect(0, 0, 512, 512);
            
            // Add visible rotation grid pattern
            context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            context.lineWidth = 4;
            
            // Grid pattern for rotation visibility
            for (let i = 0; i < 512; i += 32) {
                context.beginPath();
                context.moveTo(i, 0);
                context.lineTo(i, 512);
                context.stroke();
                
                context.beginPath();
                context.moveTo(0, i);
                context.lineTo(512, i);
                context.stroke();
            }
            
            // Add circular patterns for better rotation visibility
            context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            context.lineWidth = 3;
            for (let x = 64; x < 512; x += 128) {
                for (let y = 64; y < 512; y += 128) {
                    context.beginPath();
                    context.arc(x, y, 20, 0, Math.PI * 2);
                    context.stroke();
                }
            }
            
            // Add metallic overlay
            const metallic = context.createRadialGradient(256, 256, 0, 256, 256, 256);
            metallic.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            metallic.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
            metallic.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
            
            context.fillStyle = metallic;
            context.fillRect(0, 0, 512, 512);
            
            // Create enhanced texture
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.generateMipmaps = false; // Disable mipmaps for canvas textures
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            material = new THREE.MeshPhongMaterial({ 
                map: texture,
                shininess: 100,
                specular: 0xFFFFFF,
                transparent: true,
                opacity: 0.95
            });
        }
        
        // Final safety check - ensure we always have a valid material
        if (!material) {
            console.warn('⚠️ No material created, using emergency fallback');
            material = new THREE.MeshPhongMaterial({ 
                color: 0xFF0000,
                emissive: 0x440000,
                emissiveIntensity: 0.3,
                shininess: 100
            });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = 'player';
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Create a helper object for rotation (for rolling effect)
        this.rotationHelper = new THREE.Object3D();
        this.rotationHelper.position.copy(this.position);
        this.scene.add(this.rotationHelper);
        
        // Track rotation for rolling
        this.rollRotation = new THREE.Vector3(0, 0, 0);
        
        console.log('🎨 Enhanced player mesh created with visible rotation patterns');
    }
    
    // Update player material with current customization settings
    updateBallCustomization() {
        console.log('🎨 Updating ball customization...');
        
        if (!this.mesh) {
            console.warn('⚠️ Player mesh not found, cannot update customization');
            return;
        }
        
        // Check game mode and level for theming
        const isPacmanMode = window.game && window.game.gameMode === 'pacman';
        const isNormalMode = window.game && window.game.gameMode === 'normal';
        
        // Load ball customization for single player and pacman modes
        let customization = null;
        if (isPacmanMode || isNormalMode) {
            try {
                const saved = localStorage.getItem('ballCustomization');
                if (saved) {
                    customization = JSON.parse(saved);
                    console.log('🎨 Updating with saved ball customization:', customization);
                }
            } catch (error) {
                console.error('Failed to load ball customization for update:', error);
                return;
            }
        }
        
        // Only update if we have valid customization
        if (customization) {
            try {
                const newMaterial = this.createCustomizedMaterial(customization, isPacmanMode);
                
                // Dispose of old material to free memory
                if (this.mesh.material) {
                    this.mesh.material.dispose();
                }
                
                // Apply new material
                this.mesh.material = newMaterial;
                
                console.log('✅ Ball customization updated successfully:', customization);
                
                // Show quick confirmation
                this.showCustomizationUpdateConfirmation();
                
            } catch (error) {
                console.error('❌ Error updating ball customization:', error);
            }
        } else {
            console.log('🔄 No valid customization found for current game mode');
        }
    }
    
    // Show brief confirmation that customization was applied
    showCustomizationUpdateConfirmation() {
        const confirmation = document.createElement('div');
        confirmation.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 255, 0, 0.9);
            color: black;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            font-weight: bold;
            z-index: 2000;
            text-align: center;
            pointer-events: none;
        `;
        confirmation.textContent = '🎨 Ball updated!';
        document.body.appendChild(confirmation);
        
        setTimeout(() => {
            confirmation.remove();
        }, 1500);
    }
    
    createCustomizedMaterial(customization, isPacmanMode = false) {
        // Color mapping
        const colorMap = {
            'red': '#FF0000',
            'blue': '#0066FF', 
            'green': '#00FF00',
            'yellow': '#FFFF00',
            'purple': '#8000FF',
            'orange': '#FF8000',
            'cyan': '#00FFFF',
            'magenta': '#FF00FF',
            'white': '#FFFFFF',
            'black': '#333333'
        };
        
        const baseColor = new THREE.Color(colorMap[customization.color] || '#FF0000');
        console.log(`🎨 Creating material - Color: ${customization.color}, Material: ${customization.material}, Design: ${customization.design}`);
        
        // Create texture based on design
        const texture = this.createCustomDesignTexture(customization, baseColor);
        
        // Verify texture was created successfully
        if (!texture) {
            console.error('❌ Texture creation failed for customization:', customization);
            throw new Error('Texture creation failed');
        }
        console.log('✅ Texture created successfully');
        
        // Create material based on material type
        let material;
        switch (customization.material) {
            case 'rubber':
                material = new THREE.MeshLambertMaterial({
                    map: texture,
                    color: baseColor
                });
                break;
                
            case 'plastic':
                material = new THREE.MeshPhongMaterial({
                    map: texture,
                    color: baseColor,
                    shininess: 100,
                    specular: 0xffffff,
                    transparent: true,
                    opacity: 0.95
                });
                break;
                
            case 'metal':
                material = new THREE.MeshStandardMaterial({
                    map: texture,
                    color: baseColor,
                    metalness: 0.9,
                    roughness: 0.1,
                    envMapIntensity: 1.0
                });
                break;
                
            case 'gem':
                material = new THREE.MeshStandardMaterial({
                    map: texture,
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.0,
                    transparent: true,
                    opacity: 0.8,
                    envMapIntensity: 1.5,
                    emissive: baseColor.clone().multiplyScalar(0.2),
                    emissiveIntensity: 0.4
                });
                break;
                
            case 'glow':
                // Enhanced glow material that works in all lighting conditions
                material = new THREE.MeshStandardMaterial({
                    map: texture,
                    color: baseColor,
                    emissive: baseColor.clone().multiplyScalar(0.6), // Increased emissive intensity
                    emissiveIntensity: isPacmanMode ? 1.0 : 0.8, // Increased overall intensity
                    metalness: 0.0,
                    roughness: 0.2,
                    transparent: true,
                    opacity: 0.95,
                    // Add additional glow effect with environment mapping
                    envMapIntensity: 1.2,
                    // Ensure the material is always visible even without lighting
                    toneMapped: false
                });
                console.log('🌟 Created enhanced glow material with high visibility');
                break;
                
            case 'stone':
                material = new THREE.MeshStandardMaterial({
                    map: texture,
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.8,
                    envMapIntensity: 0.3
                });
                break;
                
            default:
                material = new THREE.MeshPhongMaterial({
                    map: texture,
                    color: baseColor,
                    shininess: 100,
                    specular: 0xffffff
                });
        }
        
        console.log(`🎨 Created customized ${customization.material} material with ${customization.color} color and ${customization.design} design`);
        return material;
    }
    
    createCustomDesignTexture(customization, baseColor) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                console.error('❌ Failed to get 2D canvas context for texture creation');
                throw new Error('Canvas context creation failed');
            }
            
            // Enable high-quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            const baseColorStr = `rgb(${Math.floor(baseColor.r * 255)}, ${Math.floor(baseColor.g * 255)}, ${Math.floor(baseColor.b * 255)})`;
            console.log(`🎨 Creating texture with base color: ${baseColorStr}, design: ${customization.design}`);
        
        // Fill base color
        ctx.fillStyle = baseColorStr;
        ctx.fillRect(0, 0, 512, 512);
        
        // Apply design pattern
        switch (customization.design) {
            case 'solid':
                // Add rotation visibility pattern for solid colors
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 512; i += 64) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, 512);
                    ctx.stroke();
                }
                break;
                
            case 'stripes':
                ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 512; i += 64) {
                    ctx.fillRect(i, 0, 32, 512);
                }
                // Add rotation dots
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                for (let x = 32; x < 512; x += 64) {
                    for (let y = 32; y < 512; y += 64) {
                        ctx.beginPath();
                        ctx.arc(x, y, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                break;
                
            case 'dots':
                ctx.fillStyle = '#ffffff';
                for (let x = 64; x < 512; x += 128) {
                    for (let y = 64; y < 512; y += 128) {
                        ctx.beginPath();
                        ctx.arc(x, y, 30, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                break;
                
            case 'grid':
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 6;
                for (let i = 0; i < 512; i += 64) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, 512);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(0, i);
                    ctx.lineTo(512, i);
                    ctx.stroke();
                }
                break;
                
            case 'beach':
                const colors = ['#FF0000', '#FFFF00', '#00FF00', '#0066FF', '#FF00FF', '#FF8000'];
                const sectionAngle = (Math.PI * 2) / colors.length;
                colors.forEach((color, index) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(256, 256);
                    ctx.arc(256, 256, 256, index * sectionAngle, (index + 1) * sectionAngle);
                    ctx.closePath();
                    ctx.fill();
                });
                break;
                
            case 'soccer':
                // White base
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 512, 512);
                // Black pentagons pattern
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(256, 256, 60, 0, Math.PI * 2);
                ctx.fill();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5;
                    const x = 256 + Math.cos(angle) * 120;
                    const y = 256 + Math.sin(angle) * 120;
                    ctx.beginPath();
                    ctx.arc(x, y, 30, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'basketball':
                // Orange color (already set as base)
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 8;
                // Curved lines for basketball pattern
                ctx.beginPath();
                ctx.arc(256, 0, 256, 0, Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(256, 512, 256, Math.PI, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 256);
                ctx.lineTo(512, 256);
                ctx.stroke();
                break;
                
            case 'tennis':
                // Create curved white lines on colored background
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(128, 256, 160, 0, Math.PI * 2, false);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(384, 256, 160, 0, Math.PI * 2, false);
                ctx.stroke();
                break;
                
            case 'marble':
                // Create marble swirl pattern
                const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
                gradient.addColorStop(0, baseColorStr);
                gradient.addColorStop(0.3, '#ffffff');
                gradient.addColorStop(0.7, baseColorStr);
                gradient.addColorStop(1, '#888888');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 512, 512);
                
                // Add swirl lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 4;
                for (let i = 0; i < 8; i++) {
                    ctx.beginPath();
                    ctx.moveTo(Math.random() * 512, Math.random() * 512);
                    ctx.quadraticCurveTo(Math.random() * 512, Math.random() * 512, Math.random() * 512, Math.random() * 512);
                    ctx.stroke();
                }
                break;
                
            case 'galaxy':
                // Dark space background
                ctx.fillStyle = '#000022';
                ctx.fillRect(0, 0, 512, 512);
                
                // Add stars
                ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 150; i++) {
                    const x = Math.random() * 512;
                    const y = Math.random() * 512;
                    const size = Math.random() * 3 + 1;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Add nebula effect with base color
                const nebulaGradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 200);
                // Convert to hex format for alpha blending
                const hexColor = `#${Math.floor(baseColor.r * 255).toString(16).padStart(2, '0')}${Math.floor(baseColor.g * 255).toString(16).padStart(2, '0')}${Math.floor(baseColor.b * 255).toString(16).padStart(2, '0')}`;
                nebulaGradient.addColorStop(0, hexColor + 'CC');
                nebulaGradient.addColorStop(0.5, hexColor + '44');
                nebulaGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = nebulaGradient;
                ctx.fillRect(0, 0, 512, 512);
                
                // Add spiral arms
                ctx.strokeStyle = hexColor + 'AA';
                ctx.lineWidth = 3;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    let angle = (i * Math.PI * 2) / 3;
                    ctx.moveTo(256, 256);
                    for (let r = 0; r < 200; r += 5) {
                        const x = 256 + Math.cos(angle) * r;
                        const y = 256 + Math.sin(angle) * r;
                        ctx.lineTo(x, y);
                        angle += 0.05;
                    }
                    ctx.stroke();
                }
                break;
        }
        
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            console.log('✅ Canvas texture created successfully');
            return texture;
            
        } catch (error) {
            console.error('❌ Error creating custom design texture:', error);
            console.log('🔄 Creating fallback solid texture');
            
            // Create a simple fallback texture
            const fallbackCanvas = document.createElement('canvas');
            fallbackCanvas.width = 256;
            fallbackCanvas.height = 256;
            const fallbackCtx = fallbackCanvas.getContext('2d');
            
            // Simple solid color fallback
            const colorStr = `rgb(${Math.floor(baseColor.r * 255)}, ${Math.floor(baseColor.g * 255)}, ${Math.floor(baseColor.b * 255)})`;
            fallbackCtx.fillStyle = colorStr;
            fallbackCtx.fillRect(0, 0, 256, 256);
            
            const fallbackTexture = new THREE.CanvasTexture(fallbackCanvas);
            fallbackTexture.wrapS = THREE.RepeatWrapping;
            fallbackTexture.wrapT = THREE.RepeatWrapping;
            fallbackTexture.generateMipmaps = false;
            fallbackTexture.minFilter = THREE.LinearFilter;
            fallbackTexture.magFilter = THREE.LinearFilter;
            
            return fallbackTexture;
        }
    }
    
    setupInputHandlers() {
        // Keyboard event listeners
        document.addEventListener('keydown', (event) => {
            if (!this.controlsEnabled) return;
            
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    this.canJump = true;
                    event.preventDefault();
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
                case 'Space':
                    this.canJump = false;
                    break;
            }
        });
        
        // Mouse event listeners
        document.addEventListener('mousemove', (event) => {
            if (!this.controlsEnabled) return;
            
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            
            this.yaw -= movementX * this.mouseSensitivity;
            this.pitch -= movementY * this.mouseSensitivity * (this.invertY ? -1 : 1);
            
            // Limit pitch
            this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        });
    }
    
    update(deltaTime) {
        // Update movement direction based on input
        this.direction.set(0, 0, 0);
        
        if (this.moveForward) this.direction.z -= 1;
        if (this.moveBackward) this.direction.z += 1;
        if (this.moveLeft) this.direction.x -= 1;
        if (this.moveRight) this.direction.x += 1;
        
        // Normalize direction
        if (this.direction.length() > 0) {
            this.direction.normalize();
        }
        
        // Apply rotation to direction
        this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        
        // Update velocity based on direction
        this.velocity.x = this.direction.x * this.speed;
        this.velocity.z = this.direction.z * this.speed;
        
        // Play footstep sound occasionally when moving
        if (this.direction.length() > 0 && Math.random() < 0.05) { // 5% chance per frame
            if (window.game && window.game.audioManager) {
                window.game.audioManager.playFootstepSound();
            }
        }
        
        // Handle jumping
        if (this.canJump && this.isOnGround) {
            this.velocity.y = this.jumpHeight;
            this.isOnGround = false;
            
            // Play jump sound effect
            if (window.game && window.game.audioManager) {
                window.game.audioManager.playJumpSound();
            }
        }
        
        // Apply gravity
        this.velocity.y += this.gravity * deltaTime;
        
        // Update position with validation
        const deltaMovement = this.velocity.clone().multiplyScalar(deltaTime);
        if (this.isValidPosition(deltaMovement.x, deltaMovement.y, deltaMovement.z)) {
            this.position.add(deltaMovement);
        } else {
            console.warn('Invalid movement detected, stopping player');
            this.velocity.set(0, 0, 0);
        }
        
        // Validate final position
        if (!this.isValidPosition(this.position.x, this.position.y, this.position.z)) {
            console.warn('Player position became invalid, resetting to spawn');
            this.resetToSpawn();
            return;
        }
        
        // Ground check with elevated tiles support
        const groundHeight = this.gridManager ? this.gridManager.getGroundHeight(this.position.x, this.position.z) : 0;
        const minPlayerHeight = groundHeight + this.radius;
        
        if (this.position.y <= minPlayerHeight) {
            this.position.y = minPlayerHeight;
            this.velocity.y = 0;
            this.isOnGround = true;
        }
        
        // Update mesh position and rolling rotation
        this.mesh.position.copy(this.position);
        this.rotationHelper.position.copy(this.position);
        this.rotationHelper.rotation.y = this.yaw;
        this.rotationHelper.rotation.x = this.pitch;
        
        // Add rolling physics - sphere rotates based on movement
        if (this.velocity.length() > 0.1) {
            const rollSpeed = this.velocity.length() / this.radius;
            this.rollRotation.x += this.velocity.z * rollSpeed * deltaTime;
            this.rollRotation.z -= this.velocity.x * rollSpeed * deltaTime;
            
            this.mesh.rotation.x = this.rollRotation.x;
            this.mesh.rotation.z = this.rollRotation.z;
        }
    }
    
    enableControls() {
        this.controlsEnabled = true;
    }
    
    disableControls() {
        this.controlsEnabled = false;
        // Reset movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    getRotation() {
        return {
            pitch: this.pitch,
            yaw: this.yaw
        };
    }
    
    setPosition(x, y, z) {
        // Validate position values to prevent NaN
        if (this.isValidPosition(x, y, z)) {
            this.position.set(x, y, z);
            this.mesh.position.copy(this.position);
            this.rotationHelper.position.copy(this.position);
        } else {
            console.warn('Invalid position detected, using spawn point');
            this.resetToSpawn();
        }
    }
    
    // Validate position values
    isValidPosition(x, y, z) {
        return !isNaN(x) && !isNaN(y) && !isNaN(z) && 
               isFinite(x) && isFinite(y) && isFinite(z);
    }
    
    // Reset player to spawn point
    resetToSpawn() {
        this.position.copy(this.spawnPoint);
        this.velocity.set(0, 0, 0);
        this.mesh.position.copy(this.position);
        this.rotationHelper.position.copy(this.position);
    }
    
    // Set spawn point from level data or use fallback
    setSpawnPoint(spawnData) {
        if (spawnData && this.isValidPosition(spawnData.x, spawnData.y, spawnData.z)) {
            // Clamp spawn position to valid surface above Y=0
            this.spawnPoint.set(
                spawnData.x,
                Math.max(spawnData.y, 1), // Ensure above ground
                spawnData.z
            );
        } else {
            // Fallback default spawn point (adjusted for sphere)
            this.spawnPoint.set(0, 1, 0);
        }
        this.resetToSpawn();
    }
    
    // Get forward direction for camera
    getForwardDirection() {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        return forward;
    }
    
    // Get right direction for camera
    getRightDirection() {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        return right;
    }
    
    // Lives management methods
    loseLife() {
        this.lives = Math.max(0, this.lives - 1);
        return this.lives;
    }
    
    getLives() {
        return this.lives;
    }
    
    setLives(newLives) {
        // Ensure lives never exceed maxLives (3) and never go below 0
        this.lives = Math.max(0, Math.min(newLives, this.maxLives));
        return this.lives;
    }
    
    isOutOfLives() {
        return this.lives <= 0;
    }
    
    resetLives() {
        this.lives = this.maxLives;
    }
} 