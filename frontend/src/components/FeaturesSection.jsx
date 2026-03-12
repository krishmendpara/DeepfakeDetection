import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  RiSpeedLine, RiDatabase2Line, RiShieldFlashLine,
  RiGlobalLine, RiFileChartLine, RiLockPasswordLine
} from 'react-icons/ri';
import './FeaturesSection.css';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: RiSpeedLine,        title: 'Instant Analysis',       desc: 'Results in under 2 seconds — no queue, no waiting.' },
  { icon: RiDatabase2Line,    title: 'Multi-Generator Support', desc: 'Trained to detect DALL·E, Midjourney, Stable Diffusion, Firefly & more.' },
  { icon: RiShieldFlashLine,  title: 'Adversarial Resilience', desc: 'Robust against JPEG compression, resizing, and watermark removal attacks.' },
  { icon: RiGlobalLine,       title: 'Any Image Format',       desc: 'Supports JPG, PNG, WebP, HEIC, AVIF from any source or platform.' },
  { icon: RiFileChartLine,    title: 'Heatmap Reports',        desc: 'Visual heatmaps highlight the exact regions flagged as AI-generated.' },
  { icon: RiLockPasswordLine, title: 'Privacy-First',          desc: 'Ephemeral uploads — your images are never stored on our servers.' },
];

export default function FeaturesSection() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);
  const cardsRef   = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Head blur reveal
      gsap.fromTo(headRef.current,
        { opacity: 0, y: -20, filter: 'blur(14px)' },
        { opacity: 1, y: 0,   filter: 'blur(0px)',
          duration: 0.95, ease: 'back.out(2)',
          scrollTrigger: { trigger: headRef.current, start: 'top 82%', once: true } }
      );

      // Cards blur reveal — alternating direction
      cardsRef.current.forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: -18, filter: 'blur(12px)' },
          { opacity: 1, y: 0,   filter: 'blur(0px)',
            duration: 0.85, ease: 'back.out(2)', delay: i * 0.08,
            scrollTrigger: { trigger: card, start: 'top 88%', once: true } }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="features-section" id="why-us">
      <div className="features-bg">
        <div className="feat-orb feat-orb-gold" />
        <div className="feat-orb feat-orb-teal" />
      </div>
      <div className="section-inner">
        <div ref={headRef} className="section-head">
          <span className="section-tag">Why PixelTruth</span>
          <h2 className="section-title">Precision You Can <span className="accent">Depend On</span></h2>
          <p className="section-sub">Every feature engineered for journalists, researchers, content moderators, and security professionals verifying image authenticity.</p>
        </div>
        <div className="features-float-grid">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} ref={el => (cardsRef.current[i] = el)} className="float-card">
                <div className="float-icon-ring"><Icon className="float-icon" /></div>
                <div className="float-body">
                  <h3 className="float-title">{f.title}</h3>
                  <p className="float-desc">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
