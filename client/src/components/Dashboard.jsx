
import { Cloud, CheckSquare, BookOpen, Sun, CloudRain, Snowflake, IceCream } from 'lucide-react';
import ice from '../assets/ice.jpeg'
const Dashboard = () => {
    
    return(
        <section id="dashboard">
            <div className="dashboard">
                <div className="left">
                    <p className="greeting">Good Morning!</p>
                    <p className='class'>Class: BSIT - 3B</p>
                    {/* <p className='manage-by'>Managed by:</p> */}
                    <div className="manage-by-container">
                        <div className="img-wrapper">
                            <img src={ice} alt="" />
                            <img src={ice} alt="" />
                            <img src={ice} alt="" />
                        </div>
                        <p>Managed by: <span className='name'>Ice, Ice, Baby</span></p>
                    </div>
                </div>
                <div className="right">
                    <div className="card">
                        <Cloud size={32} />
                        <span className="card-value">28°C</span>
                        <span className="card-label">Weather</span>
                        <span className="card-description">Partly Cloudy</span>
                    </div>
                    <div className="card">
                        <CheckSquare size={32} />
                        <span className="card-value">3</span>
                        <span className="card-label">Tasks Due</span>
                        <span className="card-description">Today</span>
                    </div>
                    <div className="card">
                        <BookOpen size={32} />
                        <span className="card-value">3</span>
                        <span className="card-label">Classes</span>
                        <span className="card-description">Remaining</span>
                    </div>
                </div>
                
            </div>
        </section>
    )
}

export default Dashboard