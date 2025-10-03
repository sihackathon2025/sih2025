import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
    RefreshControl, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';
import {
    LogOut, Users, HeartPulse, Skull, Hospital, Activity, ShieldCheck,
    Wind, User, Droplets, Calendar, MapPin, XCircle
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

// Error Boundary to prevent the entire app from crashing on a UI error.
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.errorContainer}>
                    <XCircle size={48} color="#ef4444" />
                    <Text style={styles.errorTitle}>Dashboard Failed to Render</Text>
                    <Text style={styles.errorMessage}>An unexpected error occurred. Please check the logs for more details.</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

// Helper Functions & Card Components
const getRiskColor = (riskLevel) => ({ "Very Low": "#22c55e", "Low": "#84cc16", "Moderate": "#eab308", "High": "#f97316", "Very High": "#ef4444" }[riskLevel] || "#6b7280");
const getRiskBadgeStyle = (riskLevel) => ({ "Very High": { backgroundColor: '#fee2e2', color: '#991b1b' }, "High": { backgroundColor: '#ffedd5', color: '#9a3412' }, "Moderate": { backgroundColor: '#fef3c7', color: '#854d0e' }, "Low": { backgroundColor: '#ecfccb', color: '#365314' }, "Very Low": { backgroundColor: '#dcfce7', color: '#166534' } }[riskLevel] || { backgroundColor: '#f3f4f6', color: '#4b5563' });
const Card = ({ children, style, borderColor }) => <View style={[styles.card, style, borderColor && { borderLeftWidth: 4, borderLeftColor: borderColor }]}>{children}</View>;
Card.Header = ({ children }) => <View style={styles.cardHeader}>{children}</View>;
Card.Title = ({ children }) => <Text style={styles.cardTitle}>{children}</Text>;
Card.Description = ({ children }) => <Text style={styles.cardDescription}>{children}</Text>;
Card.Content = ({ children }) => <View style={styles.cardContent}>{children}</View>;
const StatCard = ({ icon, label, value, t }) => <View style={styles.statCard}><View style={styles.statIconContainer}>{icon}</View><Text style={styles.statValue}>{value ?? '--'}</Text><Text style={styles.statLabel}>{t(label)}</Text></View>;
const EmptyState = ({ text }) => <View style={styles.emptyState}><Wind size={40} color="#9ca3af" /><Text style={styles.emptyStateText}>{text}</Text></View>;

