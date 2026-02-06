import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface LoginResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    userId: string;
    email: string;
    displayName?: string;
    appId?: string;
    isAdmin?: boolean;
  } | null;
}

interface RefreshResponse {
  accessToken: string;
  idToken: string;
  expiresIn: number;
}

interface ApiResponse<T> {
  data: T;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<ApiResponse<LoginResponse>>(`${API_URL}/v1/auth/login`, {
      email,
      password,
    });
    return response.data.data;
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const response = await axios.post<ApiResponse<RefreshResponse>>(`${API_URL}/v1/auth/refresh`, {
      refreshToken,
    });
    return response.data.data;
  },
};
