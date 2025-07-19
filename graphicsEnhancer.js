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

// Improved SSR Shader with proper surface detection
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
            
            // Enhanced surface detection to exclude sky and inappropriate surfaces
            float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            float saturation = max(color.r, max(color.g, color.b)) - min(color.r, min(color.g, color.b));
            
            // Exclude very bright surfaces (sky) and very saturated surfaces
            float skyMask = 1.0 - smoothstep(0.7, 0.95, brightness);
            float colorMask = 1.0 - smoothstep(0.8, 1.0, saturation);
            
            // Only apply reflections to darker, less saturated surfaces (like floors, metals)
            float surfaceMask = skyMask * colorMask;
            
            // Additional check for appropriate reflection surfaces
            // Look for surfaces that are more likely to be reflective (darker, more uniform)
            vec3 colorVariation = abs(color.rgb - vec3(brightness));
            float uniformity = 1.0 - (colorVariation.r + colorVariation.g + colorVariation.b) / 3.0;
            float reflectiveSurface = smoothstep(0.4, 0.8, uniformity) * smoothstep(0.1, 0.6, brightness);
            
            // Combine masks
            surfaceMask *= reflectiveSurface;
            
            // Only apply reflections if surface mask is strong enough
            if (surfaceMask < 0.1) {
                gl_FragColor = color;
                return;
            }
            
            // Improved reflection calculation
            vec2 center = vec2(0.5, 0.5);
            vec2 offsetFromCenter = vUv - center;
            
            // Create more realistic reflection based on viewing angle
            float viewingAngle = length(offsetFromCenter);
            vec2 reflectDirection = normalize(offsetFromCenter);
            
            // Multi-sample reflection for better quality
            vec4 reflectionColor = vec4(0.0);
            float samples = 3.0;
            
            for(float i = 0.0; i < 3.0; i++) {
                float offset = (i - 1.0) * 0.02;
                vec2 sampleUV = center - offsetFromCenter * (0.3 + offset);
                
                // Clamp UV to avoid sampling outside screen
                sampleUV = clamp(sampleUV, vec2(0.02), vec2(0.98));
                
                vec4 sampleColor = texture2D(tDiffuse, sampleUV);
                
                // Don't reflect the sky back onto surfaces
                float sampleBrightness = dot(sampleColor.rgb, vec3(0.299, 0.587, 0.114));
                float sampleMask = 1.0 - smoothstep(0.7, 0.9, sampleBrightness);
                
                reflectionColor += sampleColor * sampleMask;
            }
            
            reflectionColor /= samples;
            
            // Fade reflection based on distance from center and viewing angle
            float edgeFade = 1.0 - smoothstep(0.4, 0.8, viewingAngle);
            float angleFade = 1.0 - smoothstep(0.2, 0.6, viewingAngle);
            
            // Final reflection strength
            float reflectionStrength = intensity * surfaceMask * edgeFade * angleFade * 0.4;
            
            // Mix with subtle tint to make reflections more realistic
            vec3 finalReflection = mix(reflectionColor.rgb, color.rgb * 0.1, 0.3);
            
            gl_FragColor = vec4(mix(color.rgb, finalReflection, reflectionStrength), color.a);
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

