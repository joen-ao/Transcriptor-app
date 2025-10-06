import React, { useState } from 'react';
import Home from './pages/Home';
import Uploader from './pages/Uploader';
import History from './pages/History';
import './styles/App.css';

type Page = 'home' | 'uploader' | 'history';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const handleNavigateToUploader = () => {
    setCurrentPage('uploader');
  };

  const handleNavigateToHistory = () => {
    setCurrentPage('history');
  };

  const handleNavigateToHome = () => {
    setCurrentPage('home');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'uploader':
        return (
          <Uploader 
            onNavigateToHome={handleNavigateToHome} 
            onNavigateToUploader={handleNavigateToUploader}
            onNavigateToHistory={handleNavigateToHistory}
          />
        );
      case 'history':
        return (
          <History 
            onNavigateToHome={handleNavigateToHome}
            onNavigateToUploader={handleNavigateToUploader}
            onNavigateToHistory={handleNavigateToHistory}
          />
        );
      case 'home':
      default:
        return (
          <Home 
            onNavigateToUploader={handleNavigateToUploader}
            onNavigateToHistory={handleNavigateToHistory}
            onNavigateToHome={handleNavigateToHome}
            isElectronReady={true}
          />
        );
    }
  };

  return (
    <div className="app">
      {renderCurrentPage()}
    </div>
  );
}

export default App;