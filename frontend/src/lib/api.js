import axios from "axios";

// Backend origin, e.g. http://localhost:5000 (NOT including /api).
export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Single axios instance every request in the app goes through.
// `withCredentials: true` is what makes the browser attach/accept the
// httpOnly "chat_token" cookie the backend sets on login/register.
const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// The backend never sends a body on 401/403 other than { success, message },
// so we normalize every failed request into a plain Error with that message
// - callers can just do `catch (err) { setError(err.message) }` everywhere.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.message || error?.message || "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

// Attachments/avatars come back as relative paths like "/uploads/xyz.png"
// because they're served as static files by the backend, not the frontend.
// This turns any such relative path into an absolute URL to actually load it.
export const resolveUploadUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
};

export default api;
