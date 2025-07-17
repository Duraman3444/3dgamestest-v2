export class BattleUI {
    constructor() {
        this.elements = {};
        this.isActive = false;
        this.currentLevel = 1;
        this.animationFrameId = null;
        
        // UI state
        this.playerDamage = 0;
        this.botDamages = [];
        this.levelName = "";
        this.roundTimer = 0;
        this.isVictoryScreen = false;
        this.isDefeatScreen = false;
        
        // Animation properties
        this.damageFlashTimer = 0;
        this.victoryAnimationTimer = 0;
        this.confettiParticles = [];
        
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
        
        // Create level name display
        this.createLevelNameDisplay();
        
        // Create damage meters
        this.createDamageMeters();
        
        // Create round timer
        this.createRoundTimer();
        
        // Create victory screen
        this.createVictoryScreen();
        
        // Create defeat screen
        this.createDefeatScreen();
        
        // Create countdown overlay
        this.createCountdownOverlay();
        
        // Create controls info
        this.createControlsInfo();
        
        // Create bot status indicators
        this.createBotStatusIndicators();
        
        console.log('Battle UI created');
    }
    
    createLevelNameDisplay() {
        const levelDisplay = document.createElement('div');
        levelDisplay.id = 'level-name-display';
        levelDisplay.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: #ffffff;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            border: 2px solid #ffd700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            pointer-events: none;
            z-index: 1001;
        `;
        
        this.elements.container.appendChild(levelDisplay);
        this.elements.levelDisplay = levelDisplay;
    }
    
    createDamageMeters() {
        // Player damage meter
        const playerMeter = document.createElement('div');
        playerMeter.id = 'player-damage-meter';
        playerMeter.style.cssText = `
            position: absolute;
            bottom: 40px;
            left: 40px;
            width: 300px;
            height: 60px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            border: 2px solid #00ff00;
            padding: 10px;
            z-index: 1001;
        `;
        
        const playerLabel = document.createElement('div');
        playerLabel.textContent = 'PLAYER';
        playerLabel.style.cssText = `
            color: #00ff00;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
        `;
        
        const playerDamageBar = document.createElement('div');
        playerDamageBar.style.cssText = `
            width: 100%;
            height: 20px;
            background: #333333;
            border-radius: 5px;
            overflow: hidden;
            position: relative;
        `;
        
        const playerDamageFill = document.createElement('div');
        playerDamageFill.id = 'player-damage-fill';
        playerDamageFill.style.cssText = `
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
            transition: width 0.3s ease;
        `;
        
        const playerDamageText = document.createElement('div');
        playerDamageText.id = 'player-damage-text';
        playerDamageText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ffffff;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        `;
        
        playerDamageBar.appendChild(playerDamageFill);
        playerDamageBar.appendChild(playerDamageText);
        playerMeter.appendChild(playerLabel);
        playerMeter.appendChild(playerDamageBar);
        
        this.elements.container.appendChild(playerMeter);
        this.elements.playerMeter = playerMeter;
        this.elements.playerDamageFill = playerDamageFill;
        this.elements.playerDamageText = playerDamageText;
        
        // Bot damage meters container
        const botMetersContainer = document.createElement('div');
        botMetersContainer.id = 'bot-damage-meters';
        botMetersContainer.style.cssText = `
            position: absolute;
            bottom: 40px;
            right: 40px;
            z-index: 1001;
        `;
        
        this.elements.container.appendChild(botMetersContainer);
        this.elements.botMetersContainer = botMetersContainer;
    }
    
    createRoundTimer() {
        const timer = document.createElement('div');
        timer.id = 'round-timer';
        timer.style.cssText = `
            position: absolute;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: #ffffff;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            border: 2px solid #ffffff;
            z-index: 1001;
        `;
        
        this.elements.container.appendChild(timer);
        this.elements.timer = timer;
    }
    
    createVictoryScreen() {
        const victoryScreen = document.createElement('div');
        victoryScreen.id = 'victory-screen';
        victoryScreen.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            z-index: 1010;
            pointer-events: auto;
        `;
        
        const victoryTitle = document.createElement('div');
        victoryTitle.textContent = 'VICTORY!';
        victoryTitle.style.cssText = `
            font-size: 72px;
            font-weight: bold;
            color: #ffd700;
            text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
            margin-bottom: 30px;
            animation: pulse 2s infinite;
        `;
        
        const victoryMessage = document.createElement('div');
        victoryMessage.id = 'victory-message';
        victoryMessage.style.cssText = `
            font-size: 24px;
            color: #ffffff;
            text-align: center;
            margin-bottom: 40px;
            line-height: 1.4;
        `;
        
        const nextLevelButton = document.createElement('button');
        nextLevelButton.id = 'next-level-button';
        nextLevelButton.textContent = 'NEXT LEVEL';
        nextLevelButton.style.cssText = `
            background: linear-gradient(45deg, #00ff00, #008800);
            color: #ffffff;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 255, 0, 0.3);
        `;
        
        const restartButton = document.createElement('button');
        restartButton.id = 'restart-level-button';
        restartButton.textContent = 'RESTART LEVEL';
        restartButton.style.cssText = `
            background: linear-gradient(45deg, #ff8800, #cc6600);
            color: #ffffff;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 136, 0, 0.3);
        `;
        
        const mainMenuButton = document.createElement('button');
        mainMenuButton.id = 'battle-main-menu-button';
        mainMenuButton.textContent = 'MAIN MENU';
        mainMenuButton.style.cssText = `
            background: linear-gradient(45deg, #666666, #444444);
            color: #ffffff;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 102, 102, 0.3);
        `;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            justify-content: center;
        `;
        
        buttonContainer.appendChild(nextLevelButton);
        buttonContainer.appendChild(restartButton);
        buttonContainer.appendChild(mainMenuButton);
        
        victoryScreen.appendChild(victoryTitle);
        victoryScreen.appendChild(victoryMessage);
        victoryScreen.appendChild(buttonContainer);
        
        this.elements.container.appendChild(victoryScreen);
        this.elements.victoryScreen = victoryScreen;
        this.elements.victoryMessage = victoryMessage;
        this.elements.nextLevelButton = nextLevelButton;
        this.elements.restartButton = restartButton;
        this.elements.mainMenuButton = mainMenuButton;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            @keyframes sparkle {
                0% { opacity: 0; transform: scale(0) rotate(0deg); }
                50% { opacity: 1; transform: scale(1) rotate(180deg); }
                100% { opacity: 0; transform: scale(0) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    createDefeatScreen() {
        const defeatScreen = document.createElement('div');
        defeatScreen.id = 'defeat-screen';
        defeatScreen.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            z-index: 1010;
            pointer-events: auto;
        `;
        
        const defeatTitle = document.createElement('div');
        defeatTitle.textContent = 'DEFEAT';
        defeatTitle.style.cssText = `
            font-size: 72px;
            font-weight: bold;
            color: #ff0000;
            text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
            margin-bottom: 30px;
        `;
        
        const defeatMessage = document.createElement('div');
        defeatMessage.id = 'defeat-message';
        defeatMessage.textContent = 'You were knocked out! Train harder and try again.';
        defeatMessage.style.cssText = `
            font-size: 24px;
            color: #ffffff;
            text-align: center;
            margin-bottom: 40px;
            line-height: 1.4;
        `;
        
        const retryButton = document.createElement('button');
        retryButton.id = 'retry-button';
        retryButton.textContent = 'TRY AGAIN';
        retryButton.style.cssText = `
            background: linear-gradient(45deg, #ff4444, #cc0000);
            color: #ffffff;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
        `;
        
        const defeatMainMenuButton = document.createElement('button');
        defeatMainMenuButton.id = 'defeat-main-menu-button';
        defeatMainMenuButton.textContent = 'MAIN MENU';
        defeatMainMenuButton.style.cssText = `
            background: linear-gradient(45deg, #666666, #444444);
            color: #ffffff;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 102, 102, 0.3);
        `;
        
        const defeatButtonContainer = document.createElement('div');
        defeatButtonContainer.style.cssText = `
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            justify-content: center;
        `;
        
        defeatButtonContainer.appendChild(retryButton);
        defeatButtonContainer.appendChild(defeatMainMenuButton);
        
        defeatScreen.appendChild(defeatTitle);
        defeatScreen.appendChild(defeatMessage);
        defeatScreen.appendChild(defeatButtonContainer);
        
        this.elements.container.appendChild(defeatScreen);
        this.elements.defeatScreen = defeatScreen;
        this.elements.defeatMessage = defeatMessage;
        this.elements.retryButton = retryButton;
        this.elements.defeatMainMenuButton = defeatMainMenuButton;
    }
    
    createCountdownOverlay() {
        const countdown = document.createElement('div');
        countdown.id = 'battle-countdown';
        countdown.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 120px;
            font-weight: bold;
            color: #ffffff;
            text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
            z-index: 1020;
            display: none;
            pointer-events: none;
        `;
        
        this.elements.container.appendChild(countdown);
        this.elements.countdown = countdown;
    }
    
    createControlsInfo() {
        const controlsInfo = document.createElement('div');
        controlsInfo.id = 'battle-controls-info';
        controlsInfo.style.cssText = `
            position: absolute;
            top: 150px;
            left: 40px;
            background: rgba(0, 0, 0, 0.8);
            color: #ffffff;
            padding: 15px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.4;
            border: 2px solid #ffffff;
            z-index: 1001;
        `;
        
        controlsInfo.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">CONTROLS:</div>
            <div>WASD - Move</div>
            <div>Mouse - Look</div>
            <div>Space - Jump</div>
            <div>F / Click - Attack</div>
            <div>Q - Special Attack</div>
        `;
        
        this.elements.container.appendChild(controlsInfo);
        this.elements.controlsInfo = controlsInfo;
    }
    
    createBotStatusIndicators() {
        const botStatus = document.createElement('div');
        botStatus.id = 'bot-status-indicators';
        botStatus.style.cssText = `
            position: absolute;
            top: 40px;
            right: 40px;
            z-index: 1001;
        `;
        
        this.elements.container.appendChild(botStatus);
        this.elements.botStatus = botStatus;
    }
    
    show() {
        this.isActive = true;
        this.elements.container.style.display = 'block';
        console.log('Battle UI shown');
    }
    
    hide() {
        this.isActive = false;
        this.elements.container.style.display = 'none';
        this.hideAllScreens();
        console.log('Battle UI hidden');
    }
    
    hideAllScreens() {
        this.elements.victoryScreen.style.display = 'none';
        this.elements.defeatScreen.style.display = 'none';
        this.elements.countdown.style.display = 'none';
        this.isVictoryScreen = false;
        this.isDefeatScreen = false;
    }
    
    updateLevelDisplay(levelConfig) {
        this.levelName = levelConfig.name;
        this.currentLevel = levelConfig.level || 1;
        this.elements.levelDisplay.innerHTML = `
            <div>Level ${this.currentLevel}</div>
            <div style="font-size: 18px; margin-top: 5px;">${this.levelName}</div>
        `;
    }
    
    updateDamageMeters(playerDamage, botDamages) {
        this.playerDamage = playerDamage;
        this.botDamages = botDamages;
        
        // Update player damage meter
        const playerPercent = Math.min((playerDamage / 300) * 100, 100);
        this.elements.playerDamageFill.style.width = `${playerPercent}%`;
        this.elements.playerDamageText.textContent = `${Math.round(playerDamage)}%`;
        
        // Change player meter color based on damage
        if (playerPercent < 50) {
            this.elements.playerMeter.style.borderColor = '#00ff00';
        } else if (playerPercent < 80) {
            this.elements.playerMeter.style.borderColor = '#ffff00';
        } else {
            this.elements.playerMeter.style.borderColor = '#ff0000';
        }
        
        // Update bot damage meters
        this.updateBotDamageMeters(botDamages);
    }
    
    updateBotDamageMeters(botDamages) {
        // Clear existing bot meters
        this.elements.botMetersContainer.innerHTML = '';
        
        botDamages.forEach((bot, index) => {
            if (!bot.isActive) return;
            
            const botMeter = document.createElement('div');
            botMeter.style.cssText = `
                width: 200px;
                height: 50px;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 8px;
                border: 2px solid #ff0000;
                padding: 8px;
                margin-bottom: 10px;
            `;
            
            const botLabel = document.createElement('div');
            botLabel.textContent = `BOT ${bot.id + 1}`;
            botLabel.style.cssText = `
                color: #ff0000;
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 3px;
            `;
            
            const botDamageBar = document.createElement('div');
            botDamageBar.style.cssText = `
                width: 100%;
                height: 15px;
                background: #333333;
                border-radius: 3px;
                overflow: hidden;
                position: relative;
            `;
            
            const botDamageFill = document.createElement('div');
            const botPercent = Math.min((bot.damage / 300) * 100, 100);
            botDamageFill.style.cssText = `
                height: 100%;
                width: ${botPercent}%;
                background: linear-gradient(90deg, #ff0000, #ff8800, #ffff00);
                transition: width 0.3s ease;
            `;
            
            const botDamageText = document.createElement('div');
            botDamageText.textContent = `${Math.round(bot.damage)}%`;
            botDamageText.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ffffff;
                font-size: 10px;
                font-weight: bold;
                text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
            `;
            
            botDamageBar.appendChild(botDamageFill);
            botDamageBar.appendChild(botDamageText);
            botMeter.appendChild(botLabel);
            botMeter.appendChild(botDamageBar);
            
            this.elements.botMetersContainer.appendChild(botMeter);
        });
    }
    
    updateTimer(timeElapsed) {
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = Math.floor(timeElapsed % 60);
        this.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    showCountdown(number) {
        this.elements.countdown.style.display = 'block';
        this.elements.countdown.textContent = number;
        
        // Add animation
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
    
    showVictoryScreen(levelConfig, isLastLevel = false) {
        this.isVictoryScreen = true;
        this.elements.victoryScreen.style.display = 'flex';
        
        let message = `You conquered ${levelConfig.name}!`;
        if (isLastLevel) {
            message = `🎉 ULTIMATE VICTORY! 🎉\n\nYou've completed all 7 levels of the\nBattle Mode campaign!\n\nYou are the ultimate warrior!`;
            this.elements.nextLevelButton.style.display = 'none';
        } else {
            message += `\n\nNext Level in 5 seconds...`;
            this.elements.nextLevelButton.style.display = 'block';
        }
        
        this.elements.victoryMessage.innerHTML = message.replace(/\n/g, '<br>');
        
        // Start victory animation
        this.startVictoryAnimation();
        
        // Auto-advance to next level after 5 seconds (if not last level)
        if (!isLastLevel) {
            setTimeout(() => {
                if (this.isVictoryScreen) {
                    this.elements.nextLevelButton.click();
                }
            }, 5000);
        }
    }
    
    showDefeatScreen() {
        this.isDefeatScreen = true;
        this.elements.defeatScreen.style.display = 'flex';
    }
    
    startVictoryAnimation() {
        this.victoryAnimationTimer = 0;
        this.confettiParticles = [];
        
        // Create confetti particles
        for (let i = 0; i < 50; i++) {
            this.confettiParticles.push({
                x: Math.random() * window.innerWidth,
                y: -20,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                size: Math.random() * 8 + 4,
                color: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'][Math.floor(Math.random() * 5)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
        
        this.animateVictory();
    }
    
    animateVictory() {
        if (!this.isVictoryScreen) return;
        
        // Update confetti
        this.updateConfetti();
        
        // Continue animation
        requestAnimationFrame(() => this.animateVictory());
    }
    
    updateConfetti() {
        // Create canvas for confetti if it doesn't exist
        if (!this.confettiCanvas) {
            this.confettiCanvas = document.createElement('canvas');
            this.confettiCanvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1005;
            `;
            this.confettiCanvas.width = window.innerWidth;
            this.confettiCanvas.height = window.innerHeight;
            this.elements.victoryScreen.appendChild(this.confettiCanvas);
            this.confettiCtx = this.confettiCanvas.getContext('2d');
        }
        
        // Clear canvas
        this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        
        // Update and draw confetti
        this.confettiParticles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.rotation += particle.rotationSpeed;
            
            // Reset particle if it goes off screen
            if (particle.y > window.innerHeight + 20) {
                particle.y = -20;
                particle.x = Math.random() * window.innerWidth;
            }
            
            // Draw particle
            this.confettiCtx.save();
            this.confettiCtx.translate(particle.x, particle.y);
            this.confettiCtx.rotate(particle.rotation * Math.PI / 180);
            this.confettiCtx.fillStyle = particle.color;
            this.confettiCtx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            this.confettiCtx.restore();
        });
    }
    
    setEventHandlers(handlers) {
        if (handlers.onNextLevel) {
            this.elements.nextLevelButton.addEventListener('click', handlers.onNextLevel);
        }
        
        if (handlers.onRestart) {
            this.elements.restartButton.addEventListener('click', handlers.onRestart);
            this.elements.retryButton.addEventListener('click', handlers.onRestart);
        }
        
        if (handlers.onMainMenu) {
            this.elements.mainMenuButton.addEventListener('click', handlers.onMainMenu);
            this.elements.defeatMainMenuButton.addEventListener('click', handlers.onMainMenu);
        }
    }
    
    showDamageNumber(position, damage) {
        const damageNumber = document.createElement('div');
        damageNumber.textContent = `-${Math.round(damage)}`;
        damageNumber.style.cssText = `
            position: absolute;
            color: #ff0000;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            pointer-events: none;
            z-index: 1015;
            animation: damageFloat 1s ease-out forwards;
        `;
        
        // Convert 3D position to screen coordinates (simplified)
        const screenX = (position.x / 40) * window.innerWidth + window.innerWidth / 2;
        const screenY = window.innerHeight - (position.y / 20) * window.innerHeight / 2;
        
        damageNumber.style.left = `${screenX}px`;
        damageNumber.style.top = `${screenY}px`;
        
        this.elements.container.appendChild(damageNumber);
        
        // Add CSS animation for damage numbers
        if (!document.getElementById('damage-number-styles')) {
            const style = document.createElement('style');
            style.id = 'damage-number-styles';
            style.textContent = `
                @keyframes damageFloat {
                    0% { transform: translateY(0px); opacity: 1; }
                    100% { transform: translateY(-50px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove damage number after animation
        setTimeout(() => {
            if (damageNumber.parentNode) {
                damageNumber.parentNode.removeChild(damageNumber);
            }
        }, 1000);
    }
    
    update(deltaTime, battleData) {
        if (!this.isActive) return;
        
        // Update damage meters
        if (battleData.playerDamage !== undefined && battleData.botDamages) {
            this.updateDamageMeters(battleData.playerDamage, battleData.botDamages);
        }
        
        // Update timer
        if (battleData.roundTimer !== undefined) {
            this.updateTimer(battleData.roundTimer);
        }
        
        // Update damage flash effect
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaTime;
            const flashIntensity = this.damageFlashTimer / 0.5;
            this.elements.container.style.backgroundColor = `rgba(255, 0, 0, ${flashIntensity * 0.2})`;
            
            if (this.damageFlashTimer <= 0) {
                this.elements.container.style.backgroundColor = 'transparent';
            }
        }
    }
    
    triggerDamageFlash() {
        this.damageFlashTimer = 0.5; // 0.5 second flash
    }
    
    cleanup() {
        if (this.confettiCanvas) {
            this.confettiCanvas.remove();
            this.confettiCanvas = null;
        }
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.isActive = false;
        this.isVictoryScreen = false;
        this.isDefeatScreen = false;
        this.confettiParticles = [];
    }
} 