// app/clinicDashboard.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';
import { LogOut, Bell, UserCheck, BarChart4, Droplets, AlertTriangle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

// --- CHILD COMPONENTS ---

const StatCard = ({ icon, label, value, color = '#3b82f6', loading = false }) => (
  <View style={[styles.statCard, { backgroundColor: `${color}15` }]}>
    <View style={styles.statIconContainer}>
      {icon}
    </View>
    {loading ? (
      <ActivityIndicator size="small" color={color} style={styles.statValue} />
    ) : (
      <Text style={[styles.statValue, { color }]}>{value || 0}</Text>
    )}
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AlertCard = ({ alert, onPress }) => {
  const getSeverityStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
      case 'high':
        return styles.severeBadge;
      case 'moderate':
      case 'medium':
        return styles.moderateBadge;
      default:
        return styles.mildBadge;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.alertCard} 
      onPress={() => onPress?.(alert)}
      activeOpacity={0.7}
    >
      <View style={styles.alertHeader}>
        <Text style={styles.alertTitle}>{alert.type || 'Alert'}</Text>
        <View style={[styles.badgeBase, getSeverityStyle(alert.severity)]}>
          <Text style={[styles.badgeTextBase, getSeverityStyle(alert.severity)]}>
            {alert.severity || 'Unknown'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.alertLocation}>
        {alert.village ? `${alert.village}` : 'Location unknown'}
        {alert.asha_worker_name && ` • ${alert.asha_worker_name}`}
      </Text>
      
      <Text style={styles.alertDetails} numberOfLines={2}>
        {alert.details || 'No details available'}
      </Text>
      
      <Text style={styles.alertDate}>
        {alert.date ? new Date(alert.date).toLocaleDateString() : 'Date unknown'}
      </Text>
    </TouchableOpacity>
  );
};

const EmptyState = ({ message, icon }) => (
  <View style={styles.emptyState}>
    {icon}
    <Text style={styles.emptyStateText}>{message}</Text>
  </View>
);

// --- MAIN DASHBOARD SCREEN ---

