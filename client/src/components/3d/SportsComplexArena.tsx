import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Compass,
  Moon,
  Sun,
  Eye,
  ArrowRight,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type SportFacilityType = 'football' | 'cricket' | 'basketball' | null;

interface SportsComplexArenaProps {
  onFacilityClick?: (facility: SportFacilityType) => void;
  selectedFacility?: SportFacilityType;
  className?: string;
}

interface FacilityInfo {
  id: SportFacilityType;
  name: string;
  tagline: string;
  specs: string;
  lighting: string;
  capacity: string;
  exploreParam: string;
}

const FACILITY_DATA: Record<string, FacilityInfo> = {
  football: {
    id: 'football',
    name: 'Championship Football Turf',
    tagline: 'FIFA Quality Pro 50mm monofilament artificial turf with shock-pad underlay',
    specs: '38m × 26m • 7v7 / 5v5 Match Play',
    lighting: '800 Lux Night Match Floodlighting',
    capacity: '10–14 Players',
    exploreParam: 'football',
  },
  cricket: {
    id: 'cricket',
    name: 'Enclosed Box Cricket Cage',
    tagline: 'High-tensile UV nylon safety netting with dual-tone AstroTurf batting pitch',
    specs: '26m × 14m • Steel Truss Enclosure',
    lighting: '650 Lux High-Uniformity Canopy Lights',
    capacity: '8–12 Players',
    exploreParam: 'cricket',
  },
  basketball: {
    id: 'basketball',
    name: 'FIBA Acrylic Basketball Court',
    tagline: '8-layer cushioned acrylic court with tempered safety glass backboards and spring rims',
    specs: '24m × 15m • FIBA Standard Regulation',
    lighting: '750 Lux Glare-Free Court Illuminance',
    capacity: '10 Players (5v5 Full Court)',
    exploreParam: 'basketball',
  },
};

