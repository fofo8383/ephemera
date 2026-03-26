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

    const DOT_COUNT      = 165;  // target population
    const DOT_MAX        = 308;  // hard cap (splits are capped here)
    const RADIUS         = 1.5;
    const MAX_SPEED      = 0.33;
    const REPEL_DIST     = 100;
    const NEAR_DIST      = 10;
    const TTL            = 10000; // ms — dot lifespan
    const FADE_OUT       = 2000;  // ms — fade window at end of life
    const SPLIT_COOLDOWN = 4000;  // ms — min gap between a dot splitting again

    const mouse = { x: -9999, y: -9999 };
    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouseMove);

    let W = window.innerWidth;
    let H = window.innerHeight;
    let dots = [];

    const makeDot = (x, y, vx, vy) => ({
      x:   x  ?? Math.random() * W,
      y:   y  ?? Math.random() * H,
      vx:  vx ?? (Math.random() - 0.5) * MAX_SPEED * 2,
      vy:  vy ?? (Math.random() - 0.5) * MAX_SPEED * 2,
      born: Date.now(),
      lastSplit: 0,
      near: false,
    });

    const initDots = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
      dots = Array.from({ length: DOT_COUNT }, () => makeDot());
    };

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
    };
    window.addEventListener('resize', onResize);
    initDots();

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const now = Date.now();

      // ── Expire dead dots ──────────────────────────────────
      dots = dots.filter((d) => now - d.born < TTL);

      // ── Replenish to target count ─────────────────────────
      while (dots.length < DOT_COUNT) dots.push(makeDot());

      // ── Update & move dots ────────────────────────────────
      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_DIST && dist > 0) {
          const force = (REPEL_DIST - dist) / REPEL_DIST;
          d.vx += (dx / dist) * force * 0.6;
          d.vy += (dy / dist) * force * 0.6;
        }

        const spd = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
        if (spd > MAX_SPEED) {
          d.vx = (d.vx / spd) * MAX_SPEED;
          d.vy = (d.vy / spd) * MAX_SPEED;
        }

        d.x += d.vx;
        d.y += d.vy;

        if (d.x < 0)  d.x += W;
        if (d.x > W)  d.x -= W;
        if (d.y < 0)  d.y += H;
        if (d.y > H)  d.y -= H;

        d.near = false;
      }

      // ── Proximity check + split ───────────────────────────
      const spawned = [];
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < NEAR_DIST && dist > 0) {
            a.near = true;
            b.near = true;

            // Split: spawn a child perpendicular to the collision axis
            if (
              dots.length + spawned.length < DOT_MAX &&
              now - a.lastSplit > SPLIT_COOLDOWN &&
              now - b.lastSplit > SPLIT_COOLDOWN
            ) {
              // Perpendicular to a→b, random sign
              const perp = Math.random() < 0.5 ? 1 : -1;
              const nx = (-dy / dist) * perp;
              const ny = (dx  / dist) * perp;
              const speed = MAX_SPEED * (0.4 + Math.random() * 0.6);
              spawned.push(makeDot(
                (a.x + b.x) / 2,
                (a.y + b.y) / 2,
                nx * speed,
                ny * speed,
              ));
              a.lastSplit = now;
              b.lastSplit = now;
            }
          }
        }
      }
      dots.push(...spawned);

      // ── Draw dots ─────────────────────────────────────────
      for (const d of dots) {
        const age = now - d.born;
        // Fade in over 500ms, fade out over last FADE_OUT ms
        const fadeIn  = Math.min(1, age / 500);
        const fadeOut = age > TTL - FADE_OUT ? (TTL - age) / FADE_OUT : 1;
        const lifeAlpha = fadeIn * fadeOut;

        ctx.beginPath();
        ctx.arc(d.x, d.y, RADIUS, 0, Math.PI * 2);

        if (d.near) {
          ctx.shadowBlur   = 8;
          ctx.shadowColor  = `rgba(255,248,235,${(0.8 * lifeAlpha).toFixed(3)})`;
          ctx.fillStyle    = `rgba(255,248,235,${(0.9 * lifeAlpha).toFixed(3)})`;
        } else {
          ctx.shadowBlur   = 0;
          ctx.fillStyle    = `rgba(255,248,235,${(0.35 * lifeAlpha).toFixed(3)})`;
        }
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
