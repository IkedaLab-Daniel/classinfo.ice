import { Calendar, CalendarDays, CheckSquare, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NavBar = () => {
    const location = useLocation();

    return(
        <nav>
            <div className="wrapper">
                <div className="logo">
                    <span>ClassInfo.Ice</span>
                </div>
                <div className="links">
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                        <Calendar size={18} />
                        <span>Today</span>
                    </Link>
                    <Link to="/" className={location.pathname === '/weekly' ? 'active' : ''}>
                        <CalendarDays size={18} />
                        <span>Weekly</span>
                    </Link>
                    <Link to="/" className={location.pathname === '/tasks' ? 'active' : ''}>
                        <CheckSquare size={18} />
                        <span>Tasks</span>
                    </Link>
                    <Link to="/manage" className={location.pathname === '/manage' ? 'active' : ''}>
                        <Settings size={18} />
                        <span>Manage</span>
                    </Link>
                </div>
            </div>
            
        </nav>
    )
}

export default NavBar