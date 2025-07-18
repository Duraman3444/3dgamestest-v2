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
        
        // Create visible rotation pattern for player ball
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
        
        // Create player ball
        const ballGeometry = new THREE.SphereGeometry(this.ballRadius, 16, 16);
        const ballMaterial = new THREE.MeshLambertMaterial({ 
            map: texture,
            color: 0x00FF00 
        });
        this.playerBall = new THREE.Mesh(ballGeometry, ballMaterial);
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
            const rollSpeed = this.playerBall.userData.velocity.length() / this.ballRadius;
            this.playerBall.userData.rollRotation.x += this.playerBall.userData.velocity.z * rollSpeed * deltaTime;
            this.playerBall.userData.rollRotation.z -= this.playerBall.userData.velocity.x * rollSpeed * deltaTime;
            
            this.playerBall.rotation.x = this.playerBall.userData.rollRotation.x;
            this.playerBall.rotation.z = this.playerBall.userData.rollRotation.z;
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
                const rollSpeed = enemy.userData.velocity.length() / this.ballRadius;
                enemy.userData.rollRotation.x += enemy.userData.velocity.z * rollSpeed * deltaTime;
                enemy.userData.rollRotation.z -= enemy.userData.velocity.x * rollSpeed * deltaTime;
                
                enemy.rotation.x = enemy.userData.rollRotation.x;
                enemy.rotation.z = enemy.userData.rollRotation.z;
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
        
        console.log(`🏁 Sumo Battle ended - ${victory ? 'Victory' : 'Defeat'}`);
        
        // Update UI
        if (this.battleUI) {
            if (victory) {
                this.battleUI.showVictory();
            } else {
                this.battleUI.showDefeat();
            }
        }
        
        // Call appropriate callback
        if (victory && this.victoryCallback) {
            this.victoryCallback();
        } else if (!victory && this.defeatCallback) {
            this.defeatCallback();
        }
    }
    
    // Clean up
    cleanup() {
        this.isActive = false;
        this.enemyBalls = [];
        this.playersAlive = 0;
        this.enemiesAlive = 0;
        
        // Show original player mesh
        if (this.player.mesh) {
            this.player.mesh.visible = true;
        }
        
        // Hide UI
        if (this.battleUI) {
            this.battleUI.hide();
        }
        
        // Remove all battle objects
        const battleObjects = this.scene.children.filter(child => 
            child.name?.includes('sumo_') || 
            child.name?.includes('arena_') ||
            child.name?.includes('_ball')
        );
        battleObjects.forEach(obj => this.scene.remove(obj));
        
        console.log('🧹 Sumo battle system cleaned up');
    }
} 