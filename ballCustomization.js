import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class BallCustomization {
    constructor() {
        this.isVisible = false;
        this.currentOptionIndex = 0;
        this.currentSection = 'material'; // 'material', 'color', 'design'
        this.sections = ['material', 'color', 'design'];
        
        // Ball customization settings
        this.customization = this.loadCustomization();
        
        // Material types
        this.materials = [
            { id: 'rubber', name: 'Rubber Ball', description: 'Classic bouncy texture with matte finish' },
            { id: 'plastic', name: 'Plastic Ball', description: 'Smooth shiny surface with light reflections' },
            { id: 'metal', name: 'Metal Ball', description: 'Highly reflective metallic surface' },
            { id: 'gem', name: 'Crystal Ball', description: 'Transparent crystalline with prismatic effects' },
            { id: 'glow', name: 'Energy Ball', description: 'Glowing orb with pulsating energy effects' },
            { id: 'stone', name: 'Stone Ball', description: 'Rough textured rocky surface' }
        ];
        
        // Color options
        this.colors = [
            { id: 'red', name: 'Red', hex: '#FF0000' },
            { id: 'blue', name: 'Blue', hex: '#0066FF' },
            { id: 'green', name: 'Green', hex: '#00FF00' },
            { id: 'yellow', name: 'Yellow', hex: '#FFFF00' },
            { id: 'purple', name: 'Purple', hex: '#8000FF' },
            { id: 'orange', name: 'Orange', hex: '#FF8000' },
            { id: 'cyan', name: 'Cyan', hex: '#00FFFF' },
            { id: 'magenta', name: 'Magenta', hex: '#FF00FF' },
            { id: 'white', name: 'White', hex: '#FFFFFF' },
            { id: 'black', name: 'Black', hex: '#333333' }
        ];
        
        // Design patterns
        this.designs = [
            { id: 'solid', name: 'Solid Color', description: 'Clean single color finish' },
            { id: 'stripes', name: 'Racing Stripes', description: 'Bold racing stripes pattern' },
            { id: 'dots', name: 'Polka Dots', description: 'Classic polka dot pattern' },
            { id: 'grid', name: 'Grid Pattern', description: 'Geometric grid design' },
            { id: 'beach', name: 'Beach Ball', description: 'Colorful beach ball sections' },
            { id: 'soccer', name: 'Soccer Ball', description: 'Black and white soccer pattern' },
            { id: 'basketball', name: 'Basketball', description: 'Orange with curved lines' },
            { id: 'tennis', name: 'Tennis Ball', description: 'Fuzzy yellow with curved lines' },
            { id: 'marble', name: 'Marble Swirls', description: 'Swirling marble texture' },
            { id: 'galaxy', name: 'Galaxy', description: 'Space-themed with stars and nebulae' }
        ];
        
        this.setupKeyboardNavigation();
        
        // Preview ball for 3D preview
        this.previewBall = null;
        this.previewScene = null;
        this.previewCamera = null;
        this.previewRenderer = null;
        this.previewContainer = null;
        
        console.log('🎨 Ball Customization system initialized');
    }
    
    loadCustomization() {
        const saved = localStorage.getItem('ballCustomization');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Failed to load ball customization:', error);
            }
        }
        
        // Default customization
        return {
            material: 'rubber',
            color: 'red',
            design: 'solid'
        };
    }
    
    saveCustomization() {
        try {
            localStorage.setItem('ballCustomization', JSON.stringify(this.customization));
            console.log('🎨 Ball customization saved:', this.customization);
        } catch (error) {
            console.error('Failed to save ball customization:', error);
        }
    }
    
    show(onClose = null) {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.onClose = onClose;
        this.createUI();
        this.setupPreview();
        this.updatePreview();
        
        // Play sound
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playMenuClickSound();
        }
    }
    
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        
        if (this.uiElement) {
            this.uiElement.remove();
            this.uiElement = null;
        }
        
        this.cleanupPreview();
        
        if (this.onClose) {
            this.onClose();
        }
        
        // Play sound
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playMenuClickSound();
        }
    }
    
    createUI() {
        // Create main container
        this.uiElement = document.createElement('div');
        this.uiElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            z-index: 2500;
            font-family: 'Courier New', monospace;
            color: white;
            overflow-y: auto;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.innerHTML = `
            <h1 style="
                font-size: 48px;
                margin: 20px 0;
                text-align: center;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24);
                background-size: 400% 400%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: rainbow 3s ease-in-out infinite;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            ">🎨 BALL CUSTOMIZATION</h1>
            <p style="
                text-align: center;
                font-size: 18px;
                color: #00ffff;
                margin-bottom: 20px;
            ">Customize your ball for Single Player and Pacman modes</p>
        `;
        
        this.uiElement.appendChild(header);
        
        // Create main content area
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
            display: flex;
            width: 100%;
            max-width: 1400px;
            gap: 30px;
            flex: 1;
        `;
        
        // Create left panel (customization options)
        const leftPanel = this.createCustomizationPanel();
        contentArea.appendChild(leftPanel);
        
        // Create right panel (3D preview)
        const rightPanel = this.createPreviewPanel();
        contentArea.appendChild(rightPanel);
        
        this.uiElement.appendChild(contentArea);
        
        // Create footer with controls
        const footer = this.createFooter();
        this.uiElement.appendChild(footer);
        
        // Add rainbow animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rainbow {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(this.uiElement);
        this.updateSelection();
    }
    
    createCustomizationPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            flex: 1;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(0, 255, 255, 0.3);
        `;
        
        // Section navigation
        const sectionNav = document.createElement('div');
        sectionNav.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
        `;
        
        this.sectionButtons = [];
        this.sections.forEach((section, index) => {
            const button = document.createElement('button');
            button.textContent = section.charAt(0).toUpperCase() + section.slice(1);
            button.style.cssText = `
                padding: 12px 24px;
                font-size: 16px;
                font-weight: bold;
                border: 2px solid #00ffff;
                background: ${this.currentSection === section ? '#00ffff' : 'transparent'};
                color: ${this.currentSection === section ? '#000000' : '#00ffff'};
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Courier New', monospace;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-radius: 8px;
            `;
            
            button.addEventListener('click', () => this.switchSection(section));
            sectionNav.appendChild(button);
            this.sectionButtons.push(button);
        });
        
        panel.appendChild(sectionNav);
        
        // Options container
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.style.cssText = `
            min-height: 400px;
        `;
        
        panel.appendChild(this.optionsContainer);
        
        this.updateOptionsDisplay();
        
        return panel;
    }
    
    createPreviewPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            flex: 1;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(0, 255, 255, 0.3);
            display: flex;
            flex-direction: column;
            align-items: center;
        `;
        
        const previewHeader = document.createElement('h2');
        previewHeader.textContent = '3D Preview';
        previewHeader.style.cssText = `
            color: #00ffff;
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
        `;
        panel.appendChild(previewHeader);
        
        // 3D Preview container
        this.previewContainer = document.createElement('div');
        this.previewContainer.style.cssText = `
            width: 100%;
            height: 400px;
            background: linear-gradient(45deg, #222, #111);
            border-radius: 10px;
            border: 1px solid #444;
            position: relative;
        `;
        panel.appendChild(this.previewContainer);
        
        // Current settings display
        const settingsDisplay = document.createElement('div');
        settingsDisplay.id = 'current-settings';
        settingsDisplay.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background: rgba(0, 255, 255, 0.1);
            border-radius: 8px;
            width: 100%;
            text-align: center;
        `;
        panel.appendChild(settingsDisplay);
        
        return panel;
    }
    
    createFooter() {
        const footer = document.createElement('div');
        footer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
            flex-wrap: wrap;
        `;
        
        // Action buttons
        const buttons = [
            { text: 'Apply & Save', action: () => this.applyCustomization(), primary: true },
            { text: 'Reset to Default', action: () => this.resetToDefault() },
            { text: 'Close', action: () => this.hide() }
        ];
        
        buttons.forEach(buttonInfo => {
            const button = document.createElement('button');
            button.textContent = buttonInfo.text;
            button.style.cssText = `
                padding: 15px 30px;
                font-size: 16px;
                font-weight: bold;
                border: 2px solid ${buttonInfo.primary ? '#00ff00' : '#00ffff'};
                background: linear-gradient(135deg, ${buttonInfo.primary ? '#003300' : '#003366'} 0%, ${buttonInfo.primary ? '#006600' : '#0066cc'} 100%);
                color: #ffffff;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Courier New', monospace;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-radius: 8px;
                min-width: 160px;
                box-shadow: 4px 4px 0px #000000;
            `;
            
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '6px 6px 0px #000000';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '4px 4px 0px #000000';
            });
            
            button.addEventListener('click', buttonInfo.action);
            footer.appendChild(button);
        });
        
        // Instructions
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            width: 100%;
            text-align: center;
            color: #888888;
            font-size: 14px;
            margin-top: 10px;
        `;
        instructions.textContent = 'Use ↑↓ arrows to navigate, ←→ to change values, ENTER to select, ESC to close';
        footer.appendChild(instructions);
        
        return footer;
    }
    
    switchSection(section) {
        this.currentSection = section;
        this.currentOptionIndex = 0;
        this.updateOptionsDisplay();
        this.updateSelection();
        this.updatePreview();
        
        // Update section buttons
        this.sectionButtons.forEach((button, index) => {
            const sectionName = this.sections[index];
            button.style.background = sectionName === section ? '#00ffff' : 'transparent';
            button.style.color = sectionName === section ? '#000000' : '#00ffff';
        });
    }
    
    updateOptionsDisplay() {
        if (!this.optionsContainer) return;
        
        this.optionsContainer.innerHTML = '';
        
        let options = [];
        let currentValue = '';
        
        switch (this.currentSection) {
            case 'material':
                options = this.materials;
                currentValue = this.customization.material;
                break;
            case 'color':
                options = this.colors;
                currentValue = this.customization.color;
                break;
            case 'design':
                options = this.designs;
                currentValue = this.customization.design;
                break;
        }
        
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.style.cssText = `
                padding: 15px;
                margin: 10px 0;
                border: 2px solid ${option.id === currentValue ? '#00ff00' : '#444'};
                background: ${option.id === currentValue ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
            // Option header
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: between;
                margin-bottom: 5px;
            `;
            
            const name = document.createElement('span');
            name.textContent = option.name;
            name.style.cssText = `
                font-weight: bold;
                color: ${option.id === currentValue ? '#00ff00' : '#ffffff'};
                font-size: 18px;
            `;
            header.appendChild(name);
            
            // Color preview for color section
            if (this.currentSection === 'color') {
                const colorPreview = document.createElement('div');
                colorPreview.style.cssText = `
                    width: 30px;
                    height: 30px;
                    background: ${option.hex};
                    border-radius: 50%;
                    margin-left: auto;
                    border: 2px solid #ffffff;
                `;
                header.appendChild(colorPreview);
            }
            
            optionElement.appendChild(header);
            
            // Option description
            if (option.description) {
                const description = document.createElement('div');
                description.textContent = option.description;
                description.style.cssText = `
                    color: #cccccc;
                    font-size: 14px;
                    line-height: 1.4;
                `;
                optionElement.appendChild(description);
            }
            
            // Click handler
            optionElement.addEventListener('click', () => {
                this.selectOption(option.id);
            });
            
            // Hover effects
            optionElement.addEventListener('mouseenter', () => {
                if (option.id !== currentValue) {
                    optionElement.style.borderColor = '#00ffff';
                    optionElement.style.background = 'rgba(0, 255, 255, 0.1)';
                }
            });
            
            optionElement.addEventListener('mouseleave', () => {
                if (option.id !== currentValue) {
                    optionElement.style.borderColor = '#444';
                    optionElement.style.background = 'rgba(255, 255, 255, 0.05)';
                }
            });
            
            this.optionsContainer.appendChild(optionElement);
        });
        
        // Update current settings display
        this.updateCurrentSettingsDisplay();
    }
    
    updateCurrentSettingsDisplay() {
        const settingsDisplay = document.getElementById('current-settings');
        if (!settingsDisplay) return;
        
        const materialObj = this.materials.find(m => m.id === this.customization.material);
        const colorObj = this.colors.find(c => c.id === this.customization.color);
        const designObj = this.designs.find(d => d.id === this.customization.design);
        
        settingsDisplay.innerHTML = `
            <h3 style="color: #00ffff; margin-bottom: 10px;">Current Configuration</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <div><strong>Material:</strong> ${materialObj?.name || 'Unknown'}</div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span><strong>Color:</strong> ${colorObj?.name || 'Unknown'}</span>
                    <div style="width: 20px; height: 20px; background: ${colorObj?.hex || '#ffffff'}; border-radius: 50%; border: 1px solid #ffffff;"></div>
                </div>
                <div><strong>Design:</strong> ${designObj?.name || 'Unknown'}</div>
            </div>
        `;
    }
    
    selectOption(optionId) {
        this.customization[this.currentSection] = optionId;
        this.updateOptionsDisplay();
        this.updatePreview();
        this.updateCurrentSettingsDisplay();
        
        // Play sound
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playMenuHoverSound();
        }
    }
    
    setupPreview() {
        if (!this.previewContainer) return;
        
        // Create Three.js scene for preview
        this.previewScene = new THREE.Scene();
        this.previewScene.background = new THREE.Color(0x111111);
        
        // Create camera
        this.previewCamera = new THREE.PerspectiveCamera(75, this.previewContainer.clientWidth / this.previewContainer.clientHeight, 0.1, 1000);
        this.previewCamera.position.z = 5;
        
        // Create renderer
        this.previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.previewRenderer.setSize(this.previewContainer.clientWidth, this.previewContainer.clientHeight);
        this.previewRenderer.shadowMap.enabled = true;
        this.previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.previewContainer.appendChild(this.previewRenderer.domElement);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.previewScene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.previewScene.add(directionalLight);
        
        // Create initial preview ball
        this.updatePreview();
        
        // Animation loop
        const animate = () => {
            if (this.isVisible && this.previewBall) {
                this.previewBall.rotation.x += 0.01;
                this.previewBall.rotation.y += 0.015;
                this.previewRenderer.render(this.previewScene, this.previewCamera);
            }
            if (this.isVisible) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    cleanupPreview() {
        if (this.previewRenderer) {
            this.previewRenderer.dispose();
            this.previewRenderer = null;
        }
        if (this.previewScene) {
            this.previewScene.clear();
            this.previewScene = null;
        }
        this.previewCamera = null;
        this.previewBall = null;
    }
    
    updatePreview() {
        if (!this.previewScene) return;
        
        // Remove existing ball
        if (this.previewBall) {
            this.previewScene.remove(this.previewBall);
        }
        
        // Create new ball with current customization
        const geometry = new THREE.SphereGeometry(1.5, 32, 32);
        const material = this.createCustomMaterial();
        
        this.previewBall = new THREE.Mesh(geometry, material);
        this.previewBall.castShadow = true;
        this.previewBall.receiveShadow = true;
        this.previewScene.add(this.previewBall);
    }
    
    createCustomMaterial() {
        const colorObj = this.colors.find(c => c.id === this.customization.color);
        const baseColor = new THREE.Color(colorObj?.hex || '#ffffff');
        
        // Create texture based on design
        const texture = this.createDesignTexture();
        
        // Create material based on material type
        let material;
        switch (this.customization.material) {
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
                    specular: 0xffffff
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
                material = new THREE.MeshStandardMaterial({
                    map: texture,
                    color: baseColor,
                    emissive: baseColor.clone().multiplyScalar(0.5),
                    emissiveIntensity: 0.5,
                    metalness: 0.0,
                    roughness: 0.3
                });
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
                    color: baseColor
                });
        }
        
        return material;
    }
    
    createDesignTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        const colorObj = this.colors.find(c => c.id === this.customization.color);
        const baseColor = colorObj?.hex || '#ffffff';
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 512, 512);
        
        // Apply design pattern
        switch (this.customization.design) {
            case 'solid':
                // Already filled with base color
                break;
                
            case 'stripes':
                // Create diagonal racing stripes
                ctx.save();
                ctx.translate(256, 256);
                ctx.rotate(-Math.PI / 6); // 30-degree angle
                ctx.translate(-256, -256);
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                const stripeWidth = 45;
                const spacing = 90;
                for (let i = -512; i < 1024; i += spacing) {
                    ctx.fillRect(i, -512, stripeWidth, 1536);
                }
                
                // Add black outline for each stripe
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 2;
                for (let i = -512; i < 1024; i += spacing) {
                    ctx.strokeRect(i, -512, stripeWidth, 1536);
                }
                
                ctx.restore();
                break;
                
            case 'dots':
                // Create polka dot pattern with better distribution
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.lineWidth = 2;
                
                const dotSize = 25;
                const dotSpacing = 80;
                const dotOffset = 40; // Offset every other row
                
                for (let x = dotSpacing / 2; x < 512; x += dotSpacing) {
                    for (let y = dotSpacing / 2; y < 512; y += dotSpacing) {
                        // Offset every other row for better coverage
                        const xPos = y % (dotSpacing * 2) === dotSpacing / 2 ? x : x + dotOffset;
                        
                        ctx.beginPath();
                        ctx.arc(xPos, y, dotSize, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                }
                break;
                
            case 'grid':
                // Create prominent grid pattern
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 6;
                const gridSpacing = 40;
                
                // Draw vertical lines
                for (let i = 0; i <= 512; i += gridSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, 512);
                    ctx.stroke();
                }
                
                // Draw horizontal lines
                for (let i = 0; i <= 512; i += gridSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(0, i);
                    ctx.lineTo(512, i);
                    ctx.stroke();
                }
                
                // Add darker border for each grid cell
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 2;
                for (let i = 0; i <= 512; i += gridSpacing) {
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
                // Create alternating color sections like a beach ball
                const beachColors = ['#FF0000', '#FFFF00', '#00FF00', '#0066FF', '#FF00FF', '#FF8000'];
                const centerX = 256;
                const centerY = 256;
                const sectionAngle = (Math.PI * 2) / beachColors.length;
                
                beachColors.forEach((color, index) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, 256, 
                           sectionAngle * index, 
                           sectionAngle * (index + 1));
                    ctx.closePath();
                    ctx.fill();
                    
                    // Add white border between sections
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                });
                break;
                
            case 'soccer':
                // Create realistic soccer ball pattern
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, 512, 512);
                
                // Draw black pentagonal sections
                ctx.fillStyle = '#000000';
                
                // Central pentagon
                this.drawPentagon(ctx, 256, 256, 45);
                
                // Surrounding pentagons in a pattern
                const positions = [
                    {x: 256, y: 140}, // top
                    {x: 320, y: 180}, // top right
                    {x: 340, y: 240}, // right
                    {x: 320, y: 320}, // bottom right
                    {x: 256, y: 360}, // bottom
                    {x: 192, y: 320}, // bottom left
                    {x: 172, y: 240}, // left
                    {x: 192, y: 180}  // top left
                ];
                
                positions.forEach(pos => {
                    this.drawPentagon(ctx, pos.x, pos.y, 30);
                });
                
                // Add connecting lines between pentagons
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                
                // Lines from center to surrounding pentagons
                positions.forEach(pos => {
                    ctx.beginPath();
                    ctx.moveTo(256, 256);
                    ctx.lineTo(pos.x, pos.y);
                    ctx.stroke();
                });
                
                break;
                
            case 'basketball':
                // Orange base (already set)
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                
                // Main vertical line
                ctx.beginPath();
                ctx.moveTo(256, 0);
                ctx.lineTo(256, 512);
                ctx.stroke();
                
                // Main horizontal line
                ctx.beginPath();
                ctx.moveTo(0, 256);
                ctx.lineTo(512, 256);
                ctx.stroke();
                
                // Curved lines for basketball seams
                ctx.beginPath();
                ctx.arc(256, 256, 180, -Math.PI/4, Math.PI/4);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(256, 256, 180, 3*Math.PI/4, 5*Math.PI/4);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(256, 256, 180, Math.PI/4, 3*Math.PI/4);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(256, 256, 180, -3*Math.PI/4, -Math.PI/4);
                ctx.stroke();
                break;
                
            case 'tennis':
                // Create fuzzy texture first
                ctx.fillStyle = baseColor;
                ctx.fillRect(0, 0, 512, 512);
                
                // Add fuzzy texture
                for (let i = 0; i < 2000; i++) {
                    const x = Math.random() * 512;
                    const y = Math.random() * 512;
                    const size = Math.random() * 2 + 1;
                    ctx.fillStyle = `rgba(255, 255, 0, ${Math.random() * 0.3 + 0.1})`;
                    ctx.fillRect(x, y, size, size);
                }
                
                // Tennis ball characteristic curved lines
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 12;
                ctx.lineCap = 'round';
                
                // Create the classic tennis ball seam pattern
                ctx.beginPath();
                // Left curve
                ctx.arc(128, 256, 200, -Math.PI/3, Math.PI/3);
                ctx.stroke();
                
                ctx.beginPath();
                // Right curve
                ctx.arc(384, 256, 200, 2*Math.PI/3, 4*Math.PI/3);
                ctx.stroke();
                
                // Add shadow to the lines for depth
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 4;
                
                ctx.beginPath();
                ctx.arc(128, 256, 200, -Math.PI/3, Math.PI/3);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(384, 256, 200, 2*Math.PI/3, 4*Math.PI/3);
                ctx.stroke();
                break;
                
            case 'marble':
                // Create realistic marble pattern
                // Base with subtle gradient
                const marbleGrad = ctx.createLinearGradient(0, 0, 512, 512);
                marbleGrad.addColorStop(0, baseColor);
                marbleGrad.addColorStop(0.3, '#FFFFFF');
                marbleGrad.addColorStop(0.7, baseColor);
                marbleGrad.addColorStop(1, '#CCCCCC');
                ctx.fillStyle = marbleGrad;
                ctx.fillRect(0, 0, 512, 512);
                
                // Create realistic marble veins
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                
                // Main veins
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(Math.random() * 512, Math.random() * 512);
                    
                    let x = Math.random() * 512;
                    let y = Math.random() * 512;
                    
                    for (let j = 0; j < 8; j++) {
                        const newX = x + (Math.random() - 0.5) * 100;
                        const newY = y + (Math.random() - 0.5) * 100;
                        const controlX = x + (Math.random() - 0.5) * 80;
                        const controlY = y + (Math.random() - 0.5) * 80;
                        
                        ctx.quadraticCurveTo(controlX, controlY, newX, newY);
                        x = newX;
                        y = newY;
                    }
                    ctx.stroke();
                }
                
                // Smaller secondary veins
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 15; i++) {
                    ctx.beginPath();
                    const startX = Math.random() * 512;
                    const startY = Math.random() * 512;
                    const endX = startX + (Math.random() - 0.5) * 150;
                    const endY = startY + (Math.random() - 0.5) * 150;
                    const controlX = (startX + endX) / 2 + (Math.random() - 0.5) * 50;
                    const controlY = (startY + endY) / 2 + (Math.random() - 0.5) * 50;
                    
                    ctx.moveTo(startX, startY);
                    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                    ctx.stroke();
                }
                break;
                
            case 'galaxy':
                // Dark space background
                ctx.fillStyle = '#000011';
                ctx.fillRect(0, 0, 512, 512);
                
                // Add stars
                ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 100; i++) {
                    const x = Math.random() * 512;
                    const y = Math.random() * 512;
                    const size = Math.random() * 3 + 1;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Add nebula effect
                const nebulaGradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 200);
                nebulaGradient.addColorStop(0, baseColor + '88');
                nebulaGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = nebulaGradient;
                ctx.fillRect(0, 0, 512, 512);
                break;
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        return texture;
    }

    // Helper method to draw pentagon for soccer ball pattern
    drawPentagon(ctx, centerX, centerY, radius) {
        ctx.beginPath();
        const angles = [];
        for (let i = 0; i < 5; i++) {
            angles.push((i * 2 * Math.PI) / 5 - Math.PI / 2);
        }
        
        ctx.moveTo(
            centerX + radius * Math.cos(angles[0]),
            centerY + radius * Math.sin(angles[0])
        );
        
        for (let i = 1; i < 5; i++) {
            ctx.lineTo(
                centerX + radius * Math.cos(angles[i]),
                centerY + radius * Math.sin(angles[i])
            );
        }
        
        ctx.closePath();
        ctx.fill();
    }
    
    setupKeyboardNavigation() {
        this.keyboardHandler = (event) => {
            if (!this.isVisible) return;
            
            switch (event.key) {
                case 'Escape':
                    event.preventDefault();
                    this.hide();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.navigateSections(-1);
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    this.navigateSections(1);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    this.navigateOptions(-1);
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    this.navigateOptions(1);
                    break;
                case 'Enter':
                    event.preventDefault();
                    this.selectCurrentOption();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyboardHandler);
    }
    
    navigateSections(direction) {
        const currentIndex = this.sections.indexOf(this.currentSection);
        const newIndex = (currentIndex + direction + this.sections.length) % this.sections.length;
        this.switchSection(this.sections[newIndex]);
    }
    
    navigateOptions(direction) {
        let options = [];
        switch (this.currentSection) {
            case 'material': options = this.materials; break;
            case 'color': options = this.colors; break;
            case 'design': options = this.designs; break;
        }
        
        const currentValue = this.customization[this.currentSection];
        const currentIndex = options.findIndex(option => option.id === currentValue);
        const newIndex = (currentIndex + direction + options.length) % options.length;
        
        this.selectOption(options[newIndex].id);
    }
    
    selectCurrentOption() {
        // Apply and save the current customization
        this.applyCustomization();
    }
    
    updateSelection() {
        // Visual updates are handled in updateOptionsDisplay
    }
    
    applyCustomization() {
        this.saveCustomization();
        
        // Update the player's ball in the current game if active
        if (window.game && window.game.player && window.game.player.updateBallCustomization) {
            console.log('🎨 Triggering player ball update...');
            window.game.player.updateBallCustomization();
        } else if (window.game && window.game.battleSystem && window.game.battleSystem.updatePlayerBallCustomization) {
            console.log('🎨 Triggering battle mode ball update...');
            window.game.battleSystem.updatePlayerBallCustomization();
        } else if (window.game && window.game.localBattle && window.game.localBattle.updatePlayerBallCustomization) {
            console.log('🎨 Triggering multiplayer ball update...');
            window.game.localBattle.updatePlayerBallCustomization();
        } else {
            console.log('🔄 Game not active - customization will apply on next game start');
            
            // Show regular confirmation since we can't update immediately
            const confirmation = document.createElement('div');
            confirmation.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 255, 0, 0.9);
                color: black;
                padding: 20px 40px;
                border-radius: 10px;
                font-size: 18px;
                font-weight: bold;
                z-index: 3000;
                text-align: center;
            `;
            confirmation.textContent = '✅ Ball customization saved!\nWill apply when you start playing.';
            confirmation.style.whiteSpace = 'pre-line';
            document.body.appendChild(confirmation);
            
            setTimeout(() => {
                confirmation.remove();
            }, 3000);
        }
        
        // Play success sound
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playVictorySound();
        }
        
        console.log('🎨 Ball customization applied:', this.customization);
    }
    
    resetToDefault() {
        this.customization = {
            material: 'rubber',
            color: 'red',
            design: 'solid'
        };
        this.updateOptionsDisplay();
        this.updatePreview();
        this.updateCurrentSettingsDisplay();
        
        // Play sound
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playMenuClickSound();
        }
    }
    
    // Static method to get current customization for use by other systems
    static getCurrentCustomization() {
        const saved = localStorage.getItem('ballCustomization');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Failed to load ball customization:', error);
            }
        }
        
        return {
            material: 'rubber',
            color: 'red',
            design: 'solid'
        };
    }
} 