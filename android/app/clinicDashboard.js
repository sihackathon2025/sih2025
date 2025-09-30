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
  // --- ADDED: Imports for custom dialogs ---
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';
import { LogOut, Bell, UserCheck, BarChart4, Droplets, AlertTriangle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

// --- CHILD COMPONENTS (StatCard, AlertCard, EmptyState - No Changes) ---

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

// --- NEW DIALOG COMPONENTS (modeled after index.js) ---

const AlertDetailsDialog = ({ isOpen, onOpenChange, alert }) => {
  if (!isOpen || !alert) return null;

  const handleMarkAsReviewed = () => {
    Toast.show({
      type: 'success',
      text1: 'Alert marked as reviewed'
    });
    onOpenChange(false);
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={() => onOpenChange(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>{alert.type}</Text>
                  <Text style={styles.modalDescription}>
                    {`Severity: ${alert.severity} • Location: ${alert.village}`}
                  </Text>

                  <Text style={styles.detailLabel}>Reported By:</Text>
                  <Text style={styles.detailText}>{alert.asha_worker_name}</Text>

                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailText}>{new Date(alert.date).toLocaleString()}</Text>

                  <Text style={styles.detailLabel}>Details:</Text>
                  <Text style={styles.detailText}>{alert.details}</Text>

                  <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary, styles.buttonFullWidth, { marginTop: 20 }]}
                    onPress={handleMarkAsReviewed}
                  >
                    <Text style={styles.buttonTextPrimary}>Mark as Reviewed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary, styles.buttonFullWidth]}
                    onPress={() => onOpenChange(false)}
                  >
                    <Text style={styles.buttonTextSecondary}>Dismiss</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const SendAlertDialog = ({ isOpen, onOpenChange, alertType }) => {
  const [notes, setNotes] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNotes('');
      setIsSending(false);
    }
  }, [isOpen]);

  const handleSend = () => {
    setIsSending(true);
    // Simulate API call
    setTimeout(() => {
      Toast.show({
        type: 'success',
        text1: `${alertType} alert sent successfully!`,
        text2: 'Authorities have been notified'
      });
      setIsSending(false);
      onOpenChange(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.modalTitle}>Send {alertType} Alert</Text>
                  <Text style={styles.modalDescription}>
                    This will notify the relevant authorities immediately. Add any additional notes below.
                  </Text>

                  <Text style={styles.label}>Additional Notes (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g., specific location, number of people affected..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    editable={!isSending}
                  />

                  <TouchableOpacity
                    style={[styles.button, styles.buttonDestructive, styles.buttonFullWidth, { marginTop: 20 }]}
                    onPress={handleSend}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonTextPrimary}>Confirm & Send Alert</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary, styles.buttonFullWidth]}
                    onPress={() => onOpenChange(false)}
                    disabled={isSending}
                  >
                    <Text style={styles.buttonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};


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
  // --- ADDED: State for dialogs ---
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertTypeToSend, setAlertTypeToSend] = useState('');
  const [isDetailsModalVisible, setDetailsModalVisible] = useState(false);
  const [isSendModalVisible, setSendModalVisible] = useState(false);
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

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Exit App', 'Do you want to exit?',
          [{ text: 'Cancel', style: 'cancel' }, { text: 'Exit', onPress: () => BackHandler.exitApp() }]
        );
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const fetchClinicData = async (isRefresh = false) => {
    if (!user?.user_id || !isAuthenticated) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);

    if (fetchAbortControllerRef.current) fetchAbortControllerRef.current.abort();
    fetchAbortControllerRef.current = new AbortController();

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
      const mockData = {
        stats: { totalReports: 124, severeCases: 8, ashaWorkersInArea: 15, alertsThisWeek: 3 },
        alerts: [
          { id: 1, asha_worker_name: 'Priya Sharma', village: 'Rampur', type: 'High Water Turbidity', severity: 'Severe', date: new Date().toISOString(), details: 'Turbidity reading of 150 NTU detected in main water source.' },
          { id: 2, asha_worker_name: 'Anjali Gupta', village: 'Sitapur', type: 'Symptom Cluster', severity: 'Moderate', date: new Date(Date.now() - 86400000).toISOString(), details: '5 cases of fever and vomiting reported within 24 hours.' },
          { id: 3, asha_worker_name: 'Sunita Devi', village: 'Govindpur', type: 'Disease Outbreak', severity: 'Severe', date: new Date(Date.now() - 172800000).toISOString(), details: 'Sudden increase in diarrhea cases among children under 5.' },
        ],
      };
      if (isMountedRef.current) setDashboardData(mockData);
    } catch (error) {
      if (error.name === 'CanceledError') return console.log("Clinic data fetch was cancelled");
      console.error('Failed to fetch clinic dashboard data:', error);
      if (isMountedRef.current) Toast.show({ type: 'error', text1: 'Failed to load data' });
    } finally {
      if (isMountedRef.current) { setLoading(false); setRefreshing(false); }
    }
  };

  useEffect(() => {
    if (user?.user_id && isAuthenticated) fetchClinicData();
  }, [user?.user_id, isAuthenticated]);

  useFocusEffect(React.useCallback(() => {
    if (user?.user_id && isAuthenticated) fetchClinicData();
  }, [user?.user_id, isAuthenticated]));

  const handleRefresh = () => { if (!refreshing && !loading) fetchClinicData(true); };

  // --- UPDATED: Event handlers to open dialogs ---
  const handleAlertPress = (alert) => {
    setSelectedAlert(alert);
    setDetailsModalVisible(true);
  };

  const handleSendAlert = (type) => {
    setAlertTypeToSend(type);
    setSendModalVisible(true);
  };

  const handleLogout = async () => {
    if (logoutLoading) return;
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?',
      [{ text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          setLogoutLoading(true);
          try {
            if (fetchAbortControllerRef.current) fetchAbortControllerRef.current.abort();
            setDashboardData({ stats: {}, alerts: [] });
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            setTimeout(() => { if (isMountedRef.current) setLogoutLoading(false); }, 1000);
          }
        }
      }
      ]
    );
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}><View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" /><Text style={styles.loadingText}>Loading...</Text>
      </View></SafeAreaView>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}><View style={styles.centerContainer}>
        <Text style={styles.promptText}>Please log in to view the dashboard</Text>
      </View></SafeAreaView>
    );
  }

  const { stats, alerts } = dashboardData;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Clinic Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.name || 'Clinic Staff'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} disabled={logoutLoading}>
          {logoutLoading ? <ActivityIndicator size={22} color="#b91c1c" /> : <LogOut size={22} color="#b91c1c" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.container}>
          {/* Statistics Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Community Health Overview</Text>
            <Text style={styles.cardDescription}>Key metrics from your service area</Text>
            <View style={styles.statsGrid}>
              <StatCard icon={<BarChart4 size={24} color="#3b82f6" />} label="Total Reports" value={stats.totalReports} loading={loading} />
              <StatCard icon={<UserCheck size={24} color="#16a34a" />} label="ASHA Workers" value={stats.ashaWorkersInArea} color="#16a34a" loading={loading} />
              <StatCard icon={<AlertTriangle size={24} color="#dc2626" />} label="Severe Cases" value={stats.severeCases} color="#dc2626" loading={loading} />
              <StatCard icon={<Bell size={24} color="#f59e0b" />} label="This Week" value={stats.alertsThisWeek} color="#f59e0b" loading={loading} />
            </View>
          </View>

          {/* Alerts Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>High-Priority Alerts</Text>
              <Text style={styles.cardDescription}>Recent critical alerts from ASHA workers</Text>
            </View>
            {loading ? <ActivityIndicator style={{ padding: 20 }} color="#3b82f6" />
              : alerts && alerts.length > 0 ? (
                <View style={styles.alertsList}>{alerts.map(alert => (<AlertCard key={alert.id} alert={alert} onPress={handleAlertPress} />))}</View>
              ) : (<EmptyState message="No high-priority alerts found" icon={<Bell size={48} color="#9ca3af" />} />)}
          </View>

          {/* Quick Actions Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <Text style={styles.cardDescription}>Send emergency alerts to authorities</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.actionButton, styles.waterAlertButton]} onPress={() => handleSendAlert('Water Contamination')} disabled={loading}>
                <Droplets size={20} color="white" /><Text style={styles.actionButtonText}>Water Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.diseaseAlertButton]} onPress={() => handleSendAlert('Disease Outbreak')} disabled={loading}>
                <AlertTriangle size={20} color="white" /><Text style={styles.actionButtonText}>Disease Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- ADDED: Render Dialogs --- */}
      <AlertDetailsDialog
        isOpen={isDetailsModalVisible}
        onOpenChange={setDetailsModalVisible}
        alert={selectedAlert}
      />
      <SendAlertDialog
        isOpen={isSendModalVisible}
        onOpenChange={setSendModalVisible}
        alertType={alertTypeToSend}
      />
    </SafeAreaView>
  );
};

