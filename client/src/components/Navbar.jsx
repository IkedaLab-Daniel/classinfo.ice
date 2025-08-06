import { Calendar, CalendarDays, CheckSquare, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';

const NavBar = () => {
    const location = useLocation();
    const [activeSection, setActiveSection] = useState('today');

    // Intersection Observer for active section detection
    useEffect(() => {
        if (location.pathname !== '/') {
            setActiveSection('');
            return;
        }

        let observer;

        const createObserver = () => {
            // Dynamic observer settings based on screen size
            const isMobile = window.innerWidth <= 768;
            const observerConfig = {
                threshold: [0.1, 0.2, 0.3, 0.4, 0.5], // Multiple thresholds for better detection
                rootMargin: isMobile ? '-60px 0px -60% 0px' : '-80px 0px -50% 0px'
            };

            observer = new IntersectionObserver(
                (entries) => {
                    // Find the entry with the highest intersection ratio
                    let maxEntry = null;
                    let maxRatio = 0;
                    
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                            maxRatio = entry.intersectionRatio;
                            maxEntry = entry;
                        }
                    });
                    
                    // Only update if we found a highly intersecting element
                    if (maxEntry && maxRatio > (isMobile ? 0.05 : 0.1)) {
                        setActiveSection(maxEntry.target.id);
                    }
                },
                observerConfig
            );

            const sections = ['today-page', 'weekly', 'tasks'];
            sections.forEach((id) => {
                const element = document.getElementById(id);
                if (element) observer.observe(element);
            });
        };

        createObserver();

        // Handle window resize to recreate observer with new settings
        const handleResize = () => {
            if (observer) {
                observer.disconnect();
            }
            createObserver();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            if (observer) {
                observer.disconnect();
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [location.pathname]);

    // Handle direct navigation with hash
    useEffect(() => {
        if (location.pathname === '/' && location.hash) {
            const sectionId = location.hash.substring(1); // Remove the #
            setTimeout(() => scrollToSection(sectionId), 100); // Small delay to ensure DOM is ready
        } else if (location.pathname === '/') {
            // Set default active section when on home page without hash
            setActiveSection('today-page');
        }
    }, [location.pathname, location.hash]);

    // Smooth scroll to section
    const scrollToSection = (sectionId) => {
        if (location.pathname !== '/') {
            // If not on home page, navigate to home first
            window.location.href = `/#${sectionId}`;
            return;
        }

        const element = document.getElementById(sectionId);
        if (element) {
            const navbarHeight = 80; // Adjust based on your navbar height
            const elementPosition = element.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    };

    // Handle clicks for home page sections
    const handleSectionClick = (e, sectionId) => {
        e.preventDefault();
        // Map display names to actual element IDs
        const idMap = {
            'today': 'today-page',
            'weekly': 'weekly',
            'tasks': 'tasks'
        };
        const actualId = idMap[sectionId] || sectionId;
        scrollToSection(actualId);
    };

    // Determine if a nav item is active
    const isActive = (sectionId) => {
        if (location.pathname === '/manage') {
            return sectionId === 'manage';
        }
        if (location.pathname === '/' && sectionId) {
            // Map display names to actual element IDs for comparison
            const idMap = {
                'today': 'today-page',
                'weekly': 'weekly',
                'tasks': 'tasks'
            };
            const actualId = idMap[sectionId] || sectionId;
            return activeSection === actualId;
        }
        return false;
    };

    return(
        <nav>
            <div className="wrapper">
                <div className="logo">
                    <span>ClassInfo.Ice</span>
                </div>
                <div className="links">
                    <a 
                        href="#today-page" 
                        onClick={(e) => handleSectionClick(e, 'today')}
                        className={isActive('today') ? 'active' : ''}
                    >
                        <Calendar size={18} />
                        <span>Today</span>
                    </a>
                    <a 
                        href="#weekly" 
                        onClick={(e) => handleSectionClick(e, 'weekly')}
                        className={isActive('weekly') ? 'active' : ''}
                    >
                        <CalendarDays size={18} />
                        <span>Weekly</span>
                    </a>
                    <a 
                        href="#tasks" 
                        onClick={(e) => handleSectionClick(e, 'tasks')}
                        className={isActive('tasks') ? 'active' : ''}
                    >
                        <CheckSquare size={18} />
                        <span>Tasks</span>
                    </a>
                    <Link to="/manage" className={isActive('manage') ? 'active' : ''}>
                        <Settings size={18} />
                        <span>Manage</span>
                    </Link>
                </div>
                <div className="navbar-actions">
                    <NotificationCenter />
                    <ThemeToggle variant="navbar" />
                </div>
            </div>
            
        </nav>
    )
}

export default NavBar