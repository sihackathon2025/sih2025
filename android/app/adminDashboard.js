import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator,
    RefreshControl, Alert, TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; // <-- FIX: Import useRouter for navigation
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';
import {
    LogOut, Users, HeartPulse, Skull, Hospital, Activity, ShieldCheck,
    AlertTriangle, Siren, BrainCircuit, Wind, User, Droplets, Calendar,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

// --- (Helper Functions and Child Components remain the same) ---
const getRiskColor = (riskLevel) => {
    const colors = { "Very Low": "#22c55e", "Low": "#84cc16", "Moderate": "#eab308", "High": "#f97316", "Very High": "#ef4444" };
    return colors[riskLevel] || "#6b7280";
};

const getRiskBadgeStyle = (riskLevel) => {
    const styles = {
        "Very High": { backgroundColor: '#fee2e2', color: '#991b1b' },
        "High": { backgroundColor: '#ffedd5', color: '#9a3412' },
        "Moderate": { backgroundColor: '#fef3c7', color: '#854d0e' },
        "Low": { backgroundColor: '#ecfccb', color: '#365314' },
        "Very Low": { backgroundColor: '#dcfce7', color: '#166534' },
    };
    return styles[riskLevel] || { backgroundColor: '#f3f4f6', color: '#4b5563' };
};

const Card = ({ children, style, borderColor }) => <View style={[styles.card, style, borderColor && { borderLeftWidth: 4, borderLeftColor: borderColor }]}>{children}</View>;
Card.Header = ({ children }) => <View style={styles.cardHeader}>{children}</View>;
Card.Title = ({ children }) => <Text style={styles.cardTitle}>{children}</Text>;
Card.Description = ({ children }) => <Text style={styles.cardDescription}>{children}</Text>;
Card.Content = ({ children }) => <View style={styles.cardContent}>{children}</View>;

const StatCard = ({ icon, label, value, t }) => (
    <View style={styles.statCard}>
        <View style={styles.statIconContainer}>{icon}</View>
        <Text style={styles.statValue}>{value ?? '--'}</Text>
        <Text style={styles.statLabel}>{t(label)}</Text>
    </View>
);

const EmptyState = ({ text }) => (
    <View style={styles.emptyState}>
        <Wind size={40} color="#9ca3af" />
        <Text style={styles.emptyStateText}>{text}</Text>
    </View>
);

const SeverityPieChart = ({ data }) => {
    if (!data || data.length === 0) return <EmptyState text="No Severity Data" />;
    const chartData = data.map(item => ({ name: item.name, population: item.value, color: item.fill, legendFontColor: '#6b7280', legendFontSize: 12 }));
    return <PieChart data={chartData} width={CHART_WIDTH} height={200} chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }} accessor="population" backgroundColor="transparent" paddingLeft="15" absolute />;
};

const SymptomBarChart = ({ data }) => {
    if (!data || data.labels.length === 0) return <EmptyState text="No Symptom Data" />;
    return <BarChart data={data} width={CHART_WIDTH} height={220} yAxisLabel="" yAxisSuffix="" fromZero chartConfig={styles.chartConfig} verticalLabelRotation={30} style={styles.chartStyle} />;
};

const MonthlyTrendLineChart = ({ data }) => {
    if (!data || data.labels.length === 0) return <EmptyState text="No Trend Data" />;
    return <LineChart data={data} width={CHART_WIDTH} height={220} chartConfig={styles.chartConfig} bezier style={styles.chartStyle} />;
};

const LiveAlertsDialog = ({ visible, onClose, alerts, t }) => (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={onClose}><View style={styles.modalBackdrop} /></TouchableWithoutFeedback>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t('live_alerts')}</Text>
                <Text style={styles.modalDescription}>{t('current_active_alerts')}</Text>
                <FlatList
                    data={alerts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <Card style={{ marginBottom: 12 }}>
                            <Card.Header><Card.Title>{t(item.title)}</Card.Title><Card.Description>{new Date(item.created_at).toLocaleString()}</Card.Description></Card.Header>
                            <Card.Content><Text style={styles.alertMessage}>{t(item.message)}</Text></Card.Content>
                        </Card>
                    )}
                    ListEmptyComponent={<EmptyState text="No active alerts." />}
                />
                <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={onClose}><Text style={styles.buttonText}>{t('close')}</Text></TouchableOpacity>
            </View>
        </View>
    </Modal>
);

