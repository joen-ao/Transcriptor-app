import React from 'react';
import AppNavigation from '../components/shared/AppNavigation';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import CTASection from '../components/home/CTASection';
import Footer from '../components/home/Footer';
import '../styles/Home.css';

interface HomeProps {
  onNavigateToUploader: () => void;
  onNavigateToHistory: () => void;
  onNavigateToHome: () => void;
  isElectronReady: boolean;
}

const Home: React.FC<HomeProps> = ({ 
  onNavigateToUploader, 
  onNavigateToHistory, 
  onNavigateToHome,
  isElectronReady 
}) => {
  const handleSmoothScroll = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="home-container">
      <AppNavigation 
        currentPage="home"
        onNavigateToHome={onNavigateToHome}
        onNavigateToUploader={onNavigateToUploader}
        onNavigateToHistory={onNavigateToHistory}
        onSmoothScroll={handleSmoothScroll}
      />
      
      <HeroSection onNavigateToUploader={onNavigateToUploader} />
      
      <FeaturesSection />
      
      <CTASection onNavigateToUploader={onNavigateToUploader} />
      
      <Footer />
    </div>
  );
};

export default Home;