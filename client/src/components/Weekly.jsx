import './Weekly.css'

import './Weekly.css';

const Weekly = () => {
    // > Sample struture muna. Mapping na pag sa actual data
    return(
        <section id="weekly">
            <div className="weekly-container">
                <div className="weekly-header">
                    <h3>Weekly Schedule</h3>
                    <p>August 1 - 7</p>
                </div>
                <div className="calendar">
                    {/* monday */}
                    <div className="day-card">
                        <div className="day-header">
                            <p className="day">Monday</p>
                            <p className="date">28</p>
                        </div>
                        <div className="day-content">
                            <div className="schedule-card completed">
                                <p className="status-label">Completed</p>
                                <p className="sched-title">Web Dev 1</p>
                                <p className="time">10:00AM - 11:00AM</p>
                                <p className="location">Room 101</p>
                                <p className="note">Note:</p>
                                <p className="note-content">Bring your device</p>
                            </div>
                            <div className="schedule-card upcoming">
                                <p className="status-label">Upcoming</p>
                                <p className="sched-title">Web Dev 2</p>
                                <p className="time">10:00PM - 11:00PM</p>
                                <p className="location">Room 101</p>
                                <p className="note">Note:</p>
                                <p className="note-content">Bring your device</p>
                            </div>
                        </div>
                    </div>

                    {/* tuesday */}
                    <div className="day-card">
                        <div className="day-header">
                            <p className="day">Tuesday</p>
                            <p className="date">29</p>
                        </div>
                        <div className="day-content">
                            <p>No Class</p>
                        </div>
                    </div>

                    {/* wednesday */}
                    <div className="day-card">
                        <div className="day-header">
                            <p className="day">Wednesday</p>
                            <p className="date">30</p>
                        </div>
                        <div className="day-content">
                            <div className="schedule-card live">
                                <p className="status-label">Live Now</p>
                                <p className="sched-title">Database Systems</p>
                                <p className="time">9:00AM - 10:30AM</p>
                                <p className="location">Room 205</p>
                                <p className="note">Note:</p>
                                <p className="note-content">SQL assignment due</p>
                            </div>
                            <div className="schedule-card upcoming">
                                <p className="status-label">Upcoming</p>
                                <p className="sched-title">Software Engineering</p>
                                <p className="time">2:00PM - 3:30PM</p>
                                <p className="location">Room 102</p>
                                <p className="note">Note:</p>
                                <p className="note-content">Project presentation</p>
                            </div>
                        </div>
                    </div>

                    {/* thursday */}
                    <div className="day-card">
                        <div className="day-header">
                            <p className="day">Thursday</p>
                            <p className="date">31</p>
                        </div>
                        <div className="day-content">
                            <div className="schedule-card upcoming">
                                <p className="status-label">Upcoming</p>
                                <p className="sched-title">Mobile App Dev</p>
                                <p className="time">11:00AM - 12:30PM</p>
                                <p className="location">Lab 301</p>
                                <p className="note">Note:</p>
                                <p className="note-content">Bring laptop and phone</p>
                            </div>
                            <div className="schedule-card upcoming">
                                <p className="status-label">Upcoming</p>
                                <p className="sched-title">Data Structures</p>
                                <p className="time">3:00PM - 4:30PM</p>
                                <p className="location">Room 203</p>
                                <p className="note">Note:</p>
                                <p className="note-content">Quiz on algorithms</p>
                            </div>
                        </div>
                    </div>

                    {/* friday */}
                    <div className="day-card">
                        <div className="day-header">
                            <p className="day">Friday</p>
                            <p className="date">1</p>
                        </div>
                        <div className="day-content">
                            <div className="schedule-card cancelled">
                                <p className="status-label">Cancelled</p>
                                <p className="sched-title">AI & Machine Learning</p>
                                <p className="time">8:00AM - 9:30AM</p>
                                <p className="location">Lab 401</p>
                                <p className="note">Note:</p>
                                <p className="note-content">Python environment setup</p>
                            </div>
                            <div className="schedule-card upcoming">
                                <p className="status-label">Upcoming</p>
                                <p className="sched-title">Web Dev 3</p>
                                <p className="time">1:00PM - 2:30PM</p>
                                <p className="location">Room 101</p>
                                <p className="note">Note:</p>
                                <p className="note-content">React project demo</p>
                            </div>
                        </div>
                    </div>

                    {/* saturday */}
                    <div className="day-card">
                        <div className="day-header">
                            <p className="day">Saturday</p>
                            <p className="date">2</p>
                        </div>
                        <div className="day-content">
                            <div className="schedule-card upcoming">
                                <p className="status-label">Upcoming</p>
                                <p className="sched-title">Computer Networks</p>
                                <p className="time">10:00AM - 11:30AM</p>
                                <p className="location">Room 304</p>
                                <p className="note">Note:</p>
                                <p className="note-content">Network configuration lab</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Weekly