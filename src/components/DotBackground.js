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
    const COLOR      = 'rgba(255, 248, 235, 0.35)';
    const MAX_SPEED  = 0.3;
    const REPEL_DIST = 100;

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
      ctx.fillStyle = COLOR;

      for (const d of dots) {
        // Repel from cursor
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_DIST && dist > 0) {
          const force = (REPEL_DIST - dist) / REPEL_DIST;
          d.vx += (dx / dist) * force * 0.6;
          d.vy += (dy / dist) * force * 0.6;
        }

        // Clamp speed
        const spd = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
        if (spd > MAX_SPEED) {
          d.vx = (d.vx / spd) * MAX_SPEED;
          d.vy = (d.vy / spd) * MAX_SPEED;
        }

        d.x += d.vx;
        d.y += d.vy;

        // Wrap edges
        if (d.x < 0)  d.x += W;
        if (d.x > W)  d.x -= W;
        if (d.y < 0)  d.y += H;
        if (d.y > H)  d.y -= H;

        ctx.beginPath();
        ctx.arc(d.x, d.y, RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

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
