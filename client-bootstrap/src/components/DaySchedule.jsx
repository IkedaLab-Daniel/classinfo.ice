import React from 'react';

const DaySchedule = ({ day, schedules, isToday }) => {
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'completed':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getDayNumber = (date) => {
    return date.getDate();
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // Sort schedules by start time
  const sortedSchedules = schedules.sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <div className="col-lg col-md-6 col-sm-12 mb-4">
      <div className={`card h-100 day-card ${isToday ? 'border-primary shadow-lg' : 'border-light'}`}>
        {/* Day Header */}
        <div className={`card-header text-center ${isToday ? 'bg-primary text-white' : 'bg-light'}`}>
          <div className="d-flex flex-column">
            <h6 className={`mb-1 fw-bold ${isToday ? 'text-white' : 'text-primary'}`}>
              {getDayName(day)}
            </h6>
            <div className={`d-flex align-items-center justify-content-center ${isToday ? 'text-white' : 'text-muted'}`}>
              <span className="me-1">{getMonthName(day)}</span>
              <span className={`badge ${isToday ? 'bg-white text-primary' : 'bg-primary text-white'} rounded-pill`}>
                {getDayNumber(day)}
              </span>
            </div>
          </div>
        </div>

        {/* Schedules */}
        <div className="card-body p-2" style={{ minHeight: '400px' }}>
          {sortedSchedules.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="bi bi-calendar-x mb-2 d-block" style={{ fontSize: '2rem' }}></i>
              <small>No classes</small>
            </div>
          ) : (
            <div className="schedule-list">
              {sortedSchedules.map((schedule, index) => (
                <div 
                  key={schedule._id} 
                  className={`schedule-item mb-2 p-2 rounded border-start border-3 border-${getStatusColor(schedule.status)} bg-light`}
                  style={{ fontSize: '0.8rem' }}
                >
                  <div className="d-flex flex-column">
                    <div className={`fw-bold text-${getStatusColor(schedule.status)} mb-1`}>
                      {schedule.subject}
                    </div>
                    
                    <div className="d-flex align-items-center mb-1">
                      <i className="bi bi-clock me-1 text-muted"></i>
                      <small className="text-dark">
                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                      </small>
                    </div>
                    
                    <div className="d-flex align-items-center mb-1">
                      <i className="bi bi-geo-alt me-1 text-muted"></i>
                      <small className="text-muted">{schedule.room}</small>
                    </div>
                    
                    {schedule.description && (
                      <div className="mt-1">
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {schedule.description.length > 50 
                            ? `${schedule.description.substring(0, 50)}...` 
                            : schedule.description
                          }
                        </small>
                      </div>
                    )}
                    
                    <div className="mt-1">
                      <span className={`badge bg-${getStatusColor(schedule.status)} bg-opacity-25 text-${getStatusColor(schedule.status)}`} style={{ fontSize: '0.6rem' }}>
                        {schedule.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Day Footer */}
        <div className="card-footer bg-transparent text-center p-1">
          <small className={`${isToday ? 'text-primary fw-bold' : 'text-muted'}`}>
            {sortedSchedules.length} {sortedSchedules.length === 1 ? 'class' : 'classes'}
          </small>
        </div>
      </div>
    </div>
  );
};

export default DaySchedule;
