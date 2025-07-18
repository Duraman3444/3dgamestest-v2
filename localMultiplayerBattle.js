import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class LocalMultiplayerBattle {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.isActive = false;
        
        // Arena properties
        this.arenaSize = 16;
        this.fallThreshold = -10;
        this.arena = null;
        this.arenaEdges = [];
        
        // Players
        this.player1 = null;
        this.player2 = null;
        this.players = [];
        
        // Physics
        this.pushForce = 15;
        this.maxSpeed = 12;
        this.friction = 0.92;
        this.gravity = -30;
        
        // Game state
        this.gameState = 'waiting'; // 'waiting', 'countdown', 'battle', 'roundEnd', 'gameEnd'
        this.currentRound = 1;
        this.maxRounds = 3;
        this.player1Wins = 0;
        this.player2Wins = 0;
        this.countdown = 3;
        this.roundTimer = 0;
        this.maxRoundTime = 60; // 60 seconds per round
        
        // UI elements
        this.uiElements = [];
        this.messages = [];
        
        // Controls
        this.keys = {};
        this.setupControls();
        
        // Callbacks
        this.onGameEnd = null;
        this.onBackToMenu = null;
        
        // Visual effects
        this.particles = [];
        this.cameraShake = 0;
        
        console.log('🥊 Local Multiplayer Battle system initialized');
    }
    
    setupControls() {
        // Track key states
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
    }
    
    createArena() {
        // Clear existing arena
        this.clearArena();
        
        // Create main arena platform
        const arenaGeometry = new THREE.CylinderGeometry(this.arenaSize, this.arenaSize, 1, 32);
        const arenaMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.9
        });
        
        this.arena = new THREE.Mesh(arenaGeometry, arenaMaterial);
        this.arena.position.set(0, 0, 0);
        this.scene.add(this.arena);
        
        // Create glowing danger zone around the edges
        this.createDangerZone();
        
        // Create arena decorations
        this.createArenaDecorations();
        
        // Set up lighting
        this.setupArenaLighting();
    }
    
    createDangerZone() {
        // Create warning rings around the arena edge
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.RingGeometry(this.arenaSize + (i * 0.5), this.arenaSize + (i * 0.5) + 0.2, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                transparent: true,
                opacity: 0.3 - (i * 0.1),
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(0, 0.1, 0);
            ring.rotation.x = -Math.PI / 2;
            this.scene.add(ring);
            this.arenaEdges.push(ring);
        }
    }
    
    createArenaDecorations() {
        // Add some pillars around the arena for atmosphere
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = this.arenaSize + 5;
            
            const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.8, 6, 8);
            const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(
                Math.cos(angle) * distance,
                3,
                Math.sin(angle) * distance
            );
            this.scene.add(pillar);
            this.arenaEdges.push(pillar);
        }
    }
    
    setupArenaLighting() {
        // Add dramatic lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        this.arenaEdges.push(ambientLight);
        
        // Spotlight from above
        const spotlight = new THREE.SpotLight(0xffffff, 1.5, 100, Math.PI / 6, 0.5);
        spotlight.position.set(0, 20, 0);
        spotlight.target.position.set(0, 0, 0);
        this.scene.add(spotlight);
        this.scene.add(spotlight.target);
        this.arenaEdges.push(spotlight);
        this.arenaEdges.push(spotlight.target);
    }
    
    createPlayers() {
        // Create Player 1 (Red)
        this.player1 = this.createPlayer(1, 0xff0000, new THREE.Vector3(-8, 2, 0));
        
        // Create Player 2 (Blue)
        this.player2 = this.createPlayer(2, 0x0000ff, new THREE.Vector3(8, 2, 0));
        
        this.players = [this.player1, this.player2];
    }
    
    createPlayer(playerNumber, color, position) {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshLambertMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.3
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        this.scene.add(mesh);
        
        // Create player object
        const player = {
            number: playerNumber,
            mesh: mesh,
            velocity: new THREE.Vector3(0, 0, 0),
            position: position.clone(),
            isOnGround: false,
            radius: 1,
            color: color,
            isAlive: true,
            spawnPosition: position.clone()
        };
        
        return player;
    }
    
    startBattle() {
        console.log('🥊 Starting Local Multiplayer Battle!');
        
        // Create arena and players
        this.createArena();
        this.createPlayers();
        
        // Set up camera
        this.setupCamera();
        
        // Start countdown
        this.gameState = 'countdown';
        this.countdown = 3;
        this.isActive = true;
        
        // Show start message
        this.showMessage('GLADIATOR BATTLE!', 2000);
        
        // Show controls
        this.showControls();
        
        // Start the game loop
        this.startGameLoop();
    }
    
    createArena() {
        // Create arena floor
        const arenaGeometry = new THREE.CylinderGeometry(this.arenaSize, this.arenaSize, 0.5, 32);
        const arenaMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        this.arena = new THREE.Mesh(arenaGeometry, arenaMaterial);
        this.arena.position.y = -0.25;
        this.scene.add(this.arena);
        
        // Create arena edges/barriers
        const edgeHeight = 1;
        const edgeGeometry = new THREE.TorusGeometry(this.arenaSize, 0.3, 8, 24);
        const edgeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edge.position.y = edgeHeight / 2;
        edge.rotation.x = Math.PI / 2;
        this.scene.add(edge);
        this.arenaEdges.push(edge);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        console.log('🏟️ Arena created');
    }
    
    createPlayers() {
        // Create Player 1 (Red)
        const player1Geometry = new THREE.SphereGeometry(1, 16, 16);
        const player1Material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const player1Mesh = new THREE.Mesh(player1Geometry, player1Material);
        
        this.player1 = {
            mesh: player1Mesh,
            position: new THREE.Vector3(-this.arenaSize / 2, 1, 0),
            spawnPosition: new THREE.Vector3(-this.arenaSize / 2, 1, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            radius: 1,
            isAlive: true,
            isOnGround: true
        };
        
        this.player1.mesh.position.copy(this.player1.position);
        this.scene.add(this.player1.mesh);
        
        // Create Player 2 (Blue)
        const player2Geometry = new THREE.SphereGeometry(1, 16, 16);
        const player2Material = new THREE.MeshLambertMaterial({ color: 0x0000ff });
        const player2Mesh = new THREE.Mesh(player2Geometry, player2Material);
        
        this.player2 = {
            mesh: player2Mesh,
            position: new THREE.Vector3(this.arenaSize / 2, 1, 0),
            spawnPosition: new THREE.Vector3(this.arenaSize / 2, 1, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            radius: 1,
            isAlive: true,
            isOnGround: true
        };
        
        this.player2.mesh.position.copy(this.player2.position);
        this.scene.add(this.player2.mesh);
        
        this.players = [this.player1, this.player2];
        
        console.log('👥 Players created');
    }
    
    render() {
        if (this.cameraShake > 0) {
            // Apply camera shake
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
            this.cameraShake *= 0.9;
            
            if (this.cameraShake < 0.01) {
                this.cameraShake = 0;
                this.camera.position.set(0, 25, 25);
                this.camera.lookAt(0, 0, 0);
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    createCollisionEffect(position) {
        // Create a simple particle effect at collision point
        const effectGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const effectMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const effectMesh = new THREE.Mesh(effectGeometry, effectMaterial);
        effectMesh.position.copy(position);
        this.scene.add(effectMesh);
        
        // Add to particles array for cleanup
        this.particles.push({
            mesh: effectMesh,
            life: 0.5,
            maxLife: 0.5
        });
    }
    
    updateVisualEffects(deltaTime) {
        // Update particles
        this.particles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            // Fade out
            const alpha = particle.life / particle.maxLife;
            particle.mesh.material.opacity = alpha;
            particle.mesh.material.transparent = true;
            
            // Scale down
            const scale = alpha;
            particle.mesh.scale.set(scale, scale, scale);
            
            // Remove if expired
            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                this.particles.splice(index, 1);
            }
        });
    }
    
    setupCamera() {
        // Position camera to show the entire arena
        this.camera.position.set(0, 25, 25);
        this.camera.lookAt(0, 0, 0);
    }
    
    startGameLoop() {
        const gameLoop = () => {
            if (!this.isActive) return;
            
            const deltaTime = 0.016; // ~60 FPS
            this.update(deltaTime);
            this.render();
            
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }
    
    update(deltaTime) {
        switch (this.gameState) {
            case 'countdown':
                this.updateCountdown(deltaTime);
                break;
            case 'battle':
                this.updateBattle(deltaTime);
                break;
            case 'roundEnd':
                this.updateRoundEnd(deltaTime);
                break;
            case 'gameEnd':
                this.updateGameEnd(deltaTime);
                break;
        }
        
        // Update visual effects
        this.updateVisualEffects(deltaTime);
    }
    
    updateCountdown(deltaTime) {
        this.countdown -= deltaTime;
        
        if (this.countdown <= 0) {
            this.gameState = 'battle';
            this.roundTimer = 0;
            this.showMessage('FIGHT!', 1000);
        } else {
            const countText = Math.ceil(this.countdown).toString();
            this.showMessage(countText, 100);
        }
    }
    
    updateBattle(deltaTime) {
        this.roundTimer += deltaTime;
        
        // Handle player controls
        this.handlePlayerControls(deltaTime);
        
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Check for collisions
        this.checkPlayerCollisions();
        
        // Check for fall-offs
        this.checkFallOffs();
        
        // Check for round timeout
        if (this.roundTimer >= this.maxRoundTime) {
            this.endRound('timeout');
        }
    }
    
    handlePlayerControls(deltaTime) {
        // Player 1 controls (WASD)
        if (this.player1.isAlive) {
            const p1Force = new THREE.Vector3(0, 0, 0);
            
            if (this.keys['KeyW']) p1Force.z -= 1;
            if (this.keys['KeyS']) p1Force.z += 1;
            if (this.keys['KeyA']) p1Force.x -= 1;
            if (this.keys['KeyD']) p1Force.x += 1;
            
            if (p1Force.length() > 0) {
                p1Force.normalize().multiplyScalar(this.maxSpeed);
                this.player1.velocity.add(p1Force.multiplyScalar(deltaTime));
            }
        }
        
        // Player 2 controls (Arrow Keys)
        if (this.player2.isAlive) {
            const p2Force = new THREE.Vector3(0, 0, 0);
            
            if (this.keys['ArrowUp']) p2Force.z -= 1;
            if (this.keys['ArrowDown']) p2Force.z += 1;
            if (this.keys['ArrowLeft']) p2Force.x -= 1;
            if (this.keys['ArrowRight']) p2Force.x += 1;
            
            if (p2Force.length() > 0) {
                p2Force.normalize().multiplyScalar(this.maxSpeed);
                this.player2.velocity.add(p2Force.multiplyScalar(deltaTime));
            }
        }
    }
    
    updatePhysics(deltaTime) {
        this.players.forEach(player => {
            if (!player.isAlive) return;
            
            // Apply gravity
            player.velocity.y += this.gravity * deltaTime;
            
            // Apply friction
            player.velocity.x *= this.friction;
            player.velocity.z *= this.friction;
            
            // Limit horizontal speed
            const horizontalSpeed = Math.sqrt(player.velocity.x ** 2 + player.velocity.z ** 2);
            if (horizontalSpeed > this.maxSpeed) {
                const scale = this.maxSpeed / horizontalSpeed;
                player.velocity.x *= scale;
                player.velocity.z *= scale;
            }
            
            // Update position
            player.position.add(player.velocity.clone().multiplyScalar(deltaTime));
            
            // Ground collision
            if (player.position.y <= player.radius) {
                player.position.y = player.radius;
                player.velocity.y = 0;
                player.isOnGround = true;
            } else {
                player.isOnGround = false;
            }
            
            // Keep players on arena (with some leeway)
            const distanceFromCenter = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
            if (distanceFromCenter > this.arenaSize + 2) {
                // Push back towards center
                const pushDirection = new THREE.Vector3(-player.position.x, 0, -player.position.z).normalize();
                player.velocity.add(pushDirection.multiplyScalar(this.pushForce * deltaTime));
            }
            
            // Update mesh position
            player.mesh.position.copy(player.position);
        });
    }
    
    checkPlayerCollisions() {
        const distance = this.player1.position.distanceTo(this.player2.position);
        const minDistance = this.player1.radius + this.player2.radius;
        
        if (distance < minDistance) {
            // Calculate collision response
            const collisionVector = new THREE.Vector3()
                .subVectors(this.player2.position, this.player1.position)
                .normalize();
            
            const separationForce = (minDistance - distance) * 0.5;
            
            // Separate players
            this.player1.position.add(collisionVector.clone().multiplyScalar(-separationForce));
            this.player2.position.add(collisionVector.clone().multiplyScalar(separationForce));
            
            // Apply push forces
            const pushStrength = this.pushForce;
            this.player1.velocity.add(collisionVector.clone().multiplyScalar(-pushStrength));
            this.player2.velocity.add(collisionVector.clone().multiplyScalar(pushStrength));
            
            // Create collision effect
            this.createCollisionEffect(this.player1.position.clone().lerp(this.player2.position, 0.5));
            
            // Screen shake
            this.cameraShake = Math.max(this.cameraShake, 0.5);
        }
    }
    
    checkFallOffs() {
        this.players.forEach(player => {
            if (player.isAlive && player.position.y < this.fallThreshold) {
                this.playerFellOff(player);
            }
        });
    }
    
    playerFellOff(player) {
        player.isAlive = false;
        player.mesh.visible = false;
        
        // Award point to other player
        if (player === this.player1) {
            this.player2Wins++;
            this.showMessage(`Player 2 Wins Round ${this.currentRound}!`, 2000);
        } else {
            this.player1Wins++;
            this.showMessage(`Player 1 Wins Round ${this.currentRound}!`, 2000);
        }
        
        this.endRound('falloff');
    }
    
    endRound(reason) {
        this.gameState = 'roundEnd';
        this.roundTimer = 0;
        
        // Check if game is over
        if (this.player1Wins >= Math.ceil(this.maxRounds / 2) || 
            this.player2Wins >= Math.ceil(this.maxRounds / 2)) {
            this.endGame();
        } else {
            // Start next round
            setTimeout(() => {
                this.startNextRound();
            }, 3000);
        }
    }
    
    startNextRound() {
        this.currentRound++;
        
        // Reset players
        this.player1.isAlive = true;
        this.player1.mesh.visible = true;
        this.player1.position.copy(this.player1.spawnPosition);
        this.player1.velocity.set(0, 0, 0);
        
        this.player2.isAlive = true;
        this.player2.mesh.visible = true;
        this.player2.position.copy(this.player2.spawnPosition);
        this.player2.velocity.set(0, 0, 0);
        
        // Start countdown
        this.gameState = 'countdown';
        this.countdown = 3;
        this.showMessage(`Round ${this.currentRound}!`, 1500);
    }
    
    endGame() {
        this.gameState = 'gameEnd';
        
        const winner = this.player1Wins > this.player2Wins ? 'Player 1' : 'Player 2';
        this.showMessage(`${winner} Wins!\nScore: ${this.player1Wins} - ${this.player2Wins}`, 5000);
        
        // Show game over options
        setTimeout(() => {
            this.showGameOverMenu();
        }, 3000);
    }
    
    showGameOverMenu() {
        // Create game over menu
        const gameOverDiv = document.createElement('div');
        gameOverDiv.id = 'local-multiplayer-game-over';
        gameOverDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            font-family: 'Courier New', monospace;
            z-index: 1000;
        `;
        
        const winner = this.player1Wins > this.player2Wins ? 'Player 1' : 'Player 2';
        
        gameOverDiv.innerHTML = `
            <h2 style="color: #ffff00; margin-bottom: 20px;">GAME OVER</h2>
            <h3 style="color: #00ffff; margin-bottom: 15px;">${winner} Wins!</h3>
            <p style="margin-bottom: 30px;">Final Score: ${this.player1Wins} - ${this.player2Wins}</p>
            
            <div style="display: flex; gap: 20px; justify-content: center;">
                <button id="play-again-btn" style="
                    padding: 10px 20px;
                    font-size: 16px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                ">Play Again</button>
                
                <button id="back-to-menu-btn" style="
                    padding: 10px 20px;
                    font-size: 16px;
                    background: #f44336;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                ">Back to Menu</button>
            </div>
        `;
        
        document.body.appendChild(gameOverDiv);
        
        // Add event listeners
        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.body.removeChild(gameOverDiv);
            this.restart();
        });
        
        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            document.body.removeChild(gameOverDiv);
            this.cleanup();
            if (this.onBackToMenu) {
                this.onBackToMenu();
            }
        });
    }
    
    restart() {
        // Reset game state
        this.currentRound = 1;
        this.player1Wins = 0;
        this.player2Wins = 0;
        this.gameState = 'countdown';
        this.countdown = 3;
        
        // Reset players
        this.player1.isAlive = true;
        this.player1.mesh.visible = true;
        this.player1.position.copy(this.player1.spawnPosition);
        this.player1.velocity.set(0, 0, 0);
        
        this.player2.isAlive = true;
        this.player2.mesh.visible = true;
        this.player2.position.copy(this.player2.spawnPosition);
        this.player2.velocity.set(0, 0, 0);
        
        this.showMessage('REMATCH!', 2000);
    }
    
    createCollisionEffect(position) {
        // Create sparkle effect at collision point
        const sparkGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const sparkMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 1
        });
        
        for (let i = 0; i < 10; i++) {
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.copy(position);
            spark.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ));
            
            this.scene.add(spark);
            this.particles.push({
                mesh: spark,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    Math.random() * 5,
                    (Math.random() - 0.5) * 10
                ),
                life: 1
            });
        }
    }
    
    updateVisualEffects(deltaTime) {
        // Update particles
        this.particles.forEach((particle, index) => {
            particle.life -= deltaTime * 2;
            particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            particle.mesh.material.opacity = particle.life;
            
            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                this.particles.splice(index, 1);
            }
        });
        
        // Update camera shake
        if (this.cameraShake > 0) {
            this.camera.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * this.cameraShake,
                (Math.random() - 0.5) * this.cameraShake,
                (Math.random() - 0.5) * this.cameraShake
            ));
            this.cameraShake *= 0.9;
        }
    }
    
    showMessage(text, duration = 2000) {
        // Remove existing message
        const existingMessage = document.getElementById('battle-message');
        if (existingMessage) {
            document.body.removeChild(existingMessage);
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.id = 'battle-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            z-index: 1000;
            border: 2px solid #ffff00;
        `;
        
        messageDiv.innerHTML = text.replace(/\n/g, '<br>');
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (document.getElementById('battle-message') && messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, duration);
    }
    
    showControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'battle-controls';
        controlsDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            text-align: center;
            z-index: 1000;
            border: 2px solid #00ffff;
        `;
        
        controlsDiv.innerHTML = `
            <div style="display: flex; gap: 40px; align-items: center;">
                <div style="color: #ff0000;">
                    <strong>Player 1 (Red)</strong><br>
                    <span style="font-size: 12px;">WASD to move</span>
                </div>
                <div style="color: #ffff00;">
                    <strong>GOAL: Push opponent off the platform!</strong><br>
                    <span style="font-size: 12px;">First to 2 wins!</span>
                </div>
                <div style="color: #0000ff;">
                    <strong>Player 2 (Blue)</strong><br>
                    <span style="font-size: 12px;">Arrow Keys to move</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(controlsDiv);
        
        // Remove after 10 seconds
        setTimeout(() => {
            if (document.getElementById('battle-controls')) {
                document.body.removeChild(controlsDiv);
            }
        }, 10000);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    clearArena() {
        // Remove arena objects
        if (this.arena) {
            this.scene.remove(this.arena);
            this.arena = null;
        }
        
        // Remove edge objects
        this.arenaEdges.forEach(obj => {
            this.scene.remove(obj);
        });
        this.arenaEdges = [];
        
        // Remove players
        if (this.player1) {
            this.scene.remove(this.player1.mesh);
            this.player1 = null;
        }
        if (this.player2) {
            this.scene.remove(this.player2.mesh);
            this.player2 = null;
        }
        
        // Clear particles
        this.particles.forEach(particle => {
            this.scene.remove(particle.mesh);
        });
        this.particles = [];
    }
    
    cleanup() {
        this.isActive = false;
        this.clearArena();
        
        // Remove messages
        const existingMessage = document.getElementById('battle-message');
        if (existingMessage) {
            document.body.removeChild(existingMessage);
        }
        
        // Remove game over menu if it exists
        const gameOverMenu = document.getElementById('local-multiplayer-game-over');
        if (gameOverMenu) {
            document.body.removeChild(gameOverMenu);
        }
        
        // Remove controls display if it exists
        const controlsDisplay = document.getElementById('battle-controls');
        if (controlsDisplay) {
            document.body.removeChild(controlsDisplay);
        }
        
        console.log('🥊 Local Multiplayer Battle cleaned up');
    }
} 