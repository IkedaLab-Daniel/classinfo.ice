import React from 'react';

const ScheduleCard = ({ schedule }) => {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      case 'completed':
        return 'bg-secondary';
      default:
        return 'bg-primary';
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card h-100 schedule-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0 text-primary fw-bold">{schedule.subject}</h6>
          <span className={`badge status-badge ${getStatusBadgeClass(schedule.status)}`}>
            {schedule.status.toUpperCase()}
          </span>
        </div>
        
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-12">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-clock me-2 text-primary"></i>
                <span className="schedule-time">
                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                </span>
              </div>
              
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-geo-alt me-2 text-primary"></i>
                <span className="schedule-room">{schedule.room}</span>
              </div>
              
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-calendar me-2 text-primary"></i>
                <small className="text-muted">{formatDate(schedule.date)}</small>
              </div>
            </div>
          </div>
          
          {schedule.description && (
            <div className="mt-3">
              <p className="card-text text-muted small mb-0">
                {schedule.description}
              </p>
            </div>
          )}
        </div>
        
        <div className="card-footer bg-transparent border-0">
          <small className="text-muted">
            Updated: {new Date(schedule.updatedAt).toLocaleDateString()}
          </small>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;
