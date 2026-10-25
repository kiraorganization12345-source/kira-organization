import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Camera, 
  RotateCcw, 
  ArrowRight, 
  Compass, 
  Sliders, 
  Search, 
  X,
  Play,
  Bookmark,
  Copy,
  Check
} from 'lucide-react';
import { Reciter, PaperTheme } from '../types';
import { toArabicNumeral, fetchPageAyahs } from '../services/quranApi';
import { recordMushafPageRead } from '../services/khatmProgressService';
import { playRealisticPageTurnSound, isPageTurnSoundEnabled, setPageTurnSoundEnabled } from '../services/soundEffects';
import { triggerHaptic } from '../services/deviceService';
import { ALL_SURAHS } from '../data/surahs';
import { drawQuranPageOnCanvas } from '../services/quranCanvasRenderer';

interface ThreeDimensionalMushafProps {
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onBackToSurahs?: () => void;
  selectedReciter: Reciter;
  currentPlayingAyah: { surahId: number; ayahNum: number } | null;
  onPlayAyah: (surahId: number, ayahNum: number) => void;
  onOpenTafsirModal?: (surahId: number, surahName: string, ayahNum: number, ayahText: string) => void;
  onOpenTadabburAI?: (surahName: string, surahNumber: number, ayahNum: number, ayahText: string) => void;
  bookmarks?: string[];
  onToggleBookmark?: (surahId: number, surahName: string, ayahNum: number, ayahText: string) => void;
  paperTheme?: PaperTheme;
  onFallbackToBookSpread?: () => void;
}

type CameraPreset = 'reading' | 'perspective' | 'side';

