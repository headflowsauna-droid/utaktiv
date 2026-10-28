import React, { useRef, useState, useEffect } from 'react';
import { Sun, Sparkles, Check } from 'lucide-react';

interface Interactive3DCardProps {
  packageName: string;
  points: number;
  bonusPoints: number;
  senderName: string;
  recipientName: string;
  message: string;
  code?: string;
  onScratchedComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  vRot: number;
}

export const Interactive3DCard: React.FC<Interactive3DCardProps> = ({
  packageName,
  points,
  bonusPoints,
  senderName,
  recipientName,
  message,
  code = 'SOL-JULEMINNE-2026',
  onScratchedComplete,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Transform State (vinkler og glans)
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [isScratched, setIsScratched] = useState(false);

  // Partikkelsystem for gullstøv som drysser av ved skraping
  const particlesRef = useRef<Particle[]>([]);
  const isScratchingRef = useRef(false);

  // 1. Gyroskop / Musestyrt 3D tilt & Speilrefleksjon
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Maks 18 graders tilt
    const rotX = ((y - centerY) / centerY) * -14;
    const rotY = ((x - centerX) / centerX) * 14;

    setRotateX(rotX);
    setRotateY(rotY);

    // Glans-lyspunkt
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePos({ x: glareX, y: glareY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Myk fjæring tilbake til nøytral posisjon
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50 });
  };

  // Gyroskop på mobil (DeviceOrientation)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // Gamma er tilt venstre/høyre (-90 til 90)
        // Beta er tilt forover/bakover (-180 til 180)
        const clampGamma = Math.max(-30, Math.min(30, e.gamma));
        const clampBeta = Math.max(10, Math.min(70, e.beta)) - 40; // Nøytralt rundt 40 grader

        setRotateY(clampGamma * 0.6);
        setRotateX(clampBeta * -0.6);

        const gx = 50 + clampGamma * 1.5;
        const gy = 50 + clampBeta * 1.5;
        setGlarePos({ x: Math.max(0, Math.min(100, gx)), y: Math.max(0, Math.min(100, gy)) });
      }
    };

    if (window.DeviceOrientationEvent && typeof (window.DeviceOrientationEvent as any).requestPermission !== 'function') {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // 2. Initialiser Skrapefelt-canvas (Gullfolie-belegg)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Gullfolie-gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.25, '#fde68a');
    grad.addColorStop(0.5, '#d97706');
    grad.addColorStop(0.75, '#fef08a');
    grad.addColorStop(1, '#b45309');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Mønster / metallisk glitter
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      ctx.fillRect(rx, ry, 2, 2);
    }

    // Tekst på skrapefeltet
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ SKRAP FREM GULLKODEN ✨', w / 2, h / 2);
  }, [packageName]);

  // 3. Partikkel-animasjonsloop (Gullflak som drysser)
  useEffect(() => {
    const pCanvas = particleCanvasRef.current;
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return;

    let animId: number;

    const renderParticles = () => {
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // Gravitasjon
        p.rotation += p.vRot;
        p.alpha -= 0.015;

        if (p.alpha <= 0 || p.y > pCanvas.height) {
          particles.splice(i, 1);
          continue;
        }

        pCtx.save();
        pCtx.translate(p.x, p.y);
        pCtx.rotate(p.rotation);
        pCtx.globalAlpha = p.alpha;
        pCtx.fillStyle = p.color;
        pCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        pCtx.restore();
      }

      animId = requestAnimationFrame(renderParticles);
    };

    animId = requestAnimationFrame(renderParticles);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 4. Skrapelogikk
  const spawnGoldDust = (x: number, y: number) => {
    const goldColors = ['#fde68a', '#f59e0b', '#fbbf24', '#ffffff', '#d97706'];
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.8) * 3,
        size: Math.random() * 4 + 2,
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
        alpha: 1,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
      });
    }
  };

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Spawn partikler i overordnet canvas
    const pCanvas = particleCanvasRef.current;
    if (pCanvas) {
      const pRect = pCanvas.getBoundingClientRect();
      spawnGoldDust(clientX - pRect.left, clientY - pRect.top);
    }

    // Beregn hvor mye som er skrapt en gang i blant
    if (Math.random() > 0.6) {
      checkScratchPercentage();
    }
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentPixels = 0;
    const totalPixels = imgData.data.length / 4;

    for (let i = 3; i < imgData.data.length; i += 16) {
      if (imgData.data[i] === 0) {
        transparentPixels++;
      }
    }

    const percent = Math.round((transparentPixels / (totalPixels / 4)) * 100);

    if (percent > 45 && !isScratched) {
      setIsScratched(true);
      // Fjern resten av canvaset for perfekt synlighet
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onScratchedComplete?.();
    }
  };

  return (
    <div className="relative w-full py-4 flex flex-col items-center justify-center [perspective:1200px]">
      {/* 3D-KORTET */}
      <div
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.025 : 1})`,
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        className="relative w-full max-w-md aspect-[1.62/1] rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#0c0a09] border border-amber-500/40 shadow-2xl shadow-orange-950/60 overflow-hidden select-none cursor-grab active:cursor-grabbing"
      >
        {/* METALLISK SPEILREFLEKSJON / SPECULAR GLARE */}
        <div
          style={{
            background: `radial-gradient(circle 280px at ${glarePos.x}% ${glarePos.y}%, rgba(254, 240, 138, 0.35), rgba(245, 158, 11, 0.12) 40%, transparent 80%)`,
          }}
          className="absolute inset-0 pointer-events-none rounded-3xl z-30 transition-opacity duration-300"
        />

        {/* EKTE GULLFOLIE-KANT */}
        <div
          style={{
            background: `radial-gradient(circle 350px at ${glarePos.x}% ${glarePos.y}%, rgba(254, 243, 199, 0.8), transparent 70%)`,
          }}
          className="absolute inset-0 rounded-3xl border border-amber-300/30 pointer-events-none z-30"
        />

        {/* GULLPREGET LOGO & TITTEL ØVERST */}
        <div className="relative z-20 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-300 to-yellow-100 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#1c1917] rounded-[14px] flex items-center justify-center">
                <Sun className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 uppercase">
                UTAKTIV • JULEGAVEKORT
              </span>
              <h3 className="text-base sm:text-lg font-black text-white font-serif-display leading-tight drop-shadow-md">
                {packageName}
              </h3>
            </div>
          </div>

          {/* GULL-BADGE MED LUKS-POENG */}
          <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/50 backdrop-blur-md shadow-md text-right">
            <div className="text-[11px] font-black font-mono text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {(points + bonusPoints).toLocaleString('no-NO')} POENG
            </div>
          </div>
        </div>

        {/* HILSEN & MOTTAKER */}
        <div className="relative z-20 mt-4 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.08] text-xs text-stone-200 leading-relaxed min-h-[58px]">
          <p className="line-clamp-2 italic text-[11px] text-amber-100/90 font-serif">
            "{message || 'Kjære barnebarn! I år får dere minner og dagslys...'}"
          </p>
          <div className="mt-1 flex items-center justify-between text-[10px] text-amber-400/80 font-bold">
            <span>Fra: {senderName || 'Besteforeldre'}</span>
            <span>Til: {recipientName || 'Barnebarn'}</span>
          </div>
        </div>

        {/* INTERAKTIVT SKRAPEFELT MED GULLFOLIE & KODE */}
        <div className="relative z-20 mt-4 flex items-center justify-between gap-3">
          <div className="relative flex-1 h-12 rounded-2xl overflow-hidden border border-amber-400/60 shadow-inner bg-black/80 flex items-center justify-center">
            {/* Koden under skrapefeltet */}
            <div className="flex items-center gap-2 px-3">
              <span className="text-[10px] uppercase font-bold text-stone-400">GAVEKODE:</span>
              <span className="text-xs sm:text-sm font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-200 tracking-wider">
                {code}
              </span>
              {isScratched && (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
            </div>

            {/* Skrape-canvas over koden */}
            <canvas
              ref={canvasRef}
              width={280}
              height={48}
              onMouseDown={() => (isScratchingRef.current = true)}
              onMouseUp={() => (isScratchingRef.current = false)}
              onMouseLeave={() => (isScratchingRef.current = false)}
              onMouseMove={(e) => {
                if (isScratchingRef.current) {
                  scratchAt(e.clientX, e.clientY);
                }
              }}
              onTouchStart={() => (isScratchingRef.current = true)}
              onTouchEnd={() => (isScratchingRef.current = false)}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                scratchAt(touch.clientX, touch.clientY);
              }}
              className="absolute inset-0 w-full h-full cursor-pointer touch-none z-10 transition-opacity duration-300"
            />
          </div>

          <div className="text-right shrink-0">
            <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-bold">Verdi</span>
            <span className="text-sm font-black text-white font-mono">
              {(points + bonusPoints).toLocaleString('no-NO')} kr
            </span>
          </div>
        </div>

        {/* PARTIKKEL-CANVAS (Gullstøv som drysser av) */}
        <canvas
          ref={particleCanvasRef}
          width={450}
          height={280}
          className="absolute inset-0 w-full h-full pointer-events-none z-40"
        />
      </div>

      {/* ROLIG BRUKERTIPS UNDER KORTET */}
      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-amber-400/80 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        <span>Beveg musen / tilt mobilen for 3D-gullrefleksjon • Dra over feltet for å skrape</span>
      </div>
    </div>
  );
};
