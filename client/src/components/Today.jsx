
const Today = () => {
    return(
       <section id="today">
        <h2>Today's Schedule</h2>
        <p>July 30, 2025</p>
        
        <div className="schedule-cards-container">
            <div className="schedule-card">
                <div className="head">
                    <p className="subject">Web Developement</p>
                </div>           
                <div className="body">
                    <p className="time">9:00AM - 11:00AM</p>
                    <p className="room">ROOM 102</p>
                    <p className="notes-label">Notes:</p>
                    <p className="notes">Bring your device. Bring Assignment. Bring cats.</p>
                    <p className="status">Upcoming</p>
                </div>     
                
            </div>

            <div className="schedule-card">
                <div className="head">
                    <p className="subject">Web Developement</p>
                </div>                
                <p className="time">9:00AM - 11:00AM</p>
                <p className="room">ROOM 102</p>
                <p className="notes-label">Notes:</p>
                <p className="notes">Bring your device. Bring Assignment. Bring cats.</p>
                <p className="status">Upcoming</p>
            </div>

            <div className="schedule-card">
                <div className="head">
                    <p className="subject">Web Developement</p>
                </div>                
                <p className="time">9:00AM - 11:00AM</p>
                <p className="room">ROOM 102</p>
                <p className="notes-label">Notes:</p>
                <p className="notes">Bring your device. Bring Assignment. Bring cats.</p>
                <p className="status">Upcoming</p>
            </div>

            <div className="schedule-card">
                <div className="head">
                    <p className="subject">Web Developement</p>
                </div>                
                <p className="time">9:00AM - 11:00AM</p>
                <p className="room">ROOM 102</p>
                <p className="notes-label">Notes:</p>
                <p className="notes">Bring your device. Bring Assignment. Bring cats.</p>
                <p className="status">Upcoming</p>
            </div>
        </div>
       </section>
    )
}

export default Today