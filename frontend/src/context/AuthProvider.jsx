import React, { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import API from "../api/axios";

export const AuthProvider = ({ children }) => {
  const isTokenExpired = (token) => {
    try {
      const [, payload] = token.split(".");
      const decoded = JSON.parse(atob(payload));
      const expMs = decoded.exp * 1000;
      return Date.now() >= expMs;
    } catch {
      return true;
    }
  };

  const scheduleTokenWatcher = (token) => {
    if (!token) return null;

    try {
      const [, payload] = token.split(".");
      const decoded = JSON.parse(atob(payload));
      const expMs = decoded.exp * 1000;
      const now = Date.now();
      const timeout = Math.max(expMs - now, 0);

      return setTimeout(() => {
        logout();
      }, timeout);
    } catch {
      return null;
    }
  };

  const [auth, setAuth] = useState(() => {
    const savedAuth = localStorage.getItem("auth");
    try {
      if (!savedAuth) return null;
      const parsed = JSON.parse(savedAuth);
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        localStorage.clear();
        return null;
      }
      return parsed;
    } catch (err) {
      console.log(err);
      return null;
    }
  });
  const [logoutTimer, setLogoutTimer] = useState(null);

  const login = async (email, password, role, classAssigned) => {
    try {
      const payload = {
        email,
        password,
        role: role?.toLowerCase(),
      };

      if (payload.role === "student") {
        payload.classAssigned = classAssigned;
      }

      const { data } = await API.post("/auth/login", payload);
      const userData = { ...data.user, token: data.token };

      if (isTokenExpired(data.token)) {
        return { success: false, message: "Session expired, please login again." };
      }

      setAuth(userData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("auth", JSON.stringify(userData));
      if (logoutTimer) clearTimeout(logoutTimer);
      const timerId = scheduleTokenWatcher(data.token);
      setLogoutTimer(timerId);

      return { success: true };
    } catch (error) {
      const isInvalidCredentials = error.response?.status === 401;

      return {
        success: false,
        message: isInvalidCredentials
          ? "Invalid email or incorrect password"
          : error.response?.data?.msg || "Login Failed",
      };
    }
  };

  const register = async (
    name,
    email,
    password,
    role,
    classAssigned,
    teacherSubject,
  ) => {
    try {
      const payload = {
        name,
        email,
        password,
        role,
      };

      if (role === "student") {
        payload.classAssigned = classAssigned;
      }

      if (role === "teacher") {
        payload.teacherSubject = teacherSubject;
      }

      const { data } = await API.post("/auth/register", payload);

      return { success: true, message: data.msg };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.msg || "Registration Failed",
      };
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.clear();
    if (logoutTimer) clearTimeout(logoutTimer);
    window.location.href = "/login";
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !isTokenExpired(token)) {
      const timerId = scheduleTokenWatcher(token);
      setLogoutTimer(timerId);
    }

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = false;

  return (
    <AuthContext.Provider value={{ auth, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
