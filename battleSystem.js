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
        
        // Create player ball
        const ballGeometry = new THREE.SphereGeometry(this.ballRadius, 16, 16);
        const ballMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
        this.playerBall = new THREE.Mesh(ballGeometry, ballMaterial);
        this.playerBall.position.set(0, 2, 0);
        this.playerBall.name = 'player_ball';
        this.scene.add(this.playerBall);
        
        // Ball physics properties
        this.playerBall.velocity = new THREE.Vector3(0, 0, 0);
        this.playerBall.isAlive = true;
        this.playerBall.mass = 1;
        
        console.log('🟢 Player ball created');
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
            
            const ballGeometry = new THREE.SphereGeometry(this.ballRadius, 16, 16);
            const ballMaterial = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(i / enemyCount, 1, 0.5)
            });
            const enemyBall = new THREE.Mesh(ballGeometry, ballMaterial);
            enemyBall.position.set(x, 2, z);
            enemyBall.name = `enemy_ball_${i}`;
            this.scene.add(enemyBall);
            
            // Ball physics properties
            enemyBall.velocity = new THREE.Vector3(0, 0, 0);
            enemyBall.isAlive = true;
            enemyBall.mass = 1;
            enemyBall.id = i;
            
            // Simple AI properties
            enemyBall.aiTarget = this.playerBall;
            enemyBall.aiSpeed = 0.5 + (level * 0.1);
            enemyBall.aiTimer = Math.random() * 2;
            
            this.enemyBalls.push(enemyBall);
        }
        
        console.log(`🔴 Created ${enemyCount} enemy balls`);
        
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
        if (!this.playerBall.isAlive) return;
        
        // Get player input for movement
        const moveForce = new THREE.Vector3(0, 0, 0);
        const forceStrength = 20;
        
        if (this.player.moveForward) moveForce.z -= forceStrength;
        if (this.player.moveBackward) moveForce.z += forceStrength;
        if (this.player.moveLeft) moveForce.x -= forceStrength;
        if (this.player.moveRight) moveForce.x += forceStrength;
        
        // Apply movement force
        this.playerBall.velocity.add(moveForce.multiplyScalar(deltaTime));
        
        // Apply gravity
        this.playerBall.velocity.y += this.gravity * deltaTime;
        
        // Apply friction
        this.playerBall.velocity.x *= this.friction;
        this.playerBall.velocity.z *= this.friction;
        
        // Update position
        this.playerBall.position.add(this.playerBall.velocity.clone().multiplyScalar(deltaTime));
        
        // Ground collision
        if (this.playerBall.position.y <= this.ballRadius) {
            this.playerBall.position.y = this.ballRadius;
            this.playerBall.velocity.y = 0;
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
            this.playerBall.velocity.add(pushDirection.multiplyScalar(2));
        }
    }
    
    // Update enemy balls with simple AI
    updateEnemyBalls(deltaTime) {
        this.enemyBalls.forEach(enemy => {
            if (!enemy.isAlive) return;
            
            // Simple AI: move towards player
            enemy.aiTimer += deltaTime;
            if (enemy.aiTimer >= 0.5) { // Update AI every 0.5 seconds
                enemy.aiTimer = 0;
                
                const direction = new THREE.Vector3()
                    .subVectors(this.playerBall.position, enemy.position)
                    .normalize();
                
                const force = direction.multiplyScalar(enemy.aiSpeed);
                enemy.velocity.add(force);
            }
            
            // Apply gravity
            enemy.velocity.y += this.gravity * deltaTime;
            
            // Apply friction
            enemy.velocity.x *= this.friction;
            enemy.velocity.z *= this.friction;
            
            // Update position
            enemy.position.add(enemy.velocity.clone().multiplyScalar(deltaTime));
            
            // Ground collision
            if (enemy.position.y <= this.ballRadius) {
                enemy.position.y = this.ballRadius;
                enemy.velocity.y = 0;
            }
        });
    }
    
    // Check ball collisions
    checkCollisions() {
        if (!this.playerBall.isAlive) return;
        
        // Player vs enemies
        this.enemyBalls.forEach(enemy => {
            if (!enemy.isAlive) return;
            
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
                
                if (!enemy1.isAlive || !enemy2.isAlive) continue;
                
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
            .subVectors(ball2.velocity, ball1.velocity);
        
        // Calculate collision impulse
        const impulse = relativeVelocity.dot(normal) * this.bounceForce;
        
        // Apply impulse
        ball1.velocity.add(normal.clone().multiplyScalar(impulse));
        ball2.velocity.sub(normal.clone().multiplyScalar(impulse));
        
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
        if (this.playerBall.isAlive && this.playerBall.position.y < this.fallThreshold) {
            this.playerBall.isAlive = false;
            this.playerBall.visible = false;
            this.playersAlive = 0;
            console.log('💀 Player fell off the arena!');
        }
        
        // Check enemies
        this.enemyBalls.forEach(enemy => {
            if (enemy.isAlive && enemy.position.y < this.fallThreshold) {
                enemy.isAlive = false;
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