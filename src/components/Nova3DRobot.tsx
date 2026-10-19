import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Sparkles, Hand, Volume2, Mic, Brain } from 'lucide-react';
import { NovaVoiceState, NovaState } from './NovaAvatar';

interface Nova3DRobotProps {
  modelPath?: string;
  voiceState?: NovaVoiceState;
  avatarState?: NovaState;
  isSpeaking?: boolean;
  isThinking?: boolean;
  interactive?: boolean;
  className?: string;
  height?: string;
}

export const Nova3DRobot: React.FC<Nova3DRobotProps> = ({
  modelPath = '/models/mini_robot.glb',
  voiceState = 'idle',
  avatarState = 'idle',
  isSpeaking = false,
  isThinking = false,
  interactive = true,
  className = '',
  height = '280px',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // References for three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const glowLightRef = useRef<THREE.PointLight | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Animation & interaction triggers
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });
  const spinProgressRef = useRef<number>(0);
  const jumpProgressRef = useRef<number>(0);

  // Trigger playful spin/jump on click
  const handleRobotClick = () => {
    spinProgressRef.current = 1.0;
    jumpProgressRef.current = 1.0;
  };

  // Reset orbit view
  const handleResetCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.reset();
      cameraRef.current.position.set(0, 0.4, 3.2);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Mouse move handler for interactive look-at
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouseRef.current.targetX = x * 0.4;
    mouseRef.current.targetY = y * 0.3;
  };

  const handleMouseLeave = () => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const heightPx = container.clientHeight || 280;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(0, 0.4, 3.2);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1.8;
    controls.maxDistance = 6.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.2; // Don't flip upside down
    controls.minPolarAngle = Math.PI / 6;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Key Light (warm studio white)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Fill Light (soft cyan/purple fill for tech vibe)
    const fillLight = new THREE.DirectionalLight(0xc4b5fd, 1.0);
    fillLight.position.set(-3, 2, -1);
    scene.add(fillLight);

    // Rim Light (backlight for crisp silhouette)
    const rimLight = new THREE.DirectionalLight(0xfde68a, 1.2);
    rimLight.position.set(0, 4, -3);
    scene.add(rimLight);

    // Dynamic State Glow Light (in front of robot's chest/eyes)
    const glowLight = new THREE.PointLight(0xfde68a, 2.5, 3.5);
    glowLight.position.set(0, 0.2, 1.2);
    scene.add(glowLight);
    glowLightRef.current = glowLight;

    // 6. Load 3D Model with GLTFLoader
    const loader = new GLTFLoader();
    setLoadError(null);

    loader.load(
      modelPath,
      (gltf) => {
        const root = gltf.scene;

        // Auto-center and normalize size
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center geometry
        root.position.x = -center.x;
        root.position.y = -center.y;
        root.position.z = -center.z;

        // Normalize scale to fit neatly inside ~2.2 units
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 2.1 / maxDim : 1;
        
        const modelGroup = new THREE.Group();
        modelGroup.add(root);
        modelGroup.scale.setScalar(scale);

        // Enable shadow casting and tune materials
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = Math.min(mat.roughness ?? 0.5, 0.6);
              mat.metalness = Math.max(mat.metalness ?? 0.1, 0.2);
            }
          }
        });

        scene.add(modelGroup);
        modelGroupRef.current = modelGroup;
        setIsLoaded(true);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadingProgress(percent);
        }
      },
      (err) => {
        console.error('Error loading 3D robot model:', err);
        setLoadError('Could not load 3D model.');
      }
    );

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    // 8. Animation Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse follow interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.1;

      // Update controls
      controls.update();

      // Animate model
      if (modelGroupRef.current) {
        const model = modelGroupRef.current;

        // Base idle floating / breathing
        const floatSpeed = isSpeaking ? 5.0 : isThinking ? 1.8 : 2.5;
        const floatHeight = isSpeaking ? 0.08 : 0.05;
        let basePosY = Math.sin(elapsedTime * floatSpeed) * floatHeight;

        // Base idle sway
        let targetRotY = mouseRef.current.x + Math.sin(elapsedTime * 1.2) * 0.06;
        let targetRotX = -mouseRef.current.y;
        let targetRotZ = 0;

        // Speaking state: Rhythmic nodding & energetic bobbing
        if (isSpeaking) {
          const speakPulse = Math.sin(elapsedTime * 12);
          targetRotX += speakPulse * 0.08;
          basePosY += Math.abs(speakPulse) * 0.05;
        }

        // Thinking state: Curious head tilt & floating slightly higher
        if (isThinking) {
          targetRotZ += 0.12 * Math.sin(elapsedTime * 2);
          basePosY += 0.06;
        }

        // Click Spin / Jump Reaction
        if (spinProgressRef.current > 0) {
          const spinAngle = (1 - spinProgressRef.current) * Math.PI * 2;
          targetRotY += spinAngle;
          spinProgressRef.current = Math.max(0, spinProgressRef.current - delta * 2.0);
        }

        if (jumpProgressRef.current > 0) {
          const jumpHeight = Math.sin((1 - jumpProgressRef.current) * Math.PI) * 0.35;
          basePosY += jumpHeight;
          jumpProgressRef.current = Math.max(0, jumpProgressRef.current - delta * 2.5);
        }

        // Apply smooth positioning & rotation
        model.position.y = basePosY;
        model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, targetRotY, 0.1);
        model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, targetRotX, 0.1);
        model.rotation.z = THREE.MathUtils.lerp(model.rotation.z, targetRotZ, 0.1);
      }

      // Update dynamic glow light color based on state
      if (glowLightRef.current) {
        const glow = glowLightRef.current;
        if (isSpeaking) {
          glow.color.setHex(0xa855f7); // Purple speaking
          glow.intensity = 3.0 + Math.sin(elapsedTime * 10) * 1.5;
        } else if (isThinking) {
          glow.color.setHex(0xf59e0b); // Amber thinking
          glow.intensity = 2.0 + Math.sin(elapsedTime * 4) * 1.0;
        } else if (voiceState === 'listening') {
          glow.color.setHex(0x10b981); // Emerald listening
          glow.intensity = 3.2 + Math.sin(elapsedTime * 6) * 1.0;
        } else {
          glow.color.setHex(0xfde68a); // Soft yellow idle
          glow.intensity = 1.8 + Math.sin(elapsedTime * 2) * 0.5;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelPath, isSpeaking, isThinking, voiceState]);

  return (
    <div
      className={`relative w-full select-none overflow-hidden bg-radial from-[#FEFCE8] via-[#FEFCE8] to-[#FDE68A]/40 ${className}`}
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={interactive ? handleRobotClick : undefined}
      title="NOVA 3D Robot Companion • Click to interact or drag to rotate 360°"
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Progress Overlay */}
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FEFCE8]/95 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0F172A] animate-spin" />
            <span className="text-xs font-black uppercase text-[#0F172A] tracking-wider">
              LOADING 3D NOVA...
            </span>
          </div>
          <div className="w-36 h-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] overflow-hidden">
            <div
              className="h-full bg-[#A7F3D0] transition-all duration-150"
              style={{ width: `${Math.max(10, loadingProgress)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-600">
            {loadingProgress > 0 ? `${loadingProgress}%` : 'Initializing 3D Mesh'}
          </span>
        </div>
      )}

      {/* Load Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-rose-50 p-4 text-center border-2 border-rose-300">
          <p className="text-xs font-extrabold text-rose-800">{loadError}</p>
          <span className="text-[10px] font-mono text-slate-500 mt-1">Check /public/models/mini_robot.glb</span>
        </div>
      )}

      {/* Interactive HUD Overlays (Neo-Brutalist) */}
      <div className="absolute top-2 left-2 z-10 pointer-events-none flex items-center gap-1">
        <span
          className={`text-[8px] font-black px-1.5 py-0.5 border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] uppercase flex items-center gap-1 ${
            isSpeaking
              ? 'bg-[#C4B5FD] text-[#0F172A] animate-pulse'
              : isThinking
              ? 'bg-[#FDE68A] text-[#0F172A]'
              : voiceState === 'listening'
              ? 'bg-[#A7F3D0] text-[#0F172A] animate-ping'
              : 'bg-white text-slate-800'
          }`}
        >
          {isSpeaking ? (
            <>
              <Volume2 className="w-2.5 h-2.5" /> SPEAKING
            </>
          ) : isThinking ? (
            <>
              <Brain className="w-2.5 h-2.5" /> THINKING
            </>
          ) : voiceState === 'listening' ? (
            <>
              <Mic className="w-2.5 h-2.5" /> LISTENING
            </>
          ) : (
            '3D ACTIVE'
          )}
        </span>
      </div>

      {/* Reset Camera Button */}
      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
        <button
          onClick={handleResetCamera}
          className="p-1 bg-white hover:bg-[#FDE68A] text-[#0F172A] border border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer text-[9px] font-extrabold flex items-center gap-1"
          title="Reset 3D camera angle"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">RESET</span>
        </button>
      </div>

      {/* Interaction Hint */}
      <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
        <span className="text-[8px] font-bold text-slate-600 bg-white/80 border border-[#0F172A]/40 px-1 py-0.2">
          DRAG: ROTATE • CLICK: JUMP
        </span>
      </div>
    </div>
  );
};
