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

    const DOT_COUNT    = 150;
    const RADIUS       = 1.5;
    const MAX_SPEED    = 0.3;
    const REPEL_DIST   = 100;
    const CONNECT_DIST = 20;
    const SPARK_LIFE   = 300; // ms

    const mouse = { x: -9999, y: -9999 };
    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouseMove);

    let W = window.innerWidth;
    let H = window.innerHeight;
    let dots = [];
    let sparks = []; // { x, y, born }

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
      const now = Date.now();

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

        d.near = false; // reset per frame
      }

      // ── Check proximity between dot pairs ─────────────────
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i];
          const b = dots[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DIST) {
            a.near = true;
            b.near = true;

            // Draw the short connecting line
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'rgba(255,248,235,0.4)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Spawn a spark at the midpoint if none exists nearby
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const alreadyHasSpark = sparks.some((s) => {
              const sdx = s.x - mx;
              const sdy = s.y - my;
              return Math.sqrt(sdx * sdx + sdy * sdy) < 4 && now - s.born < SPARK_LIFE;
            });
            if (!alreadyHasSpark) {
              sparks.push({ x: mx, y: my, born: now });
            }
          }
        }
      }

      // ── Draw dots (boosted opacity when near) ─────────────
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = d.near
          ? 'rgba(255,248,235,0.9)'
          : 'rgba(255,248,235,0.35)';
        ctx.fill();
      }

      // ── Draw & age sparks ─────────────────────────────────
      sparks = sparks.filter((s) => now - s.born < SPARK_LIFE);
      for (const s of sparks) {
        const progress = (now - s.born) / SPARK_LIFE; // 0 → 1
        const alpha = 0.9 * (1 - progress);
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,248,235,${alpha.toFixed(3)})`;
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
