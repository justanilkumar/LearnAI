// Learnify API Client Wrapper
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('learnify_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('learnify_token', token);
    } else {
      localStorage.removeItem('learnify_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  // Auth & User
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  logout() {
    this.setToken(null);
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  async getDemoUsers() {
    return await this.request('/auth/demo-users');
  }

  // Courses
  async getCourses(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/courses${query ? `?${query}` : ''}`);
  }

  async getCourse(id) {
    return await this.request(`/courses/${id}`);
  }

  async getCategories() {
    return await this.request('/courses/meta/categories');
  }

  // Lessons
  async getLesson(id) {
    return await this.request(`/lessons/${id}`);
  }

  async completeLesson(courseId, lessonId) {
    return await this.request(`/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: 'POST'
    });
  }

  // Quiz
  async getQuiz(courseId) {
    return await this.request(`/courses/${courseId}/quiz`);
  }

  async submitQuiz(quizId, answers) {
    return await this.request(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  }

  // Enrollments
  async enroll(courseId) {
    return await this.request(`/courses/${courseId}/enroll`, {
      method: 'POST'
    });
  }

  async getMyEnrollments() {
    return await this.request('/enrollments/my');
  }

  async getCourseProgress(courseId) {
    return await this.request(`/courses/${courseId}/progress`);
  }

  // Certificates
  async issueCertificate(courseId) {
    return await this.request(`/courses/${courseId}/certificate`, {
      method: 'POST'
    });
  }

  async getMyCertificates() {
    return await this.request('/certificates/my');
  }

  async verifyCertificate(certificateId) {
    return await this.request(`/certificates/verify/${certificateId}`);
  }

  // Analytics (MongoDB Aggregation Pipelines)
  async getInstructorAnalytics() {
    return await this.request('/analytics/instructor');
  }

  async getStudentAnalytics() {
    return await this.request('/analytics/student');
  }

  async getPlatformOverview() {
    return await this.request('/analytics/platform');
  }

  // Reset database with fresh seeds
  async resetDatabase() {
    return await this.request('/seed', { method: 'POST' });
  }
}

window.api = new ApiClient();
