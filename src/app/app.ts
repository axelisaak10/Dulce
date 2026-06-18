import {
  Component,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
  Inject,
  PLATFORM_ID,
  afterNextRender,
  ViewEncapsulation,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Reason { text: string; }
interface Photo { src: string; label: string; }

interface Video {
  id: string;
  ytId: string;
  safeUrl: SafeResourceUrl;
  date: string;
  time: string;
}

interface Note {
  id: string;
  title: string;
  text: string;
  date: string;
  time: string;
  color: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
})
export class App implements OnDestroy {
  // Envelope
  envelopeOpen = false;
  pageVisible = false;

  // Lightbox
  lightboxOpen = false;
  lightboxSrc = '';
  currentPhotoIndex = 0;

  // URL del backend Next.js — cambiar si el backend corre en otro puerto
  private readonly API = 'http://localhost:3000/api';

  // ─── La fecha se carga desde el backend (.env.local > LOVE_START_DATE) ───
  startDate = new Date('2025-03-15T00:00:00');

  currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  photos: Photo[] = [];
  newPhotoUrl = '';
  newPhotoLabel = '';
  photoUrlError = '';

  reasons: Reason[] = [
    { text: 'Por tu sonrisa que ilumina todo a tu alrededor' },
    { text: 'Por los abrazos que me hacen sentir en casa' },
    { text: 'Por tu fuerza que me inspira cada día' },
    { text: 'Por cómo cantas cuando crees que nadie escucha' },
    { text: 'Por los mensajes de buenas noches que esperaba tanto' },
    { text: 'Por ser exactamente tú, sin pretender ser otra persona' },
    { text: 'Por tu inteligencia que me hace aprender cosas nuevas' },
    { text: 'Por amarme tal y como soy' },
    { text: 'Por los pequeños detalles que nadie más nota' },
  ];

  // YouTube
  videos: Video[] = [];
  newVideoUrl = '';
  videoUrlError = '';

  // Notes
  notes: Note[] = [];
  newNoteTitle = '';
  newNoteText = '';
  private noteColors = [
    '#ff4d4d', '#ff6666', '#ff8080', '#ff9999',
    '#ffb3b3', '#ffcccc', '#ff3333', '#e60000',
  ];

  private timerInterval: any;
  private heartsInterval: any;
  private treeAnimFrame = 0;
  private bgAnimFrame = 0;
  private isBrowser: boolean;

