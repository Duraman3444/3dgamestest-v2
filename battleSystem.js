import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class BattleSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.isActive = false;
        this.currentLevel = 1;
        
        // Sumo arena properties
        this.arenaRadius = 12;
        this.arenaHeight = 1;
        this.fallThreshold = -10;
        this.arena = null;
        this.arenaEdge = null;
        
        // Ball physics properties
        this.playerBall = null;
        this.enemyBalls = [];
        this.ballRadius = 1;
        this.bounceForce = 15;
        this.friction = 0.98;
        this.gravity = -25;
        
        // Battle state
        this.battleState = 'waiting'; // 'waiting', 'active', 'won', 'lost'
        this.playersAlive = 1;
        this.enemiesAlive = 0;
        
        // Callbacks
        this.victoryCallback = null;
        this.defeatCallback = null;
        
        // Game settings
        this.respawnEnabled = false;
        this.roundTimer = 0;
        this.maxRoundTime = 60; // 60 seconds per round
        
        // UI reference
        this.battleUI = null;
    }
    
    // Set UI reference
    setBattleUI(ui) {
        this.battleUI = ui;
    }
    
    // Set callbacks
    setVictoryCallback(callback) {
        this.victoryCallback = callback;
    }
    
    setDefeatCallback(callback) {
        this.defeatCallback = callback;
    }
    
    // Start battle
    startBattle(level = 1, botCount = null) {
        this.currentLevel = level;
        this.battleState = 'waiting';
        this.isActive = true;
        this.roundTimer = 0;
        
        console.log(`🥊 Starting Sumo Battle - Level ${level}${botCount ? ` with ${botCount} bots` : ''}`);
        
        // Play battle start sound effect
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playBattleSound();
        }
        
        // Show UI
        if (this.battleUI) {
            this.battleUI.show();
            this.battleUI.updateLevel(level);
            this.battleUI.showControls();
        }
        
        // Create sumo arena
        this.createSumoArena();
        
        // Convert player to ball
        this.createPlayerBall();
        
        // Create enemy balls based on level or bot count
        this.createEnemyBalls(level, botCount);
        
        // Start countdown
        this.startCountdown();
    }
    
    // Create circular sumo arena
    createSumoArena() {
        // Main arena platform
        const arenaGeometry = new THREE.CylinderGeometry(this.arenaRadius, this.arenaRadius, this.arenaHeight, 32);
        const arenaMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            transparent: true,
            opacity: 0.9
        });
        this.arena = new THREE.Mesh(arenaGeometry, arenaMaterial);
        this.arena.position.y = -this.arenaHeight / 2;
        this.arena.name = 'sumo_arena';
        this.scene.add(this.arena);
        
        // Arena edge ring (visual boundary)
        const edgeGeometry = new THREE.TorusGeometry(this.arenaRadius, 0.3, 8, 24);
        const edgeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        this.arenaEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        this.arenaEdge.position.y = 0.3;
        this.arenaEdge.rotation.x = Math.PI / 2;
        this.arenaEdge.name = 'arena_edge';
        this.scene.add(this.arenaEdge);
        
        // Add some visual markers
        this.createArenaMarkers();
        
        console.log('🏟️ Sumo arena created');
    }
    
    // Create visual markers around arena
    createArenaMarkers() {
        const markerCount = 8;
        for (let i = 0; i < markerCount; i++) {
            const angle = (i / markerCount) * Math.PI * 2;
            const x = Math.cos(angle) * (this.arenaRadius + 1);
            const z = Math.sin(angle) * (this.arenaRadius + 1);
            
            const markerGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
            const markerMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(x, 1, z);
            marker.name = 'arena_marker';
            this.scene.add(marker);
        }
    }
    
    // Convert player to ball physics
    createPlayerBall() {
        // Hide original player mesh if visible
        if (this.player.mesh) {
            this.player.mesh.visible = false;
        }
        
        // Load ball customization settings
        let customization = null;
        try {
            const saved = localStorage.getItem('ballCustomization');
            if (saved) {
                customization = JSON.parse(saved);
                console.log('🎨 Applying ball customization to battle mode:', customization);
            }
        } catch (error) {
            console.error('Failed to load ball customization:', error);
        }
        
        // Create customized or default material
        let material;
        if (customization) {
            material = this.createCustomizedBattleMaterial(customization);
        } else {
            // Create default visible rotation pattern for player ball
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const context = canvas.getContext('2d');
            
            // Green base
            context.fillStyle = '#00FF00';
            context.fillRect(0, 0, 256, 256);
            
            // Add visible rotation stripes
            context.strokeStyle = '#FFFFFF';
            context.lineWidth = 4;
            
            // Diagonal stripes for rotation visibility
            for (let i = -256; i < 512; i += 24) {
                context.beginPath();
                context.moveTo(i, 0);
                context.lineTo(i + 256, 256);
                context.stroke();
            }
            
            // Add dots for better rotation visibility
            context.fillStyle = '#FFFF00';
            for (let x = 16; x < 256; x += 32) {
                for (let y = 16; y < 256; y += 32) {
                    context.beginPath();
                    context.arc(x, y, 4, 0, Math.PI * 2);
                    context.fill();
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            // Create default material
            material = new THREE.MeshLambertMaterial({ 
                map: texture,
                color: 0x00FF00 
            });
        }
        
        // Create player ball with customized or default material
        const ballGeometry = new THREE.SphereGeometry(this.ballRadius, 16, 16);
        this.playerBall = new THREE.Mesh(ballGeometry, material);
        this.playerBall.position.set(0, 2, 0);
        this.playerBall.name = 'player_ball';
        this.scene.add(this.playerBall);
        
        // Ball physics properties - using userData to avoid readonly property issues
        this.playerBall.userData = {
            velocity: new THREE.Vector3(0, 0, 0),
            isAlive: true,
            mass: 1,
            rollRotation: new THREE.Vector3(0, 0, 0)
        };
        
        console.log('🟢 Player ball created with visible rotation pattern');
    }
    
    // Update player ball customization in real-time
    updatePlayerBallCustomization() {
        console.log('🎨 Updating battle mode ball customization...');
        
        if (!this.playerBall) {
            console.warn('⚠️ Player ball not found in battle mode, cannot update customization');
            return;
        }
        
        // Load ball customization settings
        let customization = null;
        try {
            const saved = localStorage.getItem('ballCustomization');
            if (saved) {
                customization = JSON.parse(saved);
                console.log('🎨 Updating battle ball with customization:', customization);
            }
        } catch (error) {
            console.error('Failed to load ball customization for battle update:', error);
            return;
        }
        
        if (customization) {
            try {
                const newMaterial = this.createCustomizedBattleMaterial(customization);
                
                // Dispose of old material to free memory
                if (this.playerBall.material) {
                    this.playerBall.material.dispose();
                }
                
                // Apply new material
                this.playerBall.material = newMaterial;
                
                console.log('✅ Battle ball customization updated successfully:', customization);
                
                // Show quick confirmation
                this.showCustomizationUpdateConfirmation();
                
            } catch (error) {
                console.error('❌ Error updating battle ball customization:', error);
            }
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
    
    createCustomizedBattleMaterial(customization) {
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
        
        const baseColor = new THREE.Color(colorMap[customization.color] || '#00FF00');
        
        // Create texture based on design
        const texture = this.createCustomBattleTexture(customization, baseColor);
        
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
                    shininess: 80,
                    specular: 0xffffff
                });
                break;
                
            case 'metal':
                material = new THREE.MeshStandardMaterial({
                    map: texture,
                    color: baseColor,
                    metalness: 0.8,
                    roughness: 0.2,
                    envMapIntensity: 1.0
                });
                break;
                
            case 'gem':
                material = new THREE.MeshStandardMaterial({
                    map: texture,
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.1,
                    transparent: true,
                    opacity: 0.9,
                    envMapIntensity: 1.2,
                    emissive: baseColor.clone().multiplyScalar(0.3),
                    emissiveIntensity: 0.5
                });
                break;
                
            case 'glow':
                material = new THREE.MeshStandardMaterial({
                    map: texture,
                    color: baseColor,
                    emissive: baseColor.clone().multiplyScalar(0.6),
                    emissiveIntensity: 0.7,
                    metalness: 0.0,
                    roughness: 0.4
                });
                break;
                
            case 'stone':
                material = new THREE.MeshStandardMaterial({
                    map: texture,
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.9,
                    envMapIntensity: 0.2
                });
                break;
                
            default:
                material = new THREE.MeshLambertMaterial({
                    map: texture,
                    color: baseColor
                });
        }
        
        console.log(`🎨 Created customized battle ${customization.material} material with ${customization.color} color and ${customization.design} design`);
        return material;
    }
    
    createCustomBattleTexture(customization, baseColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const baseColorStr = `rgb(${Math.floor(baseColor.r * 255)}, ${Math.floor(baseColor.g * 255)}, ${Math.floor(baseColor.b * 255)})`;
        
        // Fill base color
        ctx.fillStyle = baseColorStr;
        ctx.fillRect(0, 0, 256, 256);
        
        // Apply design pattern (simplified for battle mode)
        switch (customization.design) {
            case 'solid':
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 256; i += 32) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, 256);
                    ctx.stroke();
                }
                break;
                
            case 'stripes':
                ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 256; i += 32) {
                    ctx.fillRect(i, 0, 16, 256);
                }
                break;
                
            case 'dots':
                ctx.fillStyle = '#ffffff';
                for (let x = 32; x < 256; x += 64) {
                    for (let y = 32; y < 256; y += 64) {
                        ctx.beginPath();
                        ctx.arc(x, y, 12, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                break;
                
            case 'grid':
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                for (let i = 0; i < 256; i += 32) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, 256);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(0, i);
                    ctx.lineTo(256, i);
                    ctx.stroke();
                }
                break;
                
            case 'beach':
                const colors = ['#FF0000', '#FFFF00', '#00FF00', '#0066FF'];
                const sectionAngle = (Math.PI * 2) / colors.length;
                colors.forEach((color, index) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(128, 128);
                    ctx.arc(128, 128, 128, index * sectionAngle, (index + 1) * sectionAngle);
                    ctx.closePath();
                    ctx.fill();
                });
                break;
                
            case 'soccer':
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 256, 256);
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(128, 128, 30, 0, Math.PI * 2);
                ctx.fill();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5;
                    const x = 128 + Math.cos(angle) * 60;
                    const y = 128 + Math.sin(angle) * 60;
                    ctx.beginPath();
                    ctx.arc(x, y, 15, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'basketball':
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(128, 0, 128, 0, Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(128, 256, 128, Math.PI, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 128);
                ctx.lineTo(256, 128);
                ctx.stroke();
                break;
                
            case 'tennis':
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(64, 128, 80, 0, Math.PI * 2, false);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(192, 128, 80, 0, Math.PI * 2, false);
                ctx.stroke();
                break;
                
            case 'marble':
                const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
                gradient.addColorStop(0, baseColorStr);
                gradient.addColorStop(0.5, '#ffffff');
                gradient.addColorStop(1, baseColorStr);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 256, 256);
                break;
                
            case 'galaxy':
                ctx.fillStyle = '#000022';
                ctx.fillRect(0, 0, 256, 256);
                ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 20; i++) {
                    const x = Math.random() * 256;
                    const y = Math.random() * 256;
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
        
        // Add rotation visibility pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        for (let i = -256; i < 512; i += 24) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 256, 256);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        return texture;
    }
    
    // Create enemy balls
    createEnemyBalls(level, botCount = null) {
        const enemyCount = botCount || Math.min(level + 1, 4); // Use bot count if provided, otherwise use level-based count
        this.enemiesAlive = enemyCount;
        
        for (let i = 0; i < enemyCount; i++) {
            const angle = (i / enemyCount) * Math.PI * 2;
            const radius = this.arenaRadius * 0.6;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Create visible rotation pattern for enemy ball
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const context = canvas.getContext('2d');
            
            // Get enemy color
            const enemyColor = new THREE.Color().setHSL(i / enemyCount, 1, 0.5);
            context.fillStyle = `rgb(${enemyColor.r * 255}, ${enemyColor.g * 255}, ${enemyColor.b * 255})`;
            context.fillRect(0, 0, 256, 256);
            
            // Add visible rotation pattern - different pattern for each enemy
            context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            context.lineWidth = 3;
            
            if (i % 2 === 0) {
                // Horizontal and vertical stripes
                for (let j = 0; j < 256; j += 32) {
                    context.beginPath();
                    context.moveTo(0, j);
                    context.lineTo(256, j);
                    context.stroke();
                    
                    context.beginPath();
                    context.moveTo(j, 0);
                    context.lineTo(j, 256);
                    context.stroke();
                }
            } else {
                // Diagonal stripes
                for (let j = -256; j < 512; j += 32) {
                    context.beginPath();
                    context.moveTo(j, 0);
                    context.lineTo(j + 256, 256);
                    context.stroke();
                }
            }
            
            // Add contrasting dots
            context.fillStyle = 'rgba(255, 255, 255, 0.9)';
            for (let x = 16; x < 256; x += 32) {
                for (let y = 16; y < 256; y += 32) {
                    context.beginPath();
                    context.arc(x, y, 3, 0, Math.PI * 2);
                    context.fill();
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            const ballGeometry = new THREE.SphereGeometry(this.ballRadius, 16, 16);
            const ballMaterial = new THREE.MeshLambertMaterial({ 
                map: texture,
                color: enemyColor
            });
            const enemyBall = new THREE.Mesh(ballGeometry, ballMaterial);
            enemyBall.position.set(x, 2, z);
            enemyBall.name = `enemy_ball_${i}`;
            this.scene.add(enemyBall);
            
            // Ball physics properties - using userData to avoid readonly property issues
            enemyBall.userData = {
                velocity: new THREE.Vector3(0, 0, 0),
                isAlive: true,
                mass: 1,
                rollRotation: new THREE.Vector3(0, 0, 0),
                // AI properties
                aiTarget: this.playerBall,
                aiSpeed: 0.5 + (level * 0.1),
                aiTimer: Math.random() * 2
            };
            enemyBall.id = i;
            
            this.enemyBalls.push(enemyBall);
        }
        
        console.log(`🔴 Created ${enemyCount} enemy balls with visible rotation patterns`);
        
        // Update UI with enemy count
        if (this.battleUI) {
            this.battleUI.updateBattleData({
                level: level,
                enemiesAlive: this.enemiesAlive,
                timer: this.roundTimer,
                state: 'Get Ready!'
            });
        }
    }
    
    // Start countdown before battle
    startCountdown() {
        let countdown = 3;
        
        // Show initial countdown
        if (this.battleUI) {
            this.battleUI.showCountdown(countdown);
        }
        
        const countdownInterval = setInterval(() => {
            console.log(`⏰ ${countdown}...`);
            countdown--;
            
            if (countdown > 0) {
                if (this.battleUI) {
                    this.battleUI.showCountdown(countdown);
                }
            } else {
                clearInterval(countdownInterval);
                console.log('🚀 FIGHT!');
                this.battleState = 'active';
                
                if (this.battleUI) {
                    this.battleUI.showMessage('FIGHT!', 1500);
                    this.battleUI.updateBattleData({
                        state: 'FIGHT!'
                    });
                }
            }
        }, 1000);
    }
    
    // Update battle state
    update(deltaTime) {
        if (!this.isActive || this.battleState !== 'active') return;
        
        this.roundTimer += deltaTime;
        
        // Update UI with timer
        if (this.battleUI) {
            this.battleUI.updateBattleData({
                timer: this.roundTimer,
                enemiesAlive: this.enemiesAlive
            });
        }
        
        // Update player ball
        this.updatePlayerBall(deltaTime);
        
        // Update enemy balls
        this.updateEnemyBalls(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Check fall-offs
        this.checkFallOffs();
        
        // Check win/lose conditions
        this.checkWinConditions();
        
        // Check timeout
        if (this.roundTimer >= this.maxRoundTime) {
            this.endBattle(false); // Timeout = defeat
        }
    }
    
    // Update player ball physics
    updatePlayerBall(deltaTime) {
        if (!this.playerBall.userData.isAlive) return;
        
        // Get player input for movement
        const moveForce = new THREE.Vector3(0, 0, 0);
        const forceStrength = 20;
        
        if (this.player.moveForward) moveForce.z -= forceStrength;
        if (this.player.moveBackward) moveForce.z += forceStrength;
        if (this.player.moveLeft) moveForce.x -= forceStrength;
        if (this.player.moveRight) moveForce.x += forceStrength;
        
        // Apply movement force
        this.playerBall.userData.velocity.add(moveForce.multiplyScalar(deltaTime));
        
        // Apply gravity
        this.playerBall.userData.velocity.y += this.gravity * deltaTime;
        
        // Apply friction
        this.playerBall.userData.velocity.x *= this.friction;
        this.playerBall.userData.velocity.z *= this.friction;
        
        // Update position
        this.playerBall.position.add(this.playerBall.userData.velocity.clone().multiplyScalar(deltaTime));
        
        // Ground collision
        if (this.playerBall.position.y <= this.ballRadius) {
            this.playerBall.position.y = this.ballRadius;
            this.playerBall.userData.velocity.y = 0;
        }
        
        // Update ball rotation based on movement (rolling physics)
        if (this.playerBall.userData.velocity.length() > 0.1) {
            const rollSpeed = (this.playerBall.userData.velocity.length() / this.ballRadius) * 2.5; // Increased from 1.0 to 2.5 for faster rolling
            this.playerBall.userData.rollRotation.x += this.playerBall.userData.velocity.z * rollSpeed * deltaTime;
            this.playerBall.userData.rollRotation.z -= this.playerBall.userData.velocity.x * rollSpeed * deltaTime;
            
            this.playerBall.rotation.x = this.playerBall.userData.rollRotation.x;
            this.playerBall.rotation.z = this.playerBall.userData.rollRotation.z;
            
            // Play rolling sound occasionally when moving fast
            if (this.playerBall.userData.velocity.length() > 2 && Math.random() < 0.02) { // 2% chance per frame for fast movement
                if (window.game && window.game.audioManager) {
                    window.game.audioManager.playRollSound();
                }
            }
        }
        
        // Keep on arena (soft boundary)
        const distanceFromCenter = Math.sqrt(
            this.playerBall.position.x ** 2 + this.playerBall.position.z ** 2
        );
        if (distanceFromCenter > this.arenaRadius - this.ballRadius) {
            const pushDirection = new THREE.Vector3(
                -this.playerBall.position.x,
                0,
                -this.playerBall.position.z
            ).normalize();
            this.playerBall.userData.velocity.add(pushDirection.multiplyScalar(2));
        }
    }
    
    // Update enemy balls with simple AI
    updateEnemyBalls(deltaTime) {
        this.enemyBalls.forEach(enemy => {
            if (!enemy.userData.isAlive) return;
            
            // Simple AI: move towards player
            enemy.userData.aiTimer += deltaTime;
            if (enemy.userData.aiTimer >= 0.5) { // Update AI every 0.5 seconds
                enemy.userData.aiTimer = 0;
                
                const direction = new THREE.Vector3()
                    .subVectors(this.playerBall.position, enemy.position)
                    .normalize();
                
                const force = direction.multiplyScalar(enemy.userData.aiSpeed);
                enemy.userData.velocity.add(force);
            }
            
            // Apply gravity
            enemy.userData.velocity.y += this.gravity * deltaTime;
            
            // Apply friction
            enemy.userData.velocity.x *= this.friction;
            enemy.userData.velocity.z *= this.friction;
            
            // Update position
            enemy.position.add(enemy.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // Ground collision
            if (enemy.position.y <= this.ballRadius) {
                enemy.position.y = this.ballRadius;
                enemy.userData.velocity.y = 0;
            }
            
            // Update ball rotation based on movement (rolling physics)
            if (enemy.userData.velocity.length() > 0.1) {
                const rollSpeed = (enemy.userData.velocity.length() / this.ballRadius) * 2.5; // Increased from 1.0 to 2.5 for faster rolling
                enemy.userData.rollRotation.x += enemy.userData.velocity.z * rollSpeed * deltaTime;
                enemy.userData.rollRotation.z -= enemy.userData.velocity.x * rollSpeed * deltaTime;
                
                enemy.rotation.x = enemy.userData.rollRotation.x;
                enemy.rotation.z = enemy.userData.rollRotation.z;
                
                // Play rolling sound occasionally when moving fast
                if (enemy.userData.velocity.length() > 2 && Math.random() < 0.01) { // 1% chance per frame for enemy movement
                    if (window.game && window.game.audioManager) {
                        window.game.audioManager.playRollSound();
                    }
                }
            }
        });
    }
    
    // Check ball collisions
    checkCollisions() {
        if (!this.playerBall.userData.isAlive) return;
        
        // Player vs enemies
        this.enemyBalls.forEach(enemy => {
            if (!enemy.userData.isAlive) return;
            
            const distance = this.playerBall.position.distanceTo(enemy.position);
            if (distance < this.ballRadius * 2) {
                this.handleCollision(this.playerBall, enemy);
            }
        });
        
        // Enemy vs enemy
        for (let i = 0; i < this.enemyBalls.length; i++) {
            for (let j = i + 1; j < this.enemyBalls.length; j++) {
                const enemy1 = this.enemyBalls[i];
                const enemy2 = this.enemyBalls[j];
                
                if (!enemy1.userData.isAlive || !enemy2.userData.isAlive) continue;
                
                const distance = enemy1.position.distanceTo(enemy2.position);
                if (distance < this.ballRadius * 2) {
                    this.handleCollision(enemy1, enemy2);
                }
            }
        }
    }
    
    // Handle collision between two balls
    handleCollision(ball1, ball2) {
        // Play collision sound effect
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playHitSound();
        }
        
        // Calculate collision normal
        const normal = new THREE.Vector3()
            .subVectors(ball2.position, ball1.position)
            .normalize();
        
        // Separate balls
        const overlap = (this.ballRadius * 2) - ball1.position.distanceTo(ball2.position);
        const separation = normal.clone().multiplyScalar(overlap * 0.5);
        
        ball1.position.sub(separation);
        ball2.position.add(separation);
        
        // Calculate relative velocity
        const relativeVelocity = new THREE.Vector3()
            .subVectors(ball2.userData.velocity, ball1.userData.velocity);
        
        // Calculate collision impulse
        const impulse = relativeVelocity.dot(normal) * this.bounceForce;
        
        // Apply impulse
        ball1.userData.velocity.add(normal.clone().multiplyScalar(impulse));
        ball2.userData.velocity.sub(normal.clone().multiplyScalar(impulse));
        
        // Create collision effect
        this.createCollisionEffect(ball1.position.clone().lerp(ball2.position, 0.5));
    }
    
    // Create visual effect for collisions
    createCollisionEffect(position) {
        const effectGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const effectMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.8
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(position);
        this.scene.add(effect);
        
        // Animate and remove effect
        let scale = 1;
        const animate = () => {
            scale += 0.1;
            effect.scale.setScalar(scale);
            effect.material.opacity -= 0.1;
            
            if (effect.material.opacity <= 0) {
                this.scene.remove(effect);
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    // Check if balls fell off the arena
    checkFallOffs() {
        // Check player
        if (this.playerBall.userData.isAlive && this.playerBall.position.y < this.fallThreshold) {
            this.playerBall.userData.isAlive = false;
            this.playerBall.visible = false;
            this.playersAlive = 0;
            console.log('💀 Player fell off the arena!');
        }
        
        // Check enemies
        this.enemyBalls.forEach(enemy => {
            if (enemy.userData.isAlive && enemy.position.y < this.fallThreshold) {
                enemy.userData.isAlive = false;
                enemy.visible = false;
                this.enemiesAlive--;
                console.log(`💀 Enemy ${enemy.id} fell off the arena!`);
            }
        });
    }
    
    // Check win/lose conditions
    checkWinConditions() {
        if (this.playersAlive <= 0) {
            this.endBattle(false); // Player lost
        } else if (this.enemiesAlive <= 0) {
            this.endBattle(true); // Player won
        }
    }
    
    // End battle
    endBattle(victory = false) {
        this.isActive = false;
        this.battleState = victory ? 'won' : 'lost';
        
        console.log(`🏁 Sumo Battle ended - ${victory ? 'Victory' : 'Defeat'} - immediately cleaning up UI`);
        
        // Play victory or defeat sound effect
        if (window.game && window.game.audioManager) {
            if (victory) {
                window.game.audioManager.playVictorySound();
            } else {
                window.game.audioManager.playDefeatSound();
            }
        }
        
        // IMMEDIATE UI cleanup - no victory/defeat screens shown
        if (this.battleUI) {
            this.battleUI.hide();
            this.battleUI.cleanup();
        }
        
        // Immediate cleanup of battle system
        setTimeout(() => {
            this.cleanup();
        }, 100); // Small delay to allow sound to play
        
        // Call appropriate callback immediately
        setTimeout(() => {
            if (victory && this.victoryCallback) {
                this.victoryCallback();
            } else if (!victory && this.defeatCallback) {
                this.defeatCallback();
            }
        }, 200); // Very short delay just for sound
    }
    
    // Clean up
    cleanup() {
        this.isActive = false;
        this.battleState = 'inactive';
        this.enemyBalls = [];
        this.playersAlive = 0;
        this.enemiesAlive = 0;
        
        // Clear any pending timeouts
        if (this.victoryCallback) {
            this.victoryCallback = null;
        }
        if (this.defeatCallback) {
            this.defeatCallback = null;
        }
        
        // Show original player mesh
        if (this.player && this.player.mesh) {
            this.player.mesh.visible = true;
        }
        
        // Clean up UI completely
        if (this.battleUI) {
            this.battleUI.cleanup();
        }
        
        // Remove all battle objects from scene
        const battleObjects = this.scene.children.filter(child => 
            child.name?.includes('sumo_') || 
            child.name?.includes('arena_') ||
            child.name?.includes('_ball') ||
            child.name?.includes('enemy_') ||
            child.name?.includes('player_ball')
        );
        battleObjects.forEach(obj => {
            this.scene.remove(obj);
            // Dispose of geometry and materials to free memory
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        
        // Reset timers
        this.roundTimer = 0;
        this.roundStartTime = 0;
        this.battleStartTime = 0;
        
        console.log('🧹 Sumo battle system cleaned up completely');
    }
} 