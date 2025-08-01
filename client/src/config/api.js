// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// API endpoints
export const API_ENDPOINTS = {
  SCHEDULES: '/schedules',
  SCHEDULES_TODAY: '/schedules/filter/today',
  SCHEDULES_BY_DATE: (date) => `/schedules?date=${date}`,
  SCHEDULES_RANGE: (startDate, endDate) => `/schedules/range/${startDate}/${endDate}`,
  SCHEDULE_BY_ID: (id) => `/schedules/${id}`,
  
  // Announcement endpoints
  ANNOUNCEMENTS: '/announcements',
  ANNOUNCEMENTS_LATEST: '/announcements/latest',
  ANNOUNCEMENTS_RANGE: (startDate, endDate) => `/announcements/range/${startDate}/${endDate}`,
  ANNOUNCEMENT_BY_ID: (id) => `/announcements/${id}`,
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

  // Get all schedules Today
  getToday: () => {
    // Calculate today's date in the client's local timezone
    const today = new Date();
    const localDate = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
    
    // Use the general schedules endpoint with date filter instead of the today endpoint
    return apiClient.get(`${API_ENDPOINTS.SCHEDULES}?date=${localDate}`);
  },
  
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

// Convenience methods for announcement-related API calls
export const announcementAPI = {
  // Get all announcements
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    const queryString = queryParams.toString();
    const endpoint = queryString ? `${API_ENDPOINTS.ANNOUNCEMENTS}?${queryString}` : API_ENDPOINTS.ANNOUNCEMENTS;
    return apiClient.get(endpoint);
  },
  
  // Get latest announcements
  getLatest: (limit = 5) => apiClient.get(`${API_ENDPOINTS.ANNOUNCEMENTS_LATEST}?limit=${limit}`),
  
  // Get announcements in date range
  getRange: (startDate, endDate, params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    const queryString = queryParams.toString();
    const endpoint = queryString ? 
      `${API_ENDPOINTS.ANNOUNCEMENTS_RANGE(startDate, endDate)}?${queryString}` : 
      API_ENDPOINTS.ANNOUNCEMENTS_RANGE(startDate, endDate);
    return apiClient.get(endpoint);
  },
  
  // Get announcement by ID
  getById: (id) => apiClient.get(API_ENDPOINTS.ANNOUNCEMENT_BY_ID(id)),
  
  // Create new announcement
  create: (announcementData) => apiClient.post(API_ENDPOINTS.ANNOUNCEMENTS, announcementData),
  
  // Update announcement
  update: (id, announcementData) => apiClient.put(API_ENDPOINTS.ANNOUNCEMENT_BY_ID(id), announcementData),
  
  // Delete announcement
  delete: (id) => apiClient.delete(API_ENDPOINTS.ANNOUNCEMENT_BY_ID(id)),
};

export default apiClient;
