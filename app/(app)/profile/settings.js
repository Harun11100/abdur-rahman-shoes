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
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AdminProfileSettings() {
  const router = useRouter();

  // Mock initial Admin Profile Data
  const [adminName, setAdminName] = useState("Siddique Rahman");
  const [adminEmail, setAdminEmail] = useState("siddique.admin@retailflow.com");
  const [storeName, setStoreName] = useState("Dhaka Premium Hub");
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);

  const handleSaveChanges = () => {
    // Implement permanent DB/Context syncing logic here
    Alert.alert("Success", "Admin profile configurations updated successfully.");
  };

  const handleRegisterNewAdmin = () => {
    // Routes to your signup/registration sub-flow form
    Alert.alert(
      "System Forwarding", 
      "Opening secondary terminal provisioning window to add a new system user profile.",
      [
        { text: "Dismiss", style: "cancel" },
        { text: "Proceed", onPress: () => router.push("/admin/register") }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to securely exit the system panel?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            // Clear credentials, tokens here
            router.replace("/");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Modern Header Ribbon */}
      <View style={styles.headerRibbon}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.screenHeading}>Admin Profile</Text>
            <Text style={styles.screenSubheading}>Manage credentials, system policies</Text>
          </View>
        </View>

        {/* INTEGRATED: Your custom header actions with specific styling */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.iconButton]} 
            onPress={handleSaveChanges}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-outline" size={22} color="#10B981" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.iconButton, styles.logoutIconButton]} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Identity Avatar Section */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {adminName.split(" ").map(n => n[0]).join("")}
            </Text>
          </View>
          <Text style={styles.adminProfileName}>{adminName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Root Administrator</Text>
          </View>
        </View>

        {/* Section: Account Metadata Fields */}
        <Text style={styles.sectionHeadingTitle}>Identity Credentials</Text>
        <View style={styles.formContainerCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.textInputField}
              value={adminName}
              onChangeText={setAdminName}
              placeholder="Enter full name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.textInputField}
              value={adminEmail}
              onChangeText={setAdminEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter email address"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroupLast}>
            <Text style={styles.fieldLabel}>Assigned Retail Outlet</Text>
            <TextInput
              style={styles.textInputField}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Enter outlet branch"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Section: System Switches */}
        <Text style={styles.sectionHeadingTitle}>Preferences & Security</Text>
        <View style={styles.formContainerCard}>
          <View style={styles.switchRowItem}>
            <View style={styles.switchTextPane}>
              <Text style={styles.switchTitleText}>Low Stock Alerts</Text>
              <Text style={styles.switchDescText}>Push notifications when items fall under threshold.</Text>
            </View>
            <Switch
              value={isNotificationsEnabled}
              onValueChange={setIsNotificationsEnabled}
              trackColor={{ false: "#CBD5E1", true: "#A7F3D0" }}
              thumbColor={isNotificationsEnabled ? "#10B981" : "#64748B"}
            />
          </View>

          {/* NEW ACTION: Register New Admin Action Row Row */}
          <TouchableOpacity 
            style={styles.switchRowItem}
            onPress={handleRegisterNewAdmin}
            activeOpacity={0.6}
          >
            <View style={styles.switchTextPane}>
              <Text style={[styles.switchTitleText, { color: "#3B82F6" }]}>Add New System Admin</Text>
              <Text style={styles.switchDescText}>Provision a clean authentication identity profile for another manager.</Text>
            </View>
            <Ionicons name="person-add-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>

          <View style={styles.switchRowItemLast}>
            <View style={styles.switchTextPane}>
              <Text style={styles.switchTitleText}>Biometric Verification</Text>
              <Text style={styles.switchDescText}>Require FaceID/TouchID before logging batch sales.</Text>
            </View>
            <Switch
              value={isBiometricsEnabled}
              onValueChange={setIsBiometricsEnabled}
              trackColor={{ false: "#CBD5E1", true: "#A7F3D0" }}
              thumbColor={isBiometricsEnabled ? "#10B981" : "#64748B"}
            />
          </View>
        </View>

        {/* Informational Context Box */}
        <View style={styles.securityContextBox}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#64748B" />
          <Text style={styles.securityContextText}>
            Secured deployment build. System activity logs are strictly auditable on terminal instances.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  
  // Upper Header Layout Modifications
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
  scrollContent: { padding: 20 },

  // REQUIRED USER SPECIFIC CLASSES
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    // subtle shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutIconButton: {
    backgroundColor: "#FFF7F7",
    borderColor: "#FECACA",
  },

  // Interactive Form Blocks & Component Styling
  avatarCard: { 
    backgroundColor: "#FFF", 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#E2E8F0", 
    padding: 24, 
    alignItems: "center",
    marginBottom: 24 
  },
  avatarCircle: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: "#EFF6FF", 
    alignItems: "center", 
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE"
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: "#3B82F6" },
  adminProfileName: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginTop: 12 },
  roleBadge: { backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
  roleBadgeText: { fontSize: 11, fontWeight: "600", color: "#475569" },

  sectionHeadingTitle: { fontSize: 13, fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  formContainerCard: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 16, overflow: "hidden", marginBottom: 24 },
  
  inputGroup: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F1F5F9" },
  inputGroupLast: { paddingVertical: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 6 },
  textInputField: { fontSize: 14, fontWeight: "500", color: "#0F172A", paddingVertical: 4 },

  switchRowItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1, borderColor: "#F1F5F9" },
  switchRowItemLast: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16 },
  switchTextPane: { flex: 1, paddingRight: 16 },
  switchTitleText: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  switchDescText: { fontSize: 12, color: "#64748B", marginTop: 2, lineHeight: 16 },

  securityContextBox: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", marginTop: 4 },
  securityContextText: { fontSize: 11, color: "#64748B", marginLeft: 8, flex: 1, fontWeight: "500", lineHeight: 16 },
});