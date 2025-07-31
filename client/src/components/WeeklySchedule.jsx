import React, { useState, useEffect } from 'react';
import DaySchedule from './DaySchedule';

const WeeklySchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchWeeklySchedules();
  }, [currentWeek]);

  const getWeekDates = (startDate) => {
    const week = [];
    const start = new Date(startDate);
    
    // Get Monday of the current week
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));
    
    // Generate 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      week.push(date);
    }
    
    return week;
  };

  const fetchWeeklySchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const weekDates = getWeekDates(currentWeek);
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];
      
      const response = await fetch(`${API_URL}/api/schedules/range/${startDate}/${endDate}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSchedules(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch schedules');
      }
    } catch (err) {
      console.error('Error fetching weekly schedules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date).toISOString().split('T')[0];
      return scheduleDate === dateString;
    });
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getWeekRange = () => {
    const weekDates = getWeekDates(currentWeek);
    const start = weekDates[0];
    const end = weekDates[6];
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  const getTotalSchedules = () => {
    return schedules.length;
  };

  const getActiveSchedules = () => {
    return schedules.filter(schedule => schedule.status === 'active').length;
  };

  const getBusiestDay = () => {
    const weekDates = getWeekDates(currentWeek);
    let busiestDay = null;
    let maxSchedules = 0;
    
    weekDates.forEach(date => {
      const daySchedules = getSchedulesForDate(date).length;
      if (daySchedules > maxSchedules) {
        maxSchedules = daySchedules;
        busiestDay = date;
      }
    });
    
    return busiestDay ? {
      day: busiestDay.toLocaleDateString('en-US', { weekday: 'long' }),
      count: maxSchedules
    } : null;
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading weekly schedules...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">⚠️ Error Loading Weekly Schedules</h4>
              <p className="mb-0">{error}</p>
              <hr />
              <button 
                className="btn btn-outline-danger btn-sm" 
                onClick={fetchWeeklySchedules}
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(currentWeek);
  const busiestDay = getBusiestDay();

  return (
    <div className="container-fluid mt-4">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h1 className="display-6 fw-bold text-primary mb-2">📅 Weekly Schedule</h1>
              <p className="lead text-muted mb-0">{getWeekRange()}</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigateWeek(-1)}
                title="Previous week"
              >
                <i className="bi bi-chevron-left"></i> Previous
              </button>
              <button 
                className="btn btn-primary"
                onClick={goToCurrentWeek}
                title="Current week"
              >
                <i className="bi bi-calendar-event"></i> This Week
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigateWeek(1)}
                title="Next week"
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
              <button 
                className="btn btn-outline-primary"
                onClick={fetchWeeklySchedules}
                title="Refresh schedules"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body text-center">
              <i className="bi bi-calendar-week mb-2" style={{ fontSize: '2rem' }}></i>
              <h5 className="card-title">Total Classes</h5>
              <h2 className="mb-0">{getTotalSchedules()}</h2>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body text-center">
              <i className="bi bi-check-circle mb-2" style={{ fontSize: '2rem' }}></i>
              <h5 className="card-title">Active Classes</h5>
              <h2 className="mb-0">{getActiveSchedules()}</h2>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card bg-info text-white h-100">
            <div className="card-body text-center">
              <i className="bi bi-graph-up mb-2" style={{ fontSize: '2rem' }}></i>
              <h5 className="card-title">Busiest Day</h5>
              <h6 className="mb-0">
                {busiestDay ? `${busiestDay.day} (${busiestDay.count})` : 'None'}
              </h6>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body text-center">
              <i className="bi bi-clock mb-2" style={{ fontSize: '2rem' }}></i>
              <h5 className="card-title">Week Status</h5>
              <h6 className="mb-0">
                {getTotalSchedules() > 0 ? '📚 Scheduled' : '🏖️ Free Week'}
              </h6>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="row">
        {weekDates.map((date, index) => (
          <DaySchedule
            key={date.toDateString()}
            day={date}
            schedules={getSchedulesForDate(date)}
            isToday={isToday(date)}
          />
        ))}
      </div>

      {/* Week Summary */}
      {getTotalSchedules() === 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="bi bi-calendar-x" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
              </div>
              <h3 className="text-muted">No Classes This Week</h3>
              <p className="text-muted">
                Looks like you have a free week! Time to relax or catch up on other activities. 🌟
              </p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => navigateWeek(-1)}
                >
                  <i className="bi bi-chevron-left"></i> Check Previous Week
                </button>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => navigateWeek(1)}
                >
                  Check Next Week <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {getTotalSchedules() > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="card-title">📋 Status Legend</h6>
                <div className="d-flex gap-3 flex-wrap">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-success me-2">●</span>
                    <small>Active Classes</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-danger me-2">●</span>
                    <small>Cancelled Classes</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-secondary me-2">●</span>
                    <small>Completed Classes</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="border border-primary bg-light rounded me-2" style={{ width: '20px', height: '20px' }}></div>
                    <small>Today</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklySchedule;
