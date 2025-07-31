import React from 'react';

const Navbar = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        <a className="navbar-brand" href="#home">
          📚 ClassInfo
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-white ${activeTab === 'home' ? 'active fw-bold' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                🏠 Home
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-white ${activeTab === 'weekly' ? 'active fw-bold' : ''}`}
                onClick={() => setActiveTab('weekly')}
                disabled
              >
                📅 Weekly (Coming Soon)
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
