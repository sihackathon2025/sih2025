// app/ashaDashboard.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, TextInput, Button, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { LogOut, Droplets, AlertTriangle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import LocationSelector from './LocationSelector';
import { useFocusEffect } from '@react-navigation/native';

// --- CONSTANTS FOR PICKERS ---
const SYMPTOM_OPTIONS = ["Fever", "Diarrhea", "Vomiting", "Headache", "Stomach Pain", "Cough", "Cold", "Fatigue", "Nausea", "Skin Rash", "Other"];
const WATER_SOURCE_OPTIONS = ["Well Water", "Borewell Water", "Municipal Water", "Lake", "River", "Other"];

// --- CHILD COMPONENTS ---

const TurbidityCard = () => {
  const { user } = useAuth();
  const [turbidity, setTurbidity] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const getQuality = (value) => {
    if (value < 200) return { label: "Poor", style: styles.severeBadge };
    if (value < 400) return { label: "Moderate", style: styles.moderateBadge };
    return { label: "Good", style: styles.mildBadge };
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Only start fetching if user exists
    if (!user?.user_id) {
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }

    const fetchLatest = async () => {
      // Check if user still exists before making API call
      if (!user?.user_id || !isMountedRef.current) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from("sensor_reading")
          .select("turbidity_reading, created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (isMountedRef.current && user?.user_id) {
          if (!error && data) {
            setTurbidity(data.turbidity_reading);
          } else if (error) {
            console.error("Supabase fetch error:", error.message);
          }
          setLoading(false);
        }
      } catch (error) {
        if (isMountedRef.current && user?.user_id) {
          console.error("Error fetching turbidity:", error);
          setLoading(false);
        }
      }
    };

    fetchLatest();
    intervalRef.current = setInterval(fetchLatest, 50000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.user_id]);

  const quality = turbidity !== null ? getQuality(turbidity) : null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Live Turbidity Reading</Text>
      {loading ? (
        <ActivityIndicator />
      ) : turbidity !== null ? (
        <View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Turbidity (NTU)</Text>
            <Text style={styles.statValue}>{turbidity}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Water Quality</Text>
            <View style={[styles.badgeBase, quality.style]}>
              <Text style={[styles.badgeTextBase, quality.style]}>{quality.label}</Text>
            </View>
          </View>
        </View>
      ) : (
        <Text style={{color: 'red'}}>No data available</Text>
      )}
    </View>
  );
};

