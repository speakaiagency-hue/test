export interface User {
  id: string;
  email: string;
  name: string;
  status: "active" | "inactive";
}

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem("authToken");
  } catch {
    return null;
  }
};

export const getUser = (): User | null => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string, user: User) => {
  localStorage.setItem("authToken", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken() && !!getUser();
};

export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
