import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { GameLoop } from './gameLoop.js';
import { Player } from './player.js';
import { GridManager } from './gridManager.js';
import { CameraSystem } from './cameraSystem.js';
import { CollisionSystem } from './collisionSystem.js';
import { UIManager } from './UIManager.js';

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
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLighting();
        this.setupSystems();
        this.setupEventListeners();
        this.startGame();
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
    
    setupSystems() {
        // Initialize all game systems
        this.gridManager = new GridManager(this.scene);
        this.player = new Player(this.scene);
        
        // Validate and set spawn point
        const spawnPoint = this.gridManager.validateSpawnPoint();
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
            uiManager: this.uiManager
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
    }
    
    startGame() {
        this.gameLoop.start();
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 