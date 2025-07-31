import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Homepage from './components/Homepage';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Homepage />;
      case 'weekly':
        return (
          <div className="container mt-4">
            <div className="text-center">
              <h2>📅 Weekly View</h2>
              <p className="text-muted">This feature is coming soon!</p>
            </div>
          </div>
        );
      default:
        return <Homepage />;
    }
  };

  return (
    <div className="min-vh-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main>
        {renderContent()}
      </main>
      <footer className="bg-light mt-5 py-4">
        <div className="container text-center">
          <small className="text-muted">
            © 2025 ClassInfo System | Built with ❤️ and React
          </small>
        </div>
      </footer>
    </div>
  );
}

export default App;
