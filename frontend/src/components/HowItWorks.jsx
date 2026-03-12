import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RiUploadCloud2Line, RiCpuLine, RiRadarLine, RiCheckboxCircleLine } from 'react-icons/ri';
import './HowItWorks.css';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { icon: RiUploadCloud2Line,   step: '01', title: 'Upload Image',     desc: 'Drop any JPG, PNG, WebP, or HEIC image up to 10MB for instant analysis.' },
  { icon: RiCpuLine,            step: '02', title: 'AI Processing',    desc: 'Our pipeline extracts frequency patterns, texture maps, and generative fingerprints.' },
  { icon: RiRadarLine,          step: '03', title: 'Generator Check',  desc: 'Cross-model ensemble checks against signatures of 20+ known AI image generators.' },
  { icon: RiCheckboxCircleLine, step: '04', title: 'Verdict & Heatmap', desc: 'Confidence-scored verdict with a region heatmap showing suspected AI-generated areas.' },
];

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);
  const stepsRef   = useRef([]);
  const imgRef     = useRef(null);
  const lineRef    = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Head children — blur reveal
      Array.from(headRef.current.children).forEach((child, i) => {
        gsap.fromTo(child,
          { opacity: 0, y: -20, filter: 'blur(14px)' },
          { opacity: 1, y: 0,   filter: 'blur(0px)',
            duration: 0.95, ease: 'back.out(2)', delay: i * 0.12,
            scrollTrigger: { trigger: headRef.current, start: 'top 82%', once: true } }
        );
      });

      // Heatmap image — fade in from right (no blur needed, image is visual)
      gsap.fromTo(imgRef.current,
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power2.out',
          scrollTrigger: { trigger: imgRef.current, start: 'top 82%', once: true } }
      );

      // Timeline line draw
      gsap.fromTo(lineRef.current,
        { scaleY: 0, transformOrigin: 'top' },
        { scaleY: 1, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: lineRef.current, start: 'top 85%', once: true } }
      );

      // Steps — blur reveal staggered
      stepsRef.current.forEach((step, i) => {
        gsap.fromTo(step,
          { opacity: 0, y: -18, filter: 'blur(12px)' },
          { opacity: 1, y: 0,   filter: 'blur(0px)',
            duration: 0.85, ease: 'back.out(2)', delay: i * 0.1,
            scrollTrigger: { trigger: step, start: 'top 88%', once: true } }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="how-section" id="how-it-works">
      <div className="section-inner">
        <div ref={headRef} className="section-head">
          <span className="section-tag">How It Works</span>
          <h2 className="section-title">Four Steps to <span className="accent">Certainty</span></h2>
          <p className="section-sub">From upload to verdict in seconds. No setup, no expertise required — just upload and know.</p>
        </div>

        <div className="how-layout">
          <div className="steps-list-wrap">
            <div className="steps-list">
              <div ref={lineRef} className="steps-line" />
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.step} ref={el => (stepsRef.current[i] = el)} className="step-row">
                    <div className="step-dot">
                      <Icon className="step-dot-icon" />
                      <span className="step-num">{s.step}</span>
                    </div>
                    <div className="step-card">
                      <h3 className="step-title">{s.title}</h3>
                      <p className="step-desc">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div ref={imgRef} className="how-img-col">
            <div className="how-img-wrap">
              <img src="/detection-heatmap.png" alt="AI image detection heatmap" className="how-img" />
              <div className="how-img-glow" />
              <div className="how-img-badge">
                <RiRadarLine className="badge-icon" />
                <span>Live Detection Result</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
