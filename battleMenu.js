export class BattleMenu {
    constructor(onStartBattle, onBackToMain) {
        this.onStartBattle = onStartBattle;
        this.onBackToMain = onBackToMain;
        this.isVisible = false;
        this.selectedLevel = 1;
        this.selectedBotCount = 3; // Default to 3 bots (1 player vs 3 bots)
        this.menuElement = null;
        this.levelSelect = null;
        this.botCountSelect = null;
        this.startButton = null;
        this.backButton = null;
        
        this.createMenu();
        this.setupEventListeners();
        
        console.log('🥊 Battle Menu created - Bot Battle Mode');
    }
    
    createMenu() {
        this.menuElement = document.createElement('div');
        this.menuElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: 'Courier New', monospace;
        `;
        
        // Title
        const title = document.createElement('h1');
        title.textContent = '🤖 BOT BATTLE ARENA';
        title.style.cssText = `
            color: #FFD700;
            font-size: 48px;
            margin-bottom: 30px;
            text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.7);
        `;
        
        // Subtitle
        const subtitle = document.createElement('div');
        subtitle.textContent = 'Player vs Bots - Prove your skills against AI opponents!';
        subtitle.style.cssText = `
            color: #FFFFFF;
            font-size: 20px;
            margin-bottom: 40px;
            text-align: center;
        `;
        
        // Bot count selection
        const botCountContainer = document.createElement('div');
        botCountContainer.style.cssText = `
            margin-bottom: 30px;
            text-align: center;
        `;
        
        const botCountLabel = document.createElement('label');
        botCountLabel.textContent = 'Number of Bot Opponents:';
        botCountLabel.style.cssText = `
            color: #FFFFFF;
            font-size: 18px;
            display: block;
            margin-bottom: 10px;
        `;
        
        this.botCountSelect = document.createElement('select');
        this.botCountSelect.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            color: #FFFFFF;
            border: 2px solid #FFD700;
            padding: 10px;
            font-size: 16px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            width: 200px;
        `;
        
        // Add bot count options
        for (let i = 1; i <= 3; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} Bot${i > 1 ? 's' : ''}`;
            if (i === 3) option.selected = true;
            this.botCountSelect.appendChild(option);
        }
        
        botCountContainer.appendChild(botCountLabel);
        botCountContainer.appendChild(this.botCountSelect);
        
        // Arena info
        const arenaInfo = document.createElement('div');
        arenaInfo.style.cssText = `
            color: #CCCCCC;
            font-size: 14px;
            margin-bottom: 30px;
            text-align: center;
            max-width: 600px;
            line-height: 1.6;
        `;
        arenaInfo.innerHTML = `
            <div style="margin-bottom: 15px;">🎨 <strong>16 Themed Arenas</strong> with unique hazards and environments</div>
            <div style="margin-bottom: 15px;">🤖 <strong>Smart AI Opponents</strong> - Fight against challenging bot enemies</div>
            <div style="margin-bottom: 15px;">💥 <strong>Damage System</strong> - Higher damage = easier to knock off</div>
            <div style="margin-bottom: 15px;">🏆 <strong>Progressive Difficulty</strong> - Bots get smarter as you advance</div>
            <div style="margin-bottom: 15px;">⚠️ <strong>Interactive Hazards</strong> - Ice, lava, spikes, teleporters & more!</div>
        `;
        
        // Control schemes info
        const controlInfo = document.createElement('div');
        controlInfo.style.cssText = `
            color: #AAAAAA;
            font-size: 12px;
            margin-bottom: 30px;
            text-align: center;
            max-width: 500px;
        `;
        controlInfo.innerHTML = `
            <div style="margin-bottom: 10px;"><strong>🎮 Player Controls:</strong></div>
            <div style="margin-bottom: 10px;">🟢 Use WASD keys to move and fight</div>
            <div style="margin-bottom: 10px;">🤖 Bots will move and attack automatically</div>
            <div style="margin-bottom: 10px;">🎯 <strong>Objective:</strong> Be the last one standing!</div>
            <div style="margin-bottom: 10px;">💡 <strong>Tip:</strong> Use arena hazards to your advantage!</div>
        `;
        
        // Start button
        this.startButton = document.createElement('button');
        this.startButton.textContent = 'START BOT BATTLE';
        this.startButton.style.cssText = `
            background: linear-gradient(45deg, #FF6B6B, #FF8E53);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 20px;
            font-weight: bold;
            border-radius: 10px;
            cursor: pointer;
            margin: 10px;
            font-family: 'Courier New', monospace;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        `;
        
        // Back button
        this.backButton = document.createElement('button');
        this.backButton.textContent = 'BACK TO MAIN MENU';
        this.backButton.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            color: #FFFFFF;
            border: 2px solid #FFFFFF;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
            font-family: 'Courier New', monospace;
            transition: all 0.3s ease;
        `;
        
        // Hover effects
        this.startButton.addEventListener('mouseenter', () => {
            this.startButton.style.transform = 'scale(1.05)';
            this.startButton.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
        });
        
        this.startButton.addEventListener('mouseleave', () => {
            this.startButton.style.transform = 'scale(1)';
            this.startButton.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
        });
        
        this.backButton.addEventListener('mouseenter', () => {
            this.backButton.style.background = 'rgba(255, 255, 255, 0.2)';
            this.backButton.style.transform = 'scale(1.05)';
        });
        
        this.backButton.addEventListener('mouseleave', () => {
            this.backButton.style.background = 'rgba(255, 255, 255, 0.1)';
            this.backButton.style.transform = 'scale(1)';
        });
        
        // Add all elements to menu
        this.menuElement.appendChild(title);
        this.menuElement.appendChild(subtitle);
        this.menuElement.appendChild(botCountContainer);
        this.menuElement.appendChild(arenaInfo);
        this.menuElement.appendChild(controlInfo);
        this.menuElement.appendChild(this.startButton);
        this.menuElement.appendChild(this.backButton);
        
        document.body.appendChild(this.menuElement);
        
        console.log('🥊 Battle Menu created');
    }
    
    setupEventListeners() {
        // Bot count selection
        this.botCountSelect.addEventListener('change', (e) => {
            this.selectedBotCount = parseInt(e.target.value);
        });
        
        // Start battle button
        this.startButton.addEventListener('click', () => {
            this.startBattle();
        });
        
        // Back button
        this.backButton.addEventListener('click', () => {
            this.hide();
            this.onBackToMain();
        });
        
        // ESC key to go back
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
                this.onBackToMain();
            }
        });
    }
    
    startBattle() {
        console.log(`🤖 Starting Player vs ${this.selectedBotCount} Bots Battle`);
        this.hide();
        // Route to the enhanced battle system for bot battles
        this.onStartBattle('bot_battle', this.selectedBotCount, 'normal');
    }
    
    show() {
        this.isVisible = true;
        this.menuElement.style.display = 'flex';
        console.log('🥊 Battle Menu shown');
    }
    
    hide() {
        this.isVisible = false;
        this.menuElement.style.display = 'none';
        console.log('🥊 Battle Menu hidden');
    }
    
    cleanup() {
        if (this.menuElement) {
            document.body.removeChild(this.menuElement);
        }
    }
} 