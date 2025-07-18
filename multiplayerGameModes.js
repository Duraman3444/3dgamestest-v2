export class MultiplayerGameModes {
    constructor(scene, multiplayerManager) {
        this.scene = scene;
        this.multiplayerManager = multiplayerManager;
        this.currentMode = 'race';
        this.raceStartTime = null;
        this.battleArena = null;
        this.battleRoundActive = false;
        this.arenaSize = 20;
        this.fallThreshold = -5;
        this.edgeGlowMeshes = [];
    }

    setMode(mode) {
        this.currentMode = mode;
        this.setupModeSpecificLevel();
    }

    setupModeSpecificLevel() {
        this.clearPreviousMode();
        
        switch (this.currentMode) {
            case 'race':
                this.setupRaceMode();
                break;
            case 'battle':
                this.setupBattleMode();
                break;
        }
    }

    clearPreviousMode() {
        // Clear any mode-specific objects
        this.edgeGlowMeshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.edgeGlowMeshes = [];
        
        if (this.battleArena) {
            this.scene.remove(this.battleArena);
            this.battleArena = null;
        }
    }

    setupRaceMode() {
        console.log('🏁 Setting up Race Mode');
        
        // Race mode uses the existing level layout
        // Players spawn at the same start position
        // Goal is to reach the exit first
        
        this.raceStartTime = Date.now();
        
        // Add race-specific UI elements or effects here
        this.showRaceStartMessage();
    }

    setupBattleMode() {
        console.log('⚔️ Setting up Battle Mode');
        
        // Create flat battle arena
        this.createBattleArena();
        
        // Add glowing edges to indicate danger zones
        this.createArenaEdgeGlow();
        
        this.battleRoundActive = true;
        this.showBattleStartMessage();
    }

    createBattleArena() {
        // Create a flat platform for battle
        const arenaGeometry = new THREE.BoxGeometry(this.arenaSize, 0.5, this.arenaSize);
        const arenaMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.9
        });
        
        this.battleArena = new THREE.Mesh(arenaGeometry, arenaMaterial);
        this.battleArena.position.set(0, 0, 0);
        this.scene.add(this.battleArena);
        
        // Add arena border lines
        this.createArenaBorders();
    }

    createArenaBorders() {
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const points = [];
        
        const halfSize = this.arenaSize / 2;
        
        // Create border lines
        points.push(new THREE.Vector3(-halfSize, 0.3, -halfSize));
        points.push(new THREE.Vector3(halfSize, 0.3, -halfSize));
        points.push(new THREE.Vector3(halfSize, 0.3, halfSize));
        points.push(new THREE.Vector3(-halfSize, 0.3, halfSize));
        points.push(new THREE.Vector3(-halfSize, 0.3, -halfSize));
        
        const borderGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const borderLine = new THREE.Line(borderGeometry, borderMaterial);
        this.scene.add(borderLine);
    }

    createArenaEdgeGlow() {
        const halfSize = this.arenaSize / 2;
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.3
        });
        
        // Create glowing edge indicators
        const edgeWidth = 2;
        const edgeHeight = 1;
        
        // North edge
        const northEdge = new THREE.Mesh(
            new THREE.BoxGeometry(this.arenaSize, edgeHeight, edgeWidth),
            glowMaterial
        );
        northEdge.position.set(0, edgeHeight / 2, halfSize + edgeWidth / 2);
        this.scene.add(northEdge);
        this.edgeGlowMeshes.push(northEdge);
        
        // South edge
        const southEdge = new THREE.Mesh(
            new THREE.BoxGeometry(this.arenaSize, edgeHeight, edgeWidth),
            glowMaterial
        );
        southEdge.position.set(0, edgeHeight / 2, -halfSize - edgeWidth / 2);
        this.scene.add(southEdge);
        this.edgeGlowMeshes.push(southEdge);
        
        // East edge
        const eastEdge = new THREE.Mesh(
            new THREE.BoxGeometry(edgeWidth, edgeHeight, this.arenaSize),
            glowMaterial
        );
        eastEdge.position.set(halfSize + edgeWidth / 2, edgeHeight / 2, 0);
        this.scene.add(eastEdge);
        this.edgeGlowMeshes.push(eastEdge);
        
        // West edge
        const westEdge = new THREE.Mesh(
            new THREE.BoxGeometry(edgeWidth, edgeHeight, this.arenaSize),
            glowMaterial
        );
        westEdge.position.set(-halfSize - edgeWidth / 2, edgeHeight / 2, 0);
        this.scene.add(westEdge);
        this.edgeGlowMeshes.push(westEdge);
    }

    update(deltaTime, playerPosition) {
        if (this.currentMode === 'race') {
            this.updateRaceMode(deltaTime, playerPosition);
        } else if (this.currentMode === 'battle') {
            this.updateBattleMode(deltaTime, playerPosition);
        }
        
        // Update edge glow pulsing effect
        this.updateEdgeGlow(deltaTime);
    }

    updateRaceMode(deltaTime, playerPosition) {
        // Check if player reached the goal
        // This would integrate with the existing level completion detection
        
        // For now, we'll rely on the existing collision system to detect goal completion
        // and call this.onRaceComplete() when the goal is reached
    }

    updateBattleMode(deltaTime, playerPosition) {
        if (!this.battleRoundActive || !playerPosition) return;
        
        // Check if player fell off the arena
        if (playerPosition.y < this.fallThreshold) {
            this.onPlayerFellOff();
            return;
        }
        
        // Check if player is near the edge and make edges glow brighter
        const distanceFromCenter = Math.sqrt(playerPosition.x * playerPosition.x + playerPosition.z * playerPosition.z);
        const halfSize = this.arenaSize / 2;
        
        if (distanceFromCenter > halfSize * 0.8) {
            // Player is near edge, make glow more intense
            this.intensifyEdgeGlow();
        } else {
            this.normalizeEdgeGlow();
        }
    }

    updateEdgeGlow(deltaTime) {
        const time = Date.now() * 0.001;
        const pulseFactor = 0.3 + 0.2 * Math.sin(time * 2);
        
        this.edgeGlowMeshes.forEach(mesh => {
            if (mesh.material) {
                mesh.material.opacity = pulseFactor;
            }
        });
    }

    intensifyEdgeGlow() {
        this.edgeGlowMeshes.forEach(mesh => {
            if (mesh.material) {
                mesh.material.opacity = 0.8;
                mesh.material.color.setHex(0xff6600); // Orange for warning
            }
        });
    }

    normalizeEdgeGlow() {
        this.edgeGlowMeshes.forEach(mesh => {
            if (mesh.material) {
                mesh.material.color.setHex(0xff0000); // Red for normal
            }
        });
    }

    onRaceComplete() {
        if (this.currentMode === 'race' && this.raceStartTime) {
            const completionTime = Date.now() - this.raceStartTime;
            console.log(`Race completed in ${completionTime}ms`);
            
            // Send race completion to server
            this.multiplayerManager.sendRaceComplete(completionTime);
        }
    }

    onPlayerFellOff() {
        if (this.currentMode === 'battle' && this.battleRoundActive) {
            console.log('Player fell off the arena!');
            this.battleRoundActive = false;
            
            // Send battle round loss to server (other players win)
            // This would need to be handled by determining who pushed the player off
            // For now, we'll let the server handle winner determination
        }
    }

    onBattleRoundWon() {
        if (this.currentMode === 'battle' && this.battleRoundActive) {
            console.log('Battle round won!');
            this.battleRoundActive = false;
            
            // Send battle round completion to server
            this.multiplayerManager.sendBattleRoundComplete();
        }
    }

    showRaceStartMessage() {
        this.showGameMessage('🏁 Race Started!', 'First to reach the goal wins!', 3000);
    }

    showBattleStartMessage() {
        this.showGameMessage('⚔️ Battle Round Started!', 'Knock your opponents off the platform!', 3000);
    }

    showGameMessage(title, subtitle, duration = 3000) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            text-align: center;
            z-index: 300;
            animation: fadeInOut ${duration}ms ease-in-out;
        `;
        
        messageDiv.innerHTML = `
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">${title}</h2>
            <p style="margin: 0; font-size: 16px;">${subtitle}</p>
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        }, duration);
    }

    getSpawnPositions() {
        if (this.currentMode === 'race') {
            // All players spawn at the same position for race mode
            return [
                { x: 0, y: 2, z: 0 },
                { x: 1, y: 2, z: 0 },
                { x: -1, y: 2, z: 0 },
                { x: 0, y: 2, z: 1 }
            ];
        } else if (this.currentMode === 'battle') {
            // Players spawn at corners of the arena
            const spawnOffset = this.arenaSize / 3;
            return [
                { x: -spawnOffset, y: 2, z: -spawnOffset },
                { x: spawnOffset, y: 2, z: -spawnOffset },
                { x: spawnOffset, y: 2, z: spawnOffset },
                { x: -spawnOffset, y: 2, z: spawnOffset }
            ];
        }
        
        return [{ x: 0, y: 2, z: 0 }];
    }

    isOutOfBounds(position) {
        if (this.currentMode === 'battle') {
            const halfSize = this.arenaSize / 2;
            return Math.abs(position.x) > halfSize || 
                   Math.abs(position.z) > halfSize || 
                   position.y < this.fallThreshold;
        }
        return false;
    }

    cleanup() {
        this.clearPreviousMode();
        this.battleRoundActive = false;
        this.raceStartTime = null;
    }
} 