'use client';

import { useEffect, useRef } from 'react';

export default function DotBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const mouse = { x: -9999, y: -9999 };

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    const SPACING = 36;
    const DOT_BASE = 1.2;
    const DOT_MAX = 3.5;
    const INFLUENCE = 140;
    const FLOAT_AMP = 6;
    const FLOAT_SPEED = 0.00045;

    let cols, rows, dots;

    const buildGrid = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / SPACING) + 2;
      rows = Math.ceil(canvas.height / SPACING) + 2;

      dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // phase offset so each dot floats independently
          const phase = (r * 397 + c * 193) % (Math.PI * 2);
          dots.push({ bx: c * SPACING, by: r * SPACING, phase });
        }
      }
    };

    window.addEventListener('resize', buildGrid);
    buildGrid();

    const draw = () => {
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const dot of dots) {
        // slow float
        const floatY = Math.sin(time * FLOAT_SPEED * 1000 + dot.phase) * FLOAT_AMP;
        const floatX = Math.cos(time * FLOAT_SPEED * 700 + dot.phase) * FLOAT_AMP * 0.5;

        const x = dot.bx + floatX;
        const y = dot.by + floatY;

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
