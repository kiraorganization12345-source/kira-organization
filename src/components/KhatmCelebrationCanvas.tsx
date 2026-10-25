import React, { useEffect, useRef } from 'react';

interface KhatmCelebrationCanvasProps {
  isCompleted: boolean;
  triggerKey?: number | string;
  className?: string;
  density?: 'subtle' | 'vibrant';
  /** If true, renders a subtle ambient glimmer even after the main burst */
  ambientGlow?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  glowColor: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  type: 'star' | 'orb' | 'crescent' | 'diamond';
  wobbleSpeed: number;
  wobbleDistance: number;
  life: number;
  maxLife: number;
}

const GOLD_PALETTE = [
  { fill: '#FDE68A', glow: 'rgba(253, 230, 138, 0.8)' }, // Soft Champagne
  { fill: '#F59E0B', glow: 'rgba(245, 158, 11, 0.9)' },  // Warm Gold
  { fill: '#FBBF24', glow: 'rgba(251, 191, 36, 0.85)' }, // Bright Gold
  { fill: '#34D399', glow: 'rgba(52, 211, 153, 0.7)' },  // Celestial Emerald
  { fill: '#10B981', glow: 'rgba(16, 185, 129, 0.75)' }, // Deep Emerald
  { fill: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.9)' }   // Pure White Sparkle
];

export const KhatmCelebrationCanvas: React.FC<KhatmCelebrationCanvasProps> = ({
  isCompleted,
  triggerKey,
  className = '',
  density = 'subtle',
  ambientGlow = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastAmbientTimeRef = useRef<number>(0);
  const isCompletedRef = useRef(isCompleted);

  isCompletedRef.current = isCompleted;

  // Spawns celebratory particles
  const spawnCelebrationBurst = (width: number, height: number, count: number) => {
    const newParticles: Particle[] = [];
    const types: ('star' | 'orb' | 'crescent' | 'diamond')[] = ['star', 'orb', 'diamond', 'crescent'];

    for (let i = 0; i < count; i++) {
      const paletteItem = GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)];
      // Spawn particles distributed along the progress bar width, concentrated near center and moving up
      const x = Math.random() * width;
      const y = height * (0.4 + Math.random() * 0.4); // Start right around the bar track
      
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4; // Upward spray
      const speed = 0.5 + Math.random() * (density === 'vibrant' ? 2.8 : 1.9);

      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4, // gentle upward buoyancy
        size: 1.5 + Math.random() * (density === 'vibrant' ? 4 : 3),
        color: paletteItem.fill,
        glowColor: paletteItem.glow,
        alpha: 0.95 + Math.random() * 0.05,
        decay: 0.006 + Math.random() * 0.012, // Long, graceful fade
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.06,
        type: types[Math.floor(Math.random() * types.length)],
        wobbleSpeed: 0.02 + Math.random() * 0.04,
        wobbleDistance: 0.3 + Math.random() * 0.7,
        life: 0,
        maxLife: 60 + Math.random() * 120
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  // Helper to draw a 4-pointed radiant star
  const drawSparkleStar = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(0, 0, size, 0);
    ctx.quadraticCurveTo(0, 0, 0, size);
    ctx.quadraticCurveTo(0, 0, -size, 0);
    ctx.quadraticCurveTo(0, 0, 0, -size);
    ctx.closePath();
    ctx.fill();
  };

  // Helper to draw a delicate crescent
  const drawCrescent = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.beginPath();
    ctx.arc(0, 0, size, 0.5 * Math.PI, 1.5 * Math.PI, false);
    ctx.quadraticCurveTo(size * 0.4, 0, 0, size);
    ctx.closePath();
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Handle high DPI
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(canvas);

    // If completed or triggered, fire the burst
    if (isCompletedRef.current) {
      const rect = canvas.getBoundingClientRect();
      const burstCount = density === 'vibrant' ? 65 : 45;
      spawnCelebrationBurst(rect.width, rect.height, burstCount);
    }

    let isRunning = true;

    const render = (time: number) => {
      if (!isRunning) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Ambient trickle of subtle sparkles if 100% completed
      if (isCompletedRef.current && ambientGlow) {
        if (time - lastAmbientTimeRef.current > 750 && particlesRef.current.length < 35) {
          lastAmbientTimeRef.current = time;
          spawnCelebrationBurst(width, height, Math.floor(1 + Math.random() * 2));
        }
      }

      // Update and render particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx + Math.sin(p.life * p.wobbleSpeed) * p.wobbleDistance;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;
        p.life += 1;

        if (p.alpha <= 0 || p.y < -15 || p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.alpha);

        // Soft luminous glow
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 6;
        ctx.fillStyle = p.color;

        switch (p.type) {
          case 'star':
            drawSparkleStar(ctx, p.size);
            break;
          case 'crescent':
            drawCrescent(ctx, p.size * 0.9);
            break;
          case 'diamond':
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.lineTo(p.size * 0.6, 0);
            ctx.lineTo(0, p.size);
            ctx.lineTo(-p.size * 0.6, 0);
            ctx.closePath();
            ctx.fill();
            break;
          case 'orb':
          default:
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [triggerKey, density, ambientGlow]);

  // When isCompleted turns true or triggerKey changes, spawn particles
  useEffect(() => {
    if (isCompleted && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const burstCount = density === 'vibrant' ? 65 : 45;
      spawnCelebrationBurst(rect.width, rect.height, burstCount);
    }
  }, [isCompleted, triggerKey, density]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 w-full h-full z-20 ${className}`}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    />
  );
};
