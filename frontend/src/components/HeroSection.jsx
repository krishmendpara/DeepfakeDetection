import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './HeroSection.css';

export default function HeroSection({ token, navigateTo }) {
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const btnRef   = useRef(null);

  useEffect(() => {
    // Blur reveal — staggered on load (matches ERTQA fade-in)
    const blurReveal = (el, delay) =>
      gsap.fromTo(el,
        { opacity: 0, y: -20, filter: 'blur(16px)' },
        { opacity: 1, y: 0,   filter: 'blur(0px)',
          duration: 1.1, delay, ease: 'back.out(1.8)' }
      );

    blurReveal(line1Ref.current, 0.2);
    blurReveal(line2Ref.current, 0.45);
    blurReveal(btnRef.current,   0.7);
  }, []);

  return (
    <section className="hero" id="home">
      {/* Subtle warm gradient orbs in background */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-orb orb-topleft" />
        <div className="hero-orb orb-center"  />
        <div className="hero-orb orb-bottomright" />
      </div>

      {/* Text content — centered, upper 50% of viewport */}
      <div className="hero-inner">
        <p ref={line1Ref} className="hero-line-top">Is Your Image</p>
        <p ref={line2Ref} className="hero-line-bottom">
          AI <span className="hero-glow-word">Generated?</span>
        </p>
        <div ref={btnRef} className="hero-btn-row">
          <button
            className="hero-cta-btn"
            onClick={() => {
              if (token) {
                navigateTo('/app');
              } else {
                navigateTo('/login');
              }
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}
