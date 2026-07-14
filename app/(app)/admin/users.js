import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { uploadImages } from "../../upload/upload";
import Constants from "expo-constants";
const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function ManageManagers() {
  const router = useRouter();
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState(null); // Stores a single string URI or null
  const [secureText, setSecureText] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

   const [managers, setManagers] = useState([]);
   const [isLoadingManagers, setIsLoadingManagers] = useState(true);
   const fetchManagers = async () => {
  try {
    setIsLoadingManagers(true);

    const response = await fetch(
      `${API_URL}/api/admin/getManagers`
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch managers.");
    }

    setManagers(result.data);
  } catch (error) {
 
    Alert.alert("Error", error.message);
  } finally {
    setIsLoadingManagers(false);
  }
};
useEffect(() => {
  fetchManagers();
}, []);

  // Handle image selection from device gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need camera roll access permissions to upload a profile avatar picture.");
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

  // Helper method to safely generate clean initials string
  const getInitials = (fullName) => {
    if (!fullName) return "M";
    return fullName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleCreateManager = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      Alert.alert("Missing Details", "Please fill out all operational fields.");
      return;
    }

    setIsSubmitting(true);
    const BACKEND_URL = `${API_URL}/api/admin/managerRegister`;

    try {
      let remoteUrl = null;

      // Fixed: Only upload if an image actually exists, and handle it as a single file instead of an array loop
      if (image) {
        const imageFormData = new FormData();
        
        // Since React Native's FormData requires an object structure for files:
        imageFormData.append("images", {
          uri: image,
          name: `manager-${Date.now()}.jpg`,
          type: "image/jpeg",
        });

        const remoteUrls = await uploadImages(imageFormData);
        if (!remoteUrls || remoteUrls.length === 0) {
          throw new Error("Image upload failed");
        }
        remoteUrl = remoteUrls[0];
      }
      
      // 1. Prepare payload with static variables
      const payload = {
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        image: remoteUrl, // Contains either the remote URL string or null
      };

    

      // 2. Execute network request
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // // 3. Verify server response state
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "The register system rejected this request.");
      }

      // 4. Update the local UI state array
      const confirmedManager = {
        id: result.data?.id || result.id || String(Date.now()),
        name: cleanName,
        email: cleanEmail,
        status: "Active",
        image: remoteUrl || image, // Use remote uploaded image path or fallback to local
      };

      setManagers([confirmedManager, ...managers]);
      Alert.alert("Success", `Account for ${cleanName} has been authorized.`);
      
      // 5. Clean out input layouts
      setName("");
      setEmail("");
      setPassword("");
      setImage(null);

    } catch (error) {
      console.error("Manager creation error:", error);
      Alert.alert("Error", error.message || "Could not create manager profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

const handleDeleteManager = (id, managerName) => {

  
  Alert.alert(
    "Revoke Clearance",
    `Are you sure you want to delete ${managerName}'s access credentials?`,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(
              `${API_URL}/api/admin/deleteManager/${id}`,
              {
                method: "DELETE",
              }
            );

            const data = await response.json();

            if (data.success) {
              // Remove deleted manager from UI
              setManagers((prevManagers) =>
                prevManagers.filter((manager) => manager._id !== id)
              );

              Alert.alert(
                "Success",
                "Manager deleted successfully."
              );
            } else {
              Alert.alert(
                "Error",
                data.message || "Failed to delete manager."
              );
            }

          } catch (error) {
          

            Alert.alert(
              "Error",
              "Something went wrong while deleting manager."
            );
          }
        },
      },
    ]
  );
};

  if (isLoadingManagers) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={{ marginTop: 12 }}>Loading Managers...</Text>
    </View>
  );
}

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Top Navigation Row */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Staff Accounts</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Intro Header Section */}
      <View style={styles.introSection}>
        <Text style={styles.mainTitle}>Add New Stock Manager</Text>
        <Text style={styles.subtitle}>
          Create operational checkout accounts. Managers can perform sales transactions and check quantities, but cannot alter baseline pricing or financials.
        </Text>
      </View>

      {/* Registration Form Box */}
      <View style={styles.formContainer}>
        
        {/* Profile Image Picker Input Target Component */}
        <View style={styles.imagePickerCenterBlock}>
          <TouchableOpacity style={styles.imagePickerFrame} onPress={pickImage} activeOpacity={0.85}>
            {image ? (
              <Image source={{ uri: image }} style={styles.selectedAvatarPreview} />
            ) : (
              <View style={styles.avatarPlaceholderWrapper}>
                <Ionicons name="camera-outline" size={24} color="#64748B" />
                <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {image && (
            <TouchableOpacity style={styles.removeImageBadge} onPress={() => setImage(null)}>
              <Text style={styles.removeImageText}>Clear Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.inputLabel}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g., Tanvir Rahman"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />
        </View>

        <Text style={styles.inputLabel}>Email Address</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="manager@company.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.inputLabel}>Access Password</Text>
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
          style={styles.submitButton}
          onPress={handleCreateManager}
          disabled={isSubmitting}
          activeOpacity={0.9}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.submitButtonText}>Authorize Manager Profile</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Staff Registry List */}
      <Text style={styles.sectionTitle}>Active Managers ({managers.length})</Text>
      
      {managers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={32} color="#94A3B8" />
          <Text style={styles.emptyText}>No register profiles assigned yet.</Text>
        </View>
      ) : (
        managers.map((item) => (
          <View key={item.id} style={styles.managerCard}>
            <View style={styles.avatarContainer}>
              {item.image ? (
                <Image source={{ uri: item.image.url }} style={styles.listAvatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {getInitials(item.name)}
                </Text>
              )}
            </View>
            
            <View style={styles.managerInfo}>
              <Text style={styles.managerName}>{item.name}</Text>
              <Text style={styles.managerEmail}>{item.email}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDeleteManager(item._id, item.name)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  contentContainer: { padding: 20, paddingBottom: 40 },
  navHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  navTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  introSection: { marginBottom: 24 },
  mainTitle: { fontSize: 24, fontWeight: "700", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 6, lineHeight: 18 },
  formContainer: { backgroundColor: "#FFF", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 28 },
  imagePickerCenterBlock: { alignItems: "center", marginBottom: 20, marginTop: 4 },
  imagePickerFrame: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", borderStyle: "dashed", overflow: "hidden", justifyContent: "center", alignItems: "center" },
  avatarPlaceholderWrapper: { alignItems: "center", justifyContent: "center" },
  avatarPlaceholderText: { fontSize: 11, fontWeight: "600", color: "#64748B", marginTop: 4 },
  selectedAvatarPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  removeImageBadge: { marginTop: 6, paddingVertical: 2, paddingHorizontal: 8 },
  removeImageText: { fontSize: 12, color: "#EF4444", fontWeight: "600" },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, height: 48, marginBottom: 16, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#0F172A", fontSize: 15, height: "100%" },
  eyeBtn: { padding: 4 },
  submitButton: { height: 48, backgroundColor: "#8B5CF6", borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8 },
  submitButtonText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 14 },
  managerCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 12 },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#475569" },
  listAvatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  managerInfo: { flex: 1, marginLeft: 12 },
  managerName: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  managerEmail: { fontSize: 12, color: "#64748B", marginTop: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "#F0FDF4", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A", marginRight: 4 },
  statusText: { fontSize: 10, fontWeight: "600", color: "#16A34A" },
  deleteButton: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FEE2E2" },
  emptyContainer: { alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", borderStyle: "dashed" },
  emptyText: { color: "#94A3B8", fontSize: 13, marginTop: 8 },
});