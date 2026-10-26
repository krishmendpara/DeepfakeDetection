import { useEffect, useRef } from 'react';
import TubesCursor from '../lib/tubes1.js';
import './NeonTubesTrail.css';

export default function NeonTubesTrail() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;
    let resizeTimer = null;
    let scrollTicking = false;

    function initTubes() {
      if (!canvasRef.current || !wrapRef.current || !TubesCursor) return;

      const canvas = canvasRef.current;
      const wrap = wrapRef.current;

      // Set initial dimensions
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      try {

        // Initialize with optimized parameters
        const app = TubesCursor(canvas, {
          tubes: {
            colors: ['#c9a84c', '#1a8f7a', '#906814'],
            lights: {
              intensity: 160,
              colors: ['#e2c47a', '#2abfa5', '#c9a84c', '#0d5c4a'],
            },
          },
          bloom: {
            threshold: 0.12,
            strength: 1.05,
            radius: 0.4,
          },
        });

        // Optimize pixel ratio for GPU efficiency
        if (app?.three) {
          app.three.minPixelRatio = 1;
          app.three.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
          app.three.resize();
        }

        appRef.current = app;

        // Ensure canvas is visible and animated
        wrap.style.opacity = '1';
        wrap.style.visibility = 'visible';
      } catch (err) {
        console.error('Failed to initialize Neon Tubes Cursor:', err);
      }
    }

    initTubes();

    // Throttled scroll handler: fade & hide when past hero (100vh) to save 100% GPU during scroll
    const handleScroll = () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          const wrap = wrapRef.current;
          if (!wrap) return;

          const scrolled = window.scrollY;
          const heroHeight = window.innerHeight;

          if (scrolled >= heroHeight) {
            wrap.style.opacity = '0';
            wrap.style.visibility = 'hidden';
            wrap.style.pointerEvents = 'none';
          } else {
            wrap.style.visibility = 'visible';
            const progress = Math.min(scrolled / (heroHeight * 0.75), 1);
            wrap.style.opacity = String(Math.max(0, 1 - progress));
          }
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    };

    // Resize handler
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (canvasRef.current && appRef.current?.three) {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
          appRef.current.three.resize();
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      isCancelled = true;
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);

      if (appRef.current) {
        try {
          appRef.current.dispose();
        } catch {
          // ignore cleanup errors
        }
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={wrapRef} id="tubes-wrap" className="neon-tubes-wrapper" aria-hidden="true">
      <canvas ref={canvasRef} id="tubes-canvas" className="neon-tubes-canvas" />
    </div>
  );
}
