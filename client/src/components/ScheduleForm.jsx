import React, { useState, useEffect } from 'react';

const ScheduleForm = ({ schedule, onSave, onCancel, isEditing }) => {
  const [formData, setFormData] = useState({
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
    room: '',
    description: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schedule) {
      // Format date for input field
      const formattedDate = schedule.date ? new Date(schedule.date).toISOString().split('T')[0] : '';
      setFormData({
        subject: schedule.subject || '',
        date: formattedDate,
        startTime: schedule.startTime || '',
        endTime: schedule.endTime || '',
        room: schedule.room || '',
        description: schedule.description || '',
        status: schedule.status || 'active'
      });
    }
  }, [schedule]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!formData.room.trim()) {
      newErrors.room = 'Room is required';
    }

    // Validate time order
    if (formData.startTime && formData.endTime) {
      const startTime = new Date(`1970-01-01T${formData.startTime}:00`);
      const endTime = new Date(`1970-01-01T${formData.endTime}:00`);
      
      if (endTime <= startTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {isEditing ? '✏️ Edit Schedule' : '➕ Add New Schedule'}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onCancel}
              disabled={loading}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-12 mb-3">
                  <label htmlFor="subject" className="form-label">
                    Subject <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.subject ? 'is-invalid' : ''}`}
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter subject name"
                    maxLength={100}
                    disabled={loading}
                  />
                  {errors.subject && (
                    <div className="invalid-feedback">{errors.subject}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="date" className="form-label">
                    Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {errors.date && (
                    <div className="invalid-feedback">{errors.date}</div>
                  )}
                </div>

                <div className="col-md-3 mb-3">
                  <label htmlFor="startTime" className="form-label">
                    Start Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    className={`form-control ${errors.startTime ? 'is-invalid' : ''}`}
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {errors.startTime && (
                    <div className="invalid-feedback">{errors.startTime}</div>
                  )}
                </div>

                <div className="col-md-3 mb-3">
                  <label htmlFor="endTime" className="form-label">
                    End Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    className={`form-control ${errors.endTime ? 'is-invalid' : ''}`}
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {errors.endTime && (
                    <div className="invalid-feedback">{errors.endTime}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="room" className="form-label">
                    Room <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.room ? 'is-invalid' : ''}`}
                    id="room"
                    name="room"
                    value={formData.room}
                    onChange={handleChange}
                    placeholder="Enter room number/name"
                    maxLength={50}
                    disabled={loading}
                  />
                  {errors.room && (
                    <div className="invalid-feedback">{errors.room}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    className="form-select"
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="col-md-12 mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter description (optional)"
                    maxLength={500}
                    disabled={loading}
                  />
                  <div className="form-text">
                    {formData.description.length}/500 characters
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </span>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? '💾 Update Schedule' : '➕ Create Schedule'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleForm;
