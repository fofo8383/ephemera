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

    const DOT_COUNT  = 150;
    const RADIUS     = 1.5;
    const MAX_SPEED  = 0.3;
    const REPEL_DIST = 100;
    const NEAR_DIST  = 20;

    const mouse = { x: -9999, y: -9999 };
    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouseMove);

    let W = window.innerWidth;
    let H = window.innerHeight;
    let dots = [];

    const initDots = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
      dots = Array.from({ length: DOT_COUNT }, () => ({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * MAX_SPEED * 2,
        vy: (Math.random() - 0.5) * MAX_SPEED * 2,
      }));
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

      // ── Mark dots that are near each other ────────────────
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          if (dx * dx + dy * dy < NEAR_DIST * NEAR_DIST) {
            a.near = true;
            b.near = true;
          }
        }
      }

      // ── Draw dots ─────────────────────────────────────────
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, RADIUS, 0, Math.PI * 2);
        if (d.near) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(255,248,235,0.8)';
          ctx.fillStyle = 'rgba(255,248,235,0.9)';
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,248,235,0.35)';
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