export const ThreeDimensionalMushaf: React.FC<ThreeDimensionalMushafProps> = ({
  initialPage = 1,
  onPageChange,
  onBackToSurahs,
  selectedReciter,
  currentPlayingAyah,
  onPlayAyah,
  onOpenTafsirModal,
  onOpenTadabburAI,
  bookmarks = [],
  onToggleBookmark,
  paperTheme = 'sepia',
  onFallbackToBookSpread
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Active page number (1-604)
  const [currentPage, setCurrentPage] = useState<number>(initialPage >= 1 && initialPage <= 604 ? initialPage : 1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(isPageTurnSoundEnabled());
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('reading');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isJumpModalOpen, setIsJumpModalOpen] = useState<boolean>(false);
  const [surahFilterQuery, setSurahFilterQuery] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [ribbonToast, setRibbonToast] = useState<string | null>(null);

  // 114 Surahs Index Modal State
  const [isSurahIndexOpen, setIsSurahIndexOpen] = useState<boolean>(false);
  const [surahCategoryFilter, setSurahCategoryFilter] = useState<'all' | 'meccan' | 'medinan'>('all');
  const [webGlFailed, setWebGlFailed] = useState<boolean>(false);

  // Quran Ayahs state for the active open spread & reading drawer
  const [spreadAyahs, setSpreadAyahs] = useState<{ right: any[]; left: any[] }>({ right: [], left: [] });
  const [isVersesDrawerOpen, setIsVersesDrawerOpen] = useState<boolean>(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'right' | 'left'>('right');
  const [copiedAyahKey, setCopiedAyahKey] = useState<string | null>(null);
  const ayahsCacheRef = useRef<Record<number, any[]>>({});

  // Three.js mutable scene references stored in ref to prevent re-creation
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    rightPageMesh: THREE.Mesh;
    leftPageMesh: THREE.Mesh;
    turningLeafMesh: THREE.Mesh;
    turningLeafPivot: THREE.Group;
    rightTexture: THREE.CanvasTexture;
    leftTexture: THREE.CanvasTexture;
    turningFrontTexture: THREE.CanvasTexture;
    turningBackTexture: THREE.CanvasTexture;
    rihlaGroup: THREE.Group;
    bookGroup: THREE.Group;
    targetCameraPos: THREE.Vector3;
    targetControlsTarget: THREE.Vector3;
    requestRender: () => void;
    cancelRender: () => void;
  } | null>(null);

  // Track currentPage in a ref for texture updating without re-mounting
  const currentPageRef = useRef<number>(currentPage);
  currentPageRef.current = currentPage;

  // Even page is on Right, Odd page is on Left (for standard Arabic Mushaf layout)
  const getSpreadPages = (page: number) => {
    if (page === 1) return { right: 1, left: 2 };
    const right = page % 2 === 0 ? page : page - 1;
    const left = right + 1 <= 604 ? right + 1 : 604;
    return { right, left };
  };

  const { right: rightPageNum, left: leftPageNum } = getSpreadPages(currentPage);

  // Sync page changes with Khatm Progress and preload ayahs
  useEffect(() => {
    recordMushafPageRead(currentPage);
    onPageChange?.(currentPage);

    const { right, left } = getSpreadPages(currentPage);
    Promise.all([
      fetchPageAyahs(right).catch(() => ({ ayahs: [] })),
      fetchPageAyahs(left).catch(() => ({ ayahs: [] }))
    ]).then(([resRight, resLeft]) => {
      ayahsCacheRef.current[right] = resRight.ayahs;
      ayahsCacheRef.current[left] = resLeft.ayahs;
      setSpreadAyahs({ right: resRight.ayahs, left: resLeft.ayahs });
    });
  }, [currentPage, onPageChange]);

  // Texture drawing utility: draws full authentic Quranic text onto canvas
  const updateCanvasWithPage = useCallback((canvas: HTMLCanvasElement, pageNum: number, onLoaded?: () => void) => {
    const cachedAyahs = ayahsCacheRef.current[pageNum];
    if (cachedAyahs && cachedAyahs.length > 0) {
      drawQuranPageOnCanvas(canvas, pageNum, cachedAyahs);
      onLoaded?.();
    } else {
      drawQuranPageOnCanvas(canvas, pageNum, []);
      onLoaded?.();

      fetchPageAyahs(pageNum)
        .then((res) => {
          ayahsCacheRef.current[pageNum] = res.ayahs;
          drawQuranPageOnCanvas(canvas, pageNum, res.ayahs);
          onLoaded?.();
        })
        .catch((err) => {
          console.warn(`Failed fetching ayahs for page ${pageNum}:`, err);
          drawQuranPageOnCanvas(canvas, pageNum, []);
          onLoaded?.();
        });
    }
  }, []);

  // Update textures when page changes
  const refreshPageTextures = useCallback(() => {
    if (!sceneRef.current) return;
    const { right, left } = getSpreadPages(currentPageRef.current);
    const { rightTexture, leftTexture, requestRender } = sceneRef.current;

    const rightCanvas = rightTexture.image as HTMLCanvasElement;
    const leftCanvas = leftTexture.image as HTMLCanvasElement;

    updateCanvasWithPage(rightCanvas, right, () => {
      rightTexture.needsUpdate = true;
      requestRender();
    });

    updateCanvasWithPage(leftCanvas, left, () => {
      leftTexture.needsUpdate = true;
      requestRender();
    });
  }, [updateCanvasWithPage]);

  // Turn Forward (Next pages in Arabic Quran -> moves to left)
  const handleTurnNext = useCallback(() => {
    if (isFlipping || currentPage >= 604) return;
    triggerHaptic('light');
    if (soundEnabled) playRealisticPageTurnSound(0.4);

    const s = sceneRef.current;
    if (!s) {
      setCurrentPage(prev => Math.min(604, prev + 2));
      return;
    }

    setIsFlipping(true);
    const nextPage = Math.min(604, currentPage + 2);
    const nextSpread = getSpreadPages(nextPage);

    // Prepare turning leaf textures: front has current left page, back has new right page
    const frontCanvas = s.turningFrontTexture.image as HTMLCanvasElement;
    const backCanvas = s.turningBackTexture.image as HTMLCanvasElement;

    updateCanvasWithPage(frontCanvas, leftPageNum, () => {
      s.turningFrontTexture.needsUpdate = true;
    });
    updateCanvasWithPage(backCanvas, nextSpread.right, () => {
      s.turningBackTexture.needsUpdate = true;
    });

    // Make turning leaf visible and animate from 0 to -Math.PI radians (flipping over spine)
    s.turningLeafPivot.visible = true;
    s.turningLeafPivot.rotation.y = 0;

    const startTime = performance.now();
    const duration = 480; // ms

    const animateFlip = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic ease-in-out
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Pivot rotates around center spine Y axis from 0 to -Math.PI
      s.turningLeafPivot.rotation.y = -ease * Math.PI;

      s.requestRender();

      if (progress < 1) {
        requestAnimationFrame(animateFlip);
      } else {
        s.turningLeafPivot.visible = false;
        s.turningLeafPivot.rotation.y = 0;
        setCurrentPage(nextPage);
        setIsFlipping(false);
      }
    };

    requestAnimationFrame(animateFlip);
  }, [currentPage, isFlipping, leftPageNum, soundEnabled, updateCanvasWithPage]);

  // Turn Backward (Previous pages in Arabic Quran)
  const handleTurnPrev = useCallback(() => {
    if (isFlipping || currentPage <= 1) return;
    triggerHaptic('light');
    if (soundEnabled) playRealisticPageTurnSound(0.4);

    const s = sceneRef.current;
    if (!s) {
      setCurrentPage(prev => Math.max(1, prev - 2));
      return;
    }

    setIsFlipping(true);
    const prevPage = Math.max(1, currentPage - 2);
    const prevSpread = getSpreadPages(prevPage);

    // Prepare turning leaf textures: front has current right page, back has prev left page
    const frontCanvas = s.turningFrontTexture.image as HTMLCanvasElement;
    const backCanvas = s.turningBackTexture.image as HTMLCanvasElement;

    updateCanvasWithPage(frontCanvas, rightPageNum, () => {
      s.turningFrontTexture.needsUpdate = true;
    });
    updateCanvasWithPage(backCanvas, prevSpread.left, () => {
      s.turningBackTexture.needsUpdate = true;
    });

    s.turningLeafPivot.visible = true;
    s.turningLeafPivot.rotation.y = -Math.PI;

    const startTime = performance.now();
    const duration = 480;

    const animateFlip = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      s.turningLeafPivot.rotation.y = -Math.PI + ease * Math.PI;
      s.requestRender();

      if (progress < 1) {
        requestAnimationFrame(animateFlip);
      } else {
        s.turningLeafPivot.visible = false;
        s.turningLeafPivot.rotation.y = 0;
        setCurrentPage(prevPage);
        setIsFlipping(false);
      }
    };

    requestAnimationFrame(animateFlip);
  }, [currentPage, isFlipping, rightPageNum, soundEnabled, updateCanvasWithPage]);

  // Jump to specific page
  const handleJumpToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > 604) return;
    triggerHaptic('medium');
    if (soundEnabled) playRealisticPageTurnSound(0.45);
    setCurrentPage(pageNum);
    setIsJumpModalOpen(false);
  };

  // Switch camera presets smoothly
  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    triggerHaptic('light');
    const s = sceneRef.current;
    if (!s) return;

    if (preset === 'reading') {
      s.targetCameraPos.set(0, 4.2, 2.35);
      s.targetControlsTarget.set(0, 1.25, 0.05);
    } else if (preset === 'perspective') {
      s.targetCameraPos.set(3.2, 3.8, 3.8);
      s.targetControlsTarget.set(0, 1.15, 0);
    } else if (preset === 'side') {
      s.targetCameraPos.set(-3.8, 2.6, 2.8);
      s.targetControlsTarget.set(0, 1.0, 0);
    }
    s.requestRender();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isJumpModalOpen) return;
      if (e.key === 'ArrowLeft') handleTurnNext();
      else if (e.key === 'ArrowRight') handleTurnPrev();
      else if (e.key === 'h' || e.key === 'H') setIsDockCollapsed(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTurnNext, handleTurnPrev, isJumpModalOpen]);

  // Ribbon bookmark toggle
  const handleRibbonClick = () => {
    triggerHaptic('medium');
    if (soundEnabled) playRealisticPageTurnSound(0.3);
    try {
      const saved = localStorage.getItem('tawbah_mushaf_ribbon_page');
      if (saved === String(currentPage)) {
        localStorage.removeItem('tawbah_mushaf_ribbon_page');
        setRibbonToast(`تمت إزالة الفاصل من صفحة ${toArabicNumeral(currentPage)}`);
      } else {
        localStorage.setItem('tawbah_mushaf_ribbon_page', String(currentPage));
        setRibbonToast(`تم حفظ موضع الفاصل عند صفحة ${toArabicNumeral(currentPage)} 🔖`);
      }
      setTimeout(() => setRibbonToast(null), 3000);
    } catch {}
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL safely
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 1. Scene, Camera, Renderer
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 80);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.replaceChildren(renderer.domElement);
    } catch (err) {
      console.warn('WebGL Renderer failed to initialize:', err);
      setWebGlFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0a09);
    scene.fog = new THREE.FogExp2(0x0c0a09, 0.04);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 2.35);

    // 2. Procedural Studio Environment
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch (e) {
      console.warn('PMREM environment generation skipped:', e);
    }

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.8;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going underground
    controls.target.set(0, 1.25, 0.05);

    // 4. Studio 3-Point Lighting
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.4);
    keyLight.position.set(3, 7, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbad7f2, 0.8);
    fillLight.position.set(-4, 5, -2);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x1c1917, 0.65);
    scene.add(hemiLight);

    // 5. Contact Shadow Floor Plate
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090706,
      roughness: 0.85,
      metalness: 0.1
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.05;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    // 6. BUILD THE PROCEDURAL 3D ISLAMIC RIHLA (WOODEN QURAN STAND)
    const rihlaGroup = new THREE.Group();

    // Wood Texture Canvas Generator
    const createWoodMaterial = () => {
      const woodCanvas = document.createElement('canvas');
      woodCanvas.width = 512;
      woodCanvas.height = 512;
      const wctx = woodCanvas.getContext('2d')!;
      wctx.fillStyle = '#3a2012';
      wctx.fillRect(0, 0, 512, 512);

      // Wood grain lines
      wctx.strokeStyle = 'rgba(28, 14, 7, 0.35)';
      wctx.lineWidth = 3;
      for (let i = 0; i < 512; i += 8) {
        wctx.beginPath();
        wctx.moveTo(0, i + Math.sin(i * 0.05) * 6);
        wctx.bezierCurveTo(150, i + 8, 350, i - 8, 512, i + 4);
        wctx.stroke();
      }

      const woodTex = new THREE.CanvasTexture(woodCanvas);
      woodTex.colorSpace = THREE.SRGBColorSpace;

      return new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x5a341e,
        roughness: 0.45,
        metalness: 0.1
      });
    };

    const woodMat = createWoodMaterial();

    // Two crossed planks forming the authentic Rihla
    const plankWidth = 4.4;
    const plankLength = 3.6;
    const plankThickness = 0.14;

    const plankGeo = new THREE.BoxGeometry(plankWidth, plankThickness, plankLength);

    // Plank 1 (slanted ~25 deg)
    const plank1 = new THREE.Mesh(plankGeo, woodMat);
    plank1.rotation.z = Math.PI * 0.13;
    plank1.position.set(0, 0.55, 0);
    plank1.castShadow = !isSoftwareGl;
    plank1.receiveShadow = !isSoftwareGl;
    rihlaGroup.add(plank1);

    // Plank 2 (slanted -25 deg, interlocking)
    const plank2 = new THREE.Mesh(plankGeo, woodMat);
    plank2.rotation.z = -Math.PI * 0.13;
    plank2.position.set(0, 0.55, 0);
    plank2.castShadow = !isSoftwareGl;
    plank2.receiveShadow = !isSoftwareGl;
    rihlaGroup.add(plank2);

    // Decorative Gold Filigree Corner Brackets on the Rihla
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xe5b85c,
      roughness: 0.25,
      metalness: 0.85
    });

    const bracketGeo = new THREE.BoxGeometry(0.2, 0.18, 0.35);
    const b1 = new THREE.Mesh(bracketGeo, goldMat);
    b1.position.set(1.9, 0.55 + Math.sin(Math.PI * 0.13) * 1.9, 1.6);
    rihlaGroup.add(b1);
    const b2 = new THREE.Mesh(bracketGeo, goldMat);
    b2.position.set(-1.9, 0.55 + Math.sin(Math.PI * 0.13) * 1.9, 1.6);
    rihlaGroup.add(b2);

    scene.add(rihlaGroup);

    // 7. BUILD THE PROCEDURAL 3D MUSHAF (BOOK)
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0, 1.15, 0);

    // Leather Covers (Right & Left angled covers)
    const coverWidth = 2.05;
    const coverLength = 2.85;
    const coverThickness = 0.08;
    const coverAngle = 0.18; // ~10 degrees open curvature

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x122416, // Royal deep emerald/obsidian leather
      roughness: 0.35,
      metalness: 0.25
    });

    // Right Cover
    const rightCover = new THREE.Mesh(new THREE.BoxGeometry(coverWidth, coverThickness, coverLength), leatherMat);
    rightCover.position.set(coverWidth / 2, 0, 0);
    rightCover.rotation.z = -coverAngle;
    rightCover.castShadow = !isSoftwareGl;
    rightCover.receiveShadow = !isSoftwareGl;
    bookGroup.add(rightCover);

    // Left Cover
    const leftCover = new THREE.Mesh(new THREE.BoxGeometry(coverWidth, coverThickness, coverLength), leatherMat);
    leftCover.position.set(-coverWidth / 2, 0, 0);
    leftCover.rotation.z = coverAngle;
    leftCover.castShadow = !isSoftwareGl;
    leftCover.receiveShadow = !isSoftwareGl;
    bookGroup.add(leftCover);

    // Book Center Spine (Cylinder)
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x1f140e,
      roughness: 0.4,
      metalness: 0.4
    });
    const spineMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, coverLength, 16), spineMat);
    spineMesh.rotation.x = Math.PI / 2;
    spineMesh.position.set(0, -0.06, 0);
    bookGroup.add(spineMesh);

    // Gilded Page Stack Blocks (Simulates paper depth of 604 pages)
    const pageStackMat = new THREE.MeshStandardMaterial({
      color: 0xd9ba7a,
      roughness: 0.5,
      metalness: 0.45
    });

    const rightStack = new THREE.Mesh(new THREE.BoxGeometry(coverWidth - 0.08, 0.12, coverLength - 0.08), pageStackMat);
    rightStack.position.set(coverWidth / 2 - 0.02, 0.06, 0);
    rightStack.rotation.z = -coverAngle;
    bookGroup.add(rightStack);

    const leftStack = new THREE.Mesh(new THREE.BoxGeometry(coverWidth - 0.08, 0.12, coverLength - 0.08), pageStackMat);
    leftStack.position.set(-coverWidth / 2 + 0.02, 0.06, 0);
    leftStack.rotation.z = coverAngle;
    bookGroup.add(leftStack);

    // 8. TEXTURE CANVASES FOR PAGES
    const createPageCanvas = () => {
      const cvs = document.createElement('canvas');
      cvs.width = 1024;
      cvs.height = 1450;
      return cvs;
    };

    const rightCanvas = createPageCanvas();
    const leftCanvas = createPageCanvas();
    const turningFrontCanvas = createPageCanvas();
    const turningBackCanvas = createPageCanvas();

    const rightTexture = new THREE.CanvasTexture(rightCanvas);
    rightTexture.colorSpace = THREE.SRGBColorSpace;
    rightTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const leftTexture = new THREE.CanvasTexture(leftCanvas);
    leftTexture.colorSpace = THREE.SRGBColorSpace;
    leftTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const turningFrontTexture = new THREE.CanvasTexture(turningFrontCanvas);
    turningFrontTexture.colorSpace = THREE.SRGBColorSpace;

    const turningBackTexture = new THREE.CanvasTexture(turningBackCanvas);
    turningBackTexture.colorSpace = THREE.SRGBColorSpace;

    // Page Surface Meshes
    const pageWidth = coverWidth - 0.1;
    const pageLength = coverLength - 0.1;
    const pageGeometry = new THREE.PlaneGeometry(pageWidth, pageLength, 12, 12);

    // Right Page Mesh
    const rightPageMat = new THREE.MeshStandardMaterial({
      map: rightTexture,
      roughness: 0.75,
      metalness: 0.05
    });
    const rightPageMesh = new THREE.Mesh(pageGeometry, rightPageMat);
    rightPageMesh.rotation.x = -Math.PI / 2;
    rightPageMesh.rotation.y = -coverAngle;
    rightPageMesh.position.set(pageWidth / 2 + 0.02, 0.13, 0);
    bookGroup.add(rightPageMesh);

    // Left Page Mesh
    const leftPageMat = new THREE.MeshStandardMaterial({
      map: leftTexture,
      roughness: 0.75,
      metalness: 0.05
    });
    const leftPageMesh = new THREE.Mesh(pageGeometry, leftPageMat);
    leftPageMesh.rotation.x = -Math.PI / 2;
    leftPageMesh.rotation.y = coverAngle;
    leftPageMesh.position.set(-pageWidth / 2 - 0.02, 0.13, 0);
    bookGroup.add(leftPageMesh);

    // 9. 3D TURNING LEAF MESH & PIVOT GROUP
    const turningLeafPivot = new THREE.Group();
    turningLeafPivot.position.set(0, 0.14, 0);
    turningLeafPivot.visible = false;

    // Curved Leaf Plane
    const leafGeo = new THREE.PlaneGeometry(pageWidth, pageLength, 16, 16);
    // Subtle curl curvature along width
    const posAttr = leafGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const curl = Math.sin((x / pageWidth) * Math.PI) * 0.05;
      posAttr.setZ(i, curl);
    }
    leafGeo.computeVertexNormals();

    const leafFrontMat = new THREE.MeshStandardMaterial({
      map: turningFrontTexture,
      roughness: 0.7,
      metalness: 0.05,
      side: THREE.FrontSide
    });
    const leafBackMat = new THREE.MeshStandardMaterial({
      map: turningBackTexture,
      roughness: 0.7,
      metalness: 0.05,
      side: THREE.BackSide
    });

    // Turning mesh pivoted at spine edge
    const turningLeafMeshFront = new THREE.Mesh(leafGeo, leafFrontMat);
    turningLeafMeshFront.rotation.x = -Math.PI / 2;
    turningLeafMeshFront.position.set(-pageWidth / 2, 0, 0);
    turningLeafPivot.add(turningLeafMeshFront);

    const turningLeafMeshBack = new THREE.Mesh(leafGeo, leafBackMat);
    turningLeafMeshBack.rotation.x = -Math.PI / 2;
    turningLeafMeshBack.position.set(-pageWidth / 2, 0, 0);
    turningLeafPivot.add(turningLeafMeshBack);

    bookGroup.add(turningLeafPivot);

    // 10. SILK RIBBON BOOKMARK
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Crimson silk
      roughness: 0.4,
      metalness: 0.2
    });
    const ribbonGeo = new THREE.BoxGeometry(0.08, 0.015, pageLength + 0.4);
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh.position.set(0.2, 0.145, 0.18);
    ribbonMesh.rotation.y = -0.05;
    bookGroup.add(ribbonMesh);

    scene.add(bookGroup);

    // 11. Continuous 60fps Animation Loop Setup
    const targetCameraPos = new THREE.Vector3().copy(camera.position);
    const targetControlsTarget = new THREE.Vector3().copy(controls.target);

    let frameId = 0;
    let isMounted = true;

    function animate() {
      if (!isMounted) return;
      frameId = requestAnimationFrame(animate);

      if (isAutoRotate) {
        rihlaGroup.rotation.y += 0.0025;
        bookGroup.rotation.y += 0.0025;
      }

      camera.position.lerp(targetCameraPos, 0.08);
      controls.target.lerp(targetControlsTarget, 0.08);
      controls.update();

      renderer.render(scene, camera);
    }

    animate();

    // Resize handler with ResizeObserver
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || (window.innerHeight - 80);
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Save scene reference
    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      rightPageMesh,
      leftPageMesh,
      turningLeafMesh: turningLeafMeshFront,
      turningLeafPivot,
      rightTexture,
      leftTexture,
      turningFrontTexture,
      turningBackTexture,
      rihlaGroup,
      bookGroup,
      targetCameraPos,
      targetControlsTarget,
      requestRender: () => {},
      cancelRender: () => {
        isMounted = false;
        cancelAnimationFrame(frameId);
      }
    };

    // Initial texture load
    refreshPageTextures();

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      rightTexture.dispose();
      leftTexture.dispose();
      turningFrontTexture.dispose();
      turningBackTexture.dispose();
      scene.clear();
      sceneRef.current = null;
    };
  }, [isAutoRotate, refreshPageTextures]);

  // Update textures whenever currentPage updates
  useEffect(() => {
    refreshPageTextures();
  }, [currentPage, refreshPageTextures]);

  // Get current Surah name for top badge
  const currentSurah = ALL_SURAHS.slice().reverse().find(s => s.startPage <= currentPage) || ALL_SURAHS[0];
  const juzNum = Math.min(30, Math.max(1, Math.ceil(currentPage / 20)));

  if (webGlFailed) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-stone-950 text-amber-100 space-y-4 select-none" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="font-quran text-2xl font-bold text-amber-200">المصحف الشريف (تصفح واقعي عالي الدقة)</h3>
          <p className="text-sm text-stone-300 font-cairo leading-relaxed">
            معالج الرسوميات ثلاثي الأبعاد غير متوفر في هذا المتصفح. يمكنك القراءة المباشرة وتصفح جميع سور القرآن الكريم عبر نمط الكتاب المفتوح.
          </p>
        </div>
        {onFallbackToBookSpread && (
          <button
            onClick={onFallbackToBookSpread}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-black text-sm shadow-xl active:scale-95 transition-all hover:brightness-110 flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>الانتقال إلى تصفح الكتاب المفتوح</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full h-full flex flex-col bg-[#0c0a09] overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : ''
      }`}
      dir="rtl"
    >
      {/* 3D WebGL Canvas Mount Container */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
        title="اسحب بالفأرة أو باللمس لتدوير المصحف ثلاثي الأبعاد بحرية"
      />

      {/* ============================================================ */}
      {/* 1. TOP MINIMAL TITLE & SPEC BADGE (Top-Right & Top-Left)     */}
      {/* ============================================================ */}
      <div className="absolute top-3 inset-x-2 sm:inset-x-6 flex items-center justify-between pointer-events-none z-20 gap-2">
        
        {/* Left: Quran Surah & Page Spec + Surah Index Trigger */}
        <div className="flex items-center gap-2 pointer-events-auto bg-stone-900/90 border border-amber-500/40 rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-xl backdrop-blur-md">
          {onBackToSurahs && (
            <button
              onClick={onBackToSurahs}
              className="p-1.5 rounded-xl hover:bg-stone-800 text-amber-300 transition-colors flex items-center gap-1 font-bold text-xs"
              title="العودة إلى فهرس السور الرئيسي"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">السور</span>
            </button>
          )}

          {/* Surah Index Selector Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsSurahIndexOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-black text-xs shadow-md transition-all active:scale-95 border border-amber-300 hover:brightness-110"
            title="فتح فهرس جميع سور القرآن الكريم (114 سورة) لاختيار أي سورة وقراءتها في المصحف 3D"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>فهرس السور (١١٤)</span>
          </button>

          <div className="h-4 w-px bg-stone-700 mx-0.5 hidden sm:block" />

          <div className="hidden sm:block">
            <h2 className="font-quran text-sm sm:text-base font-bold text-amber-200">
              سورة {currentSurah.name} • صفحة {toArabicNumeral(rightPageNum)} - {toArabicNumeral(leftPageNum)}
            </h2>
            <span className="text-[10px] text-stone-400 font-cairo block">
              الجزء {toArabicNumeral(juzNum)} • مصحف المدينة ثلاثي الأبعاد
            </span>
          </div>
        </div>

        {/* Right: Quick Tools (Verses, Jump, Audio, Fullscreen) */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-stone-900/90 border border-amber-500/40 rounded-2xl p-1.5 shadow-xl backdrop-blur-md">
          {/* Prominent Button: View Verses & Tafsir */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsVersesDrawerOpen(prev => !prev);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all active:scale-95 ${
              isVersesDrawerOpen
                ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow-md'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
            }`}
            title="عرض نص الآيات والتفسير للقراءة المريحة"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>نص الآيات والتفسير</span>
          </button>

          {/* Jump to Page */}
          <button
            onClick={() => setIsJumpModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white font-bold text-xs flex items-center gap-1 border border-stone-750 transition-all active:scale-95"
            title="انتقال سريع في المصحف"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">انتقال</span>
          </button>

          {/* Ribbon Bookmark button */}
          <button
            onClick={handleRibbonClick}
            className="p-2 rounded-xl hover:bg-stone-800 text-amber-400 border border-stone-700/80 transition-colors"
            title="وضع فاصل الحفظ في الصفحة"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              setPageTurnSoundEnabled(next);
              triggerHaptic('light');
            }}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-stone-800 border-stone-700 text-stone-400'
            }`}
            title={soundEnabled ? 'صوت تقليب الورق مفعّل' : 'صوت تقليب الورق مكتوم'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 transition-colors"
            title={isFullscreen ? 'إلغاء ملء الشاشة' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Bookmark Toast Feedback */}
      {ribbonToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-2xl bg-amber-500 text-stone-950 font-bold text-xs shadow-2xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <Bookmark className="w-4 h-4 fill-stone-950" />
          <span>{ribbonToast}</span>
        </div>
      )}

      {/* Direct Page Flip Action Arrows (Floating on Sides) */}
      <button
        onClick={handleTurnPrev}
        disabled={currentPage <= 1 || isFlipping}
        className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-stone-900/90 text-amber-300 border border-amber-500/50 shadow-2xl flex items-center justify-center transition-all ${
          currentPage <= 1 || isFlipping ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95 hover:bg-amber-500 hover:text-stone-950'
        }`}
        title="الصفحة السابقة (السهم الأيمن)"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <button
        onClick={handleTurnNext}
        disabled={currentPage >= 604 || isFlipping}
        className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-stone-900/90 text-amber-300 border border-amber-500/50 shadow-2xl flex items-center justify-center transition-all ${
          currentPage >= 604 || isFlipping ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95 hover:bg-amber-500 hover:text-stone-950'
        }`}
        title="الصفحة التالية (السهم الأيسر)"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* ============================================================ */}
      {/* 1.5 INTERACTIVE VERSES & TAFSIR DRAWER (نص القرآن الكريم وتفسيره) */}
      {/* ============================================================ */}
      {isVersesDrawerOpen && (
        <div className="absolute inset-x-2 sm:inset-x-8 bottom-20 z-40 max-h-[75vh] flex flex-col bg-stone-900/98 border border-amber-500/50 rounded-3xl shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-stone-800 bg-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-quran text-base sm:text-lg font-bold text-amber-200">
                  نص الآيات والتفسير الميسر • سورة {currentSurah.name}
                </h3>
                <p className="text-[11px] text-stone-400 font-cairo">
                  الصفحات المعروضة: صفحة {toArabicNumeral(rightPageNum)} (يمين) • صفحة {toArabicNumeral(leftPageNum)} (يسار)
                </p>
              </div>
            </div>

            {/* Page Tab Selector in Drawer */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-black/60 p-1 rounded-xl border border-stone-800">
                <button
                  onClick={() => setActiveDrawerTab('right')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeDrawerTab === 'right'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  صفحة {toArabicNumeral(rightPageNum)}
                </button>
                <button
                  onClick={() => setActiveDrawerTab('left')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeDrawerTab === 'left'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  صفحة {toArabicNumeral(leftPageNum)}
                </button>
              </div>

              <button
                onClick={() => setIsVersesDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
                title="إغلاق لوحة الآيات"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Verses Scrollable List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {((activeDrawerTab === 'right' ? spreadAyahs.right : spreadAyahs.left) || []).length === 0 ? (
              <div className="py-12 text-center text-amber-400 space-y-2 font-quran">
                <div className="w-7 h-7 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>جاري تحميل آيات الصفحة {toArabicNumeral(activeDrawerTab === 'right' ? rightPageNum : leftPageNum)}...</p>
              </div>
            ) : (
              ((activeDrawerTab === 'right' ? spreadAyahs.right : spreadAyahs.left) || []).map((ayah: any) => {
                const isPlaying = currentPlayingAyah?.surahId === ayah.surah?.id && currentPlayingAyah?.ayahNum === ayah.numberInSurah;
                const ayahKey = `${ayah.surah?.id}-${ayah.numberInSurah}`;

                return (
                  <div
                    key={ayahKey}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPlaying
                        ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-400/50'
                        : 'bg-black/40 border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    {/* Verse Text */}
                    <div className="text-right font-quran text-lg sm:text-xl md:text-2xl text-stone-100 leading-[2.5] select-text">
                      <span>{ayah.text}</span>
                      <span className="text-amber-400 font-bold mx-2">
                        ﴿{toArabicNumeral(ayah.numberInSurah)}﴾
                      </span>
                    </div>

                    {/* Verse Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-stone-800/80 text-xs">
                      <span className="text-stone-400 font-cairo">
                        سورة {ayah.surah?.name} • الآية {toArabicNumeral(ayah.numberInSurah)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Play Ayah */}
                        <button
                          onClick={() => onPlayAyah(ayah.surah.id, ayah.numberInSurah)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold flex items-center gap-1 border border-amber-500/40"
                          title="استماع للآية"
                        >
                          <Play className="w-3 h-3 fill-amber-300" />
                          <span>استماع</span>
                        </button>

                        {/* Tafsir Modal */}
                        {onOpenTafsirModal && (
                          <button
                            onClick={() => onOpenTafsirModal(ayah.surah.id, ayah.surah.name, ayah.numberInSurah, ayah.text)}
                            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 font-bold flex items-center gap-1 border border-stone-700"
                            title="عرض التفسير المعتمد للآية"
                          >
                            <BookOpen className="w-3 h-3 text-amber-400" />
                            <span>تفسير</span>
                          </button>
                        )}

                        {/* AI Tadabbur */}
                        {onOpenTadabburAI && (
                          <button
                            onClick={() => onOpenTadabburAI(ayah.surah.name, ayah.surah.id, ayah.numberInSurah, ayah.text)}
                            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-amber-300 font-bold flex items-center gap-1 border border-stone-700"
                            title="خواطر وتدبر بالذكاء الاصطناعي"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>تدبر</span>
                          </button>
                        )}

                        {/* Copy Verse */}
                        <button
                          onClick={() => {
                            const formatted = `﴿${ayah.text}﴾ [سورة ${ayah.surah.name}: ${ayah.numberInSurah}]`;
                            navigator.clipboard.writeText(formatted);
                            setCopiedAyahKey(ayahKey);
                            setTimeout(() => setCopiedAyahKey(null), 2000);
                          }}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-white border border-stone-700"
                          title="نسخ الآية"
                        >
                          {copiedAyahKey === ayahKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* 2. ERGONOMIC COLLAPSIBLE BOTTOM DOCK (Zero Viewport Occlusion)*/}
      {/* ============================================================ */}
      <div 
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-3 transition-transform duration-300 ${
          isDockCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse / Expand Tab */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="px-4 py-1 rounded-t-xl bg-stone-900/95 border-t border-x border-amber-500/40 text-[11px] font-bold text-amber-300 hover:text-amber-200 shadow-lg flex items-center gap-1.5 transition-colors"
          >
            <span>{isDockCollapsed ? '▴ إظهار أدوات المصحف 3D' : '▾ إخفاء الأدوات (مشهد سينمائي)'}</span>
          </button>
        </div>

        {/* Main Dock Container */}
        <div className="bg-stone-900/95 border border-amber-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl space-y-2.5">
          
          {/* Row 1: Camera Presets & Play Page Recitation */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            
            {/* Camera View Angle Pills */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-stone-800">
              <span className="text-[10px] text-stone-400 px-2 hidden sm:inline">الزاوية:</span>
              
              <button
                onClick={() => applyCameraPreset('reading')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  cameraPreset === 'reading'
                    ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="زاوية القراءة المباشرة الواضحة"
              >
                📖 وضع القراءة
              </button>

              <button
                onClick={() => applyCameraPreset('perspective')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  cameraPreset === 'perspective'
                    ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="منظور ثلاثي الأبعاد مجسم مع الحامل الخشبي"
              >
                🏛️ مجسم 3D
              </button>

              <button
                onClick={() => applyCameraPreset('side')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  cameraPreset === 'side'
                    ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="زاوية جانبية مقربة"
              >
                🔍 زاوية جانبية
              </button>
            </div>

            {/* Verses & Audio Recitation Action */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsSurahIndexOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md border border-amber-300 active:scale-95 hover:brightness-110"
                title="فتح فهرس جميع سور القرآن الكريم (114 سورة)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>فهرس السور</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsVersesDrawerOpen(prev => !prev);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all active:scale-95 ${
                  isVersesDrawerOpen
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow-md'
                    : 'bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border-amber-500/60'
                }`}
                title="عرض وتكبير نص الآيات والتفسير للقراءة المريحة"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>نص الآيات والتفسير</span>
              </button>

              <button
                onClick={() => onPlayAyah(currentSurah.id, 1)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                title={`الاستماع للصفحة بصوت الشيخ ${selectedReciter.name}`}
              >
                <Play className="w-3.5 h-3.5 fill-stone-950" />
                <span>تلاوة</span>
              </button>

              {onOpenTafsirModal && (
                <button
                  onClick={() => onOpenTafsirModal(currentSurah.id, currentSurah.name, 1, `سورة ${currentSurah.name}`)}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-amber-200 font-bold text-xs border border-stone-700 flex items-center gap-1 transition-colors active:scale-95"
                  title="تفسير آيات هذه الصفحة"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">التفسير</span>
                </button>
              )}
            </div>

          </div>

          {/* Row 2: Page Slider & Scrubber */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-400">
              <span className="text-amber-300 font-mono">
                صفحة {toArabicNumeral(currentPage)} من ٦٠٤
              </span>
              <span className="text-[10px] hidden sm:inline">
                اسحب لتصفح وتقليب المصحف الشريف ثلاثي الأبعاد
              </span>
            </div>

            <input 
              type="range"
              min={1}
              max={604}
              value={currentPage}
              onChange={(e) => {
                const p = parseInt(e.target.value, 10);
                setCurrentPage(p);
                if (soundEnabled && Math.abs(p - currentPage) >= 4) {
                  playRealisticPageTurnSound(0.2);
                }
              }}
              className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 2.5 COMPREHENSIVE 114 SURAHS INDEX MODAL                     */}
      {/* ============================================================ */}
      {isSurahIndexOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="bg-stone-900 border-2 border-amber-500/50 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-quran text-lg sm:text-2xl font-black text-amber-200">
                    فهرس سور القرآن الكريم (١١٤ سورة)
                  </h3>
                  <p className="text-xs text-stone-400 font-cairo">
                    اختر أي سورة للقراءة المباشرة وتصفح آياتها في المصحف ثلاثي الأبعاد 3D
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSurahIndexOpen(false)}
                className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
                title="إغلاق الفهرس"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="my-3 space-y-2">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="ابحث عن اسم السورة (مثال: الكهف، يس، البقرة، الملك...)"
                  value={surahFilterQuery}
                  onChange={(e) => setSurahFilterQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-2xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs sm:text-sm font-cairo focus:border-amber-500 focus:outline-none"
                  autoFocus
                />
                <Search className="w-4 h-4 text-amber-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                {surahFilterQuery && (
                  <button 
                    onClick={() => setSurahFilterQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center bg-black/60 p-1 rounded-xl border border-stone-800 text-xs">
                  <button
                    onClick={() => setSurahCategoryFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      surahCategoryFilter === 'all'
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    جميع السور (١١٤)
                  </button>
                  <button
                    onClick={() => setSurahCategoryFilter('meccan')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      surahCategoryFilter === 'meccan'
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    المكية (٨٦)
                  </button>
                  <button
                    onClick={() => setSurahCategoryFilter('medinan')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      surahCategoryFilter === 'medinan'
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    المدنية (٢٨)
                  </button>
                </div>

                {/* Popular Surah Quick Chips */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[10px] text-stone-400 hidden md:inline ml-1">سور شائعة:</span>
                  {[
                    { id: 1, name: 'الفاتحة', page: 1 },
                    { id: 2, name: 'البقرة', page: 2 },
                    { id: 18, name: 'الكهف', page: 293 },
                    { id: 36, name: 'يس', page: 440 },
                    { id: 55, name: 'الرحمن', page: 531 },
                    { id: 67, name: 'الملك', page: 562 },
                    { id: 112, name: 'الإخلاص', page: 604 }
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => {
                        handleJumpToPage(chip.page);
                        setIsSurahIndexOpen(false);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-amber-300 border border-stone-700 text-[10px] font-bold transition-all whitespace-nowrap"
                    >
                      {chip.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Surahs Scrollable Grid */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-2 no-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {ALL_SURAHS.filter(s => {
                  const query = surahFilterQuery.trim();
                  const matchesSearch = !query || 
                    s.name.includes(query) || 
                    s.englishName.toLowerCase().includes(query.toLowerCase()) || 
                    String(s.id) === query;
                  const matchesCategory = surahCategoryFilter === 'all' || 
                    (surahCategoryFilter === 'meccan' && s.revelationType === 'Meccan') || 
                    (surahCategoryFilter === 'medinan' && s.revelationType === 'Medinan');
                  return matchesSearch && matchesCategory;
                }).map((surah) => (
                  <button
                    key={surah.id}
                    onClick={() => {
                      handleJumpToPage(surah.startPage);
                      setIsSurahIndexOpen(false);
                      setRibbonToast(`تم فتح سورة ${surah.name} (صفحة ${toArabicNumeral(surah.startPage)})`);
                      setTimeout(() => setRibbonToast(null), 3000);
                    }}
                    className="p-3 rounded-2xl bg-stone-950/70 hover:bg-amber-500/20 text-right flex items-center justify-between border border-stone-800/90 hover:border-amber-400 transition-all group active:scale-95 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/15 group-hover:bg-amber-500 group-hover:text-stone-950 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors">
                        {toArabicNumeral(surah.id)}
                      </span>
                      <div className="min-w-0">
                        <span className="font-quran text-lg font-black text-amber-100 group-hover:text-amber-300 block truncate drop-shadow-sm">
                          سُورَةُ {surah.name}
                        </span>
                        <span className="text-[10px] text-stone-400 block truncate">
                          {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {toArabicNumeral(surah.versesCount)} آية
                        </span>
                      </div>
                    </div>

                    <div className="text-left shrink-0 pl-1">
                      <span className="text-xs font-bold text-amber-400 font-quran block">
                        صـ {toArabicNumeral(surah.startPage)}
                      </span>
                      <span className="text-[9px] text-stone-500 block">
                        الجزء {toArabicNumeral(surah.juz)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. QUICK JUMP MODAL                                          */}
      {/* ============================================================ */}
      {isJumpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="bg-stone-900 border border-amber-500/40 rounded-3xl max-w-xl w-full p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <h3 className="font-quran text-lg font-bold text-amber-200">الانتقال السريع في المصحف ثلاثي الأبعاد</h3>
              </div>
              <button 
                onClick={() => setIsJumpModalOpen(false)}
                className="p-1 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="my-3 relative">
              <input 
                type="text"
                placeholder="ابحث عن اسم السورة أو رقمها..."
                value={surahFilterQuery}
                onChange={(e) => setSurahFilterQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs font-cairo focus:border-amber-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Surah List */}
            <div className="overflow-y-auto flex-1 space-y-1.5 no-scrollbar pr-1">
              {ALL_SURAHS.filter(s => s.name.includes(surahFilterQuery) || s.id.toString() === surahFilterQuery).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleJumpToPage(s.startPage)}
                  className="w-full p-2.5 rounded-xl bg-stone-950/60 hover:bg-amber-500/20 text-right flex items-center justify-between border border-stone-800/80 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">
                      {s.id}
                    </span>
                    <div>
                      <span className="font-quran font-bold text-stone-200 group-hover:text-amber-300">
                        سورة {s.name}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {toArabicNumeral(s.versesCount)} آية
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-amber-400/90 font-quran">
                    صفحة {toArabicNumeral(s.startPage)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
