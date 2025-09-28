// app/index.js

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  TextInput,
  Linking,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';
import { useRouter } from "expo-router";
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import {
  ShieldCheck, HandHeart, Hospital, ArrowRight, DatabaseZap, GitBranch, Siren, BrainCircuit,
  Megaphone, Globe, Mountain, Coffee, Swords, CloudRain, Feather, Snowflake, Building, SquareStack
} from "lucide-react-native";
import api from "../lib/api";
import { useAuth } from '../lib/AuthContext';
import LocationSelector from './LocationSelector';

// --- CONVERTED CUSTOM COMPONENTS (No Changes Here) ---

const ProcessTimeline = ({ steps }) => {
  return (
    <View style={styles.timelineContainer}>
      {steps.map((step, index) => (
        <View key={index} style={styles.timelineStep}>
          <View style={styles.timelineIconWrapper}>
            <View style={styles.timelineIconBackground}>
              {step.icon}
            </View>
            {index < steps.length - 1 && <View style={styles.timelineConnector} />}
          </View>
          <View style={styles.timelineStepContent}>
            <Text style={styles.timelineTitle}>{step.title}</Text>
            <Text style={styles.timelineDescription}>{step.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const StateCards = () => {
    const { t } = useTranslation();
    const statesData = [
        { nameKey: "arunachal_pradesh", icon: <Mountain size={28} />, url: "https://arunachalhealth.com/", color: '#dbeafe' },
        { nameKey: "assam", icon: <Coffee size={28} />, url: "https://health.assam.gov.in/", color: '#dcfce7' },
        { nameKey: "manipur", icon: <Swords size={28} />, url: "https://mn.gov.in/", color: '#ede9fe' },
        { nameKey: "meghalaya", icon: <CloudRain size={28} />, url: "https://meghealth.gov.in/", color: '#e5e7eb' },
        { nameKey: "mizoram", icon: <SquareStack size={28} />, url: "https://health.mizoram.gov.in/", color: '#fce7f3' },
        { nameKey: "nagaland", icon: <Feather size={28} />, url: "https://health.nagaland.gov.in/", color: '#fef3c7' },
        { nameKey: "sikkim", icon: <Snowflake size={28} />, url: "http://health.sikkim.gov.in/", color: '#fee2e2' },
        { nameKey: "tripura", icon: <Building size={28} />, url: "https://health.tripura.gov.in/", color: '#ffedd5' },
    ];

    const handlePress = (url) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <View style={styles.stateCardsContainer}>
            {statesData.map((state) => (
                <TouchableOpacity key={state.nameKey} style={[styles.stateCard, { backgroundColor: state.color }]} onPress={() => handlePress(state.url)}>
                    {state.icon}
                    <Text style={styles.stateCardText}>{t(state.nameKey)}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const LanguageSelectorModal = ({ visible, onClose }) => {
  const { i18n } = useTranslation();
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'kha', name: 'Khasi' },
    { code: 'brx', name: 'Bodo' },
  ];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={onClose}>
        <View style={styles.langModalContent}>
          {languages.map(lang => (
            <TouchableOpacity key={lang.code} style={styles.langOption} onPress={() => changeLanguage(lang.code)}>
              <Text style={styles.langOptionText}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const AppHeader = ({ onLoginClick }) => {
  const { t } = useTranslation();
  const [langModalVisible, setLangModalVisible] = useState(false);
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image source={require('../assets/images/indian_flag.png')} style={styles.headerFlag} />
        <View>
          <Text style={styles.headerTitle}>{t("ministry_of_development")}</Text>
          <Text style={styles.headerSubtitle}>{t("north_eastern_region")}</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => setLangModalVisible(true)} style={styles.headerButton}>
          <Globe size={22} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onLoginClick} style={styles.headerButton}>
          <Text style={styles.headerLoginButton}>{t("login")}</Text>
        </TouchableOpacity>
      </View>
      <LanguageSelectorModal visible={langModalVisible} onClose={() => setLangModalVisible(false)} />
    </View>
  );
};

const HeroSection = ({ onRegisterClick, onLoginClick }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.heroContainer}>
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>
          {t("guarding_health")}{'\n'}
          <Text style={styles.heroTitleHighlight}>{t("of_seven_sisters")}</Text>
        </Text>
        <Text style={styles.heroDescription}>{t("unified_platform_description")}</Text>
        <View style={styles.heroButtonContainer}>
          <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={() => onRegisterClick("asha_worker")}>
            <Text style={styles.buttonTextPrimary}>{t("register_now")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={onLoginClick}>
            <Text style={styles.buttonTextSecondary}>{t("member_login")}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <StateCards />
    </View>
  );
};

const WhoWeServeSection = ({ onRegisterClick }) => {
  const { t } = useTranslation();
  const roles = [
    { icon: <HandHeart size={32} color="#15803d" />, role: "asha_worker", title: t("asha_workers"), description: t("asha_description"), color: '#f0fdf4'},
    { icon: <ShieldCheck size={32} color="#1d4ed8" />, role: "ngo", title: t("ngos"), description: t("ngo_description"), color: '#eff6ff' },
    { icon: <Hospital size={32} color="#b91c1c" />, role: "clinic", title: t("clinics"), description: t("clinic_description"), color: '#fef2f2' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("who_we_serve")}</Text>
      <Text style={styles.sectionDescription}>{t("dedicated_platform_description")}</Text>
      {roles.map((roleInfo) => (
        <View key={roleInfo.role} style={[styles.roleCard, {backgroundColor: roleInfo.color}]}>
          <View style={styles.roleIconContainer}>{roleInfo.icon}</View>
          <Text style={styles.roleTitle}>{roleInfo.title}</Text>
          <Text style={styles.roleDescription}>{roleInfo.description}</Text>
          <TouchableOpacity style={[styles.button, styles.buttonDark]} onPress={() => onRegisterClick(roleInfo.role)}>
            <Text style={styles.buttonTextPrimary}>{t("register_as")} {roleInfo.title}</Text>
            <ArrowRight size={16} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const HowItWorksSection = () => {
    const { t } = useTranslation();
    const steps = [
        { icon: <DatabaseZap size={24} color="#3b82f6" />, title: t("data_collection"), description: t("data_collection_description")},
        { icon: <GitBranch size={24} color="#f97316" />, title: t("rule_based_filtering"), description: t("rule_based_filtering_description")},
        { icon: <Siren size={24} color="#eab308" />, title: t("early_warnings"), description: t("early_warnings_description")},
        { icon: <BrainCircuit size={24} color="#8b5cf6" />, title: t("llm_powered_prediction"), description: t("llm_powered_prediction_description")},
        { icon: <Megaphone size={24} color="#ef4444" />, title: t("high_level_alerts"), description: t("high_level_alerts_description")},
    ];
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("how_it_works")}</Text>
            <Text style={styles.sectionDescription}>{t("process_description")}</Text>
            <ProcessTimeline steps={steps}/>
        </View>
    );
};

const AppFooter = () => {
    const { t } = useTranslation();
    return (
        <View style={styles.footer}>
            <Text style={styles.footerTitle}>{t("ministry_of_development")}</Text>
            <Text style={styles.footerSubtitle}>{t("north_eastern_region")}</Text>
            <Text style={styles.footerText}>{t("government_of_india")}</Text>
            <Text style={styles.footerText}>© 2025 {t("all_rights_reserved")}</Text>
        </View>
    );
};

const LoginDialog = ({ isOpen, onOpenChange }) => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
    }
  }, [isOpen]);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: t("please_fill_email_password") });
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        Toast.show({ type: 'success', text1: t("login_successful") });
        onOpenChange(false);
      } else {
        Toast.show({ type: 'error', text1: result.error });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: "Login failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent={true} animationType="slide" onRequestClose={() => onOpenChange(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => onOpenChange(false)}>
            <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
                <Text style={styles.modalTitle}>{t("login_to_health_portal")}</Text>
                <Text style={styles.modalDescription}>{t("login_description")}</Text>
                <Text style={styles.label}>{t("email")}</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="user@example.com" 
                  value={email} 
                  onChangeText={setEmail} 
                  keyboardType="email-address" 
                  autoComplete="email" 
                  autoCapitalize="none"
                />
                <Text style={styles.label}>{t("password")}</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter password" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                />
                <TouchableOpacity 
                  style={[styles.button, styles.buttonDark, styles.buttonFullWidth, { marginTop: 20 }]} 
                  onPress={handleLogin} 
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="white"/> : <Text style={styles.buttonTextPrimary}>{t("login")}</Text>}
                </TouchableOpacity>
            </TouchableOpacity>
        </TouchableOpacity>
    </Modal>
  );
};

// --- FIXED REGISTER DIALOG ---
const RegisterDialog = ({ isOpen, onOpenChange, initialRole }) => {
    const { t } = useTranslation();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState(initialRole);
    const formInitialized = useRef(false);

    const [form, setForm] = useState({
        name: "", email: "", password: "", confirmPassword: "",
        state: "", district: "", village: "",
    });

    // Update the role if the initialRole prop changes
    useEffect(() => {
        if (initialRole && initialRole !== selectedRole) {
            setSelectedRole(initialRole);
        }
    }, [initialRole]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen && !formInitialized.current) {
            setForm({
                name: "", email: "", password: "", confirmPassword: "",
                state: "", district: "", village: "",
            });
            formInitialized.current = true;
        } else if (!isOpen) {
            formInitialized.current = false;
        }
    }, [isOpen]);

    const handleLocationChange = (field, value) => {
        setForm(prevForm => ({
            ...prevForm,
            [field]: value || ""
        }));
    };
    
    const handleRegister = async () => {
        if (!form.name || !form.email || !form.password || !form.confirmPassword) {
            Toast.show({ type: 'error', text1: "Please fill all required fields" });
            return;
        }

        if (form.password !== form.confirmPassword) {
            Toast.show({ type: 'error', text1: t("passwords_do_not_match") });
            return;
        }

        if (!form.state) {
            Toast.show({ type: 'error', text1: "Please select a state" });
            return;
        }

        setLoading(true);
        try {
            // Step 1: Register the user
            await api.post("/users/register/", {
                name: form.name, 
                role: selectedRole, 
                state: form.state,
                district: form.district || "", 
                village: form.village || "", 
                email: form.email,
                password: form.password, 
                password2: form.confirmPassword,
            });

            Toast.show({ type: 'success', text1: t("registration_successful") });
            
            // Step 2: Automatically log them in
            const loginResult = await login(form.email, form.password);
            
            if (loginResult.success) {
                onOpenChange(false); // Close modal
            } else {
                Toast.show({ type: 'error', text1: "Registration successful but login failed. Please login manually." });
            }

        } catch (error) {
            console.error("Registration error:", error);
            const errorMessage = error.response?.data?.email?.[0] || 
                               error.response?.data?.error || 
                               error.response?.data?.detail || 
                               t("registration_failed");
            Toast.show({ type: 'error', text1: errorMessage });
        } finally {
            setLoading(false);
        }
    };
    
    const getRoleDisplayName = (role) => {
        const roleMap = {
            asha_worker: t("asha_workers"), 
            ngo: t("ngos"), 
            clinic: t("clinics")
        };
        return roleMap[role] || role;
    };

    const getNameLabel = (role) => {
        const labelMap = {
            asha_worker: t("full_name"), 
            ngo: t("ngo_name"), 
            clinic: t("clinic_name")
        };
        return labelMap[role] || t("name");
    };

    if (!isOpen) return null;

    return (
        <Modal visible={isOpen} transparent={true} animationType="slide" onRequestClose={() => onOpenChange(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => onOpenChange(false)}>
                <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>
                            {t("register_as_a")} {getRoleDisplayName(selectedRole)}
                        </Text>
                        <Text style={styles.modalDescription}>{t("register_description")}</Text>

                        <Text style={styles.label}>{getNameLabel(selectedRole)} *</Text>
                        <TextInput 
                            style={styles.input} 
                            value={form.name} 
                            onChangeText={(text) => setForm(f => ({ ...f, name: text }))}
                            placeholder={`Enter ${getNameLabel(selectedRole).toLowerCase()}`}
                        />
                        
                        <Text style={styles.label}>{t("location")} *</Text>
                        <LocationSelector
                            state={form.state} 
                            district={form.district} 
                            village={form.village}
                            onChange={handleLocationChange}
                        />

                        <Text style={styles.label}>{t("email")} *</Text>
                        <TextInput 
                            style={styles.input} 
                            value={form.email} 
                            onChangeText={(text) => setForm(f => ({ ...f, email: text }))} 
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder="Enter email address"
                        />
                        
                        <Text style={styles.label}>{t("password")} *</Text>
                        <TextInput 
                            style={styles.input} 
                            value={form.password} 
                            onChangeText={(text) => setForm(f => ({ ...f, password: text }))} 
                            secureTextEntry 
                            placeholder="Enter password"
                        />

                        <Text style={styles.label}>{t("confirm_password")} *</Text>
                        <TextInput 
                            style={styles.input} 
                            value={form.confirmPassword} 
                            onChangeText={(text) => setForm(f => ({ ...f, confirmPassword: text }))} 
                            secureTextEntry 
                            placeholder="Confirm password"
                        />
                        
                        <TouchableOpacity 
                            style={[styles.button, styles.buttonDark, styles.buttonFullWidth, { marginTop: 20 }]} 
                            onPress={handleRegister} 
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white"/> 
                            ) : (
                                <Text style={styles.buttonTextPrimary}>{t("create_account")}</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

// --- MAIN LANDING SCREEN ---
export default function LandingScreen() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [initialRole, setInitialRole] = useState("asha_worker");

  const openRegisterModal = (role) => {
    setInitialRole(role);
    setIsRegisterOpen(true);
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader onLoginClick={() => setIsLoginOpen(true)} />
      <ScrollView>
        <HeroSection onRegisterClick={openRegisterModal} onLoginClick={() => setIsLoginOpen(true)} />
        <WhoWeServeSection onRegisterClick={openRegisterModal} />
        <HowItWorksSection />
        <AppFooter />
      </ScrollView>
      <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />
      <RegisterDialog isOpen={isRegisterOpen} onOpenChange={setIsRegisterOpen} initialRole={initialRole} />
    </SafeAreaView>
  );
}

// --- STYLESHEET ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 80, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerFlag: { width: 40, height: 26, borderRadius: 3, marginRight: 12 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerButton: { padding: 8 },
  headerLoginButton: { color: '#2563EB', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  heroContainer: { minHeight: 600, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#EFF6FF' },
  heroContent: { alignItems: 'center', padding: 24, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 12, width: '100%' },
  heroTitle: { fontSize: 36, fontWeight: '800', textAlign: 'center', color: '#1F2937' },
  heroTitleHighlight: { color: '#16a34a' },
  heroDescription: { fontSize: 18, color: '#4B5563', textAlign: 'center', marginVertical: 16 },
  heroButtonContainer: { flexDirection: 'column', alignSelf: 'stretch', marginTop: 24 },
  button: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, marginVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: '#16a34a' },
  buttonDark: { backgroundColor: '#1F2937'},
  buttonTextPrimary: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  buttonSecondary: { borderWidth: 2, borderColor: '#2563EB' },
  buttonTextSecondary: { color: '#2563EB', fontSize: 16, fontWeight: 'bold' },
  buttonFullWidth: { alignSelf: 'stretch' },
  section: { padding: 20, backgroundColor: 'white' },
  sectionTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  sectionDescription: { fontSize: 16, color: '#6B717F', textAlign: 'center', marginBottom: 32 },
  roleCard: { alignItems: 'center', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  roleIconContainer: { padding: 16, backgroundColor: 'white', borderRadius: 999, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 3 },
  roleTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  roleDescription: { color: '#6B717F', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', maxHeight: '85%', backgroundColor: 'white', borderRadius: 12, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  modalDescription: { fontSize: 14, color: '#6B717F', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: { height: 44, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginBottom: 10 },
  timelineContainer: { paddingHorizontal: 20, alignItems: 'flex-start' },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  timelineIconWrapper: { alignItems: 'center', marginRight: 20 },
  timelineIconBackground: { backgroundColor: '#e0e7ff', padding: 12, borderRadius: 999 },
  timelineConnector: { flex: 1, width: 2, backgroundColor: '#cbd5e1', marginTop: 8 },
  timelineStepContent: { flex: 1, backgroundColor: '#f8fafc', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  timelineTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  timelineDescription: { fontSize: 14, color: '#4B5563', marginTop: 4 },
  stateCardsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 10, marginTop: 20 },
  stateCard: { width: '45%', aspectRatio: 1, margin: '2.5%', borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 10 },
  stateCardText: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#1F2937', textAlign: 'center' },
  footer: { padding: 24, backgroundColor: '#1e3a8a', alignItems: 'center' },
  footerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  footerSubtitle: { fontSize: 14, color: '#93c5fd' },
  footerText: { fontSize: 12, color: '#93c5fd', marginTop: 4 },
  langModalContent: { backgroundColor: 'white', borderRadius: 10, padding: 10, position: 'absolute', top: 70, right: 16, minWidth: 120, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  langOption: { paddingVertical: 12, paddingHorizontal: 16 },
  langOptionText: { fontSize: 16 },
});