export const SportsComplexArena: React.FC<SportsComplexArenaProps> = ({
  onFacilityClick,
  selectedFacility: externalSelected,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [activeFacility, setActiveFacility] = useState<SportFacilityType>(null);
  const [hoveredFacility, setHoveredFacility] = useState<SportFacilityType>(null);
  const [isNightMode, setIsNightMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [webGlError, setWebGlError] = useState<string | null>(null);
  const [activeCameraView, setActiveCameraView] = useState<'overview' | 'football' | 'cricket' | 'basketball'>('overview');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Stable references for Three.js state and callbacks
  const onFacilityClickRef = useRef(onFacilityClick);
  useEffect(() => {
    onFacilityClickRef.current = onFacilityClick;
  }, [onFacilityClick]);

  const controllerRef = useRef<{
    setView: (view: 'overview' | 'football' | 'cricket' | 'basketball') => void;
    setNightMode: (night: boolean) => void;
    setSelected: (fac: SportFacilityType) => void;
  } | null>(null);

  // Sync external selection prop
  useEffect(() => {
    if (externalSelected !== undefined) {
      setActiveFacility(externalSelected);
      if (externalSelected && controllerRef.current) {
        controllerRef.current.setView(externalSelected);
      } else if (!externalSelected && controllerRef.current) {
        controllerRef.current.setView('overview');
      }
    }
  }, [externalSelected]);

  const handleViewChange = useCallback((view: 'overview' | 'football' | 'cricket' | 'basketball') => {
    setActiveCameraView(view);
    const fac = view === 'overview' ? null : (view as SportFacilityType);
    setActiveFacility(fac);
    if (controllerRef.current) {
      controllerRef.current.setView(view);
    }
    if (onFacilityClickRef.current) {
      onFacilityClickRef.current(fac);
    }
  }, []);

  const toggleLighting = useCallback(() => {
    setIsNightMode((prev) => {
      const next = !prev;
      if (controllerRef.current) {
        controllerRef.current.setNightMode(next);
      }
      return next;
    });
  }, []);

  // -------------------------------------------------------------
  // THREE.JS SCENE INITIALIZATION (Runs once on mount)
  // -------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    const checkWebGL = (): boolean => {
      try {
        const testCanvas = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
        );
      } catch {
        return false;
      }
    };

    if (!checkWebGL()) {
      setWebGlError('WebGL is not supported or hardware accelerated on your device.');
      setIsLoading(false);
      return;
    }

    let animationFrameId = 0;
    let isDisposed = false;
    let isContextLost = false;

    // Setup initial dimensions (protect against 0 dimensions)
    const initialWidth = Math.max(container.clientWidth || 640, 320);
    const initialHeight = Math.max(container.clientHeight || 560, 400);

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07150f);
    scene.fog = new THREE.FogExp2(0x07150f, 0.009);

    const camera = new THREE.PerspectiveCamera(38, initialWidth / initialHeight, 0.5, 350);
    const defaultCamPos = new THREE.Vector3(0, 38, 44);
    camera.position.copy(defaultCamPos);

    // --- WebGL Renderer ---
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
      });
    } catch (err: any) {
      setWebGlError(err?.message || 'Failed to initialize WebGL renderer.');
      setIsLoading(false);
      return;
    }

    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    // Dispose tracker to avoid GPU leaks
    const disposables: {
      geometries: THREE.BufferGeometry[];
      materials: THREE.Material[];
      textures: THREE.Texture[];
    } = {
      geometries: [],
      materials: [],
      textures: [],
    };

    const trackGeometry = <T extends THREE.BufferGeometry>(geo: T): T => {
      disposables.geometries.push(geo);
      return geo;
    };
    const trackMaterial = <T extends THREE.Material>(mat: T): T => {
      disposables.materials.push(mat);
      return mat;
    };
    const trackTexture = <T extends THREE.Texture>(tex: T): T => {
      disposables.textures.push(tex);
      return tex;
    };

    // --- Procedural Canvas Texture Generators ---

    // 1. Realistic Football Turf Texture (Monofilament fiber with alternating mowing stripes)
    const createFootballGrassTexture = (): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;

      // Base emerald dark turf
      ctx.fillStyle = '#10331F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Alternating 16 lawn-mowing stripes
      const stripes = 16;
      const stripeW = canvas.width / stripes;
      for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#144329' : '#1A5333';
        ctx.fillRect(i * stripeW, 0, stripeW, canvas.height);

        // Subtle gradient within stripe for realistic light reflection
        const grad = ctx.createLinearGradient(i * stripeW, 0, (i + 1) * stripeW, 0);
        grad.addColorStop(0, 'rgba(0,0,0,0.06)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
        grad.addColorStop(1, 'rgba(0,0,0,0.06)');
        ctx.fillStyle = grad;
        ctx.fillRect(i * stripeW, 0, stripeW, canvas.height);
      }

      // Micro synthetic fiber grain & rubber infill specks
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let p = 0; p < data.length; p += 4) {
        if (Math.random() < 0.22) {
          const noise = (Math.random() - 0.5) * 16;
          data[p] = Math.max(0, Math.min(255, data[p] + noise));
          data[p + 1] = Math.max(0, Math.min(255, data[p + 1] + noise * 1.2));
          data[p + 2] = Math.max(0, Math.min(255, data[p + 2] + noise * 0.8));
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // Regulation Pitch Markings (Crisp white lines)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      const m = 32; // boundary margin

      // Perimeter Touchlines & Goal-lines
      ctx.strokeRect(m, m, canvas.width - 2 * m, canvas.height - 2 * m);

      // Halfway line
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, m);
      ctx.lineTo(canvas.width / 2, canvas.height - m);
      ctx.stroke();

      // Center Circle & Center Spot
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 7, 0, Math.PI * 2);
      ctx.fill();

      // Left Penalty Box & Goal Area
      ctx.strokeRect(m, canvas.height / 2 - 160, 150, 320);
      ctx.strokeRect(m, canvas.height / 2 - 75, 55, 150);
      // Left Penalty Spot & Arc
      ctx.beginPath();
      ctx.arc(m + 110, canvas.height / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(m + 110, canvas.height / 2, 70, -Math.PI / 3.4, Math.PI / 3.4);
      ctx.stroke();

      // Right Penalty Box & Goal Area
      ctx.strokeRect(canvas.width - m - 150, canvas.height / 2 - 160, 150, 320);
      ctx.strokeRect(canvas.width - m - 55, canvas.height / 2 - 75, 55, 150);
      // Right Penalty Spot & Arc
      ctx.beginPath();
      ctx.arc(canvas.width - m - 110, canvas.height / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvas.width - m - 110, canvas.height / 2, 70, Math.PI - Math.PI / 3.4, Math.PI + Math.PI / 3.4);
      ctx.stroke();

      // Corner Arcs
      const cornerR = 24;
      ctx.beginPath();
      ctx.arc(m, m, cornerR, 0, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(m, canvas.height - m, cornerR, -Math.PI / 2, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(canvas.width - m, m, cornerR, Math.PI / 2, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(canvas.width - m, canvas.height - m, cornerR, Math.PI, Math.PI * 1.5);
      ctx.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return trackTexture(texture);
    };

    // 2. Realistic Cricket Pitch & AstroTurf Texture
    const createCricketTurfTexture = (): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;

      // Outer AstroTurf
      ctx.fillStyle = '#164327';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle grass stripe texture
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.fillStyle = y % 80 === 0 ? '#194A2B' : '#143E23';
        ctx.fillRect(0, y, canvas.width, 40);
      }

      // Central Rolled Clay / Fiber Pitch Strip (22 yards proportional)
      const pitchW = 140;
      const pitchH = 780;
      const pitchX = (canvas.width - pitchW) / 2;
      const pitchY = (canvas.height - pitchH) / 2;

      // Pitch gradient: dry rolled loam clay with slight tan-fiber tone
      const pitchGrad = ctx.createLinearGradient(pitchX, pitchY, pitchX + pitchW, pitchY + pitchH);
      pitchGrad.addColorStop(0, '#BCA274');
      pitchGrad.addColorStop(0.5, '#AF9567');
      pitchGrad.addColorStop(1, '#B59B6D');
      ctx.fillStyle = pitchGrad;
      ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

      // Pitch roller marks & wear pattern
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      for (let y = pitchY; y < pitchY + pitchH; y += 14) {
        ctx.fillRect(pitchX, y, pitchW, 5);
      }
      // Worn footmark patches near bowling crease
      ctx.fillStyle = 'rgba(120, 95, 60, 0.25)';
      ctx.beginPath();
      ctx.ellipse(pitchX + pitchW / 2, pitchY + 80, 40, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(pitchX + pitchW / 2, pitchY + pitchH - 80, 40, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Regulation White Creases
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;

      // Top Creases (Bowling, Popping, Return)
      ctx.beginPath();
      // Popping crease (4ft in front of bowling crease)
      ctx.moveTo(pitchX - 16, pitchY + 80);
      ctx.lineTo(pitchX + pitchW + 16, pitchY + 80);
      // Bowling crease
      ctx.moveTo(pitchX + 15, pitchY + 36);
      ctx.lineTo(pitchX + pitchW - 15, pitchY + 36);
      // Return creases
      ctx.moveTo(pitchX + 15, pitchY + 36);
      ctx.lineTo(pitchX + 15, pitchY + 80);
      ctx.moveTo(pitchX + pitchW - 15, pitchY + 36);
      ctx.lineTo(pitchX + pitchW - 15, pitchY + 80);
      ctx.stroke();

      // Bottom Creases (Bowling, Popping, Return)
      ctx.beginPath();
      ctx.moveTo(pitchX - 16, pitchY + pitchH - 80);
      ctx.lineTo(pitchX + pitchW + 16, pitchY + pitchH - 80);
      ctx.moveTo(pitchX + 15, pitchY + pitchH - 36);
      ctx.lineTo(pitchX + pitchW - 15, pitchY + pitchH - 36);
      ctx.moveTo(pitchX + 15, pitchY + pitchH - 80);
      ctx.lineTo(pitchX + 15, pitchY + pitchH - 36);
      ctx.moveTo(pitchX + pitchW - 15, pitchY + pitchH - 80);
      ctx.lineTo(pitchX + pitchW - 15, pitchY + pitchH - 36);
      ctx.stroke();

      // Outer boundary ring line
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

      const texture = new THREE.CanvasTexture(canvas);
      return trackTexture(texture);
    };

    // 3. FIBA Regulation Basketball Court Texture (Dual-tone cushioned acrylic)
    const createBasketballCourtTexture = (): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 640;
      const ctx = canvas.getContext('2d')!;

      // Outer Run-off Buffer (Deep charcoal navy)
      ctx.fillStyle = '#0F212E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pad = 36;
      const courtW = canvas.width - pad * 2;
      const courtH = canvas.height - pad * 2;

      // Playing Field Interior (Championship Forest Green)
      ctx.fillStyle = '#17523F';
      ctx.fillRect(pad, pad, courtW, courtH);

      // Key Lanes & Restrictive Area (Terracotta / Burnt Sienna)
      const keyW = 160;
      const keyH = 175;
      ctx.fillStyle = '#8F3E29';
      ctx.fillRect(pad, canvas.height / 2 - keyH / 2, keyW, keyH);
      ctx.fillRect(canvas.width - pad - keyW, canvas.height / 2 - keyH / 2, keyW, keyH);

      // Center Circle Interior
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 72, 0, Math.PI * 2);
      ctx.fillStyle = '#8F3E29';
      ctx.fill();

      // Regulation Crisp White Markings
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;

      // Perimeter Court Boundary
      ctx.strokeRect(pad, pad, courtW, courtH);

      // Center Line & Center Circle
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, pad);
      ctx.lineTo(canvas.width / 2, canvas.height - pad);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 72, 0, Math.PI * 2);
      ctx.stroke();

      // Free-throw circles
      ctx.beginPath();
      ctx.arc(pad + keyW, canvas.height / 2, 72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(canvas.width - pad - keyW, canvas.height / 2, 72, 0, Math.PI * 2);
      ctx.stroke();

      // Key Lane Borders
      ctx.strokeRect(pad, canvas.height / 2 - keyH / 2, keyW, keyH);
      ctx.strokeRect(canvas.width - pad - keyW, canvas.height / 2 - keyH / 2, keyW, keyH);

      // 3-Point Arcs (FIBA 6.75m scale)
      ctx.beginPath();
      ctx.arc(pad + 40, canvas.height / 2, 205, -Math.PI / 2.75, Math.PI / 2.75);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(canvas.width - pad - 40, canvas.height / 2, 205, Math.PI - Math.PI / 2.75, Math.PI + Math.PI / 2.75);
      ctx.stroke();

      // No-charge semi-circles under the hoop
      ctx.beginPath();
      ctx.arc(pad + 50, canvas.height / 2, 45, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(canvas.width - pad - 50, canvas.height / 2, 45, Math.PI / 2, Math.PI * 1.5);
      ctx.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      return trackTexture(texture);
    };

    // 4. Procedural Netting Texture for Cricket Cage & Goalposts
    const createNetGridTexture = (): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#B5D8C3';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(24, 12);
      return trackTexture(texture);
    };

    // --- Lighting Architecture ---
    const ambientLight = trackMaterial(new THREE.AmbientLight(0x0e281e, 0.65) as any);
    scene.add(ambientLight);

    // Directional Sunlight / Moonlight
    const dirLight = new THREE.DirectionalLight(0x84a99b, 0.85);
    dirLight.position.set(28, 48, 32);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 5;
    dirLight.shadow.camera.far = 130;
    dirLight.shadow.camera.left = -45;
    dirLight.shadow.camera.right = 45;
    dirLight.shadow.camera.top = 45;
    dirLight.shadow.camera.bottom = -45;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    // Ground ambient bounce light
    const hemiLight = new THREE.HemisphereLight(0x1a4030, 0x07150f, 0.4);
    scene.add(hemiLight);

    const floodlights: THREE.SpotLight[] = [];
    const floodlightLamps: THREE.Mesh[] = [];

    // --- Master Base Ground & Walkway Network ---
    const groundGeo = trackGeometry(new THREE.PlaneGeometry(96, 84));
    const groundMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x07150f,
        roughness: 0.95,
        metalness: 0.05,
      })
    );
    const mainGround = new THREE.Mesh(groundGeo, groundMat);
    mainGround.rotation.x = -Math.PI / 2;
    mainGround.position.y = -0.06;
    mainGround.receiveShadow = true;
    scene.add(mainGround);

    // Hardscaped Asphalt Walkways & Curbs
    const walkwayGeo = trackGeometry(new THREE.PlaneGeometry(86, 74));
    const walkwayMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x12241b,
        roughness: 0.88,
        metalness: 0.08,
      })
    );
    const walkway = new THREE.Mesh(walkwayGeo, walkwayMat);
    walkway.rotation.x = -Math.PI / 2;
    walkway.position.y = -0.03;
    walkway.receiveShadow = true;
    scene.add(walkway);

    // Concrete curb trim around walkway
    const curbMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x223a2e, roughness: 0.7 }));
    const curbGeo = trackGeometry(new THREE.BoxGeometry(86.4, 0.1, 0.4));
    const curb1 = new THREE.Mesh(curbGeo, curbMat);
    curb1.position.set(0, 0.02, 37);
    const curb2 = new THREE.Mesh(curbGeo, curbMat);
    curb2.position.set(0, 0.02, -37);
    scene.add(curb1, curb2);

    // Architectural LED Light Ribbon along walkways (Electric Lime Accent)
    const ledMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xb9f65a,
        transparent: true,
        opacity: 0.85,
      })
    );
    const ledGeo = trackGeometry(new THREE.BoxGeometry(0.15, 0.04, 70));
    const ledStrip1 = new THREE.Mesh(ledGeo, ledMat);
    ledStrip1.position.set(-1.5, 0.02, 0);
    const ledStrip2 = new THREE.Mesh(ledGeo, ledMat);
    ledStrip2.position.set(1.5, 0.02, 0);
    scene.add(ledStrip1, ledStrip2);

    // Interactive Raycasting & Highlight Tracker
    const highlightMeshes: Record<string, THREE.Mesh> = {};
    const interactiveMeshes: THREE.Object3D[] = [];

    // Helper: Create animated electric lime perimeter highlight ribbon
    const createPerimeterHighlight = (w: number, d: number, name: string): THREE.Mesh => {
      const geo = trackGeometry(new THREE.PlaneGeometry(w + 0.8, d + 0.8));
      const mat = trackMaterial(
        new THREE.MeshBasicMaterial({
          color: 0xb9f65a,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
        })
      );
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.04;
      mesh.name = `${name}_highlight`;
      highlightMeshes[name] = mesh;
      return mesh;
    };

    // =========================================================
    // 1. FOOTBALL ARENA (Left Side / West Field)
    // =========================================================
    const footballGroup = new THREE.Group();
    footballGroup.position.set(-18, 0, 0);

    const footballW = 26;
    const footballL = 38;

    const fbGeo = trackGeometry(new THREE.PlaneGeometry(footballW, footballL));
    const fbMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        map: createFootballGrassTexture(),
        roughness: 0.78,
        metalness: 0.04,
      })
    );
    const footballPitch = new THREE.Mesh(fbGeo, fbMat);
    footballPitch.rotation.x = -Math.PI / 2;
    footballPitch.position.y = 0.02;
    footballPitch.receiveShadow = true;
    footballPitch.userData = { facility: 'football', title: 'FIFA Quality Artificial Turf' };
    footballGroup.add(footballPitch);
    interactiveMeshes.push(footballPitch);

    const fbHighlight = createPerimeterHighlight(footballW, footballL, 'football');
    footballGroup.add(fbHighlight);

    // Goalposts (Professional white steel tubes with realistic catenary netting)
    const goalPostMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.2 }));
    const goalNetMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        map: createNetGridTexture(),
        transparent: true,
        opacity: 0.55,
        roughness: 0.6,
        side: THREE.DoubleSide,
      })
    );

    const createRealisticGoal = (zPos: number, isFlipped: boolean): THREE.Group => {
      const goal = new THREE.Group();
      const r = 0.08;
      const w = 4.8;
      const h = 2.1;
      const depth = 1.6;

      // Vertical Uprights
      const postGeo = trackGeometry(new THREE.CylinderGeometry(r, r, h, 16));
      const postL = new THREE.Mesh(postGeo, goalPostMat);
      postL.position.set(-w / 2, h / 2, 0);
      postL.castShadow = true;
      const postR = new THREE.Mesh(postGeo, goalPostMat);
      postR.position.set(w / 2, h / 2, 0);
      postR.castShadow = true;
      goal.add(postL, postR);

      // Top Crossbar
      const barGeo = trackGeometry(new THREE.CylinderGeometry(r, r, w, 16));
      const bar = new THREE.Mesh(barGeo, goalPostMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, h, 0);
      bar.castShadow = true;
      goal.add(bar);

      // Rear Ground Stanchions (D-shape support frame)
      const rearZ = isFlipped ? depth : -depth;
      const rearBar = new THREE.Mesh(barGeo, goalPostMat);
      rearBar.rotation.z = Math.PI / 2;
      rearBar.position.set(0, 0.05, rearZ);
      goal.add(rearBar);

      // Angled Upper Net Support Arms
      const armLength = Math.sqrt(h * h + depth * depth);
      const armGeo = trackGeometry(new THREE.CylinderGeometry(0.04, 0.04, armLength, 12));
      const armL = new THREE.Mesh(armGeo, goalPostMat);
      armL.position.set(-w / 2, h / 2, rearZ / 2);
      armL.rotation.x = isFlipped ? Math.atan2(depth, h) : -Math.atan2(depth, h);
      const armR = new THREE.Mesh(armGeo, goalPostMat);
      armR.position.set(w / 2, h / 2, rearZ / 2);
      armR.rotation.x = armL.rotation.x;
      goal.add(armL, armR);

      // Realistic Sloped Net Box
      const netBoxGeo = trackGeometry(new THREE.BoxGeometry(w, h, depth));
      const netMesh = new THREE.Mesh(netBoxGeo, goalNetMat);
      netMesh.position.set(0, h / 2, rearZ / 2);
      goal.add(netMesh);

      goal.position.set(0, 0, zPos);
      return goal;
    };

    footballGroup.add(createRealisticGoal(-footballL / 2 + 0.6, false));
    footballGroup.add(createRealisticGoal(footballL / 2 - 0.6, true));

    // Corner Flags
    const flagPoleMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
    const flagClothMat = trackMaterial(new THREE.MeshBasicMaterial({ color: 0xb9f65a, side: THREE.DoubleSide }));
    const flagCoords: [number, number][] = [
      [-footballW / 2 + 0.3, -footballL / 2 + 0.3],
      [footballW / 2 - 0.3, -footballL / 2 + 0.3],
      [-footballW / 2 + 0.3, footballL / 2 - 0.3],
      [footballW / 2 - 0.3, footballL / 2 - 0.3],
    ];
    flagCoords.forEach(([x, z]) => {
      const pole = new THREE.Mesh(trackGeometry(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8)), flagPoleMat);
      pole.position.set(x, 0.7, z);
      pole.castShadow = true;
      const flag = new THREE.Mesh(trackGeometry(new THREE.PlaneGeometry(0.35, 0.22)), flagClothMat);
      flag.position.set(x + 0.18, 1.25, z);
      footballGroup.add(pole, flag);
    });

    // Team Dugout Benches (Covered acrylic canopy with molded bucket seats)
    const dugoutMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x0b241a, roughness: 0.4, metalness: 0.6 }));
    const canopyMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x123b2a,
        transparent: true,
        opacity: 0.65,
        roughness: 0.15,
      })
    );
    const seatMatLime = trackMaterial(new THREE.MeshStandardMaterial({ color: 0xb9f65a, roughness: 0.3 }));
    const seatMatGreen = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x176443, roughness: 0.3 }));

    const createDugout = (zPos: number): THREE.Group => {
      const dugout = new THREE.Group();
      // Base platform
      const base = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(4.2, 0.15, 1.4)), dugoutMat);
      base.position.set(0, 0.08, 0);
      dugout.add(base);

      // Back frame & Curved canopy
      const frame = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(4.2, 1.6, 0.06)), dugoutMat);
      frame.position.set(0, 0.9, -0.65);
      const canopy = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(4.3, 0.08, 1.5)), canopyMat);
      canopy.position.set(0, 1.7, 0);
      canopy.castShadow = true;
      dugout.add(frame, canopy);

      // 6 Molded Seats
      for (let s = -2.5; s <= 2.5; s += 1.0) {
        const seat = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(0.35, 0.35, 0.35)), s % 2 === 0 ? seatMatLime : seatMatGreen);
        seat.position.set(s * 0.65, 0.35, -0.15);
        seat.castShadow = true;
        dugout.add(seat);
      }

      dugout.position.set(-footballW / 2 - 1.6, 0, zPos);
      return dugout;
    };

    footballGroup.add(createDugout(-4));
    footballGroup.add(createDugout(4));

    scene.add(footballGroup);

    // =========================================================
    // 2. ENCLOSED BOX CRICKET ARENA (Top-Right / North-East)
    // =========================================================
    const cricketGroup = new THREE.Group();
    cricketGroup.position.set(17, 0, 8);

    const cricketW = 14;
    const cricketL = 26;

    const crGeo = trackGeometry(new THREE.PlaneGeometry(cricketW, cricketL));
    const crMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        map: createCricketTurfTexture(),
        roughness: 0.74,
        metalness: 0.04,
      })
    );
    const cricketPitch = new THREE.Mesh(crGeo, crMat);
    cricketPitch.rotation.x = -Math.PI / 2;
    cricketPitch.position.y = 0.02;
    cricketPitch.receiveShadow = true;
    cricketPitch.userData = { facility: 'cricket', title: 'High-Tensile Box Cricket Arena' };
    cricketGroup.add(cricketPitch);
    interactiveMeshes.push(cricketPitch);

    const crHighlight = createPerimeterHighlight(cricketW, cricketL, 'cricket');
    cricketGroup.add(crHighlight);

    // Architectural Structural Truss Cage & Heavy-Duty Netting
    const cageHeight = 6.0;
    const trussMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x22362a, metalness: 0.85, roughness: 0.25 }));
    const cageNetMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        map: createNetGridTexture(),
        color: 0x5a886f,
        transparent: true,
        opacity: 0.28,
        roughness: 0.5,
        side: THREE.DoubleSide,
      })
    );

    // Translucent Netting Walls (Box shell)
    const boxCageGeo = trackGeometry(new THREE.BoxGeometry(cricketW, cageHeight, cricketL));
    const boxCage = new THREE.Mesh(boxCageGeo, cageNetMat);
    boxCage.position.y = cageHeight / 2;
    cricketGroup.add(boxCage);

    // Structural Tubular Steel Columns (6 primary support pillars)
    const poleGeo = trackGeometry(new THREE.CylinderGeometry(0.1, 0.1, cageHeight, 16));
    const cageColumns: [number, number][] = [
      [-cricketW / 2, -cricketL / 2],
      [cricketW / 2, -cricketL / 2],
      [-cricketW / 2, cricketL / 2],
      [cricketW / 2, cricketL / 2],
      [-cricketW / 2, 0],
      [cricketW / 2, 0],
    ];

    cageColumns.forEach(([x, z]) => {
      const col = new THREE.Mesh(poleGeo, trussMat);
      col.position.set(x, cageHeight / 2, z);
      col.castShadow = true;
      cricketGroup.add(col);
    });

    // Perimeter Roof Tie Beams
    const roofBeamLong = trackGeometry(new THREE.BoxGeometry(0.12, 0.12, cricketL));
    const beamL1 = new THREE.Mesh(roofBeamLong, trussMat);
    beamL1.position.set(-cricketW / 2, cageHeight, 0);
    const beamL2 = new THREE.Mesh(roofBeamLong, trussMat);
    beamL2.position.set(cricketW / 2, cageHeight, 0);
    cricketGroup.add(beamL1, beamL2);

    const roofBeamCross = trackGeometry(new THREE.BoxGeometry(cricketW, 0.12, 0.12));
    const beamC1 = new THREE.Mesh(roofBeamCross, trussMat);
    beamC1.position.set(0, cageHeight, -cricketL / 2);
    const beamC2 = new THREE.Mesh(roofBeamCross, trussMat);
    beamC2.position.set(0, cageHeight, cricketL / 2);
    const beamC3 = new THREE.Mesh(roofBeamCross, trussMat);
    beamC3.position.set(0, cageHeight, 0);
    cricketGroup.add(beamC1, beamC2, beamC3);

    // Safety Impact Padding around interior cage base
    const padMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x0b241a, roughness: 0.5 }));
    const padBorderGeo = trackGeometry(new THREE.BoxGeometry(cricketW + 0.2, 0.45, 0.18));
    const padSouth = new THREE.Mesh(padBorderGeo, padMat);
    padSouth.position.set(0, 0.25, cricketL / 2);
    const padNorth = new THREE.Mesh(padBorderGeo, padMat);
    padNorth.position.set(0, 0.25, -cricketL / 2);
    cricketGroup.add(padSouth, padNorth);

    // Realistic Cricket Wickets, Bails & Equipment
    const woodMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.4 }));
    const leatherBallMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x9b1b1b, roughness: 0.2 }));

    const createWickets = (zPos: number): THREE.Group => {
      const g = new THREE.Group();
      // 3 Stumps
      for (let i = -1; i <= 1; i++) {
        const s = new THREE.Mesh(trackGeometry(new THREE.CylinderGeometry(0.028, 0.028, 0.74, 12)), woodMat);
        s.position.set(i * 0.11, 0.37, 0);
        s.castShadow = true;
        g.add(s);
      }
      // Top Cross Bails
      const bail = new THREE.Mesh(trackGeometry(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8)), woodMat);
      bail.rotation.z = Math.PI / 2;
      bail.position.set(0, 0.75, 0);
      g.add(bail);

      g.position.set(0, 0, zPos);
      return g;
    };

    cricketGroup.add(createWickets(-8.8));
    cricketGroup.add(createWickets(8.8));

    // Cricket Bat propped near non-striker wicket
    const batGroup = new THREE.Group();
    const batBlade = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(0.12, 0.6, 0.03)), woodMat);
    batBlade.position.set(0, 0.3, 0);
    batBlade.castShadow = true;
    const batHandle = new THREE.Mesh(trackGeometry(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8)), trackMaterial(new THREE.MeshStandardMaterial({ color: 0xb9f65a })));
    batHandle.position.set(0, 0.7, 0);
    batGroup.add(batBlade, batHandle);
    batGroup.rotation.z = 0.25;
    batGroup.rotation.x = -0.2;
    batGroup.position.set(0.6, 0, -8.7);
    cricketGroup.add(batGroup);

    // Red Cricket Match Ball on the pitch
    const ballMesh = new THREE.Mesh(trackGeometry(new THREE.SphereGeometry(0.05, 16, 16)), leatherBallMat);
    ballMesh.position.set(-0.25, 0.05, -2);
    ballMesh.castShadow = true;
    cricketGroup.add(ballMesh);

    scene.add(cricketGroup);

    // =========================================================
    // 3. BASKETBALL COURT (Bottom-Right / South-East)
    // =========================================================
    const basketballGroup = new THREE.Group();
    basketballGroup.position.set(17, 0, -16);

    const bbW = 15;
    const bbL = 24;

    const bbGeo = trackGeometry(new THREE.PlaneGeometry(bbW, bbL));
    const bbMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        map: createBasketballCourtTexture(),
        roughness: 0.52,
        metalness: 0.08,
      })
    );
    const basketballCourt = new THREE.Mesh(bbGeo, bbMat);
    basketballCourt.rotation.x = -Math.PI / 2;
    basketballCourt.position.y = 0.02;
    basketballCourt.receiveShadow = true;
    basketballCourt.userData = { facility: 'basketball', title: 'FIBA Regulation Acrylic Court' };
    basketballGroup.add(basketballCourt);
    interactiveMeshes.push(basketballCourt);

    const bbHighlight = createPerimeterHighlight(bbW, bbL, 'basketball');
    basketballGroup.add(bbHighlight);

    // Professional Heavy-Duty Cantilevered Basketball Hoops
    const stanchionMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x1b2d24, metalness: 0.85, roughness: 0.2 }));
    const padSafetyMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x07150f, roughness: 0.5 }));
    const glassBoardMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
      })
    );
    const orangeRimMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.3, metalness: 0.4 }));

    const createProHoop = (zPos: number, isFacingNorth: boolean): THREE.Group => {
      const hoop = new THREE.Group();

      // Heavy Ground Anchor Base with Collapsible Foam Padding
      const basePad = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(0.8, 1.4, 0.8)), padSafetyMat);
      basePad.position.set(0, 0.7, isFacingNorth ? -1.1 : 1.1);
      basePad.castShadow = true;
      hoop.add(basePad);

      // Angled Main Support Mast
      const mainMast = new THREE.Mesh(trackGeometry(new THREE.CylinderGeometry(0.09, 0.11, 4.0, 16)), stanchionMat);
      mainMast.position.set(0, 2.0, isFacingNorth ? -1.1 : 1.1);
      mainMast.castShadow = true;
      hoop.add(mainMast);

      // Overhang Cantilever Arm
      const armGeo = trackGeometry(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 12));
      const arm = new THREE.Mesh(armGeo, stanchionMat);
      arm.rotation.x = isFacingNorth ? 0.65 : -0.65;
      arm.position.set(0, 3.65, isFacingNorth ? -0.4 : 0.4);
      hoop.add(arm);

      // Regulation Tempered Glass Backboard (1.8m × 1.05m)
      const board = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(1.8, 1.05, 0.05)), glassBoardMat);
      board.position.set(0, 3.2, 0);
      board.castShadow = true;
      hoop.add(board);

      // White Shooting Target Box on Backboard
      const targetBox = new THREE.Mesh(
        trackGeometry(new THREE.BoxGeometry(0.59, 0.45, 0.06)),
        trackMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }))
      );
      targetBox.position.set(0, 3.12, isFacingNorth ? 0.01 : -0.01);
      hoop.add(targetBox);

      // Breakaway Orange Ring
      const ring = new THREE.Mesh(trackGeometry(new THREE.TorusGeometry(0.24, 0.02, 10, 24)), orangeRimMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 3.05, isFacingNorth ? 0.32 : -0.32);
      ring.castShadow = true;
      hoop.add(ring);

      // Nylon Net Hanging Below Rim
      const netCone = new THREE.Mesh(
        trackGeometry(new THREE.CylinderGeometry(0.22, 0.1, 0.42, 12, 4, true)),
        trackMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 }))
      );
      netCone.position.set(0, 2.82, isFacingNorth ? 0.32 : -0.32);
      hoop.add(netCone);

      hoop.position.set(0, 0, zPos);
      return hoop;
    };

    basketballGroup.add(createProHoop(-bbL / 2 + 0.8, true));
    basketballGroup.add(createProHoop(bbL / 2 - 0.8, false));

    scene.add(basketballGroup);

    // =========================================================
    // 4. ARCHITECTURAL PERIMETER, CLUB PAVILION & FLOODLIGHTS
    // =========================================================

    // Modern Spectator Club Lounge Building (North Perimeter)
    const pavilionGroup = new THREE.Group();
    pavilionGroup.position.set(-18, 0, -25);

    const buildingMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x0b241a, roughness: 0.35, metalness: 0.4 }));
    const glassCurtainMat = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xb9f65a,
        transparent: true,
        opacity: 0.35,
        roughness: 0.08,
      })
    );

    const mainLounge = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(18, 4.4, 7.5)), buildingMat);
    mainLounge.position.y = 2.2;
    mainLounge.castShadow = true;
    mainLounge.receiveShadow = true;
    pavilionGroup.add(mainLounge);

    // Floor-to-ceiling panoramic glass facade
    const glassFacade = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(16.5, 2.8, 0.1)), glassCurtainMat);
    glassFacade.position.set(0, 2.2, 3.8);
    pavilionGroup.add(glassFacade);

    // Architectural Cantilevered Roof with Electric Lime Underside Glow
    const canopyRoof = new THREE.Mesh(
      trackGeometry(new THREE.BoxGeometry(20, 0.4, 9.5)),
      trackMaterial(new THREE.MeshStandardMaterial({ color: 0x123b2a, metalness: 0.5, roughness: 0.3 }))
    );
    canopyRoof.position.set(0, 4.5, 0.5);
    canopyRoof.castShadow = true;
    pavilionGroup.add(canopyRoof);

    // Interior Warm Hospitality Glow
    const interiorLight = new THREE.PointLight(0xfff3d6, 1.8, 18);
    interiorLight.position.set(0, 2.5, 1.5);
    pavilionGroup.add(interiorLight);

    // Landscape Planters & Shrubbery along Pavilion Terrace
    const planterMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x182c22, roughness: 0.8 }));
    const bushMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x1a5e3a, roughness: 0.9 }));
    for (let bx = -8; bx <= 8; bx += 2.5) {
      const box = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(1.6, 0.5, 0.8)), planterMat);
      box.position.set(bx, 0.25, 4.8);
      const bush = new THREE.Mesh(trackGeometry(new THREE.SphereGeometry(0.45, 8, 8)), bushMat);
      bush.position.set(bx, 0.65, 4.8);
      pavilionGroup.add(box, bush);
    }

    scene.add(pavilionGroup);

    // Heavy-Duty Stadium Floodlight Towers (4 Mast Lattice Columns)
    const mastMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x1b3026, metalness: 0.9, roughness: 0.2 }));
    const lampEmissiveMat = trackMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));

    const towerConfigs: [number, number, number, number][] = [
      [-34, 21, -18, 0],   // Tower 1: NW (Aims at football)
      [-34, -21, -18, 0],  // Tower 2: SW (Aims at football)
      [30, 21, 17, 8],     // Tower 3: NE (Aims at cricket)
      [30, -21, 17, -16],  // Tower 4: SE (Aims at basketball)
    ];

    towerConfigs.forEach(([x, z, targetX, targetZ]) => {
      const tower = new THREE.Group();
      const mastHeight = 17;

      // Hexagonal Lattice Mast Column
      const mast = new THREE.Mesh(trackGeometry(new THREE.CylinderGeometry(0.35, 0.65, mastHeight, 6)), mastMat);
      mast.position.y = mastHeight / 2;
      mast.castShadow = true;
      tower.add(mast);

      // Floodlight Luminaire Crossbar Head
      const headPlatform = new THREE.Mesh(trackGeometry(new THREE.BoxGeometry(3.0, 1.4, 0.5)), mastMat);
      headPlatform.position.set(0, mastHeight, 0);
      tower.add(headPlatform);

      // Bank of 6 High-Intensity LED Projector Heads
      for (let lx = -1; lx <= 1; lx++) {
        for (let ly = -0.3; ly <= 0.3; ly += 0.6) {
          const lampHead = new THREE.Mesh(trackGeometry(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 12)), mastMat);
          lampHead.rotation.x = Math.PI / 2;
          lampHead.position.set(lx * 0.9, mastHeight + ly, 0.3);

          const bulbFace = new THREE.Mesh(trackGeometry(new THREE.CircleGeometry(0.16, 12)), lampEmissiveMat);
          bulbFace.position.set(lx * 0.9, mastHeight + ly, 0.46);
          tower.add(lampHead, bulbFace);
          floodlightLamps.push(bulbFace);
        }
      }

      tower.position.set(x, 0, z);
      scene.add(tower);

      // Targeted High-CRI SpotLight
      const spot = new THREE.SpotLight(0xf2fff8, 4.5);
      spot.position.set(x, mastHeight, z);
      spot.angle = Math.PI / 4.2;
      spot.penumbra = 0.45;
      spot.decay = 1.25;
      spot.distance = 75;
      spot.castShadow = true;
      spot.shadow.mapSize.width = 1024;
      spot.shadow.mapSize.height = 1024;
      spot.shadow.bias = -0.0003;

      const targetObj = new THREE.Object3D();
      targetObj.position.set(targetX, 0, targetZ);
      scene.add(targetObj);
      spot.target = targetObj;

      scene.add(spot);
      floodlights.push(spot);
    });

    // Floating 3D Category Beacon Rings above venues
    const ringMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xb9f65a,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      })
    );
    const fbRing = new THREE.Mesh(trackGeometry(new THREE.TorusGeometry(3.2, 0.06, 6, 24)), ringMat);
    fbRing.rotation.x = Math.PI / 2;
    fbRing.position.set(-18, 5.5, 0);
    scene.add(fbRing);

    const crRing = new THREE.Mesh(trackGeometry(new THREE.TorusGeometry(2.4, 0.06, 6, 24)), ringMat);
    crRing.rotation.x = Math.PI / 2;
    crRing.position.set(17, 7.0, 8);
    scene.add(crRing);

    const bbRing = new THREE.Mesh(trackGeometry(new THREE.TorusGeometry(2.4, 0.06, 6, 24)), ringMat);
    bbRing.rotation.x = Math.PI / 2;
    bbRing.position.set(17, 5.5, -16);
    scene.add(bbRing);

    // =========================================================
    // 5. CAMERA RIG & MOTION ENGINE
    // =========================================================
    const targetCameraPos = new THREE.Vector3().copy(defaultCamPos);
    const targetLookAt = new THREE.Vector3(0, 0, 0);
    const currentLookAt = new THREE.Vector3(0, 0, 0);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let internalHovered: SportFacilityType = null;
    let internalActive: SportFacilityType = externalSelected || null;

    // Camera preset coordinates (Architectural viewpoints)
    const CAMERA_PRESETS = {
      overview: { pos: new THREE.Vector3(0, 38, 44), lookAt: new THREE.Vector3(0, 0, 0) },
      football: { pos: new THREE.Vector3(-18, 18, 24), lookAt: new THREE.Vector3(-18, 0, 0) },
      cricket: { pos: new THREE.Vector3(18, 16, 24), lookAt: new THREE.Vector3(17, 0, 8) },
      basketball: { pos: new THREE.Vector3(18, 15, -6), lookAt: new THREE.Vector3(17, 0, -16) },
    };

    // Controller implementation
    controllerRef.current = {
      setView: (view) => {
        const target = CAMERA_PRESETS[view];
        if (target) {
          targetCameraPos.copy(target.pos);
          targetLookAt.copy(target.lookAt);
        }
        internalActive = view === 'overview' ? null : (view as SportFacilityType);
      },
      setNightMode: (night) => {
        if (night) {
          scene.background = new THREE.Color(0x07150f);
          scene.fog = new THREE.FogExp2(0x07150f, 0.009);
          ambientLight.intensity = 0.65;
          ambientLight.color.setHex(0x0e281e);
          dirLight.intensity = 0.85;
          dirLight.color.setHex(0x84a99b);
          floodlights.forEach((fl) => (fl.intensity = 4.5));
          floodlightLamps.forEach((lamp) => (lamp.material as THREE.MeshBasicMaterial).color.setHex(0xffffff));
          interiorLight.intensity = 1.8;
          ledMat.opacity = 0.85;
        } else {
          scene.background = new THREE.Color(0xdcebe2);
          scene.fog = new THREE.FogExp2(0xdcebe2, 0.005);
          ambientLight.intensity = 1.4;
          ambientLight.color.setHex(0xb2d4c3);
          dirLight.intensity = 2.4;
          dirLight.color.setHex(0xfff6e6);
          floodlights.forEach((fl) => (fl.intensity = 0.4));
          floodlightLamps.forEach((lamp) => (lamp.material as THREE.MeshBasicMaterial).color.setHex(0x888888));
          interiorLight.intensity = 0.5;
          ledMat.opacity = 0.3;
        }
      },
      setSelected: (fac) => {
        internalActive = fac;
      },
    };

    // Sync initial selection
    if (externalSelected) {
      controllerRef.current.setView(externalSelected);
    }

    setIsLoading(false);

    // --- Interactive Pointer & Touch Listeners ---
    let hoveredMesh: THREE.Object3D | null = null;

    const updatePointerPos = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (e: MouseEvent) => {
      updatePointerPos(e.clientX, e.clientY);
    };

    const onPointerDown = (e: MouseEvent) => {
      updatePointerPos(e.clientX, e.clientY);
    };

    const onPointerLeave = () => {
      mouse.set(-999, -999);
      internalHovered = null;
      setHoveredFacility(null);
    };

    const onClick = () => {
      if (hoveredMesh && hoveredMesh.userData.facility) {
        const fac = hoveredMesh.userData.facility as SportFacilityType;
        internalActive = fac;
        setActiveFacility(fac);
        setActiveCameraView(fac as any);
        controllerRef.current?.setView(fac as any);
        if (onFacilityClickRef.current) {
          onFacilityClickRef.current(fac);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('mousedown', onPointerDown);
    renderer.domElement.addEventListener('mouseleave', onPointerLeave);
    renderer.domElement.addEventListener('click', onClick);

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointerPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });

    // WebGL Context Loss Handling
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isContextLost = true;
      cancelAnimationFrame(animationFrameId);
    };

    const handleContextRestored = () => {
      isContextLost = false;
      clock.start();
      animate();
    };

    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Animation Loop ---
    const clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed || isContextLost) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Beacon rotation
      fbRing.rotation.z = elapsedTime * 0.35;
      crRing.rotation.z = -elapsedTime * 0.35;
      bbRing.rotation.z = elapsedTime * 0.3;

      // Smooth camera interpolation (exponential damping)
      const dampFactor = prefersReducedMotion ? 1.0 : 1 - Math.exp(-4.2 * delta);
      camera.position.lerp(targetCameraPos, dampFactor);
      currentLookAt.lerp(targetLookAt, dampFactor);
      camera.lookAt(currentLookAt);

      // Raycasting for interactive court hover
      if (mouse.x !== -999) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes, false);

        if (intersects.length > 0) {
          hoveredMesh = intersects[0].object;
          const fac = hoveredMesh.userData.facility as SportFacilityType;
          if (internalHovered !== fac) {
            internalHovered = fac;
            setHoveredFacility(fac);
          }
          renderer.domElement.style.cursor = 'pointer';
        } else {
          hoveredMesh = null;
          if (internalHovered !== null) {
            internalHovered = null;
            setHoveredFacility(null);
          }
          renderer.domElement.style.cursor = 'default';
        }
      }

      // Update electric lime highlight ribbons
      const facilities = ['football', 'cricket', 'basketball'] as const;
      for (let i = 0; i < facilities.length; i++) {
        const name = facilities[i];
        const mesh = highlightMeshes[name];
        if (mesh) {
          const isSelected = internalActive === name;
          const isHovered = internalHovered === name;
          // When selected, apply a subtle pulsing breathing glow
          const pulse = isSelected ? Math.sin(elapsedTime * 4.0) * 0.12 : 0;
          const targetOpacity = isSelected ? 0.8 + pulse : isHovered ? 0.45 : 0.0;
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 9);
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // ResizeObserver for robust layout adaptation
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // Visibility change handling (pause animation when tab is inactive to save battery/GPU)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        clock.start();
        animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // --- Strict Memory Cleanup on Unmount ---
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('mousedown', onPointerDown);
      renderer.domElement.removeEventListener('mouseleave', onPointerLeave);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      // Dispose all tracked geometries, materials, and textures
      disposables.geometries.forEach((g) => g.dispose());
      disposables.materials.forEach((m) => m.dispose());
      disposables.textures.forEach((t) => t.dispose());

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Run ONCE on mount

  // Selected or hovered facility for HUD display
  const currentDisplayFacility = activeFacility || hoveredFacility;
  const facilityDetail = currentDisplayFacility ? FACILITY_DATA[currentDisplayFacility] : null;

  return (
    <div
      className={`relative w-full h-full min-h-[480px] sm:min-h-[580px] rounded-3xl overflow-hidden border border-[#214D35]/70 bg-gradient-arena shadow-elevated-dark select-none group transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 rounded-2xl min-h-0' : ''
      } ${className}`}
    >
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* WebGL Error / Fallback State */}
      {webGlError && (
        <div className="absolute inset-0 bg-[#07150F]/95 flex flex-col items-center justify-center p-6 text-center z-40">
          <div className="w-16 h-16 rounded-2xl bg-[#0B241A] border border-[#B9F65A]/40 flex items-center justify-center mb-4 text-[#B9F65A]">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">3D Sports Complex Arena</h3>
          <p className="text-xs text-[#D5E2D8] max-w-md leading-relaxed mb-6">{webGlError}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/explore')}
              className="px-5 py-2.5 rounded-xl bg-gradient-booking text-[#18231D] font-black text-xs shadow-lime hover:opacity-90 transition-opacity"
            >
              Explore Available Grounds
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && !webGlError && (
        <div className="absolute inset-0 bg-[#07150F]/95 flex flex-col items-center justify-center gap-3 z-30 transition-opacity">
          <div className="w-10 h-10 border-3 border-[#B9F65A] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-wider uppercase text-[#B9F65A]">
            Loading 3D Sports Complex...
          </span>
        </div>
      )}

      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3.5 py-1.5 rounded-full bg-[#0B241A]/90 border border-[#176443]/50 backdrop-blur-md flex items-center gap-2 text-xs font-bold text-white shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#B9F65A] animate-pulse" />
            <span className="tracking-wide">Interactive 3D Arena</span>
          </div>

          <button
            type="button"
            onClick={toggleLighting}
            title={isNightMode ? 'Switch to Daylight' : 'Switch to Night Floodlights'}
            className="p-2 rounded-full bg-[#0B241A]/90 hover:bg-[#123B2A] border border-[#176443]/50 text-[#B9F65A] transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9F65A] cursor-pointer"
          >
            {isNightMode ? <Sun className="w-4 h-4 text-[#B9F65A]" /> : <Moon className="w-4 h-4 text-emerald-300" />}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Exit Full Arena View' : 'Expand Arena'}
            className="hidden sm:inline-flex p-2 rounded-full bg-[#0B241A]/90 hover:bg-[#123B2A] border border-[#176443]/50 text-[#D5E2D8] hover:text-white transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9F65A] cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* View Selection Chips */}
        <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-[#07150F]/90 border border-[#176443]/50 backdrop-blur-md pointer-events-auto shadow-xl">
          <button
            type="button"
            onClick={() => handleViewChange('overview')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCameraView === 'overview'
                ? 'bg-gradient-booking text-[#18231D] shadow-xs'
                : 'text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60'
            }`}
          >
            All Arenas
          </button>
          <button
            type="button"
            onClick={() => handleViewChange('football')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCameraView === 'football'
                ? 'bg-gradient-booking text-[#18231D] shadow-xs'
                : 'text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60'
            }`}
          >
            ⚽ Football
          </button>
          <button
            type="button"
            onClick={() => handleViewChange('cricket')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCameraView === 'cricket'
                ? 'bg-gradient-booking text-[#18231D] shadow-xs'
                : 'text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60'
            }`}
          >
            🏏 Box Cricket
          </button>
          <button
            type="button"
            onClick={() => handleViewChange('basketball')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCameraView === 'basketball'
                ? 'bg-gradient-booking text-[#18231D] shadow-xs'
                : 'text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60'
            }`}
          >
            🏀 Basketball
          </button>
        </div>
      </div>

      {/* Bottom Interactive HUD Briefing Card */}
      <div className="absolute bottom-4 inset-x-4 flex items-end justify-between pointer-events-none z-20">
        <div className="pointer-events-auto max-w-md w-full">
          {facilityDetail ? (
            <div className="p-4 rounded-2xl bg-[#0B241A]/95 border border-[#B9F65A]/40 backdrop-blur-xl shadow-2xl transition-all animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {facilityDetail.id === 'football' && '⚽'}
                    {facilityDetail.id === 'cricket' && '🏏'}
                    {facilityDetail.id === 'basketball' && '🏀'}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-[#B9F65A]">
                    {facilityDetail.name}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#176443]/50 border border-[#B9F65A]/30 text-[10px] font-bold text-[#D5E2D8]">
                  {facilityDetail.capacity}
                </span>
              </div>

              <p className="text-[11px] text-[#D5E2D8] leading-relaxed mb-3">
                {facilityDetail.tagline}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-[#D5E2D8] bg-[#07150F]/70 p-2 rounded-xl mb-3 border border-[#176443]/30">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B9F65A] shrink-0" />
                  <span className="truncate">{facilityDetail.specs}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#B9F65A] shrink-0" />
                  <span className="truncate">{facilityDetail.lighting}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/explore?sport=${facilityDetail.exploreParam}`)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-gradient-booking hover:opacity-95 text-[#18231D] text-xs font-black flex items-center justify-center gap-1.5 shadow-lime-sm transition-all cursor-pointer"
                >
                  <span>Explore Available {facilityDetail.name.split(' ')[1] || 'Venues'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleViewChange('overview')}
                  title="Return to campus overview"
                  className="px-3 py-2 rounded-xl bg-[#07150F]/80 hover:bg-[#123B2A] border border-[#176443]/50 text-xs font-bold text-[#D5E2D8] hover:text-white transition-colors cursor-pointer"
                >
                  Overview
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-xl bg-[#07150F]/85 border border-[#176443]/40 backdrop-blur-md text-xs text-[#D5E2D8] flex items-center gap-2.5 shadow-lg">
              <Compass className="w-4 h-4 text-[#B9F65A] shrink-0 animate-spin-slow" />
              <span>Hover or tap courts to inspect facility specs & slot booking</span>
            </div>
          )}
        </div>

        {/* Ambient WebGL Engine Status Chip */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#07150F]/85 border border-[#176443]/40 text-[10px] text-[#D5E2D8] backdrop-blur-md shadow-md">
          <Eye className="w-3 h-3 text-[#B9F65A]" />
          <span>Real-Time PBR Arena</span>
          <span className="text-[#B9F65A] font-bold">• 60 FPS</span>
        </div>
      </div>
    </div>
  );
};
