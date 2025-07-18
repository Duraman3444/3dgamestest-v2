import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.roomId = null;
        this.playerName = null;
        this.otherPlayers = new Map();
        this.gameState = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onPlayerMoved = null;
        this.onGameStarted = null;
        this.onPlayerAction = null;
        this.onPlayerDamage = null;
        this.onGameStateUpdate = null;
        this.scene = null;
        this.playerMeshes = new Map();
        this.isMultiplayer = false;
        
        // Player colors for different players
        this.playerColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
        
        // Ball rotation tracking for multiplayer
        this.ballRadius = 1;
        this.playerRotations = new Map(); // Track rotation for each player
    }
    
    // Initialize connection to server
    connect(serverUrl = window.location.origin) {
        try {
            this.socket = io(serverUrl);
            this.setupEventHandlers();
            console.log('🔌 Connecting to multiplayer server...');
        } catch (error) {
            console.error('Failed to connect to multiplayer server:', error);
        }
    }
    
    // Set up Socket.io event handlers
    setupEventHandlers() {
        this.socket.on('connect', () => {
            console.log('✅ Connected to multiplayer server');
            this.isConnected = true;
            this.playerId = this.socket.id;
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from multiplayer server');
            this.isConnected = false;
            this.cleanup();
        });
        
        this.socket.on('roomJoined', (data) => {
            if (data.success) {
                this.roomId = data.roomId;
                this.playerId = data.playerId;
                this.isMultiplayer = true;
                
                console.log(`🎮 Joined room: ${this.roomId}`);
                
                // Add other players to the game
                data.players.forEach(player => {
                    if (player.id !== this.playerId) {
                        this.addOtherPlayer(player);
                    }
                });
                
                if (this.onPlayerJoined) {
                    this.onPlayerJoined(data);
                }
            } else {
                console.error('Failed to join room:', data.message);
            }
        });
        
        this.socket.on('playerJoined', (data) => {
            console.log('👤 Player joined:', data.player.name);
            this.addOtherPlayer(data.player);
            
            if (this.onPlayerJoined) {
                this.onPlayerJoined(data);
            }
        });
        
        this.socket.on('playerLeft', (data) => {
            console.log('👋 Player left:', data.playerId);
            this.removeOtherPlayer(data.playerId);
            
            if (this.onPlayerLeft) {
                this.onPlayerLeft(data);
            }
        });
        
        this.socket.on('playerMoved', (data) => {
            this.updateOtherPlayerPosition(data.playerId, data.position, data.rotation, data.velocity);
            
            if (this.onPlayerMoved) {
                this.onPlayerMoved(data);
            }
        });
        
        this.socket.on('gameStarted', (data) => {
            console.log('🚀 Game started with multiplayer!', data);
            this.gameState = data.gameState;
            
            if (this.onGameStarted) {
                console.log('🎮 Calling onGameStarted callback');
                this.onGameStarted(data);
            } else {
                console.error('⚠️ No onGameStarted callback set!');
            }
        });
        
        this.socket.on('playerAction', (data) => {
            if (this.onPlayerAction) {
                this.onPlayerAction(data);
            }
        });
        
        this.socket.on('playerDied', (data) => {
            console.log(`💀 Player ${data.playerId} died. Lives: ${data.lives}`);
            
            if (this.onPlayerDamage) {
                this.onPlayerDamage(data);
            }
        });
        
        this.socket.on('playerHealthChanged', (data) => {
            if (this.onPlayerDamage) {
                this.onPlayerDamage(data);
            }
        });
        
        this.socket.on('gameStateUpdated', (data) => {
            this.gameState = data;
            
            if (this.onGameStateUpdate) {
                this.onGameStateUpdate(data);
            }
        });
    }
    
    // Join a game room
    joinRoom(roomId, playerName, joinAsSpectator = false) {
        if (!this.isConnected) {
            console.error('Not connected to server');
            return false;
        }
        
        this.roomId = roomId;
        this.playerName = playerName;
        this.isSpectator = joinAsSpectator;
        
        this.socket.emit('joinRoom', {
            roomId: roomId,
            playerName: playerName,
            joinAsSpectator: joinAsSpectator
        });
        
        return true;
    }
    
    // Set player ready state
    setPlayerReady(isReady) {
        if (this.isConnected) {
            this.socket.emit('playerReady', { isReady });
        }
    }
    
    // Send player position to server
    sendPlayerPosition(position, velocity = null) {
        if (this.socket && this.isConnected) {
            // Calculate rotation based on velocity if available
            let rotationData = null;
            if (velocity && velocity.length() > 0.1) {
                const playerId = this.playerId;
                if (!this.playerRotations.has(playerId)) {
                    this.playerRotations.set(playerId, { x: 0, y: 0, z: 0 });
                }
                
                const rotation = this.playerRotations.get(playerId);
                const rollSpeed = velocity.length() / this.ballRadius;
                const deltaTime = 1/60; // Approximate deltaTime
                
                rotation.x += velocity.z * rollSpeed * deltaTime;
                rotation.z -= velocity.x * rollSpeed * deltaTime;
                
                rotationData = { x: rotation.x, y: rotation.y, z: rotation.z };
            }
            
            this.socket.emit('playerMove', { 
                position: position,
                rotation: rotationData,
                velocity: velocity
            });
        }
    }
    
    // Send player action
    sendPlayerAction(action, data) {
        if (this.isConnected && this.isMultiplayer) {
            this.socket.emit('playerAction', { action, data });
        }
    }
    
    // Send player damage
    sendPlayerDamage(damage) {
        if (this.isConnected && this.isMultiplayer) {
            this.socket.emit('playerDamage', { damage });
        }
    }
    
    // Send game state change
    sendGameStateChange(stateChange) {
        if (this.isConnected && this.isMultiplayer) {
            this.socket.emit('gameStateChange', stateChange);
        }
    }

    // Send race completion
    sendRaceComplete(completionTime) {
        if (this.isConnected && this.isMultiplayer) {
            this.socket.emit('raceComplete', { completionTime });
        }
    }

    // Send battle round completion
    sendBattleRoundComplete() {
        if (this.isConnected && this.isMultiplayer) {
            this.socket.emit('battleRoundComplete', {});
        }
    }

    // Send spectator follow request
    sendSpectatorFollow(playerId) {
        if (this.isConnected && this.isMultiplayer) {
            this.socket.emit('spectatorFollow', { playerId });
        }
    }

    // Change game mode (host only)
    changeGameMode(mode) {
        if (this.isConnected && this.isMultiplayer) {
            this.socket.emit('changeGameMode', { mode });
        }
    }
    
    // Add other player to the game
    addOtherPlayer(player) {
        this.otherPlayers.set(player.id, player);
        
        // Create visual representation of other player
        if (this.scene) {
            this.createPlayerMesh(player);
        }
    }
    
    // Remove other player from the game
    removeOtherPlayer(playerId) {
        this.otherPlayers.delete(playerId);
        
        // Remove visual representation
        if (this.playerMeshes.has(playerId)) {
            const mesh = this.playerMeshes.get(playerId);
            this.scene.remove(mesh);
            this.playerMeshes.delete(playerId);
        }
    }
    
    // Update other player's position
    updateOtherPlayerPosition(playerId, position, rotation = null, velocity = null) {
        const player = this.otherPlayers.get(playerId);
        if (player) {
            player.position = position;
            if (rotation) player.rotation = rotation;
            if (velocity) player.velocity = velocity;
            
            // Update visual representation
            if (this.playerMeshes.has(playerId)) {
                const mesh = this.playerMeshes.get(playerId);
                mesh.position.set(position.x, position.y, position.z);
                
                // Update rotation if available
                if (rotation) {
                    mesh.rotation.set(rotation.x, rotation.y, rotation.z);
                }
            }
        }
    }
    
    // Create visual representation of player
    createPlayerMesh(player) {
        if (!this.scene) return;
        
        // Create a sphere for other players (matching the main player)
        const geometry = new THREE.SphereGeometry(this.ballRadius, 16, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: player.color || this.playerColors[0],
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(player.position.x, player.position.y, player.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Initialize rotation tracking
        this.playerRotations.set(player.id, { x: 0, y: 0, z: 0 });
        
        // Add name tag
        const nameTag = this.createNameTag(player.name);
        nameTag.position.set(0, 1.5, 0);
        mesh.add(nameTag);
        
        this.scene.add(mesh);
        this.playerMeshes.set(player.id, mesh);
    }
    
    // Create name tag for player
    createNameTag(name) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Draw name background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw name text
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(name, canvas.width / 2, canvas.height / 2 + 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.5
        });
        
        const geometry = new THREE.PlaneGeometry(2, 0.5);
        const nameTag = new THREE.Mesh(geometry, material);
        nameTag.lookAt(0, 0, 1); // Face camera
        
        return nameTag;
    }
    
    // Set scene reference for creating player meshes
    setScene(scene) {
        this.scene = scene;
    }
    
    // Get all other players
    getOtherPlayers() {
        return Array.from(this.otherPlayers.values());
    }
    
    // Check if currently in multiplayer mode
    isMultiplayerMode() {
        return this.isMultiplayer && this.isConnected;
    }
    
    // Get current room info
    getRoomInfo() {
        return {
            roomId: this.roomId,
            playerId: this.playerId,
            playerName: this.playerName,
            otherPlayers: this.getOtherPlayers()
        };
    }
    
    // Cleanup when disconnecting
    cleanup() {
        this.otherPlayers.clear();
        
        // Remove all player meshes
        for (const [playerId, mesh] of this.playerMeshes) {
            if (this.scene) {
                this.scene.remove(mesh);
            }
        }
        this.playerMeshes.clear();
        
        this.isMultiplayer = false;
        this.roomId = null;
        this.playerId = null;
        this.gameState = null;
    }
    
    // Disconnect from server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.cleanup();
        }
    }
} 