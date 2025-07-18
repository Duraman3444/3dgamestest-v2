import { MultiplayerManager } from './multiplayerManager.js';

export class MultiplayerMenu {
    constructor() {
        this.multiplayerManager = new MultiplayerManager();
        this.onStartMultiplayerGame = null;
        this.onBackToMain = null;
        this.currentRoomId = null;
        this.playerName = '';
        this.isInRoom = false;
        this.isReady = false;
        this.isSpectator = false;
        this.isHost = false;
        this.currentGameMode = 'race';
        this.connectedPlayers = [];
        this.connectedSpectators = [];
    }

    show() {
        this.createMenuHTML();
        this.setupEventListeners();
        this.multiplayerManager.connect();
        this.setupMultiplayerHandlers();
    }

    hide() {
        const menuContainer = document.getElementById('multiplayer-menu');
        if (menuContainer) {
            menuContainer.remove();
        }
        this.multiplayerManager.disconnect();
    }

    createMenuHTML() {
        const menuContainer = document.createElement('div');
        menuContainer.id = 'multiplayer-menu';
        menuContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: Arial, sans-serif;
            color: white;
        `;

        menuContainer.innerHTML = `
            <div id="room-setup" style="text-align: center; max-width: 500px; padding: 20px;">
                <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                    🎮 Multiplayer Game
                </h1>
                
                <div id="connection-status" style="margin-bottom: 20px; padding: 10px; border-radius: 5px; background: rgba(0,0,0,0.3);">
                    <span id="status-text">🔌 Connecting to server...</span>
                </div>
                
                <div id="join-room-section" style="margin-bottom: 30px; display: none;">
                    <h2 style="margin-bottom: 15px;">Join a Room</h2>
                    
                    <div style="margin-bottom: 15px;">
                        <label for="player-name" style="display: block; margin-bottom: 5px;">Your Name:</label>
                        <input type="text" id="player-name" placeholder="Enter your name" 
                               style="width: 200px; padding: 8px; font-size: 16px; border: none; border-radius: 4px;">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label for="room-id" style="display: block; margin-bottom: 5px;">Room ID:</label>
                        <input type="text" id="room-id" placeholder="Enter room ID or leave blank for random" 
                               style="width: 200px; padding: 8px; font-size: 16px; border: none; border-radius: 4px;">
                    </div>
                    
                    <button id="join-room-btn" style="
                        padding: 12px 30px;
                        font-size: 18px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">Join as Player</button>
                    
                    <button id="join-spectator-btn" style="
                        padding: 12px 30px;
                        font-size: 18px;
                        background: #FF9800;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">👁️ Join as Spectator</button>
                    
                    <button id="back-to-main-btn" style="
                        padding: 12px 30px;
                        font-size: 18px;
                        background: #f44336;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Back to Main Menu</button>
                </div>
                
                <div id="room-lobby" style="display: none;">
                    <h2 id="room-title">Room: <span id="room-id-display"></span></h2>
                    
                    <div id="mode-selection" style="
                        background: rgba(0,0,0,0.3);
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                        display: none;
                    ">
                        <h3>Game Mode (Host Only):</h3>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button id="race-mode-btn" style="
                                padding: 8px 16px;
                                background: #4CAF50;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                            ">🏁 Race Mode</button>
                            <button id="battle-mode-btn" style="
                                padding: 8px 16px;
                                background: #f44336;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                            ">⚔️ Battle Mode</button>
                        </div>
                        <div id="mode-description" style="margin-top: 10px; font-size: 12px; color: #ccc;">
                            <span id="mode-desc-text">Race Mode: First to reach the goal wins!</span>
                        </div>
                    </div>
                    
                    <div id="players-list" style="
                        background: rgba(0,0,0,0.3);
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                        min-height: 100px;
                    ">
                        <h3>Players in Room:</h3>
                        <ul id="players-ul" style="list-style: none; padding: 0;">
                        </ul>
                    </div>
                    
                    <div id="spectators-list" style="
                        background: rgba(0,0,0,0.3);
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                        min-height: 60px;
                        display: none;
                    ">
                        <h3>Spectators:</h3>
                        <ul id="spectators-ul" style="list-style: none; padding: 0;">
                        </ul>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <button id="ready-btn" style="
                            padding: 12px 30px;
                            font-size: 18px;
                            background: #FF9800;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            margin-right: 10px;
                        ">Ready</button>
                        
                        <button id="leave-room-btn" style="
                            padding: 12px 30px;
                            font-size: 18px;
                            background: #f44336;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">Leave Room</button>
                    </div>
                    
                    <div id="game-start-info" style="
                        background: rgba(0,0,0,0.3);
                        padding: 10px;
                        border-radius: 5px;
                        margin-top: 10px;
                    ">
                        <p id="start-message">Waiting for all players to be ready...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(menuContainer);
    }

