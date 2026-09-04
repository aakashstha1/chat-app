"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` covers the initial "am I already logged in?" check on page
  // load - the app shell waits on this before deciding where to redirect.
  const [loading, setLoading] = useState(true);

  // GET /api/auth/me - relies on the httpOnly cookie, so no params needed.
  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time "am I logged in?" check on mount
    checkAuth();
  }, [checkAuth]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data.user; // not logged in yet - backend requires email verification first
  }, []);

  const verifyEmail = useCallback(async (payload) => {
    const { data } = await api.post("/auth/verify-email", payload);
    setUser(data.user); // this call also sets the login cookie server-side
    return data.user;
  }, []);

  const resendCode = useCallback(async (email) => {
    const { data } = await api.post("/auth/resend-code", { email });
    return data.message;
  }, []);

  const login = useCallback(async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    setUser(data.user);
    return data.user;
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const { data } = await api.post("/auth/google", { credential });
    setUser(data.user);
    return data.user;
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data.message;
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    const { data } = await api.post(`/auth/reset-password/${token}`, { password });
    return data.message;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
  }, []);

  // Lets pages that mutate the user (profile edit) push the new value
  // back into shared state without a full re-fetch round trip.
  const updateLocalUser = useCallback((partial) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    checkAuth,
    register,
    verifyEmail,
    resendCode,
    login,
    googleLogin,
    forgotPassword,
    resetPassword,
    logout,
    updateLocalUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
