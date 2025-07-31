// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// API endpoints
export const API_ENDPOINTS = {
  SCHEDULES: '/schedules',
  SCHEDULES_BY_DATE: (date) => `/schedules?date=${date}`,
  SCHEDULES_RANGE: (startDate, endDate) => `/schedules/range/${startDate}/${endDate}`,
  SCHEDULE_BY_ID: (id) => `/schedules/${id}`,
};

// Base API class for making requests
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient();

// Convenience methods for schedule-related API calls
export const scheduleAPI = {
  // Get all schedules
  getAll: () => apiClient.get(API_ENDPOINTS.SCHEDULES),
  
  // Get schedules by date
  getByDate: (date) => apiClient.get(API_ENDPOINTS.SCHEDULES_BY_DATE(date)),
  
  // Get schedules in date range
  getRange: (startDate, endDate) => apiClient.get(API_ENDPOINTS.SCHEDULES_RANGE(startDate, endDate)),
  
  // Get schedule by ID
  getById: (id) => apiClient.get(API_ENDPOINTS.SCHEDULE_BY_ID(id)),
  
  // Create new schedule
  create: (scheduleData) => apiClient.post(API_ENDPOINTS.SCHEDULES, scheduleData),
  
  // Update schedule
  update: (id, scheduleData) => apiClient.put(API_ENDPOINTS.SCHEDULE_BY_ID(id), scheduleData),
  
  // Delete schedule
  delete: (id) => apiClient.delete(API_ENDPOINTS.SCHEDULE_BY_ID(id)),
};

export default apiClient;
