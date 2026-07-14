import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuthStore } from "../../store/authStore";

const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function AdminProfileSettings() {
  const router = useRouter();
  
  // Connect directly to the global authentication context layer
  const { user, logout, updateProfile } = useAuthStore();
  
  // State configurations synced with global credentials
  const [adminName, setAdminName] = useState(user?.name || "");
  const [adminEmail, setAdminEmail] = useState(user?.email || "");
  const [storeName, setStoreName] = useState(user?.storeName || "Dhaka Premium Hub");
  
  // Application environment preference states
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Keep state variables accurate if underlying global context mutates
  useEffect(() => {
    if (user) {
      setAdminName(user.name || "");
      setAdminEmail(user.email || "");
      if (user.storeName) setStoreName(user.storeName);
    }
  }, [user]);

  // Compute initials organically from live inputs
  const getInitials = (nameString) => {
    const cleanString = nameString?.trim() || "A";
    return cleanString
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
const updateProfileRequest = async () => {
  setIsSaving(true);

  const payload = {
    userId: user.id,
    name: adminName.trim(),
    email: adminEmail.trim(),
  };



  try {
    const response = await fetch(`${API_URL}/api/admin/profile/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Server returned an invalid response (${response.status}).`
      );
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to update profile.");
    }

    if (typeof updateProfile === "function") {
      updateProfile(data.data);
    }

    Alert.alert(
      "Success",
      "Profile updated successfully."
    );
  } catch (error) {


    Alert.alert(
      "Error",
      error.message || "Unable to update profile."
    );
  } finally {
    setIsSaving(false);
  }
};

const handleSaveChanges = () => {
  if (!adminName.trim() || !adminEmail.trim()) {
    Alert.alert(
      "Validation Error",
      "Name and email are required."
    );
    return;
  }

  Alert.alert(
    "Update Profile",
    "Are you sure you want to save these profile changes?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Update",
        onPress: updateProfileRequest,
      },
    ]
  );
};
  const handleRegisterNewAdmin = () => {
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
          onPress: async () => {
            try {
              await logout();
              router.replace("/");
            } catch (err) {
              console.error("Logout process exception:", err);
            }
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

        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.iconButton]} 
            onPress={handleSaveChanges}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Ionicons name="checkmark-outline" size={22} color="#10B981" />
            )}
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
       <View style={styles.profileCard}>
  <View style={styles.profileImageWrapper}>
    <Image
      source={{
        uri:
          user?.image?.url ||
          "https://ui-avatars.com/api/?name=" +
            encodeURIComponent(adminName || "Admin"),
      }}
      style={styles.profileImage}
    />

    <View style={styles.onlineIndicator} />

    <TouchableOpacity
      style={styles.editImageButton}
      onPress={() => {
        // Open Image Picker
      }}
    >
      <Ionicons name="camera-outline" size={16} color="#FFF" />
    </TouchableOpacity>
  </View>

  <Text style={styles.profileName}>
    {adminName || "System Administrator"}
  </Text>

  <Text style={styles.profileEmail}>
    {adminEmail}
  </Text>

  <View style={styles.roleContainer}>
    <Ionicons
      name="shield-checkmark"
      size={14}
      color="#2563EB"
    />
    <Text style={styles.roleText}>
      Root Administrator
    </Text>
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

          {/* Action Row: Register New Admin */}
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

          {/* <View style={styles.switchRowItemLast}>
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
          </View> */}
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  logoutIconButton: { backgroundColor: "#FFF7F7", borderColor: "#FECACA" },
 profileCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 18,
  paddingVertical: 28,
  paddingHorizontal: 20,
  alignItems: "center",
  marginBottom: 24,
  borderWidth: 1,
  borderColor: "#E2E8F0",

},

profileImageWrapper: {
  position: "relative",
  marginBottom: 18,
},

profileImage: {
  width: 110,
  height: 110,
  borderRadius: 55,
  borderWidth: 4,
  borderColor: "#FFFFFF",
  backgroundColor: "#F1F5F9",
},

onlineIndicator: {
  position: "absolute",
  right: 6,
  bottom: 8,

  width: 18,
  height: 18,
  borderRadius: 9,

  backgroundColor: "#22C55E",
  borderWidth: 3,
  borderColor: "#FFFFFF",
},

editImageButton: {
  position: "absolute",
  right: -4,
  top: -2,

  width: 34,
  height: 34,
  borderRadius: 17,

  backgroundColor: "#2563EB",

  justifyContent: "center",
  alignItems: "center",

  shadowColor: "#2563EB",
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 5,
},

profileName: {
  fontSize: 22,
  fontWeight: "700",
  color: "#0F172A",
},

profileEmail: {
  fontSize: 14,
  color: "#64748B",
  marginTop: 6,
},

roleContainer: {
  flexDirection: "row",
  alignItems: "center",

  marginTop: 16,

  backgroundColor: "#EFF6FF",

  paddingHorizontal: 14,
  paddingVertical: 8,

  borderRadius: 100,
},

roleText: {
  marginLeft: 6,
  color: "#2563EB",
  fontWeight: "700",
  fontSize: 13,
},
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