const PredictionDialog = ({ visible, onClose, summaries, t }) => {
    const [selectedSummary, setSelectedSummary] = useState(null);
    useEffect(() => { if (visible && summaries.length > 0 && !selectedSummary) setSelectedSummary(summaries[0]); }, [visible, summaries]);

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={onClose}><View style={styles.modalBackdrop} /></TouchableWithoutFeedback>
                <View style={[styles.modalContent, { maxHeight: '90%' }]}>
                    <Text style={styles.modalTitle}>{t('ai_powered_alert_predictions')}</Text>
                    <Text style={styles.modalDescription}>{t('click_village_for_summary')}</Text>
                    <View style={styles.predictionContainer}>
                        <FlatList
                            style={styles.villageListColumn}
                            data={summaries}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.summaryItem, { borderLeftColor: getRiskColor(item.risk_level) }, selectedSummary?.id === item.id && styles.summaryItemSelected]}
                                    onPress={() => setSelectedSummary(item)}
                                >
                                    <Text style={styles.summaryVillage}>{item.village}</Text>
                                    <Text style={styles.summaryRisk}>{t(item.risk_level.toLowerCase())} {t('risk')} ({item.risk_percentage.toFixed(1)}%)</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<EmptyState text="No summaries available." />}
                        />
                        <View style={styles.summaryDetailColumn}>
                             {selectedSummary ? (
                                <FlatList
                                    data={[selectedSummary]}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({item}) => (
                                        <View>
                                            <Card borderColor={getRiskColor(item.risk_level)} style={{ marginBottom: 12 }}>
                                                <Card.Header><Card.Title>{item.village}</Card.Title><Card.Description>{item.district}, {item.state}</Card.Description></Card.Header>
                                                <Card.Content>
                                                    <View style={[styles.badge, getRiskBadgeStyle(item.risk_level)]}><Text style={[styles.badgeText, { color: getRiskBadgeStyle(item.risk_level).color }]}>{t(item.risk_level.toLowerCase())} {t('risk')} ({item.risk_percentage.toFixed(1)}%)</Text></View>
                                                    <Text style={styles.generatedText}>{t('generated_on')}: {new Date(item.created_at).toLocaleString()}</Text>
                                                </Card.Content>
                                            </Card>
                                            <Card>
                                                <Card.Header><Card.Title>{t('actionable_summary')}</Card.Title></Card.Header>
                                                <Card.Content><Text style={styles.summaryText}>{item.summary.replace(/<[^>]*>/g, '')}</Text></Card.Content>
                                            </Card>
                                        </View>
                                    )}
                                />
                            ) : <EmptyState text={t('select_village_to_see_summary')} />}
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.button, styles.buttonClose, { marginTop: 16 }]} onPress={onClose}><Text style={styles.buttonText}>{t('close')}</Text></TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// --- MAIN ADMIN DASHBOARD SCREEN ---
const AdminDashboard = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { t } = useTranslation();
    const router = useRouter(); // <-- FIX: Instantiate the router

    const [allVillagesData, setAllVillagesData] = useState([]);
    const [selectedVillageId, setSelectedVillageId] = useState(null);
    const [alertSummaries, setAlertSummaries] = useState([]);
    const [liveAlerts] = useState([
        { id: 1, title: "high_fever_outbreak", message: "high_fever_outbreak_message", created_at: "2025-09-15T10:00:00Z" },
        { id: 2, title: "water_contamination", message: "water_contamination_message", created_at: "2025-09-14T14:30:00Z" },
    ]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isAlertsDialogOpen, setAlertsDialogOpen] = useState(false);
    const [isPredictionDialogOpen, setPredictionDialogOpen] = useState(false);
    const [activeWatchlistTab, setActiveWatchlistTab] = useState('high');
    const [logoutLoading, setLogoutLoading] = useState(false);

    const mapRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    const fetchData = async (isRefresh = false) => {
        if (!isAuthenticated) return;
        if (isRefresh) setRefreshing(true); else setLoading(true);

        try {
            const [villagesResponse, summariesResponse] = await Promise.all([
                api.get("/dashboard/villages/"),
                api.get("/prediction/summaries/")
            ]);

            if (isMountedRef.current) {
                const sortedVillages = (villagesResponse.data || []).sort((a, b) => b.risk_percentage - a.risk_percentage);
                setAllVillagesData(sortedVillages);

                if (sortedVillages.length > 0 && !selectedVillageId) {
                    setSelectedVillageId(sortedVillages[0].id);
                }
                setAlertSummaries(summariesResponse.data?.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch admin dashboard data:", error);
            if(isMountedRef.current) {
                Toast.show({ type: 'error', text1: t('failed_to_load_dashboard_data') });
            }
        } finally {
            if(isMountedRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    const handleRefresh = () => fetchData(true);

    const handleLogout = async () => {
        if (logoutLoading) return;

        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        setLogoutLoading(true);
                        try {
                            await logout();
                        } catch (error) {
                            console.error('Logout error:', error);
                            Toast.show({ type: 'error', text1: 'Logout failed', text2: 'Please try again.'});
                        } finally {
                           if (isMountedRef.current) {
                               setLogoutLoading(false);
                           }
                        }
                    }
                }
            ]
        );
    };

    const selectedVillageData = useMemo(() => allVillagesData.find(v => v.id === selectedVillageId) || null, [selectedVillageId, allVillagesData]);

    useEffect(() => {
        if (selectedVillageData?.latitude && selectedVillageData?.longitude && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: selectedVillageData.latitude,
                longitude: selectedVillageData.longitude,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
            }, 1000);
        }
    }, [selectedVillageData]);

    const watchlistVillages = useMemo(() => {
        if (activeWatchlistTab === 'high') return allVillagesData.filter(v => v.risk_level === "High" || v.risk_level === "Very High");
        if (activeWatchlistTab === 'moderate') return allVillagesData.filter(v => v.risk_level === "Moderate");
        return allVillagesData.filter(v => v.risk_level === "Low" || v.risk_level === "Very Low");
    }, [activeWatchlistTab, allVillagesData]);

    // Data for Charts
    const severityPieData = useMemo(() => {
        if (!selectedVillageData?.severity_distribution) return [];
        const colors = { Mild: '#22c55e', Moderate: '#eab308', Severe: '#ef4444' };
        return Object.entries(selectedVillageData.severity_distribution).map(([name, value]) => ({ name: t(name.toLowerCase()), value, fill: colors[name] || '#6b7280' }));
    }, [selectedVillageData, t]);

    const symptomChartData = useMemo(() => {
        if (!selectedVillageData?.symptom_distribution) return { labels: [], datasets: [{ data: [] }] };
        const data = Object.entries(selectedVillageData.symptom_distribution).sort(([, a], [, b]) => b - a).slice(0, 5);
        return {
            labels: data.map(([name]) => t(name.toLowerCase())),
            datasets: [{ data: data.map(([, count]) => count) }]
        };
    }, [selectedVillageData, t]);

    const monthlyTrendData = useMemo(() => {
        if (!selectedVillageData?.monthly_trend) return { labels: [], datasets: [{ data: [] }] };
        const data = Object.entries(selectedVillageData.monthly_trend);
        return {
            labels: data.map(([month]) => t(month.toLowerCase())),
            datasets: [{ data: data.map(([, cases]) => cases), color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`, strokeWidth: 2 }]
        };
    }, [selectedVillageData, t]);
    
    // This component renders all content *above* the final list.
    const ListHeader = () => (
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

            <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4f46e5' }]} onPress={() => setAlertsDialogOpen(true)}>
                    <Siren size={16} color="white" />
                    <Text style={styles.actionButtonText}>{t('live_alerts')}</Text>
                    <View style={styles.actionBadge}><Text style={styles.actionBadgeText}>{liveAlerts.length}</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]} onPress={() => setPredictionDialogOpen(true)}>
                    <BrainCircuit size={16} color="white" />
                    <Text style={styles.actionButtonText}>{t('ai_predictions')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#16a34a' }]} onPress={() => Alert.alert(t('send_alert'), t('send_alert_message'))}>
                    <AlertTriangle size={16} color="white" />
                    <Text style={styles.actionButtonText}>{t('send_alert')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
                <StatCard t={t} icon={<Users size={22} color="#3b82f6" />} label="population" value={selectedVillageData?.population?.toLocaleString()} />
                <StatCard t={t} icon={<HeartPulse size={22} color="#f59e0b" />} label="total_cases" value={selectedVillageData?.total_cases} />
                <StatCard t={t} icon={<Skull size={22} color="#dc2626" />} label="deaths" value={selectedVillageData?.total_deaths} />
                <StatCard t={t} icon={<Hospital size={22} color="#8b5cf6" />} label="hospitalized" value={selectedVillageData?.hospitalized_cases} />
                <StatCard t={t} icon={<Activity size={22} color="#f97316" />} label="critical" value={selectedVillageData?.critical_cases} />
                <StatCard t={t} icon={<ShieldCheck size={22} color="#22c55e" />} label="recovered" value={selectedVillageData?.recovered_cases} />
            </View>

            <Card><Card.Header><Card.Title>{t('interactive_map')}</Card.Title></Card.Header><Card.Content><MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={{ latitude: 25.5, longitude: 93.5, latitudeDelta: 5, longitudeDelta: 5 }}>{allVillagesData.map(v => v.latitude && v.longitude && <Marker key={v.id} coordinate={{ latitude: v.latitude, longitude: v.longitude }} title={v.village_name} pinColor={v.id === selectedVillageId ? 'blue' : getRiskColor(v.risk_level)} onPress={() => setSelectedVillageId(v.id)} />)}</MapView></Card.Content></Card>
            <Card><Card.Header><Card.Title>{t('severity_distribution')}</Card.Title></Card.Header><Card.Content><SeverityPieChart data={severityPieData} /></Card.Content></Card>
            <Card><Card.Header><Card.Title>{t('symptom_distribution')}</Card.Title></Card.Header><Card.Content><SymptomBarChart data={symptomChartData} /></Card.Content></Card>
            <Card><Card.Header><Card.Title>{t('monthly_trend')}</Card.Title></Card.Header><Card.Content><MonthlyTrendLineChart data={monthlyTrendData} /></Card.Content></Card>

            {selectedVillageData && (
                <Card>
                    <Card.Header><Card.Title>{t('additional_info')}</Card.Title></Card.Header>
                    <Card.Content>
                        <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}><Droplets size={16} color="#6b7280" /><Text style={styles.infoLabel}>{t('water_status')}</Text></View>
                            <View style={[styles.badge, getRiskBadgeStyle(selectedVillageData.latest_water_assessment_status === 'Poor' ? 'High' : 'Low')]}><Text style={styles.badgeText}>{t(selectedVillageData.latest_water_assessment_status?.toLowerCase() || 'n_a')}</Text></View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}><Calendar size={16} color="#6b7280" /><Text style={styles.infoLabel}>{t('last_tested')}</Text></View>
                            <Text style={styles.infoValue}>{selectedVillageData.latest_water_assessment_date ? new Date(selectedVillageData.latest_water_assessment_date).toLocaleDateString() : t('n_a')}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}><ShieldCheck size={16} color="#6b7280" /><Text style={styles.infoLabel}>{t('completed_campaigns')}</Text></View>
                            <Text style={styles.infoValueBold}>{selectedVillageData.completed_campaigns}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}><Activity size={16} color="#6b7280" /><Text style={styles.infoLabel}>{t('ongoing_campaigns')}</Text></View>
                            <Text style={styles.infoValueBold}>{selectedVillageData.ongoing_campaigns}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View>
                            <Text style={styles.infoLabel}>{t('latest_alert')}</Text>
                            <Text style={styles.alertText}>{selectedVillageData.latest_rb_alerts || t('no_recent_alerts')}</Text>
                        </View>
                    </Card.Content>
                </Card>
            )}

            <Card>
                <Card.Header><Card.Title>{t('village_watchlist')}</Card.Title></Card.Header>
                <Card.Content>
                    <View style={styles.tabsContainer}>
                        <TouchableOpacity style={[styles.tab, activeWatchlistTab === 'high' && styles.tabActive]} onPress={() => setActiveWatchlistTab('high')}><Text style={[styles.tabText, activeWatchlistTab === 'high' && styles.tabTextActive]}>{t('high')}</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.tab, activeWatchlistTab === 'moderate' && styles.tabActive]} onPress={() => setActiveWatchlistTab('moderate')}><Text style={[styles.tabText, activeWatchlistTab === 'moderate' && styles.tabTextActive]}>{t('moderate')}</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.tab, activeWatchlistTab === 'low' && styles.tabActive]} onPress={() => setActiveWatchlistTab('low')}><Text style={[styles.tabText, activeWatchlistTab === 'low' && styles.tabTextActive]}>{t('low')}</Text></TouchableOpacity>
                    </View>
                </Card.Content>
            </Card>
        </View>
    );

    if (loading) return <SafeAreaView style={styles.safeArea}><View style={styles.centerContainer}><ActivityIndicator size="large" color="#1e3a8a" /><Text style={styles.loadingText}>{t('loading_dashboard')}</Text></View></SafeAreaView>;
    if (!user || !isAuthenticated) return <SafeAreaView style={styles.safeArea}><View style={styles.centerContainer}><Text style={styles.promptText}>{t('please_log_in')}</Text></View></SafeAreaView>;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* --- Corrected Header Layout --- */}
            <View style={styles.header}>
                {/* All content on the left side is now in this container */}
                <View style={styles.headerLeft}>
                    <View>
                        <Text style={styles.headerTitle}>{t("admin_dashboard")}</Text>
                        <Text style={styles.headerSubtitle}>{t("ministry_of_development_ner")}</Text>
                    </View>
                    {/* NEW: Container for user info, placed below the title */}
                    <View style={styles.userInfoContainer}>
                        <User size={16} color="#4b5563" />
                        <Text style={styles.userName}>{user?.name}</Text>
                    </View>
                </View>

                {/* MOVED: Logout button is now a direct child, pushed to the far right */}
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

            <FlatList
                ListHeaderComponent={ListHeader}
                data={watchlistVillages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                     <TouchableOpacity
                        style={[styles.watchlistItem, selectedVillageId === item.id && styles.watchlistItemSelected]}
                        onPress={() => setSelectedVillageId(item.id)}
                    >
                        <Text style={styles.watchlistVillageName}>{item.village_name}</Text>
                        <Text style={styles.watchlistVillageStats}>{item.total_cases} {t('cases')} | {item.risk_percentage}% {t('risk')}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <EmptyState text={`${t('no_villages_found_in')} ${t(activeWatchlistTab)} ${t('risk_category')}`} />
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                contentContainerStyle={{ paddingBottom: 32 }}
            />

            <LiveAlertsDialog visible={isAlertsDialogOpen} onClose={() => setAlertsDialogOpen(false)} alerts={liveAlerts} t={t} />
            <PredictionDialog visible={isPredictionDialogOpen} onClose={() => setPredictionDialogOpen(false)} summaries={alertSummaries} t={t} />
        </SafeAreaView>
    );
};

// --- STYLESHEET ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    container: { padding: 16, gap: 16 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
    promptText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
// In your styles object...
    header: { 
        paddingVertical: 12, 
        paddingHorizontal: 16, 
        backgroundColor: 'white', 
        borderBottomWidth: 1, 
        borderBottomColor: '#e5e7eb', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'column', // Aligns title and user info vertically
        alignItems: 'flex-start', // Aligns content to the left
    },
    headerTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#1f2937' 
    },
    headerSubtitle: { 
        fontSize: 12, 
        color: '#6b7280' 
    },
    // NEW: Style for the user info row
    userInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8, // Adds space between subtitle and user info
    },
    userName: { 
        color: '#4b5563', 
        fontWeight: '500',
        fontSize: 14,
    },
    logoutButton: { 
        padding: 8 
    },
    // REMOVED: headerRight is no longer needed
    card: { backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 },
    cardDescription: { fontSize: 14, color: '#6b7280' },
    cardContent: { paddingHorizontal: 16, paddingVertical: 16, alignItems: 'center' },
    villageHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
    riskBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    actionButtonsRow: { flexDirection: 'row', gap: 8 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6, position: 'relative' },
    actionButtonText: { color: 'white', fontSize: 13, fontWeight: '600' },
    actionBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'white' },
    actionBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
    statCard: { width: '31%', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, alignItems: 'center' },
    statIconContainer: { marginBottom: 6 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 },
    statLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center' },
    map: { width: SCREEN_WIDTH - 32, height: 250, borderRadius: 8, overflow: 'hidden' },
    chartConfig: { backgroundGradientFrom: "#ffffff", backgroundGradientTo: "#ffffff", color: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`, strokeWidth: 2, barPercentage: 0.5, useShadowColorFromDataset: false },
    chartStyle: { borderRadius: 8 },
    tabsContainer: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 4, marginBottom: 0 },
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
    alertText: { fontSize: 14, color: '#374151', lineHeight: 20, paddingTop: 4, width: '100%' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject },
    modalContent: { width: '90%', maxHeight: '85%', backgroundColor: 'white', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: '#1f2937' },
    modalDescription: { fontSize: 14, color: '#6B717F', marginBottom: 16 },
    button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    buttonClose: { backgroundColor: '#4f46e5', marginTop: 16 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    alertMessage: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
    predictionContainer: { flexDirection: 'row', flex: 1, gap: 12 },
    villageListColumn: { flex: 2, borderRightWidth: 1, borderRightColor: '#e5e7eb', paddingRight: 8 },
    summaryDetailColumn: { flex: 3, paddingLeft: 8 },
    summaryItem: { padding: 12, borderRadius: 8, marginBottom: 8, backgroundColor: '#f9fafb', borderLeftWidth: 4 },
    summaryItemSelected: { backgroundColor: '#e0e7ff' },
    summaryVillage: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
    summaryRisk: { fontSize: 12, color: '#6b7280' },
    summaryText: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
    generatedText: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start' },
    badgeText: { fontSize: 12, fontWeight: '600' },
});

export default AdminDashboard;