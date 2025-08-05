import axios from 'axios';
import Cookies from 'js-cookie';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/auth`;

// Auth API service
export class AuthAPI {
  static getAuthHeaders() {
    const token = Cookies.get('access_token');
    if (token) {
      // Token is already in "Bearer xxx" format from backend
      return {
        'Authorization': token
      };
    }
    return {};
  }

  static async register(userData) {
    try {
      const response = await axios.post(`${API}/register`, userData, {
        withCredentials: true
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  }

  static async login(credentials) {
    try {
      const response = await axios.post(`${API}/login`, credentials, {
        withCredentials: true
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  }

  static async logout() {
    try {
      await axios.post(`${API}/logout`, {}, {
        withCredentials: true
      });
      Cookies.remove('access_token');
      return { success: true };
    } catch (error) {
      // Clear cookie even if API call fails
      Cookies.remove('access_token');
      return { success: true };
    }
  }

  static async getCurrentUser() {
    try {
      const response = await axios.get(`${API}/me`, {
        headers: this.getAuthHeaders(),
        withCredentials: true
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get user info'
      };
    }
  }

  static async forgotPassword(email) {
    try {
      const response = await axios.post(`${API}/forgot-password`, { email });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to send reset email'
      };
    }
  }

  static async resetPassword(token, newPassword) {
    try {
      const response = await axios.post(`${API}/reset-password`, {
        token,
        new_password: newPassword
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Password reset failed'
      };
    }
  }

  static async getSubscriptionPackages() {
    try {
      const response = await axios.get(`${API}/packages`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get packages'
      };
    }
  }

  static async createCheckoutSession(packageId) {
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/checkout`, {
        package_id: packageId,
        origin_url: originUrl
      }, {
        headers: this.getAuthHeaders(),
        withCredentials: true
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create checkout session'
      };
    }
  }

  static async checkPaymentStatus(sessionId) {
    try {
      const response = await axios.get(`${API}/payment/status/${sessionId}`, {
        headers: this.getAuthHeaders(),
        withCredentials: true
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to check payment status'
      };
    }
  }

  static isAuthenticated() {
    return !!Cookies.get('access_token');
  }
}