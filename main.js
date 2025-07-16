import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { GameLoop } from './gameLoop.js';
import { Player } from './player.js';
import { GridManager } from './gridManager.js';
import { CameraSystem } from './cameraSystem.js';
import { CollisionSystem } from './collisionSystem.js';
import { UIManager } from './UIManager.js';
import { LevelLoader } from './levelLoader.js';
import { MainMenu } from './mainMenu.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scene = null;
        this.renderer = null;
        this.gameLoop = null;
        this.player = null;
        this.gridManager = null;
        this.cameraSystem = null;
        this.collisionSystem = null;
        this.uiManager = null;
        this.mainMenu = null;
        this.isGameInitialized = false;
        
        this.initializeMenu();
    }
    
    initializeMenu() {
        // Create main menu
        this.mainMenu = new MainMenu((mode) => this.startGame(mode));
        
        // Hide the game canvas initially
        this.canvas.style.display = 'none';
        
        // Hide game UI elements initially
        const gameUI = document.getElementById('ui');
        const crosshair = document.getElementById('crosshair');
        const instructions = document.getElementById('instructions');
        
        if (gameUI) gameUI.style.display = 'none';
        if (crosshair) crosshair.style.display = 'none';
        if (instructions) instructions.style.display = 'none';
    }
    
    async startGame(mode = 'normal') {
        this.gameMode = mode; // Store game mode
        
        // Show the game canvas
        this.canvas.style.display = 'block';
        
        // Show game UI elements
        const gameUI = document.getElementById('ui');
        const crosshair = document.getElementById('crosshair');
        const instructions = document.getElementById('instructions');
        
        if (gameUI) gameUI.style.display = 'block';
        if (crosshair) crosshair.style.display = 'block';
        if (instructions) instructions.style.display = 'block';
        
        // Initialize the game if not already done
        if (!this.isGameInitialized) {
            await this.init();
            this.isGameInitialized = true;
        }
        
        // Start the game loop
        this.gameLoop.start();
    }
    
    async init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLighting();
        await this.setupSystems();
        this.setupEventListeners();
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x87CEEB); // Sky blue background
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }
    
    async setupSystems() {
        // Initialize level loader and load a level
        this.levelLoader = new LevelLoader();
        
        // Load appropriate level based on game mode
        if (this.gameMode === 'pacman') {
            // Try to load pacman level, fallback to creating one
            try {
                await this.levelLoader.loadLevel('./levels/pacman.json');
            } catch (error) {
                console.warn('Could not load pacman.json, creating default pacman level');
                this.levelLoader.loadLevelFromData(this.levelLoader.createPacmanLevel());
            }
        } else {
            // Try to load level1.json, fallback to default if failed
            try {
                await this.levelLoader.loadLevel('./levels/level1.json');
            } catch (error) {
                console.warn('Could not load level1.json, using default level');
                this.levelLoader.loadLevelFromData(this.levelLoader.createTestLevel());
            }
        }
        
        // Initialize all game systems with level data
        this.gridManager = new GridManager(this.scene, this.levelLoader);
        this.player = new Player(this.scene);
        
        // Get spawn point from level
        const spawnPoint = this.levelLoader.getSpawnPoint();
        this.player.setSpawnPoint(spawnPoint);
        
        this.cameraSystem = new CameraSystem(this.player);
        this.collisionSystem = new CollisionSystem();
        this.uiManager = new UIManager();
        
        // Setup collision system with grid and player
        this.collisionSystem.setPlayer(this.player);
        this.collisionSystem.setGrid(this.gridManager);
        
        // Setup game loop
        this.gameLoop = new GameLoop(this.renderer, this.scene, this.cameraSystem.camera, {
            player: this.player,
            gridManager: this.gridManager,
            cameraSystem: this.cameraSystem,
            collisionSystem: this.collisionSystem,
            uiManager: this.uiManager,
            levelLoader: this.levelLoader
        });
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.cameraSystem.camera.aspect = window.innerWidth / window.innerHeight;
            this.cameraSystem.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Handle pointer lock
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });
        
        // Handle pointer lock change
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === this.canvas) {
                this.player.enableControls();
            } else {
                this.player.disableControls();
            }
        });
        
        // Handle ESC key to show main menu
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isGameInitialized) {
                this.toggleMainMenu();
            }
        });
    }
    
    toggleMainMenu() {
        if (this.mainMenu.isVisible) {
            // Hide menu and resume game
            this.mainMenu.hide();
            this.canvas.style.display = 'block';
            
            // Show game UI
            const gameUI = document.getElementById('ui');
            const crosshair = document.getElementById('crosshair');
            const instructions = document.getElementById('instructions');
            
            if (gameUI) gameUI.style.display = 'block';
            if (crosshair) crosshair.style.display = 'block';
            if (instructions) instructions.style.display = 'block';
            
            if (this.gameLoop) {
                this.gameLoop.start();
            }
        } else {
            // Show menu and pause game
            this.mainMenu.show();
            this.canvas.style.display = 'none';
            
            // Hide game UI
            const gameUI = document.getElementById('ui');
            const crosshair = document.getElementById('crosshair');
            const instructions = document.getElementById('instructions');
            
            if (gameUI) gameUI.style.display = 'none';
            if (crosshair) crosshair.style.display = 'none';
            if (instructions) instructions.style.display = 'none';
            
            if (this.gameLoop) {
                this.gameLoop.stop();
            }
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 