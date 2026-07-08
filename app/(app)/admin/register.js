import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function NewAdminRegistration() {
  const router = useRouter();

  // Form Field States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [selectedRole, setSelectedRole] = useState("Manager"); // Default role setting
  const rolesList = ["Manager", "Supervisor", "Administrator"];

  // Toggle Visibility for sensitive fields
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const handleCreateAccount = () => {
    // 1. Basic Validation Controls
    if (!fullName || !email || !employeeId || !password || !confirmPassword){
      Alert.alert("Missing Fields", "Please populate all terminal input spaces before submission.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      Alert.alert("Invalid Email", "Please enter a valid administrative email pattern.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Security protocols require operational passwords to be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Mismatched Password", "The validation string confirmation field does not match.");
      return;
    }
    Alert.alert(
      "Provisioning Successful",
      `Profile identity configured for ${fullName}.\nRole: ${selectedRole}\nID: ${employeeId}`,
      [
        {
          text: "Proceed to Profile Screen",
          onPress: () => router.back(),
        },
      ]
    );
  };
  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerRibbon}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.screenHeading}>Register Admin</Text>
            <Text style={styles.screenSubheading}>Provision system clearance credentials</Text>
          </View>
        </View>

        {/* Custom Header Action - Form Save */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.iconButton]} 
            onPress={handleCreateAccount}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-upload-outline" size={22} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Section: Core Profile Information */}
        <Text style={styles.sectionHeadingTitle}>Identity & Workspace</Text>
        <View style={styles.formContainerCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.textInputField}
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g., Ahsan Habib"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Corporate Email</Text>
            <TextInput
              style={styles.textInputField}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="habib.admin@retailflow.com"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroupLast}>
            <Text style={styles.fieldLabel}>Employee Registry ID</Text>
            <TextInput
              style={styles.textInputField}
              value={employeeId}
              onChangeText={setEmployeeId}
              autoCapitalize="characters"
              placeholder="e.g., RF-2026-991"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Section: Dynamic Clearance Role Selector Component */}


        {/* Section: Secure Access Configuration */}
        <Text style={styles.sectionHeadingTitle}>Access Verification Keys</Text>
        <View style={styles.formContainerCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Initial Master Password</Text>
            <View style={styles.passwordFieldContainer}>
              <TextInput
                style={[styles.textInputField, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={isPasswordSecure}
                autoCapitalize="none"
                placeholder="Minimum 6 characters"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)}>
                <Ionicons 
                  name={isPasswordSecure ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#64748B" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroupLast}>
            <Text style={styles.fieldLabel}>Confirm Verification Password</Text>
            <TextInput
              style={styles.textInputField}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={isPasswordSecure}
              autoCapitalize="none"
              placeholder="Repeat password code exactly"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Dynamic Context Notification Panel */}
        <View style={styles.securityContextBox}>
          <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
          <Text style={styles.securityContextText}>
            Provisioning triggers a verification ticket. Newly registered team profiles require local sync before authorization becomes operational.
          </Text>
        </View>

        {/* Bottom Submission Action Trigger */}
        <TouchableOpacity 
          style={styles.primaryActionButton}
          activeOpacity={0.8}
          onPress={handleCreateAccount}
        >
          <Ionicons name="person-add-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryActionButtonText}>Deploy Profile System Link</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  headerRibbon: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    backgroundColor: "#FFF", 
    borderBottomWidth: 1, 
    borderColor: "#E2E8F0" 
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  backButton: { marginRight: 14, padding: 4 },
  headerTitleGroup: { flex: 1 },
  screenHeading: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  screenSubheading: { fontSize: 11, color: "#64748B", marginTop: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Matches Header Setup Design Requirements
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Consistent Modular Containers
  sectionHeadingTitle: { fontSize: 13, fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  formContainerCard: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 16, overflow: "hidden", marginBottom: 24 },
  inputGroup: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F1F5F9" },
  inputGroupLast: { paddingVertical: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 6 },
  textInputField: { fontSize: 14, fontWeight: "500", color: "#0F172A", paddingVertical: 4 },
  passwordFieldContainer: { flexDirection: "row", alignItems: "center" },

  // Role Selection Element Block Card
  roleSelectionCard: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", padding: 16, marginBottom: 24 },
  roleCardInstructions: { fontSize: 12, color: "#64748B", marginBottom: 14, lineHeight: 16 },
  roleChipsRow: { flexDirection: "row", justifyContent: "space-between" },
  roleChipItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, marginHorizontal: 4, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" },
  roleChipItemSelected: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
  roleChipText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  roleChipTextSelected: { color: "#3B82F6", fontWeight: "700" },

  // Info Alerts
  securityContextBox: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#F0F9FF", borderRadius: 12, borderWidth: 1, borderColor: "#BAE6FD", marginBottom: 24 },
  securityContextText: { fontSize: 11, color: "#0369A1", marginLeft: 8, flex: 1, fontWeight: "500", lineHeight: 16 },

  // Bottom Call-to-action Button Element 
  primaryActionButton: { flexDirection: "row", backgroundColor: "#3B82F6", height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  primaryActionButtonText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});