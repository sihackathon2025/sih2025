import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/lib/mockData"; // Keep User interface, remove mockUsers
import api from "@/axiosConfig";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "admin" | "asha_worker" | "ngo" | "clinic"; // Added admin role for registration
  village_id?: number; // Made optional as admin might not have one
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    const storedToken = localStorage.getItem("authToken");
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post(`/users/login/`, {
        email,
        password,
      });

      const { access, refresh, user } = response.data; // Assuming your backend returns access, refresh tokens and user data

      localStorage.setItem("authToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("currentUser", JSON.stringify(user));

      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      setUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await api.post(`/register/`, userData);
      const { access, refresh, user } = response.data;

      localStorage.setItem("authToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("currentUser", JSON.stringify(user));

      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      setUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
