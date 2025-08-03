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

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                threshold: 0.3,
                rootMargin: '-100px 0px -40% 0px'
            }
        );

        const sections = ['today', 'weekly', 'tasks'];
        sections.forEach((id) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => {
            sections.forEach((id) => {
                const element = document.getElementById(id);
                if (element) observer.unobserve(element);
            });
        };
    }, [location.pathname]);

    // Handle direct navigation with hash
    useEffect(() => {
        if (location.pathname === '/' && location.hash) {
            const sectionId = location.hash.substring(1); // Remove the #
            setTimeout(() => scrollToSection(sectionId), 100); // Small delay to ensure DOM is ready
        } else if (location.pathname === '/') {
            // Set default active section when on home page without hash
            setActiveSection('today');
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
        scrollToSection(sectionId);
    };

    // Determine if a nav item is active
    const isActive = (sectionId) => {
        if (location.pathname === '/manage') {
            return sectionId === 'manage';
        }
        if (location.pathname === '/' && sectionId) {
            return activeSection === sectionId;
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
                        href="#today" 
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