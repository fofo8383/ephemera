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

    const resize = () => {
      if (typeof window === 'undefined') return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      time += 0.006; 
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const spacing = 60; // Wider spacing for more reach
      // Increased grid size to fill screen
      const rows = 100; 
      const cols = 120;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.5; // lower horizon to show more ground
      const tilt = Math.PI / 4; // 45 degrees

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          // Deterministic hash for star properties
          const hash = (Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1;
          const seed = Math.abs(hash);
          
          const x3d = (j - cols / 2) * spacing + (seed * 40 - 20);
          const y3d = (i - rows / 2) * spacing + (seed * 40 - 20);
          
          // Milky Way density: diagonal plane + central bulge
          const distFromPlane = Math.abs(y3d - x3d * 0.4) / 300;
          const planeFactor = Math.exp(-distFromPlane * distFromPlane);
          const distFromCenter = Math.sqrt(x3d * x3d + y3d * y3d);
          const bulgeFactor = Math.exp(-(distFromCenter * distFromCenter) / (600 * 600)) * 1.5;
          
          const density = 0.1 + 0.9 * Math.max(planeFactor, bulgeFactor * 0.5);
          if (seed > density) continue;

          // Static 3D plane for the stars
          const z3d = 0;

          // Rotate around X axis (tilt)
          const currY = y3d * Math.cos(tilt) - z3d * Math.sin(tilt);
          const currZ = y3d * Math.sin(tilt) + z3d * Math.cos(tilt);

          // Perspective projection
          const p = 800; // focal length
          const scale = p / (p + currZ + 400); 
          
          const screenX = centerX + x3d * scale;
          const screenY = centerY + currY * scale;

          if (scale > 0) {
            // Colors: Warm core (gold/white), Blue edges
            const coreInfluence = bulgeFactor * scale;
            const r = Math.floor((20 + (225 - 20) * scale) * (1 - coreInfluence) + 255 * coreInfluence);
            const g = Math.floor((130 + (225 - 130) * scale) * (1 - coreInfluence) + 240 * coreInfluence);
            const b = Math.floor((255 + (220 - 255) * scale) * (1 - coreInfluence) + 200 * coreInfluence);
            
            // Rapid twinkling / reigniting pulse
            const dotOffset = i * 7.3 + j * 13.7; 
            const flickerSpeed = 0.4 + (seed * 0.4);
            const twinkle = Math.pow(Math.max(0, Math.sin(time * flickerSpeed + dotOffset)), 12);
            
            const baseOpacity = Math.min(0.8, 0.15 + scale * 0.6) * (0.3 + 0.7 * density);
            const opacity = baseOpacity * twinkle;
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;

            const size = (0.3 + seed * 0.7 + 1) * scale * 2.8;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, Math.max(0.1, size), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg-canvas"
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