// --- STYLESHEET (with added styles for dialogs) ---
const styles = StyleSheet.create({
  // ... existing styles from ClinicDashboard ...
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1 },
  container: { padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { paddingVertical: 16, paddingHorizontal: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  headerSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  logoutButton: { padding: 8, borderRadius: 8 },
  loadingText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
  promptText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  cardDescription: { fontSize: 14, color: '#6b7280' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16 },
  statCard: { width: '48%', borderRadius: 8, padding: 16, marginBottom: 12, alignItems: 'center' },
  statIconContainer: { marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  alertsList: { marginTop: 8 },
  alertCard: { padding: 12, borderRadius: 8, backgroundColor: '#f9fafb', marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  alertTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1, marginRight: 8 },
  alertLocation: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  alertDetails: { fontSize: 14, color: '#4b5563', marginBottom: 8, lineHeight: 20 },
  alertDate: { fontSize: 12, color: '#9ca3af' },
  badgeBase: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8, alignItems: 'center' },
  badgeTextBase: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  mildBadge: { backgroundColor: '#dcfce7', color: '#166534' },
  moderateBadge: { backgroundColor: '#fef3c7', color: '#854d0e' },
  severeBadge: { backgroundColor: '#fee2e2', color: '#991b1b' },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyStateText: { fontSize: 16, color: '#9ca3af', marginTop: 12, textAlign: 'center' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginHorizontal: 4 },
  waterAlertButton: { backgroundColor: '#3b82f6' },
  diseaseAlertButton: { backgroundColor: '#dc2626' },
  actionButtonText: { color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 8 },

  // --- NEW STYLES copied/adapted from index.js ---
  keyboardAvoidingView: { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', maxHeight: '85%', backgroundColor: 'white', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8, },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: '#1f2937' },
  modalDescription: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 10 },
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginTop: 12, textTransform: 'uppercase' },
  detailText: { fontSize: 16, color: '#374151', marginBottom: 4 },
  input: { height: 44, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, fontSize: 16, backgroundColor: '#f9fafb' },
  textArea: { height: 100, textAlignVertical: 'top', paddingVertical: 12 },
  button: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, marginVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: '#16a34a' },
  buttonDestructive: { backgroundColor: '#dc2626' },
  buttonTextPrimary: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  buttonSecondary: { borderWidth: 2, borderColor: '#6b7280' },
  buttonTextSecondary: { color: '#6b7280', fontSize: 16, fontWeight: 'bold' },
  buttonFullWidth: { alignSelf: 'stretch' },
});

export default ClinicDashboard;