import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class CameraSystem {
    constructor(player) {
        this.player = player;
        this.camera = null;
        this.cameraMode = 'firstPerson'; // 'firstPerson', 'thirdPerson', 'isometric'
        
        // Camera properties
        this.fov = 75;
        this.aspect = window.innerWidth / window.innerHeight;
        this.near = 0.1;
        this.far = 1000;
        
        // Third person camera settings
        this.thirdPersonDistance = 8;
        this.thirdPersonHeight = 3;
        this.thirdPersonSmoothness = 0.1;
        
        // First person camera settings (adjusted for sphere)
        this.firstPersonHeight = 0.8; // Slightly above sphere center
        this.firstPersonSmoothness = 0.05;
        
        // Isometric camera settings
        this.isometricHeight = 50;
        this.isometricDistance = 30;
        this.isometricAngle = Math.PI / 4; // 45 degrees
        this.isometricSmoothness = 0.1;
        this.isometricPanSpeed = 0.01;
        this.isometricPanOffset = new THREE.Vector3(0, 0, 0);
        this.isometricMaxPanDistance = 25;
        
        // Camera shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        
        // Smooth camera movement
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        
        this.init();
    }
    
    init() {
        // Create perspective camera
        this.camera = new THREE.PerspectiveCamera(
            this.fov,
            this.aspect,
            this.near,
            this.far
        );
        
        // Set initial camera position
        this.updateCameraPosition();
        
        // Setup camera controls
        this.setupControls();
    }
    
    setupControls() {
        // Add keyboard listener for camera mode switching
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyC':
                    this.toggleCameraMode();
                    break;
                case 'KeyR':
                    this.resetCamera();
                    break;
            }
        });
        
        // Add mouse listener for isometric panning
        document.addEventListener('mousemove', (event) => {
            if (this.cameraMode === 'isometric' && document.pointerLockElement) {
                const movementX = event.movementX || 0;
                const movementY = event.movementY || 0;
                
                // Pan the camera around the map
                this.isometricPanOffset.x += movementX * this.isometricPanSpeed;
                this.isometricPanOffset.z += movementY * this.isometricPanSpeed;
                
                // Clamp panning to prevent going too far from the map
                this.isometricPanOffset.x = Math.max(-this.isometricMaxPanDistance, 
                    Math.min(this.isometricMaxPanDistance, this.isometricPanOffset.x));
                this.isometricPanOffset.z = Math.max(-this.isometricMaxPanDistance, 
                    Math.min(this.isometricMaxPanDistance, this.isometricPanOffset.z));
            }
        });
    }
    
    update(deltaTime) {
        // Update camera shake
        this.updateCameraShake(deltaTime);
        
        // Update camera position based on mode
        this.updateCameraPosition();
        
        // Update camera look direction
        this.updateCameraLook();
    }
    
    updateCameraPosition() {
        const playerPosition = this.player.getPosition();
        const playerRotation = this.player.getRotation();
        
        if (this.cameraMode === 'firstPerson') {
            // First person camera - position at player's eye level
            this.targetPosition.copy(playerPosition);
            this.targetPosition.y += this.firstPersonHeight;
            
            // Apply smooth movement
            this.camera.position.lerp(this.targetPosition, this.firstPersonSmoothness);
            
            // Set camera rotation based on player input
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.y = playerRotation.yaw;
            this.camera.rotation.x = playerRotation.pitch;
            
        } else if (this.cameraMode === 'thirdPerson') {
            // Third person camera - position behind and above player
            const offset = new THREE.Vector3(0, this.thirdPersonHeight, this.thirdPersonDistance);
            
            // Apply player rotation to offset
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation.yaw);
            
            // Set target position
            this.targetPosition.copy(playerPosition).add(offset);
            
            // Apply smooth movement
            this.camera.position.lerp(this.targetPosition, this.thirdPersonSmoothness);
            
            // Look at player
            this.targetLookAt.copy(playerPosition);
            this.targetLookAt.y += this.firstPersonHeight;
            this.currentLookAt.lerp(this.targetLookAt, this.thirdPersonSmoothness);
            this.camera.lookAt(this.currentLookAt);
            
        } else if (this.cameraMode === 'isometric') {
            // Isometric camera - positioned high above with angled view
            const basePosition = playerPosition.clone();
            basePosition.add(this.isometricPanOffset);
            
            // Position camera at an angle above the target
            this.targetPosition.set(
                basePosition.x + this.isometricDistance * Math.cos(this.isometricAngle),
                basePosition.y + this.isometricHeight,
                basePosition.z + this.isometricDistance * Math.sin(this.isometricAngle)
            );
            
            // Apply smooth movement
            this.camera.position.lerp(this.targetPosition, this.isometricSmoothness);
            
            // Look at the target position (player + pan offset)
            this.targetLookAt.copy(basePosition);
            this.currentLookAt.lerp(this.targetLookAt, this.isometricSmoothness);
            this.camera.lookAt(this.currentLookAt);
        }
    }
    
    updateCameraLook() {
        // Additional camera look updates can be added here
        // For now, first person mode handles its own look direction
        // and third person mode looks at the player
    }
    
    updateCameraShake(deltaTime) {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= deltaTime;
            
            // Apply shake to camera position
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeZ = (Math.random() - 0.5) * this.shakeIntensity;
            
            this.camera.position.add(new THREE.Vector3(shakeX, shakeY, shakeZ));
            
            // Reduce shake intensity over time
            this.shakeIntensity *= 0.9;
            
            // Stop shake when timer expires
            if (this.shakeTimer <= 0) {
                this.shakeIntensity = 0;
            }
        }
    }
    
    toggleCameraMode() {
        if (this.cameraMode === 'firstPerson') {
            this.cameraMode = 'thirdPerson';
            this.currentLookAt.copy(this.player.getPosition());
        } else if (this.cameraMode === 'thirdPerson') {
            this.cameraMode = 'isometric';
            this.currentLookAt.copy(this.player.getPosition());
            // Reset pan offset when switching to isometric
            this.isometricPanOffset.set(0, 0, 0);
        } else {
            this.cameraMode = 'firstPerson';
        }
    }
    
    resetCamera() {
        // Reset camera to default position and settings
        this.camera.position.copy(this.player.getPosition());
        this.camera.position.y += this.firstPersonHeight;
        this.camera.rotation.set(0, 0, 0);
        this.shakeIntensity = 0;
        this.shakeTimer = 0;
        
        // Reset isometric pan offset
        this.isometricPanOffset.set(0, 0, 0);
    }
    
    // Trigger camera shake effect
    shake(intensity = 0.1, duration = 0.5) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = duration;
    }
    
    // Get camera forward direction
    getForwardDirection() {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        return forward.normalize();
    }
    
    // Get camera right direction
    getRightDirection() {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        return right.normalize();
    }
    
    // Get camera up direction
    getUpDirection() {
        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(this.camera.quaternion);
        return up.normalize();
    }
    
    // Set camera field of view
    setFOV(fov) {
        this.fov = fov;
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
    }
    
    // Set camera aspect ratio
    setAspect(aspect) {
        this.aspect = aspect;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }
    
    // Get current camera mode
    getCameraMode() {
        return this.cameraMode;
    }
    
    // Set camera mode
    setCameraMode(mode) {
        if (mode === 'firstPerson' || mode === 'thirdPerson' || mode === 'isometric') {
            this.cameraMode = mode;
            if (mode === 'isometric') {
                // Reset pan offset when switching to isometric
                this.isometricPanOffset.set(0, 0, 0);
            }
        }
    }
    
    // Get camera position
    getPosition() {
        return this.camera.position.clone();
    }
    
    // Get camera rotation
    getRotation() {
        return this.camera.rotation.clone();
    }
    
    // Smooth camera transition to position
    transitionToPosition(targetPosition, duration = 1.0) {
        // This could be implemented with tweening for smooth transitions
        // For now, we'll use lerp in the update loop
        this.targetPosition.copy(targetPosition);
    }
    
    // Set third person camera distance
    setThirdPersonDistance(distance) {
        this.thirdPersonDistance = distance;
    }
    
    // Set third person camera height
    setThirdPersonHeight(height) {
        this.thirdPersonHeight = height;
    }
    
    // Set isometric camera settings
    setIsometricSettings(height, distance, panSpeed) {
        if (height !== undefined) this.isometricHeight = height;
        if (distance !== undefined) this.isometricDistance = distance;
        if (panSpeed !== undefined) this.isometricPanSpeed = panSpeed;
    }
    
    // Get isometric pan offset
    getIsometricPanOffset() {
        return this.isometricPanOffset.clone();
    }
    
    // Reset isometric pan
    resetIsometricPan() {
        this.isometricPanOffset.set(0, 0, 0);
    }
} 