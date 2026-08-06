import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SpotlightCard from './SpotlightCard';
import './FeaturesSection.css';

gsap.registerPlugin(ScrollTrigger);

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

      // Bento cards reveal
      cardsRef.current.forEach((card, i) => {
        if (card) {
          gsap.fromTo(card,
            { opacity: 0, y: 20, filter: 'blur(10px)' },
            { opacity: 1, y: 0,   filter: 'blur(0px)',
              duration: 0.8, ease: 'power2.out', delay: i * 0.1,
              scrollTrigger: { trigger: card, start: 'top 90%', once: true } }
          );
        }
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
          <h2 className="section-title">Details That <span className="accent">Matters</span></h2>
          <p className="section-sub">Every feature engineered for journalists, researchers, and professionals verifying image authenticity.</p>
        </div>

        <div className="bento-grid">
          {/* Card 1: 80+ */}
          <div ref={el => (cardsRef.current[0] = el)} className="bento-card bento-card-1">
            <SpotlightCard className="bento-card-inner" spotlightColor="rgba(201, 168, 76, 0.15)">
              <svg className="bento-svg" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none" />
                <circle cx="100" cy="100" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" fill="none" />
                <circle cx="100" cy="100" r="60" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none" />
                <circle cx="100" cy="100" r="75" stroke="rgba(255,255,255,0.09)" strokeWidth="2.5" fill="none" />
                <circle cx="100" cy="100" r="90" stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
              </svg>
              <div className="bento-content">
                <h3 className="bento-big-num">80+</h3>
                <p className="bento-sub-text">Experts Crafting<br/>Excellence</p>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 2: 14+ */}
          <div ref={el => (cardsRef.current[1] = el)} className="bento-card bento-card-2">
            <SpotlightCard className="bento-card-inner centered" spotlightColor="rgba(26, 143, 122, 0.15)">
              <div className="bento-content">
                <h3 className="bento-big-num">14+</h3>
                <p className="bento-sub-text">Years Of<br/>Experience</p>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 3: 1,000+ */}
          <div ref={el => (cardsRef.current[2] = el)} className="bento-card bento-card-3">
            <SpotlightCard className="bento-card-inner centered" spotlightColor="rgba(26, 143, 122, 0.15)">
              <div className="bento-content">
                <h3 className="bento-big-num">1,000+</h3>
                <p className="bento-sub-text">Clients Who Trust<br/>Us</p>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 4: 10+ */}
          <div ref={el => (cardsRef.current[3] = el)} className="bento-card bento-card-4">
            <SpotlightCard className="bento-card-inner" spotlightColor="rgba(201, 168, 76, 0.15)">
              <svg className="bento-svg-bottom" viewBox="0 0 200 200">
                <path d="M 10,190 A 90,90 0 0,1 190,190" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
                <path d="M 30,190 A 70,70 0 0,1 170,190" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none" />
                <path d="M 50,190 A 50,50 0 0,1 150,190" stroke="rgba(255,255,255,0.09)" strokeWidth="2" fill="none" />
              </svg>
              <div className="bento-content">
                <h3 className="bento-big-num">10+</h3>
                <p className="bento-sub-text">Fully Integrated Production Lines</p>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 5: A Unified Design */}
          <div ref={el => (cardsRef.current[4] = el)} className="bento-card bento-card-5">
            <SpotlightCard className="bento-card-inner" spotlightColor="rgba(26, 143, 122, 0.15)">
              <svg className="bento-svg" viewBox="0 0 200 100">
                <path d="M 30,50 C 30,20 70,20 100,50 C 130,80 170,80 170,50 C 170,20 130,20 100,50 C 70,80 30,80 30,50 Z" stroke="rgba(255,255,255,0.04)" strokeWidth="2" fill="none" />
              </svg>
              <div className="bento-content">
                <h4 className="bento-title-text">A Unified Design And Manufacturing Ecosystem</h4>
                <p className="bento-sub-text">Limitless Customization</p>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 6: 2,500 m2 */}
          <div ref={el => (cardsRef.current[5] = el)} className="bento-card bento-card-6">
            <SpotlightCard className="bento-card-inner centered" spotlightColor="rgba(201, 168, 76, 0.15)">
              <svg className="bento-svg" viewBox="0 0 200 200">
                <rect x="50" y="50" width="100" height="100" rx="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" fill="none" />
                <rect x="35" y="35" width="130" height="130" rx="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none" />
                <rect x="20" y="20" width="160" height="160" rx="40" stroke="rgba(255,255,255,0.01)" strokeWidth="0.5" fill="none" />
              </svg>
              <div className="bento-content">
                <h3 className="bento-big-num">2,500 m²</h3>
                <p className="bento-sub-text">Of Creativity And Technology</p>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 7: 18,000+ */}
          <div ref={el => (cardsRef.current[6] = el)} className="bento-card bento-card-7">
            <SpotlightCard className="bento-card-inner" spotlightColor="rgba(26, 143, 122, 0.15)">
              <svg className="bento-palm" viewBox="0 0 100 100">
                <path d="M50,90 Q48,60 50,35" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" fill="none" />
                <path d="M50,35 Q30,30 15,45" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
                <path d="M50,35 Q70,30 85,45" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
                <path d="M50,35 Q35,20 20,30" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
                <path d="M50,35 Q65,20 80,30" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
                <path d="M50,35 Q45,15 50,5" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
              </svg>
              <div className="bento-content">
                <h3 className="bento-big-num">18,000+</h3>
                <p className="bento-sub-text">National Projects Delivered</p>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </section>
  );
}
