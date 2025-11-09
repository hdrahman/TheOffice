import axios from 'axios';

// Backend URL - update this if your backend runs on a different port
const API_BASE_URL = 'http://localhost:5000';

class API {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Set authentication token
  setToken(token) {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  // Auth endpoints
  async login(email, password) {
    const response = await this.client.post('/auth/login', { email, password });
    const { session, user } = response.data;
    if (session?.access_token) {
      this.setToken(session.access_token);
    }
    return response.data;
  }

  async signup(email, password, username, full_name) {
    const response = await this.client.post('/auth/signup', {
      email,
      password,
      username,
      full_name,
    });
    const { session, user } = response.data;
    if (session?.access_token) {
      this.setToken(session.access_token);
    }
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    this.setToken(null);
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Events endpoints
  async getEvents() {
    const response = await this.client.get('/events');
    return response.data;
  }

  async createEvent(eventData) {
    const response = await this.client.post('/events', eventData);
    return response.data;
  }

  // Conversations endpoints
  async getConversations() {
    const response = await this.client.get('/conversations');
    return response.data;
  }

  async getMessages(conversationId) {
    const response = await this.client.get(`/conversations/${conversationId}/messages`);
    return response.data;
  }

  async sendMessage(conversationId, content) {
    const response = await this.client.post(`/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data;
  }

  // Chatbot endpoints
  async uploadPDF(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/upload_pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async askQuestion(question, pdfText) {
    const response = await this.client.post('/ask_question', {
      question,
      pdf_text: pdfText,
    });
    return response.data;
  }
}

// Export a singleton instance
const api = new API();
export default api;