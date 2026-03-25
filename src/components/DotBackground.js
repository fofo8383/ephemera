'use client';

import { useEffect, useRef } from 'react';

export default function DotBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const mouse = { x: -9999, y: -9999 };

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    const SPACING = 22;
    const DOT_BASE = 1.2;
    const DOT_MAX = 3.5;
    const INFLUENCE = 120;

    let cols, rows, dots;

    const buildGrid = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / SPACING) + 2;
      rows = Math.ceil(canvas.height / SPACING) + 2;

      dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({ x: c * SPACING, y: r * SPACING });
        }
      }
    };

    window.addEventListener('resize', buildGrid);
    buildGrid();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const dot of dots) {
        const x = dot.x;
        const y = dot.y;

        // distance from cursor
        const dx = mouse.x - x;
        const dy = mouse.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - dist / INFLUENCE);
        const eased = proximity * proximity; // quadratic falloff

        const radius = DOT_BASE + (DOT_MAX - DOT_BASE) * eased;
        const opacity = 0.12 + 0.75 * eased;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 240, 236, ${opacity})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', buildGrid);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
