export class MapSelectionMenu {
    constructor(onMapSelectionComplete, onBackToMenu) {
        this.onMapSelectionComplete = onMapSelectionComplete;
        this.onBackToMenu = onBackToMenu;
        this.menuElement = null;
        this.isVisible = false;
        this.currentOptionIndex = 0;
        this.menuButtons = [];
        this.keyboardListener = null;
        
        // Battle configuration (set from previous menu)
        this.battleConfig = null;
        this.rounds = 3;
        this.battleMode = 'bot_battle'; // 'bot_battle' or 'local_multiplayer'
        
        // Map selection state
        this.selectedMaps = [];
        this.useRandomMaps = false;
        this.currentRoundIndex = 0;
        this.isInMapSelect = false;
        this.mapSelectButtons = [];
        this.mapSelectIndex = 0;
        
        // Available maps - Multiplayer Battle Arenas Only
        this.availableMaps = [
            // Jungle/Nature Themed Arenas
            { 
                id: 'jungle_temple', 
                name: 'Jungle Temple', 
                file: 'level1.json',
                category: 'Nature',
                description: 'Ancient temple with sinkholes and spike traps',
                difficulty: 'Medium',
                theme: 'jungle'
            },
            { 
                id: 'forest_clearing', 
                name: 'Forest Clearing', 
                file: 'level2.json',
                category: 'Nature',
                description: 'Bounce pads and natural obstacles',
                difficulty: 'Easy',
                theme: 'forest'
            },
            // Volcanic/Fire Themed Arenas
            { 
                id: 'lava_cavern', 
                name: 'Lava Cavern', 
                file: 'level3.json',
                category: 'Volcanic',
                description: 'Molten lava geysers and heat zones',
                difficulty: 'Hard',
                theme: 'volcano'
            },
            { 
                id: 'magma_chamber', 
                name: 'Magma Chamber', 
                file: 'level4.json',
                category: 'Volcanic',
                description: 'Explosive magma bursts and lava pools',
                difficulty: 'Expert',
                theme: 'magma'
            },
            // Sky/Cloud Themed Arenas  
            { 
                id: 'sky_fortress', 
                name: 'Sky Fortress', 
                file: 'level5.json',
                category: 'Aerial',
                description: 'Multi-level aerial combat with launch pads',
                difficulty: 'Hard',
                theme: 'sky'
            },
            { 
                id: 'cloud_arena', 
                name: 'Cloud Arena', 
                file: 'level6.json',
                category: 'Aerial',
                description: 'Floating platforms and wind currents',
                difficulty: 'Medium',
                theme: 'clouds'
            },
            // Desert Themed Arenas
            { 
                id: 'desert_ruins', 
                name: 'Desert Ruins', 
                file: 'pacman1.json',
                category: 'Desert',
                description: 'Ancient ruins with quicksand and sandstorms',
                difficulty: 'Hard',
                theme: 'desert'
            },
            { 
                id: 'oasis_battleground', 
                name: 'Oasis Battleground', 
                file: 'pacman2.json',
                category: 'Desert',
                description: 'Obelisk energy blasts and mirages',
                difficulty: 'Expert',
                theme: 'oasis'
            },
            // Ice/Winter Themed Arenas
            { 
                id: 'frozen_lake', 
                name: 'Frozen Lake', 
                file: 'pacman3.json',
                category: 'Ice',
                description: 'Slippery ice surfaces and freezing hazards',
                difficulty: 'Medium',
                theme: 'ice'
            },
            { 
                id: 'glacier_peak', 
                name: 'Glacier Peak', 
                file: 'pacman4.json',
                category: 'Ice',
                description: 'Icy ramps and avalanche zones',
                difficulty: 'Hard',
                theme: 'glacier'
            },
            // Pirate/Ocean Themed Arenas
            { 
                id: 'pirate_ship', 
                name: 'Pirate Ship', 
                file: 'pacman5.json',
                category: 'Nautical',
                description: 'Rolling deck with cannons and waves',
                difficulty: 'Expert',
                theme: 'pirate'
            }
        ];
        
        this.createMenu();
    }
    
    // Set battle configuration from previous menu
    setBattleConfig(config) {
        this.battleConfig = config;
        this.rounds = config.rounds || 3;
        this.battleMode = config.mode || 'bot_battle';
        
        // Initialize selected maps array
        this.selectedMaps = new Array(this.rounds).fill(null);
        this.currentRoundIndex = 0;
        
        console.log(`🗺️ Map selection initialized for ${this.rounds} rounds, mode: ${this.battleMode}`);
        
        // Update UI if already created
        if (this.menuElement) {
            this.updateMainInterface();
        }
    }
    
