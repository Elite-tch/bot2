import axios from 'axios';

const API_BASE = '/api/chat';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        if (error.response) {
          // Server responded with error status
          throw new Error(error.response.data.error || 'Server error occurred');
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Network error - please check your connection');
        } else {
          // Something else happened
          throw new Error('An unexpected error occurred');
        }
      }
    );
  }

  async startConversation(userData) {
    return await this.client.post('/start', userData);
  }

  async sendMessage(userId, message) {
    return await this.client.post('/message', { userId, message });
  }

  async startVALUE(userId) {
    return await this.client.post('/start-value', { userId });
  }

  async startSession(userId, sessionType) {
    return await this.client.post('/session/start', { userId, sessionType });
  }

  async submitAnswer(sessionId, answer) {
    return await this.client.post('/session/answer', { sessionId, answer });
  }

  async getUserSummary(userId) {
    const response = await axios.get(`/api/chat/user/${userId}/summary`);
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;