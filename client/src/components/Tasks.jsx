import "./tasks.css"
import { ClipboardList } from "lucide-react";
import { CheckCircle } from "lucide-react";

const Tasks = () => {
    return(
        <section id="tasks">
            <div className="tasks-container">
                <div className="tasks-header">
                    <ClipboardList size={24} />
                    <h2>Tasks</h2>
                </div>

                <div className="task-cards-container">
                    <div className="task-card pending">
                        <div className="head">
                            <CheckCircle size={20} className="task-completed-icon" />
                            <p className="task-status">Pending</p>
                            <p className="subject">WebDev</p>
                        </div>

                        <div className="content">
                            <p className="title">Web Dev Project #2</p>
                            <p className="description">Build a full-stack React application with authentication, CRUD operations, and responsive design. Include proper error handling and testing.</p>
                            <p className="due-date-label">Due Date:</p>
                            <p className="due-date">Aug 20, 2025</p>
                            <p className="due-time-label">At:</p>
                            <p className="due-time">10:00AM</p>
                        </div>

                        <div className="foot">
                            <p className="priority high">HIGH</p>
                            <p>18 Days remaining</p>
                        </div>
                        
                    </div>

                    <div className="task-card pending">
                        <div className="head">
                            <CheckCircle size={20} className="task-completed-icon" />
                            <p className="task-status">Pending</p>
                            <p className="subject">WebDev</p>
                        </div>

                        <div className="content">
                            <p className="title">Web Dev Project #2</p>
                            <p className="description">Build a full-stack React application with authentication, CRUD operations, and responsive design. Include proper error handling and testing.</p>
                            <p className="due-date-label">Due Date:</p>
                            <p className="due-date">Aug 3, 2025</p>
                            <p className="due-time-label">At:</p>
                            <p className="due-time">10:00AM</p>
                        </div>

                        <div className="foot">
                            <p className="priority low">LOW</p>
                            <p>Due Today</p>
                        </div>
                        
                    </div>

                    <div className="task-card overdue">
                        <div className="head">
                            <CheckCircle size={20} className="task-completed-icon" />
                            <p className="task-status">Pending</p>
                            <p className="subject">WebDev</p>
                        </div>

                        <div className="content">
                            <p className="title">Web Dev Project #2</p>
                            <p className="description">Build a full-stack React application with authentication, CRUD operations, and responsive design. Include proper error handling and testing.</p>
                            <p className="due-date-label">Due Date:</p>
                            <p className="due-date">Aug 1, 2025</p>
                            <p className="due-time-label">At:</p>
                            <p className="due-time">10:00AM</p>
                        </div>

                        <div className="foot">
                            <p className="priority high">HIGH</p>
                            <p>Overdue!</p>
                        </div>                        
                    </div>

                    <div className="task-card overdue">
                        <div className="head">
                            <CheckCircle size={20} className="task-completed-icon" />
                            <p className="task-status">Overdue</p>
                            <p className="subject">WebDev</p>
                        </div>

                        <div className="content">
                            <p className="title">Web Dev Project #2</p>
                            <p className="description">Build a full-stack React application with authentication, CRUD operations, and responsive design. Include proper error handling and testing.</p>
                            <p className="due-date-label">Due Date:</p>
                            <p className="due-date">Aug 1, 2025</p>
                            <p className="due-time-label">At:</p>
                            <p className="due-time">10:00AM</p>
                        </div>

                        <div className="foot">
                            <p className="priority high">HIGH</p>
                            <p>Overdue!</p>
                        </div>                        
                    </div>

                    <div className="task-card overdue">
                        <div className="head">
                            <CheckCircle size={20} className="task-completed-icon" />
                            <p className="task-status">Overdue</p>
                            <p className="subject">WebDev</p>
                        </div>

                        <div className="content">
                            <p className="title">Web Dev Project #2</p>
                            <p className="description">Build a full-stack React application with authentication, CRUD operations, and responsive design. Include proper error handling and testing.</p>
                            <p className="due-date-label">Due Date:</p>
                            <p className="due-date">Aug 1, 2025</p>
                            <p className="due-time-label">At:</p>
                            <p className="due-time">10:00AM</p>
                        </div>

                        <div className="foot">
                            <p className="priority high">HIGH</p>
                            <p>Overdue!</p>
                        </div>                        
                    </div>

                </div>
            </div>
        </section>
    )
}

export default Tasks