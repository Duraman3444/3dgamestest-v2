export class BattleUI {
    constructor() {
        this.elements = {};
        this.isActive = false;
        this.currentLevel = 1;
        this.roundTimer = 0;
        this.enemiesAlive = 0;
        
        this.createUI();
    }
    
    createUI() {
        // Create main battle UI container
        const battleContainer = document.createElement('div');
        battleContainer.id = 'battle-ui';
        battleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            font-family: 'Courier New', monospace;
            display: none;
        `;
        document.body.appendChild(battleContainer);
        this.elements.container = battleContainer;
        
        // Create sumo battle HUD
        this.createSumoHUD();
        
        // Create countdown display
        this.createCountdownDisplay();
        
        // Create battle messages
        this.createMessageDisplay();
    }
    
    createSumoHUD() {
        const hudContainer = document.createElement('div');
        hudContainer.id = 'sumo-hud';
        hudContainer.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-size: 16px;
            border: 2px solid #FFD700;
            min-width: 200px;
        `;
        
        hudContainer.innerHTML = `
            <div style="font-size: 20px; color: #FFD700; margin-bottom: 10px;">
                🥊 SUMO BATTLE
            </div>
            <div id="battle-level" style="margin-bottom: 5px;">
                Level: ${this.currentLevel}
            </div>
            <div id="enemies-remaining" style="margin-bottom: 5px;">
                Enemies: ${this.enemiesAlive}
            </div>
            <div id="battle-timer" style="margin-bottom: 5px;">
                Time: 0:00
            </div>
            <div id="battle-state" style="color: #00FF00;">
                Get Ready!
            </div>
        `;
        
        this.elements.container.appendChild(hudContainer);
        this.elements.hud = hudContainer;
    }
    
    createCountdownDisplay() {
        const countdownDiv = document.createElement('div');
        countdownDiv.id = 'battle-countdown';
        countdownDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 120px;
            font-weight: bold;
            color: #FFD700;
            text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
            z-index: 1010;
            display: none;
            pointer-events: none;
        `;
        
        this.elements.container.appendChild(countdownDiv);
        this.elements.countdown = countdownDiv;
    }
    
    createMessageDisplay() {
        const messageDiv = document.createElement('div');
        messageDiv.id = 'battle-message';
        messageDiv.style.cssText = `
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-weight: bold;
            color: #FF6B6B;
            text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
            z-index: 1005;
            display: none;
            pointer-events: none;
            text-align: center;
        `;
        
        this.elements.container.appendChild(messageDiv);
        this.elements.message = messageDiv;
    }
    
    // Show countdown
    showCountdown(number) {
        this.elements.countdown.style.display = 'block';
        this.elements.countdown.textContent = number;
        
        // Animate countdown
        this.elements.countdown.style.transform = 'translate(-50%, -50%) scale(0.5)';
        this.elements.countdown.style.opacity = '0';
        
        setTimeout(() => {
            this.elements.countdown.style.transform = 'translate(-50%, -50%) scale(1)';
            this.elements.countdown.style.opacity = '1';
            this.elements.countdown.style.transition = 'all 0.3s ease';
        }, 50);
        
        setTimeout(() => {
            this.elements.countdown.style.display = 'none';
        }, 1000);
    }
    
    // Show battle message
    showMessage(text, duration = 3000) {
        this.elements.message.textContent = text;
        this.elements.message.style.display = 'block';
        
        setTimeout(() => {
            this.elements.message.style.display = 'none';
        }, duration);
    }
    
    // Update battle data
    updateBattleData(data) {
        // Update level
        if (data.level !== undefined) {
            this.currentLevel = data.level;
            const levelElement = document.getElementById('battle-level');
            if (levelElement) {
                levelElement.textContent = `Level: ${data.level}`;
            }
        }
        
        // Update enemies remaining
        if (data.enemiesAlive !== undefined) {
            this.enemiesAlive = data.enemiesAlive;
            const enemiesElement = document.getElementById('enemies-remaining');
            if (enemiesElement) {
                enemiesElement.textContent = `Enemies: ${data.enemiesAlive}`;
                // Change color based on remaining enemies
                if (data.enemiesAlive <= 1) {
                    enemiesElement.style.color = '#FF6B6B';
                } else if (data.enemiesAlive <= 2) {
                    enemiesElement.style.color = '#FFA500';
                } else {
                    enemiesElement.style.color = '#FFFFFF';
                }
            }
        }
        
        // Update timer
        if (data.timer !== undefined) {
            this.roundTimer = data.timer;
            const timerElement = document.getElementById('battle-timer');
            if (timerElement) {
                const minutes = Math.floor(this.roundTimer / 60);
                const seconds = Math.floor(this.roundTimer % 60);
                timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                // Change color based on remaining time
                if (this.roundTimer > 45) {
                    timerElement.style.color = '#FF6B6B';
                } else if (this.roundTimer > 30) {
                    timerElement.style.color = '#FFA500';
                } else {
                    timerElement.style.color = '#FFFFFF';
                }
            }
        }
        
        // Update battle state
        if (data.state !== undefined) {
            const stateElement = document.getElementById('battle-state');
            if (stateElement) {
                stateElement.textContent = data.state;
                
                // Color based on state
                switch (data.state) {
                    case 'Get Ready!':
                        stateElement.style.color = '#FFD700';
                        break;
                    case 'FIGHT!':
                        stateElement.style.color = '#00FF00';
                        break;
                    case 'Victory!':
                        stateElement.style.color = '#00FF00';
                        break;
                    case 'Defeat!':
                        stateElement.style.color = '#FF0000';
                        break;
                    default:
                        stateElement.style.color = '#FFFFFF';
                }
            }
        }
    }
    
    // Show the battle UI
    show() {
        this.isActive = true;
        this.elements.container.style.display = 'block';
        console.log('🎮 Sumo Battle UI shown');
    }
    
    // Hide the battle UI
    hide() {
        this.isActive = false;
        this.elements.container.style.display = 'none';
        console.log('🎮 Sumo Battle UI hidden');
    }
    
    // Update battle level
    updateLevel(level) {
        this.currentLevel = level;
        const levelElement = document.getElementById('battle-level');
        if (levelElement) {
            levelElement.textContent = `Level: ${level}`;
        }
    }
    
    // Update battle state
    updateState(state) {
        const stateElement = document.getElementById('battle-state');
        if (stateElement) {
            stateElement.textContent = state;
        }
    }
    
    // Show victory message
    showVictory() {
        this.updateState('Victory!');
        this.showMessage('🏆 VICTORY! 🏆\nYou knocked out all enemies!', 5000);
        console.log('🏆 Victory displayed');
    }
    
    // Show defeat message
    showDefeat() {
        this.updateState('Defeat!');
        this.showMessage('💀 DEFEAT! 💀\nYou fell off the arena!', 5000);
        console.log('💀 Defeat displayed');
    }
    
    // Controls info
    showControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'sumo-controls';
        controlsDiv.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
            border: 1px solid #666;
        `;
        
        controlsDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">CONTROLS:</div>
            <div>WASD - Move your ball</div>
            <div>Bump enemies off the arena!</div>
            <div>Last ball standing wins!</div>
        `;
        
        this.elements.container.appendChild(controlsDiv);
        this.elements.controls = controlsDiv;
    }
    
    // Clean up
    cleanup() {
        this.hide();
        
        // Remove UI elements
        if (this.elements.container) {
            if (this.elements.container.parentNode) {
                this.elements.container.parentNode.removeChild(this.elements.container);
            }
            this.elements.container = null;
        }
        
        // Remove any victory/defeat screens that might still be showing
        const victoryScreen = document.getElementById('battle-victory-screen');
        if (victoryScreen && victoryScreen.parentNode) {
            victoryScreen.parentNode.removeChild(victoryScreen);
        }
        
        const defeatScreen = document.getElementById('battle-defeat-screen');
        if (defeatScreen && defeatScreen.parentNode) {
            defeatScreen.parentNode.removeChild(defeatScreen);
        }
        
        // Remove any battle result overlays
        const battleResults = document.querySelectorAll('[id*="battle-result"], [class*="battle-result"], [id*="victory"], [id*="defeat"]');
        battleResults.forEach(result => {
            if (result.parentNode && result.id !== 'mainMenu') {
                try {
                    result.parentNode.removeChild(result);
                } catch (e) {
                    console.warn('Could not remove battle result element:', e);
                }
            }
        });
        
        // Clear the elements object
        this.elements = {};
        
        console.log('🧹 Sumo Battle UI cleaned up completely');
    }
    
    // Update round information display
    updateRoundInfo(currentRound, playerWins, botWins, roundsToWin) {
        console.log(`🎯 Updating round info: Round ${currentRound}, Player: ${playerWins}/${roundsToWin}, Bots: ${botWins}/${roundsToWin}`);
        
        // Update level display to show round info
        if (this.elements.level) {
            this.elements.level.textContent = `Round ${currentRound} | Player: ${playerWins}/${roundsToWin} | Bots: ${botWins}/${roundsToWin}`;
        }
        
        // Show round advancement message
        this.showMessage(`Round ${currentRound} Starting!`, 2000);
    }
} 