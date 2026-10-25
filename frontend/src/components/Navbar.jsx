import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { RiShieldCheckLine, RiUserLine } from 'react-icons/ri';
import { HiOutlineMenuAlt3, HiOutlineX } from 'react-icons/hi';
import './Navbar.css';

export default function Navbar({ token, user, navigateTo, currentPath, handleLogout }) {
    const navRef = useRef(null);
    const logoRef = useRef(null);
    const linksRef = useRef([]);
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const links = token ? ['Home', 'Detect', 'Features'] : ['Home', 'Features'];

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
    }, [token]); // Re-run when token changes to animate the updated list

    const scrollTo = (id) => {
        setMenuOpen(false);
        if (id === 'Home') {
            if (currentPath !== '/') {
                navigateTo('/');
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
        }

        if (id === 'Detect') {
            navigateTo('/app');
            return;
        }

        if (id === 'Features') {
            navigateTo('/why-us');
            return;
        }
    };

    return (
        <nav ref={navRef} className={`navbar${scrolled ? ' scrolled' : ''}`}>
            <div ref={logoRef} className="nav-logo" onClick={() => scrollTo('Home')}>
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
                {token ? (
                    <>
                        <button 
                            className={`nav-link-btn profile-nav-btn ${currentPath === '/profile' ? 'active' : ''}`}
                            onClick={() => { setMenuOpen(false); navigateTo('/profile'); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <RiUserLine /> {user?.name?.split(' ')[0] || 'Profile'}
                        </button>
                        <button className="nav-cta" onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <button className="nav-link-btn" onClick={() => navigateTo('/login')}>Login</button>
                        <button className="nav-cta" onClick={() => navigateTo('/signup')}>Try Now</button>
                    </>
                )}
                <button className="menu-toggle" onClick={() => setMenuOpen(p => !p)}>
                    {menuOpen ? <HiOutlineX /> : <HiOutlineMenuAlt3 />}
                </button>
            </div>

            <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
                {links.map(link => (
                    <button key={link} className="mobile-link" onClick={() => scrollTo(link)}>{link}</button>
                ))}
                <div className="mobile-auth-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                    {token ? (
                        <>
                            <button 
                                className="mobile-link"
                                onClick={() => { setMenuOpen(false); navigateTo('/profile'); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
                            >
                                <RiUserLine /> {user?.name || 'Profile'}
                            </button>
                            <button className="nav-cta mobile-cta" onClick={() => { setMenuOpen(false); handleLogout(); }}>Logout</button>
                        </>
                    ) : (
                        <>
                            <button className="mobile-link" onClick={() => { setMenuOpen(false); navigateTo('/login'); }}>Login</button>
                            <button className="nav-cta mobile-cta" onClick={() => { setMenuOpen(false); navigateTo('/signup'); }}>Try Now</button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