    createMenu() {
        // Create menu container
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'mapSelectionMenu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #2C1810 0%, #1a1a1a 50%, #0D1B2A 100%);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            z-index: 1000;
            font-family: 'Courier New', monospace;
            overflow-y: auto;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        // Create title
        const title = document.createElement('h1');
        title.textContent = 'ARENA SELECTION';
        title.style.cssText = `
            color: #FFD700;
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 3px 3px 0px #FF4500, 6px 6px 0px #000000;
            text-align: center;
            letter-spacing: 6px;
            text-transform: uppercase;
            font-family: 'Courier New', monospace;
        `;
        
        // Create subtitle
        const subtitle = document.createElement('h2');
        subtitle.textContent = 'CHOOSE YOUR BATTLEGROUNDS';
        subtitle.style.cssText = `
            color: #00FFFF;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 2px 2px 0px #000000;
            text-align: center;
            letter-spacing: 3px;
            text-transform: uppercase;
            font-family: 'Courier New', monospace;
        `;
        
        // Create main interface container
        this.mainInterface = document.createElement('div');
        this.mainInterface.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 1200px;
        `;
        
        // Create battle info panel
        this.createBattleInfoPanel();
        
        // Create randomization option
        this.createRandomizationOption();
        
        // Create manual selection interface
        this.createManualSelectionInterface();
        
        // Create action buttons
        this.createActionButtons();
        
        // Add to menu
        this.menuElement.appendChild(title);
        this.menuElement.appendChild(subtitle);
        this.menuElement.appendChild(this.mainInterface);
        document.body.appendChild(this.menuElement);
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
    }
    
    createBattleInfoPanel() {
        const infoPanel = document.createElement('div');
        infoPanel.style.cssText = `
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #FFD700;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
            min-width: 400px;
        `;
        
        this.battleInfoContent = document.createElement('div');
        this.battleInfoContent.style.cssText = `
            color: #FFFFFF;
            font-size: 16px;
            line-height: 1.5;
        `;
        
        infoPanel.appendChild(this.battleInfoContent);
        this.mainInterface.appendChild(infoPanel);
        
        this.updateBattleInfo();
    }
    
    updateBattleInfo() {
        if (!this.battleInfoContent || !this.battleConfig) return;
        
        let infoHTML = `<div style="font-size: 20px; color: #FFD700; margin-bottom: 10px;">Battle Configuration</div>`;
        
        if (this.battleMode === 'bot_battle') {
            infoHTML += `<div>Mode: <span style="color: #00FF00;">Bot Battle</span></div>`;
            infoHTML += `<div>Bots: <span style="color: #00FFFF;">${this.battleConfig.botCount}</span></div>`;
        } else if (this.battleMode === 'local_multiplayer') {
            infoHTML += `<div>Mode: <span style="color: #FF4500;">Local Multiplayer</span></div>`;
            infoHTML += `<div>Players: <span style="color: #00FFFF;">${this.battleConfig.playerCount}</span></div>`;
        }
        
        infoHTML += `<div>Rounds to Win: <span style="color: #FF69B4;">${this.rounds}</span></div>`;
        infoHTML += `<div style="margin-top: 10px; color: #CCCCCC;">Select an arena for each round, or use randomization</div>`;
        
        this.battleInfoContent.innerHTML = infoHTML;
    }
    
    createRandomizationOption() {
        const randomSection = document.createElement('div');
        randomSection.style.cssText = `
            background: rgba(255, 69, 0, 0.1);
            border: 2px solid #FF4500;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
            width: 100%;
            max-width: 600px;
        `;
        
        const randomTitle = document.createElement('div');
        randomTitle.textContent = '🎲 RANDOMIZE ARENAS';
        randomTitle.style.cssText = `
            color: #FF4500;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
            text-shadow: 2px 2px 0px #000000;
            text-transform: uppercase;
            letter-spacing: 2px;
        `;
        
        const randomDesc = document.createElement('div');
        randomDesc.textContent = 'Let the system choose different arenas for each round';
        randomDesc.style.cssText = `
            color: #FFFFFF;
            font-size: 14px;
            margin-bottom: 20px;
            line-height: 1.4;
        `;
        
        this.randomizeButton = this.createButton('Enable Random Arenas', () => this.toggleRandomization(), 0);
        this.randomizeButton.style.background = this.useRandomMaps ? 
            'linear-gradient(135deg, #228B22 0%, #32CD32 100%)' : 
            'linear-gradient(135deg, #8B4513 0%, #CD853F 100%)';
        
        randomSection.appendChild(randomTitle);
        randomSection.appendChild(randomDesc);
        randomSection.appendChild(this.randomizeButton);
        
        this.mainInterface.appendChild(randomSection);
    }
    
    createManualSelectionInterface() {
        this.manualSection = document.createElement('div');
        this.manualSection.style.cssText = `
            background: rgba(0, 255, 255, 0.1);
            border: 2px solid #00FFFF;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
            width: 100%;
            max-width: 800px;
            ${this.useRandomMaps ? 'opacity: 0.5; pointer-events: none;' : ''}
        `;
        
        const manualTitle = document.createElement('div');
        manualTitle.textContent = '🗺️ MANUAL ARENA SELECTION';
        manualTitle.style.cssText = `
            color: #00FFFF;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
            text-shadow: 2px 2px 0px #000000;
            text-transform: uppercase;
            letter-spacing: 2px;
        `;
        
        // Round indicator
        this.roundIndicator = document.createElement('div');
        this.roundIndicator.style.cssText = `
            color: #FFD700;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            text-transform: uppercase;
        `;
        
        // Selected maps display
        this.selectedMapsDisplay = document.createElement('div');
        this.selectedMapsDisplay.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 8px;
            min-height: 60px;
            align-items: center;
        `;
        
        // Map selection buttons
        this.mapSelectionContainer = document.createElement('div');
        this.mapSelectionContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
            max-height: 400px;
            overflow-y: auto;
            padding: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
        `;
        
        // Navigation buttons for round selection
        this.roundNavigation = document.createElement('div');
        this.roundNavigation.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 20px;
        `;
        
        this.prevRoundButton = this.createSmallButton('← Previous Round', () => this.previousRound());
        this.nextRoundButton = this.createSmallButton('Next Round →', () => this.nextRound());
        
        this.roundNavigation.appendChild(this.prevRoundButton);
        this.roundNavigation.appendChild(this.nextRoundButton);
        
        this.manualSection.appendChild(manualTitle);
        this.manualSection.appendChild(this.roundIndicator);
        this.manualSection.appendChild(this.selectedMapsDisplay);
        this.manualSection.appendChild(this.roundNavigation);
        this.manualSection.appendChild(this.mapSelectionContainer);
        
        this.mainInterface.appendChild(this.manualSection);
        
        this.updateManualInterface();
        this.createMapButtons();
    }
    
