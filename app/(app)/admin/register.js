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
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { uploadImages } from "../../upload/upload";

export default function NewAdminRegistration() {
  const router = useRouter();

  // Form Field States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminList, setAdmins] = useState([]); 

  // FIXED: Sync default state parameter with list configurations
  const [selectedRole, setSelectedRole] = useState("Admin"); 
  const rolesList = ["Admin", "Manager"]; // Expanded option pool based on your login schema layouts

  // Toggle Visibility for sensitive fields
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);

  // Profile picture image picking processor
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need storage access permissions to upload your profile layout picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCreateAdmin = async () => {
    // Prevent double execution lines
    if (isSubmitting) return;

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanEmployeeId = employeeId.trim().toUpperCase();
    const cleanPassword = password.trim();

    // FIXED: Enforce robust form validation rules
    if (!cleanName || !cleanEmail || !cleanEmployeeId || !cleanPassword || !confirmPassword) {
      Alert.alert("Missing Details", "Please fill out all operational fields completely.");
      return;
    }

    if (cleanPassword.length < 6) {
      Alert.alert("Weak Password", "Initial Master Password must be minimum 6 characters.");
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      Alert.alert("Password Mismatch", "Verification values do not match. Verify your input strings.");
      return;
    }

    setIsSubmitting(true);
    const BACKEND_URL = "https://abdur-rahman-shoes-web-app.vercel.app/api/admin/adminRegister"; 

    try {
      let remoteUrl = null;

      if (image) {
        const imageFormData = new FormData();
        imageFormData.append("images", {
          uri: image,
          name: `admin-${Date.now()}.jpg`,
          type: "image/jpeg",
        });

        const remoteUrls = await uploadImages(imageFormData);
        if (!remoteUrls || remoteUrls.length === 0) {
          throw new Error("Image cloud infrastructure upload failed");
        }
        remoteUrl = remoteUrls[0];
      }
      
      // FIXED: Added missing tracking payloads to synchronize perfectly with your API endpoint rules
      const payload = {
        name: cleanName,
        email: cleanEmail,
        employeeId: cleanEmployeeId,
        role: selectedRole.toLowerCase(),
        password: cleanPassword,
        image: remoteUrl, 
      };

 

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "The registration system engine rejected this configuration request.");
      }

      const confirmedManager = {
        id: result.data?.id || result.id || String(Date.now()),
        name: cleanName,
        email: cleanEmail,
        employeeId: cleanEmployeeId,
        role: selectedRole,
        status: "Active",
        image: remoteUrl || image, 
      };

      setAdmins([confirmedManager, ...adminList]);
      Alert.alert("Success", `Account for ${cleanName} (${selectedRole}) has been authorized into live topologies.`);
      
      // Clean form layouts clean
      setFullName("");
      setEmail("");
      setEmployeeId("");
      setPassword("");
      setConfirmPassword("");
      setImage(null);

    } catch (error) {
      console.error("Manager profile deployment error:", error);
      Alert.alert("Deployment Error", error.message || "Could not register system credentials layout profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerRibbon}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isSubmitting}>
            <Ionicons name="arrow-back-outline" size={22} color={isSubmitting ? "#CBD5E1" : "#0F172A"} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.screenHeading}>Register Profile</Text>
            <Text style={styles.screenSubheading}>Provision system clearance credentials</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.iconButton, isSubmitting && { opacity: 0.5 }]} 
            onPress={handleCreateAdmin}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={22} color="#3B82F6" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionHeadingTitle}>Profile Graphic</Text>
        <View style={styles.avatarPickerCard}>
          <TouchableOpacity 
            style={styles.avatarPickerTarget} 
            onPress={pickImage} 
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.avatarPickerImage} />
            ) : (
              <View style={styles.avatarPickerFallbackContent}>
                <Ionicons name="camera" size={26} color="#64748B" />
                <Text style={styles.avatarPickerFallbackText}>Upload Portrait</Text>
              </View>
            )}
          </TouchableOpacity>
          {image && !isSubmitting && (
            <TouchableOpacity style={styles.clearAvatarBtn} onPress={() => setImage(null)}>
              <Text style={styles.clearAvatarBtnText}>Remove Image</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionHeadingTitle}>Identity & Workspace</Text>
        <View style={styles.formContainerCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.textInputField}
              value={fullName}
              onChangeText={setFullName}
              editable={!isSubmitting}
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
              editable={!isSubmitting}
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
              editable={!isSubmitting}
              autoCapitalize="characters"
              placeholder="e.g., RF-2026-991"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <Text style={styles.sectionHeadingTitle}>Clearance Level</Text>
        <View style={styles.roleSelectionCard}>
          <Text style={styles.roleCardInstructions}>
            Select the access parameter package assigned to this security profile token.
          </Text>
          <View style={styles.roleChipsRow}>
            {rolesList.map((roleItem) => {
              const isSelected = selectedRole === roleItem;
              return (
                <TouchableOpacity
                  key={roleItem}
                  style={[
                    styles.roleChipItem,
                    isSelected && styles.roleChipItemSelected
                  ]}
                  onPress={() => !isSubmitting && setSelectedRole(roleItem)}
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                >
                  <Text style={[
                    styles.roleChipText,
                    isSelected && styles.roleChipTextSelected
                  ]}>
                    {roleItem}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionHeadingTitle}>Access Verification Keys</Text>
        <View style={styles.formContainerCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Initial Master Password</Text>
            <View style={styles.passwordFieldContainer}>
              <TextInput
                style={[styles.textInputField, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                editable={!isSubmitting}
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
              editable={!isSubmitting}
              secureTextEntry={isPasswordSecure}
              autoCapitalize="none"
              placeholder="Repeat password code exactly"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <View style={styles.securityContextBox}>
          <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
          <Text style={styles.securityContextText}>
            Provisioning triggers a verification ticket. Newly registered team profiles require local sync before authorization becomes operational.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.primaryActionButton, isSubmitting && { backgroundColor: "#94A3B8" }]}
          activeOpacity={0.8}
          onPress={handleCreateAdmin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionButtonText}>Deploy Profile System Link</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// Keep your StyleSheet block unchanged below
const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  headerRibbon: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#E2E8F0" },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  backButton: { marginRight: 14, padding: 4 },
  headerTitleGroup: { flex: 1 },
  screenHeading: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  screenSubheading: { fontSize: 11, color: "#64748B", marginTop: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatarPickerCard: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", padding: 16, alignItems: "center", marginBottom: 24 },
  avatarPickerTarget: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#F8FAFC", borderStyle: "dashed", borderWidth: 1.5, borderColor: "#CBD5E1", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatarPickerFallbackContent: { alignItems: "center", justifyContent: "center" },
  avatarPickerFallbackText: { fontSize: 11, color: "#64748B", fontWeight: "600", marginTop: 4 },
  avatarPickerImage: { width: "100%", height: "100%", resizeMode: "cover" },
  clearAvatarBtn: { marginTop: 10 },
  clearAvatarBtnText: { fontSize: 13, color: "#EF4444", fontWeight: "600" },
  sectionHeadingTitle: { fontSize: 13, fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  formContainerCard: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 16, overflow: "hidden", marginBottom: 24 },
  inputGroup: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F1F5F9" },
  inputGroupLast: { paddingVertical: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 6 },
  textInputField: { fontSize: 14, fontWeight: "500", color: "#0F172A", paddingVertical: 4 },
  passwordFieldContainer: { flexDirection: "row", alignItems: "center" },
  roleSelectionCard: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", padding: 16, marginBottom: 24 },
  roleCardInstructions: { fontSize: 12, color: "#64748B", marginBottom: 14, lineHeight: 16 },
  roleChipsRow: { flexDirection: "row", gap: 8 },
  roleChipItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" },
  roleChipItemSelected: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
  roleChipText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  roleChipTextSelected: { color: "#3B82F6", fontWeight: "700" },
  securityContextBox: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#F0F9FF", borderRadius: 12, borderWidth: 1, borderColor: "#BAE6FD", marginBottom: 24 },
  securityContextText: { fontSize: 11, color: "#0369A1", marginLeft: 8, flex: 1, fontWeight: "500", lineHeight: 16 },
  primaryActionButton: { flexDirection: "row", backgroundColor: "#3B82F6", height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  primaryActionButtonText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});