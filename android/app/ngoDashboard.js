// app/ngoDashboard.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, TextInput, Switch, Alert, RefreshControl, BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';
import { Picker } from '@react-native-picker/picker';
import { LogOut, PlusCircle, AlertTriangle, Droplets, BarChart3, Users, MapPin, TrendingUp } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

// --- CHILD COMPONENTS ---

const StatCard = ({ icon, label, value, color = '#3b82f6', loading = false }) => (
  <View style={[styles.statCard, { backgroundColor: `${color}15` }]}>
    <View style={styles.statIconContainer}>
      {icon}
    </View>
    {loading ? (
      <ActivityIndicator size="small" color={color} />
    ) : (
      <Text style={[styles.statValue, { color }]}>{value || 0}</Text>
    )}
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

Card.Header = ({ children }) => <View style={styles.cardHeader}>{children}</View>;
Card.Title = ({ children }) => <Text style={styles.cardTitle}>{children}</Text>;
Card.Description = ({ children }) => <Text style={styles.cardDescription}>{children}</Text>;
Card.Content = ({ children }) => <View style={styles.cardContent}>{children}</View>;

const VillageDataTable = ({ surveyedData, loading }) => {
  const getAlertBadgeStyle = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
      case 'severe':
        return styles.severeBadge;
      case 'medium':
      case 'moderate':
        return styles.moderateBadge;
      default:
        return styles.mildBadge;
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ padding: 20 }} color="#3b82f6" />;
  }

  if (!surveyedData || surveyedData.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MapPin size={48} color="#9ca3af" />
        <Text style={styles.emptyStateText}>No survey data available</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.tableContainer}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableHeader, { width: 120 }]}>Village</Text>
          <Text style={[styles.tableHeader, { width: 80 }]}>Clean Water</Text>
          <Text style={[styles.tableHeader, { width: 80 }]}>Toilet %</Text>
          <Text style={[styles.tableHeader, { width: 80 }]}>Flooding</Text>
          <Text style={[styles.tableHeader, { width: 70 }]}>Typhoid</Text>
          <Text style={[styles.tableHeader, { width: 70 }]}>Fever</Text>
          <Text style={[styles.tableHeader, { width: 70 }]}>Diarrhea</Text>
          <Text style={[styles.tableHeader, { width: 90 }]}>Alert Level</Text>
        </View>
        
        {/* Table Body */}
        {surveyedData.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: 120, fontWeight: '600' }]}>
              {item.village_name || 'Unknown'}
            </Text>
            <Text style={[styles.tableCell, { width: 80 }]}>
              {item.clean_drinking_water ? 'Yes' : 'No'}
            </Text>
            <Text style={[styles.tableCell, { width: 80 }]}>
              {item.toilet_coverage || 0}%
            </Text>
            <Text style={[styles.tableCell, { width: 80 }]}>
              {item.flooding_waterlogging ? 'Yes' : 'No'}
            </Text>
            <Text style={[styles.tableCell, { width: 70 }]}>
              {item.typhoid_cases || 0}
            </Text>
            <Text style={[styles.tableCell, { width: 70 }]}>
              {item.fever_cases || 0}
            </Text>
            <Text style={[styles.tableCell, { width: 70 }]}>
              {item.diarrhea_cases || 0}
            </Text>
            <View style={[styles.tableCell, { width: 90 }]}>
              <View style={[styles.badgeBase, getAlertBadgeStyle(item.alert_level)]}>
                <Text style={[styles.badgeTextBase, getAlertBadgeStyle(item.alert_level)]}>
                  {item.alert_level || 'low'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const AddDataModal = ({ visible, onClose, onSubmit, villages, loading }) => {
  const [form, setForm] = useState({
    village_id: null,
    clean_drinking_water: false,
    toilet_coverage: "",
    waste_disposal_system: false,
    flooding_waterlogging: false,
    awareness_campaigns: false,
    typhoid_cases: "0",
    fever_cases: "0",
    diarrhea_cases: "0",
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const resetForm = () => {
    setForm({
      village_id: null,
      clean_drinking_water: false,
      toilet_coverage: "",
      waste_disposal_system: false,
      flooding_waterlogging: false,
      awareness_campaigns: false,
      typhoid_cases: "0",
      fever_cases: "0",
      diarrhea_cases: "0",
    });
  };

  const handleSubmit = async () => {
    if (!form.village_id) {
      Toast.show({ type: 'error', text1: 'Please select a village.' });
      return;
    }

    if (!form.toilet_coverage || isNaN(parseInt(form.toilet_coverage))) {
      Toast.show({ type: 'error', text1: 'Please enter a valid toilet coverage percentage.' });
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        ...form,
        toilet_coverage: parseInt(form.toilet_coverage) || 0,
        typhoid_cases: parseInt(form.typhoid_cases) || 0,
        fever_cases: parseInt(form.fever_cases) || 0,
        diarrhea_cases: parseInt(form.diarrhea_cases) || 0,
      };
      
      await onSubmit(payload);
      resetForm();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClose = () => {
    if (!submitLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      onRequestClose={handleClose} 
      transparent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Add Village Survey Data</Text>

            <Text style={styles.label}>Village *</Text>
            <View style={styles.pickerContainer}>
              <Picker 
                selectedValue={form.village_id} 
                onValueChange={v => setForm({ ...form, village_id: v })}
                enabled={!submitLoading}
              >
                <Picker.Item label="-- Select Village --" value={null} />
                {villages.map(v => (
                  <Picker.Item 
                    key={v.village_id} 
                    label={v.village_name} 
                    value={v.village_id} 
                  />
                ))}
              </Picker>
            </View>

            <FormFieldSwitch 
              label="Clean Drinking Water Available" 
              value={form.clean_drinking_water} 
              onValueChange={v => setForm({ ...form, clean_drinking_water: v })}
              disabled={submitLoading}
            />

            <FormFieldInput 
              label="Toilet Coverage (%) *" 
              value={form.toilet_coverage} 
              onChangeText={v => setForm({ ...form, toilet_coverage: v })} 
              keyboardType="numeric" 
              editable={!submitLoading}
            />

            <FormFieldSwitch 
              label="Waste Disposal System" 
              value={form.waste_disposal_system} 
              onValueChange={v => setForm({ ...form, waste_disposal_system: v })}
              disabled={submitLoading}
            />

            <FormFieldSwitch 
              label="Flooding/Waterlogging Issues" 
              value={form.flooding_waterlogging} 
              onValueChange={v => setForm({ ...form, flooding_waterlogging: v })}
              disabled={submitLoading}
            />

            <FormFieldSwitch 
              label="Awareness Campaigns Conducted" 
              value={form.awareness_campaigns} 
              onValueChange={v => setForm({ ...form, awareness_campaigns: v })}
              disabled={submitLoading}
            />

            <Text style={styles.sectionTitle}>Disease Cases</Text>
            
            <FormFieldInput 
              label="Typhoid Cases" 
              value={form.typhoid_cases} 
              onChangeText={v => setForm({ ...form, typhoid_cases: v })} 
              keyboardType="numeric"
              editable={!submitLoading}
            />

            <FormFieldInput 
              label="Fever Cases" 
              value={form.fever_cases} 
              onChangeText={v => setForm({ ...form, fever_cases: v })} 
              keyboardType="numeric"
              editable={!submitLoading}
            />

            <FormFieldInput 
              label="Diarrhea Cases" 
              value={form.diarrhea_cases} 
              onChangeText={v => setForm({ ...form, diarrhea_cases: v })} 
              keyboardType="numeric"
              editable={!submitLoading}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={handleSubmit}
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Submit Data</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={handleClose}
                disabled={submitLoading}
              >
                <Text style={[styles.buttonText, { color: '#6b7280' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const FormFieldInput = ({ label, style, ...props }) => (
  <View style={styles.formField}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={[styles.input, style]} {...props} />
  </View>
);

const FormFieldSwitch = ({ label, value, onValueChange, disabled }) => (
  <View style={[styles.formField, styles.switchField]}>
    <Text style={styles.label}>{label}</Text>
    <Switch 
      value={value} 
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: '#f3f4f6', true: '#dcfce7' }}
      thumbColor={value ? '#16a34a' : '#9ca3af'}
    />
  </View>
);

// --- MAIN NGO DASHBOARD SCREEN ---
const NgoDashboard = () => {
  const { user, logout, isLoading: authLoading, isAuthenticated } = useAuth();
  const [showAddDataModal, setShowAddDataModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [surveyedData, setSurveyedData] = useState([]);
  const [villages, setVillages] = useState([]);
  const isMountedRef = useRef(true);
  const fetchAbortControllerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Exit App',
          'Do you want to exit the app?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() }
          ]
        );
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const fetchData = async (isRefresh = false) => {
    if (!user?.user_id || !isAuthenticated) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    // Cancel previous request if still ongoing
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
    }
    
    fetchAbortControllerRef.current = new AbortController();

    try {
      // Mock data for development - replace with actual API calls
      // const [statsRes, surveyedRes, villagesRes] = await Promise.all([
      //   api.get("/ngoData/summary-statistics/", { signal: fetchAbortControllerRef.current.signal }),
      //   api.get("/ngoData/surveyed-villages/", { signal: fetchAbortControllerRef.current.signal }),
      //   api.get("/ngoData/villages/dropdown", { signal: fetchAbortControllerRef.current.signal })
      // ]);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockStats = {
        total_villages: 25,
        high_alert_villages: 3,
        total_disease_cases: 47,
        villages_without_clean_water: 8,
      };

      const mockSurveyedData = [
        {
          village_name: "Rampur",
          clean_drinking_water: true,
          toilet_coverage: 85,
          waste_disposal: true,
          flooding_waterlogging: false,
          awareness: true,
          typhoid_cases: 2,
          fever_cases: 5,
          diarrhea_cases: 1,
          alert_level: "low",
        },
        {
          village_name: "Sitapur",
          clean_drinking_water: false,
          toilet_coverage: 45,
          waste_disposal: false,
          flooding_waterlogging: true,
          awareness: false,
          typhoid_cases: 8,
          fever_cases: 12,
          diarrhea_cases: 6,
          alert_level: "high",
        },
        {
          village_name: "Govindpur",
          clean_drinking_water: true,
          toilet_coverage: 70,
          waste_disposal: true,
          flooding_waterlogging: false,
          awareness: true,
          typhoid_cases: 3,
          fever_cases: 7,
          diarrhea_cases: 2,
          alert_level: "medium",
        },
      ];

      const mockVillages = [
        { village_id: 1, village_name: "Rampur" },
        { village_id: 2, village_name: "Sitapur" },
        { village_id: 3, village_name: "Govindpur" },
        { village_id: 4, village_name: "Nandpur" },
        { village_id: 5, village_name: "Krishnapur" },
      ];

      if (isMountedRef.current && user?.user_id && isAuthenticated) {
        setStats(mockStats);
        setSurveyedData(mockSurveyedData);
        setVillages(mockVillages);
      }

    } catch (error) {
      if (error.name === 'CanceledError') {
        console.log("NGO data fetch was cancelled");
        return;
      }

      console.error("Failed to fetch NGO dashboard data:", error);
      if (isMountedRef.current && user?.user_id && isAuthenticated) {
        Toast.show({ 
          type: 'error', 
          text1: 'Failed to load dashboard data',
          text2: 'Please check your connection and try again'
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (user?.user_id && isAuthenticated) {
      fetchData();
    }
  }, [user?.user_id, isAuthenticated]);

  const handleRefresh = () => {
    if (!refreshing && !loading) {
      fetchData(true);
    }
  };

  const handleSubmitReport = async (reportData) => {
    try {
      const payload = {
        ...reportData,
        ngo_id: user.user_id,
        report_date: new Date().toISOString().split("T")[0],
      };
      
      // await api.post("/ngoData/ngo-surveys/", payload);
      
      Toast.show({ 
        type: 'success', 
        text1: 'Survey submitted successfully!',
        text2: 'Data has been recorded'
      });
      
      setShowAddDataModal(false);
      // Refetch data to show updated information
      fetchData(true);
      
    } catch (error) {
      console.error("Error submitting survey:", error);
      Toast.show({ 
        type: 'error', 
        text1: 'Failed to submit survey',
        text2: error.response?.data?.message || "Please try again"
      });
    }
  };

  const handleSendAlert = (type) => {
    Alert.alert(
      `Send ${type} Alert`,
      `Are you sure you want to send a ${type.toLowerCase()} alert to the authorities?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Alert",
          style: "destructive",
          onPress: () => {
            Toast.show({ 
              type: 'success', 
              text1: `${type} alert sent successfully!`,
              text2: 'Authorities have been notified'
            });
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    if (logoutLoading) return;

    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLogoutLoading(true);
            
            try {
              // Cancel any ongoing requests
              if (fetchAbortControllerRef.current) {
                fetchAbortControllerRef.current.abort();
              }
              
              // Clear local state
              setStats({});
              setSurveyedData([]);
              setVillages([]);
              
              // Perform logout
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
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

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.promptText}>Please log in to view the NGO dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>NGO Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.name || 'NGO Staff'}</Text>
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

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.container}>
          {/* Statistics Section */}
          <Card>
            <Card.Header>
              <Card.Title>Community Overview</Card.Title>
              <Card.Description>Key metrics from your service areas</Card.Description>
            </Card.Header>
            <Card.Content>
              <View style={styles.statsGrid}>
                <StatCard
                  icon={<MapPin size={24} color="#3b82f6" />}
                  label="Total Villages"
                  value={stats.total_villages}
                  color="#3b82f6"
                  loading={loading}
                />
                <StatCard
                  icon={<AlertTriangle size={24} color="#dc2626" />}
                  label="High Alert"
                  value={stats.high_alert_villages}
                  color="#dc2626"
                  loading={loading}
                />
                <StatCard
                  icon={<TrendingUp size={24} color="#f59e0b" />}
                  label="Disease Cases"
                  value={stats.total_disease_cases}
                  color="#f59e0b"
                  loading={loading}
                />
                <StatCard
                  icon={<Droplets size={24} color="#06b6d4" />}
                  label="No Clean Water"
                  value={stats.villages_without_clean_water}
                  color="#06b6d4"
                  loading={loading}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Actions Section */}
          <Card>
            <Card.Header>
              <Card.Title>Quick Actions</Card.Title>
              <Card.Description>Manage surveys and send alerts</Card.Description>
            </Card.Header>
            <Card.Content>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={() => setShowAddDataModal(true)}
                disabled={loading}
              >
                <PlusCircle size={16} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Add Survey Data</Text>
              </TouchableOpacity>
              
              <View style={styles.alertButtonsRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.waterAlertButton]} 
                  onPress={() => handleSendAlert('Water Contamination')}
                  disabled={loading}
                >
                  <Droplets size={16} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Water Alert</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.diseaseAlertButton]} 
                  onPress={() => handleSendAlert('Disease Outbreak')}
                  disabled={loading}
                >
                  <AlertTriangle size={16} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Disease Alert</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

          {/* Surveyed Villages Table */}
          <Card>
            <Card.Header>
              <Card.Title>Surveyed Villages Status</Card.Title>
              <Card.Description>Completed surveys with alert levels</Card.Description>
            </Card.Header>
            <Card.Content>
              <VillageDataTable surveyedData={surveyedData} loading={loading} />
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      <AddDataModal 
        visible={showAddDataModal}
        onClose={() => setShowAddDataModal(false)}
        onSubmit={handleSubmitReport}
        villages={villages}
        loading={loading}
      />
    </SafeAreaView>
  );
};

// --- STYLESHEET ---
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f9fafb' 
  },
  scrollView: {
    flex: 1,
  },
  container: { 
    padding: 16 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  header: { 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: '#6b7280',
    marginTop: 2,
  },
  logoutButton: { 
    padding: 8,
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  promptText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Card Components
  card: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    marginBottom: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: { 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6' 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardDescription: { 
    fontSize: 14, 
    color: '#6b7280' 
  },
  cardContent: { 
    padding: 16 
  },
  
  // Statistics
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
  },
  statCard: { 
    width: '48%', 
    borderRadius: 8, 
    padding: 16, 
    marginBottom: 12, 
    alignItems: 'center' 
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: { 
    fontSize: 12, 
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Buttons
  button: { 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row',
    marginBottom: 8,
  },
  primaryButton: { 
    backgroundColor: '#16a34a' 
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  waterAlertButton: {
    backgroundColor: '#3b82f6',
    flex: 1,
    marginRight: 4,
  },
  diseaseAlertButton: {
    backgroundColor: '#dc2626',
    flex: 1,
    marginLeft: 4,
  },
  buttonText: { 
    color: 'white', 
    fontWeight: '600',
    fontSize: 14,
  },
  alertButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  
  // Table
  tableContainer: {
    minWidth: '100%',
  },
  tableRow: { 
    flexDirection: 'row', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  tableHeader: { 
    fontWeight: 'bold', 
    color: '#374151', 
    fontSize: 12,
    paddingRight: 8,
  },
  tableCell: { 
    fontSize: 12, 
    paddingRight: 8, 
    color: '#6b7280',
    textAlign: 'left',
  },
  
  // Badges
  badgeBase: { 
    borderRadius: 12, 
    paddingVertical: 4, 
    paddingHorizontal: 8, 
    alignItems: 'center',
    minWidth: 50,
  },
  badgeTextBase: { 
    fontSize: 11, 
    fontWeight: '600', 
    textTransform: 'capitalize' 
  },
  mildBadge: { 
    backgroundColor: '#dcfce7', 
    color: '#166534' 
  },
  moderateBadge: { 
    backgroundColor: '#fef3c7', 
    color: '#854d0e' 
  },
  severeBadge: { 
    backgroundColor: '#fee2e2', 
    color: '#991b1b' 
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    textAlign: 'center',
  },
  
  // Modal
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    width: '90%', 
    maxHeight: '90%', 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 16,
    color: '#1f2937',
  },
  modalActions: { 
    marginTop: 20, 
    gap: 10 
  },
  
  // Form Fields
  formField: { 
    marginBottom: 16 
  },
  switchField: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 8 
  },
  label: { 
    fontSize: 16, 
    color: '#374151', 
    marginBottom: 8,
    fontWeight: '500',
  },
  input: { 
    height: 44, 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  pickerContainer: { 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 24, 
    marginBottom: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb', 
    paddingTop: 16,
    color: '#1f2937',
  }
});

export default NgoDashboard;