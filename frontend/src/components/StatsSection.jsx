import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './StatsSection.css';

gsap.registerPlugin(ScrollTrigger);

export default function StatsSection() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);
  const cellsRef   = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headRef.current,
        { opacity: 0, y: -22, filter: 'blur(14px)' },
        { opacity: 1, y: 0,   filter: 'blur(0px)',
          duration: 1.0, ease: 'back.out(2)',
          scrollTrigger: { trigger: headRef.current, start: 'top 82%', once: true } }
      );
      cellsRef.current.forEach((cell, i) => {
        gsap.fromTo(cell,
          { opacity: 0, y: -18, filter: 'blur(12px)' },
          { opacity: 1, y: 0,   filter: 'blur(0px)',
            duration: 0.85, ease: 'back.out(2)', delay: i * 0.07,
            scrollTrigger: { trigger: cell, start: 'top 88%', once: true } }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="stats-section" id="stats">
      <div className="stats-inner">
        <h2 ref={headRef} className="stats-heading">Details That <span className="accent">Matter</span></h2>
        <div className="bento-grid">
          <div ref={el => (cellsRef.current[0] = el)} className="bento-cell cell-large cell-gold">
            <div className="bento-ring-wrap">
              <div className="bento-ring ring1" /><div className="bento-ring ring2" /><div className="bento-ring ring3" />
              <div className="ring-center"><span className="ring-value">5M+</span><span className="ring-label">AI Images in Training Set</span></div>
            </div>
          </div>
          <div className="bento-stack">
            <div ref={el => (cellsRef.current[1] = el)} className="bento-cell cell-sm cell-teal">
              <span className="bento-value">20+</span><span className="bento-stat-label">AI Generators<br/>Supported</span>
            </div>
            <div ref={el => (cellsRef.current[2] = el)} className="bento-cell cell-sm cell-bright">
              <span className="bento-value">500K+</span><span className="bento-stat-label"><strong>Images</strong> Analyzed</span>
            </div>
          </div>
          <div className="bento-stack">
            <div ref={el => (cellsRef.current[3] = el)} className="bento-cell cell-sm">
              <span className="bento-value">8</span><span className="bento-stat-label">Detection Models<br/>In Ensemble</span>
            </div>
            <div ref={el => (cellsRef.current[4] = el)} className="bento-cell cell-sm cell-ring-right">
              <div className="half-ring" />
              <div className="bento-cell-content"><span className="bento-value gold">99.2%</span><span className="bento-stat-label">Accuracy Rate</span></div>
            </div>
          </div>
          <div ref={el => (cellsRef.current[5] = el)} className="bento-cell cell-bottom-left">
            <span className="bento-body-text">AI Image Detection Engine</span>
            <span className="bento-body-sub">Pixel-level analysis at scale</span>
          </div>
          <div ref={el => (cellsRef.current[6] = el)} className="bento-cell cell-bottom-mid">
            <div className="center-circle">
              <span className="circle-value">5M<sup>+</sup></span>
              <span className="circle-label">AI Images Used For Training</span>
            </div>
          </div>
          <div ref={el => (cellsRef.current[7] = el)} className="bento-cell cell-bottom-right">
            <span className="bento-value gold">50K+</span><span className="bento-stat-label">Daily Scans<br/>Completed</span>
          </div>
        </div>
      </div>
    </section>
  );
}
