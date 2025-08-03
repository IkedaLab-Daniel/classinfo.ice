import "./tasks.css"
import { 
    ClipboardList, 
    CheckCircle, 
    Clock, 
    Calendar,
    AlertTriangle,
    BookOpen,
    FileText,
    Presentation,
    GraduationCap,
    Beaker,
    Brain,
    Lightbulb,
    Target,
    CircleDot,
    Play,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";

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
                            <CircleDot size={20} className="task-status-icon" />
                            <p className="task-status">Pending</p>
                            <p className="subject">
                                <BookOpen size={14} />
                                WebDev
                            </p>
                        </div>

                        <div className="content">
                            <div className="task-title">
                                <Target size={18} />
                                <p className="title">Web Dev Project #2</p>
                            </div>
                            <p className="description">Build a full-stack React application with authentication, CRUD operations, and responsive design. Include proper error handling and testing.</p>
                            <div className="due-info">
                                <div className="due-date-info">
                                    <Calendar size={16} />
                                    <span className="due-date-label">Due Date:</span>
                                    <span className="due-date">Aug 20, 2025</span>
                                </div>
                                <div className="due-time-info">
                                    <Clock size={16} />
                                    <span className="due-time-label">At:</span>
                                    <span className="due-time">10:00AM</span>
                                </div>
                            </div>
                        </div>

                        <div className="foot">
                            <div className="priority-container">
                                <AlertTriangle size={16} />
                                <p className="priority high">HIGH</p>
                            </div>
                            <p>18 Days remaining</p>
                        </div>
                        
                    </div>

                    <div className="task-card pending">
                        <div className="head">
                            <CircleDot size={20} className="task-status-icon" />
                            <p className="task-status">Pending</p>
                            <p className="subject">
                                <BookOpen size={14} />
                                WebDev
                            </p>
                        </div>

                        <div className="content">
                            <div className="task-title">
                                <Target size={18} />
                                <p className="title">Web Dev Project #2</p>
                            </div>
                            <p className="description">Build a full-stack React application with authentication, CRUD operations, and responsive design. Include proper error handling and testing.</p>
                            <div className="due-info">
                                <div className="due-date-info">
                                    <Calendar size={16} />
                                    <span className="due-date-label">Due Date:</span>
                                    <span className="due-date">Aug 3, 2025</span>
                                </div>
                                <div className="due-time-info">
                                    <Clock size={16} />
                                    <span className="due-time-label">At:</span>
                                    <span className="due-time">10:00AM</span>
                                </div>
                            </div>
                        </div>

                        <div className="foot">
                            <div className="priority-container">
                                <Lightbulb size={16} />
                                <p className="priority low">LOW</p>
                            </div>
                            <p>Due Today</p>
                        </div>
                        
                    </div>

                    <div className="task-card overdue">
                        <div className="head">
                            <AlertCircle size={20} className="task-status-icon" />
                            <p className="task-status">Pending</p>
                            <p className="subject">
                                <BookOpen size={14} />
                                WebDev
                            </p>
                        </div>

                        <div className="content">
                            <div className="task-title">
                                <Target size={18} />
                                <p className="title">Web Dev Project #2</p>
                            </div>
                            <p className="description">Build a full-stack React application with authentication, CRUD operations, and responsive design. Include proper error handling and testing.</p>
                            <div className="due-info">
                                <div className="due-date-info">
                                    <Calendar size={16} />
                                    <span className="due-date-label">Due Date:</span>
                                    <span className="due-date">Aug 1, 2025</span>
                                </div>
                                <div className="due-time-info">
                                    <Clock size={16} />
                                    <span className="due-time-label">At:</span>
                                    <span className="due-time">10:00AM</span>
                                </div>
                            </div>
                        </div>

                        <div className="foot">
                            <div className="priority-container">
                                <AlertTriangle size={16} />
                                <p className="priority high">HIGH</p>
                            </div>
                            <p>Overdue!</p>
                        </div>                        
                    </div>

                    <div className="task-card overdue">
                        <div className="head">
                            <AlertCircle size={20} className="task-status-icon" />
                            <p className="task-status">Overdue</p>
                            <p className="subject">
                                <GraduationCap size={14} />
                                WebDev
                            </p>
                        </div>

                        <div className="content">
                            <div className="task-title">
                                <Presentation size={18} />
                                <p className="title">Final Presentation</p>
                            </div>
                            <p className="description">Present the capstone project to industry professionals and faculty members. Include demo, technical details, and future improvements.</p>
                            <div className="due-info">
                                <div className="due-date-info">
                                    <Calendar size={16} />
                                    <span className="due-date-label">Due Date:</span>
                                    <span className="due-date">Aug 1, 2025</span>
                                </div>
                                <div className="due-time-info">
                                    <Clock size={16} />
                                    <span className="due-time-label">At:</span>
                                    <span className="due-time">10:00AM</span>
                                </div>
                            </div>
                        </div>

                        <div className="foot">
                            <div className="priority-container">
                                <AlertTriangle size={16} />
                                <p className="priority high">HIGH</p>
                            </div>
                            <p>Overdue!</p>
                        </div>                        
                    </div>

                    <div className="task-card completed">
                        <div className="head">
                            <CheckCircle2 size={20} className="task-status-icon" />
                            <p className="task-status">Completed</p>
                            <p className="subject">
                                <Brain size={14} />
                                AI/ML
                            </p>
                        </div>

                        <div className="content">
                            <div className="task-title">
                                <FileText size={18} />
                                <p className="title">Research Paper Draft</p>
                            </div>
                            <p className="description">Complete first draft of machine learning research paper on neural networks in computer vision applications.</p>
                            <div className="due-info">
                                <div className="due-date-info">
                                    <Calendar size={16} />
                                    <span className="due-date-label">Due Date:</span>
                                    <span className="due-date">Jul 30, 2025</span>
                                </div>
                                <div className="due-time-info">
                                    <Clock size={16} />
                                    <span className="due-time-label">At:</span>
                                    <span className="due-time">11:59PM</span>
                                </div>
                            </div>
                        </div>

                        <div className="foot">
                            <div className="priority-container">
                                <Brain size={16} />
                                <p className="priority medium">MEDIUM</p>
                            </div>
                            <p>Completed!</p>
                        </div>                        
                    </div>

                </div>
            </div>
        </section>
    )
}

export default Tasks