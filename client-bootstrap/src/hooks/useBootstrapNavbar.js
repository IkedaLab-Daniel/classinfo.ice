import { useEffect } from 'react';

// Custom hook to handle Bootstrap navbar toggle
export const useBootstrapNavbar = () => {
  useEffect(() => {
    // Add click event listener to navbar toggler
    const handleToggleClick = (event) => {
      const button = event.target.closest('.navbar-toggler');
      if (!button) return;

      const targetSelector = button.getAttribute('data-bs-target');
      const target = document.querySelector(targetSelector);
      
      if (target) {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
          target.classList.remove('show');
          button.setAttribute('aria-expanded', 'false');
        } else {
          target.classList.add('show');
          button.setAttribute('aria-expanded', 'true');
        }
      }
    };

    // Add event listener to document for event delegation
    document.addEventListener('click', handleToggleClick);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleToggleClick);
    };
  }, []);
};

export default useBootstrapNavbar;
