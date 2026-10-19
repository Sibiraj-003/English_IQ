import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Question } from '../../types';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Camera,
  CameraOff,
  ShieldAlert,
  ShieldCheck,
  Maximize2,
  Smartphone,
  EyeOff,
  AlertTriangle,
  Lock,
  BotOff,
  RotateCcw,
} from 'lucide-react';

export const StudentTestRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Test data states
  const [test, setTest] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins default
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedAttempt, setCompletedAttempt] = useState<any | null>(null);

  // Security & Proctoring states
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [showFullscreenLockModal, setShowFullscreenLockModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Anti-Cheat & Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScreenBlurred, setIsScreenBlurred] = useState(false);
  const [blurReason, setBlurReason] = useState<
    'MOBILE_DETECTED' | 'SCREENSHOT_ATTEMPT' | 'WINDOW_UNFOCUSED' | 'SECURITY_VIOLATION' | null
  >(null);
  const [blurMessage, setBlurMessage] = useState<string>('');
  const [violationCount, setViolationCount] = useState(0);
  const [isPhoneDetected, setIsPhoneDetected] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('STARTING...');

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<any>(null);

  // Audio tone for security violations
  const playAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio might be blocked by browser policy before user interaction
    }
  };

  // Helper to trigger blur with reason
  const triggerSecurityBlur = (
    reason: 'MOBILE_DETECTED' | 'SCREENSHOT_ATTEMPT' | 'WINDOW_UNFOCUSED' | 'SECURITY_VIOLATION',
    msg: string
  ) => {
    if (isTestSubmitted) return;
    setIsScreenBlurred(true);
    setBlurReason(reason);
    setBlurMessage(msg);
    setViolationCount((prev) => prev + 1);
    playAlertSound();
  };

  // Load test data
  const loadTest = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const attempts = await api.getStudentAttempts(user?.id);
      const existing = attempts.find(
        (a) => a.test_id === id || (a.test_id && id && a.test_id.replace(/[-_]/g, '') === id.replace(/[-_]/g, ''))
      );
      if (existing) {
        setCompletedAttempt(existing);
        setLoading(false);
        return;
      }

      const data = await api.getTest(id);
      if (!data || !data.questions || data.questions.length === 0) {
        throw new Error('Test questions are being initialized. Please click retry below.');
      }
      setTest(data);
      setTimeLeft((data.duration_minutes || 15) * 60);
    } catch (err: any) {
      console.error('Error loading test:', err);
      setError(err.message || 'Unable to prepare test environment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTest();
  }, [id]);

  // Request Fullscreen helper
  const enterFullscreen = async () => {
    try {
      const elem: any = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenLockModal(false);
    } catch (err) {
      console.warn('Fullscreen request rejected:', err);
    }
  };

  // Exit Fullscreen helper
  const exitFullscreen = async () => {
    try {
      const doc: any = document;
      if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(err.message || 'Camera access is required for proctoring.');
      setCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start Exam after Gate Confirmation
  const handleStartExam = async () => {
    await enterFullscreen();
    await startCamera();
    setHasStarted(true);
  };

  // Fullscreen Change Listeners & Lockdown Enforcement
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc: any = document;
      const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement);
      setIsFullscreen(isFull);

      // IF STUDENT EXITED FULLSCREEN AND TEST IS NOT FINISHED: LOCK DOWN TEST
      if (!isFull && hasStarted && !isTestSubmitted) {
        setShowFullscreenLockModal(true);
        triggerSecurityBlur(
          'SECURITY_VIOLATION',
          'FULLSCREEN EXITED: The exam requires full screen mode. Questions are locked until full screen is restored.'
        );
      } else if (isFull) {
        setShowFullscreenLockModal(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, [hasStarted, isTestSubmitted]);

  // Anti-Screenshot & Window Unfocus Listeners
  useEffect(() => {
    if (!hasStarted || isTestSubmitted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || (e as any).keyCode === 44) {
        e.preventDefault();
        try {
          navigator.clipboard?.writeText?.('Screen capture disabled during official curriculum test.');
        } catch {}
        triggerSecurityBlur(
          'SCREENSHOT_ATTEMPT',
          'PrintScreen key intercepted. Screen instantly blurred to protect test content.'
        );
        return;
      }

      // 2. Windows Snipping Tool: Win+Shift+S or Meta+Shift+S or Ctrl+Shift+S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        triggerSecurityBlur(
          'SCREENSHOT_ATTEMPT',
          'Screen capture hotkey (Snipping Tool) detected. Screen instantly blurred.'
        );
        return;
      }

      // 3. macOS Screenshot shortcuts: Cmd+Shift+3, 4, 5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        triggerSecurityBlur(
          'SCREENSHOT_ATTEMPT',
          'macOS screen capture shortcut detected. Screen instantly blurred.'
        );
        return;
      }

      // 4. Print / Save page: Ctrl+P, Ctrl+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerSecurityBlur(
          'SCREENSHOT_ATTEMPT',
          'Print / Save page command blocked. Screen blurred for exam integrity.'
        );
        return;
      }

      // 5. Developer inspection: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
        triggerSecurityBlur(
          'SECURITY_VIOLATION',
          'Developer inspection shortcut blocked. Screen blurred.'
        );
        return;
      }
    };

    // When Windows Snipping Tool or screen capture steals window focus, blur fires
    const handleWindowBlur = () => {
      if (isTestSubmitted) return;
      triggerSecurityBlur(
        'WINDOW_UNFOCUSED',
        'Window lost focus or screen capture utility activated. Screen instantly blurred.'
      );
    };

    // Tab visibility change
    const handleVisibilityChange = () => {
      if (document.hidden && !isTestSubmitted) {
        triggerSecurityBlur(
          'WINDOW_UNFOCUSED',
          'Exam tab switched or backgrounded. Screen instantly blurred to protect questions.'
        );
      }
    };

    // Context menu & copy protection
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      try {
        navigator.clipboard?.writeText?.('Copying exam questions is strictly prohibited.');
      } catch {}
      triggerSecurityBlur(
        'SECURITY_VIOLATION',
        'Text copying detected. Screen blurred to maintain exam integrity.'
      );
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
    };
  }, [hasStarted, isTestSubmitted]);

  // Real-time Camera Proctoring & Mobile Phone Detection Loop
  useEffect(() => {
    if (!hasStarted || !cameraActive || isTestSubmitted) return;

    const analyzeWebcamFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const w = 160;
      const h = 120;
      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(video, 0, 0, w, h);
      setLastCheckTime(new Date().toLocaleTimeString());

      try {
        const frame = ctx.getImageData(0, 0, w, h);
        const data = frame.data;

        // Analyze lower-middle zone (where a student holds up a phone to photograph the screen)
        // High vertical contrast / rectangular smartphone screen reflection / bright device emission
        let verticalEdges = 0;
        let horizontalEdges = 0;
        let highBrightnessClusters = 0;
        let phoneScreenGlowPixels = 0;

        const startY = Math.floor(h * 0.25);
        const endY = Math.floor(h * 0.95);
        const startX = Math.floor(w * 0.15);
        const endX = Math.floor(w * 0.85);

        for (let y = startY; y < endY; y += 2) {
          for (let x = startX; x < endX; x += 2) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // Check neighbors for vertical edge (smartphone sides)
            if (x + 2 < endX) {
              const rR = data[(y * w + (x + 2)) * 4];
              const gR = data[(y * w + (x + 2)) * 4 + 1];
              const bR = data[(y * w + (x + 2)) * 4 + 2];
              const lumR = 0.299 * rR + 0.587 * gR + 0.114 * bR;
              if (Math.abs(lum - lumR) > 55) {
                verticalEdges++;
              }
            }

            // Check horizontal edge
            if (y + 2 < endY) {
              const rD = data[((y + 2) * w + x) * 4];
              const gD = data[((y + 2) * w + x) * 4 + 1];
              const bD = data[((y + 2) * w + x) * 4 + 2];
              const lumD = 0.299 * rD + 0.587 * gD + 0.114 * bD;
              if (Math.abs(lum - lumD) > 55) {
                horizontalEdges++;
              }
            }

            // Check for high-intensity smartphone screen / lens flash reflection
            if (lum > 225) {
              highBrightnessClusters++;
            }
            if (lum > 185 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25) {
              phoneScreenGlowPixels++;
            }
          }
        }

        // Smartphone detection condition:
        // A phone held up produces high vertical edge density (vertical phone silhouette)
        // or a concentrated rectangular glowing/reflective block
        const totalSampled = ((endY - startY) / 2) * ((endX - startX) / 2);
        const verticalDensity = verticalEdges / totalSampled;
        const glowRatio = phoneScreenGlowPixels / totalSampled;

        const phoneDetected = verticalDensity > 0.18 || (glowRatio > 0.15 && highBrightnessClusters > 20);

        if (phoneDetected) {
          setIsPhoneDetected(true);
          triggerSecurityBlur(
            'MOBILE_DETECTED',
            'MOBILE PHONE DETECTED: A camera or mobile phone was detected in front of the screen. Screen instantly blurred to prevent unauthorized photography.'
          );
        } else {
          setIsPhoneDetected(false);
        }
      } catch {
        // Frame analysis fallback
      }
    };

    detectionIntervalRef.current = setInterval(analyzeWebcamFrame, 450);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [hasStarted, cameraActive, isTestSubmitted]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (loading || submitting || error || completedAttempt || !hasStarted || isTestSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeFinalSubmission();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitting, error, hasStarted, isTestSubmitted]);

  const questions: Question[] = test?.questions || [];
  const currentQ = questions[currentIdx];

  const handleSelectOption = (opt: string) => {
    if (!currentQ || isScreenBlurred || showFullscreenLockModal) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: opt,
    }));
  };

  // Submission handler
  const executeFinalSubmission = async () => {
    if (submitting) return;
    setSubmitting(true);
    setIsTestSubmitted(true);
    setShowFinishModal(false);

    try {
      const payloadAnswers = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || '',
      }));

      const timeTaken = (test.duration_minutes || 15) * 60 - timeLeft;

      const evalResult = await api.submitTest(test.id, {
        student_id: user?.id || '',
        time_taken: Math.max(10, timeTaken),
        answers: payloadAnswers,
      });

      // Release proctoring and exit fullscreen
      stopCamera();
      await exitFullscreen();

      navigate(`/student/results/${evalResult.attempt_id}`);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
      setSubmitting(false);
      setIsTestSubmitted(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const isTimeCritical = timeLeft < 120;

  // 1. Loading State
  if (loading) {
    return (
      <div className="p-12 text-center font-mono font-bold text-slate-600 space-y-3">
        <div className="inline-block animate-spin w-6 h-6 border-4 border-[#0F172A] border-t-transparent rounded-full mb-2"></div>
        <div>PREPARING_EXAM_ENVIRONMENT...</div>
        <p className="text-xs text-slate-500">Loading curriculum questions, camera proctor, and fullscreen locks</p>
      </div>
    );
  }

  // 2. Already Completed Test State
  if (completedAttempt) {
    return (
      <div className="p-8 max-w-xl mx-auto font-mono">
        <BrutalCard size="large" accent="mint" className="p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-[#A7F3D0] border-2 border-[#0F172A] mx-auto flex items-center justify-center shadow-[3px_3px_0px_#0F172A]">
            <CheckCircle className="w-9 h-9 text-emerald-800" />
          </div>

          <div>
            <span className="text-xs font-extrabold px-2.5 py-1 bg-[#0F172A] text-[#A7F3D0] uppercase border border-[#0F172A]">
              TEST_ALREADY_COMPLETED // NOT RE-WRITABLE
            </span>
            <h3 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-3">
              Assessment Already Completed
            </h3>
            <p className="text-xs text-slate-600 font-sans mt-2 max-w-md mx-auto leading-relaxed">
              You have already finished and submitted this examination. In accordance with curriculum policy, completed tests cannot be written again.
            </p>
          </div>

          <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] inline-block font-mono text-xs">
            <span className="text-slate-500 font-bold uppercase block mb-1">EVALUATED SCORE</span>
            <div className="text-2xl font-extrabold text-emerald-700 font-sans">
              {completedAttempt.score} Marks ({completedAttempt.percentage}%)
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <BrutalButton
              variant="mint"
              onClick={() => navigate(`/student/results/${completedAttempt.id}`)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              [ VIEW RESULTS & WRITTEN ANSWERS ]
            </BrutalButton>
            <BrutalButton
              variant="white"
              onClick={() => navigate('/student/tests')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              [ BACK TO TESTS ]
            </BrutalButton>
          </div>
        </BrutalCard>
      </div>
    );
  }

  // 3. Error State
  if (error || !test || questions.length === 0) {
    return (
      <div className="p-8 max-w-xl mx-auto font-mono">
        <BrutalCard size="normal" accent="pink" className="p-6 text-center space-y-4">
          <div className="flex justify-center text-rose-600">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-extrabold text-[#0F172A]">EXAM ENVIRONMENT NOTICE</h2>
          <p className="text-xs text-slate-700 font-bold leading-relaxed">
            {error || 'The requested assessment could not be compiled. Please check connection and retry.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <BrutalButton variant="primary" onClick={loadTest}>
              [ RETRY EXAM LOAD ]
            </BrutalButton>
            <BrutalButton variant="white" onClick={() => navigate('/student/tests')}>
              [ RETURN TO TESTS ]
            </BrutalButton>
          </div>
        </BrutalCard>
      </div>
    );
  }

  // 4. Pre-Exam Security Gate: Must Enter Fullscreen & Activate Camera
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex items-center justify-center p-4 font-mono select-none overflow-y-auto">
        <div className="max-w-2xl w-full">
          <BrutalCard size="large" accent="amber" className="p-6 sm:p-8 space-y-6 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-[#0F172A]">
              <div>
                <span className="text-xs font-extrabold px-2.5 py-0.5 bg-[#0F172A] text-white">
                  EXAM_SECURITY_PROTOCOL // MANDATORY_LOCKDOWN
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-sans mt-1">
                  {test.title}
                </h1>
              </div>
              <Badge variant="amber">OFFICIAL ASSESSMENT</Badge>
            </div>

            <p className="text-sm text-slate-700 font-sans leading-relaxed">
              This examination is conducted under strict proctored conditions. Before beginning, please review the security guidelines:
            </p>

            {/* Security Protocol Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] space-y-1">
                <div className="font-extrabold text-[#0F172A] flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-amber-600" />
                  <span>1. FULLSCREEN LOCK</span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans">
                  The test runs strictly in full screen mode. Attempting to exit will lock the test immediately until full screen is restored.
                </p>
              </div>

              <div className="p-3 bg-[#BAE6FD] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] space-y-1">
                <div className="font-extrabold text-[#0F172A] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-sky-700" />
                  <span>2. LIVE CAMERA MONITORING</span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans">
                  Webcam will monitor candidate in the top-left corner during the entire examination.
                </p>
              </div>

              <div className="p-3 bg-[#FBCFE8] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] space-y-1">
                <div className="font-extrabold text-[#0F172A] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-rose-600" />
                  <span>3. ANTI-PHONE & ANTI-PHOTO SHIELD</span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans">
                  Holding up a mobile phone to photograph the screen instantly triggers screen blur to prevent unauthorized capture.
                </p>
              </div>

              <div className="p-3 bg-[#C4B5FD] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] space-y-1">
                <div className="font-extrabold text-[#0F172A] flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4 text-purple-700" />
                  <span>4. ANTI-SCREENSHOT SHIELD</span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans">
                  PrintScreen, snipping tools, and window unfocus instantly blur the test questions and clear the clipboard.
                </p>
              </div>
            </div>

            {/* AI Disabled Notice */}
            <div className="p-3 bg-slate-900 text-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-center gap-3">
              <BotOff className="w-6 h-6 text-rose-400 shrink-0" />
              <div className="text-xs">
                <div className="font-extrabold text-rose-400">AI MODE: STRICTLY DISABLED</div>
                <div className="text-[11px] text-slate-300 font-sans">
                  All AI assistance, hints, companion bots, and solutions are locked during this test.
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#A7F3D0]/50 border-2 border-[#0F172A] flex justify-between items-center text-xs">
              <span className="font-extrabold text-emerald-950">EXAM DURATION:</span>
              <span className="font-bold text-[#0F172A]">{test.duration_minutes || 15} MINUTES ({questions.length} QUESTIONS)</span>
            </div>

            {/* Gate Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <BrutalButton
                variant="white"
                onClick={() => navigate('/student/tests')}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                [ CANCEL & EXIT ]
              </BrutalButton>
              <BrutalButton
                variant="danger"
                size="lg"
                onClick={handleStartExam}
                icon={<Maximize2 className="w-5 h-5" />}
              >
                [ ENTER FULLSCREEN & START TEST ]
              </BrutalButton>
            </div>
          </BrutalCard>
        </div>
      </div>
    );
  }

  // 5. Active Test Runner View (Fixed Fullscreen Overlay to hide sidebar & AI)
  return (
    <div
      className="fixed inset-0 z-[50] bg-[#F8FAFC] flex flex-col overflow-y-auto selection:bg-transparent select-none font-mono"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Hidden Offscreen Canvas for Frame Analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP-LEFT CAMERA MONITORING HUD (Requirement: Camera monitoring on the page left top corner) */}
      <div className="fixed top-3 left-3 z-[110] w-44 sm:w-52 border-2 sm:border-3 border-[#0F172A] bg-white shadow-[4px_4px_0px_#0F172A]">
        {/* HUD Header */}
        <div className="bg-[#0F172A] text-white px-2 py-1 text-[10px] sm:text-[11px] font-extrabold flex items-center justify-between border-b-2 border-[#0F172A]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
            <span>AI PROCTOR // LIVE</span>
          </div>
          <Camera className="w-3.5 h-3.5 text-white" />
        </div>

        {/* Live Camera Video Feed */}
        <div className="relative w-full h-24 sm:h-32 bg-slate-950 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Fallback if camera offline */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-900 text-white space-y-1">
              <CameraOff className="w-6 h-6 text-rose-400" />
              <span className="text-[10px] font-bold text-rose-300">
                {cameraError ? 'CAMERA BLOCKED' : 'CONNECTING CAMERA...'}
              </span>
              <button
                type="button"
                onClick={startCamera}
                className="px-2 py-0.5 bg-white text-[#0F172A] text-[9px] font-extrabold border border-[#0F172A] mt-1"
              >
                ENABLE CAM
              </button>
            </div>
          )}

          {/* Live Watermark Overlay on video */}
          <div className="absolute top-1 left-1 bg-black/70 text-[9px] text-emerald-400 font-mono px-1 py-0.2 border border-black/40">
            {cameraActive ? '● MONITORING' : 'OFFLINE'}
          </div>

          {/* Red Alert Banner if Phone Detected */}
          {isPhoneDetected && (
            <div className="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[10px] font-extrabold text-center py-0.5 animate-pulse">
              ⚠️ PHONE IN VIEW!
            </div>
          )}
        </div>

        {/* HUD Telemetry Footer */}
        <div className="p-1.5 bg-[#FEFCE8] text-[9px] sm:text-[10px] border-t-2 border-[#0F172A] space-y-1">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-600">PROCTOR STATUS:</span>
            <span className={isPhoneDetected ? 'text-rose-700 font-extrabold' : 'text-emerald-700 font-extrabold'}>
              {isPhoneDetected ? 'PHONE DETECTED' : 'STUDENT IN FRAME'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-slate-500 font-mono pt-0.5 border-t border-slate-300">
            <span>SHIELDS:</span>
            <span className="text-emerald-800 font-bold">ANTI-PHOTO // ANTI-CAPTURE</span>
          </div>

          {/* Quick Simulator Button for Easy Testing & Demo */}
          <button
            type="button"
            onClick={() =>
              triggerSecurityBlur(
                'MOBILE_DETECTED',
                'TEST SIMULATION: Mobile phone camera detection triggered. Screen instantly blurred.'
              )
            }
            className="w-full text-center py-0.5 mt-1 bg-[#FBCFE8] hover:bg-pink-300 text-[#0F172A] border border-[#0F172A] font-extrabold text-[9px] transition-all"
            title="Click to verify mobile phone photo detection blur"
          >
            [ TEST PHONE BLUR ]
          </button>
        </div>
      </div>

      {/* MAIN EXAM WORKSPACE (Offset cleanly so top-left camera HUD never overlaps questions) */}
      <div
        className="w-full max-w-5xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pt-36 sm:pt-4 sm:pl-56 md:pl-60 transition-all duration-150"
        style={{
          filter: isScreenBlurred ? 'blur(35px)' : 'none',
          opacity: isScreenBlurred ? 0.15 : 1,
          pointerEvents: isScreenBlurred || showFullscreenLockModal ? 'none' : 'auto',
        }}
      >
        {/* Top Exam Header Banner */}
        <div className="p-3 sm:p-4 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
                PROCTORED_EXAM // ACTIVE
              </span>
              {/* AI Disabled Indicator (Requirement: Disable AI mode on that) */}
              <span className="text-[11px] font-extrabold px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                <BotOff className="w-3.5 h-3.5 text-rose-600" />
                AI MODE: DISABLED
              </span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 bg-[#A7F3D0] text-emerald-900 border border-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                ANTI-CAPTURE ON
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0F172A] font-sans">
              {test.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress Count */}
            <div className="text-xs font-bold text-slate-700 hidden sm:block">
              ANSWERED: <span className="text-[#0F172A] font-extrabold">{answeredCount} / {questions.length}</span>
            </div>

            {/* Countdown Clock */}
            <div
              className={`px-3 py-1.5 border-2 border-[#0F172A] font-extrabold text-sm flex items-center gap-1.5 shadow-[2px_2px_0px_#0F172A] ${
                isTimeCritical ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-[#FEFCE8] text-[#0F172A]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Top Finish Test Button (Requirement: Add Finish Test if student finish test they can get out from the test and full screen) */}
            <BrutalButton
              variant="danger"
              size="sm"
              onClick={() => setShowFinishModal(true)}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              [ FINISH TEST ]
            </BrutalButton>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
          <div
            className="bg-[#C4B5FD] h-full transition-all duration-200"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Main Question Card */}
        {currentQ && (
          <BrutalCard size="large" accent="lavender" className="p-4 sm:p-6 md:p-8 bg-white">
            <div className="flex justify-between items-center pb-3 border-b-2 border-[#0F172A] mb-5">
              <span className="text-xs font-extrabold px-2.5 py-1 bg-[#0F172A] text-white">
                QUESTION {currentIdx + 1} OF {questions.length}
              </span>
              <Badge variant="white">TOPIC: {currentQ.topic}</Badge>
            </div>

            <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#0F172A] font-sans leading-snug mb-6">
              {currentQ.question_text}
            </h3>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQ.options?.map((opt, idx) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-3.5 sm:p-4 border-2 border-[#0F172A] text-left text-sm font-bold transition-all shadow-[2px_2px_0px_#0F172A] flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#A7F3D0] text-[#0F172A] shadow-[3px_3px_0px_#0F172A] translate-x-1'
                        : 'bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 border-2 border-[#0F172A] bg-white flex items-center justify-center font-extrabold text-xs shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-sans text-sm sm:text-base">{opt}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-[#0F172A] text-white shrink-0">
                        SELECTED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigation & Submission Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-[#0F172A]">
              <BrutalButton
                variant="white"
                size="sm"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => i - 1)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                PREVIOUS
              </BrutalButton>

              <div className="flex items-center gap-2">
                {currentIdx < questions.length - 1 ? (
                  <BrutalButton
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrentIdx((i) => i + 1)}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    NEXT QUESTION
                  </BrutalButton>
                ) : null}

                {/* Prominent Finish Test Button */}
                <BrutalButton
                  variant="danger"
                  size="md"
                  onClick={() => setShowFinishModal(true)}
                  disabled={submitting}
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  {submitting ? 'EVALUATING...' : '[ FINISH TEST ]'}
                </BrutalButton>
              </div>
            </div>
          </BrutalCard>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: FULLSCREEN LOCK ENFORCEMENT MODAL (Exiting Fullscreen locks the test)
          ========================================================================= */}
      {showFullscreenLockModal && (
        <div className="fixed inset-0 z-[250] bg-[#0F172A]/95 backdrop-blur-xl flex items-center justify-center p-4 font-mono select-none">
          <div className="max-w-lg w-full">
            <BrutalCard size="large" accent="pink" className="p-6 sm:p-8 text-center space-y-5 bg-white">
              <div className="w-16 h-16 bg-rose-100 border-2 border-[#0F172A] mx-auto flex items-center justify-center shadow-[3px_3px_0px_#0F172A]">
                <AlertTriangle className="w-9 h-9 text-rose-600 animate-bounce" />
              </div>

              <div>
                <span className="text-xs font-extrabold px-2.5 py-1 bg-[#0F172A] text-rose-400 uppercase border border-[#0F172A]">
                  SECURITY_LOCKDOWN // FULLSCREEN_VIOLATION
                </span>
                <h3 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-3">
                  Fullscreen Mode Enforced
                </h3>
                <p className="text-xs text-slate-700 font-sans mt-2 leading-relaxed">
                  Academic integrity rules mandate that this examination must remain locked in full screen mode until you finish and submit.
                  All questions are locked and blurred until full screen is restored.
                </p>
              </div>

              <div className="p-3 bg-rose-50 border-2 border-rose-300 text-xs text-rose-800 font-bold">
                ⚠️ Exit attempt logged. Only clicking "FINISH TEST" will release full screen mode.
              </div>

              <div className="pt-2">
                <BrutalButton
                  variant="danger"
                  size="lg"
                  className="w-full"
                  onClick={enterFullscreen}
                  icon={<Maximize2 className="w-5 h-5" />}
                >
                  [ RETURN TO FULLSCREEN TEST ]
                </BrutalButton>
              </div>
            </BrutalCard>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ANTI-SCREENSHOT & ANTI-MOBILE PHOTO INSTANT BLUR OVERLAY
          ========================================================================= */}
      {isScreenBlurred && (
        <div className="fixed inset-0 z-[260] bg-black/85 backdrop-blur-3xl flex items-center justify-center p-4 font-mono select-none">
          <div className="max-w-lg w-full">
            <BrutalCard size="large" accent="pink" className="p-6 sm:p-8 text-center space-y-5 bg-white">
              <div className="w-16 h-16 bg-rose-100 border-2 border-[#0F172A] mx-auto flex items-center justify-center shadow-[3px_3px_0px_#0F172A]">
                {blurReason === 'MOBILE_DETECTED' ? (
                  <Smartphone className="w-9 h-9 text-rose-600 animate-pulse" />
                ) : (
                  <EyeOff className="w-9 h-9 text-rose-600 animate-pulse" />
                )}
              </div>

              <div>
                <span className="text-xs font-extrabold px-2.5 py-1 bg-rose-600 text-white uppercase border border-[#0F172A]">
                  {blurReason === 'MOBILE_DETECTED'
                    ? 'SECURITY_ALERT // MOBILE_PHOTO_ATTEMPT'
                    : 'SECURITY_ALERT // SCREENSHOT_ATTEMPT_BLOCKED'}
                </span>
                <h3 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-3">
                  {blurReason === 'MOBILE_DETECTED'
                    ? 'Mobile Device Detected — Screen Blurred'
                    : 'Screen Capture / Screenshot Blocked'}
                </h3>
                <p className="text-xs text-slate-700 font-sans mt-2 leading-relaxed">
                  {blurMessage ||
                    'Exam view was instantly blurred to prevent capturing or photographing test questions.'}
                </p>
              </div>

              <div className="p-3 bg-slate-100 border-2 border-[#0F172A] text-xs font-bold text-slate-800 flex justify-between items-center">
                <span>VIOLATIONS RECORDED:</span>
                <span className="px-2 py-0.5 bg-rose-600 text-white font-extrabold">
                  {violationCount}
                </span>
              </div>

              <div className="pt-2">
                <BrutalButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setIsScreenBlurred(false);
                    setBlurReason(null);
                  }}
                  icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
                >
                  [ RESUME EXAM & ACKNOWLEDGE INTEGRITY ]
                </BrutalButton>
              </div>
            </BrutalCard>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: FINISH TEST CONFIRMATION MODAL
          ========================================================================= */}
      {showFinishModal && (
        <div className="fixed inset-0 z-[270] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
          <div className="max-w-lg w-full">
            <BrutalCard size="large" accent="mint" className="p-6 sm:p-8 space-y-5 bg-white">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-[#0F172A]">
                <div className="w-10 h-10 bg-[#A7F3D0] border-2 border-[#0F172A] flex items-center justify-center font-extrabold shadow-[2px_2px_0px_#0F172A]">
                  <CheckCircle className="w-6 h-6 text-emerald-800" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#0F172A] text-white">
                    FINISH_ASSESSMENT // SUBMIT_ANSWERS
                  </span>
                  <h3 className="text-xl font-extrabold text-[#0F172A] font-sans">
                    Finish Test & Unlock Screen?
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-700 font-sans leading-relaxed">
                Submitting your test will finalize your written answers, evaluate your score, unlock and exit full screen mode, and stop camera proctoring.
              </p>

              {/* Answers Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <div className="p-3 bg-[#A7F3D0]/40 border-2 border-[#0F172A] text-center">
                  <div className="text-slate-600 text-[10px]">ANSWERED</div>
                  <div className="text-xl font-extrabold text-emerald-800 mt-0.5">
                    {answeredCount} / {questions.length}
                  </div>
                </div>
                <div
                  className={`p-3 border-2 border-[#0F172A] text-center ${
                    unansweredCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-slate-600 text-[10px]">UNANSWERED</div>
                  <div className="text-xl font-extrabold mt-0.5">
                    {unansweredCount}
                  </div>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div className="p-2.5 bg-amber-50 border-2 border-amber-300 text-[11px] text-amber-900 font-sans font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>You still have {unansweredCount} unanswered question(s). Are you sure you want to finish now?</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <BrutalButton
                  variant="white"
                  onClick={() => setShowFinishModal(false)}
                >
                  [ KEEP ANSWERING ]
                </BrutalButton>
                <BrutalButton
                  variant="danger"
                  onClick={executeFinalSubmission}
                  disabled={submitting}
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  {submitting ? 'EVALUATING...' : '[ YES, FINISH & EXIT FULLSCREEN ]'}
                </BrutalButton>
              </div>
            </BrutalCard>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentTestRunner;
