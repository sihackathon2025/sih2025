import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import MapComponent from "@/components/MapComponent";
import axios from "@/axiosConfig";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Define TypeScript interfaces for the API data
interface VillageDashboardType {
  id: number;
  village: number; // village ID
  village_name: string;
  district: string;
  state: string;
  total_cases: number;
  total_deaths: number;
  hospitalized_cases: number;
  risk_level: "Very Low" | "Low" | "Moderate" | "High" | "Very High";
  risk_percentage: number;
  latest_rb_alerts: string;
  symptom_distribution: { [key: string]: number };
  severity_distribution: { [key: string]: number };
  monthly_trend: { [key: string]: number };
  last_aggregated_at: string;
  population: number;
  latest_water_assessment_status: string | null;
  latest_water_assessment_date: string | null;
  current_admissions: number;
  critical_cases: number;
  recovered_cases: number;
  completed_campaigns: number;
  ongoing_campaigns: number;
  planned_campaigns: number;
  // Assuming your Village model has lat/lng for the map
  latitude: number;
  longitude: number;
}

interface AlertType {
  id: number;
  title: string;
  message: string;
  created_at: string;
  // severity: "low" | "medium" | "high"; // Removed for mock
  // villages_affected: number[]; // Removed for mock
}

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  // State Management
  const [allVillagesData, setAllVillagesData] = useState<VillageDashboardType[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<number | null>(null);
  const [selectedVillageData, setSelectedVillageData] = useState<VillageDashboardType | null>(null);
  // Mock live alerts for now
  const [liveAlerts, setLiveAlerts] = useState<AlertType[]>([
    { id: 1, title: "High Fever Outbreak", message: "Multiple cases of high fever reported in Village_1. Immediate medical attention required.", created_at: "2025-09-15T10:00:00Z" },
    { id: 2, title: "Water Contamination", message: "Reports of contaminated drinking water in Village_5. Advise residents to boil water.", created_at: "2025-09-14T14:30:00Z" },
    { id: 3, title: "Diarrhea Cases Rising", message: "Increase in diarrhea cases in Village_3. Investigate sanitation conditions.", created_at: "2025-09-13T08:15:00Z" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState("1month");
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [villageSearchTerm, setVillageSearchTerm] = useState("");

  const filteredVillages = useMemo(() => {
    return allVillagesData.filter(village =>
      village.village_name.toLowerCase().includes(villageSearchTerm.toLowerCase())
    );
  }, [allVillagesData, villageSearchTerm]);

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch villages only
        const villagesResponse = await axios.get<VillageDashboardType[]>("/dashboard/villages/");

        setAllVillagesData(villagesResponse.data);
        // setLiveAlerts(alertsResponse.data); // Removed API call for alerts

        // Set the first village as selected by default
        if (villagesResponse.data.length > 0) {
          setSelectedVillageId(villagesResponse.data[0].id);
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load dashboard data. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch detailed data for the selected village whenever its ID changes
  useEffect(() => {
    if (selectedVillageId) {
      const fetchSelectedVillageData = async () => {
        // Find data from the already fetched list first to avoid extra network call
        const existingData = allVillagesData.find(v => v.id === selectedVillageId);
        if (existingData) {
          setSelectedVillageData(existingData);
        } else {
          // Fallback to fetch if not found (optional, but good practice)
          try {
            const response = await axios.get<VillageDashboardType>(`/dashboard/villages/${selectedVillageId}/`);
            setSelectedVillageData(response.data);
          } catch (error) {
            console.error(`Error fetching village ${selectedVillageId} data:`, error);
            setSelectedVillageData(null);
          }
        }
      };
      fetchSelectedVillageData();
    } else {
      setSelectedVillageData(null);
    }
  }, [selectedVillageId, allVillagesData]);

  // --- Derived Data and Helper Functions ---

  // Memoize chart data to prevent recalculations on every render
  const symptomChartData = useMemo(() => {
    if (!selectedVillageData?.symptom_distribution) return [];
    return Object.entries(selectedVillageData.symptom_distribution).map(([name, count]) => ({ name, count }));
  }, [selectedVillageData]);

  const severityPieData = useMemo(() => {
    if (!selectedVillageData?.severity_distribution) return [];
    const colors = { Mild: "#22c55e", Moderate: "#eab308", Severe: "#ef4444" };
    return Object.entries(selectedVillageData.severity_distribution).map(([name, value]) => ({
      name,
      value,
      fill: colors[name as keyof typeof colors] || "#6b7280",
    }));
  }, [selectedVillageData]);

  const monthlyTrendData = useMemo(() => {
    if (!selectedVillageData?.monthly_trend) return [];
    return Object.entries(selectedVillageData.monthly_trend).map(([month, cases]) => ({ month, cases }));
  }, [selectedVillageData]);

  // Filter for high-risk villages
  const highRiskVillages = useMemo(() =>
    allVillagesData.filter(v => v.risk_level === "High" || v.risk_level === "Very High"),
    [allVillagesData]
  );

  const getRiskColor = (riskLevel: string) => {
    const colors: { [key: string]: string } = {
      "Very Low": "#22c55e", "Low": "#84cc16", "Moderate": "#eab308", "High": "#f97316", "Very High": "#ef4444",
    };
    return colors[riskLevel] || "#6b7280";
  };

  const handleVillageSelect = (villageId: number) => {
    setSelectedVillageId(villageId);
  };

  // --- Render Logic ---

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png" alt="India Flag" className="h-8 w-12 object-cover" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Ministry of Development - NER</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="relative">
                    Live Alerts <Badge className="ml-2 bg-red-500">{liveAlerts.length}</Badge>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Live Alerts</DialogTitle>
                    <DialogDescription>Current active alerts requiring immediate attention.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {liveAlerts.length > 0 ? liveAlerts.map((alert) => (
                      <Card key={alert.id}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{alert.title}</CardTitle>
                            {/* <Badge variant={alert.severity === "high" ? "destructive" : "default"}>{alert.severity}</Badge> */}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 mb-2">{alert.message}</p>
                          {/* <p className="text-sm text-gray-500">
                            Villages affected: {alert.villages_affected.map(id => allVillagesData.find(v => v.village === id)?.village_name || `ID ${id}`).join(", ")}
                          </p> */}
                          <p className="text-sm text-gray-500">
                            Created: {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    )) : <p>No active alerts.</p>}
                  </div>
                </DialogContent>
              </Dialog>
              <Button className="bg-green-600 hover:bg-green-700">Send Alert</Button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                <Button variant="ghost" onClick={logout}>Logout</Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Village Map</CardTitle>
                <CardDescription>Click on villages to view detailed health data</CardDescription>
              </CardHeader>
              <CardContent>
                <MapComponent
                  villages={allVillagesData}
                  onVillageSelect={handleVillageSelect}
                  selectedVillageId={selectedVillageId}
                />
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-red-600">Outbreak Villages (High Risk)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {highRiskVillages.length > 0 ? highRiskVillages.map((village) => (
                    <Button
                      key={village.id}
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => handleVillageSelect(village.id)}
                    >
                      {village.village_name} ({village.total_cases} cases)
                    </Button>
                  )) : <p>No high-risk villages at the moment.</p>}
                </div>
              </CardContent>
            </Card>

            {/* View All Villages Button and Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-6 w-full">View All Villages</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>All Villages</DialogTitle>
                  <DialogDescription>Search and select a village to view its dashboard.</DialogDescription>
                </DialogHeader>
                <div className="p-4">
                  <input
                    type="text"
                    placeholder="Search villages..."
                    className="w-full p-2 border border-gray-300 rounded-md mb-4"
                    value={villageSearchTerm}
                    onChange={(e) => setVillageSearchTerm(e.target.value)}
                  />
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {filteredVillages.length > 0 ? filteredVillages.map((village) => (
                      <Button
                        key={village.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          handleVillageSelect(village.id);
                          // Close the dialog after selection
                          // This requires a way to close the dialog, which isn't directly exposed by DialogTrigger
                          // For now, we'll just update the selected village.
                          // A more robust solution would involve controlling the dialog's open state.
                        }}
                      >
                        {village.village_name} ({village.risk_level})
                      </Button>
                    )) : <p>No villages found.</p>}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Panel - Data Analytics */}
          <div className="space-y-6">
            {!selectedVillageData ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Village Selected</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Please select a village from the map or the high-risk list to view its data.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedVillageData.village_name}</CardTitle>
                    <CardDescription>{selectedVillageData.district} | {selectedVillageData.state} | Population: {selectedVillageData.population.toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getRiskColor(selectedVillageData.risk_level) }} />
                      <span className="font-medium capitalize">{selectedVillageData.risk_level} Risk ({selectedVillageData.risk_percentage}%)</span>
                    </div>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger className="mb-4"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1month">Last 1 Month</SelectItem>
                        <SelectItem value="6months">Last 6 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Case Overview</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow><TableCell>Total Cases</TableCell><TableCell className="font-bold">{selectedVillageData.total_cases}</TableCell></TableRow>
                        <TableRow><TableCell>Hospitalized</TableCell><TableCell className="font-bold">{selectedVillageData.hospitalized_cases}</TableCell></TableRow>
                        <TableRow><TableCell>Total Deaths</TableCell><TableCell className="font-bold text-red-600">{selectedVillageData.total_deaths}</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Water Quality</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Latest Assessment:</span>
                        <Badge variant={selectedVillageData.latest_water_assessment_status === "Poor" ? "destructive" : "default"}>
                          {selectedVillageData.latest_water_assessment_status || "N/A"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Tested:</span>
                        <span className="text-sm text-gray-600">{selectedVillageData.latest_water_assessment_date ? new Date(selectedVillageData.latest_water_assessment_date).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Charts & More Info Section - Only render if a village is selected */}
        {selectedVillageData && (
          <>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>Symptom Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={symptomChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Severity Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={severityPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} >
                        {severityPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="cases" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 text-center">
              <Button variant="outline" onClick={() => setShowMoreInfo(!showMoreInfo)}>
                {showMoreInfo ? "Hide More Information" : "Show More Information"}
              </Button>
            </div>

            {showMoreInfo && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Hospitalization Details</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Current Admissions:</span><span className="font-bold">{selectedVillageData.current_admissions}</span></div>
                      <div className="flex justify-between"><span>Critical Cases:</span><span className="font-bold text-red-600">{selectedVillageData.critical_cases}</span></div>
                      <div className="flex justify-between"><span>Recovered:</span><span className="font-bold text-green-600">{selectedVillageData.recovered_cases}</span></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Awareness Campaigns</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Completed:</span><span className="font-bold text-green-600">{selectedVillageData.completed_campaigns}</span></div>
                      <div className="flex justify-between"><span>Ongoing:</span><span className="font-bold text-blue-600">{selectedVillageData.ongoing_campaigns}</span></div>
                      <div className="flex justify-between"><span>Planned:</span><span className="font-bold">{selectedVillageData.planned_campaigns}</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
