import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class BotAI {
    constructor(scene, id, position, difficulty = 1) {
        this.scene = scene;
        this.id = id;
        this.position = position.clone();
        this.difficulty = difficulty;
        this.isActive = true;
        
        // Physics properties
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.radius = 1;
        this.mass = 1;
        this.friction = 0.85;
        this.gravity = -20;
        this.isOnGround = false;
        
        // Combat properties
        this.damage = 0;
        this.maxDamage = 300;
        this.attackRange = 4;
        this.attackCooldown = 1000; // ms
        this.lastAttackTime = 0;
        this.attackDamage = 8 + difficulty * 2;
        this.hitCooldown = 500; // ms between taking hits
        this.lastHitTime = 0;
        
        // Movement properties
        this.baseSpeed = 8 + difficulty * 1.5;
        this.jumpForce = 12 + difficulty * 0.5;
        this.maxSpeed = this.baseSpeed * 1.5;
        this.aggressiveness = 0.3 + difficulty * 0.1;
        this.jumpFrequency = 0.02 + difficulty * 0.005;
        
        // AI State
        this.state = 'idle'; // 'idle', 'pursuing', 'attacking', 'retreating', 'stunned'
        this.target = null;
        this.stateTimer = 0;
        this.decisionTimer = 0;
        this.decisionCooldown = 200 + Math.random() * 200; // ms
        
        // Pathfinding and awareness
        this.detectionRange = 15 + difficulty * 2;
        this.personalSpaceRadius = 3;
        this.lastKnownTargetPosition = null;
        this.pursuitTimer = 0;
        this.maxPursuitTime = 5000; // ms
        
        // Combat behavior
        this.combatStyle = this.getCombatStyle();
        this.retreatThreshold = 100 + difficulty * 20;
        this.stunDuration = 1000;
        this.stunTimer = 0;
        
        // Visual properties
        this.mesh = null;
        this.healthBar = null;
        this.lastGroundPosition = this.position.clone();
        
        // Create bot mesh
        this.createMesh();
        
        // Movement patterns
        this.movementPattern = this.getMovementPattern();
        this.patrolPoints = this.generatePatrolPoints();
        this.currentPatrolIndex = 0;
        
        // Advanced AI properties
        this.personality = this.generatePersonality();
        this.adaptiveTimer = 0;
        this.playerAttackPatterns = [];
        
        console.log(`Bot ${this.id} created with difficulty ${this.difficulty}, style: ${this.combatStyle}`);
    }
    
    getCombatStyle() {
        const styles = ['aggressive', 'defensive', 'balanced', 'hit_and_run', 'berserker'];
        const styleIndex = Math.min(Math.floor(this.difficulty / 2), styles.length - 1);
        return styles[styleIndex];
    }
    
    getMovementPattern() {
        const patterns = ['patrol', 'guard', 'hunter', 'flanker', 'territorial'];
        const patternIndex = Math.min(Math.floor(this.difficulty / 1.5), patterns.length - 1);
        return patterns[patternIndex];
    }
    
    generatePersonality() {
        return {
            patience: 0.5 + Math.random() * 0.5,
            recklessness: this.difficulty * 0.1 + Math.random() * 0.3,
            teamwork: Math.random() * 0.5 + 0.2,
            adaptability: this.difficulty * 0.15 + Math.random() * 0.2
        };
    }
    
    generatePatrolPoints() {
        const points = [];
        const numPoints = 3 + Math.floor(this.difficulty / 2);
        const arenaSize = 15;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = 5 + Math.random() * 8;
            points.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            ));
        }
        
        return points;
    }
    
    createMesh() {
        // Create bot body (sphere)
        const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
        
        // Color based on difficulty
        const hue = (this.difficulty - 1) * 0.1;
        const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
        
        const material = new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 100,
            specular: 0x222222
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add distinguishing features based on difficulty
        if (this.difficulty >= 3) {
            // Add spikes for higher difficulty
            this.addSpikes();
        }
        
        if (this.difficulty >= 5) {
            // Add energy aura for very high difficulty
            this.addAura();
        }
        
        this.scene.add(this.mesh);
        
        // Create health bar
        this.createHealthBar();
    }
    
    addSpikes() {
        const spikeCount = 6 + this.difficulty;
        for (let i = 0; i < spikeCount; i++) {
            const spikeGeometry = new THREE.ConeGeometry(0.1, 0.5, 4);
            const spikeMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            
            // Random position on sphere surface
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            
            spike.position.set(
                Math.sin(theta) * Math.cos(phi) * this.radius,
                Math.cos(theta) * this.radius,
                Math.sin(theta) * Math.sin(phi) * this.radius
            );
            
            spike.lookAt(spike.position.clone().multiplyScalar(2));
            this.mesh.add(spike);
        }
    }
    
    addAura() {
        const auraGeometry = new THREE.SphereGeometry(this.radius * 1.3, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        this.mesh.add(aura);
        
        // Pulsing animation
        this.auraAnimation = (time) => {
            const pulse = Math.sin(time * 0.005) * 0.1 + 0.2;
            aura.material.opacity = pulse;
            aura.scale.setScalar(1 + pulse * 0.2);
        };
    }
    
    createHealthBar() {
        const barWidth = 2;
        const barHeight = 0.2;
        
        // Background
        const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const background = new THREE.Mesh(bgGeometry, bgMaterial);
        
        // Health bar
        const healthGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const healthMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        
        // Position above bot
        background.position.set(0, this.radius + 1, 0);
        healthBar.position.set(0, this.radius + 1, 0.01);
        
        this.mesh.add(background);
        this.mesh.add(healthBar);
        
        this.healthBar = healthBar;
    }
    
    setTarget(target) {
        this.target = target;
        this.lastKnownTargetPosition = target.position.clone();
    }
    
    update(deltaTime, battleSystem) {
        if (!this.isActive) return;
        
        // Update state timer
        this.stateTimer += deltaTime * 1000;
        this.decisionTimer += deltaTime * 1000;
        
        // Handle stun
        if (this.state === 'stunned') {
            this.stunTimer -= deltaTime * 1000;
            if (this.stunTimer <= 0) {
                this.state = 'idle';
            }
            this.updatePhysics(deltaTime);
            return;
        }
        
        // Make decisions
        if (this.decisionTimer >= this.decisionCooldown) {
            this.makeDecision(battleSystem);
            this.decisionTimer = 0;
            this.decisionCooldown = 200 + Math.random() * 200;
        }
        
        // Update AI state
        this.updateAI(deltaTime, battleSystem);
        
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update visual elements
        this.updateVisuals();
        
        // Update aura animation if present
        if (this.auraAnimation) {
            this.auraAnimation(Date.now());
        }
    }
    
    makeDecision(battleSystem) {
        if (!this.target) return;
        
        const distanceToTarget = this.position.distanceTo(this.target.position);
        const healthPercent = 1 - (this.damage / this.maxDamage);
        
        // Analyze current situation
        const inAttackRange = distanceToTarget <= this.attackRange;
        const shouldRetreat = this.damage > this.retreatThreshold && this.combatStyle !== 'berserker';
        const canAttack = Date.now() - this.lastAttackTime > this.attackCooldown;
        
        // State decision making
        switch (this.state) {
            case 'idle':
                if (distanceToTarget <= this.detectionRange) {
                    this.state = inAttackRange ? 'attacking' : 'pursuing';
                    this.pursuitTimer = 0;
                }
                break;
                
            case 'pursuing':
                if (inAttackRange && canAttack) {
                    this.state = 'attacking';
                } else if (shouldRetreat) {
                    this.state = 'retreating';
                } else if (this.pursuitTimer > this.maxPursuitTime) {
                    this.state = 'idle';
                }
                this.pursuitTimer += this.decisionCooldown;
                break;
                
            case 'attacking':
                if (!inAttackRange) {
                    this.state = 'pursuing';
                } else if (shouldRetreat) {
                    this.state = 'retreating';
                }
                break;
                
            case 'retreating':
                if (healthPercent > 0.6 && distanceToTarget > this.personalSpaceRadius * 2) {
                    this.state = 'pursuing';
                } else if (distanceToTarget > this.detectionRange) {
                    this.state = 'idle';
                }
                break;
        }
        
        // Personality-based decision modifications
        if (this.personality.recklessness > 0.7 && Math.random() < 0.3) {
            this.state = 'attacking';
        }
        
        if (this.personality.patience < 0.3 && this.state === 'idle') {
            this.state = 'pursuing';
        }
    }
    
    updateAI(deltaTime, battleSystem) {
        if (!this.target) return;
        
        const targetDirection = new THREE.Vector3().subVectors(this.target.position, this.position).normalize();
        const distanceToTarget = this.position.distanceTo(this.target.position);
        
        // Clear previous frame's acceleration
        this.acceleration.set(0, 0, 0);
        
        switch (this.state) {
            case 'idle':
                this.behaviorIdle(deltaTime);
                break;
                
            case 'pursuing':
                this.behaviorPursue(targetDirection, distanceToTarget, deltaTime);
                break;
                
            case 'attacking':
                this.behaviorAttack(targetDirection, distanceToTarget, deltaTime, battleSystem);
                break;
                
            case 'retreating':
                this.behaviorRetreat(targetDirection, distanceToTarget, deltaTime);
                break;
        }
        
        // Apply combat style modifications
        this.applyCombatStyle(targetDirection, distanceToTarget, deltaTime);
        
        // Random jumping based on difficulty
        if (this.isOnGround && Math.random() < this.jumpFrequency) {
            this.jump();
        }
        
        // Update last known target position
        if (distanceToTarget <= this.detectionRange) {
            this.lastKnownTargetPosition = this.target.position.clone();
        }
    }
    
    behaviorIdle(deltaTime) {
        // Patrol behavior
        if (this.movementPattern === 'patrol') {
            const targetPoint = this.patrolPoints[this.currentPatrolIndex];
            const direction = new THREE.Vector3().subVectors(targetPoint, this.position).normalize();
            
            if (this.position.distanceTo(targetPoint) < 2) {
                this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            }
            
            this.acceleration.add(direction.multiplyScalar(this.baseSpeed * 0.5));
        }
        
        // Guard behavior - stay near spawn
        else if (this.movementPattern === 'guard') {
            const spawnDirection = new THREE.Vector3().subVectors(this.lastGroundPosition, this.position);
            if (spawnDirection.length() > 5) {
                this.acceleration.add(spawnDirection.normalize().multiplyScalar(this.baseSpeed * 0.3));
            }
        }
    }
    
    behaviorPursue(targetDirection, distanceToTarget, deltaTime) {
        let moveDirection = targetDirection.clone();
        
        // Adjust pursuit based on movement pattern
        switch (this.movementPattern) {
            case 'hunter':
                // Direct pursuit
                break;
                
            case 'flanker':
                // Try to flank around target
                const flankAngle = Math.sin(Date.now() * 0.002) * 0.5;
                moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), flankAngle);
                break;
                
            case 'territorial':
                // Only pursue within territory
                if (distanceToTarget > this.detectionRange * 0.8) {
                    moveDirection.multiplyScalar(0.5);
                }
                break;
        }
        
        this.acceleration.add(moveDirection.multiplyScalar(this.baseSpeed));
        
        // Avoidance behavior - avoid other bots
        this.avoidOtherBots(deltaTime);
    }
    
    behaviorAttack(targetDirection, distanceToTarget, deltaTime, battleSystem) {
        // Move towards target for attack
        if (distanceToTarget > this.attackRange * 0.8) {
            this.acceleration.add(targetDirection.multiplyScalar(this.baseSpeed * 1.2));
        }
        
        // Perform attack if in range and ready
        if (distanceToTarget <= this.attackRange && Date.now() - this.lastAttackTime > this.attackCooldown) {
            this.performAttack(battleSystem);
        }
        
        // Circle strafe for higher difficulty bots
        if (this.difficulty >= 3) {
            const strafeDirection = new THREE.Vector3(-targetDirection.z, 0, targetDirection.x);
            this.acceleration.add(strafeDirection.multiplyScalar(this.baseSpeed * 0.3));
        }
    }
    
    behaviorRetreat(targetDirection, distanceToTarget, deltaTime) {
        // Move away from target
        const retreatDirection = targetDirection.clone().multiplyScalar(-1);
        this.acceleration.add(retreatDirection.multiplyScalar(this.baseSpeed * 0.8));
        
        // Try to find cover or higher ground
        this.seekCover(deltaTime);
        
        // Jump more frequently when retreating
        if (this.isOnGround && Math.random() < 0.05) {
            this.jump();
        }
    }
    
    applyCombatStyle(targetDirection, distanceToTarget, deltaTime) {
        switch (this.combatStyle) {
            case 'aggressive':
                if (distanceToTarget < this.attackRange * 2) {
                    this.acceleration.add(targetDirection.multiplyScalar(this.baseSpeed * 0.5));
                }
                break;
                
            case 'defensive':
                if (distanceToTarget < this.personalSpaceRadius) {
                    this.acceleration.add(targetDirection.multiplyScalar(-this.baseSpeed * 0.3));
                }
                break;
                
            case 'hit_and_run':
                if (Date.now() - this.lastAttackTime < 1000) {
                    this.acceleration.add(targetDirection.multiplyScalar(-this.baseSpeed * 0.6));
                }
                break;
                
            case 'berserker':
                // Always charge forward
                this.acceleration.add(targetDirection.multiplyScalar(this.baseSpeed * 0.8));
                break;
        }
    }
    
    avoidOtherBots(deltaTime) {
        // This would need access to other bots from battleSystem
        // For now, placeholder implementation
    }
    
    seekCover(deltaTime) {
        // Look for nearby obstacles or elevated positions
        // Placeholder implementation
    }
    
    performAttack(battleSystem) {
        this.lastAttackTime = Date.now();
        
        // Check if target is in range
        const distanceToTarget = this.position.distanceTo(this.target.position);
        if (distanceToTarget <= this.attackRange) {
            // Deal damage to target
            if (this.target === battleSystem.player) {
                this.attackPlayer(battleSystem);
            }
            
            // Create attack effect
            this.createAttackEffect();
        }
    }
    
    attackPlayer(battleSystem) {
        // Calculate damage
        const damage = this.attackDamage + Math.random() * 5;
        
        // Apply damage to player
        battleSystem.playerDamage += damage;
        
        // Calculate knockback
        const knockbackForce = battleSystem.calculateKnockback(battleSystem.playerDamage);
        
        // Apply knockback to player
        const knockbackDirection = new THREE.Vector3()
            .subVectors(this.target.position, this.position)
            .normalize()
            .multiplyScalar(knockbackForce);
        
        // Apply knockback to player velocity
        if (this.target.velocity) {
            this.target.velocity.add(knockbackDirection);
        }
        
        // Create hit effect
        battleSystem.createHitEffect(this.target.position, damage);
        
        // Screen shake
        battleSystem.addScreenShake(0.4);
        
        console.log(`Bot ${this.id} attacked player for ${damage} damage`);
    }
    
    createAttackEffect() {
        // Create visual effect for bot attack
        const geometry = new THREE.RingGeometry(0.5, 2, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(this.position);
        ring.position.y += 1;
        ring.lookAt(this.target.position);
        this.scene.add(ring);
        
        // Animate and remove
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 200;
            
            if (progress >= 1) {
                this.scene.remove(ring);
                return;
            }
            
            ring.scale.setScalar(1 + progress * 0.8);
            ring.material.opacity = 0.8 * (1 - progress);
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    jump() {
        if (this.isOnGround) {
            this.velocity.y = this.jumpForce;
            this.isOnGround = false;
        }
    }
    
    applyKnockback(direction, force) {
        this.velocity.add(direction.multiplyScalar(force));
        this.state = 'stunned';
        this.stunTimer = this.stunDuration;
        
        // Increase damage based on knockback
        const knockbackDamage = force * 0.5;
        this.damage += knockbackDamage;
    }
    
    updatePhysics(deltaTime) {
        // Apply gravity
        this.velocity.y += this.gravity * deltaTime;
        
        // Apply acceleration
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        
        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.z *= this.friction;
        
        // Limit max speed
        const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        if (horizontalSpeed > this.maxSpeed) {
            this.velocity.x = (this.velocity.x / horizontalSpeed) * this.maxSpeed;
            this.velocity.z = (this.velocity.z / horizontalSpeed) * this.maxSpeed;
        }
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Ground collision (simple)
        if (this.position.y <= this.radius) {
            this.position.y = this.radius;
            this.velocity.y = 0;
            this.isOnGround = true;
            this.lastGroundPosition = this.position.clone();
        } else {
            this.isOnGround = false;
        }
        
        // Keep within arena bounds
        const arenaSize = 18;
        this.position.x = Math.max(-arenaSize, Math.min(arenaSize, this.position.x));
        this.position.z = Math.max(-arenaSize, Math.min(arenaSize, this.position.z));
        
        // Update mesh position
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }
    
    updateVisuals() {
        // Update health bar
        if (this.healthBar) {
            const healthPercent = Math.max(0, 1 - (this.damage / this.maxDamage));
            this.healthBar.scale.x = healthPercent;
            
            // Change color based on health
            if (healthPercent > 0.6) {
                this.healthBar.material.color.setHex(0x00ff00);
            } else if (healthPercent > 0.3) {
                this.healthBar.material.color.setHex(0xffff00);
            } else {
                this.healthBar.material.color.setHex(0xff0000);
            }
        }
        
        // Flash effect when damaged
        if (Date.now() - this.lastHitTime < 200) {
            this.mesh.material.emissive.setHex(0xff0000);
        } else {
            this.mesh.material.emissive.setHex(0x000000);
        }
    }
    
    takeDamage(damage) {
        if (Date.now() - this.lastHitTime < this.hitCooldown) return;
        
        this.damage += damage;
        this.lastHitTime = Date.now();
        
        // Become more aggressive when damaged
        if (this.damage > this.maxDamage * 0.5) {
            this.aggressiveness = Math.min(1, this.aggressiveness + 0.2);
        }
        
        console.log(`Bot ${this.id} took ${damage} damage (${this.damage}/${this.maxDamage})`);
    }
    
    isDefeated() {
        return this.damage >= this.maxDamage;
    }
    
    cleanup() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        this.isActive = false;
    }
    
    // Debug methods
    getDebugInfo() {
        return {
            id: this.id,
            state: this.state,
            damage: this.damage,
            position: this.position.clone(),
            velocity: this.velocity.clone(),
            difficulty: this.difficulty,
            combatStyle: this.combatStyle,
            movementPattern: this.movementPattern
        };
    }
} 