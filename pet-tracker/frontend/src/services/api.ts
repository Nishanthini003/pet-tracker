import axios, { AxiosError } from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Don't use credentials since we're using token-based auth
  withCredentials: false,
  // Increase timeout for development
  timeout: 10000
});


// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error: AxiosError) => {
    console.error('Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error.response?.data || { error: 'Network Error' });
  }
);

export const auth = {
  login: async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await api.post('/auth/login', { email, password });
      console.log('Login successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },
  signup: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/signup', { email, password });
      return response.data;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  },
  officerLogin: async (email: string, badgeNumber: string, password: string) => {
    try {
      const response = await api.post('/auth/officer/login', { 
        email, 
        badgeNumber, 
        password 
      });
      return response.data;
    } catch (error) {
      console.error('Officer login failed:', error);
      throw error;
    }
  }
};

export const petitions = {
  create: async (data: {
    title: string;
    description: string;
    address: string,
    category: string;
    priority?: string;
    contact?: string;
    submittedBy?: string;
  }) => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });
    try {
      console.log(formData);
      
      const response = await api.post('/petitions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Petition created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create petition failed:', error);
      throw error;
    }
  },
  getAll: async (params?: {
    status?: string;
    priority?: string;
    category?: string;
    limit?: number;
  }) => {
    try {
      const response = await api.get('/petitions', { params });
      return response.data;
    } catch (error) {
      console.error('Get petitions failed:', error);
      throw error;
    }
  },
  getByDepartment: async (department: string) => {
    try {
      console.log('Fetching petitions for department:', department);
      const response = await api.get(`/petitions/department/${department}`);
      console.log('Department petitions response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get department petitions failed:', error);
      throw error;
    }
  },
  update: async (id: string, data: { status?: string; priority?: string }) => {
    try {
      const response = await api.patch(`/petitions/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update petition failed:', error);
      throw error;
    }
  },
  markAsReceived: async (id: string) => {
    try {
      const response = await api.patch(`/petitions/${id}/receive`);
      return response.data;
    } catch (error) {
      console.error('Mark as received failed:', error);
      throw error;
    }
  }
};

export const admin = {
  getPetitionStatistics: async () => {
    try {
      const response = await api.get('/admin/petitions/statistics');
      return response.data;
    } catch (error) {
      console.error('Get petition statistics failed:', error);
      throw error;
    }
  },
  getOfficerList: async () => {
    try {
      const response = await api.get('/admin/officers');
      return response.data;
    } catch (error) {
      console.error('Get officer list failed:', error);
      throw error;
    }
  },
  getDepartmentList: async () => {
    try {
      const response = await api.get('/admin/departments');
      return response.data;
    } catch (error) {
      console.error('Get department list failed:', error);
      throw error;
    }
  },
  getUsersWithPetitions: async () => {
    try {
      const response = await api.get('/petitions/');
      return response.data;
    } catch (error) {
      console.error('Error fetching users with petitions:', error);
      throw error;
    }
  }
};

export const officer = {
  getAssignedPetitions: async () => {
    try {
      const response = await api.get('/officer/petitions');
      return response.data;
    } catch (error) {
      console.error('Get assigned petitions failed:', error);
      throw error;
    }
  },
  updatePetitionStatus: async (id: string, data: { status: string }) => {
    try {
      const response = await api.patch(`/officer/petitions/${id}/status`, data);
      return response.data;
    } catch (error) {
      console.error('Update petition status failed:', error);
      throw error;
    }
  }
};

export const fetchAllPetitions = async () => {
  try {
    const response = await api.get('/petitions/all');
    return response.data.petitions;
  } catch (error) {
    console.error('Fetch petitions failed:', error);
    throw error;
  }
};
export const updatePetitionStatus = async (petitionId: string, newStatus: string) => {
  try {
    const response = await axios.patch(`/api/petitions/${petitionId}/status`, {
      status: newStatus,
    });
    return response.data;
  } catch (error) {
    console.error('Status update failed:', error);
    throw error.response.data;
  }
};
export default api;