// Chart Components
const chartConfig = { backgroundGradientFrom: "#ffffff", backgroundGradientTo: "#ffffff", color: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`, strokeWidth: 2, barPercentage: 0.5, useShadowColorFromDataset: false };
const SeverityPieChart = ({ data }) => {
    if (!data || data.length === 0) return <EmptyState text="No Severity Data" />;
    return <PieChart data={data} width={CHART_WIDTH} height={200} chartConfig={chartConfig} accessor="value" backgroundColor="transparent" paddingLeft="15" absolute />;
};
const SymptomBarChart = ({ data }) => {
    if (!data || !data.labels || data.labels.length === 0) return <EmptyState text="No Symptom Data" />;
    return <BarChart data={data} width={CHART_WIDTH} height={220} yAxisLabel="" yAxisSuffix="" fromZero chartConfig={chartConfig} verticalLabelRotation={30} style={styles.chartStyle} />;
};
const MonthlyTrendLineChart = ({ data }) => {
    if (!data || !data.labels || data.labels.length === 0) return <EmptyState text="No Trend Data" />;
    return <LineChart data={data} width={CHART_WIDTH} height={220} chartConfig={chartConfig} bezier style={styles.chartStyle} />;
};

const AdminDashboard = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { t } = useTranslation();
    const [allVillagesData, setAllVillagesData] = useState([]);
    const [selectedVillageId, setSelectedVillageId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeWatchlistTab, setActiveWatchlistTab] = useState('high');
    const [logoutLoading, setLogoutLoading] = useState(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!isAuthenticated) return;
        if (isRefresh) setRefreshing(true); else setLoading(true);

        try {
            const villagesResponse = await api.get("/dashboard/villages/");
            if (isMountedRef.current) {
                const villages = villagesResponse.data;
                if (!Array.isArray(villages)) throw new Error("Invalid villages data format");
                
                const sortedVillages = [...villages].sort((a, b) => (b.risk_percentage || 0) - (a.risk_percentage || 0));
                setAllVillagesData(sortedVillages);

                if (sortedVillages.length > 0 && !selectedVillageId) {
                    setSelectedVillageId(sortedVillages[0].id);
                }
            }
        } catch (error) {
            console.error("fetchData error:", error);
            if (isMountedRef.current) Toast.show({ type: 'error', text1: t('failed_to_load_dashboard_data'), text2: error.message });
        } finally {
            if (isMountedRef.current) { setLoading(false); setRefreshing(false); }
        }
    }, [isAuthenticated, t, selectedVillageId]);

    useEffect(() => {
        if (isAuthenticated) fetchData();
    }, [isAuthenticated]);

    const handleLogout = () => {
        Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: async () => {
                setLogoutLoading(true);
                try {
                    await logout();
                } catch (error) {
                    Toast.show({ type: 'error', text1: 'Logout failed' });
                } finally {
                    if(isMountedRef.current) setLogoutLoading(false);
                }
            }}
        ]);
    };

    const selectedVillageData = useMemo(() => allVillagesData.find(v => v.id === selectedVillageId) || null, [selectedVillageId, allVillagesData]);
    const chartData = useMemo(() => {
        if (!selectedVillageData) return {};
        const { severity_distribution = {}, symptom_distribution = {}, monthly_trend = {} } = selectedVillageData;
        const severityPieData = Object.entries(severity_distribution).map(([name, value]) => ({ name: t(name.toLowerCase()), value, color: { Mild: '#22c55e', Moderate: '#eab308', Severe: '#ef4444' }[name] || '#6b7280' }));
        const topSymptoms = Object.entries(symptom_distribution).sort(([, a], [, b]) => b - a).slice(0, 5);
        const symptomChartData = { labels: topSymptoms.map(([name]) => t(name.toLowerCase())), datasets: [{ data: topSymptoms.map(([, count]) => count) }] };
        const trendEntries = Object.entries(monthly_trend);
        const monthlyTrendData = { labels: trendEntries.map(([month]) => t(month.toLowerCase())), datasets: [{ data: trendEntries.map(([, cases]) => cases), color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`, strokeWidth: 2 }] };
        return { severityPieData, symptomChartData, monthlyTrendData };
    }, [selectedVillageData, t]);

    if (loading) {
        return <SafeAreaView style={styles.safeArea}><View style={styles.centerContainer}><ActivityIndicator size="large" color="#1e3a8a" /><Text style={styles.loadingText}>{t('loading_dashboard')}</Text></View></SafeAreaView>;
    }
    if (!isAuthenticated || !user) {
        return <SafeAreaView style={styles.safeArea}><View style={styles.centerContainer}><Text style={styles.promptText}>{t('please_log_in')}</Text></View></SafeAreaView>;
    }

    return (
        <ErrorBoundary>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View>
                            <Text style={styles.headerTitle}>{t("admin_dashboard")}</Text>
                            <Text style={styles.headerSubtitle}>{t("ministry_of_development_ner")}</Text>
                        </View>
                        <View style={styles.userInfoContainer}><User size={16} color="#4b5563" /><Text style={styles.userName}>{user?.name}</Text></View>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} disabled={logoutLoading}>
                        {logoutLoading ? <ActivityIndicator size={22} color="#b91c1c" /> : <LogOut size={22} color="#b91c1c" />}
                    </TouchableOpacity>
                </View>

                <FlatList
                    ListHeaderComponent={
                        <DashboardHeader t={t} selectedVillageData={selectedVillageData} chartData={chartData} activeTab={activeWatchlistTab} onTabChange={setActiveWatchlistTab} />
                    }
                    data={allVillagesData.filter(v => {
                        const risk = v.risk_level;
                        if (activeWatchlistTab === 'high') return risk === 'High' || risk === 'Very High';
                        if (activeWatchlistTab === 'moderate') return risk === 'Moderate';
                        return risk === 'Low' || risk === 'Very Low';
                    })}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={[styles.watchlistItem, selectedVillageId === item.id && styles.watchlistItemSelected]} onPress={() => setSelectedVillageId(item.id)}>
                            <Text style={styles.watchlistVillageName}>{item.village_name}</Text>
                            <Text style={styles.watchlistVillageStats}>{item.total_cases} {t('cases')} | {item.risk_percentage}% {t('risk')}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<EmptyState text="No villages in this category." />}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
                />
            </SafeAreaView>
        </ErrorBoundary>
    );
};

