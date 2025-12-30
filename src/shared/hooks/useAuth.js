/**
 * useAuth Hook
 * Custom hook for authentication state management
 */
import { useState, useEffect, useCallback } from "react";
import { authAPI } from "../../api";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      setUser(response.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(credentials);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Đăng nhập thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.register(userData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Đăng ký thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    checkAuth,
  };
};

export default useAuth;
