import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

// Post-processing imports for advanced effects
import { EffectComposer } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'https://unpkg.com/three@0.158.0/examples/jsm/shaders/CopyShader.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/SSAOPass.js';
import { BokehPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/BokehPass.js';
import { FilmPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/FilmPass.js';
import { GlitchPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/GlitchPass.js';

// Simplified and Working SSR Shader
const SSRShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'intensity': { value: 0.5 },
        'resolution': { value: new THREE.Vector2() }
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,

    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform float intensity;
        uniform vec2 resolution;
        
        varying vec2 vUv;
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            
            // Simple pseudo-reflection effect
            vec2 center = vec2(0.5, 0.5);
            vec2 reflectUV = center + (center - vUv) * 0.1;
            
            // Sample reflection from mirrored position
            vec4 reflectionColor = texture2D(tDiffuse, reflectUV);
            
            // Calculate reflection strength based on surface properties
            float surfaceReflection = smoothstep(0.3, 1.0, color.r + color.g + color.b);
            float edgeFade = 1.0 - smoothstep(0.6, 1.0, distance(vUv, center));
            
            // Mix original color with reflection
            float reflectionStrength = intensity * surfaceReflection * edgeFade * 0.3;
            gl_FragColor = mix(color, reflectionColor, reflectionStrength);
        }`
};

// God Rays Shader
const GodRaysShader = {
    uniforms: {
        tDiffuse: { value: null },
        lightPosition: { value: new THREE.Vector2(0.8, 0.2) }, // More natural light position (top-right)
        exposure: { value: 0.4 },
        decay: { value: 0.96 },
        density: { value: 0.6 },
        weight: { value: 0.6 },
        samples: { value: 40 }
    },
    
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
        
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 lightPosition;
        uniform float exposure;
        uniform float decay;
        uniform float density;
        uniform float weight;
        uniform int samples;
        varying vec2 vUv;
        
        void main() {
            vec2 texCoord = vUv;
            vec2 lightVector = lightPosition - texCoord;
            float lightDistance = length(lightVector);
            vec2 deltaTexCoord = lightVector / float(samples) * density;
            
            vec3 color = texture2D(tDiffuse, texCoord).rgb;
            float illuminationDecay = 1.0;
            
            // Add distance-based intensity falloff
            float distanceIntensity = 1.0 - smoothstep(0.0, 1.0, lightDistance);
            
            for(int i = 0; i < 50; i++) {
                if(i >= samples) break;
                texCoord += deltaTexCoord;
                
                // Sample the texture
                vec3 texSample = texture2D(tDiffuse, texCoord).rgb;
                
                // Calculate brightness of the sample
                float brightness = dot(texSample, vec3(0.299, 0.587, 0.114));
                
                // Apply volumetric scattering with brightness consideration
                texSample *= illuminationDecay * weight * (1.0 + brightness * 2.0);
                color += texSample * distanceIntensity;
                illuminationDecay *= decay;
            }
            
            // Enhanced color blending with better contrast
            vec3 originalColor = texture2D(tDiffuse, vUv).rgb;
            vec3 finalColor = mix(originalColor, color * exposure, 0.7);
            
            gl_FragColor = vec4(finalColor, 1.0);
        }`
};

// Motion Blur Shader
const MotionBlurShader = {
    uniforms: {
        tDiffuse: { value: null },
        velocityFactor: { value: 1.0 },
        samples: { value: 32 }
    },
    
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
        
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float velocityFactor;
        uniform int samples;
        varying vec2 vUv;
        
        void main() {
            vec4 color = vec4(0.0);
            vec2 velocity = vec2(0.005, 0.0) * velocityFactor; // Simulate motion
            
            for(int i = 0; i < 32; i++) {
                if(i >= samples) break;
                float t = float(i) / float(samples - 1);
                vec2 offset = velocity * (t - 0.5);
                color += texture2D(tDiffuse, vUv + offset);
            }
            
            gl_FragColor = color / float(samples);
        }`
};

// Vignette Shader
const VignetteShader = {
    uniforms: {
        tDiffuse: { value: null },
        intensity: { value: 0.5 }
    },
    
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
        
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float intensity;
        varying vec2 vUv;
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            float vignette = 1.0 - smoothstep(0.2, 1.0, dist * intensity);
            gl_FragColor = vec4(color.rgb * vignette, color.a);
        }`
};

// Chromatic Aberration Shader
const ChromaticAberrationShader = {
    uniforms: {
        tDiffuse: { value: null },
        amount: { value: 0.005 }
    },
    
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
        
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float amount;
        varying vec2 vUv;
        
        void main() {
            vec2 coord = vUv;
            vec3 color;
            color.r = texture2D(tDiffuse, coord + vec2(amount, 0.0)).r;
            color.g = texture2D(tDiffuse, coord).g;
            color.b = texture2D(tDiffuse, coord - vec2(amount, 0.0)).b;
            gl_FragColor = vec4(color, 1.0);
        }`
};

// Color Grading Shader
const ColorGradingShader = {
    uniforms: {
        tDiffuse: { value: null },
        preset: { value: 0 }, // 0=cinematic, 1=vibrant, 2=warm, 3=cool, 4=noir
        intensity: { value: 1.0 }
    },
    
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
        
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform int preset;
        uniform float intensity;
        varying vec2 vUv;
        
        vec3 applyColorGrading(vec3 color, int preset) {
            if(preset == 0) { // Cinematic
                return color * vec3(1.1, 0.9, 0.8) + vec3(0.05, 0.02, 0.0);
            } else if(preset == 1) { // Vibrant
                return pow(color, vec3(0.8)) * 1.2;
            } else if(preset == 2) { // Warm
                return color * vec3(1.2, 1.05, 0.8);
            } else if(preset == 3) { // Cool
                return color * vec3(0.8, 0.95, 1.2);
            } else if(preset == 4) { // Noir
                vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
                return mix(gray, color * vec3(0.8, 0.8, 1.2), 0.3);
            }
            return color;
        }
        
        void main() {
            vec3 color = texture2D(tDiffuse, vUv).rgb;
            vec3 graded = applyColorGrading(color, preset);
            gl_FragColor = vec4(mix(color, graded, intensity), 1.0);
        }`
};

export class GraphicsEnhancer {
    constructor(scene, renderer, camera) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        this.enhancedMaterials = new Map();
        this.particleSystems = [];
        this.environmentEffects = [];
        
        // Post-processing setup
        this.composer = null;
        this.renderTargets = {};
        
        // Effect passes
        this.renderPass = null;
        this.ssrPass = null;
        this.bloomPass = null;
        this.ssaoPass = null;
        this.godRaysPass = null;
        this.motionBlurPass = null;
        this.dofPass = null;
        this.filmPass = null;
        this.vignettePass = null;
        this.chromaticPass = null;
        this.colorGradingPass = null;
        this.copyPass = null;
        
        // Effect states
        this.effects = {
            ssr: false,
            bloom: false,
            ssao: false,
            godRays: false,
            motionBlur: false,
            dof: false,
            filmGrain: false,
            vignette: false,
            chromaticAberration: false,
            colorGrading: false,
            particleEffects: true,
            dynamicLighting: false
        };
        
        // Initialize enhanced renderer settings
        this.setupEnhancedRenderer();
        this.setupPostProcessing();
    }

    setupEnhancedRenderer() {
        // Enhanced renderer settings for better quality
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        
        // Enhanced tone mapping and color space
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Enhanced pixel ratio and anti-aliasing
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable high-quality features
        this.renderer.useLegacyLights = false;
        this.renderer.physicallyCorrectLights = true;
        
        console.log('🎨 Graphics enhancer initialized with premium settings');
    }

    setupPostProcessing() {
        if (!this.camera) {
            console.warn('⚠️ Camera not provided, skipping post-processing setup');
            return;
        }

        const size = this.renderer.getSize(new THREE.Vector2());

        // Create effect composer
        this.composer = new EffectComposer(this.renderer);
        
        // 1. Base render pass
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        
        // 2. SSAO Pass (Screen Space Ambient Occlusion)
        this.ssaoPass = new SSAOPass(this.scene, this.camera, size.x, size.y);
        this.ssaoPass.kernelRadius = 8;
        this.ssaoPass.minDistance = 0.005;
        this.ssaoPass.maxDistance = 0.1;
        this.ssaoPass.enabled = false;
        this.composer.addPass(this.ssaoPass);
        
        // 3. SSR Pass (Screen Space Reflections)
        this.ssrPass = new ShaderPass(SSRShader);
        this.ssrPass.uniforms['resolution'].value = size;
        this.ssrPass.uniforms['intensity'].value = 0.5;
        this.ssrPass.enabled = false;
        this.composer.addPass(this.ssrPass);
        
        // 4. Bloom Pass
        this.bloomPass = new UnrealBloomPass(size, 1.5, 0.4, 0.85);
        this.bloomPass.threshold = 0.85;
        this.bloomPass.strength = 0.3;
        this.bloomPass.radius = 0.4;
        this.bloomPass.enabled = false;
        this.composer.addPass(this.bloomPass);
        
        // 5. God Rays Pass
        this.godRaysPass = new ShaderPass(GodRaysShader);
        this.godRaysPass.uniforms['lightPosition'].value = new THREE.Vector2(0.5, 0.5);
        this.godRaysPass.enabled = false;
        this.composer.addPass(this.godRaysPass);
        
        // 6. Motion Blur Pass
        this.motionBlurPass = new ShaderPass(MotionBlurShader);
        this.motionBlurPass.enabled = false;
        this.composer.addPass(this.motionBlurPass);
        
        // 7. Depth of Field Pass
        this.dofPass = new BokehPass(this.scene, this.camera, {
            focus: 10.0,
            aperture: 0.025,
            maxblur: 0.01,
            width: size.x,
            height: size.y
        });
        this.dofPass.enabled = false;
        this.composer.addPass(this.dofPass);
        
        // 8. Film Grain Pass
        this.filmPass = new FilmPass(0.35, 0.5, 2048, false);
        this.filmPass.enabled = false;
        this.composer.addPass(this.filmPass);
        
        // 9. Vignette Pass
        this.vignettePass = new ShaderPass(VignetteShader);
        this.vignettePass.enabled = false;
        this.composer.addPass(this.vignettePass);
        
        // 10. Chromatic Aberration Pass
        this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
        this.chromaticPass.enabled = false;
        this.composer.addPass(this.chromaticPass);
        
        // 11. Color Grading Pass
        this.colorGradingPass = new ShaderPass(ColorGradingShader);
        this.colorGradingPass.enabled = false;
        this.composer.addPass(this.colorGradingPass);
        
        // 12. Final copy pass
        this.copyPass = new ShaderPass(CopyShader);
        this.copyPass.renderToScreen = true;
        this.composer.addPass(this.copyPass);
        
        console.log('🎨 Advanced post-processing pipeline initialized with 10+ effects!');
    }

    // Enable/disable effects methods
    enableSSR(enabled = true) {
        this.effects.ssr = enabled;
        if (this.ssrPass) {
            this.ssrPass.enabled = enabled;
            console.log(`🌊 Screenspace Reflections ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    enableBloom(enabled = true) {
        this.effects.bloom = enabled;
        if (this.bloomPass) {
            this.bloomPass.enabled = enabled;
            console.log(`🌸 Bloom Effect ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    enableSSAO(enabled = true) {
        this.effects.ssao = enabled;
        if (this.ssaoPass) {
            this.ssaoPass.enabled = enabled;
            console.log(`🌫️ SSAO ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    enableGodRays(enabled = true) {
        this.effects.godRays = enabled;
        if (this.godRaysPass) {
            this.godRaysPass.enabled = enabled;
            console.log(`☀️ God Rays ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    enableMotionBlur(enabled = true) {
        this.effects.motionBlur = enabled;
        if (this.motionBlurPass) {
            this.motionBlurPass.enabled = enabled;
            console.log(`💨 Motion Blur ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    enableDOF(enabled = true) {
        this.effects.dof = enabled;
        if (this.dofPass) {
            this.dofPass.enabled = enabled;
            console.log(`🎯 Depth of Field ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    enableFilmGrain(enabled = true) {
        this.effects.filmGrain = enabled;
        if (this.filmPass) {
            this.filmPass.enabled = enabled;
            console.log(`📺 Film Grain ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    enableVignette(enabled = true) {
        this.effects.vignette = enabled;
        if (this.vignettePass) {
            this.vignettePass.enabled = enabled;
            console.log(`⚫ Vignette ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    enableChromaticAberration(enabled = true) {
        this.effects.chromaticAberration = enabled;
        if (this.chromaticPass) {
            this.chromaticPass.enabled = enabled;
            console.log(`🌈 Chromatic Aberration ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    enableColorGrading(enabled = true) {
        this.effects.colorGrading = enabled;
        if (this.colorGradingPass) {
            this.colorGradingPass.enabled = enabled;
            console.log(`🎨 Color Grading ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    enableParticleEffects(enabled = true) {
        this.effects.particleEffects = enabled;
        console.log(`✨ Particle Effects ${enabled ? 'enabled' : 'disabled'}`);
    }

    enableDynamicLighting(enabled = true) {
        this.effects.dynamicLighting = enabled;
        console.log(`💡 Dynamic Lighting ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Update effect settings methods
    updateSSRSettings(settings = {}) {
        if (!this.ssrPass) return;
        
        const { intensity = 0.5 } = settings;
        
        this.ssrPass.uniforms['intensity'].value = intensity;
        
        console.log('🌊 SSR settings updated:', { intensity });
    }

    updateBloomSettings(settings = {}) {
        if (!this.bloomPass) return;
        
        const { intensity = 30, threshold = 85, radius = 40 } = settings;
        
        this.bloomPass.strength = intensity / 100;
        this.bloomPass.threshold = threshold / 100;
        this.bloomPass.radius = radius / 100;
        
        console.log('🌸 Bloom settings updated:', settings);
    }

    updateSSAOSettings(settings = {}) {
        if (!this.ssaoPass) return;
        
        const { intensity = 50, radius = 20 } = settings;
        
        this.ssaoPass.kernelRadius = (radius / 100) * 32;
        this.ssaoPass.output = intensity > 0 ? 0 : 1; // 0 = Default, 1 = SSAO Only
        
        console.log('🌫️ SSAO settings updated:', settings);
    }

    updateGodRaysSettings(settings = {}) {
        if (!this.godRaysPass) return;
        
        const { intensity = 40, exposure = 25 } = settings;
        
        // Update shader uniforms with better scaling
        this.godRaysPass.uniforms['weight'].value = (intensity / 100) * 0.8;
        this.godRaysPass.uniforms['exposure'].value = (exposure / 100) * 0.6;
        this.godRaysPass.uniforms['decay'].value = 0.94 + (intensity / 1000); // Slight decay variation
        this.godRaysPass.uniforms['density'].value = 0.4 + (intensity / 200); // Density variation
        
        // Dynamically update light position based on time for more natural effect
        const time = Date.now() * 0.0005;
        const lightX = 0.7 + Math.sin(time) * 0.2;
        const lightY = 0.1 + Math.cos(time * 0.7) * 0.1;
        this.godRaysPass.uniforms['lightPosition'].value.set(lightX, lightY);
        
        console.log('☀️ God Rays settings updated:', settings, 'Light position:', lightX.toFixed(2), lightY.toFixed(2));
    }

    updateMotionBlurSettings(settings = {}) {
        if (!this.motionBlurPass) return;
        
        const { strength = 30 } = settings;
        
        this.motionBlurPass.uniforms['velocityFactor'].value = strength / 100;
        
        console.log('💨 Motion Blur settings updated:', settings);
    }

    updateDOFSettings(settings = {}) {
        if (!this.dofPass) return;
        
        const { focus = 50, blur = 20 } = settings;
        
        this.dofPass.uniforms['focus'].value = focus;
        this.dofPass.uniforms['maxblur'].value = blur / 1000;
        
        console.log('🎯 DOF settings updated:', settings);
    }

    updateFilmGrainSettings(settings = {}) {
        if (!this.filmPass) return;
        
        const { intensity = 15 } = settings;
        
        this.filmPass.uniforms['nIntensity'].value = intensity / 100;
        
        console.log('📺 Film Grain settings updated:', settings);
    }

    updateVignetteSettings(settings = {}) {
        if (!this.vignettePass) return;
        
        const { intensity = 25 } = settings;
        
        this.vignettePass.uniforms['intensity'].value = intensity / 100;
        
        console.log('⚫ Vignette settings updated:', settings);
    }

    updateChromaticSettings(settings = {}) {
        if (!this.chromaticPass) return;
        
        const { intensity = 10 } = settings;
        
        this.chromaticPass.uniforms['amount'].value = intensity / 1000;
        
        console.log('🌈 Chromatic Aberration settings updated:', settings);
    }

    updateColorGradingSettings(settings = {}) {
        if (!this.colorGradingPass) return;
        
        const { preset = 'cinematic' } = settings;
        
        const presetMap = {
            'cinematic': 0,
            'vibrant': 1,
            'warm': 2,
            'cool': 3,
            'noir': 4
        };
        
        this.colorGradingPass.uniforms['preset'].value = presetMap[preset] || 0;
        
        console.log('🎨 Color Grading settings updated:', settings);
    }

    updateParticleSettings(settings = {}) {
        const { quality = 'medium' } = settings;
        
        // Update particle system quality
        const qualityMap = {
            'low': 0.5,
            'medium': 1.0,
            'high': 1.5,
            'ultra': 2.0
        };
        
        this.particleQuality = qualityMap[quality] || 1.0;
        
        console.log('✨ Particle settings updated:', settings);
    }

    // Simplified G-buffer rendering (not needed for simplified SSR)
    renderGBuffer() {
        if (!this.camera || !this.effects.ssr) return;
        
        // Update SSR uniforms with current camera and resolution
        if (this.ssrPass) {
            const size = this.renderer.getSize(new THREE.Vector2());
            this.ssrPass.uniforms['resolution'].value = size;
        }
    }

    // Main render method
    render() {
        // Update dynamic effects each frame
        this.updateDynamicEffects();
        
        if (this.composer && this.hasAnyEffectEnabled()) {
            // Render G-buffer for SSR if needed
            if (this.effects.ssr) {
                this.renderGBuffer();
            }
            // Render with post-processing pipeline
            this.composer.render();
        } else {
            // Fallback to regular rendering
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Update dynamic effects each frame
    updateDynamicEffects() {
        // Update God Rays light position dynamically
        if (this.godRaysPass && this.effects.godRays) {
            const time = Date.now() * 0.0003;
            const lightX = 0.75 + Math.sin(time) * 0.15;
            const lightY = 0.15 + Math.cos(time * 0.6) * 0.1;
            this.godRaysPass.uniforms['lightPosition'].value.set(lightX, lightY);
        }
        
        // Update motion blur based on camera movement (if camera system available)
        if (this.motionBlurPass && this.effects.motionBlur && this.camera) {
            // Simple camera-based motion blur
            const velocity = new THREE.Vector2(0.005, 0.0);
            this.motionBlurPass.uniforms['velocity'] = this.motionBlurPass.uniforms['velocity'] || { value: velocity };
        }
        
        // Update color grading based on time (subtle day/night cycle effect)
        if (this.colorGradingPass && this.effects.colorGrading) {
            const time = Date.now() * 0.0001;
            const warmth = 0.5 + Math.sin(time) * 0.1;
            if (this.colorGradingPass.uniforms['temperature']) {
                this.colorGradingPass.uniforms['temperature'].value = warmth;
            }
        }
    }

    // Check if any post-processing effects are enabled
    hasAnyEffectEnabled() {
        return Object.values(this.effects).some(enabled => enabled === true);
    }

    // Handle window resize
    onWindowResize() {
        const size = this.renderer.getSize(new THREE.Vector2());
        
        if (this.composer) {
            this.composer.setSize(size.x, size.y);
        }
        
        // Update SSR uniforms
        if (this.ssrPass) {
            this.ssrPass.uniforms['resolution'].value = size;
        }
    }

    // Create enhanced material for different surface types
    createEnhancedMaterial(type, baseColor, options = {}) {
        const materialKey = `${type}_${baseColor.toString(16)}`;
        
        if (this.enhancedMaterials.has(materialKey)) {
            return this.enhancedMaterials.get(materialKey).clone();
        }
        
        let material;
        
        switch (type) {
            case 'metal':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.9,
                    roughness: 0.1,
                    envMapIntensity: 1.0,
                    ...options
                });
                break;
                
            case 'plastic':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.3,
                    envMapIntensity: 0.5,
                    ...options
                });
                break;
                
            case 'gem':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.0,
                    transparent: true,
                    opacity: 0.8,
                    envMapIntensity: 1.5,
                    ...options
                });
                break;
                
            case 'stone':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.8,
                    envMapIntensity: 0.3,
                    ...options
                });
                break;
                
            case 'glow':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    emissive: baseColor,
                    emissiveIntensity: 0.3,
                    metalness: 0.0,
                    roughness: 0.5,
                    ...options
                });
                break;
                
            case 'hologram':
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    transparent: true,
                    opacity: 0.6,
                    emissive: baseColor,
                    emissiveIntensity: 0.2,
                    metalness: 0.0,
                    roughness: 0.0,
                    ...options
                });
                break;
                
            default:
                material = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.0,
                    roughness: 0.5,
                    ...options
                });
        }
        
        this.enhancedMaterials.set(materialKey, material);
        return material.clone();
    }

    // Enhance existing meshes in the scene
    enhanceSceneMaterials(gameMode = 'normal') {
        try {
            this.scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    this.enhanceMeshMaterial(child, gameMode);
                }
            });
            
            console.log(`🎨 Enhanced materials for ${gameMode} mode`);
        } catch (error) {
            console.warn('Failed to enhance scene materials:', error);
        }
    }

    enhanceMeshMaterial(mesh, gameMode) {
        try {
            if (!mesh.material || !mesh.material.color) return;
            
            const baseColor = mesh.material.color.getHex();
            const meshName = mesh.name.toLowerCase();
            
            // Determine material type based on mesh name and game mode
            let materialType = 'plastic';
            
            if (meshName.includes('ground') || meshName.includes('platform') || meshName.includes('tile')) {
                materialType = 'stone';
            } else if (meshName.includes('metal') || meshName.includes('arena') || meshName.includes('obstacle')) {
                materialType = 'metal';
            } else if (meshName.includes('collectible') || meshName.includes('coin') || meshName.includes('pebble')) {
                materialType = 'gem';
            } else if (meshName.includes('glow') || meshName.includes('neon') || meshName.includes('light')) {
                materialType = 'glow';
            } else if (meshName.includes('ghost') || meshName.includes('hologram')) {
                materialType = 'hologram';
            } else if (meshName.includes('quicksand') || meshName.includes('sand')) {
                materialType = 'stone'; // Use stone material for sand/mud effects
            }
            
            // Special handling for different game modes
            if (gameMode === 'pacman') {
                if (meshName.includes('wall')) {
                    materialType = 'glow';
                } else if (meshName.includes('ground')) {
                    materialType = 'metal';
                }
            } else if (gameMode === 'battle') {
                if (meshName.includes('arena')) {
                    materialType = 'metal';
                } else if (meshName.includes('hazard')) {
                    materialType = 'glow';
                }
            }
            
            // Apply enhanced material (without shadow properties)
            const enhancedMaterial = this.createEnhancedMaterial(materialType, baseColor);
            
            mesh.material = enhancedMaterial;
            // Set shadow properties on the mesh, not the material
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        } catch (error) {
            console.warn(`Failed to enhance material for mesh ${mesh.name}:`, error);
        }
    }

    // Create particle effect for enhanced atmosphere
    createParticleEffect(type, position, options = {}) {
        const particleCount = options.count || 50;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const color = new THREE.Color(options.color || 0xffffff);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Position
            positions[i3] = position.x + (Math.random() - 0.5) * (options.spread || 10);
            positions[i3 + 1] = position.y + Math.random() * (options.height || 5);
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * (options.spread || 10);
            
            // Color
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // Size
            sizes[i] = options.size || 0.5;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: options.size || 0.5,
            transparent: true,
            opacity: options.opacity || 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particleSystem);
        
        this.particleSystems.push({
            system: particleSystem,
            type: type,
            startTime: Date.now(),
            duration: options.duration || 5000,
            velocity: options.velocity || new THREE.Vector3(0, 1, 0),
            spread: options.spread || 10
        });
        
        return particleSystem;
    }

    // Create environment cube map for reflections
    createEnvironmentMap(gameMode = 'normal') {
        try {
            // Create a simple color-based environment instead of problematic cube texture
            let envColor;
            
            switch (gameMode) {
                case 'pacman':
                    envColor = new THREE.Color(0x000033);
                    break;
                case 'battle':
                    envColor = new THREE.Color(0x87CEEB);
                    break;
                default:
                    envColor = new THREE.Color(0x87CEEB);
            }
            
            // Create a simple data texture for environment mapping
            const size = 64; // Smaller size for better performance
            const data = new Uint8Array(size * size * 3);
            
            for (let i = 0; i < data.length; i += 3) {
                data[i] = envColor.r * 255;     // Red
                data[i + 1] = envColor.g * 255; // Green
                data[i + 2] = envColor.b * 255; // Blue
            }
            
            const texture = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
            texture.needsUpdate = true;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            
            // Set as scene environment (this is safer than cube textures)
            this.scene.environment = texture;
            
            console.log(`🌍 Environment map created for ${gameMode} mode`);
        } catch (error) {
            console.warn('Failed to create environment map:', error);
            // Fallback: disable environment mapping
            this.scene.environment = null;
        }
    }

    // Update particle systems
    update(deltaTime) {
        const currentTime = Date.now();
        
        this.particleSystems.forEach((particleData, index) => {
            const elapsed = currentTime - particleData.startTime;
            const progress = elapsed / particleData.duration;
            
            if (progress >= 1.0) {
                // Remove expired particle system
                this.scene.remove(particleData.system);
                this.particleSystems.splice(index, 1);
                return;
            }
            
            // Update particle positions
            const positions = particleData.system.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += particleData.velocity.x * deltaTime;
                positions[i + 1] += particleData.velocity.y * deltaTime;
                positions[i + 2] += particleData.velocity.z * deltaTime;
            }
            
            particleData.system.geometry.attributes.position.needsUpdate = true;
            
            // Fade out particles
            particleData.system.material.opacity = (1.0 - progress) * 0.8;
        });
    }

    // Apply post-processing effects
    applyPostProcessing(composer) {
        // This method would be used with EffectComposer for advanced post-processing
        console.log('Post-processing effects applied');
    }

    // Graphics settings diagnostic method
    testAllGraphicsSettings() {
        console.log('🔧 Testing all graphics settings...');
        
        const testResults = {
            bloom: this.bloomPass && this.bloomPass.enabled,
            ssao: this.ssaoPass && this.ssaoPass.enabled,
            godRays: this.godRaysPass && this.godRaysPass.enabled,
            motionBlur: this.motionBlurPass && this.motionBlurPass.enabled,
            dof: this.dofPass && this.dofPass.enabled,
            filmGrain: this.filmPass && this.filmPass.enabled,
            vignette: this.vignettePass && this.vignettePass.enabled,
            chromaticAberration: this.chromaticPass && this.chromaticPass.enabled,
            colorGrading: this.colorGradingPass && this.colorGradingPass.enabled,
            ssr: this.ssrPass && this.ssrPass.enabled
        };
        
        console.log('📊 Graphics Settings Status:');
        Object.entries(testResults).forEach(([effect, enabled]) => {
            const status = enabled ? '✅ ENABLED' : '❌ DISABLED';
            const pass = this[effect + 'Pass'];
            const hasUniforms = pass && pass.uniforms ? Object.keys(pass.uniforms).length : 0;
            console.log(`  ${effect}: ${status} (${hasUniforms} uniforms)`);
        });
        
        return testResults;
    }

    // Cycle through effects for testing
    cycleEffectsTest() {
        const effects = ['bloom', 'ssao', 'godRays', 'motionBlur', 'dof', 'filmGrain', 'vignette', 'chromaticAberration', 'ssr'];
        let currentIndex = 0;
        
        const cycleFn = () => {
            // Disable all effects first
            effects.forEach(effect => {
                const methodName = `enable${effect.charAt(0).toUpperCase() + effect.slice(1)}`;
                if (this[methodName]) {
                    this[methodName](false);
                }
            });
            
            // Enable current effect
            const currentEffect = effects[currentIndex];
            const methodName = `enable${currentEffect.charAt(0).toUpperCase() + currentEffect.slice(1)}`;
            if (this[methodName]) {
                this[methodName](true);
                console.log(`🎯 Testing: ${currentEffect}`);
            }
            
            currentIndex = (currentIndex + 1) % effects.length;
        };
        
        console.log('🔄 Starting effects cycle test (every 3 seconds)');
        cycleFn();
        return setInterval(cycleFn, 3000);
    }

    // Clean up resources
    dispose() {
        this.particleSystems.forEach(particleData => {
            this.scene.remove(particleData.system);
            particleData.system.geometry.dispose();
            particleData.system.material.dispose();
        });
        
        this.enhancedMaterials.forEach(material => {
            material.dispose();
        });
        
        // Clean up post-processing resources
        if (this.composer) {
            this.composer.dispose();
        }
        
        this.particleSystems = [];
        this.enhancedMaterials.clear();
        this.renderTargets = {};
        
        console.log('🧹 Graphics enhancer resources disposed');
    }
} 