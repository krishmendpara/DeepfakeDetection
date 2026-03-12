import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { RiShieldCheckLine } from 'react-icons/ri';
import { HiOutlineMenuAlt3, HiOutlineX } from 'react-icons/hi';
import './Navbar.css';

const links = ['Home', 'About', 'Why Us', 'How It Works', 'Upload'];

export default function Navbar() {
    const navRef = useRef(null);
    const logoRef = useRef(null);
    const linksRef = useRef([]);
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(logoRef.current,
                { opacity: 0, x: -30 },
                { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', delay: 0.2 }
            );
            gsap.fromTo(linksRef.current,
                { opacity: 0, y: -18 },
                { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.35 }
            );
        }, navRef);

        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => { ctx.revert(); window.removeEventListener('scroll', onScroll); };
    }, []);

    const scrollTo = (id) => {
        setMenuOpen(false);
        const el = document.getElementById(id.toLowerCase().replace(/\s+/g, '-'));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav ref={navRef} className={`navbar${scrolled ? ' scrolled' : ''}`}>
            <div ref={logoRef} className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <RiShieldCheckLine className="logo-icon" />
                <span className="logo-text">PixelTruth<span className="logo-accent">AI</span></span>
            </div>

            <ul className="nav-links desktop">
                {links.map((link, i) => (
                    <li key={link} ref={el => (linksRef.current[i] = el)}>
                        <button className="nav-link-btn" onClick={() => scrollTo(link)}>{link}</button>
                    </li>
                ))}
            </ul>

            <div className="nav-right">
                <button className="nav-cta" onClick={() => scrollTo('Upload')}>Try Now</button>
                <button className="menu-toggle" onClick={() => setMenuOpen(p => !p)}>
                    {menuOpen ? <HiOutlineX /> : <HiOutlineMenuAlt3 />}
                </button>
            </div>

            <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
                {links.map(link => (
                    <button key={link} className="mobile-link" onClick={() => scrollTo(link)}>{link}</button>
                ))}
                <button className="nav-cta mobile-cta" onClick={() => scrollTo('Upload')}>Try Now</button>
            </div>
        </nav>
    );
}
