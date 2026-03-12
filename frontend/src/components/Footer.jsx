import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RiShieldCheckLine, RiGithubLine, RiTwitterXLine, RiLinkedinBoxLine, RiArrowUpLine } from 'react-icons/ri';
import './Footer.css';

gsap.registerPlugin(ScrollTrigger);

const footerLinks = {
    Product: ['Documentation', 'API Access', 'Pricing', 'Changelog'],
    Company: ['About Us', 'Blog', 'Careers', 'Press Kit'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
};

export default function Footer() {
    const footerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.footer-col',
                { opacity: 0, y: 30 },
                {
                    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1,
                    scrollTrigger: { trigger: footerRef.current, start: 'top 90%', once: true },
                }
            );
        }, footerRef);
        return () => ctx.revert();
    }, []);

    const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <footer ref={footerRef} className="footer">
            <div className="footer-inner">
                <div className="footer-col footer-brand">
                    <div className="footer-logo">
                        <RiShieldCheckLine className="footer-logo-icon" />
                        <span className="logo-text">PixelTruth<span className="logo-accent">AI</span></span>
                    </div>
                    <p className="footer-tagline">
                        Empowering creators, journalists, and researchers to instantly verify whether any image is real or AI-generated.
                    </p>
                    <div className="footer-socials">
                        <a href="#" className="social-icon" aria-label="GitHub"><RiGithubLine /></a>
                        <a href="#" className="social-icon" aria-label="X / Twitter"><RiTwitterXLine /></a>
                        <a href="#" className="social-icon" aria-label="LinkedIn"><RiLinkedinBoxLine /></a>
                    </div>
                </div>

                {Object.entries(footerLinks).map(([group, links]) => (
                    <div key={group} className="footer-col">
                        <h4 className="footer-col-title">{group}</h4>
                        <ul className="footer-link-list">
                            {links.map(link => (
                                <li key={link}><a className="footer-link" href="#">{link}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="footer-bottom">
                <p className="footer-copy">2025 PixelTruth AI. All rights reserved.</p>
                <button className="scroll-top-btn" onClick={scrollTop} aria-label="Back to top">
                    <RiArrowUpLine />
                </button>
            </div>
        </footer>
    );
}
