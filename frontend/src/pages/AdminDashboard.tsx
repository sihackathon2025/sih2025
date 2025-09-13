import React, { useState } from "react";
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
import {
  mockVillages,
  mockAlerts,
  mockHealthReports,
  Village,
  getVillageById,
  getRiskColor,
} from "@/lib/mockData";
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

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [selectedVillage, setSelectedVillage] = useState<Village>(
    mockVillages[0],
  );
  const [timeFilter, setTimeFilter] = useState("1month");
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const handleVillageSelect = (village: Village) => {
    setSelectedVillage(village);
  };

  const getVillageReports = (villageId: number) => {
    return mockHealthReports.filter(
      (report) => report.village_id === villageId,
    );
  };

  const getSymptomDistribution = (villageId: number) => {
    const reports = getVillageReports(villageId);
    const symptoms: { [key: string]: number } = {};

    reports.forEach((report) => {
      const symptomList = report.symptoms.split(", ");
      symptomList.forEach((symptom) => {
        symptoms[symptom] = (symptoms[symptom] || 0) + 1;
      });
    });

    return Object.entries(symptoms).map(([symptom, count]) => ({
      symptom,
      count,
    }));
  };

  const getHighRiskVillages = () => {
    return mockVillages.filter((village) => village.risk_level === "high");
  };

  const chartData = getSymptomDistribution(selectedVillage.village_id);
  const pieData = [
    { name: "Mild", value: 40, color: "#22c55e" },
    { name: "Moderate", value: 35, color: "#eab308" },
    { name: "Severe", value: 25, color: "#ef4444" },
  ];

  const trendData = [
    { month: "Jan", cases: 12 },
    { month: "Feb", cases: 19 },
    { month: "Mar", cases: 15 },
    { month: "Apr", cases: 22 },
    { month: "May", cases: 18 },
    { month: "Jun", cases: selectedVillage.total_cases },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png"
                alt="India Flag"
                className="h-8 w-12 object-cover"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Ministry of Development - NER
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Alert Buttons */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="relative">
                    Live Alerts
                    <Badge className="ml-2 bg-red-500">
                      {mockAlerts.length}
                    </Badge>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Live Alerts (Last 7 Days)</DialogTitle>
                    <DialogDescription>
                      Current active alerts requiring immediate attention
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {mockAlerts.map((alert) => (
                      <Card key={alert.alert_id}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">
                              {alert.title}
                            </CardTitle>
                            <Badge
                              variant={
                                alert.severity === "high"
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 mb-2">{alert.message}</p>
                          <p className="text-sm text-gray-500">
                            Villages affected:{" "}
                            {alert.villages_affected
                              .map((id) => getVillageById(id)?.village_name)
                              .join(", ")}
                          </p>
                          <p className="text-sm text-gray-500">
                            Created: {alert.created_at}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline">Sent Alerts</Button>
              <Button className="bg-green-600 hover:bg-green-700">
                Send Alert
              </Button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Welcome, {user?.name}
                </span>
                <Button variant="ghost" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Village Map</CardTitle>
                <CardDescription>
                  Click on villages to view detailed health data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MapComponent
                  onVillageSelect={handleVillageSelect}
                  selectedVillage={selectedVillage}
                />
              </CardContent>
            </Card>

            {/* High Risk Villages */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-red-600">
                  Outbreak Villages (High Risk)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {getHighRiskVillages().map((village) => (
                    <Button
                      key={village.village_id}
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => setSelectedVillage(village)}
                    >
                      {village.village_name} ({village.total_cases} cases)
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Data Analytics */}
          <div className="space-y-6">
            {/* Village Details */}
            <Card>
              <CardHeader>
                <CardTitle>{selectedVillage.village_name}</CardTitle>
                <CardDescription>
                  {selectedVillage.district} | {selectedVillage.state} |
                  Population: ~50,000
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: getRiskColor(selectedVillage.risk_level),
                    }}
                  />
                  <span className="font-medium capitalize">
                    {selectedVillage.risk_level} Risk
                  </span>
                </div>

                {/* Time Filter */}
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="mb-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="1month">1 Month (Default)</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Case Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Case Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Reported Cases</TableCell>
                      <TableCell className="font-bold">
                        {selectedVillage.total_cases}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Deaths</TableCell>
                      <TableCell className="font-bold text-red-600">
                        2
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Case Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Disease Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disease/Symptom</TableHead>
                      <TableHead>Cases</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.symptom}</TableCell>
                        <TableCell className="font-bold">
                          {item.count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Water Quality */}
            <Card>
              <CardHeader>
                <CardTitle>Water Quality Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Latest Assessment:</span>
                    <Badge variant="destructive">Poor</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Tested:</span>
                    <span className="text-sm text-gray-600">2024-09-08</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts Section */}
        {selectedVillage && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Symptom Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="symptom" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="cases"
                      stroke="#22c55e"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

        { /* More Information Section */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => setShowMoreInfo(!showMoreInfo)}
          >
            {showMoreInfo ? "Hide" : "More Information"}
          </Button>  
        </div>

        {showMoreInfo && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hospitalized Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Admissions:</span>
                    <span className="font-bold">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Critical Cases:</span>
                    <span className="font-bold text-red-600">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recovered:</span>
                    <span className="font-bold text-green-600">15</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Awareness Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-bold text-green-600">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongoing:</span>
                    <span className="font-bold text-blue-600">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Planned:</span>
                    <span className="font-bold">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
