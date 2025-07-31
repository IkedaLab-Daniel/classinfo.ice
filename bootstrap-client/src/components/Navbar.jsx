import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useBootstrapNavbar from '../hooks/useBootstrapNavbar';

const Navbar = () => {
  const location = useLocation();
  useBootstrapNavbar(); // Initialize Bootstrap navbar functionality

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Close mobile menu when route changes
  useEffect(() => {
    const navbarCollapse = document.getElementById('navbarNav');
    const navbarToggler = document.querySelector('.navbar-toggler');
    
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      navbarCollapse.classList.remove('show');
      if (navbarToggler) {
        navbarToggler.setAttribute('aria-expanded', 'false');
      }
    }
  }, [location.pathname]);

  const handleNavLinkClick = () => {
    // Close mobile menu when a nav link is clicked
    const navbarCollapse = document.getElementById('navbarNav');
    const navbarToggler = document.querySelector('.navbar-toggler');
    
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      navbarCollapse.classList.remove('show');
      if (navbarToggler) {
        navbarToggler.setAttribute('aria-expanded', 'false');
      }
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        <Link className="navbar-brand" to="/">
          📚 ClassInfo
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive('/') ? 'active fw-bold' : ''}`}
                to="/"
                onClick={handleNavLinkClick}
              >
                🏠 Home
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive('/weekly') ? 'active fw-bold' : ''}`}
                to="/weekly"
                onClick={handleNavLinkClick}
              >
                📅 Weekly
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive('/manage') ? 'active fw-bold' : ''}`}
                to="/manage"
                onClick={handleNavLinkClick}
              >
                🗂️ Manage
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
