import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Sparkles, Volume2, Mic, Brain, Heart, AlertCircle } from 'lucide-react';
import { NovaFaceTexture } from './NovaFaceTexture';
import {
  Nova3DState,
  BlinkController,
  SpeechMouthController,
  isReducedMotion,
} from './novaAnimations';
import { NovaAvatar } from '../NovaAvatar';
import './Nova3DAvatar.css';

export interface Nova3DAvatarProps {
  state?: Nova3DState;
  isSpeaking?: boolean;
  isThinking?: boolean;
  cameraActive?: boolean;
  interactive?: boolean;
  height?: string;
  className?: string;
  onAvatarClick?: () => void;
  showControls?: boolean;
  compact?: boolean;
  transparent?: boolean;
}

export const Nova3DAvatar: React.FC<Nova3DAvatarProps> = ({
  state = 'idle',
  isSpeaking = false,
  isThinking = false,
  cameraActive = false,
  interactive = true,
  height = '100%',
  className = '',
  onAvatarClick,
  showControls = true,
  compact = false,
  transparent = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  // Three.js core references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);
  const faceMeshRef = useRef<THREE.Mesh | null>(null);
  const faceTextureRef = useRef<NovaFaceTexture | null>(null);
  const glowLightRef = useRef<THREE.PointLight | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Procedural controllers
  const blinkCtrlRef = useRef<BlinkController>(new BlinkController());
  const mouthCtrlRef = useRef<SpeechMouthController>(new SpeechMouthController());

  // Interactive mouse tracking & click reactions
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const spinReactionRef = useRef<number>(0);
  const jumpReactionRef = useRef<number>(0);

  // State refs to avoid stale closures in requestAnimationFrame loop
  const stateRef = useRef<Nova3DState>(state);
  stateRef.current = state;
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  isSpeakingRef.current = isSpeaking;
  const isThinkingRef = useRef<boolean>(isThinking);
  isThinkingRef.current = isThinking;

  const handleContainerClick = () => {
    if (!interactive) return;
    spinReactionRef.current = 1.0;
    jumpReactionRef.current = 1.0;
    if (onAvatarClick) onAvatarClick();
  };

  const handleResetCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.reset();
      cameraRef.current.position.set(0, 0.42, 3.1);
      controlsRef.current.target.set(0, 0.28, 0);
      controlsRef.current.update();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mousePosRef.current.targetX = nx * 0.35;
    mousePosRef.current.targetY = ny * 0.25;
  };

  const handleMouseLeave = () => {
    mousePosRef.current.targetX = 0;
    mousePosRef.current.targetY = 0;
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvasMount = canvasMountRef.current;
    if (!container || !canvasMount) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let controls: OrbitControls | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let faceTexture: NovaFaceTexture | null = null;

    try {
      // Detect WebGL capability
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setHasError(true);
        return;
      }

      const width = container.clientWidth || 320;
      const heightPx = container.clientHeight || 280;

      // 1. Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // 2. Camera (Portrait framing: head + upper body clearly visible)
      const camera = new THREE.PerspectiveCamera(38, width / heightPx, 0.1, 100);
      camera.position.set(0, 0.42, 3.1);
      cameraRef.current = camera;

      // 3. Renderer with antialiasing and tone mapping
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, heightPx);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // Mount into dedicated canvasMount container (never replace React children)
      canvasMount.innerHTML = '';
      canvasMount.appendChild(renderer.domElement);

      // 4. OrbitControls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.minDistance = 2.0;
      controls.maxDistance = 5.0;
      controls.maxPolarAngle = Math.PI / 2 + 0.15;
      controls.minPolarAngle = Math.PI / 6;
      controls.target.set(0, 0.28, 0);
      controlsRef.current = controls;

      // 5. Lighting Studio
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(3, 4, 3);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xc4b5fd, 1.1);
      fillLight.position.set(-3, 2, -1);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xfde68a, 1.2);
      rimLight.position.set(0, 4, -3);
      scene.add(rimLight);

      const glowLight = new THREE.PointLight(0x38bdf8, 2.6, 3.5);
      glowLight.position.set(0, 0.65, 1.2);
      scene.add(glowLight);
      glowLightRef.current = glowLight;

      // 6. Facial Texture System
      faceTexture = new NovaFaceTexture();
      faceTextureRef.current = faceTexture;

      // 7. Load GLB Model
      const loader = new GLTFLoader();
      setHasError(false);

      loader.load(
        '/models/mini_robot.glb',
        (gltf) => {
          if (disposed) return;
          try {
            const root = gltf.scene;

            // Auto-center and normalize size
            const box = new THREE.Box3().setFromObject(root);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Center root at (0, 0, 0)
            root.position.x = -center.x;
            root.position.y = -center.y;
            root.position.z = -center.z;

            // Scale to standard height ~2.1 units
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = maxDim > 0 ? 2.15 / maxDim : 1;

            const robotGroup = new THREE.Group();
            robotGroup.add(root);
            robotGroup.scale.setScalar(scale);

            root.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
              }
            });

            const facePlaneWidth = 0.42 * scale;
            const facePlaneHeight = 0.33 * scale;
            const facePlaneGeo = new THREE.PlaneGeometry(facePlaneWidth, facePlaneHeight);

            const faceMaterial = new THREE.MeshBasicMaterial({
              map: faceTexture!.texture,
              transparent: true,
              depthWrite: false,
              polygonOffset: true,
              polygonOffsetFactor: -1,
              polygonOffsetUnits: -4,
            });

            const facePlaneMesh = new THREE.Mesh(facePlaneGeo, faceMaterial);
            facePlaneMesh.position.set(0, 0.672, 0.335);
            facePlaneMesh.renderOrder = 999;

            robotGroup.add(facePlaneMesh);
            faceMeshRef.current = facePlaneMesh;

            scene.add(robotGroup);
            robotGroupRef.current = robotGroup;
            setIsLoaded(true);
          } catch (modelErr) {
            console.error('Error processing 3D robot model:', modelErr);
            setHasError(true);
          }
        },
        (xhr) => {
          if (disposed) return;
          if (xhr.total > 0) {
            setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
          }
        },
        (err) => {
          if (disposed) return;
          console.error('Error loading 3D mini_robot.glb:', err);
          setHasError(true);
        }
      );

      // 8. Resize Observer
      resizeObserver = new ResizeObserver(() => {
        if (!container || !renderer || !camera) return;
        const nw = container.clientWidth;
        const nh = container.clientHeight;
        if (nw > 0 && nh > 0) {
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh);
        }
      });
      resizeObserver.observe(container);

      // 9. Continuous Animation Loop (60 FPS)
      const clock = new THREE.Clock();

      const animate = () => {
        if (disposed) return;
        animFrameIdRef.current = requestAnimationFrame(animate);

        try {
          const delta = Math.min(0.1, clock.getDelta());
          const elapsedTime = clock.getElapsedTime();
          const reducedMotion = isReducedMotion();

          // Smooth mouse follow interpolation
          mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.1;
          mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.1;

          // Update OrbitControls
          if (controls) controls.update();

          const currentState = stateRef.current;
          const currentlySpeaking = isSpeakingRef.current || currentState === 'speaking';
          const currentlyThinking = isThinkingRef.current || currentState === 'thinking';

          // --- PROCEDURAL EYE BLINKING & MOVEMENT ---
          const eyeOpenness = blinkCtrlRef.current.update(delta);
          const isSurprised = currentState === 'surprised' || currentState === 'excited';
          const isHappy = currentState === 'happy' || currentState === 'success';

          let lookX = mousePosRef.current.x * 0.8;
          let lookY = mousePosRef.current.y * 0.8;

          if (currentlyThinking) {
            lookX = Math.sin(elapsedTime * 1.5) * 0.6;
            lookY = 0.4 + Math.sin(elapsedTime * 2.0) * 0.2;
          }

          // --- PROCEDURAL MOUTH SYLLABLE INTERPOLATION ---
          const mouthAnim = mouthCtrlRef.current.update(delta, currentlySpeaking, currentState);

          // Render updated canvas face frame
          if (faceTextureRef.current) {
            faceTextureRef.current.render(
              {
                eyeOpenness,
                eyeSurprise: isSurprised ? 1 : 0,
                eyeHappy: isHappy ? 1 : 0,
                eyeThinking: currentlyThinking ? 1 : 0,
                eyeFocused: currentState === 'listening' ? 1 : 0,
                eyeLookX: lookX,
                eyeLookY: lookY,
                mouthOpenness: mouthAnim.openness,
                mouthWidth: mouthAnim.width,
                mouthCurve: mouthAnim.curve,
                glowColor: '#38BDF8',
                pupilPulse: 0.5 + Math.sin(elapsedTime * 4) * 0.5,
              },
              currentState
            );
          }

          // --- PROCEDURAL BODY KINEMATICS ---
          if (robotGroupRef.current) {
            const robot = robotGroupRef.current;

            if (!reducedMotion) {
              // Enhanced Anti-Gravity Levitation: multi-harmonic floating oscillation
              const floatFreq = currentlySpeaking ? 3.6 : currentlyThinking ? 1.6 : 2.2;
              const floatAmp = currentlySpeaking ? 0.085 : 0.07;
              let posY =
                Math.sin(elapsedTime * floatFreq) * floatAmp +
                Math.sin(elapsedTime * (floatFreq * 1.6)) * (floatAmp * 0.22);

              // Organic anti-gravity banking, roll and pitch tilt
              let rotY = mousePosRef.current.x + Math.sin(elapsedTime * 1.2) * 0.06;
              let rotX = -mousePosRef.current.y + Math.cos(elapsedTime * (floatFreq * 0.8)) * 0.025;
              let rotZ = Math.sin(elapsedTime * (floatFreq * 0.6)) * 0.035;

              if (currentlySpeaking) {
                const nod = Math.sin(elapsedTime * 11);
                rotX += nod * 0.07;
                posY += Math.abs(nod) * 0.04;
              }

              if (currentlyThinking) {
                rotZ += 0.12 * Math.sin(elapsedTime * 1.8);
                posY += 0.05;
              }

              if (currentState === 'listening') {
                rotX += 0.08;
                posY += 0.02;
              }

              if (isHappy || currentState === 'excited') {
                const bounce = Math.abs(Math.sin(elapsedTime * 6)) * 0.08;
                posY += bounce;
                rotZ += Math.sin(elapsedTime * 5) * 0.06;
              }

              if (spinReactionRef.current > 0) {
                const spin = (1 - spinReactionRef.current) * Math.PI * 2;
                rotY += spin;
                spinReactionRef.current = Math.max(0, spinReactionRef.current - delta * 2.2);
              }

              if (jumpReactionRef.current > 0) {
                const jump = Math.sin((1 - jumpReactionRef.current) * Math.PI) * 0.32;
                posY += jump;
                jumpReactionRef.current = Math.max(0, jumpReactionRef.current - delta * 2.6);
              }

              robot.position.y = THREE.MathUtils.lerp(robot.position.y, posY, 0.12);
              robot.rotation.y = THREE.MathUtils.lerp(robot.rotation.y, rotY, 0.12);
              robot.rotation.x = THREE.MathUtils.lerp(robot.rotation.x, rotX, 0.12);
              robot.rotation.z = THREE.MathUtils.lerp(robot.rotation.z, rotZ, 0.12);
            } else {
              robot.position.set(0, 0, 0);
              robot.rotation.set(0, 0, 0);
            }
          }

          // Dynamic Chest/Face Point-Light Coloring
          if (glowLightRef.current) {
            const glow = glowLightRef.current;
            if (currentlySpeaking) {
              glow.color.setHex(0xa855f7);
              glow.intensity = 3.0 + Math.sin(elapsedTime * 8) * 1.5;
            } else if (currentlyThinking) {
              glow.color.setHex(0xf59e0b);
              glow.intensity = 2.2 + Math.sin(elapsedTime * 4) * 0.8;
            } else if (currentState === 'listening') {
              glow.color.setHex(0x10b981);
              glow.intensity = 3.0 + Math.sin(elapsedTime * 6) * 1.0;
            } else if (isHappy) {
              glow.color.setHex(0x34d399);
              glow.intensity = 2.8;
            } else {
              glow.color.setHex(0x38bdf8);
              glow.intensity = 2.0 + Math.sin(elapsedTime * 2) * 0.5;
            }
          }

          if (renderer && scene && camera) {
            renderer.render(scene, camera);
          }
        } catch (animErr) {
          console.error('Nova 3D animation loop error:', animErr);
        }
      };

      animate();
    } catch (initErr) {
      console.error('Nova 3D avatar init error:', initErr);
      setHasError(true);
    }

    // Cleanup resources
    return () => {
      disposed = true;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver?.disconnect();
      controls?.dispose();
      renderer?.dispose();
      faceTexture?.dispose();
      if (canvasMount && renderer && canvasMount.contains(renderer.domElement)) {
        canvasMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // WebGL / Model Load Error Fallback
  if (hasError) {
    return (
      <div className={`nova-3d-avatar-container p-4 flex flex-col items-center justify-center ${className}`} style={{ height }}>
        <NovaAvatar
          state={state === 'thinking' ? 'thinking' : state === 'speaking' ? 'speaking' : state === 'listening' ? 'listening' : 'idle'}
          size="md"
          speaking={isSpeaking}
          listening={state === 'listening'}
          interactive={true}
        />
        <span className="text-[9px] font-mono font-bold text-slate-500 mt-2">
          [2D COMPATIBILITY FALLBACK ACTIVE]
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`nova-3d-avatar-container ${compact ? 'compact' : ''} ${transparent ? 'transparent-bg' : ''} ${className}`}
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
      title="NOVA 3D Companion • Drag to rotate • Click to interact"
    >
      {/* Three.js Canvas Mount Point - Never replaces React child elements */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full overflow-hidden" />

      {/* Corner Brackets (hidden in compact/transparent mode) */}
      {!compact && !transparent && (
        <>
          <div className="nova-3d-corner nova-3d-corner-tl" />
          <div className="nova-3d-corner nova-3d-corner-tr" />
          <div className="nova-3d-corner nova-3d-corner-bl" />
          <div className="nova-3d-corner nova-3d-corner-br" />
        </>
      )}

      {/* Loading Screen */}
      {!isLoaded && !transparent && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#FEFCE8]/95 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0F172A] animate-spin" />
            <span className="text-xs font-black uppercase text-[#0F172A] tracking-wider">
              INITIALIZING NOVA 3D...
            </span>
          </div>
          <div className="w-36 h-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] overflow-hidden">
            <div
              className="h-full bg-[#A7F3D0] transition-all duration-150"
              style={{ width: `${Math.max(12, loadProgress)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-600">
            {loadProgress > 0 ? `${loadProgress}%` : 'Loading 3D Meshes'}
          </span>
        </div>
      )}

      {/* Active State Badge (hidden in transparent mode) */}
      {!transparent && (
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none flex items-center gap-1">
          <span
            className={`text-[8px] font-black px-1.5 py-0.5 border border-[#0F172A] shadow-[1px_1px_0px_#0F172A] uppercase flex items-center gap-1 transition-all ${
              isSpeaking || state === 'speaking'
                ? 'bg-[#C4B5FD] text-[#0F172A] animate-pulse'
                : isThinking || state === 'thinking'
                ? 'bg-[#FDE68A] text-[#0F172A]'
                : state === 'listening'
                ? 'bg-[#A7F3D0] text-[#0F172A] animate-ping'
                : state === 'happy' || state === 'success'
                ? 'bg-[#A7F3D0] text-[#0F172A]'
                : 'bg-white text-slate-800'
            }`}
          >
            {isSpeaking || state === 'speaking' ? (
              <>
                <Volume2 className="w-2.5 h-2.5" /> SPEAKING
              </>
            ) : isThinking || state === 'thinking' ? (
              <>
                <Brain className="w-2.5 h-2.5" /> THINKING
              </>
            ) : state === 'listening' ? (
              <>
                <Mic className="w-2.5 h-2.5" /> LISTENING
              </>
            ) : state === 'happy' || state === 'success' ? (
              <>
                <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" /> HAPPY
              </>
            ) : (
              '3D NOVA // ACTIVE'
            )}
          </span>
        </div>
      )}

      {/* Interactive Controls Overlay */}
      {showControls && !transparent && isLoaded && (
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5">
          <button
            onClick={handleResetCamera}
            className="px-1.5 py-0.5 bg-white hover:bg-[#FDE68A] text-[#0F172A] border border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer text-[9px] font-extrabold flex items-center gap-1"
            title="Reset 3D camera angle"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>RESET</span>
          </button>
        </div>
      )}

      {/* Interaction Hint (hidden in compact/transparent mode) */}
      {isLoaded && !compact && !transparent && (
        <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
          <span className="text-[8px] font-bold text-slate-600 bg-white/80 border border-[#0F172A]/40 px-1 py-0.2">
            DRAG: 360° ROTATE • CLICK: JUMP
          </span>
        </div>
      )}
    </div>
  );
};
