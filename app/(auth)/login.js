import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { registerForPushNotificationsAsync } from "../services/notification";

const { width } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [role, setRole] = useState("manager"); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [error, setError] = useState("");
  const [focusedInput, setFocusedInput] = useState(null);

  const isTargetAdmin = role === "admin";
  const activeColor = isTargetAdmin ? "#EF4444" : "#2563EB"; 
  const activeBgLight = isTargetAdmin ? "#FEF2F2" : "#EFF6FF";

  const handleLogin = async () => {
    setError("");
    
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please fill in all security configuration fields.");
      return;
    }

    // Replace this with your actual local or production server address string
    const BACKEND_URL = "https://abdur-rahman-shoes-web-app.vercel.app/api/admin/login"; 

    try {
        const expoToken =await registerForPushNotificationsAsync();
      // 1. Fire the network request payload to the backend router route
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          role: role,
          expoToken: expoToken || null, 
        }),
      });

      const result = await response.json();

      // 2. Check if the server rejected the authentication parameters
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Invalid credentials. Please verify data and try again.");
      }

      // 3. Update your Zustand/Auth store layout using the returned database records
      // Pass the returned user data objects down into your save state hook logic
      await login(result.data); 
      
      // 4. Redirect onto the secured app routing directory structure
      router.replace("/(app)"); 
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding Section */}
        <View style={styles.headerSection}>
          <View style={[styles.logoContainer, { backgroundColor: activeBgLight }]}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
            />
          </View>
          <Text style={styles.brandTitle}>Welcome Back</Text>
          <Text style={styles.brandSubtitle}>Smart Inventory Management</Text>
        </View>

        {/* Modern Pill Segmented Role Switcher */}
        <View style={styles.tabCapsuleContainer}>
          <TouchableOpacity
            style={[
              styles.tabCapsule,
              role === "manager" && styles.activeTabCapsule
            ]}
            onPress={() => { setRole("manager"); setError(""); }}
            activeOpacity={0.9}
          >
            <Ionicons 
              name={role === "manager" ? "cube" : "cube-outline"} 
              size={18} 
              color={role === "manager" ? "#2563EB" : "#64748B"} 
            />
            <Text style={[styles.tabText, role === "manager" && styles.activeTabTextManager]}>
              Stock Manager
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabCapsule,
              role === "admin" && styles.activeTabCapsule
            ]}
            onPress={() => { setRole("admin"); setError(""); }}
            activeOpacity={0.9}
          >
            <Ionicons 
              name={role === "admin" ? "shield-checkmark" : "shield-checkmark-outline"} 
              size={18} 
              color={role === "admin" ? "#EF4444" : "#64748B"} 
            />
            <Text style={[styles.tabText, role === "admin" && styles.activeTabTextAdmin]}>
              System Admin
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Form Card Wrapper */}
        <View style={styles.formCardContainer}>
          {error ? (
            <View style={styles.errorAlertBlock}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorAlertText}>{error}</Text>
            </View>
          ) : null}

          {/* Email Form Entry Area */}
          <View style={styles.inputControlGroup}>
            <Text style={styles.inputLabelText}>Email Address</Text>
            <View style={[
              styles.inputWrapperFrame,
              focusedInput === "email" && { borderColor: activeColor }
            ]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={focusedInput === "email" ? activeColor : "#94A3B8"} 
                style={styles.inputIconSpacer} 
              />
              <TextInput
                style={styles.textInputField}
                placeholder="name@company.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          {/* Password Form Entry Area */}
          <View style={styles.inputControlGroup}>
            <Text style={styles.inputLabelText}>Password</Text>
            <View style={[
              styles.inputWrapperFrame,
              focusedInput === "password" && { borderColor: activeColor }
            ]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={focusedInput === "password" ? activeColor : "#94A3B8"} 
                style={styles.inputIconSpacer} 
              />
              <TextInput
                style={styles.textInputField}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={secureText}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeBtnContainer}>
                <Ionicons 
                  name={secureText ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#64748B" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.primarySubmitBtn, { backgroundColor: activeColor }]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnContentLayout}>
                <Text style={styles.primarySubmitBtnText}>
                  Authenticate Workspace
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: "center", 
    paddingHorizontal: 24, 
    paddingTop: 40,
    paddingBottom: 40 
  },
  
  // FIXED: Adjusted logo container heights to prevent overlapping gesture blockages
  headerSection: { alignItems: "center", marginBottom: 32 },
  logoContainer: { 
    width: 120, 
    height: 120, 
    borderRadius: 24, 
    alignItems: "center", 
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logo: { width: 100, height: 100, resizeMode: "contain" },
  brandTitle: { fontSize: 26, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 14, color: "#64748B", fontWeight: "500", marginTop: 4 },

  tabCapsuleContainer: { 
    flexDirection: "row", 
    backgroundColor: "#E2E8F0", 
    borderRadius: 16, 
    padding: 4, 
    marginBottom: 24,
  },
  tabCapsule: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 12, 
    borderRadius: 12,
    gap: 8,
  },
  activeTabCapsule: { 
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  activeTabTextManager: { color: "#2563EB", fontWeight: "700" },
  activeTabTextAdmin: { color: "#EF4444", fontWeight: "700" },

  formCardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  errorAlertBlock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  errorAlertText: { color: "#EF4444", fontSize: 13, fontWeight: "600", flex: 1 },
  
  inputControlGroup: { marginBottom: 20 },
  inputLabelText: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 8 },
  inputWrapperFrame: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#F8FAFC", 
    borderWidth: 1.5, 
    borderColor: "#E2E8F0", 
    borderRadius: 14, 
    height: 52, 
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  inputIconSpacer: { marginRight: 12 },
  textInputField: { flex: 1, color: "#0F172A", fontSize: 15, height: "100%", fontWeight: "500" },
  eyeBtnContainer: { padding: 6 },

  primarySubmitBtn: { 
    height: 52, 
    borderRadius: 14, 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  btnContentLayout: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  primarySubmitBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15, letterSpacing: -0.1 },
});