    setupEventListeners() {
        // Join room button
        document.getElementById('join-room-btn').addEventListener('click', () => {
            this.joinRoom(false);
        });

        // Join as spectator button
        document.getElementById('join-spectator-btn').addEventListener('click', () => {
            this.joinRoom(true);
        });

        // Back to main menu button
        document.getElementById('back-to-main-btn').addEventListener('click', () => {
            if (this.onBackToMain) {
                this.onBackToMain();
            }
        });

        // Ready button
        document.getElementById('ready-btn').addEventListener('click', () => {
            this.toggleReady();
        });

        // Leave room button
        document.getElementById('leave-room-btn').addEventListener('click', () => {
            this.leaveRoom();
        });

        // Game mode buttons
        document.getElementById('race-mode-btn').addEventListener('click', () => {
            this.changeGameMode('race');
        });

        document.getElementById('battle-mode-btn').addEventListener('click', () => {
            this.changeGameMode('battle');
        });

        // Enter key handlers
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom(false);
            }
        });

        document.getElementById('room-id').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom(false);
            }
        });

        // Spectator camera controls (if in spectator mode)
        document.addEventListener('keydown', (e) => {
            if (this.isSpectator && this.isInRoom) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 9) {
                    this.followPlayer(num - 1);
                }
            }
        });
    }

    setupMultiplayerHandlers() {
        this.multiplayerManager.onPlayerJoined = (data) => {
            console.log('Player joined event:', data);
            this.updateConnectionStatus('✅ Connected to server');
            document.getElementById('join-room-section').style.display = 'block';
            
            if (data.roomId) {
                this.showRoomLobby(data);
            }
        };

        this.multiplayerManager.onPlayerLeft = (data) => {
            console.log('Player left event:', data);
            this.updatePlayersDisplay();
        };

        this.multiplayerManager.onGameStarted = (data) => {
            console.log('🚀 Game started event received:', data);
            this.startMultiplayerGame(data);
        };

        // Handle connection events
        this.multiplayerManager.socket.on('connect', () => {
            console.log('Socket connected');
            this.updateConnectionStatus('✅ Connected to server');
            document.getElementById('join-room-section').style.display = 'block';
        });

        this.multiplayerManager.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.updateConnectionStatus('❌ Disconnected from server');
            document.getElementById('join-room-section').style.display = 'none';
            this.showRoomSetup();
        });

        this.multiplayerManager.socket.on('playerStateChanged', (data) => {
            console.log('Player state changed:', data);
            this.updatePlayersDisplay();
            
            if (data.canStart) {
                console.log('🎮 All players ready! Game should start soon...');
                document.getElementById('start-message').textContent = 'All players ready! Starting game...';
            } else {
                document.getElementById('start-message').textContent = 'Waiting for all players to be ready...';
            }
        });

        // Handle spectator joined
        this.multiplayerManager.socket.on('spectatorJoined', (data) => {
            console.log('Spectator joined:', data);
            this.updateSpectatorsDisplay();
        });

        // Handle spectator left
        this.multiplayerManager.socket.on('spectatorLeft', (data) => {
            console.log('Spectator left:', data);
            this.updateSpectatorsDisplay();
        });

        // Handle game mode changes
        this.multiplayerManager.socket.on('gameModeChanged', (data) => {
            console.log('Game mode changed:', data);
            this.currentGameMode = data.mode;
            this.updateGameModeDisplay();
            this.updatePlayersDisplay();
        });

        // Handle race winner
        this.multiplayerManager.socket.on('raceWinner', (data) => {
            console.log('Race winner:', data);
            this.showWinnerMessage(`🏁 Race Winner: ${data.winner.name}!`, `Completion time: ${(data.completionTime / 1000).toFixed(2)}s`);
        });

        // Handle battle round winner
        this.multiplayerManager.socket.on('battleRoundWinner', (data) => {
            console.log('Battle round winner:', data);
            this.showWinnerMessage(`⚔️ Round ${data.round} Winner: ${data.winner.name}!`, `Round wins: ${data.roundWins}/${data.maxRounds}`);
        });

        // Handle battle match winner
        this.multiplayerManager.socket.on('battleMatchWinner', (data) => {
            console.log('Battle match winner:', data);
            this.showWinnerMessage(`🏆 Match Winner: ${data.winner.name}!`, 'Game Complete!');
        });

        // Handle battle round start
        this.multiplayerManager.socket.on('battleRoundStart', (data) => {
            console.log('Battle round start:', data);
            this.showWinnerMessage(`Round ${data.round} Starting...`, 'Get ready!', 2000);
        });
    }

    joinRoom(asSpectator = false) {
        const playerName = document.getElementById('player-name').value.trim();
        const roomId = document.getElementById('room-id').value.trim() || this.generateRoomId();

        if (!playerName) {
            alert('Please enter your name');
            return;
        }

        if (!this.multiplayerManager.isConnected) {
            alert('Not connected to server. Please wait and try again.');
            return;
        }

        this.playerName = playerName;
        this.currentRoomId = roomId;
        this.isSpectator = asSpectator;
        
        console.log(`Joining room: ${roomId} as ${playerName} (${asSpectator ? 'Spectator' : 'Player'})`);
        this.multiplayerManager.joinRoom(roomId, playerName, asSpectator);
    }

    showRoomLobby(data) {
        this.isInRoom = true;
        this.currentRoomId = data.roomId;
        this.isSpectator = data.isSpectator || false;
        this.isHost = data.isHost || false;
        this.connectedPlayers = data.players || [];
        this.connectedSpectators = data.spectators || [];
        this.currentGameMode = data.gameState?.mode || 'race';
        
        document.getElementById('room-setup').style.display = 'none';
        document.getElementById('room-lobby').style.display = 'block';
        document.getElementById('room-id-display').textContent = this.currentRoomId;
        
        // Show/hide mode selection based on host status
        const modeSelection = document.getElementById('mode-selection');
        if (this.isHost && !this.isSpectator) {
            modeSelection.style.display = 'block';
        } else {
            modeSelection.style.display = 'none';
        }
        
        // Show/hide ready button for spectators
        const readyBtn = document.getElementById('ready-btn');
        if (this.isSpectator) {
            readyBtn.style.display = 'none';
        } else {
            readyBtn.style.display = 'inline-block';
        }
        
        this.updateGameModeDisplay();
        this.updatePlayersDisplay();
        this.updateSpectatorsDisplay();
    }

    showRoomSetup() {
        this.isInRoom = false;
        this.isReady = false;
        document.getElementById('room-setup').style.display = 'block';
        document.getElementById('room-lobby').style.display = 'none';
    }

    updatePlayersDisplay() {
        const playersList = document.getElementById('players-ul');
        playersList.innerHTML = '';
        
        // Add current player
        const currentPlayer = document.createElement('li');
        currentPlayer.style.cssText = 'padding: 5px; margin: 5px 0; background: rgba(255,255,255,0.1); border-radius: 3px;';
        currentPlayer.innerHTML = `
            <span style="color: #4CAF50;">●</span> 
            ${this.playerName} (You) 
            ${this.isReady ? '<span style="color: #4CAF50;">✓ Ready</span>' : '<span style="color: #FFC107;">⏳ Not Ready</span>'}
        `;
        playersList.appendChild(currentPlayer);
        
        // Add other players
        this.multiplayerManager.getOtherPlayers().forEach(player => {
            const playerItem = document.createElement('li');
            playerItem.style.cssText = 'padding: 5px; margin: 5px 0; background: rgba(255,255,255,0.1); border-radius: 3px;';
            playerItem.innerHTML = `
                <span style="color: ${player.color || '#4CAF50'};">●</span> 
                ${player.name} 
                ${player.isReady ? '<span style="color: #4CAF50;">✓ Ready</span>' : '<span style="color: #FFC107;">⏳ Not Ready</span>'}
            `;
            playersList.appendChild(playerItem);
        });
    }

    toggleReady() {
        this.isReady = !this.isReady;
        
        console.log(`Player ${this.playerName} is now ${this.isReady ? 'ready' : 'not ready'}`);
        
        this.multiplayerManager.setPlayerReady(this.isReady);
        
        const readyBtn = document.getElementById('ready-btn');
        if (this.isReady) {
            readyBtn.textContent = 'Not Ready';
            readyBtn.style.background = '#f44336';
        } else {
            readyBtn.textContent = 'Ready';
            readyBtn.style.background = '#4CAF50';
        }
        
        this.updatePlayersDisplay();
    }

    leaveRoom() {
        this.multiplayerManager.disconnect();
        this.showRoomSetup();
        this.multiplayerManager.connect();
    }

    updateConnectionStatus(message) {
        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.textContent = message;
        }
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    startMultiplayerGame(data) {
        console.log('🎮 Starting multiplayer game with data:', data);
        
        if (this.onStartMultiplayerGame) {
            console.log('✅ onStartMultiplayerGame callback exists, calling it...');
            this.onStartMultiplayerGame(data);
        } else {
            console.error('❌ No onStartMultiplayerGame callback set!');
        }
    }

    getMultiplayerManager() {
        return this.multiplayerManager;
    }

    changeGameMode(mode) {
        if (this.isHost && !this.isSpectator) {
            this.currentGameMode = mode;
            this.multiplayerManager.socket.emit('changeGameMode', { mode });
            this.updateGameModeDisplay();
        }
    }

    updateGameModeDisplay() {
        const raceBtn = document.getElementById('race-mode-btn');
        const battleBtn = document.getElementById('battle-mode-btn');
        const modeDesc = document.getElementById('mode-desc-text');
        
        // Update button styles
        if (this.currentGameMode === 'race') {
            raceBtn.style.background = '#4CAF50';
            raceBtn.style.opacity = '1';
            battleBtn.style.background = '#666';
            battleBtn.style.opacity = '0.6';
            modeDesc.textContent = 'Race Mode: First to reach the goal wins!';
        } else {
            battleBtn.style.background = '#f44336';
            battleBtn.style.opacity = '1';
            raceBtn.style.background = '#666';
            raceBtn.style.opacity = '0.6';
            modeDesc.textContent = 'Battle Mode: Knock opponents off the platform!';
        }
    }

    updateSpectatorsDisplay() {
        const spectatorsList = document.getElementById('spectators-ul');
        const spectatorsContainer = document.getElementById('spectators-list');
        
        spectatorsList.innerHTML = '';
        
        if (this.connectedSpectators.length > 0) {
            spectatorsContainer.style.display = 'block';
            
            this.connectedSpectators.forEach(spectator => {
                const spectatorItem = document.createElement('li');
                spectatorItem.style.cssText = 'padding: 5px; margin: 5px 0; background: rgba(255,255,255,0.1); border-radius: 3px;';
                spectatorItem.innerHTML = `
                    <span style="color: #FF9800;">👁️</span> 
                    ${spectator.name}
                    ${spectator.followingPlayer ? `<span style="color: #4CAF50;">(Following Player)</span>` : ''}
                `;
                spectatorsList.appendChild(spectatorItem);
            });
        } else {
            spectatorsContainer.style.display = 'none';
        }
    }

    followPlayer(playerIndex) {
        if (this.isSpectator && this.connectedPlayers[playerIndex]) {
            const playerId = this.connectedPlayers[playerIndex].id;
            this.multiplayerManager.socket.emit('spectatorFollow', { playerId });
        }
    }

    showWinnerMessage(title, subtitle, duration = 5000) {
        // Create winner message overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            font-family: Arial, sans-serif;
        `;

        overlay.innerHTML = `
            <h1 style="color: #FFD700; font-size: 48px; margin-bottom: 20px; text-align: center;">${title}</h1>
            <p style="color: white; font-size: 24px; text-align: center;">${subtitle}</p>
        `;

        document.body.appendChild(overlay);

        // Remove after duration
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, duration);
    }
} 