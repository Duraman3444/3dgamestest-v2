import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class BattleSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.bots = [];
        this.isActive = false;
        this.currentLevel = 1;
        this.maxLevel = 7;
        this.arenaSize = 20;
        this.arenaBounds = {
            min: new THREE.Vector3(-this.arenaSize, -100, -this.arenaSize),
            max: new THREE.Vector3(this.arenaSize, 100, this.arenaSize)
        };
        
        // Initialize arena manager
        import('./arenaManager.js').then(({ ArenaManager }) => {
            this.arenaManager = new ArenaManager(this.scene);
        });
        
        // Battle state
        this.battleState = 'waiting'; // 'waiting', 'active', 'won', 'lost'
        this.roundStartTime = 0;
        this.victoryCallback = null;
        this.defeatCallback = null;
        
        // Damage system
        this.playerDamage = 0;
        this.maxDamage = 300;
        this.baseKnockback = 10;
        this.knockbackScaling = 0.5;
        
        // Combat settings
        this.hitCooldown = 0.5; // Seconds between hits
        this.lastHitTime = 0;
        this.hitRadius = 3;
        this.combatForce = 15;
        
        // Level configurations
        this.levelConfigs = this.initializeLevelConfigs();
        
        // Environmental hazards
        this.hazards = [];
        this.hazardUpdateInterval = 1000; // ms
        this.lastHazardUpdate = 0;
        
        // Visual effects
        this.particles = [];
        this.shakeIntensity = 0;
        this.shakeDecay = 0.95;
        
        this.setupEventListeners();
    }
    
    initializeLevelConfigs() {
        return {
            1: {
                name: "Candy Plains",
                theme: "candy",
                colors: {
                    ground: 0xff69b4,
                    walls: 0x87ceeb,
                    accent: 0xffc0cb,
                    ambient: 0xfff0f5
                },
                botCount: 1,
                botDifficulty: 1,
                hazards: ["bouncepad"],
                specialPhysics: null,
                description: "Sweet and simple introduction to battle!"
            },
            2: {
                name: "Forest Brawl",
                theme: "forest",
                colors: {
                    ground: 0x228b22,
                    walls: 0x8b4513,
                    accent: 0x32cd32,
                    ambient: 0x2f4f2f
                },
                botCount: 1,
                botDifficulty: 2,
                hazards: ["moving_platforms", "fog"],
                specialPhysics: null,
                description: "Dense forest combat with moving platforms"
            },
            3: {
                name: "Volcano Clash",
                theme: "volcano",
                colors: {
                    ground: 0x8b0000,
                    walls: 0x2f4f4f,
                    accent: 0xff4500,
                    ambient: 0x800000
                },
                botCount: 2,
                botDifficulty: 3,
                hazards: ["lava_spurts", "falling_rocks"],
                specialPhysics: null,
                description: "Fiery arena with lava hazards and dual opponents"
            },
            4: {
                name: "Frostbite Field",
                theme: "ice",
                colors: {
                    ground: 0x4169e1,
                    walls: 0xfffafa,
                    accent: 0x00bfff,
                    ambient: 0xe6f3ff
                },
                botCount: 2,
                botDifficulty: 4,
                hazards: ["ice_spikes", "slippery_zones"],
                specialPhysics: "slippery",
                description: "Icy battlefield with reduced friction"
            },
            5: {
                name: "Retro Grid",
                theme: "cyber",
                colors: {
                    ground: 0x4b0082,
                    walls: 0x8a2be2,
                    accent: 0x00ffff,
                    ambient: 0x191970
                },
                botCount: 2,
                botDifficulty: 5,
                hazards: ["energy_beams", "teleporters"],
                specialPhysics: null,
                description: "Neon-lit cyber arena with energy hazards"
            },
            6: {
                name: "Storm Zone",
                theme: "storm",
                colors: {
                    ground: 0x696969,
                    walls: 0x2f4f4f,
                    accent: 0xffff00,
                    ambient: 0x1c1c1c
                },
                botCount: 3,
                botDifficulty: 6,
                hazards: ["lightning", "wind_gusts"],
                specialPhysics: null,
                description: "Stormy arena with lightning strikes and wind"
            },
            7: {
                name: "Final Smash",
                theme: "space",
                colors: {
                    ground: 0x000000,
                    walls: 0x8b0000,
                    accent: 0xff0000,
                    ambient: 0x000000
                },
                botCount: 3,
                botDifficulty: 7,
                hazards: ["void_zones", "meteor_shower"],
                specialPhysics: null,
                description: "Final battle in the depths of space"
            }
        };
    }
    
    setupEventListeners() {
        // Battle-specific controls
        document.addEventListener('keydown', (event) => {
            if (!this.isActive) return;
            
            switch(event.code) {
                case 'KeyF': // Attack key
                    this.performAttack();
                    break;
                case 'KeyQ': // Special ability (future)
                    this.performSpecialAttack();
                    break;
            }
        });
        
        // Mouse click for attack
        document.addEventListener('click', (event) => {
            if (!this.isActive) return;
            this.performAttack();
        });
    }
    
    startBattle(level = 1) {
        this.currentLevel = Math.min(level, this.maxLevel);
        this.isActive = true;
        this.battleState = 'active';
        this.roundStartTime = Date.now();
        
        // Reset player damage
        this.playerDamage = 0;
        
        // Get level configuration
        const config = this.levelConfigs[this.currentLevel];
        
        // Create arena using ArenaManager
        if (this.arenaManager) {
            this.arenaManager.createArena(config);
        }
        
        // Clear existing bots
        this.clearBots();
        
        // Create new bots based on level
        this.createBots(config.botCount, config.botDifficulty);
        
        // Setup arena hazards
        this.setupArenaHazards(config.hazards);
        
        // Apply special physics if needed
        if (config.specialPhysics) {
            this.applySpecialPhysics(config.specialPhysics);
        }
        
        // Trigger level start UI
        if (this.onLevelStart) {
            this.onLevelStart(config);
        }
        
        console.log(`Battle started - Level ${this.currentLevel}: ${config.name}`);
    }
    
    createBots(count, difficulty) {
        // Import and create bots with BotAI
        for (let i = 0; i < count; i++) {
            // Spawn positions around the arena
            const angle = (i / count) * Math.PI * 2;
            const spawnRadius = 8;
            const spawnPosition = new THREE.Vector3(
                Math.cos(angle) * spawnRadius,
                2,
                Math.sin(angle) * spawnRadius
            );
            
            // Create bot with BotAI (will be imported dynamically)
            import('./botAI.js').then(({ BotAI }) => {
                const bot = new BotAI(this.scene, i, spawnPosition, difficulty);
                bot.setTarget(this.player);
                this.bots.push(bot);
            });
        }
    }
    
    clearBots() {
        this.bots.forEach(bot => {
            if (bot.cleanup) {
                bot.cleanup();
            } else if (bot.mesh) {
                this.scene.remove(bot.mesh);
            }
        });
        this.bots = [];
    }
    
    setupArenaHazards(hazardTypes) {
        // Clear existing hazards
        this.clearHazards();
        
        hazardTypes.forEach(type => {
            switch(type) {
                case 'bouncepad':
                    this.createBouncePads();
                    break;
                case 'moving_platforms':
                    this.createMovingPlatforms();
                    break;
                case 'lava_spurts':
                    this.createLavaSpurts();
                    break;
                case 'ice_spikes':
                    this.createIceSpikes();
                    break;
                case 'energy_beams':
                    this.createEnergyBeams();
                    break;
                case 'lightning':
                    this.createLightningSystem();
                    break;
                case 'void_zones':
                    this.createVoidZones();
                    break;
            }
        });
    }
    
    createBouncePads() {
        // Create 4 bounce pads at corners
        const positions = [
            new THREE.Vector3(10, 0, 10),
            new THREE.Vector3(-10, 0, 10),
            new THREE.Vector3(10, 0, -10),
            new THREE.Vector3(-10, 0, -10)
        ];
        
        positions.forEach(pos => {
            const geometry = new THREE.CylinderGeometry(2, 2, 0.5, 8);
            const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
            const bouncePad = new THREE.Mesh(geometry, material);
            bouncePad.position.copy(pos);
            this.scene.add(bouncePad);
            
            this.hazards.push({
                type: 'bouncepad',
                mesh: bouncePad,
                position: pos,
                radius: 2,
                force: 20
            });
        });
    }
    
    createMovingPlatforms() {
        // Create 2 moving platforms
        for (let i = 0; i < 2; i++) {
            const geometry = new THREE.BoxGeometry(4, 0.5, 4);
            const material = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
            const platform = new THREE.Mesh(geometry, material);
            platform.position.set(i * 10 - 5, 3, 0);
            this.scene.add(platform);
            
            this.hazards.push({
                type: 'moving_platform',
                mesh: platform,
                startPos: platform.position.clone(),
                moveRange: 8,
                speed: 2,
                direction: 1
            });
        }
    }
    
    createLavaSpurts() {
        // Create lava spurt zones
        const spurtPositions = [
            new THREE.Vector3(0, 0, 8),
            new THREE.Vector3(6, 0, -4),
            new THREE.Vector3(-6, 0, -4)
        ];
        
        spurtPositions.forEach(pos => {
            const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 8);
            const material = new THREE.MeshPhongMaterial({ color: 0xff4500 });
            const spurt = new THREE.Mesh(geometry, material);
            spurt.position.copy(pos);
            this.scene.add(spurt);
            
            this.hazards.push({
                type: 'lava_spurt',
                mesh: spurt,
                position: pos,
                radius: 1.5,
                damage: 25,
                cooldown: 3000,
                lastActivation: 0
            });
        });
    }
    
    createIceSpikes() {
        // Create ice spike zones
        const spikePositions = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(8, 0, 8),
            new THREE.Vector3(-8, 0, 8)
        ];
        
        spikePositions.forEach(pos => {
            const geometry = new THREE.ConeGeometry(1, 3, 6);
            const material = new THREE.MeshPhongMaterial({ color: 0x4169e1 });
            const spike = new THREE.Mesh(geometry, material);
            spike.position.copy(pos);
            spike.position.y = -2; // Hidden initially
            this.scene.add(spike);
            
            this.hazards.push({
                type: 'ice_spike',
                mesh: spike,
                position: pos,
                radius: 1,
                damage: 20,
                cooldown: 4000,
                lastActivation: 0,
                isRaised: false
            });
        });
    }
    
    createEnergyBeams() {
        // Create energy beam system
        const beamPositions = [
            { start: new THREE.Vector3(-15, 5, 0), end: new THREE.Vector3(15, 5, 0) },
            { start: new THREE.Vector3(0, 5, -15), end: new THREE.Vector3(0, 5, 15) }
        ];
        
        beamPositions.forEach(beam => {
            const geometry = new THREE.CylinderGeometry(0.5, 0.5, 30, 8);
            const material = new THREE.MeshPhongMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });
            const beamMesh = new THREE.Mesh(geometry, material);
            beamMesh.position.copy(beam.start).lerp(beam.end, 0.5);
            beamMesh.lookAt(beam.end);
            beamMesh.rotateZ(Math.PI / 2);
            beamMesh.visible = false;
            this.scene.add(beamMesh);
            
            this.hazards.push({
                type: 'energy_beam',
                mesh: beamMesh,
                start: beam.start,
                end: beam.end,
                damage: 15,
                cooldown: 5000,
                lastActivation: 0,
                duration: 2000
            });
        });
    }
    
    createLightningSystem() {
        // Lightning will be created dynamically
        this.hazards.push({
            type: 'lightning',
            damage: 30,
            radius: 3,
            cooldown: 4000,
            lastActivation: 0
        });
    }
    
    createVoidZones() {
        // Create void zones that instantly KO
        const voidPositions = [
            new THREE.Vector3(12, 0, 12),
            new THREE.Vector3(-12, 0, 12),
            new THREE.Vector3(12, 0, -12),
            new THREE.Vector3(-12, 0, -12)
        ];
        
        voidPositions.forEach(pos => {
            const geometry = new THREE.CylinderGeometry(2, 2, 0.1, 8);
            const material = new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0.8 });
            const voidZone = new THREE.Mesh(geometry, material);
            voidZone.position.copy(pos);
            this.scene.add(voidZone);
            
            this.hazards.push({
                type: 'void_zone',
                mesh: voidZone,
                position: pos,
                radius: 2,
                damage: 999 // Instant KO
            });
        });
    }
    
    clearHazards() {
        this.hazards.forEach(hazard => {
            if (hazard.mesh) {
                this.scene.remove(hazard.mesh);
            }
        });
        this.hazards = [];
    }
    
    applySpecialPhysics(type) {
        switch(type) {
            case 'slippery':
                // Reduce friction for player and bots
                if (this.player) {
                    this.player.friction = 0.1;
                }
                this.bots.forEach(bot => {
                    if (bot.friction !== undefined) {
                        bot.friction = 0.1;
                    }
                });
                break;
        }
    }
    
    performAttack() {
        const currentTime = Date.now();
        if (currentTime - this.lastHitTime < this.hitCooldown * 1000) {
            return; // Still in cooldown
        }
        
        this.lastHitTime = currentTime;
        
        // Check for hits on bots
        this.bots.forEach(bot => {
            if (!bot.isActive) return;
            
            const botPosition = bot.position || bot.mesh?.position;
            if (!botPosition) return;
            
            const distance = this.player.position.distanceTo(botPosition);
            if (distance <= this.hitRadius) {
                this.hitBot(bot);
            }
        });
        
        // Visual feedback for attack
        this.createAttackEffect();
    }
    
    performSpecialAttack() {
        // Placeholder for special attacks
        console.log('Special attack performed!');
    }
    
    hitBot(bot) {
        // Calculate damage
        const damage = 10 + Math.random() * 10; // 10-20 damage
        
        // Apply damage using BotAI method if available
        if (bot.takeDamage) {
            bot.takeDamage(damage);
        } else {
            bot.damage += damage;
        }
        
        // Calculate knockback
        const knockback = this.calculateKnockback(bot.damage);
        
        // Apply knockback
        const knockbackDirection = new THREE.Vector3()
            .subVectors(bot.position, this.player.position)
            .normalize();
        
        // Apply knockback to bot (handled by BotAI)
        if (bot.applyKnockback) {
            bot.applyKnockback(knockbackDirection, knockback);
        }
        
        // Create hit effect
        this.createHitEffect(bot.position, damage);
        
        // Screen shake for heavy hits
        if (bot.damage > 50) {
            this.addScreenShake(0.5);
        }
        
        // Check if bot is KO'd
        if (bot.isDefeated && bot.isDefeated()) {
            this.knockoutBot(bot);
        } else if (bot.damage >= this.maxDamage) {
            this.knockoutBot(bot);
        }
    }
    
    calculateKnockback(damage) {
        return this.baseKnockback + (damage * this.knockbackScaling);
    }
    
    knockoutBot(bot) {
        bot.isActive = false;
        
        // Cleanup bot using BotAI method if available
        if (bot.cleanup) {
            bot.cleanup();
        } else if (bot.mesh) {
            this.scene.remove(bot.mesh);
        }
        
        // Check win condition
        const activeBots = this.bots.filter(b => b.isActive);
        if (activeBots.length === 0) {
            this.handleVictory();
        }
    }
    
    handleVictory() {
        this.battleState = 'won';
        this.isActive = false;
        
        if (this.victoryCallback) {
            this.victoryCallback(this.currentLevel);
        }
    }
    
    handleDefeat() {
        this.battleState = 'lost';
        this.isActive = false;
        
        if (this.defeatCallback) {
            this.defeatCallback();
        }
    }
    
    createAttackEffect() {
        // Create visual effect for player attack
        const geometry = new THREE.RingGeometry(1, 3, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(this.player.position);
        ring.position.y += 1;
        ring.lookAt(this.player.position.x, this.player.position.y + 1, this.player.position.z + 1);
        this.scene.add(ring);
        
        // Animate and remove
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 300; // 300ms duration
            
            if (progress >= 1) {
                this.scene.remove(ring);
                return;
            }
            
            ring.scale.setScalar(1 + progress * 0.5);
            ring.material.opacity = 0.8 * (1 - progress);
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    createHitEffect(position, damage) {
        // Create hit effect particles
        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 4, 4);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            particle.position.y += 1;
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 10
            );
            
            this.scene.add(particle);
            
            this.particles.push({
                mesh: particle,
                velocity: velocity,
                life: 1000,
                startTime: Date.now()
            });
        }
        
        // Damage number display (will be handled by UI)
        if (this.onDamageDealt) {
            this.onDamageDealt(position, damage);
        }
    }
    
    addScreenShake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update arena manager
        if (this.arenaManager) {
            this.arenaManager.update(deltaTime);
        }
        
        // Update hazards
        this.updateHazards(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update screen shake
        this.updateScreenShake(deltaTime);
        
        // Check arena boundaries
        this.checkArenaBoundaries();
        
        // Update bot AI
        this.updateBots(deltaTime);
    }
    
    updateHazards(deltaTime) {
        const currentTime = Date.now();
        
        this.hazards.forEach(hazard => {
            switch(hazard.type) {
                case 'moving_platform':
                    // Move platform back and forth
                    hazard.mesh.position.x += hazard.speed * hazard.direction * deltaTime;
                    if (Math.abs(hazard.mesh.position.x - hazard.startPos.x) > hazard.moveRange) {
                        hazard.direction *= -1;
                    }
                    break;
                    
                case 'lava_spurt':
                    // Activate lava spurts periodically
                    if (currentTime - hazard.lastActivation > hazard.cooldown) {
                        this.activateLavaSpurt(hazard);
                        hazard.lastActivation = currentTime;
                    }
                    break;
                    
                case 'ice_spike':
                    // Raise and lower ice spikes
                    if (currentTime - hazard.lastActivation > hazard.cooldown) {
                        this.activateIceSpike(hazard);
                        hazard.lastActivation = currentTime;
                    }
                    break;
                    
                case 'energy_beam':
                    // Activate energy beams
                    if (currentTime - hazard.lastActivation > hazard.cooldown) {
                        this.activateEnergyBeam(hazard);
                        hazard.lastActivation = currentTime;
                    }
                    break;
                    
                case 'lightning':
                    // Strike lightning randomly
                    if (currentTime - hazard.lastActivation > hazard.cooldown) {
                        this.strikeLightning(hazard);
                        hazard.lastActivation = currentTime;
                    }
                    break;
            }
        });
    }
    
    activateLavaSpurt(hazard) {
        // Create temporary lava effect
        const geometry = new THREE.CylinderGeometry(hazard.radius, hazard.radius, 8, 8);
        const material = new THREE.MeshPhongMaterial({ color: 0xff4500 });
        const lavaSpurt = new THREE.Mesh(geometry, material);
        lavaSpurt.position.copy(hazard.position);
        lavaSpurt.position.y = 4;
        this.scene.add(lavaSpurt);
        
        // Check for damage
        this.checkHazardDamage(hazard);
        
        // Remove after duration
        setTimeout(() => {
            this.scene.remove(lavaSpurt);
        }, 2000);
    }
    
    activateIceSpike(hazard) {
        // Raise spike
        hazard.mesh.position.y = 1.5;
        hazard.isRaised = true;
        
        // Check for damage
        this.checkHazardDamage(hazard);
        
        // Lower spike after duration
        setTimeout(() => {
            hazard.mesh.position.y = -2;
            hazard.isRaised = false;
        }, 2000);
    }
    
    activateEnergyBeam(hazard) {
        // Show beam
        hazard.mesh.visible = true;
        
        // Check for damage
        this.checkBeamDamage(hazard);
        
        // Hide beam after duration
        setTimeout(() => {
            hazard.mesh.visible = false;
        }, hazard.duration);
    }
    
    strikeLightning(hazard) {
        // Random position on arena
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * this.arenaSize * 1.5,
            0,
            (Math.random() - 0.5) * this.arenaSize * 1.5
        );
        
        // Create lightning effect
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 20, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const lightning = new THREE.Mesh(geometry, material);
        lightning.position.copy(position);
        lightning.position.y = 10;
        this.scene.add(lightning);
        
        // Check for damage
        const distance = this.player.position.distanceTo(position);
        if (distance <= hazard.radius) {
            this.damagePlayer(hazard.damage);
        }
        
        // Damage bots
        this.bots.forEach(bot => {
            if (bot.isActive) {
                const botDistance = bot.position.distanceTo(position);
                if (botDistance <= hazard.radius) {
                    this.damageBot(bot, hazard.damage);
                }
            }
        });
        
        // Remove lightning after short duration
        setTimeout(() => {
            this.scene.remove(lightning);
        }, 200);
    }
    
    checkHazardDamage(hazard) {
        // Check player damage
        const playerDistance = this.player.position.distanceTo(hazard.position);
        if (playerDistance <= hazard.radius) {
            this.damagePlayer(hazard.damage);
        }
        
        // Check bot damage
        this.bots.forEach(bot => {
            if (bot.isActive) {
                const botDistance = bot.position.distanceTo(hazard.position);
                if (botDistance <= hazard.radius) {
                    this.damageBot(bot, hazard.damage);
                }
            }
        });
    }
    
    checkBeamDamage(hazard) {
        // Check if player is in beam path
        const playerPos = this.player.position;
        const beamStart = hazard.start;
        const beamEnd = hazard.end;
        
        // Simple distance to line check
        const distance = this.distanceToLine(playerPos, beamStart, beamEnd);
        if (distance <= 1) {
            this.damagePlayer(hazard.damage);
        }
        
        // Check bots
        this.bots.forEach(bot => {
            if (bot.isActive) {
                const botDistance = this.distanceToLine(bot.position, beamStart, beamEnd);
                if (botDistance <= 1) {
                    this.damageBot(bot, hazard.damage);
                }
            }
        });
    }
    
    distanceToLine(point, lineStart, lineEnd) {
        const line = new THREE.Vector3().subVectors(lineEnd, lineStart);
        const pointToStart = new THREE.Vector3().subVectors(point, lineStart);
        const projection = pointToStart.dot(line) / line.lengthSq();
        
        if (projection < 0) return point.distanceTo(lineStart);
        if (projection > 1) return point.distanceTo(lineEnd);
        
        const closestPoint = lineStart.clone().add(line.multiplyScalar(projection));
        return point.distanceTo(closestPoint);
    }
    
    damagePlayer(damage) {
        this.playerDamage += damage;
        
        // Screen shake
        this.addScreenShake(0.3);
        
        // Check if player is KO'd
        if (this.playerDamage >= this.maxDamage) {
            this.handleDefeat();
        }
    }
    
    damageBot(bot, damage) {
        bot.damage += damage;
        
        // Check if bot is KO'd
        if (bot.damage >= this.maxDamage) {
            this.knockoutBot(bot);
        }
    }
    
    updateParticles(deltaTime) {
        const currentTime = Date.now();
        
        this.particles = this.particles.filter(particle => {
            const age = currentTime - particle.startTime;
            if (age >= particle.life) {
                this.scene.remove(particle.mesh);
                return false;
            }
            
            // Update particle position
            particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            
            // Apply gravity
            particle.velocity.y -= 20 * deltaTime;
            
            // Fade out
            const alpha = 1 - (age / particle.life);
            particle.mesh.material.opacity = alpha;
            
            return true;
        });
    }
    
    updateScreenShake(deltaTime) {
        if (this.shakeIntensity > 0) {
            this.shakeIntensity *= this.shakeDecay;
            
            if (this.shakeIntensity < 0.01) {
                this.shakeIntensity = 0;
            }
        }
    }
    
    checkArenaBoundaries() {
        // Check if player fell off
        if (this.player.position.y < this.arenaBounds.min.y) {
            this.handleDefeat();
        }
        
        // Check if bots fell off
        this.bots.forEach(bot => {
            if (bot.isActive && bot.position.y < this.arenaBounds.min.y) {
                this.knockoutBot(bot);
            }
        });
    }
    
    updateBots(deltaTime) {
        // Update all active bots
        this.bots.forEach(bot => {
            if (bot.isActive && bot.update) {
                bot.update(deltaTime, this);
            }
        });
    }
    
    setVictoryCallback(callback) {
        this.victoryCallback = callback;
    }
    
    setDefeatCallback(callback) {
        this.defeatCallback = callback;
    }
    
    setLevelStartCallback(callback) {
        this.onLevelStart = callback;
    }
    
    setDamageCallback(callback) {
        this.onDamageDealt = callback;
    }
    
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    getLevelConfig(level) {
        return this.levelConfigs[level];
    }
    
    getPlayerDamage() {
        return this.playerDamage;
    }
    
    getBotDamages() {
        return this.bots.map(bot => ({ id: bot.id, damage: bot.damage, isActive: bot.isActive }));
    }
    
    getShakeIntensity() {
        return this.shakeIntensity;
    }
    
    cleanup() {
        this.isActive = false;
        this.clearBots();
        this.clearHazards();
        
        // Clear arena
        if (this.arenaManager) {
            this.arenaManager.clearArena();
        }
        
        // Clear particles
        this.particles.forEach(particle => {
            this.scene.remove(particle.mesh);
        });
        this.particles = [];
        
        // Reset player damage
        this.playerDamage = 0;
        this.shakeIntensity = 0;
    }
} 