  constructor(
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    afterNextRender(() => {
      this.loadFromBackend();
      this.createHearts();
      this.startTimer();
      this.initTree();
      this.initBackgroundAnimation();
    });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.heartsInterval) clearInterval(this.heartsInterval);
    if (this.treeAnimFrame) cancelAnimationFrame(this.treeAnimFrame);
    if (this.bgAnimFrame) cancelAnimationFrame(this.bgAnimFrame);
  }

  // ─── ENVELOPE ───────────────────────────────────────
  openEnvelope(): void {
    this.envelopeOpen = true;
  }

  enterPage(): void {
    if (!this.isBrowser) return;
    const welcome = document.getElementById('welcome-screen');
    if (welcome) {
      welcome.style.opacity = '0';
      welcome.style.transform = 'scale(1.05)';
      setTimeout(() => {
        welcome.style.display = 'none';
        this.pageVisible = true;
        this.cdr.detectChanges();
      }, 600);
    }
  }

  // ─── TIMER ──────────────────────────────────────────
  startTimer(): void {
    if (!this.isBrowser) return;
    this.zone.runOutsideAngular(() => {
      this.updateTimer();
      this.timerInterval = setInterval(() => this.zone.run(() => this.updateTimer()), 1000);
    });
  }

  updateTimer(): void {
    if (!this.isBrowser) return;
    const diff = Date.now() - this.startDate.getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const set = (id: string, v: number, p: number) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(v).padStart(p, '0');
    };
    set('days', d, 3); set('hours', h, 2); set('minutes', m, 2); set('seconds', s, 2);
  }

  // ─── FLOATING HEARTS ────────────────────────────────
  createHearts(): void {
    if (!this.isBrowser) return;
    const container = document.getElementById('hearts-container');
    if (!container) return;
    const emojis = ['❤️', '💕', '💗', '💖', '💓', '💝'];
    const spawn = () => {
      const h = document.createElement('div');
      h.className = 'floating-heart';
      h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      h.style.left = Math.random() * 100 + 'vw';
      h.style.fontSize = Math.random() * 18 + 8 + 'px';
      h.style.animationDuration = Math.random() * 4 + 5 + 's';
      h.style.opacity = String(Math.random() * 0.4 + 0.2);
      container.appendChild(h);
      setTimeout(() => h.parentNode?.removeChild(h), 9000);
    };
    for (let i = 0; i < 12; i++) setTimeout(() => spawn(), i * 400);
    this.zone.runOutsideAngular(() => {
      this.heartsInterval = setInterval(() => spawn(), 700);
    });
  }

  // ─── ÁRBOL ANIMADO CON GERBERAS ─────────────────────
  initTree(): void {
    if (!this.isBrowser) return;
    const canvas = document.getElementById('loveTree') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || canvas.offsetWidth || 420;
      const h = rect.height || canvas.offsetHeight || 520;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };
    setSize();
    window.addEventListener('resize', () => { setSize(); buildCrown(); });

    // Vibrant multi-colored black-eyed gerberas (fuchsia, magenta, red, orange, gold, rose, peach)
    const gerberaColors = [
      { petal: '#FF3366', center: '#1a0a00' }, // Fuchsia
      { petal: '#E91E63', center: '#1a0a00' }, // Magenta
      { petal: '#FF6F00', center: '#1d0c00' }, // Deep orange
      { petal: '#FFD54F', center: '#1b0900' }, // Gold
      { petal: '#D32F2F', center: '#180700' }, // Red
      { petal: '#F06292', center: '#1e0c00' }, // Rose pink
      { petal: '#FF8A65', center: '#1a0800' }, // Coral peach
      { petal: '#FF9100', center: '#1d0b00' }, // Tangerine
      { petal: '#FFF176', center: '#160800' }, // Primrose yellow
      { petal: '#FF4081', center: '#1a0900' }, // Hot pink
      { petal: '#FFB300', center: '#1b0900' }, // Bright gold
      { petal: '#E040FB', center: '#1a0a00' }, // Orchid purple
    ];

    interface CrownGerbera {
      x: number; y: number; size: number;
      cacheIdx: number;
      alpha: number; rot: number; wobble: number; wobbleSpeed: number;
      isLeaf?: boolean;
    }
    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number;
      cacheIdx: number;
      rot: number; rotSpd: number;
    }

    // Color helpers
    const lighten = (hex: string, amt: number): string => {
      if (hex.startsWith('hsl')) return hex;
      const n = parseInt(hex.replace('#',''), 16);
      const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(amt * 255));
      const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(amt * 255));
      const b = Math.min(255, (n & 0xff) + Math.round(amt * 255));
      return `rgb(${r},${g},${b})`;
    };
    const darken = (hex: string, amt: number): string => {
      if (hex.startsWith('hsl')) return hex;
      const n = parseInt(hex.replace('#',''), 16);
      const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(amt * 255));
      const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(amt * 255));
      const b = Math.max(0, (n & 0xff) - Math.round(amt * 255));
      return `rgb(${r},${g},${b})`;
    };

    // Draw a single gerbera daisy (used for pre-rendering)
    const drawGerberaRaw = (
      c: CanvasRenderingContext2D,
      cx: number, cy: number,
      r: number,
      petalColor: string, centerColor: string
    ) => {
      // Gerberas have a lot of dense, thin petals. Let's make it 24 outer petals and 16 inner petals!
      const numPetals = 24;
      const petalLen = r * 1.55;
      const petalW = r * 0.32; // slightly thinner petals for authentic gerbera look
      
      // Outer petals
      for (let i = 0; i < numPetals; i++) {
        const angle = (i / numPetals) * Math.PI * 2;
        const px = cx + Math.cos(angle) * r * 0.35;
        const py = cy + Math.sin(angle) * r * 0.35;
        c.save();
        c.translate(px, py);
        c.rotate(angle + Math.PI / 2);
        c.beginPath();
        c.ellipse(0, petalLen / 2, petalW / 2, petalLen / 2, 0, 0, Math.PI * 2);
        
        // Petal gradient
        const pg = c.createLinearGradient(0, 0, 0, petalLen);
        pg.addColorStop(0, petalColor);
        pg.addColorStop(0.6, lighten(petalColor, 0.15));
        pg.addColorStop(1, lighten(petalColor, 0.45));
        c.fillStyle = pg;
        c.globalAlpha = 0.95;
        c.fill();
        c.restore();
      }
      
      // Inner petals (shorter, slightly offset angle for filling gaps)
      const numInner = 16;
      for (let i = 0; i < numInner; i++) {
        const angle = Math.PI / numInner + (i / numInner) * Math.PI * 2;
        const px = cx + Math.cos(angle) * r * 0.22;
        const py = cy + Math.sin(angle) * r * 0.22;
        c.save();
        c.translate(px, py);
        c.rotate(angle + Math.PI / 2);
        c.beginPath();
        c.ellipse(0, petalLen * 0.5, petalW * 0.35, petalLen * 0.5, 0, 0, Math.PI * 2);
        c.fillStyle = lighten(petalColor, 0.2);
        c.globalAlpha = 0.9;
        c.fill();
        c.restore();
      }
      
      // Center disk: dark brown/black with gold pollen ring
      const cg = c.createRadialGradient(cx, cy, 0, cx, cy, r * 0.38);
      cg.addColorStop(0, '#3a1800');
      cg.addColorStop(0.65, '#1b0900');
      cg.addColorStop(1, '#080200');
      c.beginPath();
      c.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
      c.fillStyle = cg;
      c.fill();
      
      // Center gold dots
      c.fillStyle = '#FFB300';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        c.beginPath();
        c.arc(cx + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25, r * 0.045, 0, Math.PI * 2);
        c.fill();
      }
    };

    // Draw organic leaf (used for pre-rendering)
    const drawLeafRaw = (c: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) => {
      c.save();
      c.translate(cx, cy);
      c.beginPath();
      c.moveTo(0, -r * 1.25);
      c.quadraticCurveTo(-r * 0.65, -r * 0.3, 0, r * 1.25);
      c.quadraticCurveTo(r * 0.65, -r * 0.3, 0, -r * 1.25);
      c.fillStyle = color;
      c.fill();
      
      // Center vein
      c.strokeStyle = darken(color, 0.3);
      c.lineWidth = r * 0.1;
      c.beginPath();
      c.moveTo(0, -r * 1.1);
      c.lineTo(0, r * 1.05);
      c.stroke();
      c.restore();
    };

    // Pre-render Gerberas, Leaves, and Sparkles to offscreen canvases for absolute maximum performance
    const gerberaCache: HTMLCanvasElement[] = [];
    const preRenderGerberas = () => {
      // 0-11: Gerberas
      gerberaColors.forEach((color) => {
        const off = document.createElement('canvas');
        off.width = 120;
        off.height = 120;
        const oCtx = off.getContext('2d')!;
        drawGerberaRaw(oCtx, 60, 60, 24, color.petal, color.center);
        gerberaCache.push(off);
      });

      // 12: Forest green leaf
      const leafCanvas1 = document.createElement('canvas');
      leafCanvas1.width = 120;
      leafCanvas1.height = 120;
      drawLeafRaw(leafCanvas1.getContext('2d')!, 60, 60, 22, '#2e7d32');
      gerberaCache.push(leafCanvas1);

      // 13: Light grass green leaf
      const leafCanvas2 = document.createElement('canvas');
      leafCanvas2.width = 120;
      leafCanvas2.height = 120;
      drawLeafRaw(leafCanvas2.getContext('2d')!, 60, 60, 22, '#4caf50');
      gerberaCache.push(leafCanvas2);

      // 14: Golden glow sparkle
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = 120;
      glowCanvas.height = 120;
      const gCtx = glowCanvas.getContext('2d')!;
      const gGrad = gCtx.createRadialGradient(60, 60, 0, 60, 60, 30);
      gGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gGrad.addColorStop(0.3, 'rgba(255, 223, 75, 0.9)');
      gGrad.addColorStop(0.7, 'rgba(255, 180, 0, 0.25)');
      gGrad.addColorStop(1, 'rgba(255, 180, 0, 0)');
      gCtx.fillStyle = gGrad;
      gCtx.beginPath();
      gCtx.arc(60, 60, 30, 0, Math.PI * 2);
      gCtx.fill();
      gerberaCache.push(glowCanvas);
    };
    preRenderGerberas();

    const drawCachedGerbera = (
      c: CanvasRenderingContext2D,
      cx: number, cy: number,
      r: number, // target radius
      cacheIdx: number,
      rot: number,
      alpha: number
    ) => {
      const img = gerberaCache[cacheIdx];
      c.save();
      c.globalAlpha = alpha;
      c.translate(cx, cy);
      c.rotate(rot);
      const scale = r / 24;
      c.drawImage(img, -60 * scale, -60 * scale, 120 * scale, 120 * scale);
      c.restore();
    };

    let crownGerberas: CrownGerbera[] = [];
    const particles: Particle[] = [];

    const buildCrown = () => {
      crownGerberas = [];
      const rect = canvas.getBoundingClientRect();
      const W = rect.width || canvas.offsetWidth || 420;
      const H = rect.height || canvas.offsetHeight || 520;
      const cx = W / 2;
      const cy = H * 0.35; 
      const R = Math.min(W, H) * 0.46; // larger heart layout bounds

      // Total elements = 500 (less packed, making individual flowers distinct and detailed)
      const totalElements = 500;

      for (let i = 0; i < totalElements; i++) {
        // Generate points inside a parametric Heart Shape
        const t = Math.random() * Math.PI * 2;
        const rFactor = Math.pow(Math.random(), 0.72) * R;
        
        // Parametric heart coordinates
        const xOffset = rFactor * (16 * Math.pow(Math.sin(t), 3)) / 16;
        const yOffset = -rFactor * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;

        const x = cx + xOffset;
        const y = cy + yOffset * 0.95;

        // Leaf chance
        const isLeaf = Math.random() < 0.04;
        let cacheIdx = 0;
        let size = 0;
        
        if (isLeaf) {
          cacheIdx = Math.random() < 0.5 ? 12 : 13;
          size = Math.random() * 5 + 9.5; // larger leaf size
        } else {
          cacheIdx = Math.floor(Math.random() * gerberaColors.length);
          const sizeRand = Math.random();
          if (sizeRand < 0.15) {
            size = Math.random() * 5 + 20.0; // giant standout flowers (20 - 25 radius)
          } else if (sizeRand > 0.85) {
            size = Math.random() * 4 + 9.5; // detail flowers (9.5 - 13.5 radius)
          } else {
            size = Math.random() * 6 + 13.5; // standard flowers (13.5 - 19.5 radius)
          }
        }

        crownGerberas.push({
          x, y,
          size,
          cacheIdx,
          alpha: isLeaf ? (0.7 + Math.random() * 0.2) : (0.85 + Math.random() * 0.15),
          rot: Math.random() * Math.PI * 2,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.005 + Math.random() * 0.012,
          isLeaf,
        });
      }
      
      // Depth-sort elements
      crownGerberas.sort((a, b) => a.y - b.y);
    };
    buildCrown();

    // Background leaves helper
    const drawLeaf = (c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number) => {
      const mx = (x1 + x2) / 2 + (y2 - y1) * 0.25;
      const my = (y1 + y2) / 2 - (x2 - x1) * 0.25;
      c.save();
      c.beginPath();
      c.moveTo(x1, y1);
      c.quadraticCurveTo(mx - w, my - w, x2, y2);
      c.quadraticCurveTo(mx + w, my + w, x1, y1);
      c.fillStyle = `hsl(${120 + Math.random() * 30},60%,${30 + Math.random() * 15}%)`;
      c.globalAlpha = 0.5;
      c.fill();
      c.restore();
    };

    const spawnParticle = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width || canvas.offsetWidth || 420;
      const H = rect.height || canvas.offsetHeight || 520;
      const cx = W / 2;
      const cy = H * 0.35;
      const R = Math.min(W, H) * 0.44;
      
      // Spawn within heart shape boundaries
      const t = Math.random() * Math.PI * 2;
      const rFactor = Math.random() * R;
      const x = cx + rFactor * (16 * Math.pow(Math.sin(t), 3)) / 16;
      const y = cy - rFactor * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
      
      const isSparkle = Math.random() < 0.4;
      if (isSparkle) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 0.8,
          vy: Math.random() * 0.3 + 0.15,
          size: Math.random() * 4.5 + 3,
          alpha: 0.95,
          cacheIdx: 14,
          rot: Math.random() * Math.PI * 2,
          rotSpd: (Math.random() - 0.5) * 0.03,
        });
      } else {
        const cacheIdx = Math.floor(Math.random() * gerberaColors.length);
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 1.0,
          vy: Math.random() * 0.4 + 0.3,
          size: Math.random() * 5 + 4,
          alpha: 0.9,
          cacheIdx,
          rot: Math.random() * Math.PI * 2,
          rotSpd: (Math.random() - 0.5) * 0.04,
        });
      }
    };

    // Draw branch with organic bark textures, shadow overlay, and highlight details
    const drawTexturedBranch = (
      x1: number, y1: number,
      cp1x: number, cp1y: number,
      cp2x: number, cp2y: number,
      x2: number, y2: number,
      w: number,
      tg: CanvasGradient
    ) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // 1. Bottom shadow stroke for 3D depth
      ctx.lineWidth = w + 3.5;
      ctx.strokeStyle = '#1a0a00';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      ctx.stroke();
      
      // 2. Core branch bark
      ctx.lineWidth = w;
      ctx.strokeStyle = tg;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      ctx.stroke();
      
      // 3. Highlight stripe on the top/left edge to emulate soft ambient light
      ctx.lineWidth = w * 0.22;
      ctx.strokeStyle = 'rgba(210, 150, 95, 0.42)';
      ctx.beginPath();
      ctx.moveTo(x1 - w * 0.08, y1);
      ctx.bezierCurveTo(cp1x - w * 0.08, cp1y, cp2x - w * 0.08, cp2y, x2 - w * 0.08, y2);
      ctx.stroke();

      // 4. Subtle inner center bark shadow line to texture the wood
      ctx.lineWidth = w * 0.08;
      ctx.strokeStyle = 'rgba(35, 12, 0, 0.35)';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      ctx.stroke();
      
      ctx.restore();
    };

    let frame = 0;
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width || canvas.offsetWidth || 420;
      const H = rect.height || canvas.offsetHeight || 520;
      ctx.clearRect(0, 0, W, H);
      const mx = W / 2;

      // ── ABUNDANT CANOPY BACKDROP (SHADOW/FOLIAGE) ──
      ctx.save();
      const cx = W / 2;
      const cy = H * 0.35;
      const R = Math.min(W, H) * 0.44;
      
      // Soft background foliage glow (rose-orange to highlight the multi-colored flowers)
      const radGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, R * 1.25);
      radGrad.addColorStop(0, 'rgba(255, 64, 129, 0.26)'); // rose fuchsia glow
      radGrad.addColorStop(0.5, 'rgba(255, 179, 0, 0.18)'); // golden orange ring
      radGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2);
      ctx.fill();
      
      // Outer puffs arranged to form a soft heart outline behind the branches
      ctx.fillStyle = 'rgba(233, 30, 99, 0.08)';
      for (let t = 0; t < Math.PI * 2; t += Math.PI / 6) {
        const xOffset = R * 0.9 * (16 * Math.pow(Math.sin(t), 3)) / 16;
        const yOffset = -R * 0.9 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
        ctx.beginPath();
        ctx.arc(cx + xOffset, cy + yOffset, R * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ── TRUNK & BRANCHES (Designed to support a heart shape canopy) ──
      const tg = ctx.createLinearGradient(mx - 14, 0, mx + 16, 0);
      tg.addColorStop(0, '#3E1A00');
      tg.addColorStop(0.45, '#7B3F00');
      tg.addColorStop(1, '#5C2D00');

      // Main trunk
      drawTexturedBranch(mx, H * 0.99, mx - 8, H * 0.80, mx + 5, H * 0.68, mx - 2, H * 0.56, 28, tg);

      // Center-Up Trunk fanning out
      drawTexturedBranch(mx - 2, H * 0.56, mx - 8, H * 0.48, mx + 4, H * 0.43, mx, H * 0.38, 18, tg);

      // Left branch fanning wide left lobe
      drawTexturedBranch(mx - 2, H * 0.56, mx - 38, H * 0.51, mx - 80, H * 0.45, mx - 110, H * 0.40, 13, tg);

      // Right branch fanning wide right lobe
      drawTexturedBranch(mx - 2, H * 0.56, mx + 38, H * 0.51, mx + 80, H * 0.45, mx + 110, H * 0.40, 13, tg);

      // Inner Left Branch fanning up
      drawTexturedBranch(mx - 2, H * 0.56, mx - 22, H * 0.48, mx - 40, H * 0.40, mx - 55, H * 0.32, 10, tg);

      // Inner Right Branch fanning up
      drawTexturedBranch(mx - 2, H * 0.56, mx + 22, H * 0.48, mx + 40, H * 0.40, mx + 55, H * 0.32, 10, tg);

      // Twigs fanning out from branch ends
      drawTexturedBranch(mx - 110, H * 0.40, mx - 128, H * 0.34, mx - 138, H * 0.28, mx - 142, H * 0.22, 6, tg);
      drawTexturedBranch(mx - 110, H * 0.40, mx - 118, H * 0.32, mx - 122, H * 0.25, mx - 115, H * 0.18, 5, tg);

      drawTexturedBranch(mx + 110, H * 0.40, mx + 128, H * 0.34, mx + 138, H * 0.28, mx + 142, H * 0.22, 6, tg);
      drawTexturedBranch(mx + 110, H * 0.40, mx + 118, H * 0.32, mx + 122, H * 0.25, mx + 115, H * 0.18, 5, tg);

      drawTexturedBranch(mx, H * 0.38, mx - 15, H * 0.30, mx - 22, H * 0.22, mx - 26, H * 0.15, 6, tg);
      drawTexturedBranch(mx, H * 0.38, mx + 15, H * 0.30, mx + 22, H * 0.22, mx + 26, H * 0.15, 6, tg);

      // ── LEAVES scattered on branches ──
      const leafPositions = [
        [mx - 55, H * 0.46, mx - 72, H * 0.41, 7],
        [mx + 50, H * 0.45, mx + 68, H * 0.40, 7],
        [mx - 95, H * 0.41, mx - 108, H * 0.35, 6],
        [mx + 92, H * 0.40, mx + 105, H * 0.34, 6],
        [mx - 115, H * 0.28, mx - 126, H * 0.22, 5],
        [mx + 112, H * 0.27, mx + 124, H * 0.21, 5],
        [mx - 20, H * 0.32, mx - 30, H * 0.27, 5],
        [mx + 18, H * 0.31, mx + 28, H * 0.26, 5],
      ];
      for (const [x1,y1,x2,y2,w] of leafPositions) {
        drawLeaf(ctx, x1 as number, y1 as number, x2 as number, y2 as number, w as number);
      }

      // ── CROWN ELEMENTS (using fast offscreen cache + wobble) ──
      for (const g of crownGerberas) {
        g.wobble += g.wobbleSpeed;
        const wobX = Math.sin(g.wobble) * 0.8;
        const wobY = Math.cos(g.wobble * 0.8) * 0.5;
        const wobbleFactor = g.isLeaf ? 0.18 : 0.25;
        drawCachedGerbera(ctx, g.x + wobX, g.y + wobY, g.size, g.cacheIdx, g.rot + g.wobble * wobbleFactor, g.alpha);
      }

      // Spawn falling gerberas and golden sparkles
      if (frame % 8 === 0) spawnParticle();
      frame++;

      // Falling particles (cached mini-gerberas & golden sparkles)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.cacheIdx === 14 ? 0.008 : 0.012; // sparkles drift down slower
        p.vx += Math.sin(frame * 0.02 + i * 0.5) * 0.02;
        p.rot += p.rotSpd;
        p.alpha -= p.cacheIdx === 14 ? 0.006 : 0.004; // sparkles fade a bit faster
        if (p.alpha <= 0 || p.y > H + 30) { particles.splice(i, 1); continue; }
        drawCachedGerbera(ctx, p.x, p.y, p.size, p.cacheIdx, p.rot, p.alpha);
      }

      this.treeAnimFrame = requestAnimationFrame(animate);
    };

    this.zone.runOutsideAngular(() => animate());
  }

  // ─── FONDO DE GALAXIA DE CORAZONES ──────────────────
  initBackgroundAnimation(): void {
    if (!this.isBrowser) return;
    const canvas = document.getElementById('bgCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };
    setSize();
    window.addEventListener('resize', setSize);

    // Seguimiento del mouse
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    interface BgHeart {
      centerX: number;
      centerY: number;
      radius: number;
      radiusGrowth: number;
      theta: number;
      speed: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
      wobbleSpeed: number;
      wobbleRange: number;
      wobblePhase: number;
    }

    const hearts: BgHeart[] = [];

    // Paleta de colores degradados estilo Antigravity
    const getSwirlColor = (scalePercent: number): string => {
      if (scalePercent < 0.25) {
        // Amarillo a Naranja (Centro)
        const ratio = scalePercent / 0.25;
        const r = 255;
        const g = Math.round(180 + ratio * 40);
        const b = Math.round(ratio * 80);
        return `rgb(${r}, ${g}, ${b})`;
      } else if (scalePercent < 0.6) {
        // Naranja a Fucsia/Rojo (Medio)
        const ratio = (scalePercent - 0.25) / 0.35;
        const r = Math.round(255 - ratio * 20);
        const g = Math.round(80 - ratio * 50);
        const b = Math.round(50 + ratio * 70);
        return `rgb(${r}, ${g}, ${b})`;
      } else {
        // Rojo/Fucsia a Azul/Morado (Exterior)
        const ratio = (scalePercent - 0.6) / 0.4;
        const r = Math.round(235 - ratio * 150);
        const g = Math.round(30 + ratio * 30);
        const b = Math.round(120 + ratio * 135);
        return `rgb(${r}, ${g}, ${b})`;
      }
    };

    // Función para crear un corazón en las coordenadas especificadas
    const spawnHeart = (x: number, y: number) => {
      // Limitar a un máximo de 500 partículas activas
      if (hearts.length > 500) return;
      
      const scalePercent = Math.random();
      hearts.push({
        centerX: x,
        centerY: y,
        radius: 2,
        radiusGrowth: 0.25 + Math.random() * 0.35, // Expansión de espiral notablemente más lenta
        theta: Math.random() * Math.PI * 2,
        speed: (0.008 + Math.random() * 0.012) * (Math.random() < 0.5 ? 1 : -1), // Giro más lento y fluido
        size: Math.random() * 5 + 3, // corazones de tamaño 3px a 8px
        color: getSwirlColor(scalePercent),
        alpha: 1.0,
        decay: 0.0025 + Math.random() * 0.0035, // Mayor duración para crear estelas continuas
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        wobbleRange: 3 + Math.random() * 5,
        wobblePhase: Math.random() * Math.PI * 2,
      });
    };

    window.addEventListener('mousemove', (e) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
      // Generar corazones al mover el mouse
      spawnHeart(e.clientX, e.clientY);
      if (Math.random() < 0.6) spawnHeart(e.clientX, e.clientY);
    });

    window.addEventListener('mouseleave', () => {
      mouse.tx = -9999;
      mouse.ty = -9999;
    });

    // Pre-renderizar corazones para optimización a 60 FPS
    const colorsList = [
      '#FFD54F', // Amarillo
      '#FF9100', // Naranja
      '#FF3366', // Fucsia
      '#E91E63', // Magenta
      '#D32F2F', // Rojo
      '#C2185B', // Rosa oscuro
      '#E040FB', // Morado
      '#2979FF', // Azul
    ];

    const heartTemplates: HTMLCanvasElement[] = [];
    const preRenderHearts = () => {
      colorsList.forEach((cHex) => {
        const sizes = [2, 4, 6, 8];
        sizes.forEach((s) => {
          const off = document.createElement('canvas');
          off.width = s * 3;
          off.height = s * 3;
          const oCtx = off.getContext('2d')!;
          const cx = (s * 3) / 2;
          const cy = (s * 3) / 2;
          
          oCtx.beginPath();
          oCtx.moveTo(cx, cy - s * 0.3);
          oCtx.bezierCurveTo(cx - s * 0.5, cy - s * 0.9, cx - s * 1.2, cy - s * 0.4, cx, cy + s * 0.9);
          oCtx.bezierCurveTo(cx + s * 1.2, cy - s * 0.4, cx + s * 0.5, cy - s * 0.9, cx, cy - s * 0.3);
          oCtx.closePath();
          oCtx.fillStyle = cHex;
          oCtx.fill();
          
          heartTemplates.push(off);
        });
      });
    };
    preRenderHearts();

    const getTemplateIdx = (rgbColor: string, size: number): number => {
      let sIdx = 1;
      if (size < 3) sIdx = 0;
      else if (size < 5) sIdx = 1;
      else if (size < 7) sIdx = 2;
      else sIdx = 3;

      let cIdx = 0;
      if (rgbColor.includes('rgb')) {
        const matches = rgbColor.match(/\d+/g);
        if (matches && matches.length >= 3) {
          const r = parseInt(matches[0]);
          const g = parseInt(matches[1]);
          const b = parseInt(matches[2]);
          
          if (r > 230 && g > 150) cIdx = 0;
          else if (r > 230 && g > 80 && g <= 150) cIdx = 1;
          else if (r > 230 && g < 80 && b > 80) cIdx = 2;
          else if (r > 200 && g < 50 && b > 100) cIdx = 3;
          else if (r > 180 && g < 50 && b < 50) cIdx = 4;
          else if (r > 120 && g < 30 && b > 50 && b < 100) cIdx = 5;
          else if (r > 100 && b > 180) cIdx = 6;
          else cIdx = 7;
        }
      }
      return cIdx * 4 + sIdx;
    };

    let frame = 0;
    const animate = () => {
      // Estela más sutil y persistente (borrado más lento para máxima fluidez)
      ctx.fillStyle = 'rgba(33, 2, 6, 0.07)'; 
      ctx.fillRect(0, 0, W, H);

      if (mouse.tx !== -9999) {
        if (mouse.x === -9999) {
          mouse.x = mouse.tx;
          mouse.y = mouse.ty;
        } else {
          mouse.x += (mouse.tx - mouse.x) * 0.15;
          mouse.y += (mouse.ty - mouse.y) * 0.15;
        }
      } else {
        mouse.x = -9999;
        mouse.y = -9999;
      }

      frame++;

      // Si el mouse está activo e inmóvil, spawnear corazones de forma continua y sutil
      if (frame % 5 === 0 && mouse.x !== -9999) {
        spawnHeart(mouse.x, mouse.y);
      }

      // Actualizar y dIbujar corazones (recorriendo al revés para poder remover de forma segura)
      for (let i = hearts.length - 1; i >= 0; i--) {
        const p = hearts[i];
        p.radius += p.radiusGrowth;
        p.theta += p.speed;
        p.alpha -= p.decay;
        p.centerY -= 0.2; // Ascenso más lento y natural

        if (p.alpha <= 0) {
          hearts.splice(i, 1);
          continue;
        }

        // Trayectoria paramétrica del corazón alrededor de su origen
        const hx = 16 * Math.pow(Math.sin(p.theta), 3) / 16;
        const hy = -(13 * Math.cos(p.theta) - 5 * Math.cos(2 * p.theta) - 2 * Math.cos(3 * p.theta) - Math.cos(4 * p.theta)) / 16;

        let targetX = p.centerX + p.radius * hx;
        let targetY = p.centerY + p.radius * hy;

        // Balanceo orgánico de las partículas
        p.wobblePhase += p.wobbleSpeed;
        targetX += Math.sin(p.wobblePhase) * p.wobbleRange * 0.15;
        targetY += Math.cos(p.wobblePhase * 0.8) * p.wobbleRange * 0.15;

        const tIdx = getTemplateIdx(p.color, p.size);
        const img = heartTemplates[tIdx];
        if (img) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          const rot = p.theta * 0.3 + frame * 0.005;
          ctx.translate(targetX, targetY);
          ctx.rotate(rot);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          ctx.restore();
        }
      }

      this.bgAnimFrame = requestAnimationFrame(animate);
    };

    this.zone.runOutsideAngular(() => animate());
  }

  // ─── PHOTOS ─────────────────────────────────────────
  openPhoto(index: number): void {
    if (index < this.photos.length) {
      this.currentPhotoIndex = index;
      this.lightboxSrc = this.photos[index].src;
      this.lightboxOpen = true;
    }
  }

  closeLightbox(): void { this.lightboxOpen = false; }

  prevPhoto(): void {
    this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.photos.length) % this.photos.length;
    this.lightboxSrc = this.photos[this.currentPhotoIndex].src;
  }

  nextPhoto(): void {
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.photos.length;
    this.lightboxSrc = this.photos[this.currentPhotoIndex].src;
  }

  addPhotoFromUrl(): void {
    this.photoUrlError = '';
    const url = this.newPhotoUrl.trim();
    const label = this.newPhotoLabel.trim() || 'Recuerdo Especial';

    if (!url) {
      this.photoUrlError = 'Por favor, ingresa un link de imagen.';
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
      this.photoUrlError = 'URL no válida. Asegúrate de que comience con http:// o https://';
      return;
    }

    fetch(`${this.API}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src: url, label }),
    })
      .then(r => r.json())
      .then(photo => {
        this.photos.unshift({ src: photo.src, label: photo.label });
        this.newPhotoUrl = '';
        this.newPhotoLabel = '';
        this.cdr.detectChanges();
      })
      .catch(() => { this.photoUrlError = 'Error al guardar la foto. ¿Está corriendo el backend?'; });
  }

  // ─── YOUTUBE ────────────────────────────────────────
  extractVideoId(url: string): string | null {
    try {
      const u = new URL(url.trim());
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1].split('?')[0];
        return u.searchParams.get('v');
      }
    } catch {
      // try regex fallback
      const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    }
    return null;
  }

  addVideo(): void {
    this.videoUrlError = '';
    const id = this.extractVideoId(this.newVideoUrl);
    if (!id) {
      this.videoUrlError = 'URL no válida. Asegúrate de que sea un link de YouTube.';
      return;
    }

    fetch(`${this.API}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yt_id: id }),
    })
      .then(r => r.json())
      .then(video => {
        const now = new Date();
        const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube.com/embed/${video.yt_id}?rel=0`
        );
        this.videos.unshift({
          id: video.id,
          ytId: video.yt_id,
          safeUrl,
          date: now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
          time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        });
        this.newVideoUrl = '';
        this.cdr.detectChanges();
      })
      .catch(() => { this.videoUrlError = 'Error al guardar el video. ¿Está corriendo el backend?'; });
  }

  deleteVideo(id: string): void {
    fetch(`${this.API}/videos/${id}`, { method: 'DELETE' })
      .then(() => {
        this.videos = this.videos.filter(v => v.id !== id);
        this.cdr.detectChanges();
      });
  }

  // ─── NOTES ──────────────────────────────────────────
  addNote(): void {
    if (!this.newNoteText.trim()) return;
    const color = this.noteColors[this.notes.length % this.noteColors.length];

    fetch(`${this.API}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: this.newNoteTitle.trim(), text: this.newNoteText.trim(), color }),
    })
      .then(r => r.json())
      .then(note => {
        this.notes.unshift({
          id: note.id,
          title: note.title,
          text: note.text,
          color: note.color,
          date: new Date(note.created_at).toLocaleDateString('es-ES'),
          time: new Date(note.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        });
        this.newNoteTitle = '';
        this.newNoteText = '';
        this.cdr.detectChanges();
      })
      .catch(() => console.error('Error al guardar nota'));
  }

  deleteNote(id: string): void {
    fetch(`${this.API}/notes/${id}`, { method: 'DELETE' })
      .then(() => {
        this.notes = this.notes.filter(n => n.id !== id);
        this.cdr.detectChanges();
      });
  }

  // ─── PERSISTENCE (Backend) ──────────────────────────────────────────────
  async loadFromBackend(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      // 1. Cargar fecha de inicio desde el backend (.env.local > LOVE_START_DATE)
      const cfgRes = await fetch(`${this.API}/config`);
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        this.startDate = new Date(cfg.startDate);
      }

      // 2. Cargar fotos
      const photosRes = await fetch(`${this.API}/photos`);
      if (photosRes.ok) {
        const photosData = await photosRes.json();
        this.photos = Array.isArray(photosData)
          ? photosData.map((p: any) => ({ src: p.src, label: p.label }))
          : [];
      }

      // 3. Cargar videos
      const videosRes = await fetch(`${this.API}/videos`);
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        if (Array.isArray(videosData)) {
          this.videos = videosData.map((v: any) => ({
            id: v.id,
            ytId: v.yt_id,
            safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(
              `https://www.youtube.com/embed/${v.yt_id}?rel=0`
            ),
            date: new Date(v.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
            time: new Date(v.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          }));
        }
      }

      // 4. Cargar notas
      const notesRes = await fetch(`${this.API}/notes`);
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        if (Array.isArray(notesData)) {
          this.notes = notesData.map((n: any) => ({
            id: n.id,
            title: n.title ?? '',
            text: n.text,
            color: n.color ?? '#ff4d4d',
            date: new Date(n.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
            time: new Date(n.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          }));
        }
      }

      this.cdr.detectChanges();
    } catch (e) {
      console.warn('Backend no disponible, usando localStorage como fallback');
      this.loadFromStorage();
    }
  }

  // ─── FALLBACK: localStorage (si el backend no está corriendo) ───────────
  loadFromStorage(): void {
    if (!this.isBrowser) return;
    try {
      const notesRaw = localStorage.getItem('love_notes');
      if (notesRaw) {
        const parsed = JSON.parse(notesRaw);
        this.notes = Array.isArray(parsed) ? parsed : [];
      } else {
        // Default note
        this.notes = [{
          id: 'default',
          title: 'Bienvenida',
          text: 'Aquí aparecerán tus notas y mensajes. ¡Escribe lo que sientes!',
          date: new Date().toLocaleDateString('es-ES'),
          time: new Date().toLocaleTimeString('es-ES'),
          color: '#ff4d4d'
        }];
      }

      const photosRaw = localStorage.getItem('love_photos');
      if (photosRaw) {
        const parsed = JSON.parse(photosRaw);
        this.photos = Array.isArray(parsed) ? parsed : [];
      } else {
        // Default photos
        this.photos = [
          { src: 'couple1.png', label: 'Nuestro primer momento' },
          { src: 'couple2.png', label: 'Risas juntos' },
          { src: 'couple3.png', label: 'Para siempre' },
        ];
      }

      const videosRaw = localStorage.getItem('love_videos');
      if (videosRaw) {
        const parsed = JSON.parse(videosRaw);
        if (Array.isArray(parsed)) {
          this.videos = parsed.map((v: any) => ({
            id: v.id,
            ytId: v.ytId || this.extractVideoId(v.url || '') || '',
            safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${v.ytId || this.extractVideoId(v.url || '')}?rel=0`),
            date: v.date,
            time: v.time
          }));
        } else {
          this.videos = [];
        }
      } else {
        // Default video (a romantic one)
        const defId = 'lp-EO5I6OHk'; // Just an example romantic music video
        this.videos = [{
          id: 'default-vid',
          ytId: defId,
          safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${defId}?rel=0`),
          date: new Date().toLocaleDateString('es-ES'),
          time: new Date().toLocaleTimeString('es-ES')
        }];
      }
    } catch (e) {
      this.notes = [];
      this.photos = [];
      this.videos = [];
    }
  }
}