const ClinicDashboard = () => {
  const { user, logout, isLoading: authLoading, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    alerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const isMountedRef = useRef(true);
  const fetchAbortControllerRef = useRef(null);

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

  const fetchClinicData = async (isRefresh = false) => {
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
      // Mock data for now - replace with actual API call
      // const response = await api.get(`/clinic/dashboard/${user.user_id}`, {
      //   signal: fetchAbortControllerRef.current.signal
      // });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockData = {
        stats: {
          totalReports: 124,
          severeCases: 8,
          ashaWorkersInArea: 15,
          alertsThisWeek: 3,
        },
        alerts: [
          {
            id: 1,
            asha_worker_name: 'Priya Sharma',
            village: 'Rampur',
            type: 'High Water Turbidity',
            severity: 'Severe',
            date: new Date().toISOString(),
            details: 'Turbidity reading of 150 NTU detected in main water source.',
          },
          {
            id: 2,
            asha_worker_name: 'Anjali Gupta',
            village: 'Sitapur',
            type: 'Symptom Cluster',
            severity: 'Moderate',
            date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            details: '5 cases of fever and vomiting reported within 24 hours.',
          },
          {
            id: 3,
            asha_worker_name: 'Sunita Devi',
            village: 'Govindpur',
            type: 'Disease Outbreak',
            severity: 'Severe',
            date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            details: 'Sudden increase in diarrhea cases among children under 5.',
          },
        ],
      };

      if (isMountedRef.current && user?.user_id && isAuthenticated) {
        setDashboardData(mockData);
      }

    } catch (error) {
      if (error.name === 'CanceledError') {
        console.log("Clinic data fetch was cancelled");
        return;
      }

      console.error('Failed to fetch clinic dashboard data:', error);
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

  // Load data when component mounts or user changes
  useEffect(() => {
    if (user?.user_id && isAuthenticated && isMountedRef.current) {
      fetchClinicData();
    }
  }, [user?.user_id, isAuthenticated]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.user_id && isAuthenticated) {
        fetchClinicData();
      }
    }, [user?.user_id, isAuthenticated])
  );

  const handleRefresh = () => {
    if (!refreshing && !loading) {
      fetchClinicData(true);
    }
  };

  const handleAlertPress = (alert) => {
    Alert.alert(
      `${alert.type} - ${alert.village}`,
      `${alert.details}\n\nReported by: ${alert.asha_worker_name}\nDate: ${new Date(alert.date).toLocaleString()}`,
      [
        { text: 'Dismiss', style: 'cancel' },
        { 
          text: 'Mark as Reviewed', 
          onPress: () => {
            Toast.show({
              type: 'success',
              text1: 'Alert marked as reviewed'
            });
          }
        }
      ]
    );
  };

  const handleSendAlert = (type) => {
    Alert.alert(
      `Send ${type} Alert`,
      `Are you sure you want to send a ${type.toLowerCase()} alert to the authorities?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
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
              setDashboardData({ stats: {}, alerts: [] });
              
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

  // Show loading screen
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

  // Show login prompt
  if (!user || !isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.promptText}>Please log in to view the clinic dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { stats, alerts } = dashboardData;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Clinic Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Welcome, {user?.name || 'Clinic Staff'}
          </Text>
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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Community Health Overview</Text>
            <Text style={styles.cardDescription}>
              Key metrics from your service area
            </Text>
            
            <View style={styles.statsGrid}>
              <StatCard
                icon={<BarChart4 size={24} color="#3b82f6" />}
                label="Total Reports"
                value={stats.totalReports}
                color="#3b82f6"
                loading={loading}
              />
              <StatCard
                icon={<UserCheck size={24} color="#16a34a" />}
                label="ASHA Workers"
                value={stats.ashaWorkersInArea}
                color="#16a34a"
                loading={loading}
              />
              <StatCard
                icon={<AlertTriangle size={24} color="#dc2626" />}
                label="Severe Cases"
                value={stats.severeCases}
                color="#dc2626"
                loading={loading}
              />
              <StatCard
                icon={<Bell size={24} color="#f59e0b" />}
                label="This Week"
                value={stats.alertsThisWeek}
                color="#f59e0b"
                loading={loading}
              />
            </View>
          </View>

          {/* Alerts Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>High-Priority Alerts</Text>
              <Text style={styles.cardDescription}>
                Recent critical alerts from ASHA workers
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator style={{ padding: 20 }} color="#3b82f6" />
            ) : alerts && alerts.length > 0 ? (
              <View style={styles.alertsList}>
                {alerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onPress={handleAlertPress}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                message="No high-priority alerts found"
                icon={<Bell size={48} color="#9ca3af" />}
              />
            )}
          </View>

          {/* Quick Actions Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <Text style={styles.cardDescription}>
              Send emergency alerts to authorities
            </Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.waterAlertButton]}
                onPress={() => handleSendAlert('Water Contamination')}
                disabled={loading}
              >
                <Droplets size={20} color="white" />
                <Text style={styles.actionButtonText}>
                  Water Alert
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.diseaseAlertButton]}
                onPress={() => handleSendAlert('Disease Outbreak')}
                disabled={loading}
              >
                <AlertTriangle size={20} color="white" />
                <Text style={styles.actionButtonText}>
                  Disease Alert
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- STYLESHEET ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
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
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
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
  alertsList: {
    marginTop: 8,
  },
  alertCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  alertLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  alertDetails: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  alertDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  badgeBase: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  badgeTextBase: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  mildBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  moderateBadge: {
    backgroundColor: '#fef3c7',
    color: '#854d0e',
  },
  severeBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  waterAlertButton: {
    backgroundColor: '#3b82f6',
  },
  diseaseAlertButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ClinicDashboard;