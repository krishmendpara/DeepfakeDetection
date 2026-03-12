import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RiEyeLine, RiBrainLine, RiBarChartBoxLine, RiShieldCheckLine } from 'react-icons/ri';
import './AboutSection.css';

gsap.registerPlugin(ScrollTrigger);

// Shared blur reveal helper
const blurReveal = (el, scrollTriggerConfig, delay = 0) =>
  gsap.fromTo(el,
    { opacity: 0, y: -20, filter: 'blur(14px)' },
    { opacity: 1, y: 0,   filter: 'blur(0px)',
      duration: 0.95, delay, ease: 'back.out(2)',
      scrollTrigger: scrollTriggerConfig }
  );

const pillars = [
  { icon: RiEyeLine,        title: 'Pixel-Level Analysis',  desc: 'Detects telltale artifacts — unnatural textures, impossible lighting, and frequency anomalies invisible to the human eye.' },
  { icon: RiBrainLine,      title: 'Generator Fingerprinting', desc: 'Identifies signatures left by GANs, Stable Diffusion, DALL·E, Midjourney, and other leading image generators.' },
  { icon: RiBarChartBoxLine, title: 'Confidence Scoring',   desc: 'Every scan returns a calibrated probability score with a highlighted region map showing suspicious areas.' },
  { icon: RiShieldCheckLine, title: 'Metadata Verification', desc: 'Cross-checks EXIF data and steganographic markers against known AI-generated image patterns.' },
];

export default function AboutSection() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);
  const cardsRef   = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stagger blur reveal for each head child
      Array.from(headRef.current.children).forEach((child, i) => {
        blurReveal(child,
          { trigger: headRef.current, start: 'top 82%', once: true },
          i * 0.13
        );
      });

      cardsRef.current.forEach((card, i) => {
        blurReveal(card,
          { trigger: card, start: 'top 88%', once: true },
          i * 0.09
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="about-section" id="about">
      <div className="section-inner">
        <div ref={headRef} className="section-head">
          <span className="section-tag">About PixelTruth AI</span>
          <h2 className="section-title">AI Image Detection<br/><span className="accent">Built for Trust</span></h2>
          <p className="section-sub">In an era where AI-generated images are indistinguishable from real photos, PixelTruth AI provides cutting-edge tools to unmask synthetic visuals instantly.</p>
        </div>
        <div className="pillars-grid">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={p.title} ref={el => (cardsRef.current[i] = el)} className="pillar-card">
                <div className="pillar-icon-wrap"><Icon className="pillar-icon" /></div>
                <h3 className="pillar-title">{p.title}</h3>
                <p className="pillar-desc">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
