import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthContext";
import { mockVillages } from "@/lib/mockData";
import { toast } from "sonner";

const Landing = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    village_id: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(loginForm.email, loginForm.password);
      if (success) {
        toast.success("Login successful!");
        setIsLoginOpen(false);
        // Navigation will be handled by App.tsx based on user role
      } else {
        toast.error(
          "Invalid credentials. Try admin@mdoner.gov.in with any password.",
        );
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!selectedRole || !registerForm.village_id) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const success = await register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        role: selectedRole as "asha_worker" | "ngo" | "clinic",
        village_id: parseInt(registerForm.village_id),
      });

      if (success) {
        toast.success("Registration successful!");
        setIsRegisterOpen(false);
        // Navigation will be handled by App.tsx based on user role
      } else {
        toast.error("Registration failed. Email may already exist.");
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "asha_worker":
        return "ASHA Worker";
      case "ngo":
        return "NGO";
      case "clinic":
        return "Clinic";
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b-4 border-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png"
                alt="India Flag"
                className="h-8 w-12 object-cover"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  Ministry of Development
                </h1>
                <p className="text-sm text-blue-600 font-semibold">
                  NORTH EASTERN REGION
                </p>
              </div>
            </div>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Home
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                About
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Cultural Pattern Border */}
            <div
              className="mb-8 p-6 border-4 border-green-200 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg max-w-4xl mx-auto"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23059669' fill-opacity='0.05'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v-40c11.046 0 20 8.954 20 20z'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Health Surveillance Portal
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-700 mb-2 font-semibold">
                Ministry of Development of North Eastern Region
              </p>

              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Facilitating health reporting, disease monitoring, and alert
                dissemination for ASHA Workers, NGOs, Clinics, and Ministry
                Administrators
              </p>

              {/* Cultural Elements */}
              <div className="flex justify-center items-center space-x-8 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">🏔️</span>
                  </div>
                  <p className="text-sm text-gray-600">Northeast Hills</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">🌊</span>
                  </div>
                  <p className="text-sm text-gray-600">River Systems</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">🎋</span>
                  </div>
                  <p className="text-sm text-gray-600">Bamboo Heritage</p>
                </div>
              </div>

              {/* Main Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 text-xl font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      Register
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Register for Health Portal</DialogTitle>
                      <DialogDescription>
                        Choose your role and fill in your details to get
                        started.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <Label htmlFor="role">Select Role</Label>
                        <Select
                          value={selectedRole}
                          onValueChange={setSelectedRole}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asha_worker">
                              ASHA Worker
                            </SelectItem>
                            <SelectItem value="ngo">NGO</SelectItem>
                            <SelectItem value="clinic">Clinic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="name">
                          {selectedRole === "asha_worker"
                            ? "Name"
                            : selectedRole === "ngo"
                              ? "NGO Name"
                              : selectedRole === "clinic"
                                ? "Clinic Name"
                                : "Name"}
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={registerForm.name}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="village">Village</Label>
                        <Select
                          value={registerForm.village_id}
                          onValueChange={(value) =>
                            setRegisterForm({
                              ...registerForm,
                              village_id: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select village" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockVillages.map((village) => (
                              <SelectItem
                                key={village.village_id}
                                value={village.village_id.toString()}
                              >
                                {village.village_name}, {village.state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={registerForm.email}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={registerForm.password}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={registerForm.confirmPassword}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? "Registering..." : "Register"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-12 py-4 text-xl font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      Login
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Login to Health Portal</DialogTitle>
                      <DialogDescription>
                        Enter your credentials to access your dashboard.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="loginEmail">Email</Label>
                        <Input
                          id="loginEmail"
                          type="email"
                          value={loginForm.email}
                          onChange={(e) =>
                            setLoginForm({
                              ...loginForm,
                              email: e.target.value,
                            })
                          }
                          placeholder="admin@mdoner.gov.in"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="loginPassword">Password</Label>
                        <Input
                          id="loginPassword"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) =>
                            setLoginForm({
                              ...loginForm,
                              password: e.target.value,
                            })
                          }
                          placeholder="Enter any password"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? "Logging in..." : "Login"}
                      </Button>

                      <div className="text-sm text-gray-600 text-center">
                        <p>Demo credentials:</p>
                        <p>
                          <strong>Admin:</strong> admin@mdoner.gov.in
                        </p>
                        <p>
                          <strong>ASHA:</strong> priya.asha@gmail.com
                        </p>
                        <p>
                          <strong>NGO:</strong> contact@nehealthngo.org
                        </p>
                        <p>
                          <strong>Clinic:</strong> info@kohimamedical.com
                        </p>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg font-semibold mb-2">
            Ministry of Development of North Eastern Region
          </p>
          <p className="text-gray-300">Government of India</p>
          <div className="mt-4 flex justify-center space-x-8 text-sm">
            <span>🏔️ Arunachal Pradesh</span>
            <span>🌿 Assam</span>
            <span>🎭 Manipur</span>
            <span>☁️ Meghalaya</span>
            <span>🏞️ Mizoram</span>
            <span>🌄 Nagaland</span>
            <span>🏔️ Sikkim</span>
            <span>🌊 Tripura</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
