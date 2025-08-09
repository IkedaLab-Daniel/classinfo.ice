import { Calendar, CalendarDays, CheckSquare, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
        let ticking = false;

        const createObserver = () => {
            // More lenient observer settings
            const isMobile = window.innerWidth <= 768;
            const observerConfig = {
                threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
                rootMargin: isMobile ? '-20px 0px -40% 0px' : '-40px 0px -30% 0px'
            };

            observer = new IntersectionObserver(
                (entries) => {
                    if (!ticking) {
                        requestAnimationFrame(() => {
                            // Sort entries by their position in the document
                            const visibleSections = entries
                                .filter(entry => entry.isIntersecting)
                                .map(entry => ({
                                    id: entry.target.id,
                                    ratio: entry.intersectionRatio,
                                    top: entry.boundingClientRect.top,
                                    element: entry.target
                                }))
                                .sort((a, b) => a.top - b.top);

                            if (visibleSections.length > 0) {
                                // Choose the section that's most prominently visible
                                let bestSection = visibleSections[0];
                                
                                // If multiple sections are visible, prefer the one with higher intersection ratio
                                // or the one that's closer to the center of the viewport
                                for (let section of visibleSections) {
                                    const viewportCenter = window.innerHeight / 2;
                                    const sectionCenter = Math.abs(section.top + section.element.offsetHeight / 2 - viewportCenter);
                                    const bestSectionCenter = Math.abs(bestSection.top + bestSection.element.offsetHeight / 2 - viewportCenter);
                                    
                                    if (section.ratio > bestSection.ratio || 
                                        (section.ratio >= bestSection.ratio * 0.8 && sectionCenter < bestSectionCenter)) {
                                        bestSection = section;
                                    }
                                }
                                
                                if (bestSection.id !== activeSection) {
                                    console.log('🔍 Navigation: Switching to section:', bestSection.id, 'from:', activeSection);
                                    setActiveSection(bestSection.id);
                                }
                            }
                            
                            ticking = false;
                        });
                        ticking = true;
                    }
                },
                observerConfig
            );

            // Wait for AOS animations to complete before observing
            const startObserving = () => {
                const sections = ['today-page', 'weekly', 'tasks'];
                sections.forEach((id) => {
                    const element = document.getElementById(id);
                    if (element) {
                        observer.observe(element);
                    }
                });
            };

            // Delay observation to account for AOS animations
            setTimeout(startObserving, 500);
        };

        createObserver();

        // Handle window resize to recreate observer with new settings
        const handleResize = () => {
            if (observer) {
                observer.disconnect();
            }
            createObserver();
        };

        // Backup scroll listener for better reliability
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const sections = ['today-page', 'weekly', 'tasks'];
                    const scrollPosition = window.scrollY + 100; // Offset for navbar
                    
                    let currentSection = 'today-page'; // Default
                    
                    sections.forEach(sectionId => {
                        const element = document.getElementById(sectionId);
                        if (element) {
                            const elementTop = element.offsetTop;
                            const elementBottom = elementTop + element.offsetHeight;
                            
                            if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
                                currentSection = sectionId;
                            }
                        }
                    });
                    
                    if (currentSection !== activeSection) {
                        console.log('📜 Scroll: Switching to section:', currentSection, 'from:', activeSection);
                        setActiveSection(currentSection);
                    }
                    
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            if (observer) {
                observer.disconnect();
            }
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [location.pathname]);

    // Handle direct navigation with hash
    useEffect(() => {
        if (location.pathname === '/' && location.hash) {
            const sectionId = location.hash.substring(1); // Remove the #
            setTimeout(() => scrollToSection(sectionId), 100); // Small delay to ensure DOM is ready
        } else if (location.pathname === '/') {
            // Set default active section when on home page without hash
            // Use a more robust check
            setTimeout(() => {
                if (!activeSection || activeSection === '') {
                    console.log('🏠 Setting default active section to today-page');
                    setActiveSection('today-page');
                }
            }, 1000); // Wait for AOS and other animations
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
            </div>
        </nav>
    )
}

export default NavBar