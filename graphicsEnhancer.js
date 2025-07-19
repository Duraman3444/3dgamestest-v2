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

// Screenspace Reflections Shader
const SSRShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'tDepth': { value: null },
        'tNormal': { value: null },
        'cameraNear': { value: 0.1 },
        'cameraFar': { value: 1000 },
        'resolution': { value: new THREE.Vector2() },
        'cameraProjectionMatrix': { value: new THREE.Matrix4() },
        'cameraInverseProjectionMatrix': { value: new THREE.Matrix4() },
        'intensity': { value: 0.5 },
        'maxDistance': { value: 30.0 },
        'thickness': { value: 0.5 },
        'maxRoughness': { value: 0.3 }
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,

    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform sampler2D tNormal;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform vec2 resolution;
        uniform mat4 cameraProjectionMatrix;
        uniform mat4 cameraInverseProjectionMatrix;
        uniform float intensity;
        uniform float maxDistance;
        uniform float thickness;
        uniform float maxRoughness;
        
        varying vec2 vUv;
        
        float getLinearDepth(float depth) {
            float z = depth * 2.0 - 1.0;
            return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
        }
        
        vec3 getWorldPosition(vec2 uv, float depth) {
            vec4 clipSpacePosition = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
            vec4 viewSpacePosition = cameraInverseProjectionMatrix * clipSpacePosition;
            viewSpacePosition /= viewSpacePosition.w;
            return viewSpacePosition.xyz;
        }
        
        vec3 hash(vec3 a) {
            a = fract(a * 0.1031);
            a += dot(a, a.yzx + 33.33);
            return fract((a.xxy + a.yxx) * a.zyx);
        }
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            vec4 normalRoughness = texture2D(tNormal, vUv);
            vec3 normal = normalize(normalRoughness.xyz * 2.0 - 1.0);
            float roughness = normalRoughness.a;
            
            // Skip SSR for rough surfaces
            if (roughness > maxRoughness) {
                gl_FragColor = color;
                return;
            }
            
            float depth = texture2D(tDepth, vUv).x;
            if (depth >= 1.0) {
                gl_FragColor = color;
                return;
            }
            
            vec3 worldPos = getWorldPosition(vUv, depth);
            vec3 viewDir = normalize(worldPos);
            vec3 reflectDir = reflect(viewDir, normal);
            
            // Ray marching parameters
            vec3 rayStart = worldPos;
            vec3 rayDir = reflectDir;
            float stepSize = maxDistance / 64.0;
            
            vec3 rayPos = rayStart;
            vec4 reflectionColor = vec4(0.0);
            
            // Ray marching
            for (int i = 0; i < 64; i++) {
                rayPos += rayDir * stepSize;
                
                // Project to screen space
                vec4 screenPos = cameraProjectionMatrix * vec4(rayPos, 1.0);
                screenPos.xyz /= screenPos.w;
                vec2 screenUV = screenPos.xy * 0.5 + 0.5;
                
                // Check if we're outside screen bounds
                if (screenUV.x < 0.0 || screenUV.x > 1.0 || screenUV.y < 0.0 || screenUV.y > 1.0) break;
                
                float sampledDepth = texture2D(tDepth, screenUV).x;
                vec3 sampledPos = getWorldPosition(screenUV, sampledDepth);
                
                // Check if ray intersects with surface
                float depthDiff = sampledPos.z - rayPos.z;
                if (depthDiff > 0.0 && depthDiff < thickness) {
                    float fadeOut = 1.0 - smoothstep(0.8, 1.0, float(i) / 64.0);
                    fadeOut *= 1.0 - smoothstep(0.8, 1.0, distance(screenUV, vec2(0.5)));
                    
                    reflectionColor = texture2D(tDiffuse, screenUV);
                    reflectionColor.a = fadeOut * intensity * (1.0 - roughness);
                    break;
                }
            }
            
            // Mix original color with reflection
            gl_FragColor = mix(color, reflectionColor, reflectionColor.a);
        }`
};

// God Rays Shader
const GodRaysShader = {
    uniforms: {
        tDiffuse: { value: null },
        lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
        exposure: { value: 0.58 },
        decay: { value: 0.93 },
        density: { value: 0.84 },
        weight: { value: 0.4 },
        samples: { value: 50 }
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
            vec2 lightDir = texCoord - lightPosition;
            vec2 deltaTexCoord = (texCoord - lightPosition) / float(samples) * density;
            
            vec3 color = texture2D(tDiffuse, texCoord).rgb;
            float illuminationDecay = 1.0;
            
            for(int i = 0; i < 50; i++) {
                if(i >= samples) break;
                texCoord -= deltaTexCoord;
                vec3 sample = texture2D(tDiffuse, texCoord).rgb;
                sample *= illuminationDecay * weight;
                color += sample;
                illuminationDecay *= decay;
            }
            
            gl_FragColor = vec4(color * exposure, 1.0);
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
        
        // Create render targets for G-buffer
        this.renderTargets.color = new THREE.WebGLRenderTarget(size.x, size.y, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });

        this.renderTargets.depth = new THREE.WebGLRenderTarget(size.x, size.y, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.DepthFormat,
            type: THREE.FloatType
        });

        this.renderTargets.normal = new THREE.WebGLRenderTarget(size.x, size.y, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });

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
        this.ssrPass.uniforms['cameraNear'].value = this.camera.near;
        this.ssrPass.uniforms['cameraFar'].value = this.camera.far;
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
        
        const { intensity = 0.5, maxDistance = 30.0, thickness = 0.5, maxRoughness = 0.3 } = settings;
        
        this.ssrPass.uniforms['intensity'].value = intensity;
        this.ssrPass.uniforms['maxDistance'].value = maxDistance;
        this.ssrPass.uniforms['thickness'].value = thickness;
        this.ssrPass.uniforms['maxRoughness'].value = maxRoughness;
        
        console.log('🌊 SSR settings updated:', settings);
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
        
        this.godRaysPass.uniforms['weight'].value = intensity / 100;
        this.godRaysPass.uniforms['exposure'].value = exposure / 100;
        
        console.log('☀️ God Rays settings updated:', settings);
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

    // Render G-buffer for SSR
    renderGBuffer() {
        if (!this.camera || !this.ssrEnabled) return;

        const originalRenderTarget = this.renderer.getRenderTarget();
        
        // Render depth
        this.renderer.setRenderTarget(this.renderTargets.depth);
        this.renderer.render(this.scene, this.camera);
        
        // Render normals (this is simplified - in a real implementation you'd need a normal pass)
        this.renderer.setRenderTarget(this.renderTargets.normal);
        this.scene.traverse((obj) => {
            if (obj.material && obj.material.normalMap) {
                obj.material.needsUpdate = true;
            }
        });
        this.renderer.render(this.scene, this.camera);
        
        // Render color
        this.renderer.setRenderTarget(this.renderTargets.color);
        this.renderer.render(this.scene, this.camera);
        
        // Restore original render target
        this.renderer.setRenderTarget(originalRenderTarget);
        
        // Update SSR uniforms
        if (this.ssrPass) {
            this.ssrPass.uniforms['tDepth'].value = this.renderTargets.depth.texture;
            this.ssrPass.uniforms['tNormal'].value = this.renderTargets.normal.texture;
            this.ssrPass.uniforms['cameraProjectionMatrix'].value = this.camera.projectionMatrix;
            this.ssrPass.uniforms['cameraInverseProjectionMatrix'].value = this.camera.projectionMatrixInverse;
        }
    }

    // Main render method
    render() {
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
        
        // Update render targets
        if (this.renderTargets.color) {
            this.renderTargets.color.setSize(size.x, size.y);
            this.renderTargets.depth.setSize(size.x, size.y);
            this.renderTargets.normal.setSize(size.x, size.y);
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
        
        // Clean up render targets
        Object.values(this.renderTargets).forEach(target => {
            if (target && target.dispose) {
                target.dispose();
            }
        });
        
        this.particleSystems = [];
        this.enhancedMaterials.clear();
        this.renderTargets = {};
        
        console.log('🧹 Graphics enhancer resources disposed');
    }
} 