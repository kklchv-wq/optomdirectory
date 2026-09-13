'use client';

import { useEffect, useRef, useState } from 'react';

interface OptomLogoProps {
  className?: string;
  fillColor?: string;
}

export default function OptomLogo({ className = 'w-10 h-auto text-slate-900', fillColor }: OptomLogoProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Scale coordinates from screen pixels to SVG viewBox (180.38 x 95.16)
      const scaleX = rect.width / 180.38;
      const scaleY = rect.height / 95.16;

      // Left eye center in screen viewport coordinates
      const eyeX = rect.left + 42.97 * scaleX;
      const eyeY = rect.top + 41.83 * scaleY;

      const dx = e.clientX - eyeX;
      const dy = e.clientY - eyeY;
      const dist = Math.hypot(dx, dy);

      // Max movement of iris in SVG viewBox units (keeps pupil inside socket)
      const maxOffset = 6.5;
      const maxScreenDist = 500;

      const factor = Math.min(dist / maxScreenDist, 1);
      const angle = Math.atan2(dy, dx);

      const moveX = Math.cos(angle) * maxOffset * factor;
      const moveY = Math.sin(angle) * maxOffset * factor;

      setOffset({ x: moveX, y: moveY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const fillStyle = fillColor || 'currentColor';

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 180.38 95.16"
      className={`inline-block select-none overflow-visible ${className}`}
      aria-label="Optom Directory Logo"
      role="img"
    >
      <g id="Layer_1">
        {/* Left Eye Outer Socket / Ring */}
        <path
          fill={fillStyle}
          d="M42.97,83.92C21.17,83.92,0,67.79,0,41.83S21.17,0,42.97,0s42.97,16.13,42.97,41.83-21.17,42.09-42.97,42.09ZM42.97,14.11c-13.48,0-26.84,10.58-26.84,27.97s13.36,28.1,26.84,28.1,26.84-10.58,26.84-28.1-13.61-27.97-26.84-27.97Z"
        />

        {/* Right Eye / Diagnostic Tool Frame */}
        <path
          fill={fillStyle}
          d="M94.46,30.13v12.2c.1,15.25,7.53,27.08,18.07,34.19l-5.57,9.64,8.74,5.05,5.8-10.05c3.48,1.32,7.14,2.2,10.86,2.63v11.35h10.1v-11.35c3.72-.43,7.38-1.31,10.86-2.63l5.8,10.05,8.74-5.05-5.57-9.64c10.54-7.12,17.97-18.94,18.07-34.19v-12.2h-85.92ZM137.42,70.37c-13.47,0-26.81-10.56-26.84-28.04h53.68c-.03,17.48-13.62,28.04-26.84,28.04Z"
        />

        {/* Animated Iris in Left Eye following the mouse */}
        <g
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transition: 'transform 80ms cubic-bezier(0.1, 0.5, 0.1, 1)',
            transformOrigin: '42.97px 41.83px',
          }}
        >
          <path
            fill={fillStyle}
            d="M51.17,41.96c-9.32,0-16.88,7.56-16.88,16.88s7.56,16.88,16.88,16.88,16.88-7.56,16.88-16.88-7.56-16.88-16.88-16.88ZM58.63,56.36c-1.87,0-3.39-1.52-3.39-3.39s1.52-3.39,3.39-3.39,3.39,1.52,3.39,3.39-1.52,3.39-3.39,3.39Z"
          />
        </g>
      </g>
    </svg>
  );
}
