// app/adminDashboard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import { LogOut } from 'lucide-react-native';

const AdminDashboardScreen = () => {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, the AuthContext should handle navigation
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  // Show error state if no user
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Please log in to access the admin dashboard</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {user.name || 'Admin'}!</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={22} color="#b91c1c" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Information</Text>
          <Text style={styles.infoText}>Email: {user.email}</Text>
          <Text style={styles.infoText}>Role: {user.role}</Text>
          <Text style={styles.infoText}>State: {user.state || 'Not specified'}</Text>
          <Text style={styles.infoText}>District: {user.district || 'Not specified'}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Functions</Text>
          <Text style={styles.infoText}>Admin dashboard features coming soon...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
});

export default AdminDashboardScreen;