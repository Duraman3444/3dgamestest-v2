import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(__dirname));

// Store game rooms and players
const gameRooms = new Map();
const playerData = new Map();

// Game room management
class GameRoom {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = new Map();
        this.spectators = new Map();
        this.gameState = {
            isActive: false,
            level: 'level1',
            mode: 'race', // 'race', 'battle', or 'spectate'
            enemies: [],
            collectibles: [],
            winner: null,
            round: 1,
            maxRounds: 3,
            roundWinners: [],
            raceTimer: 0,
            battleArena: {
                size: 20,
                center: { x: 0, y: 0, z: 0 }
            }
        };
        this.maxPlayers = 4;
        this.maxSpectators = 8;
        this.host = null;
    }

    addPlayer(socket, playerInfo) {
        if (this.players.size >= this.maxPlayers) {
            return false;
        }

        const player = {
            id: socket.id,
            name: playerInfo.name || `Player${this.players.size + 1}`,
            position: { x: 0, y: 0, z: 0 },
            health: 100,
            lives: 3,
            score: 0,
            isReady: false,
            color: this.getPlayerColor(this.players.size),
            isHost: this.players.size === 0, // First player is host
            roundWins: 0
        };

        this.players.set(socket.id, player);
        
        // Set host if this is the first player
        if (this.players.size === 1) {
            this.host = socket.id;
        }

        return true;
    }

    addSpectator(socket, playerInfo) {
        if (this.spectators.size >= this.maxSpectators) {
            return false;
        }

        this.spectators.set(socket.id, {
            id: socket.id,
            name: playerInfo.name || `Spectator${this.spectators.size + 1}`,
            followingPlayer: null
        });

        return true;
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
        this.spectators.delete(socketId);
        
        // Reassign host if host left
        if (this.host === socketId && this.players.size > 0) {
            this.host = this.players.keys().next().value;
            const newHost = this.players.get(this.host);
            if (newHost) {
                newHost.isHost = true;
            }
        }
        
        if (this.players.size === 0) {
            this.gameState.isActive = false;
            this.host = null;
        }
    }

    setGameMode(mode) {
        if (['race', 'battle'].includes(mode)) {
            this.gameState.mode = mode;
            this.resetGameState();
            return true;
        }
        return false;
    }

    resetGameState() {
        this.gameState.isActive = false;
        this.gameState.winner = null;
        this.gameState.round = 1;
        this.gameState.roundWinners = [];
        this.gameState.raceTimer = 0;
        
        // Reset player states
        for (const player of this.players.values()) {
            player.score = 0;
            player.roundWins = 0;
            player.isReady = false;
            player.health = 100;
            player.lives = 3;
        }
    }

    getPlayerColor(index) {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
        return colors[index % colors.length];
    }

    updatePlayerPosition(socketId, position, rotation = null, velocity = null) {
        const player = this.players.get(socketId);
        if (player) {
            player.position = position;
            if (rotation) player.rotation = rotation;
            if (velocity) player.velocity = velocity;
            return true;
        }
        return false;
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    getAllSpectators() {
        return Array.from(this.spectators.values());
    }

    canStartGame() {
        return this.players.size >= 1 && Array.from(this.players.values()).every(p => p.isReady);
    }
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Join or create game room
    socket.on('joinRoom', (data) => {
        const { roomId, playerName, joinAsSpectator } = data;
        let room = gameRooms.get(roomId);
        
        if (!room) {
            room = new GameRoom(roomId);
            gameRooms.set(roomId, room);
            console.log(`Created new room: ${roomId}`);
        }
        
        let success = false;
        let isSpectator = false;
        
        if (joinAsSpectator || room.players.size >= room.maxPlayers) {
            // Join as spectator
            success = room.addSpectator(socket, { name: playerName });
            isSpectator = true;
        } else {
            // Join as player
            success = room.addPlayer(socket, { name: playerName });
        }
        
        if (success) {
            socket.join(roomId);
            playerData.set(socket.id, { roomId, playerName, isSpectator });
            
            // Send current room state to new player/spectator
            socket.emit('roomJoined', {
                success: true,
                roomId: roomId,
                playerId: socket.id,
                isSpectator: isSpectator,
                players: room.getAllPlayers(),
                spectators: Array.from(room.spectators.values()),
                gameState: room.gameState,
                isHost: room.host === socket.id
            });
            
            // Notify other players in the room
            socket.to(roomId).emit(isSpectator ? 'spectatorJoined' : 'playerJoined', {
                player: isSpectator ? room.spectators.get(socket.id) : room.players.get(socket.id),
                totalPlayers: room.players.size,
                totalSpectators: room.spectators.size
            });
            
            console.log(`${isSpectator ? 'Spectator' : 'Player'} ${socket.id} joined room ${roomId}`);
        } else {
            socket.emit('roomJoined', {
                success: false,
                message: 'Room is full'
            });
        }
    });
    
    // Handle player ready state
    socket.on('playerReady', (data) => {
        const playerInfo = playerData.get(socket.id);
        if (playerInfo) {
            const room = gameRooms.get(playerInfo.roomId);
            if (room) {
                const player = room.players.get(socket.id);
                if (player) {
                    player.isReady = data.isReady;
                    
                    // Notify all players in room
                    io.to(playerInfo.roomId).emit('playerStateChanged', {
                        playerId: socket.id,
                        isReady: data.isReady,
                        canStart: room.canStartGame()
                    });
                    
                    // Auto-start game if all players are ready
                    if (room.canStartGame() && !room.gameState.isActive) {
                        room.gameState.isActive = true;
                        io.to(playerInfo.roomId).emit('gameStarted', {
                            gameState: room.gameState,
                            players: room.getAllPlayers()
                        });
                    }
                }
            }
        }
    });
    
    // Handle player position updates
    socket.on('playerMove', (data) => {
        const playerInfo = playerData.get(socket.id);
        if (playerInfo) {
            const room = gameRooms.get(playerInfo.roomId);
            if (room && room.updatePlayerPosition(socket.id, data.position, data.rotation, data.velocity)) {
                // Broadcast position and rotation to other players
                socket.to(playerInfo.roomId).emit('playerMoved', {
                    playerId: socket.id,
                    position: data.position,
                    rotation: data.rotation,
                    velocity: data.velocity
                });
            }
        }
    });
    
    // Handle player actions (shooting, collecting, etc.)
    socket.on('playerAction', (data) => {
        const playerInfo = playerData.get(socket.id);
        if (playerInfo) {
            const room = gameRooms.get(playerInfo.roomId);
            if (room) {
                // Broadcast action to other players
                socket.to(playerInfo.roomId).emit('playerAction', {
                    playerId: socket.id,
                    action: data.action,
                    data: data.data
                });
            }
        }
    });
    
    // Handle player damage/death
    socket.on('playerDamage', (data) => {
        const playerInfo = playerData.get(socket.id);
        if (playerInfo) {
            const room = gameRooms.get(playerInfo.roomId);
            if (room) {
                const player = room.players.get(socket.id);
                if (player) {
                    player.health = Math.max(0, player.health - data.damage);
                    
                    if (player.health <= 0) {
                        player.lives--;
                        player.health = 100; // Reset health for respawn
                        
                        // Notify all players
                        io.to(playerInfo.roomId).emit('playerDied', {
                            playerId: socket.id,
                            lives: player.lives
                        });
                        
                        // Check if player is out of lives
                        if (player.lives <= 0) {
                            io.to(playerInfo.roomId).emit('playerEliminated', {
                                playerId: socket.id
                            });
                        }
                    }
                    
                    // Broadcast health update
                    io.to(playerInfo.roomId).emit('playerHealthChanged', {
                        playerId: socket.id,
                        health: player.health,
                        lives: player.lives
                    });
                }
            }
        }
    });
    
    // Handle game state changes
    socket.on('gameStateChange', (data) => {
        const playerInfo = playerData.get(socket.id);
        if (playerInfo) {
            const room = gameRooms.get(playerInfo.roomId);
            if (room) {
                // Update game state
                Object.assign(room.gameState, data);
                
                // Broadcast to all players in room
                io.to(playerInfo.roomId).emit('gameStateUpdated', room.gameState);
            }
        }
    });

    // Handle game mode changes (host only)
    socket.on('changeGameMode', (data) => {
        const playerInfo = playerData.get(socket.id);
        if (playerInfo) {
            const room = gameRooms.get(playerInfo.roomId);
            if (room && room.host === socket.id) {
                if (room.setGameMode(data.mode)) {
                    // Broadcast mode change to all players
                    io.to(playerInfo.roomId).emit('gameModeChanged', {
                        mode: data.mode,
                        gameState: room.gameState
                    });
                    console.log(`Host ${socket.id} changed game mode to ${data.mode}`);
                }
            }
        }
    });

    // Handle race completion
    socket.on('raceComplete', (data) => {
        const playerInfo = playerData.get(socket.id);
        if (playerInfo && !playerInfo.isSpectator) {
            const room = gameRooms.get(playerInfo.roomId);
            if (room && room.gameState.mode === 'race' && !room.gameState.winner) {
                // First player to complete wins
                room.gameState.winner = socket.id;
                const winner = room.players.get(socket.id);
                if (winner) {
                    winner.score += 100;
                }
                
                // Broadcast race completion
                io.to(playerInfo.roomId).emit('raceWinner', {
                    winner: winner,
                    completionTime: data.completionTime
                });
                
                console.log(`Race completed by ${winner.name} in ${data.completionTime}ms`);
            }
        }
    });

    // Handle battle round completion
    socket.on('battleRoundComplete', (data) => {
        const playerInfo = playerData.get(socket.id);
        if (playerInfo && !playerInfo.isSpectator) {
            const room = gameRooms.get(playerInfo.roomId);
            if (room && room.gameState.mode === 'battle') {
                const winner = room.players.get(socket.id);
                if (winner) {
                    winner.roundWins++;
                    room.gameState.roundWinners.push(socket.id);
                    
                    // Check if player won the match
                    if (winner.roundWins >= Math.ceil(room.gameState.maxRounds / 2)) {
                        room.gameState.winner = socket.id;
                        winner.score += 200;
                        
                        // Broadcast match winner
                        io.to(playerInfo.roomId).emit('battleMatchWinner', {
                            winner: winner,
                            finalScores: Array.from(room.players.values()).map(p => ({
                                name: p.name,
                                roundWins: p.roundWins,
                                score: p.score
                            }))
                        });
                    } else {
                        // Just won a round
                        room.gameState.round++;
                        
                        // Broadcast round winner
                        io.to(playerInfo.roomId).emit('battleRoundWinner', {
                            winner: winner,
                            round: room.gameState.round - 1,
                            roundWins: winner.roundWins,
                            maxRounds: room.gameState.maxRounds
                        });
                        
                        // Reset for next round after delay
                        setTimeout(() => {
                            if (room.gameState.round <= room.gameState.maxRounds) {
                                io.to(playerInfo.roomId).emit('battleRoundStart', {
                                    round: room.gameState.round,
                                    maxRounds: room.gameState.maxRounds
                                });
                            }
                        }, 3000);
                    }
                }
            }
        }
    });

    // Handle spectator following player
    socket.on('spectatorFollow', (data) => {
        const playerInfo = playerData.get(socket.id);
        if (playerInfo && playerInfo.isSpectator) {
            const room = gameRooms.get(playerInfo.roomId);
            if (room) {
                const spectator = room.spectators.get(socket.id);
                if (spectator) {
                    spectator.followingPlayer = data.playerId;
                    
                    // Broadcast spectator following status
                    socket.to(playerInfo.roomId).emit('spectatorFollowing', {
                        spectatorId: socket.id,
                        followingPlayer: data.playerId
                    });
                }
            }
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        const playerInfo = playerData.get(socket.id);
        if (playerInfo) {
            const room = gameRooms.get(playerInfo.roomId);
            if (room) {
                room.removePlayer(socket.id);
                
                // Notify other players
                socket.to(playerInfo.roomId).emit('playerLeft', {
                    playerId: socket.id,
                    totalPlayers: room.players.size
                });
                
                // Remove empty rooms
                if (room.players.size === 0) {
                    gameRooms.delete(playerInfo.roomId);
                    console.log(`Removed empty room: ${playerInfo.roomId}`);
                }
            }
            
            playerData.delete(socket.id);
        }
    });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`🚀 Multiplayer Game Server running on port ${PORT}`);
    console.log(`🌐 Access your game at: http://localhost:${PORT}`);
}); 