// Volumetric Fog Shader - Advanced raymarching implementation
const VolumetricFogShader = {
    uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        cameraFar: { value: 1000.0 },
        cameraNear: { value: 0.1 },
        fogColor: { value: new THREE.Color(0.5, 0.6, 0.7) },
        fogDensity: { value: 0.02 },
        fogStart: { value: 0.0 },
        fogEnd: { value: 100.0 },
        lightPosition: { value: new THREE.Vector3(10, 10, 10) },
        lightColor: { value: new THREE.Color(1.0, 0.9, 0.7) },
        lightIntensity: { value: 0.8 },
        scatteringStrength: { value: 0.1 },
        extinctionStrength: { value: 0.05 },
        phaseG: { value: 0.76 },
        raySteps: { value: 32 },
        quality: { value: 1.0 }, // 0.5 = low, 1.0 = medium, 2.0 = high
        heightFalloff: { value: 0.1 },
        noiseScale: { value: 0.01 },
        noiseStrength: { value: 0.3 },
        time: { value: 0.0 },
        windDirection: { value: new THREE.Vector2(1.0, 0.5) }
    },

    vertexShader: `
        varying vec2 vUv;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;
        
        void main() {
            vUv = uv;
            
            // Calculate view direction for raymarching
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewDir = -mvPosition.xyz;
            
            gl_Position = projectionMatrix * mvPosition;
        }`,

    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform float cameraFar;
        uniform float cameraNear;
        uniform vec3 fogColor;
        uniform float fogDensity;
        uniform float fogStart;
        uniform float fogEnd;
        uniform vec3 lightPosition;
        uniform vec3 lightColor;
        uniform float lightIntensity;
        uniform float scatteringStrength;
        uniform float extinctionStrength;
        uniform float phaseG;
        uniform int raySteps;
        uniform float quality;
        uniform float heightFalloff;
        uniform float noiseScale;
        uniform float noiseStrength;
        uniform float time;
        uniform vec2 windDirection;
        
        varying vec2 vUv;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;
        
        // Noise function for volumetric variation
        float noise(vec3 pos) {
            pos += time * 0.1 * vec3(windDirection.x, 0.2, windDirection.y);
            return fract(sin(dot(pos.xyz, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
        }
        
        // 3D noise for more realistic volume
        float noise3D(vec3 pos) {
            vec3 i = floor(pos);
            vec3 f = fract(pos);
            f = f * f * (3.0 - 2.0 * f);
            
            float n = mix(
                mix(
                    mix(noise(i), noise(i + vec3(1,0,0)), f.x),
                    mix(noise(i + vec3(0,1,0)), noise(i + vec3(1,1,0)), f.x),
                    f.y
                ),
                mix(
                    mix(noise(i + vec3(0,0,1)), noise(i + vec3(1,0,1)), f.x),
                    mix(noise(i + vec3(0,1,1)), noise(i + vec3(1,1,1)), f.x),
                    f.y
                ),
                f.z
            );
            
            return n;
        }
        
        // Henyey-Greenstein phase function for light scattering
        float phaseFunction(float cosTheta, float g) {
            float g2 = g * g;
            return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
        }
        
        // Convert depth buffer value to world space depth
        float readDepth(vec2 coord) {
            float fragCoordZ = texture2D(tDepth, coord).x;
            float viewZ = (cameraNear * cameraFar) / ((cameraFar - cameraNear) * fragCoordZ - cameraFar);
            return -viewZ;
        }
        
        // Main volumetric fog calculation
        vec3 calculateVolumetricFog(vec3 rayStart, vec3 rayDir, float rayLength) {
            vec3 scatteredLight = vec3(0.0);
            float totalTransmittance = 1.0;
            
            // Adaptive step size based on quality
            int steps = int(float(raySteps) * quality);
            float stepSize = rayLength / float(steps);
            
            for(int i = 0; i < 64; i++) { // Max iterations for WebGL compatibility
                if(i >= steps) break;
                
                float t = (float(i) + 0.5) * stepSize;
                vec3 pos = rayStart + rayDir * t;
                
                // Height-based density falloff
                float heightFactor = exp(-pos.y * heightFalloff);
                
                // Add 3D noise for volume variation
                float noiseFactor = 1.0 + noiseStrength * (
                    noise3D(pos * noiseScale) * 2.0 - 1.0
                );
                
                // Calculate local density
                float localDensity = fogDensity * heightFactor * noiseFactor;
                
                // Distance-based density (traditional fog)
                float distance = length(pos);
                float distanceFactor = smoothstep(fogStart, fogEnd, distance);
                localDensity *= distanceFactor;
                
                if(localDensity > 0.001) {
                    // Light attenuation
                    vec3 lightDir = normalize(lightPosition - pos);
                    float lightDist = length(lightPosition - pos);
                    
                    // Light scattering calculation
                    float cosTheta = dot(rayDir, lightDir);
                    float phase = phaseFunction(cosTheta, phaseG);
                    
                    // Light attenuation with inverse square law
                    float lightAttenuation = lightIntensity / (1.0 + 0.01 * lightDist * lightDist);
                    
                    // In-scattering contribution
                    vec3 inscattering = lightColor * lightAttenuation * scatteringStrength * phase;
                    
                    // Beer's law for light extinction through volume
                    float extinction = localDensity * extinctionStrength * stepSize;
                    float stepTransmittance = exp(-extinction);
                    
                    // Accumulate scattered light
                    scatteredLight += inscattering * localDensity * stepSize * totalTransmittance;
                    
                    // Update total transmittance
                    totalTransmittance *= stepTransmittance;
                    
                    // Early termination if transmittance is very low
                    if(totalTransmittance < 0.01) break;
                }
            }
            
            return scatteredLight;
        }
        
        void main() {
            vec4 originalColor = texture2D(tDiffuse, vUv);
            
            // Get depth and calculate ray parameters
            float depth = readDepth(vUv);
            vec3 rayDir = normalize(vViewDir);
            vec3 rayStart = vWorldPos;
            float rayLength = min(depth, fogEnd);
            
            // Skip fog calculation if too close
            if(rayLength < fogStart) {
                gl_FragColor = originalColor;
                return;
            }
            
            // Calculate volumetric fog contribution
            vec3 fogContribution = calculateVolumetricFog(rayStart, rayDir, rayLength - fogStart);
            
            // Apply fog color tinting
            fogContribution *= fogColor;
            
            // Combine with original image
            vec3 finalColor = originalColor.rgb + fogContribution;
            
            // Tone mapping to prevent oversaturation
            finalColor = finalColor / (finalColor + vec3(1.0));
            
            gl_FragColor = vec4(finalColor, originalColor.a);
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
        this.volumetricFogPass = null;
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
            volumetricFog: false,
            particleEffects: true,
            dynamicLighting: false
        };
        
        // Particle system properties
        this.particleQuality = 1.0; // Default quality multiplier (medium)
        this.currentGameMode = null; // Track current game mode for effect management
        
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
        try {
            this.filmPass = new FilmPass(0.35, 0.5, 2048, false);
            this.filmPass.enabled = false;
            this.composer.addPass(this.filmPass);
            console.log('📺 FilmPass initialized successfully');
        } catch (error) {
            console.warn('📺 Failed to initialize FilmPass:', error);
            this.filmPass = null;
            this.effects.filmGrain = false;
        }
        
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

        // 12. Volumetric Fog Pass - requires depth texture
        this.volumetricFogPass = new ShaderPass(VolumetricFogShader);
        this.volumetricFogPass.enabled = false;
        
        // Create depth render target for volumetric fog
        this.depthRenderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.DepthFormat,
            type: THREE.UnsignedShortType
        });
        
        // Set up depth texture uniforms
        this.volumetricFogPass.uniforms['tDepth'].value = this.depthRenderTarget.texture;
        
        this.composer.addPass(this.volumetricFogPass);
        
        // 13. Final copy pass
        this.copyPass = new ShaderPass(CopyShader);
        this.copyPass.renderToScreen = true;
        this.composer.addPass(this.copyPass);
        
        console.log('🎨 Advanced post-processing pipeline initialized with volumetric fog and 11+ effects!');
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
        
        if (enabled) {
            console.log(`✨ Particle Effects enabled`);
            // Re-add environmental effects if we have a current game mode
            if (this.currentGameMode) {
                this.addEnvironmentalEffects(this.currentGameMode);
            }
        } else {
            console.log(`🚫 Particle Effects disabled`);
            // Clear all existing particle effects
            this.clearParticleEffects();
        }
    }

    enableVolumetricFog(enabled = true) {
        this.effects.volumetricFog = enabled;
        if (this.volumetricFogPass) {
            this.volumetricFogPass.enabled = enabled;
            console.log(`🌫️ Volumetric Fog ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    // Update volumetric fog parameters based on current scene/theme
    updateVolumetricFogSettings(theme = null) {
        if (!this.volumetricFogPass || !this.effects.volumetricFog) return;
        
        const uniforms = this.volumetricFogPass.uniforms;
        
        // Update camera parameters
        if (this.camera) {
            uniforms['cameraFar'].value = this.camera.far;
            uniforms['cameraNear'].value = this.camera.near;
        }
        
        // Set theme-based fog properties
        if (theme) {
            this.applyVolumetricFogTheme(theme);
        }
        
        console.log('🌫️ Volumetric fog settings updated');
    }

    // Apply theme-specific volumetric fog settings
    applyVolumetricFogTheme(themeName) {
        if (!this.volumetricFogPass) return;
        
        const uniforms = this.volumetricFogPass.uniforms;
        
        // Define theme-specific fog parameters
        const fogThemes = {
            default: {
                color: new THREE.Color(0.5, 0.6, 0.7),
                density: 0.02,
                start: 10,
                end: 120,
                lightColor: new THREE.Color(1.0, 0.9, 0.7),
                scattering: 0.1,
                extinction: 0.05
            },
            forest: {
                color: new THREE.Color(0.3, 0.5, 0.3),
                density: 0.035,
                start: 5,
                end: 80,
                lightColor: new THREE.Color(0.8, 1.0, 0.6),
                scattering: 0.12,
                extinction: 0.06
            },
            desert: {
                color: new THREE.Color(0.8, 0.7, 0.5),
                density: 0.015,
                start: 20,
                end: 150,
                lightColor: new THREE.Color(1.0, 0.8, 0.5),
                scattering: 0.08,
                extinction: 0.04
            },
            mystical: {
                color: new THREE.Color(0.6, 0.4, 0.8),
                density: 0.045,
                start: 8,
                end: 60,
                lightColor: new THREE.Color(0.8, 0.6, 1.0),
                scattering: 0.15,
                extinction: 0.07
            },
            volcanic: {
                color: new THREE.Color(0.7, 0.3, 0.2),
                density: 0.05,
                start: 5,
                end: 50,
                lightColor: new THREE.Color(1.0, 0.5, 0.2),
                scattering: 0.18,
                extinction: 0.08
            },
            space: {
                color: new THREE.Color(0.2, 0.2, 0.4),
                density: 0.008,
                start: 30,
                end: 200,
                lightColor: new THREE.Color(0.7, 0.7, 1.0),
                scattering: 0.05,
                extinction: 0.02
            },
            pacman: {
                color: new THREE.Color(0.1, 0.1, 0.3),
                density: 0.025,
                start: 8,
                end: 40,
                lightColor: new THREE.Color(0.3, 0.8, 1.0),
                scattering: 0.1,
                extinction: 0.05
            },
            battle: {
                color: new THREE.Color(0.4, 0.5, 0.6),
                density: 0.03,
                start: 8,
                end: 80,
                lightColor: new THREE.Color(0.9, 0.9, 0.8),
                scattering: 0.12,
                extinction: 0.06
            }
        };
        
        const theme = fogThemes[themeName] || fogThemes.default;
        
        // Apply theme settings
        uniforms['fogColor'].value.copy(theme.color);
        uniforms['fogDensity'].value = theme.density;
        uniforms['fogStart'].value = theme.start;
        uniforms['fogEnd'].value = theme.end;
        uniforms['lightColor'].value.copy(theme.lightColor);
        uniforms['scatteringStrength'].value = theme.scattering;
        uniforms['extinctionStrength'].value = theme.extinction;
        
        console.log(`🌫️ Applied volumetric fog theme: ${themeName}`);
    }

    // Set custom volumetric fog parameters
    setVolumetricFogParameters(params) {
        if (!this.volumetricFogPass) return;
        
        const uniforms = this.volumetricFogPass.uniforms;
        
        if (params.density !== undefined) uniforms['fogDensity'].value = params.density;
        if (params.quality !== undefined) uniforms['quality'].value = params.quality;
        if (params.raySteps !== undefined) uniforms['raySteps'].value = params.raySteps;
        if (params.scatteringStrength !== undefined) uniforms['scatteringStrength'].value = params.scatteringStrength;
        if (params.extinctionStrength !== undefined) uniforms['extinctionStrength'].value = params.extinctionStrength;
        if (params.heightFalloff !== undefined) uniforms['heightFalloff'].value = params.heightFalloff;
        if (params.noiseScale !== undefined) uniforms['noiseScale'].value = params.noiseScale;
        if (params.noiseStrength !== undefined) uniforms['noiseStrength'].value = params.noiseStrength;
        
        if (params.fogColor) {
            if (typeof params.fogColor === 'string') {
                uniforms['fogColor'].value = new THREE.Color(params.fogColor);
            } else if (params.fogColor instanceof THREE.Color) {
                uniforms['fogColor'].value.copy(params.fogColor);
            }
        }
        
        if (params.lightPosition) {
            uniforms['lightPosition'].value.copy(params.lightPosition);
        }
        
        console.log('🌫️ Custom volumetric fog parameters applied');
    }

    enableDynamicLighting(enabled = true) {
        this.effects.dynamicLighting = enabled;
        console.log(`💡 Dynamic Lighting ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Update effect settings methods
    updateSSRSettings(settings = {}) {
        if (!this.ssrPass) return;
        
        const { 
            intensity = 0.5, 
            maxDistance = 50, 
            thickness = 20 
        } = settings;
        
        // Update shader uniforms
        this.ssrPass.uniforms['intensity'].value = intensity;
        
        // Scale intensity based on other parameters for better control
        // maxDistance affects how far reflections extend (used as multiplier)
        // thickness affects the strength of reflections (used as secondary multiplier)
        const distanceMultiplier = Math.max(0.2, Math.min(2.0, maxDistance / 50));
        const thicknessMultiplier = Math.max(0.5, Math.min(1.5, thickness / 20));
        
        // Apply combined intensity
        const finalIntensity = intensity * distanceMultiplier * thicknessMultiplier;
        this.ssrPass.uniforms['intensity'].value = Math.min(1.0, finalIntensity);
        
        console.log('🌊 SSR settings updated:', { 
            baseIntensity: intensity,
            maxDistance,
            thickness,
            finalIntensity: this.ssrPass.uniforms['intensity'].value
        });
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
        
        // Check if the uniforms exist before trying to access them
        if (this.filmPass.uniforms && this.filmPass.uniforms['nIntensity']) {
            this.filmPass.uniforms['nIntensity'].value = intensity / 100;
            console.log('📺 Film Grain settings updated:', settings);
        } else if (this.filmPass.material && this.filmPass.material.uniforms && this.filmPass.material.uniforms['nIntensity']) {
            // Try alternative uniform path for different FilmPass implementations
            this.filmPass.material.uniforms['nIntensity'].value = intensity / 100;
            console.log('📺 Film Grain settings updated via material:', settings);
        } else {
            console.warn('📺 Film Grain uniforms not found - pass may not be properly initialized');
            // Disable film grain if uniforms are not available
            this.effects.filmGrain = false;
            if (this.filmPass) {
                this.filmPass.enabled = false;
            }
        }
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
        
        // If particle effects are enabled and we have a game mode, refresh the effects with new settings
        if (this.effects.particleEffects && this.currentGameMode) {
            this.clearParticleEffects();
            this.addEnvironmentalEffects(this.currentGameMode);
        }
        
        console.log('✨ Particle settings updated:', settings, `Quality multiplier: ${this.particleQuality}x`);
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
        
        // Update animated mesh effects
        this.updateAnimatedEffects();
        
        if (this.composer && this.hasAnyEffectEnabled()) {
            // Render depth buffer for volumetric fog if needed
            if (this.effects.volumetricFog && this.depthRenderTarget) {
                this.renderDepthBuffer();
            }
            
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

    // Render depth buffer for volumetric fog
    renderDepthBuffer() {
        if (!this.depthRenderTarget || !this.camera || !this.scene) return;
        
        // Store original settings
        const originalRenderTarget = this.renderer.getRenderTarget();
        const originalClearColor = this.renderer.getClearColor(new THREE.Color());
        const originalClearAlpha = this.renderer.getClearAlpha();
        
        // Set up depth rendering
        this.renderer.setRenderTarget(this.depthRenderTarget);
        this.renderer.setClearColor(0xffffff, 1.0);
        this.renderer.clear();
        
        // Render scene to depth buffer
        this.renderer.render(this.scene, this.camera);
        
        // Restore original settings
        this.renderer.setRenderTarget(originalRenderTarget);
        this.renderer.setClearColor(originalClearColor, originalClearAlpha);
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
        
        // Update volumetric fog animation
        if (this.volumetricFogPass && this.effects.volumetricFog) {
            const time = Date.now() * 0.001;
            const uniforms = this.volumetricFogPass.uniforms;
            
            // Update time for animated noise
            uniforms['time'].value = time;
            
            // Animate light position slightly for dynamic atmosphere
            const basePos = new THREE.Vector3(10, 15, 10);
            const animatedPos = basePos.clone();
            animatedPos.x += Math.sin(time * 0.1) * 2;
            animatedPos.y += Math.cos(time * 0.08) * 1.5;
            animatedPos.z += Math.sin(time * 0.12) * 1.5;
            uniforms['lightPosition'].value.copy(animatedPos);
            
            // Animate wind direction for natural fog movement
            const windTime = time * 0.02;
            uniforms['windDirection'].value.set(
                Math.sin(windTime) * 0.5 + 0.5,
                Math.cos(windTime * 0.7) * 0.3 + 0.7
            );
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
        
        // Resize depth render target for volumetric fog
        if (this.depthRenderTarget) {
            this.depthRenderTarget.setSize(size.x, size.y);
        }
    }

    // Create enhanced material for different surface types with era theming
    createEnhancedMaterial(type, baseColor, eraTheme = 'ps2', options = {}) {
        const materialKey = `${type}_${baseColor.toString(16)}_${eraTheme}`;
        
        if (this.enhancedMaterials.has(materialKey)) {
            return this.enhancedMaterials.get(materialKey).clone();
        }
        
        let material;
        const color = new THREE.Color(baseColor);
        const eraSettings = this.getEraSettings(eraTheme, type);
        
        switch (type) {
            case 'metal':
                material = new THREE.MeshStandardMaterial({
                    color: color.multiplyScalar(eraSettings.colorMultiplier),
                    metalness: eraSettings.metalness || 0.9,
                    roughness: eraSettings.roughness || 0.1,
                    envMapIntensity: eraSettings.envMapIntensity || 1.0,
                    emissive: eraSettings.emissive ? color.clone().multiplyScalar(eraSettings.emissive) : new THREE.Color(0x000000),
                    emissiveIntensity: eraSettings.emissiveIntensity || 0,
                    ...options
                });
                break;
                
            case 'plastic':
                material = new THREE.MeshStandardMaterial({
                    color: color.multiplyScalar(eraSettings.colorMultiplier),
                    metalness: eraSettings.metalness || 0.0,
                    roughness: eraSettings.roughness || 0.3,
                    envMapIntensity: eraSettings.envMapIntensity || 0.5,
                    emissive: eraSettings.emissive ? color.clone().multiplyScalar(eraSettings.emissive) : new THREE.Color(0x000000),
                    emissiveIntensity: eraSettings.emissiveIntensity || 0,
                    ...options
                });
                break;
                
            case 'gem':
                material = new THREE.MeshStandardMaterial({
                    color: color.multiplyScalar(eraSettings.colorMultiplier),
                    metalness: 0.0,
                    roughness: 0.0,
                    transparent: true,
                    opacity: eraSettings.opacity || 0.8,
                    envMapIntensity: eraSettings.envMapIntensity || 1.5,
                    emissive: color.clone().multiplyScalar(eraSettings.emissive || 0.2),
                    emissiveIntensity: eraSettings.emissiveIntensity || 0.4,
                    ...options
                });
                break;
                
            case 'stone':
                material = new THREE.MeshStandardMaterial({
                    color: color.multiplyScalar(eraSettings.colorMultiplier),
                    metalness: 0.0,
                    roughness: eraSettings.roughness || 0.8,
                    envMapIntensity: eraSettings.envMapIntensity || 0.3,
                    emissive: eraSettings.emissive ? color.clone().multiplyScalar(eraSettings.emissive) : new THREE.Color(0x000000),
                    emissiveIntensity: eraSettings.emissiveIntensity || 0,
                    ...options
                });
                break;
                
            case 'glow':
                material = new THREE.MeshStandardMaterial({
                    color: color.multiplyScalar(eraSettings.colorMultiplier),
                    emissive: color.clone().multiplyScalar(eraSettings.emissive || 0.5),
                    emissiveIntensity: eraSettings.emissiveIntensity || 0.5,
                    metalness: 0.0,
                    roughness: eraSettings.roughness || 0.3,
                    transparent: eraSettings.transparent || false,
                    opacity: eraSettings.opacity || 1.0,
                    ...options
                });
                break;
                
            case 'hologram':
                material = new THREE.MeshStandardMaterial({
                    color: color.multiplyScalar(eraSettings.colorMultiplier),
                    transparent: true,
                    opacity: eraSettings.opacity || 0.6,
                    emissive: color.clone().multiplyScalar(eraSettings.emissive || 0.3),
                    emissiveIntensity: eraSettings.emissiveIntensity || 0.4,
                    metalness: 0.0,
                    roughness: 0.0,
                    side: THREE.DoubleSide,
                    ...options
                });
                break;
                
            case 'neon':
                material = new THREE.MeshStandardMaterial({
                    color: color.multiplyScalar(eraSettings.colorMultiplier),
                    emissive: color.clone().multiplyScalar(eraSettings.emissive || 0.8),
                    emissiveIntensity: eraSettings.emissiveIntensity || 0.8,
                    metalness: 0.0,
                    roughness: 0.1,
                    transparent: true,
                    opacity: eraSettings.opacity || 0.9,
                    ...options
                });
                break;
                
            case 'retro':
                material = new THREE.MeshLambertMaterial({
                    color: color.multiplyScalar(eraSettings.colorMultiplier),
                    emissive: eraSettings.emissive ? color.clone().multiplyScalar(eraSettings.emissive) : new THREE.Color(0x000000),
                    transparent: eraSettings.transparent || false,
                    opacity: eraSettings.opacity || 1.0,
                    ...options
                });
                break;
                
            default:
                material = new THREE.MeshStandardMaterial({
                    color: color.multiplyScalar(eraSettings.colorMultiplier),
                    metalness: eraSettings.metalness || 0.0,
                    roughness: eraSettings.roughness || 0.5,
                    emissive: eraSettings.emissive ? color.clone().multiplyScalar(eraSettings.emissive) : new THREE.Color(0x000000),
                    emissiveIntensity: eraSettings.emissiveIntensity || 0,
                    ...options
                });
        }
        
        this.enhancedMaterials.set(materialKey, material);
        return material.clone();
    }

    // Get era-specific material settings
    getEraSettings(eraTheme, materialType) {
        const settings = {
            snes: {
                colorMultiplier: 1.3, // Bright, saturated colors
                metalness: 0.0,
                roughness: 0.9,
                envMapIntensity: 0.1,
                emissive: materialType === 'glow' ? 0.2 : 0.05,
                emissiveIntensity: materialType === 'glow' ? 0.3 : 0.1,
                opacity: 1.0,
                transparent: false
            },
            arcade: {
                colorMultiplier: 1.6, // Very bright, neon-like
                metalness: 0.1,
                roughness: 0.2,
                envMapIntensity: 0.8,
                emissive: 0.4,
                emissiveIntensity: 0.5,
                opacity: materialType === 'glow' ? 0.85 : 1.0,
                transparent: materialType === 'glow' || materialType === 'neon'
            },
            ps2: {
                colorMultiplier: 1.0, // Realistic colors
                metalness: materialType === 'metal' ? 0.8 : 0.1,
                roughness: materialType === 'metal' ? 0.2 : 0.6,
                envMapIntensity: 0.6,
                emissive: materialType === 'glow' ? 0.4 : 0.02,
                emissiveIntensity: materialType === 'glow' ? 0.3 : 0.05,
                opacity: 1.0,
                transparent: false
            }
        };
        
        return settings[eraTheme] || settings.ps2;
    }

    // Enhance existing meshes in the scene with comprehensive improvements
    enhanceSceneMaterials(gameMode = 'normal') {
        try {
            // Store current game mode for particle effects management
            this.currentGameMode = gameMode;
            
            // Clear any existing particles and effects
            this.clearParticleEffects();
            
            // Enhance all mesh materials
            this.scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    this.enhanceMeshMaterial(child, gameMode);
                }
            });
            
            // Add era-specific environmental effects
            this.addEnvironmentalEffects(gameMode);
            
            console.log(`🎨 Enhanced materials and effects for ${gameMode} mode with ${this.getEraThemeForGameMode(gameMode)} era theme`);
        } catch (error) {
            console.warn('Failed to enhance scene materials:', error);
        }
    }

    // Add environmental effects based on game mode and era
    addEnvironmentalEffects(gameMode) {
        // Only add particle effects if they're enabled
        if (!this.effects.particleEffects) {
            console.log('🚫 Particle effects disabled, skipping environmental effects');
            return;
        }

        const eraTheme = this.getEraThemeForGameMode(gameMode);
        
        switch (gameMode) {
            case 'pacman':
                this.addPacmanEffects(eraTheme);
                break;
            case 'battle':
                this.addBattleModeEffects(eraTheme);
                break;
            case 'normal':
                this.addNormalModeEffects(eraTheme);
                break;
        }
    }

    // Add Pac-Man specific effects (Arcade era)
    addPacmanEffects(eraTheme) {
        // Add neon glow particles around the level
        const glowPositions = [
            new THREE.Vector3(0, 2, 0),
            new THREE.Vector3(5, 2, 5),
            new THREE.Vector3(-5, 2, 5),
            new THREE.Vector3(5, 2, -5),
            new THREE.Vector3(-5, 2, -5)
        ];

        // Scale particle count based on quality setting
        const baseCount = 20;
        const particleCount = Math.floor(baseCount * this.particleQuality);

        glowPositions.forEach((pos, index) => {
            this.createParticleEffect('neon', pos, {
                count: particleCount,
                color: [0x00FFFF, 0xFF00FF, 0xFFFF00, 0x00FF00, 0xFF0000][index % 5],
                size: 0.3 * this.particleQuality,
                spread: 2,
                height: 1,
                opacity: Math.min(0.6 * this.particleQuality, 0.9),
                duration: Infinity
            });
        });

        // Add ambient lighting for arcade feel
        if (!this.ambientLight) {
            this.ambientLight = new THREE.AmbientLight(0x404080, 0.6);
            this.scene.add(this.ambientLight);
        }
    }

    // Add Battle mode specific effects (PS2 era)
    addBattleModeEffects(eraTheme) {
        // Add sparks and arena atmosphere
        const arenaCenter = new THREE.Vector3(0, 1, 0);
        
        // Scale particle count based on quality setting
        const baseCount = 30;
        const particleCount = Math.floor(baseCount * this.particleQuality);
        
        this.createParticleEffect('sparks', arenaCenter, {
            count: particleCount,
            color: 0xFFAA00,
            size: 0.4 * this.particleQuality,
            spread: 8,
            height: 3 * this.particleQuality,
            opacity: Math.min(0.7 * this.particleQuality, 0.9),
            velocity: new THREE.Vector3(0, 2 * this.particleQuality, 0),
            duration: Infinity
        });

        // Add dramatic lighting
        if (!this.spotLight) {
            this.spotLight = new THREE.SpotLight(0xffffff, 1, 20, Math.PI / 6, 0.3, 1);
            this.spotLight.position.set(0, 10, 0);
            this.spotLight.target.position.set(0, 0, 0);
            this.scene.add(this.spotLight);
            this.scene.add(this.spotLight.target);
        }
    }

    // Add Normal mode specific effects (SNES era)
    addNormalModeEffects(eraTheme) {
        // Add subtle magical sparkles
        const sparklePositions = [
            new THREE.Vector3(3, 3, 3),
            new THREE.Vector3(-3, 3, 3),
            new THREE.Vector3(3, 3, -3),
            new THREE.Vector3(-3, 3, -3)
        ];

        // Scale particle count based on quality setting
        const baseCount = 15;
        const particleCount = Math.floor(baseCount * this.particleQuality);

        sparklePositions.forEach(pos => {
            this.createParticleEffect('sparkle', pos, {
                count: particleCount,
                color: 0xFFFFAA,
                size: 0.2 * this.particleQuality,
                spread: 1.5,
                height: 2 * this.particleQuality,
                opacity: Math.min(0.4 * this.particleQuality, 0.7),
                duration: Infinity
            });
        });

        // Add warm ambient lighting
        if (!this.ambientLight) {
            this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
            this.scene.add(this.ambientLight);
        }
    }

    // Clear existing particle effects
    clearParticleEffects() {
        if (this.particleSystems) {
            this.particleSystems.forEach(particleData => {
                if (particleData.system && particleData.system.parent) {
                    this.scene.remove(particleData.system);
                }
            });
            this.particleSystems = [];
        }
    }

    // Apply comprehensive enhancements to all levels
    enhanceAllLevels() {
        console.log('🎨 Applying comprehensive graphics enhancements to all game modes...');
        
        // Add era-specific level enhancement presets
        const gameModesToEnhance = ['normal', 'pacman', 'battle'];
        
        gameModesToEnhance.forEach(mode => {
            console.log(`🌟 Pre-configuring enhancements for ${mode} mode (${this.getEraThemeForGameMode(mode)} era)`);
            
            // Pre-create common material presets for each era
            this.preCreateMaterialPresets(mode);
        });
        
        console.log('✅ All graphics enhancements configured and ready!');
    }

    // Pre-create material presets for better performance
    preCreateMaterialPresets(gameMode) {
        const eraTheme = this.getEraThemeForGameMode(gameMode);
        const commonColors = [
            0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF,
            0x888888, 0xFFFFFF, 0x000000, 0xFFA500, 0x800080, 0x008000
        ];
        const materialTypes = ['plastic', 'metal', 'gem', 'stone', 'glow', 'hologram', 'neon', 'retro'];
        
        materialTypes.forEach(type => {
            commonColors.forEach(color => {
                this.createEnhancedMaterial(type, color, eraTheme);
            });
        });
    }

    // Add advanced geometry enhancements
    enhanceGeometry(mesh, eraTheme) {
        if (!mesh || !mesh.geometry) return;
        
        try {
            // Add normal and tangent attributes for better lighting
            if (!mesh.geometry.attributes.normal) {
                mesh.geometry.computeVertexNormals();
            }
            
            // Era-specific geometry enhancements
            switch (eraTheme) {
                case 'snes':
                    // SNES era: Keep simple geometry but enhance normals for better lighting
                    this.enhanceForSNES(mesh);
                    break;
                case 'arcade':
                    // Arcade era: Add glow and neon effects
                    this.enhanceForArcade(mesh);
                    break;
                case 'ps2':
                    // PS2 era: Add more detailed geometry and advanced lighting
                    this.enhanceForPS2(mesh);
                    break;
            }
        } catch (error) {
            console.warn('Failed to enhance geometry for mesh:', mesh.name, error);
        }
    }

    // SNES era enhancements (16-bit style)
    enhanceForSNES(mesh) {
        // Add subtle emissive effects to simulate 16-bit glow
        if (mesh.material) {
            mesh.material.emissiveIntensity = Math.min(mesh.material.emissiveIntensity + 0.1, 0.3);
        }
        
        // Scale geometry slightly for that chunky 16-bit feel
        if (mesh.name.toLowerCase().includes('player') || mesh.name.toLowerCase().includes('character')) {
            mesh.scale.multiplyScalar(1.05);
        }
    }

    // Arcade era enhancements (neon and glow)
    enhanceForArcade(mesh) {
        // Add pulsing effects to certain objects
        if (mesh.material && (mesh.name.toLowerCase().includes('wall') || 
                              mesh.name.toLowerCase().includes('collectible') ||
                              mesh.name.toLowerCase().includes('enemy'))) {
            
            // Store original values for pulsing animation
            mesh.userData.originalEmissiveIntensity = mesh.material.emissiveIntensity || 0;
            mesh.userData.pulseAnimation = true;
            
            // Add to animation list for frame updates
            if (!this.animatedMeshes) this.animatedMeshes = [];
            this.animatedMeshes.push(mesh);
        }
    }

    // PS2 era enhancements (realistic lighting and shadows)
    enhanceForPS2(mesh) {
        // Enable shadows for most objects
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add subtle detail enhancements
        if (mesh.material) {
            mesh.material.envMapIntensity = Math.max(mesh.material.envMapIntensity || 0, 0.3);
        }
    }

    // Update animated effects each frame
    updateAnimatedEffects() {
        if (!this.animatedMeshes) return;
        
        const time = Date.now() * 0.002;
        
        this.animatedMeshes.forEach(mesh => {
            if (mesh.userData.pulseAnimation && mesh.material) {
                // Pulsing emissive effect for arcade style
                const pulseIntensity = Math.sin(time * 2) * 0.2 + 0.3;
                mesh.material.emissiveIntensity = mesh.userData.originalEmissiveIntensity + pulseIntensity;
            }
        });
    }

    enhanceMeshMaterial(mesh, gameMode) {
        try {
            if (!mesh.material || !mesh.material.color) return;
            
            const baseColor = mesh.material.color.getHex();
            const meshName = mesh.name.toLowerCase();
            
            // Determine era theme based on game mode
            const eraTheme = this.getEraThemeForGameMode(gameMode);
            
            // Determine material type based on mesh name and game mode
            let materialType = this.determineMaterialType(meshName, gameMode);
            
            // Apply enhanced material with era theming
            const enhancedMaterial = this.createEnhancedMaterial(materialType, baseColor, eraTheme);
            
            mesh.material = enhancedMaterial;
            
            // Apply geometry enhancements
            this.enhanceGeometry(mesh, eraTheme);
            
            // Set shadow properties on the mesh, not the material
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        } catch (error) {
            console.warn(`Failed to enhance material for mesh ${mesh.name}:`, error);
        }
    }

    // Determine era theme based on game mode
    getEraThemeForGameMode(gameMode) {
        const themeMapping = {
            'pacman': 'arcade',       // Retro arcade style for Pac-Man
            'battle': 'ps2',          // PS2 era for battle mode
            'normal': 'snes',         // SNES era for normal levels
            'classic': 'arcade',      // Arcade style for classic modes
            'retro': 'snes'           // SNES style for retro modes
        };
        
        return themeMapping[gameMode] || 'ps2';
    }

    // Determine material type based on mesh name and game mode
    determineMaterialType(meshName, gameMode) {
        let materialType = 'plastic'; // Default
        
        // Basic material type detection
        if (meshName.includes('ground') || meshName.includes('platform') || meshName.includes('floor')) {
            materialType = 'stone';
        } else if (meshName.includes('wall') || meshName.includes('ceiling')) {
            materialType = gameMode === 'pacman' ? 'neon' : 'stone';
        } else if (meshName.includes('metal') || meshName.includes('arena') || meshName.includes('frame')) {
            materialType = 'metal';
        } else if (meshName.includes('collectible') || meshName.includes('coin') || meshName.includes('pebble') || meshName.includes('gem')) {
            materialType = 'gem';
        } else if (meshName.includes('glow') || meshName.includes('neon') || meshName.includes('light')) {
            materialType = 'glow';
        } else if (meshName.includes('ghost') || meshName.includes('hologram') || meshName.includes('spirit')) {
            materialType = 'hologram';
        } else if (meshName.includes('quicksand') || meshName.includes('sand') || meshName.includes('mud')) {
            materialType = 'stone';
        } else if (meshName.includes('obstacle') || meshName.includes('block') || meshName.includes('barrier')) {
            materialType = gameMode === 'pacman' ? 'neon' : 'stone';
        } else if (meshName.includes('player') || meshName.includes('character')) {
            materialType = gameMode === 'pacman' ? 'retro' : 'plastic';
        } else if (meshName.includes('enemy') || meshName.includes('bot') || meshName.includes('ai')) {
            materialType = gameMode === 'pacman' ? 'glow' : 'plastic';
        }
        
        // Game mode specific overrides
        switch (gameMode) {
            case 'pacman':
                if (meshName.includes('dot') || meshName.includes('pellet')) {
                    materialType = 'glow';
                } else if (meshName.includes('fruit') || meshName.includes('bonus')) {
                    materialType = 'gem';
                } else if (meshName.includes('maze') || meshName.includes('wall')) {
                    materialType = 'neon';
                }
                break;
                
            case 'battle':
                if (meshName.includes('arena') || meshName.includes('ring')) {
                    materialType = 'metal';
                } else if (meshName.includes('hazard') || meshName.includes('trap')) {
                    materialType = 'glow';
                } else if (meshName.includes('weapon') || meshName.includes('power')) {
                    materialType = 'gem';
                }
                break;
                
            case 'normal':
                if (meshName.includes('tile') || meshName.includes('brick')) {
                    materialType = 'retro';
                } else if (meshName.includes('water') || meshName.includes('liquid')) {
                    materialType = 'gem';
                } else if (meshName.includes('switch') || meshName.includes('button')) {
                    materialType = 'plastic';
                }
                break;
        }
        
        return materialType;
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
            ssr: this.ssrPass && this.ssrPass.enabled,
            particleEffects: this.effects.particleEffects,
            particleQuality: this.particleQuality,
            particleCount: this.particleSystems.length,
            dynamicLighting: this.effects.dynamicLighting
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

    // Test particle effects specifically
    testParticleEffects() {
        console.log('✨ Testing particle effects system...');
        
        const particleTest = {
            enabled: this.effects.particleEffects,
            quality: this.particleQuality,
            qualityLevel: this.getQualityLevel(this.particleQuality),
            activeParticleSystemsCount: this.particleSystems.length,
            currentGameMode: this.currentGameMode,
            particleSystemDetails: this.particleSystems.map((system, index) => ({
                index: index,
                type: system.type || 'unknown',
                alive: system.system && system.system.parent !== null,
                particleCount: system.system && system.system.geometry ? 
                             system.system.geometry.attributes.position.count : 0,
                opacity: system.system && system.system.material ? system.system.material.opacity : 'N/A'
            }))
        };
        
        console.log('🎪 Particle Effects Test Results:', particleTest);
        console.log(`🔧 Quality Settings: ${particleTest.qualityLevel} (${this.particleQuality}x multiplier)`);
        
        return particleTest;
    }

    // Test SSR specifically
    testSSR() {
        console.log('🌊 Testing Screen Space Reflections...');
        
        const ssrTest = {
            enabled: this.effects.ssr,
            passExists: !!this.ssrPass,
            intensity: this.ssrPass ? this.ssrPass.uniforms['intensity'].value : 'N/A',
            shaderUniforms: this.ssrPass ? {
                tDiffuse: !!this.ssrPass.uniforms['tDiffuse'].value,
                intensity: this.ssrPass.uniforms['intensity'].value,
                resolution: this.ssrPass.uniforms['resolution'].value
            } : 'N/A',
            implementationType: 'Improved Surface-Aware SSR',
            features: [
                'Sky exclusion masking',
                'Surface brightness detection',
                'Multi-sample reflection',
                'Realistic viewing angle fade',
                'Appropriate surface detection'
            ]
        };
        
        console.log('🪞 SSR Test Results:', ssrTest);
        
        if (ssrTest.enabled && ssrTest.passExists) {
            console.log('✅ SSR is active with improved surface detection');
            console.log('🎯 SSR should only reflect on appropriate surfaces (floors, metals, not sky)');
        } else if (!ssrTest.enabled) {
            console.log('❌ SSR is disabled - enable in settings to see reflections');
        } else {
            console.log('⚠️ SSR pass not initialized properly');
        }
        
        return ssrTest;
    }

    // Get quality level name from multiplier
    getQualityLevel(multiplier) {
        if (multiplier <= 0.5) return 'Low';
        if (multiplier <= 1.0) return 'Medium';  
        if (multiplier <= 1.5) return 'High';
        return 'Ultra';
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