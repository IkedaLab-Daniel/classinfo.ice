import React, { useState, useEffect } from 'react';
import ScheduleCard from './ScheduleCard';

const Homepage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchTodaysSchedules();
  }, []);

  const fetchTodaysSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${API_URL}/api/schedules?date=${today}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Sort schedules by start time
        const sortedSchedules = data.data.sort((a, b) => {
          return a.startTime.localeCompare(b.startTime);
        });
        setSchedules(sortedSchedules);
      } else {
        throw new Error(data.message || 'Failed to fetch schedules');
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActiveSchedulesCount = () => {
    return schedules.filter(schedule => schedule.status === 'active').length;
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading today's schedules...</p>
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
              <h4 className="alert-heading">⚠️ Error Loading Schedules</h4>
              <p className="mb-0">{error}</p>
              <hr />
              <button 
                className="btn btn-outline-danger btn-sm" 
                onClick={fetchTodaysSchedules}
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold text-primary mb-2">📅 Today's Schedule</h1>
              <p className="lead text-muted mb-0">{getCurrentDate()}</p>
            </div>
            <button 
              className="btn btn-outline-primary"
              onClick={fetchTodaysSchedules}
              title="Refresh schedules"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Total Classes</h5>
              <h2 className="mb-0">{schedules.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Active Classes</h5>
              <h2 className="mb-0">{getActiveSchedulesCount()}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Status</h5>
              <h6 className="mb-0">
                {schedules.length > 0 ? '✅ Scheduled' : '📅 No Classes'}
              </h6>
            </div>
          </div>
        </div>
      </div>

      {/* Schedules Section */}
      <div className="row">
        {schedules.length === 0 ? (
          <div className="col-12">
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="bi bi-calendar-x" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
              </div>
              <h3 className="text-muted">No Classes Today</h3>
              <p className="no-schedules">
                There are no scheduled classes for today. Enjoy your free time! 🎉
              </p>
              <button 
                className="btn btn-primary mt-3"
                onClick={fetchTodaysSchedules}
              >
                Check Again
              </button>
            </div>
          </div>
        ) : (
          schedules.map((schedule) => (
            <ScheduleCard key={schedule._id} schedule={schedule} />
          ))
        )}
      </div>

      {/* Quick Actions */}
      {schedules.length > 0 && (
        <div className="row mt-5">
          <div className="col-12">
            <div className="card bg-light">
              <div className="card-body text-center">
                <h5 className="card-title">📋 Quick Actions</h5>
                <p className="card-text text-muted">
                  Manage your class schedules efficiently
                </p>
                <div className="btn-group" role="group">
                  <button type="button" className="btn btn-outline-primary" disabled>
                    📝 Add New Class
                  </button>
                  <button type="button" className="btn btn-outline-secondary" disabled>
                    📊 View Reports
                  </button>
                  <button type="button" className="btn btn-outline-info" disabled>
                    ⚙️ Settings
                  </button>
                </div>
                <small className="d-block mt-2 text-muted">
                  Features coming soon...
                </small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
