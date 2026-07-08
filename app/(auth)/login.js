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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [role, setRole] = useState("manager"); // Pure JS string initialization
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [error, setError] = useState("");

  const isTargetAdmin = role === "admin";
  const activeColor = isTargetAdmin ? "#EF4444" : "#3B82F6";
  const activeBgLight = isTargetAdmin ? "#FEF2F2" : "#EFF6FF";

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please fill in all layout fields.");
      return;
    }

    try {
      await login(email, password, role);
      router.replace("/(app)"); 
    } catch (err) {
      setError("Invalid credentials. Please try again.");
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
        <View style={styles.headerSection}>
          <View style={[styles.logoIconBg, { backgroundColor: activeBgLight }]}>
            <Ionicons name="footprint-outline" size={32} color={activeColor} />
          </View>
          <Text style={styles.brandTitle}>SoleControl</Text>
          <Text style={styles.brandSubtitle}>Inventory & Stock Management</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              role === "manager" && { backgroundColor: "#FFF", borderColor: "#E2E8F0" }
            ]}
            onPress={() => { setRole("manager"); setError(""); }}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="cube-outline" 
              size={18} 
              color={role === "manager" ? "#3B82F6" : "#64748B"} 
            />
            <Text style={[styles.tabText, role === "manager" && styles.activeTabText]}>
              Stock Manager
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              role === "admin" && { backgroundColor: "#FFF", borderColor: "#E2E8F0" }
            ]}
            onPress={() => { setRole("admin"); setError(""); }}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="shield-checkmark-outline" 
              size={18} 
              color={role === "admin" ? "#EF4444" : "#64748B"} 
            />
            <Text style={[styles.tabText, role === "admin" && styles.activeTabText]}>
              System Admin
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.errorAlertText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="name@company.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry={secureText}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeBtn}>
              <Ionicons 
                name={secureText ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: activeColor }]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                Authenticate as {isTargetAdmin ? "Admin" : "Manager"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContainer: { flexGrow: 1, justifyContext: "center", padding: 24, justifyContent: "center" },
  headerSection: { alignItems: "center", marginBottom: 32 },
  logoIconBg: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  brandTitle: { fontSize: 28, fontWeight: "700", color: "#0F172A" },
  brandSubtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },
  tabContainer: { flexDirection: "row", backgroundColor: "#E2E8F0", padding: 4, borderRadius: 12, marginBottom: 28 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 9, borderWidth: 1, borderColor: "transparent" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748B", marginLeft: 6 },
  activeTabText: { color: "#0F172A" },
  formContainer: { backgroundColor: "#FFF", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  errorAlert: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: "#FEE2E2" },
  errorAlertText: { fontSize: 13, color: "#EF4444", fontWeight: "500", marginLeft: 8, flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, height: 50, marginBottom: 20, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#0F172A", fontSize: 15, height: "100%" },
  eyeBtn: { padding: 4 },
  submitButton: { height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 },
  submitButtonText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
});