    createActionButtons() {
        const actionContainer = document.createElement('div');
        actionContainer.style.cssText = `
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
            width: 100%;
            max-width: 600px;
        `;
        
        this.startBattleButton = this.createButton('START BATTLE!', () => this.startBattle(), 100);
        this.startBattleButton.style.cssText += `
            background: linear-gradient(135deg, #228B22 0%, #32CD32 100%) !important;
            font-size: 24px !important;
            padding: 20px 40px !important;
            min-width: 250px !important;
        `;
        
        this.backButton = this.createButton('Back', () => this.goBack(), 101);
        this.backButton.style.cssText += `
            background: linear-gradient(135deg, #DC143C 0%, #FF6347 100%) !important;
        `;
        
        actionContainer.appendChild(this.startBattleButton);
        actionContainer.appendChild(this.backButton);
        
        this.mainInterface.appendChild(actionContainer);
        
        this.updateStartButtonState();
    }
    
    createMapButtons() {
        this.mapSelectionContainer.innerHTML = '';
        this.mapSelectButtons = [];
        
        // Group maps by category
        const mapsByCategory = {};
        this.availableMaps.forEach(map => {
            if (!mapsByCategory[map.category]) {
                mapsByCategory[map.category] = [];
            }
            mapsByCategory[map.category].push(map);
        });
        
        // Create buttons for each category
        Object.keys(mapsByCategory).forEach(category => {
            // Category header
            const categoryHeader = document.createElement('div');
            categoryHeader.textContent = `${category} Arenas`;
            categoryHeader.style.cssText = `
                grid-column: 1 / -1;
                color: #FFD700;
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                margin: 10px 0 5px 0;
                text-transform: uppercase;
                letter-spacing: 2px;
                text-shadow: 2px 2px 0px #000000;
            `;
            this.mapSelectionContainer.appendChild(categoryHeader);
            
            // Map buttons for this category
            mapsByCategory[category].forEach((map, index) => {
                const button = this.createMapButton(map, this.mapSelectButtons.length);
                this.mapSelectButtons.push(button);
                this.mapSelectionContainer.appendChild(button);
            });
        });
    }
    
