import React, { createContext, useContext, useState, useEffect } from "react";
import { mockUsers, User } from "@/lib/mockData";

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
  role: "asha_worker" | "ngo" | "clinic";
  village_id: number;
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
    // Check for stored user session
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Find user in mock data
    const foundUser = mockUsers.find((u) => u.email === email);

    if (foundUser) {
      // In a real app, you'd verify the password hash
      // For demo purposes, we'll accept any password
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
      return true;
    }

    return false;
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if email already exists
    const existingUser = mockUsers.find((u) => u.email === userData.email);
    if (existingUser) {
      return false;
    }

    // Create new user
    const newUser: User = {
      user_id: mockUsers.length + 1,
      name: userData.name,
      role: userData.role,
      email: userData.email,
      village_id: userData.village_id,
      created_at: new Date().toISOString().split("T")[0],
    };

    // Add to mock users (in real app, this would be sent to backend)
    mockUsers.push(newUser);

    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("currentUser", JSON.stringify(newUser));

    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
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
