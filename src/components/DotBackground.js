'use client';

import { useEffect, useRef } from 'react';

export default function DotBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const isMobile = window.matchMedia('(pointer: coarse)').matches;

    const mouse = { x: -9999, y: -9999 };
    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    if (!isMobile) window.addEventListener('mousemove', onMouseMove);

    // ── Constants ──────────────────────────────────────────────
    const SPACING   = 28;     // grid cell size — same density as before
    const RADIUS    = 1.3;    // dot draw radius
    const OPACITY   = 0.28;   // base opacity
    const REPEL_R   = 110;    // cursor influence radius
    const REPEL_F   = 0.18;   // repel force strength
    const DRIFT_S   = 0.012;  // max drift speed
    const RETURN_F  = 0.022;  // spring return force
    const DAMPING   = 0.82;   // velocity damping

    let dots = [];

    const buildDots = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      dots = [];

      const cols = Math.ceil(canvas.width  / SPACING) + 2;
      const rows = Math.ceil(canvas.height / SPACING) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Slightly randomise rest position within cell for organic feel
          const ox = (Math.random() - 0.5) * SPACING * 0.6;
          const oy = (Math.random() - 0.5) * SPACING * 0.6;
          const rx = c * SPACING + ox;
          const ry = r * SPACING + oy;
          dots.push({
            rx, ry,       // rest position
            x: rx, y: ry, // current position
            vx: (Math.random() - 0.5) * DRIFT_S,
            vy: (Math.random() - 0.5) * DRIFT_S,
            // stagger drift phase so dots don't all move in sync
            phase: Math.random() * Math.PI * 2,
            speed: DRIFT_S * (0.4 + Math.random() * 0.6),
          });
        }
      }
    };

    const onResize = () => buildDots();
    window.addEventListener('resize', onResize);
    buildDots();

    const draw = (t) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const d of dots) {
        // ── Ambient drift ─────────────────────────────────────
        // Slow sinusoidal wander around rest position
        const driftX = Math.sin(t * 0.0003 + d.phase)        * SPACING * 0.35;
        const driftY = Math.cos(t * 0.00023 + d.phase * 1.3) * SPACING * 0.35;
        const tx = d.rx + driftX; // drift target
        const ty = d.ry + driftY;

        // ── Cursor repulsion (desktop only) ───────────────────
        let fx = 0, fy = 0;
        if (!isMobile) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPEL_R && dist > 0) {
            const strength = (1 - dist / REPEL_R) * REPEL_F;
            fx = (dx / dist) * strength;
            fy = (dy / dist) * strength;
          }
        }

        // ── Spring toward drift target + repulsion ─────────────
        d.vx = (d.vx + (tx - d.x) * RETURN_F + fx) * DAMPING;
        d.vy = (d.vy + (ty - d.y) * RETURN_F + fy) * DAMPING;
        d.x += d.vx;
        d.y += d.vy;

        // ── Draw ───────────────────────────────────────────────
        ctx.beginPath();
        ctx.arc(d.x, d.y, RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 236, 220, ${OPACITY})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (!isMobile) window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