const StatisticsCard = ({ stats, filter, onFilterChange }) => {
    return (
      <View style={styles.card}>
          <View style={styles.statRow}>
              <Text style={styles.cardTitle}>Statistics</Text>
              <View style={styles.pickerContainerSmall}>
                  <Picker selectedValue={filter} onValueChange={onFilterChange} itemStyle={{height: 40}}>
                      <Picker.Item label="This Week" value="weekly" />
                      <Picker.Item label="This Month" value="monthly" />
                      <Picker.Item label="6 Months" value="6months" />
                      <Picker.Item label="Total" value="total" />
                  </Picker>
              </View>
          </View>
          {Object.entries(stats).filter(([, count]) => count > 0).length > 0 ? (
            Object.entries(stats).filter(([, count]) => count > 0).map(([disease, count]) => (
                <View key={disease} style={styles.statRow}>
                    <Text style={styles.statLabel}>{disease}</Text>
                    <Text style={styles.statValue}>{count}</Text>
                </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No cases reported for this period.</Text>
          )}
      </View>
    );
  };
  
const QuickSummaryCard = ({ reports }) => {
    const safeReports = reports || [];
    const severeCases = safeReports.filter(r => r?.severity === "Severe").length;
    const thisWeek = safeReports.filter(r => {
        try {
          const reportDate = new Date(r.date_of_reporting);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return reportDate >= weekAgo;
        } catch {
          return false;
        }
    }).length;

    return (
        <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Summary</Text>
        <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Reports</Text>
            <Text style={styles.statValue}>{safeReports.length}</Text>
        </View>
        <View style={styles.statRow}>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>{thisWeek}</Text>
        </View>
        <View style={styles.statRow}>
            <Text style={styles.statLabel}>Severe Cases</Text>
            <Text style={[styles.statValue, {color: '#b91c1c'}]}>{severeCases}</Text>
        </View>
        </View>
    );
};

const NewReportModal = ({ visible, onClose, onSubmit }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [newReport, setNewReport] = useState({
        patient_name: "", age: "", gender: "", symptoms: "",
        severity: "", water_source: "", treatment_given: "",
        state: "", district: "", village: "",
    });

    // Reset form when modal opens and update location from user
    useEffect(() => {
        if (visible && user) {
            setNewReport(prev => ({
                ...prev,
                state: user?.state || "",
                district: user?.district || "",
                village: user?.village || "",
            }));
        }
    }, [visible, user]);

    const handleSubmit = async () => {
        if (!user) {
            Toast.show({type: 'error', text1: 'Please login to submit reports.'});
            onClose();
            return;
        }

        if (!newReport.patient_name || !newReport.symptoms || !newReport.severity) {
            Toast.show({type: 'error', text1: 'Please fill all required fields.'});
            return;
        }
        
        setLoading(true);
        
        try {
            const reportData = {
                ...newReport,
                age: parseInt(newReport.age) || 0,
                asha_worker_id: user?.user_id,
                village_id: user?.village_id || 1, 
                date_of_reporting: new Date().toISOString().split("T")[0],
            };

            await onSubmit(reportData);
            
            // Reset form after successful submission
            if (user) {
              setNewReport({
                  patient_name: "", age: "", gender: "", symptoms: "",
                  severity: "", water_source: "", treatment_given: "",
                  state: user?.state || "", 
                  district: user?.district || "",
                  village: user?.village || "",
              });
            }
            
            onClose(); 
        } catch (error) {
            console.error("Error in handleSubmit:", error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{flex: 1}}>
                <ScrollView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Submit New Health Report</Text>
                    
                    <Text style={styles.label}>Patient Name *</Text>
                    <TextInput 
                      style={styles.input} 
                      value={newReport.patient_name} 
                      onChangeText={(text) => setNewReport({...newReport, patient_name: text})} 
                    />
                    
                    <Text style={styles.label}>Age</Text>
                    <TextInput 
                      style={styles.input} 
                      value={newReport.age} 
                      onChangeText={(text) => setNewReport({...newReport, age: text})} 
                      keyboardType="numeric" 
                    />
                    
                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.pickerContainer}>
                        <Picker 
                          selectedValue={newReport.gender} 
                          onValueChange={(val) => setNewReport({...newReport, gender: val})}
                        >
                            <Picker.Item label="Select Gender" value="" />
                            <Picker.Item label="Male" value="Male" />
                            <Picker.Item label="Female" value="Female" />
                            <Picker.Item label="Other" value="Other" />
                        </Picker>
                    </View>

                    <LocationSelector 
                        state={newReport.state}
                        district={newReport.district}
                        village={newReport.village}
                        onChange={(field, value) => setNewReport(prev => ({...prev, [field]: value}))}
                    />
                    
                    <Text style={styles.label}>Symptoms *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker 
                          selectedValue={newReport.symptoms} 
                          onValueChange={(val) => setNewReport({...newReport, symptoms: val})}
                        >
                            <Picker.Item label="Select a symptom" value="" />
                            {SYMPTOM_OPTIONS.map(symptom => (
                              <Picker.Item key={symptom} label={symptom} value={symptom} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Severity *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker 
                          selectedValue={newReport.severity} 
                          onValueChange={(val) => setNewReport({...newReport, severity: val})}
                        >
                            <Picker.Item label="Select Severity" value="" />
                            <Picker.Item label="Mild" value="Mild" />
                            <Picker.Item label="Moderate" value="Moderate" />
                            <Picker.Item label="Severe" value="Severe" />
                        </Picker>
                    </View>

                    <Text style={styles.label}>Water Source</Text>
                    <View style={styles.pickerContainer}>
                        <Picker 
                          selectedValue={newReport.water_source} 
                          onValueChange={(val) => setNewReport({...newReport, water_source: val})}
                        >
                            <Picker.Item label="Select water source" value="" />
                            {WATER_SOURCE_OPTIONS.map(source => (
                              <Picker.Item key={source} label={source} value={source} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Treatment Given</Text>
                    <TextInput 
                      style={[styles.input, {height: 100, textAlignVertical: 'top'}]} 
                      multiline 
                      value={newReport.treatment_given} 
                      onChangeText={(text) => setNewReport({...newReport, treatment_given: text})} 
                    />

                    <View style={{marginVertical: 20}}>
                        <TouchableOpacity 
                          style={[styles.button, styles.submitButton]} 
                          onPress={handleSubmit} 
                          disabled={loading}
                        >
                            {loading ? (
                              <ActivityIndicator color="white" /> 
                            ) : (
                              <Text style={styles.buttonText}>Submit Report</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    <Button title="Cancel" onPress={onClose} color="gray" />
                    <View style={{height: 50}} />
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// --- MAIN DASHBOARD SCREEN ---

const AshaWorkerDashboard = () => {
  const { user, logout, isLoading: authLoading, isAuthenticated } = useAuth();
  const [showNewReport, setShowNewReport] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [workerReports, setWorkerReports] = useState([]);
  const [statsFilter, setStatsFilter] = useState("weekly");
  const [diseaseStats, setDiseaseStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const isMountedRef = useRef(true);
  const fetchAbortControllerRef = useRef(null);

  // Set mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cancel any ongoing fetch operations
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle back button to prevent crashes
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showNewReport) {
          setShowNewReport(false);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showNewReport])
  );

  const fetchReports = async () => {
    if (!user?.user_id || loading || !isMountedRef.current || !isAuthenticated) {
      return;
    }
    
    // Cancel previous request if still ongoing
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
    }
    
    setLoading(true);
    fetchAbortControllerRef.current = new AbortController();
    
    try {
      const response = await api.get(`/data_collection/aasha_worker_reports/`, {
        params: { asha_worker_id: user.user_id, reportPeriod },
        signal: fetchAbortControllerRef.current.signal
      });
      
      if (isMountedRef.current && user?.user_id && isAuthenticated) {
        setWorkerReports(response.data.reports || []);
      }
    } catch (error) {
      if (error.name === 'CanceledError') {
        console.log("Reports fetch was cancelled");
        return;
      }
      
      console.error("Error fetching reports:", error);
      if (isMountedRef.current && user?.user_id && isAuthenticated) {
        Toast.show({type: 'error', text1: 'Could not fetch reports'});
        setWorkerReports([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchStats = async () => {
    if (!user?.user_id || !isMountedRef.current || !isAuthenticated) {
      return;
    }
    
    try {
      const response = await api.get(`/data_collection/disease_stats/`, {
        params: { asha_worker_id: user.user_id, filter: statsFilter },
      });
      
      if (isMountedRef.current && user?.user_id && isAuthenticated) {
        setDiseaseStats(response.data.disease_counts || {});
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      if (isMountedRef.current && user?.user_id && isAuthenticated) {
        setDiseaseStats({});
      }
    }
  };

  // Reset state when user changes or logs out
  useEffect(() => {
    if (user?.user_id && isAuthenticated && isMountedRef.current) {
      setWorkerReports([]);
      setDiseaseStats({});
      setReportPeriod("weekly");
      setStatsFilter("weekly");
    } else if (!user && !isAuthenticated) {
      // Clear data when user logs out
      setWorkerReports([]);
      setDiseaseStats({});
    }
  }, [user?.user_id, isAuthenticated]);

  useEffect(() => {
    if (user?.user_id && isAuthenticated && isMountedRef.current) {
      fetchReports();
    }
  }, [reportPeriod, user?.user_id, isAuthenticated]);

  useEffect(() => {
    if (user?.user_id && isAuthenticated && isMountedRef.current) {
      fetchStats();
    }
  }, [statsFilter, user?.user_id, isAuthenticated]);

  const handleSubmitReport = async (reportData) => {
    if (!user || !isAuthenticated) {
      Toast.show({type: 'error', text1: 'Please login to submit reports.'});
      return;
    }

    try {
      await api.post(`/data_collection/health-reports/`, reportData);
      Toast.show({type: 'success', text1: 'Report submitted successfully!'});
      
      // Only refetch if component is still mounted and user is still authenticated
      if (isMountedRef.current && user?.user_id && isAuthenticated) {
        fetchReports();
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      Toast.show({type: 'error', text1: 'Failed to submit report.'});
    }
  };

  const handleLogout = async () => {
    if (logoutLoading) return;

    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            setLogoutLoading(true);
            
            try {
              // Close any open modals first
              setShowNewReport(false);
              
              // Clear local state immediately
              setWorkerReports([]);
              setDiseaseStats({});
              
              // Cancel any ongoing requests
              if (fetchAbortControllerRef.current) {
                fetchAbortControllerRef.current.abort();
              }
              
              // Perform logout
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
            } finally {
              // Reset loading state after delay
              setTimeout(() => {
                if (isMountedRef.current) {
                  setLogoutLoading(false);
                }
              }, 1000);
            }
          }
        }
      ]
    );
  };
  
  const getSeverityStyle = (severity) => {
    if (severity === "Severe") return styles.severeBadge;
    if (severity === "Moderate") return styles.moderateBadge;
    return styles.mildBadge;
  };

  // Show loading if auth is loading
  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
          <ActivityIndicator size="large" />
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show message if no user or not authenticated
  if (!user || !isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
          <Text>Please log in to view dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>ASHA Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome, {user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity 
            onPress={handleLogout} 
            style={styles.logoutButton}
            disabled={logoutLoading}
          >
            {logoutLoading ? (
              <ActivityIndicator size={22} color="#b91c1c" />
            ) : (
              <LogOut size={22} color="#b91c1c" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>🚨 High contamination levels detected. Immediate action required.</Text>
        </View>
        
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Survey Report</Text>
            <Text style={styles.cardDescription}>View and manage your health reports</Text>
            
            <View style={styles.controlsContainer}>
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={[styles.filterButton, reportPeriod === 'weekly' && styles.activeFilter]}
                  onPress={() => setReportPeriod('weekly')}
                  disabled={loading}
                >
                  <Text style={[styles.filterText, reportPeriod === 'weekly' && styles.activeFilterText]}>Weekly</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, reportPeriod === 'monthly' && styles.activeFilter]}
                  onPress={() => setReportPeriod('monthly')}
                  disabled={loading}
                >
                  <Text style={[styles.filterText, reportPeriod === 'monthly' && styles.activeFilterText]}>Monthly</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.button, styles.submitButton]} 
                onPress={() => setShowNewReport(true)}
                disabled={!user || !isAuthenticated || loading}
              >
                  <Text style={styles.buttonText}>New Report</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator style={{padding: 20}} />
            ) : (
              <ScrollView horizontal>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeadText, {width: 90}]}>Date</Text>
                    <Text style={[styles.tableHeadText, {width: 120}]}>Patient</Text>
                    <Text style={[styles.tableHeadText, {width: 40}]}>Age</Text>
                    <Text style={[styles.tableHeadText, {width: 150}]}>Symptoms</Text>
                    <Text style={[styles.tableHeadText, {width: 90}]}>Severity</Text>
                    <Text style={[styles.tableHeadText, {width: 120}]}>Water Source</Text>
                  </View>
                  {workerReports.length > 0 ? workerReports.map((report, index) => (
                    <View key={`${report.id || index}-${report.date_of_reporting || index}`} style={styles.tableRow}>
                      <Text style={[styles.tableCell, {width: 90}]}>{report.date_of_reporting || 'N/A'}</Text>
                      <Text style={[styles.tableCell, {width: 120}]}>{report.patient_name || 'N/A'}</Text>
                      <Text style={[styles.tableCell, {width: 40, textAlign: 'center'}]}>{report.age || 0}</Text>
                      <Text style={[styles.tableCell, {width: 150}]}>{report.symptoms || 'N/A'}</Text>
                      <View style={[styles.tableCell, {width: 90}]}>
                        <View style={[styles.badgeBase, getSeverityStyle(report.severity)]}>
                          <Text style={[styles.badgeTextBase, getSeverityStyle(report.severity)]}>
                            {report.severity || 'N/A'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tableCell, {width: 120}]}>{report.water_source || 'N/A'}</Text>
                    </View>
                  )) : (
                    <Text style={styles.noReportsText}>No reports found for this period.</Text>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
          
          <TurbidityCard />
          <StatisticsCard stats={diseaseStats} filter={statsFilter} onFilterChange={setStatsFilter} />
          <QuickSummaryCard reports={workerReports} />
          
          <View style={styles.card}>
              <Text style={styles.cardTitle}>Send Alerts</Text>
              <Text style={styles.cardDescription}>Report critical issues to the Ministry</Text>
              <TouchableOpacity 
                style={[styles.button, styles.alertButton]} 
                onPress={() => Toast.show({type:'info', text1: 'Water Alert Sent!'})}
                disabled={!user || !isAuthenticated}
              >
                  <Droplets size={16} color="white" style={{marginRight: 8}} />
                  <Text style={styles.buttonText}>Send Water Contamination Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.alertButton, {marginTop: 10}]} 
                onPress={() => Toast.show({type:'info', text1: 'Outbreak Alert Sent!'})}
                disabled={!user || !isAuthenticated}
              >
                  <AlertTriangle size={16} color="white" style={{marginRight: 8}} />
                  <Text style={styles.buttonText}>Send Disease Outbreak Alert</Text>
              </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <NewReportModal 
        visible={showNewReport} 
        onClose={() => setShowNewReport(false)} 
        onSubmit={handleSubmitReport} 
      />
    </SafeAreaView>
  );
};

// --- STYLESHEET ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 16 },
  header: { paddingVertical: 16, paddingHorizontal: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, color: '#6b7280' },
  logoutButton: { padding: 8 },
  alertBanner: { backgroundColor: '#dc2626', padding: 12 },
  alertText: { color: 'white', fontWeight: '500', textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardDescription: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  filterContainer: { flexDirection: 'row' },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', marginRight: 10 },
  filterText: { fontWeight: '500' },
  activeFilter: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  activeFilterText: { color: 'white' },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  submitButton: { backgroundColor: '#16a34a', paddingHorizontal: 16 },
  alertButton: { backgroundColor: '#ef4444' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#e5e7eb', paddingBottom: 8, marginBottom: 8 },
  tableHeadText: { fontWeight: 'bold', color: '#6b7280', fontSize: 12 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  tableCell: { color: '#374151', fontSize: 12, paddingRight: 10 },
  badgeBase: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, alignItems: 'center' },
  badgeTextBase: { fontSize: 12, fontWeight: '600' },
  mildBadge: { backgroundColor: '#dcfce7', color: '#166534' },
  moderateBadge: { backgroundColor: '#fef3c7', color: '#854d0e' },
  severeBadge: { backgroundColor: '#fee2e2', color: '#991b1b' },
  noReportsText: { textAlign: 'center', color: '#6b7280', paddingVertical: 20 },
  noDataText: { textAlign: 'center', color: '#6b7280', paddingVertical: 10 },
  modalContainer: { padding: 16 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { height: 48, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, justifyContent: 'center' },
  pickerContainerSmall: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, height: 40, width: 120, justifyContent: 'center' },
  placeholder: { padding: 20, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#9ca3af' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  statLabel: { color: '#4b5563'},
  statValue: { fontWeight: 'bold', fontSize: 16 },
});

export default AshaWorkerDashboard;