    createMapButton(map, index) {
        const button = document.createElement('button');
        button.style.cssText = `
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border: 2px solid ${this.getDifficultyColor(map.difficulty)};
            color: #FFFFFF;
            padding: 15px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s ease;
            text-align: left;
            font-family: 'Courier New', monospace;
            text-transform: uppercase;
            line-height: 1.3;
        `;
        
        const difficultyColor = this.getDifficultyColor(map.difficulty);
        
        button.innerHTML = `
            <div style="color: ${difficultyColor}; font-size: 16px; margin-bottom: 5px;">${map.name}</div>
            <div style="color: #CCCCCC; font-size: 12px; margin-bottom: 8px; text-transform: none;">${map.description}</div>
            <div style="color: ${difficultyColor}; font-size: 12px;">Difficulty: ${map.difficulty}</div>
        `;
        
        button.addEventListener('click', () => {
            // Play click sound
            if (window.game && window.game.audioManager) {
                window.game.audioManager.playMenuClickSound();
            }
            this.selectMap(map);
        });
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = `0 0 15px ${difficultyColor}`;
            
            // Play hover sound
            if (window.game && window.game.audioManager) {
                window.game.audioManager.playMenuHoverSound();
            }
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = 'none';
        });
        
        return button;
    }
    
    getDifficultyColor(difficulty) {
        switch(difficulty) {
            case 'Easy': return '#00FF00';
            case 'Medium': return '#FFFF00';
            case 'Hard': return '#FF8C00';
            case 'Expert': return '#FF0000';
            default: return '#FFFFFF';
        }
    }
    
    updateManualInterface() {
        if (!this.roundIndicator || !this.selectedMapsDisplay) return;
        
        // Update round indicator
        this.roundIndicator.textContent = `Round ${this.currentRoundIndex + 1} of ${this.rounds}`;
        
        // Update selected maps display
        this.selectedMapsDisplay.innerHTML = '';
        
        for (let i = 0; i < this.rounds; i++) {
            const roundSlot = document.createElement('div');
            roundSlot.style.cssText = `
                background: ${i === this.currentRoundIndex ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 0, 0, 0.5)'};
                border: 2px solid ${i === this.currentRoundIndex ? '#FFD700' : '#666666'};
                border-radius: 8px;
                padding: 10px;
                min-width: 120px;
                text-align: center;
                font-size: 12px;
            `;
            
            if (this.selectedMaps[i]) {
                roundSlot.innerHTML = `
                    <div style="color: #FFD700; font-weight: bold;">Round ${i + 1}</div>
                    <div style="color: #FFFFFF; margin-top: 5px;">${this.selectedMaps[i].name}</div>
                `;
            } else {
                roundSlot.innerHTML = `
                    <div style="color: ${i === this.currentRoundIndex ? '#FFD700' : '#666666'}; font-weight: bold;">Round ${i + 1}</div>
                    <div style="color: #999999; margin-top: 5px;">Not Selected</div>
                `;
            }
            
            // Click to select this round
            roundSlot.style.cursor = 'pointer';
            roundSlot.addEventListener('click', () => {
                this.currentRoundIndex = i;
                this.updateManualInterface();
            });
            
            this.selectedMapsDisplay.appendChild(roundSlot);
        }
        
        // Update navigation buttons
        this.prevRoundButton.disabled = this.currentRoundIndex === 0;
        this.nextRoundButton.disabled = this.currentRoundIndex === this.rounds - 1;
        
        this.prevRoundButton.style.opacity = this.currentRoundIndex === 0 ? '0.5' : '1';
        this.nextRoundButton.style.opacity = this.currentRoundIndex === this.rounds - 1 ? '0.5' : '1';
    }
    
    updateMainInterface() {
        this.updateBattleInfo();
        this.updateManualInterface();
        this.updateRandomizationInterface();
        this.updateStartButtonState();
    }
    
    updateRandomizationInterface() {
        if (!this.randomizeButton) return;
        
        this.randomizeButton.textContent = this.useRandomMaps ? 'Disable Random Arenas' : 'Enable Random Arenas';
        this.randomizeButton.style.background = this.useRandomMaps ? 
            'linear-gradient(135deg, #228B22 0%, #32CD32 100%)' : 
            'linear-gradient(135deg, #8B4513 0%, #CD853F 100%)';
            
        if (this.manualSection) {
            this.manualSection.style.opacity = this.useRandomMaps ? '0.5' : '1';
            this.manualSection.style.pointerEvents = this.useRandomMaps ? 'none' : 'auto';
        }
    }
    
    updateStartButtonState() {
        if (!this.startBattleButton) return;
        
        const canStart = this.useRandomMaps || this.selectedMaps.every(map => map !== null);
        
        this.startBattleButton.disabled = !canStart;
        this.startBattleButton.style.opacity = canStart ? '1' : '0.5';
        this.startBattleButton.style.cursor = canStart ? 'pointer' : 'not-allowed';
    }
    
    toggleRandomization() {
        this.useRandomMaps = !this.useRandomMaps;
        console.log(`🎲 Random maps ${this.useRandomMaps ? 'enabled' : 'disabled'}`);
        
        this.updateRandomizationInterface();
        this.updateStartButtonState();
    }
    
    selectMap(map) {
        if (this.useRandomMaps) return; // Ignore if randomization is enabled
        
        this.selectedMaps[this.currentRoundIndex] = map;
        console.log(`🗺️ Selected ${map.name} for round ${this.currentRoundIndex + 1}`);
        
        // Move to next round if not at the end
        if (this.currentRoundIndex < this.rounds - 1) {
            this.currentRoundIndex++;
        }
        
        this.updateManualInterface();
        this.updateStartButtonState();
    }
    
    previousRound() {
        if (this.currentRoundIndex > 0) {
            this.currentRoundIndex--;
            this.updateManualInterface();
        }
    }
    
    nextRound() {
        if (this.currentRoundIndex < this.rounds - 1) {
            this.currentRoundIndex++;
            this.updateManualInterface();
        }
    }
    
    generateRandomMaps() {
        const randomMaps = [];
        for (let i = 0; i < this.rounds; i++) {
            const randomIndex = Math.floor(Math.random() * this.availableMaps.length);
            randomMaps.push(this.availableMaps[randomIndex]);
        }
        return randomMaps;
    }
    
    startBattle() {
        const mapsToUse = this.useRandomMaps ? this.generateRandomMaps() : this.selectedMaps;
        
        console.log('🚀 Starting battle with maps:', mapsToUse.map(map => map.name));
        
        const mapSelectionData = {
            maps: mapsToUse,
            randomized: this.useRandomMaps,
            battleConfig: this.battleConfig
        };
        
        this.hide();
        this.onMapSelectionComplete(mapSelectionData);
    }
    
    goBack() {
        this.hide();
        this.onBackToMenu();
    }
    
    createButton(text, onClick, index) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: linear-gradient(135deg, #003366 0%, #0066cc 100%);
            border: 3px solid #00ffff;
            color: #ffffff;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s ease;
            min-width: 200px;
            text-align: center;
            user-select: none;
            font-family: 'Courier New', monospace;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-shadow: 2px 2px 0px #000000;
            box-shadow: 4px 4px 0px #000000;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = 'linear-gradient(135deg, #0066cc 0%, #00aaff 100%)';
            button.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'linear-gradient(135deg, #003366 0%, #0066cc 100%)';
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', onClick);
        
        this.menuButtons.push(button);
        return button;
    }
    
    createSmallButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: linear-gradient(135deg, #444444 0%, #666666 100%);
            border: 2px solid #CCCCCC;
            color: #FFFFFF;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.3s ease;
            text-align: center;
            user-select: none;
            font-family: 'Courier New', monospace;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = 'linear-gradient(135deg, #666666 0%, #888888 100%)';
            button.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'linear-gradient(135deg, #444444 0%, #666666 100%)';
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', onClick);
        return button;
    }
    
    setupKeyboardNavigation() {
        this.keyboardListener = (e) => {
            if (!this.isVisible) return;
            
            switch(e.key) {
                case 'Escape':
                    this.goBack();
                    break;
                case 'Enter':
                    if (this.useRandomMaps || this.selectedMaps.every(map => map !== null)) {
                        this.startBattle();
                    }
                    break;
                case 'ArrowLeft':
                    this.previousRound();
                    break;
                case 'ArrowRight':
                    this.nextRound();
                    break;
                case 'r':
                case 'R':
                    this.toggleRandomization();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyboardListener);
    }
    
    show() {
        this.isVisible = true;
        this.menuElement.style.display = 'flex';
        console.log('🗺️ Map Selection Menu shown');
    }
    
    hide() {
        this.isVisible = false;
        this.menuElement.style.display = 'none';
        console.log('🗺️ Map Selection Menu hidden');
    }
    
    destroy() {
        if (this.keyboardListener) {
            document.removeEventListener('keydown', this.keyboardListener);
        }
        
        if (this.menuElement && this.menuElement.parentNode) {
            document.body.removeChild(this.menuElement);
        }
    }
} 