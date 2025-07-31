import React, { useState, useEffect } from 'react';
import ScheduleForm from './ScheduleForm';
import ConfirmDialog from './ConfirmDialog';

const ManageSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/schedules?limit=1000&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      
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
      console.error('Error fetching schedules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSchedule(null);
    setShowForm(true);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleDelete = (schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/api/schedules/${scheduleToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete schedule: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSchedules(prev => prev.filter(s => s._id !== scheduleToDelete._id));
        setShowDeleteDialog(false);
        setScheduleToDelete(null);
      } else {
        throw new Error(data.message || 'Failed to delete schedule');
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError(err.message);
    }
  };

  const handleSave = async (formData) => {
    try {
      const url = editingSchedule 
        ? `${API_URL}/api/schedules/${editingSchedule._id}`
        : `${API_URL}/api/schedules`;
      
      const method = editingSchedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save schedule: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        if (editingSchedule) {
          // Update existing schedule
          setSchedules(prev => prev.map(s => 
            s._id === editingSchedule._id ? data.data : s
          ));
        } else {
          // Add new schedule
          setSchedules(prev => [data.data, ...prev]);
        }
        
        setShowForm(false);
        setEditingSchedule(null);
      } else {
        throw new Error(data.message || 'Failed to save schedule');
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      throw err; // Re-throw to handle in form
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge bg-success">Active</span>;
      case 'cancelled':
        return <span className="badge bg-danger">Cancelled</span>;
      case 'completed':
        return <span className="badge bg-secondary">Completed</span>;
      default:
        return <span className="badge bg-primary">{status}</span>;
    }
  };

  // Filter and search schedules
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (schedule.description && schedule.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchedules = filteredSchedules.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    fetchSchedules();
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <i className="bi bi-arrow-down-up text-muted"></i>;
    return sortOrder === 'asc' 
      ? <i className="bi bi-arrow-up text-primary"></i>
      : <i className="bi bi-arrow-down text-primary"></i>;
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading schedules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h1 className="display-6 fw-bold text-primary mb-2">🗂️ Manage Schedules</h1>
              <p className="lead text-muted mb-0">Create, edit, and organize your class schedules</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button 
                className="btn btn-outline-primary"
                onClick={fetchSchedules}
                title="Refresh schedules"
              >
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreate}
              >
                <i className="bi bi-plus-lg"></i> Add Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-danger alert-dismissible" role="alert">
              <h4 className="alert-heading">⚠️ Error</h4>
              <p className="mb-0">{error}</p>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError(null)}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search schedules..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="col-md-5 mb-3">
          <div className="d-flex justify-content-end align-items-center">
            <small className="text-muted me-3">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredSchedules.length)} of {filteredSchedules.length} schedules
            </small>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th 
                        scope="col" 
                        className="cursor-pointer user-select-none"
                        onClick={() => handleSort('subject')}
                      >
                        Subject {getSortIcon('subject')}
                      </th>
                      <th 
                        scope="col" 
                        className="cursor-pointer user-select-none"
                        onClick={() => handleSort('date')}
                      >
                        Date {getSortIcon('date')}
                      </th>
                      <th scope="col">Time</th>
                      <th 
                        scope="col" 
                        className="cursor-pointer user-select-none"
                        onClick={() => handleSort('room')}
                      >
                        Room {getSortIcon('room')}
                      </th>
                      <th scope="col">Status</th>
                      <th scope="col">Description</th>
                      <th scope="col" className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSchedules.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5">
                          <div className="text-muted">
                            <i className="bi bi-calendar-x mb-2 d-block" style={{ fontSize: '3rem' }}></i>
                            {searchTerm || statusFilter !== 'all' 
                              ? 'No schedules match your search criteria'
                              : 'No schedules found. Create your first schedule!'
                            }
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedSchedules.map((schedule) => (
                        <tr key={schedule._id}>
                          <td>
                            <strong className="text-primary">{schedule.subject}</strong>
                          </td>
                          <td>{formatDate(schedule.date)}</td>
                          <td>
                            <span className="text-nowrap">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">{schedule.room}</span>
                          </td>
                          <td>{getStatusBadge(schedule.status)}</td>
                          <td>
                            {schedule.description ? (
                              <span title={schedule.description}>
                                {schedule.description.length > 50 
                                  ? `${schedule.description.substring(0, 50)}...`
                                  : schedule.description
                                }
                              </span>
                            ) : (
                              <span className="text-muted font-italic">No description</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-1 justify-content-center">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(schedule)}
                                title="Edit schedule"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(schedule)}
                                title="Delete schedule"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="row mt-4">
          <div className="col-12">
            <nav>
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ScheduleForm
          schedule={editingSchedule}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingSchedule(null);
          }}
          isEditing={!!editingSchedule}
        />
      )}

      {showDeleteDialog && (
        <ConfirmDialog
          show={showDeleteDialog}
          title="Delete Schedule"
          message={`Are you sure you want to delete "${scheduleToDelete?.subject}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteDialog(false);
            setScheduleToDelete(null);
          }}
          type="danger"
        />
      )}
    </div>
  );
};

export default ManageSchedules;
