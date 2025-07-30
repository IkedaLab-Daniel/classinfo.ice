import { Calendar, CalendarDays, CheckSquare, Settings } from 'lucide-react';

const NavBar = () => {
    return(
        <nav>
            <div className="wrapper">
                <div className="logo">
                    <span>ClassInfo.Ice</span>
                </div>
                <div className="links">
                    <a href="#">
                        <Calendar size={18} />
                        <span>Today</span>
                    </a>
                    <a href="#">
                        <CalendarDays size={18} />
                        <span>Weekly</span>
                    </a>
                    <a href="#">
                        <CheckSquare size={18} />
                        <span>Tasks</span>
                    </a>
                    <a href="#">
                        <Settings size={18} />
                        <span>Manage</span>
                    </a>
                </div>
            </div>
            
        </nav>
    )
}

export default NavBar