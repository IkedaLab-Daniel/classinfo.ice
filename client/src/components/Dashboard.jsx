
const Dashboard = () => {
    
    return(
        <section id="dashboard">
            <div className="dashboard">
                <div className="left">
                    <p className="greeting">Good Morning!</p>
                    <p>Class: BSIT - 3B</p>
                    <p>Managed by:</p>
                </div>
                <div className="right">
                    <div className="card">
                        {/* icon */}
                        <span>28°C</span>
                        <span>Weather</span>
                        <span>Partly Cloudy</span>
                    </div>
                    <div className="card">
                        {/* icon */}
                        <span>3</span>
                        <span>Tasks Due</span>
                        <span>Today</span>
                    </div>
                    <div className="card">
                        {/* icon */}
                        <span>3</span>
                        <span>Classes</span>
                        <span>Remaining</span>
                    </div>
                </div>
                
            </div>
        </section>
    )
}

export default Dashboard