const DashboardHeader = ({ t, selectedVillageData, chartData, activeTab, onTabChange }) => (
    <View style={styles.container}>
        <Card borderColor={selectedVillageData ? getRiskColor(selectedVillageData.risk_level) : null}>
            <Card.Header>
                <View style={styles.villageHeaderRow}>
                    <View style={{ flex: 1 }}>
                        <Card.Title>{selectedVillageData?.village_name || t('no_village_selected')}</Card.Title>
                        <Card.Description>{selectedVillageData ? `${selectedVillageData.district}, ${selectedVillageData.state}` : t('select_village_sidebar_details')}</Card.Description>
                    </View>
                    {selectedVillageData && <View style={[styles.riskBadge, { backgroundColor: getRiskColor(selectedVillageData.risk_level) }]}><Text style={styles.riskBadgeText}>{t(selectedVillageData.risk_level.toLowerCase())} ({selectedVillageData.risk_percentage}%)</Text></View>}
                </View>
            </Card.Header>
        </Card>

        <View style={styles.statsGrid}>
            <StatCard t={t} icon={<Users size={22} color="#3b82f6" />} label="population" value={selectedVillageData?.population?.toLocaleString()} />
            <StatCard t={t} icon={<HeartPulse size={22} color="#f59e0b" />} label="total_cases" value={selectedVillageData?.total_cases} />
            <StatCard t={t} icon={<Skull size={22} color="#dc2626" />} label="deaths" value={selectedVillageData?.total_deaths} />
            <StatCard t={t} icon={<Hospital size={22} color="#8b5cf6" />} label="hospitalized" value={selectedVillageData?.hospitalized_cases} />
            <StatCard t={t} icon={<Activity size={22} color="#f97316" />} label="critical" value={selectedVillageData?.critical_cases} />
            <StatCard t={t} icon={<ShieldCheck size={22} color="#22c55e" />} label="recovered" value={selectedVillageData?.recovered_cases} />
        </View>

        <Card><Card.Header><Card.Title>Interactive Map</Card.Title></Card.Header><Card.Content><View style={styles.mapPlaceholder}><MapPin size={48} color="#9ca3af" /><Text style={styles.mapPlaceholderText}>Map functionality is temporarily disabled.</Text></View></Card.Content></Card>
        <Card><Card.Header><Card.Title>{t('severity_distribution')}</Card.Title></Card.Header><Card.Content><SeverityPieChart data={chartData.severityPieData} /></Card.Content></Card>
        <Card><Card.Header><Card.Title>{t('symptom_distribution')}</Card.Title></Card.Header><Card.Content><SymptomBarChart data={chartData.symptomChartData} /></Card.Content></Card>
        <Card><Card.Header><Card.Title>{t('monthly_trend')}</Card.Title></Card.Header><Card.Content><MonthlyTrendLineChart data={chartData.monthlyTrendData} /></Card.Content></Card>

        {selectedVillageData && 
            <Card>
                <Card.Header><Card.Title>{t('additional_info')}</Card.Title></Card.Header>
                <Card.Content style={{alignItems: 'flex-start'}}>
                    <View style={styles.infoRow}><View style={styles.infoLabelContainer}><Droplets size={16} color="#6b7280" /><Text style={styles.infoLabel}>{t('water_status')}</Text></View><View style={[styles.badge, getRiskBadgeStyle(selectedVillageData.latest_water_assessment_status === 'Poor' ? 'High' : 'Low')]}><Text style={[styles.badgeText, {color: getRiskBadgeStyle(selectedVillageData.latest_water_assessment_status === 'Poor' ? 'High' : 'Low').color}]}>{t(selectedVillageData.latest_water_assessment_status?.toLowerCase() || 'n_a')}</Text></View></View>
                    <View style={styles.infoRow}><View style={styles.infoLabelContainer}><Calendar size={16} color="#6b7280" /><Text style={styles.infoLabel}>{t('last_tested')}</Text></View><Text style={styles.infoValue}>{selectedVillageData.latest_water_assessment_date ? new Date(selectedVillageData.latest_water_assessment_date).toLocaleDateString() : t('n_a')}</Text></View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}><View style={styles.infoLabelContainer}><ShieldCheck size={16} color="#6b7280" /><Text style={styles.infoLabel}>{t('completed_campaigns')}</Text></View><Text style={styles.infoValueBold}>{selectedVillageData.completed_campaigns}</Text></View>
                    <View style={styles.infoRow}><View style={styles.infoLabelContainer}><Activity size={16} color="#6b7280" /><Text style={styles.infoLabel}>{t('ongoing_campaigns')}</Text></View><Text style={styles.infoValueBold}>{selectedVillageData.ongoing_campaigns}</Text></View>
                </Card.Content>
            </Card>
        }

        <Card>
            <Card.Header><Card.Title>{t('village_watchlist')}</Card.Title></Card.Header>
            <Card.Content>
                <View style={styles.tabsContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === 'high' && styles.tabActive]} onPress={() => onTabChange('high')}><Text style={[styles.tabText, activeTab === 'high' && styles.tabTextActive]}>{t('high')}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'moderate' && styles.tabActive]} onPress={() => onTabChange('moderate')}><Text style={[styles.tabText, activeTab === 'moderate' && styles.tabTextActive]}>{t('moderate')}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'low' && styles.tabActive]} onPress={() => onTabChange('low')}><Text style={[styles.tabText, activeTab === 'low' && styles.tabTextActive]}>{t('low')}</Text></TouchableOpacity>
                </View>
            </Card.Content>
        </Card>
    </View>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    container: { padding: 16, gap: 16 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
    promptText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
    header: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { flex: 1, flexDirection: 'column', alignItems: 'flex-start' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    headerSubtitle: { fontSize: 12, color: '#6b7280' },
    userInfoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    userName: { color: '#4b5563', fontWeight: '500', fontSize: 14 },
    logoutButton: { padding: 8 },
    card: { backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 },
    cardDescription: { fontSize: 14, color: '#6b7280' },
    cardContent: { padding: 16, alignItems: 'center' },
    villageHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
    riskBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
    statCard: { width: '31%', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, alignItems: 'center' },
    statIconContainer: { marginBottom: 6 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 },
    statLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center' },
    mapPlaceholder: { width: SCREEN_WIDTH - 64, height: 200, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
    mapPlaceholderText: { marginTop: 12, color: '#9ca3af', fontSize: 14, textAlign: 'center' },
    chartStyle: { borderRadius: 8 },
    tabsContainer: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 4 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    tabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    tabText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    tabTextActive: { color: '#1f2937', fontWeight: '600' },
    watchlistItem: { padding: 12, marginHorizontal: 16, borderRadius: 8, marginBottom: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6' },
    watchlistItemSelected: { backgroundColor: '#e0e7ff', borderColor: '#a5b4fc' },
    watchlistVillageName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
    watchlistVillageStats: { fontSize: 12, color: '#6b7280' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
    emptyStateText: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, width: '100%' },
    infoLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoLabel: { fontSize: 14, color: '#6b7280' },
    infoValue: { fontSize: 14, color: '#1f2937' },
    infoValueBold: { fontSize: 14, color: '#1f2937', fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8, width: '100%' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#fff0f0' },
    errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#ef4444', marginBottom: 8, textAlign: 'center' },
    errorMessage: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
    errorDetails: { fontFamily: 'monospace', fontSize: 10, color: '#991b1b', marginTop: 10 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start' },
    badgeText: { fontSize: 12, fontWeight: '600' },
});

export default AdminDashboard;