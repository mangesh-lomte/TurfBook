import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowDown,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Layers,
  Activity,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react';

export interface StadiumScrollSequenceProps {
  totalFrames?: number;
  framePrefix?: string;
  frameDigits?: number;
  frameExtension?: string;
  backgroundColor?: string;
  containerHeight?: string;
  onExploreTurfs?: () => void;
  onHowItWorks?: () => void;
  className?: string;
}

export const StadiumScrollSequence: React.FC<StadiumScrollSequenceProps> = ({
  totalFrames = 50,
  framePrefix = '/frames/frame_',
  frameDigits = 4,
  frameExtension = '.jpg',
  backgroundColor = '#152E1B', // Exact sampled perimeter color: rgb(21, 46, 27)
  containerHeight = '350vh',
  onExploreTurfs,
  onHowItWorks,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Overlay DOM element refs for full 60fps style updates without React re-renders
  const phase1Ref = useRef<HTMLDivElement>(null);
  const phase2Ref = useRef<HTMLDivElement>(null);
  const phase3Ref = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const frameCounterRef = useRef<HTMLSpanElement>(null);
  const waypoint0Ref = useRef<HTMLButtonElement>(null);
  const waypoint1Ref = useRef<HTMLButtonElement>(null);
  const waypoint2Ref = useRef<HTMLButtonElement>(null);
  const waypoint3Ref = useRef<HTMLButtonElement>(null);

  // Frame Cache & Loading State (persisted across renders)
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(totalFrames).fill(null));
  const loadedFlagsRef = useRef<boolean[]>(new Array(totalFrames).fill(false));
  const isCancelledRef = useRef<boolean>(false);

  // Rendering state refs
  const currentDrawnIndexRef = useRef<number>(-1);
  const currentTargetIndexRef = useRef<number>(0);
  const targetProgressRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // React component state (only for initial load status & accessibility toggle)
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isSystemReducedMotion, setIsSystemReducedMotion] = useState(false);
  const [staticFallbackActive, setStaticFallbackActive] = useState(false);

  // Helper to construct frame URL
  const getFrameUrl = useCallback(
    (index: number) => {
      const frameNum = String(index + 1).padStart(frameDigits, '0');
      return `${framePrefix}${frameNum}${frameExtension}`;
    },
    [frameDigits, frameExtension, framePrefix]
  );

  // Detect system prefers-reduced-motion media query
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsSystemReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsSystemReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  // -------------------------------------------------------------
  // CANVAS DRAWING ENGINE (Preserves 16:9 Aspect Ratio & Centers)
  // -------------------------------------------------------------
  const drawFrame = useCallback(
    (targetIndex: number, force = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      if (canvasWidth === 0 || canvasHeight === 0) return;

      // Skip redundant repaints if this frame is already displayed (saves GPU bandwidth)
      if (!force && targetIndex === currentDrawnIndexRef.current) {
        return;
      }

      // Find target image or nearest loaded neighbor
      let img: HTMLImageElement | null = imagesRef.current[targetIndex];
      let actualDrawnIndex = targetIndex;

      if (!img || !loadedFlagsRef.current[targetIndex]) {
        // Search outwards for nearest loaded frame
        let found = false;
        for (let offset = 1; offset < totalFrames; offset++) {
          const prev = targetIndex - offset;
          const next = targetIndex + offset;
          if (prev >= 0 && loadedFlagsRef.current[prev] && imagesRef.current[prev]) {
            img = imagesRef.current[prev];
            actualDrawnIndex = prev;
            found = true;
            break;
          }
          if (next < totalFrames && loadedFlagsRef.current[next] && imagesRef.current[next]) {
            img = imagesRef.current[next];
            actualDrawnIndex = next;
            found = true;
            break;
          }
        }
        if (!found) {
          // If no frame is loaded yet, fill background
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          return;
        }
      }

      // Fill canvas background to eliminate edge seams
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        // Aspect-ratio preserving contain math (1920x1080)
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const scale = Math.min(canvasWidth / naturalWidth, canvasHeight / naturalHeight);

        const drawWidth = Math.round(naturalWidth * scale);
        const drawHeight = Math.round(naturalHeight * scale);
        const drawX = Math.round((canvasWidth - drawWidth) / 2);
        const drawY = Math.round((canvasHeight - drawHeight) / 2);

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        currentDrawnIndexRef.current = actualDrawnIndex;
      }
    },
    [backgroundColor, totalFrames]
  );

  // -------------------------------------------------------------
  // ROBUST PARALLEL IMAGE PRELOADER (Instant scrub + zero blocking)
  // -------------------------------------------------------------
  useEffect(() => {
    isCancelledRef.current = false;
    let successfulCount = 0;

    const preloadImage = (index: number) => {
      if (imagesRef.current[index] && loadedFlagsRef.current[index]) return;

      const img = new Image();
      img.src = getFrameUrl(index);

      img.onload = () => {
        if (isCancelledRef.current) return;
        imagesRef.current[index] = img;
        loadedFlagsRef.current[index] = true;
        successfulCount++;
        setLoadedCount(successfulCount);

        // Immediate first paint
        if (index === 0) {
          setFirstFrameLoaded(true);
          drawFrame(0, true);
        }

        // If user is currently positioned at this frame, redraw immediately
        if (
          currentTargetIndexRef.current === index ||
          currentDrawnIndexRef.current !== currentTargetIndexRef.current
        ) {
          drawFrame(currentTargetIndexRef.current, true);
        }
      };

      img.onerror = () => {
        if (isCancelledRef.current) return;
        loadedFlagsRef.current[index] = false;
        if (successfulCount === 0 && index === 0) {
          setHasError(true);
        }
      };
    };

    // 1. Immediately preload Frame 1 (critical hero visual)
    preloadImage(0);

    // 2. Preload high-priority scrub targets (first 5 frames + final frame 50)
    [1, 2, 3, 4, totalFrames - 1].forEach(preloadImage);

    // 3. Preload keyframe milestones (every 5th frame)
    for (let i = 5; i < totalFrames - 1; i += 5) {
      preloadImage(i);
    }

    // 4. Preload all remaining intermediate frames in parallel
    for (let i = 5; i < totalFrames - 1; i++) {
      if (i % 5 !== 0) {
        preloadImage(i);
      }
    }

    return () => {
      isCancelledRef.current = true;
    };
  }, [drawFrame, getFrameUrl, totalFrames]);

  // -------------------------------------------------------------
  // CANVAS RESIZING & HIGH-DPI SCALING
  // -------------------------------------------------------------
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const sticky = stickyRef.current;
    if (!canvas || !sticky) return;

    const rect = sticky.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const targetWidth = Math.round(rect.width * dpr);
    const targetHeight = Math.round(rect.height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    // Force redraw current target frame after canvas resize
    drawFrame(currentTargetIndexRef.current, true);
  }, [drawFrame]);

  useEffect(() => {
    resizeCanvas();
    const sticky = stickyRef.current;
    if (!sticky) return;

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(sticky);

    window.addEventListener('resize', resizeCanvas, { passive: true });
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  // -------------------------------------------------------------
  // RENDER LOOP & DIRECT DOM STYLE UPDATES (Zero React Re-renders)
  // -------------------------------------------------------------
  const updateOverlays = useCallback(
    (progress: number, frameIndex: number) => {
      // 1. Progress Bar
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${(progress * 100).toFixed(1)}%`;
      }

      // 2. Frame Counter Pill
      if (frameCounterRef.current) {
        frameCounterRef.current.textContent = `${String(frameIndex + 1).padStart(2, '0')} / ${String(
          totalFrames
        ).padStart(2, '0')}`;
      }

      // 3. Phase 1: The Assembled Arena (0.00 <= p <= 0.28)
      if (phase1Ref.current) {
        const p1Opacity = progress < 0.18 ? 1 : Math.max(0, 1 - (progress - 0.18) / 0.1);
        const p1Translate = progress * -50;
        phase1Ref.current.style.opacity = p1Opacity.toFixed(3);
        phase1Ref.current.style.transform = `translateY(${p1Translate.toFixed(1)}px)`;
        phase1Ref.current.style.visibility = p1Opacity > 0 ? 'visible' : 'hidden';
        phase1Ref.current.style.pointerEvents = progress < 0.22 ? 'auto' : 'none';
      }

      // 4. Phase 2: Exploded Stadium Layers (0.30 <= p <= 0.70)
      if (phase2Ref.current) {
        let p2Opacity = 0;
        if (progress >= 0.28 && progress < 0.7) {
          if (progress < 0.38) {
            p2Opacity = (progress - 0.28) / 0.1;
          } else if (progress > 0.6) {
            p2Opacity = 1 - (progress - 0.6) / 0.1;
          } else {
            p2Opacity = 1;
          }
        }
        const p2Translate = (0.48 - progress) * 40;
        phase2Ref.current.style.opacity = p2Opacity.toFixed(3);
        phase2Ref.current.style.transform = `translateY(${p2Translate.toFixed(1)}px)`;
        phase2Ref.current.style.visibility = p2Opacity > 0 ? 'visible' : 'hidden';
        phase2Ref.current.style.pointerEvents = progress >= 0.32 && progress < 0.66 ? 'auto' : 'none';
      }

      // 5. Phase 3: Ready for Kickoff / Hold (0.72 <= p <= 1.00)
      if (phase3Ref.current) {
        let p3Opacity = 0;
        if (progress >= 0.7) {
          p3Opacity = progress < 0.8 ? (progress - 0.7) / 0.1 : 1;
        }
        const p3Translate = Math.max(0, (0.86 - progress) * 50);
        phase3Ref.current.style.opacity = p3Opacity.toFixed(3);
        phase3Ref.current.style.transform = `translateY(${p3Translate.toFixed(1)}px)`;
        phase3Ref.current.style.visibility = p3Opacity > 0 ? 'visible' : 'hidden';
        phase3Ref.current.style.pointerEvents = progress >= 0.74 ? 'auto' : 'none';
      }

      // 6. Right-hand Waypoint Dots active states
      const updateDot = (dot: HTMLButtonElement | null, isActive: boolean) => {
        if (!dot) return;
        if (isActive) {
          dot.className =
            'w-3 h-3 rounded-full bg-[#B9F65A] scale-125 shadow-[0_0_10px_#B9F65A] transition-all cursor-pointer';
        } else {
          dot.className =
            'w-3 h-3 rounded-full bg-[#176443] hover:bg-[#B9F65A]/70 transition-all cursor-pointer';
        }
      };

      updateDot(waypoint0Ref.current, progress < 0.25);
      updateDot(waypoint1Ref.current, progress >= 0.25 && progress < 0.7);
      updateDot(waypoint2Ref.current, progress >= 0.7 && progress < 0.96);
      updateDot(waypoint3Ref.current, progress >= 0.96);
    },
    [totalFrames]
  );

  // -------------------------------------------------------------
  // SCROLL PROGRESS COMPUTATION ENGINE (Exact Specification)
  // progress = clamp((scrollY - sectionStart) / (sectionHeight - viewportHeight), 0, 1)
  // targetFrame = Math.round(progress * (frameCount - 1))
  // -------------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const sectionStart = rect.top + scrollY;
      const sectionHeight = container.offsetHeight;
      const viewportHeight = window.innerHeight;
      const maxScroll = sectionHeight - viewportHeight;

      if (maxScroll <= 0) return;

      const rawProgress = (scrollY - sectionStart) / maxScroll;
      const progress = Math.min(Math.max(rawProgress, 0), 1);
      const targetFrame = Math.round(progress * (totalFrames - 1));

      targetProgressRef.current = progress;
      currentTargetIndexRef.current = targetFrame;

      if (rafIdRef.current === null) {
        rafIdRef.current = window.requestAnimationFrame(() => {
          rafIdRef.current = null;
          const curProgress = targetProgressRef.current;
          const curTarget = currentTargetIndexRef.current;

          // If static mode is explicitly turned on by user, freeze frame to 0
          const frameToDraw = staticFallbackActive ? 0 : curTarget;
          drawFrame(frameToDraw);
          updateOverlays(curProgress, curTarget);
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial evaluation on mount
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [drawFrame, staticFallbackActive, totalFrames, updateOverlays]);

  // Keyboard navigation shortcuts: 1 (Kickoff), 2 (Structure), 3 (Finale), Escape (Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') {
        scrollToProgress(0.0);
      } else if (e.key === '2') {
        scrollToProgress(0.5);
      } else if (e.key === '3') {
        scrollToProgress(0.85);
      } else if (e.key === 'Escape') {
        scrollToProgress(0.0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToProgress = (target: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const sectionStart = container.getBoundingClientRect().top + scrollY;
    const maxScroll = container.offsetHeight - window.innerHeight;
    const targetY = sectionStart + maxScroll * target;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const handleSkipToVenues = () => {
    if (onExploreTurfs) {
      onExploreTurfs();
    } else {
      const el = document.getElementById('venues-discovery');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = '/explore';
      }
    }
  };

  const handleHowItWorksClick = () => {
    if (onHowItWorks) {
      onHowItWorks();
    } else {
      const el = document.getElementById('how-it-works');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        scrollToProgress(0.5);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Google Flow Stadium Deconstruction Animation Sequence"
      style={{ height: containerHeight }}
      className={`relative w-full bg-[#07150F] ${className}`}
    >
      {/* Sticky 100vh Viewport Screen (Pins for the duration of the 350vh scroll distance) */}
      <div
        ref={stickyRef}
        style={{ backgroundColor }}
        className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center"
      >
        {/* ========================================================= */}
        {/* HARDWARE-ACCELERATED CANVAS LAYER                         */}
        {/* ========================================================= */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full block z-0"
        />

        {/* Ambient top and bottom vignettes for seamless blending into #07150F */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#07150F] via-[#07150F]/70 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#07150F] via-[#07150F]/75 to-transparent z-10" />

        {/* Fallback Image Skeleton before frame 1 paints */}
        {!firstFrameLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#152E1B] z-20 transition-opacity duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#B9F65A] border-t-transparent animate-spin" />
              <span className="text-xs font-mono font-bold tracking-wider text-[#D5E2D8] uppercase">
                Preparing Arena Visuals...
              </span>
            </div>
          </div>
        )}

        {/* Error Fallback Graphics if image fails entirely */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B241A] z-20 p-6 text-center">
            <div className="max-w-md p-6 bg-[#07150F] border border-[#176443] rounded-3xl shadow-2xl">
              <Sparkles className="w-8 h-8 text-[#B9F65A] mx-auto mb-3" />
              <h3 className="text-lg font-black text-white uppercase">Championship Sports Arena</h3>
              <p className="text-xs text-[#D5E2D8] mt-2 mb-4 leading-relaxed">
                Experience high-traction certified turfs, floodlit arenas, and instant verified match bookings.
              </p>
              <button
                type="button"
                onClick={handleSkipToVenues}
                className="px-5 py-2.5 bg-gradient-booking text-[#07150F] text-xs font-black rounded-xl cursor-pointer"
              >
                Browse Turfs
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TOP STATUS BAR: CAMPUS BADGE & QUICK SKIP BUTTON         */}
        {/* Positioned top-20 (80px) to clear the sticky 64px Navbar  */}
        {/* ========================================================= */}
        <div className="absolute top-20 left-4 sm:left-8 z-30 flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-full bg-[#0B241A]/90 border border-[#176443]/70 backdrop-blur-md shadow-elevated-dark flex items-center gap-2 text-[10px] sm:text-[11px] text-[#D5E2D8]">
            <span className="w-2 h-2 rounded-full bg-[#B9F65A] animate-pulse" />
            <span className="font-mono font-bold tracking-wider uppercase text-white">Google Flow Stadium</span>
            <span className="text-[#176443] hidden sm:inline">•</span>
            <span className="hidden sm:inline text-xs text-[#B9F65A] font-semibold">1080p Interactive Sequence</span>
          </div>

          {/* Accessibility Indicator & Static Mode Toggle */}
          {isSystemReducedMotion && (
            <button
              type="button"
              onClick={() => setStaticFallbackActive(!staticFallbackActive)}
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-[#123B2A] border border-[#B9F65A]/40 text-[10px] font-mono text-[#B9F65A] flex items-center gap-1.5 hover:bg-[#176443] transition-colors cursor-pointer shadow-md"
              title="Toggle between scroll-driven animation and static fallback mode"
            >
              {staticFallbackActive ? <Play className="w-3 h-3 text-[#B9F65A]" /> : <Pause className="w-3 h-3 text-[#B9F65A]" />}
              <span>{staticFallbackActive ? 'Static Mode Active (Click for Scroll)' : 'Reduced Motion (Click for Static)'}</span>
            </button>
          )}
        </div>

        {/* Top Right Quick Skip Button */}
        <div className="absolute top-20 right-4 sm:right-8 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={handleSkipToVenues}
            className="px-3.5 sm:px-4 py-1.5 rounded-full bg-[#0B241A]/85 hover:bg-[#123B2A] border border-[#176443]/70 backdrop-blur-md text-xs font-bold text-[#D5E2D8] hover:text-[#B9F65A] transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <span>Skip to Venues</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#B9F65A]" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* RIGHT-HAND WAYPOINT NAVIGATION DOTS                       */}
        {/* ========================================================= */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-center gap-3 bg-[#0B241A]/80 p-2.5 rounded-full border border-[#176443]/60 backdrop-blur-md shadow-2xl pointer-events-auto">
          <button
            ref={waypoint0Ref}
            type="button"
            onClick={() => scrollToProgress(0.0)}
            title="Assembled Arena (Key 1)"
            className="w-3 h-3 rounded-full bg-[#B9F65A] scale-125 shadow-[0_0_10px_#B9F65A] transition-all cursor-pointer"
          />
          <button
            ref={waypoint1Ref}
            type="button"
            onClick={() => scrollToProgress(0.5)}
            title="Exploded Layers (Key 2)"
            className="w-3 h-3 rounded-full bg-[#176443] hover:bg-[#B9F65A]/70 transition-all cursor-pointer"
          />
          <button
            ref={waypoint2Ref}
            type="button"
            onClick={() => scrollToProgress(0.85)}
            title="Ready for Kickoff (Key 3)"
            className="w-3 h-3 rounded-full bg-[#176443] hover:bg-[#B9F65A]/70 transition-all cursor-pointer"
          />
          <button
            ref={waypoint3Ref}
            type="button"
            onClick={handleSkipToVenues}
            title="Discover Venues"
            className="w-3 h-3 rounded-full bg-[#176443] hover:bg-[#B9F65A]/70 transition-all cursor-pointer"
          />
        </div>

        {/* ========================================================= */}
        {/* BOTTOM SCRUBBER & FRAME COUNTER BAR                       */}
        {/* ========================================================= */}
        <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 z-30 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span
              ref={frameCounterRef}
              className="px-2.5 py-1 rounded-lg bg-[#0B241A]/85 border border-[#176443]/60 backdrop-blur-md text-[11px] font-mono text-[#B9F65A] font-bold tabular-nums shadow-xs"
            >
              01 / 50
            </span>
            <span className="hidden sm:inline text-[11px] text-[#D5E2D8]/70 font-mono">
              SCROLL DRIVEN DECONSTRUCTION ({loadedCount}/50 FRAMES CACHED)
            </span>
          </div>

          <div className="w-24 sm:w-48 h-1.5 bg-[#0B241A]/80 border border-[#176443]/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              ref={progressBarRef}
              style={{ width: '0%' }}
              className="h-full bg-gradient-to-r from-[#27864F] to-[#B9F65A] transition-[width] duration-75"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* PHASE 1: BEGINNING — THE ASSEMBLED STADIUM (0.00 <= p < 0.28) */}
        {/* pointer-events-none on wrapper so scroll/touch passes through */}
        {/* ========================================================= */}
        <div
          ref={phase1Ref}
          style={{ opacity: 1, transform: 'translateY(0px)', willChange: 'opacity, transform' }}
          className="absolute inset-0 z-20 flex flex-col justify-between p-5 sm:p-10 lg:p-16 pointer-events-none"
        >
          <div className="h-16" />

          {/* Main Hero Storytelling Card */}
          <div className="max-w-xl pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B241A]/90 border border-[#B9F65A]/50 text-xs font-mono font-bold text-[#B9F65A] tracking-wider uppercase mb-3 sm:mb-4 backdrop-blur-md shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#B9F65A]" />
              <span>Championship Sports Complex</span>
            </div>

            {/* Strict Requirement: Opening Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight sm:leading-[1.02] text-white uppercase drop-shadow-2xl pb-1">
              YOUR GAME.{' '}
              <span className="block text-[#B9F65A]">
                YOUR TURF.
              </span>
            </h1>

            {/* Strict Requirement: Supporting Text */}
            <p className="text-sm sm:text-base md:text-lg text-[#D5E2D8] font-normal max-w-md mt-3 sm:mt-4 leading-relaxed drop-shadow-md">
              Find your ground. Pick your time. Play your game.
            </p>

            {/* Strict Requirement: Primary CTA "Explore Turfs" & Secondary CTA "How It Works" */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 mt-5 sm:mt-7">
              <button
                type="button"
                onClick={handleSkipToVenues}
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-gradient-booking hover:brightness-105 text-[#07150F] font-black text-xs sm:text-sm tracking-wide flex items-center gap-2 shadow-lime transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#07150F]" />
                <span>Explore Turfs</span>
                <ArrowRight className="w-4 h-4 text-[#07150F]" />
              </button>

              <button
                type="button"
                onClick={handleHowItWorksClick}
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-[#0B241A]/90 hover:bg-[#123B2A] border border-[#176443] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-elevated-dark flex items-center gap-2 cursor-pointer backdrop-blur-md hover:border-[#B9F65A]/60"
              >
                <Layers className="w-4 h-4 text-[#B9F65A]" />
                <span>How It Works</span>
              </button>
            </div>

            {/* Architectural Trust Proof Badges */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-[#176443]/40 text-[11px] sm:text-xs text-[#D5E2D8]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#B9F65A]" />
                <span>FIFA 50mm Turfs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#B9F65A]" />
                <span>800 Lux Floodlights</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#B9F65A]" />
                <span>Zero Double Bookings</span>
              </div>
            </div>
          </div>

          {/* Bottom Scroll Cue */}
          <div className="flex items-center justify-between pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-[#D5E2D8]/80 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B9F65A] animate-ping" />
              <span>SCROLL TO DECONSTRUCT THE STADIUM</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#D5E2D8]/60 font-mono">
              <span>PRESS 1, 2, 3 FOR QUICK GLIDE</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PHASE 2: MIDDLE — REVEAL THE EXPLODED LAYERS (0.30 <= p < 0.70) */}
        {/* pointer-events-none on wrapper so scroll/touch passes through */}
        {/* ========================================================= */}
        <div
          ref={phase2Ref}
          style={{ opacity: 0, transform: 'translateY(30px)', willChange: 'opacity, transform' }}
          className="absolute inset-0 z-20 flex flex-col justify-end p-5 sm:p-10 lg:p-16 pointer-events-none"
        >
          <div className="max-w-xl bg-[#0B241A]/95 p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#176443]/80 backdrop-blur-xl shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 sm:w-5 h-4 sm:h-5 text-[#B9F65A]" />
                <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#B9F65A]">
                  02 // EXPLODED ARCHITECTURAL MATRIX
                </span>
              </div>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-[#123B2A] border border-[#B9F65A]/40 text-[10px] sm:text-[11px] font-mono text-[#D5E2D8]">
                Deconstructed View
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-tight">
              PRECISION ENGINEERED <span className="text-[#B9F65A]">LAYERS.</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#D5E2D8] mt-2 leading-relaxed font-normal">
              From sub-base drainage and cryogenic rubber infill to 800-lux tournament floodlight grids, explore the engineered layers that power championship match play.
            </p>

            {/* 3 Exploded Layer Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 my-3 sm:my-5">
              <div className="bg-[#07150F]/85 p-2.5 sm:p-3 rounded-xl border border-[#176443]/50">
                <div className="text-[9px] sm:text-[10px] text-[#B9F65A] font-bold uppercase tracking-wider">Layer 01</div>
                <div className="text-xs font-bold text-white mt-0.5">FIFA 50mm Synthetic Turf</div>
                <div className="text-[10px] text-[#D5E2D8]/80 mt-0.5">Cryogenic EPDM infill</div>
              </div>
              <div className="bg-[#07150F]/85 p-2.5 sm:p-3 rounded-xl border border-[#176443]/50">
                <div className="text-[9px] sm:text-[10px] text-[#B9F65A] font-bold uppercase tracking-wider">Layer 02</div>
                <div className="text-xs font-bold text-white mt-0.5">800 Lux Night Floodlights</div>
                <div className="text-[10px] text-[#D5E2D8]/80 mt-0.5">Anti-glare canopy optics</div>
              </div>
              <div className="bg-[#07150F]/85 p-2.5 sm:p-3 rounded-xl border border-[#176443]/50">
                <div className="text-[9px] sm:text-[10px] text-[#B9F65A] font-bold uppercase tracking-wider">Layer 03</div>
                <div className="text-xs font-bold text-[#B9F65A] mt-0.5">Shock-Pad Drainage</div>
                <div className="text-[10px] text-[#D5E2D8]/80 mt-0.5">Monsoon percolation</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleSkipToVenues}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-booking hover:brightness-105 text-[#07150F] text-xs font-black flex items-center gap-1.5 shadow-lime transition-all cursor-pointer"
              >
                <span>Explore Sports Turfs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollToProgress(0.85)}
                className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#07150F]/80 hover:bg-[#123B2A] border border-[#176443] text-xs font-bold text-[#D5E2D8] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Glide to Match Ready</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#B9F65A]" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PHASE 3: END / HOLD — READY FOR KICKOFF (0.72 <= p <= 1.00)*/}
        {/* pointer-events-none on wrapper so scroll/touch passes through */}
        {/* ========================================================= */}
        <div
          ref={phase3Ref}
          style={{ opacity: 0, transform: 'translateY(40px)', willChange: 'opacity, transform' }}
          className="absolute inset-0 z-20 flex flex-col justify-end p-5 sm:p-10 lg:p-16 pointer-events-none"
        >
          <div className="max-w-xl bg-[#0B241A]/95 p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#176443]/80 backdrop-blur-xl shadow-2xl self-start pointer-events-auto">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 sm:w-5 h-4 sm:h-5 text-[#B9F65A]" />
                <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#B9F65A]">
                  03 // MATCH-READY RESERVATIONS
                </span>
              </div>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-[#123B2A] border border-[#B9F65A]/40 text-[10px] sm:text-[11px] font-mono text-[#D5E2D8]">
                Instant Play
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-tight">
              READY FOR <span className="text-[#B9F65A]">KICKOFF.</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#D5E2D8] mt-2 leading-relaxed font-normal">
              Every pitch is verified. Every slot is secured with mathematical PostgreSQL GiST exclusion guarantee. Zero collision, instant match play confirmation.
            </p>

            {/* Concurrency & Engine Guarantees */}
            <div className="grid grid-cols-3 gap-2 text-center my-3 sm:my-4 bg-[#07150F]/70 p-2.5 sm:p-3 rounded-xl border border-[#176443]/40">
              <div>
                <div className="text-xs sm:text-sm font-black text-[#B9F65A] font-mono">100%</div>
                <div className="text-[9px] sm:text-[10px] text-[#D5E2D8] mt-0.5">GiST Locked</div>
              </div>
              <div className="border-x border-[#176443]/40">
                <div className="text-xs sm:text-sm font-black text-white font-mono">&lt; 200ms</div>
                <div className="text-[9px] sm:text-[10px] text-[#D5E2D8] mt-0.5">Slot Engine</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-[#B9F65A]">Instant</div>
                <div className="text-[9px] sm:text-[10px] text-[#D5E2D8] mt-0.5">Confirmation</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleSkipToVenues}
                className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-booking hover:brightness-105 text-[#07150F] text-xs font-black flex items-center justify-center gap-1.5 shadow-lime transition-all cursor-pointer"
              >
                <Compass className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#07150F]" />
                <span>Find Your Pitch Now</span>
                <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </button>

              <button
                type="button"
                onClick={handleHowItWorksClick}
                className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#07150F]/80 hover:bg-[#123B2A] border border-[#176443] text-xs font-bold text-[#D5E2D8] transition-colors cursor-pointer"
              >
                How It Works
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
