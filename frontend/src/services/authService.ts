import { apiRequest } from './api';
import { User } from '../types/index';

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('pyroguard_token', data.token);
    localStorage.setItem('pyroguard_user', JSON.stringify(data.user));
    return data;
  },

  async register(username: string, email: string, password: string, fullName: string, role: string = 'ANALYST'): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, fullName, role }),
    });
    localStorage.setItem('pyroguard_token', data.token);
    localStorage.setItem('pyroguard_user', JSON.stringify(data.user));
    return data;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      localStorage.setItem('pyroguard_user', JSON.stringify(data.user));
      return data.user;
    } catch {
      return null;
    }
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('pyroguard_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('pyroguard_token');
    localStorage.removeItem('pyroguard_user');
  },
};

