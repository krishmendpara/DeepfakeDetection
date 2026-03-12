import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import StatsSection from './components/StatsSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorks from './components/HowItWorks';
import UploadSection from './components/UploadSection';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  return (
    <>
      {/* All page content sits above the 3D (z-index via App.css) */}
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorks />
        <UploadSection />
      </main>
      <Footer />
    </>
  );
}
