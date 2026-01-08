import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";

// Alias for backward compatibility
const API_BASE_URL = API_URL;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/profile`, {
          withCredentials: true,
        });
        // Unwrap API response (backend wraps in { success: true, data: {...} })
        const userData = response.data.data || response.data;
        setUser(userData);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          // Token không tồn tại hoặc hết hạn
          setUser(null);
          // Xóa thông tin user khỏi localStorage nếu có
          localStorage.removeItem("user");
          localStorage.removeItem("rememberedUser");
        } else if (err.code !== "ERR_NETWORK") {
          // Chỉ log lỗi nếu không phải lỗi network thông thường
          console.error("Lỗi khi kiểm tra xác thực:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username, password, remember) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { username, password, remember },
        { withCredentials: true }
      );

      // eslint-disable-next-line no-unused-vars
      const { user: userData, token: _token } = response.data;

      // Set user data từ login response
      setUser(userData);

      // Lưu thông tin user vào localStorage nếu remember = true
      if (remember) {
        localStorage.setItem("user", JSON.stringify(userData));
      }

      // Sau khi login thành công, gọi lại profile để sync đầy đủ data
      try {
        const profileResponse = await axios.get(
          `${API_BASE_URL}/users/profile`,
          { withCredentials: true }
        );
        // Unwrap API response
        const fullProfile = profileResponse.data.data || profileResponse.data;
        setUser(fullProfile);
      } catch (profileErr) {
        // Nếu không load được profile đầy đủ, vẫn giữ userData từ login response
        // nhưng không log warning nữa
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Có lỗi xảy ra khi đăng nhập",
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
      setUser(null);
      localStorage.removeItem("user");
      navigate("/login");
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { state: { from: window.location.pathname } });
    }
    if (!loading && requiredRole && user?.role !== requiredRole) {
      navigate("/");
    }
  }, [user, loading, navigate, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return children;
};

export default AuthContext;
