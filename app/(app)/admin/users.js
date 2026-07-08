import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ManageManagers() {
  const router = useRouter();
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock initial list of managers currently assigned to the system
  const [managers, setManagers] = useState([
    { id: "1", name: "Rahat Khan", email: "rahat@company.com", status: "Active" },
    { id: "2", name: "Anika Ahmed", email: "anika@company.com", status: "Active" },
  ]);

  const handleCreateManager = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing Details", "Please fill out all operational fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API registration delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newManager = {
        id: String(managers.length + 1),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        status: "Active",
      };

      setManagers([newManager, ...managers]);
      Alert.alert("Success", `Account for ${name} has been authorized.`);
      
      // Reset layout forms
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      Alert.alert("Error", "Could not create manager profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteManager = (id, managerName) => {
    Alert.alert(
      "Revoke Clearance",
      `Are you sure you want to delete ${managerName}'s access credentials?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            setManagers(managers.filter((m) => m.id !== id));
          } 
        }
      ]
    );
  };

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
        <View style={{ width: 40 }} /> {/* Layout Spacer */}
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
              <Text style={styles.avatarText}>
                {item.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </Text>
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
              onPress={() => handleDeleteManager(item.id, item.name)}
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
  
  // Navigation
  navHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  navTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  
  // Intro Section
  introSection: { marginBottom: 24 },
  mainTitle: { fontSize: 24, fontWeight: "700", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 6, lineHeight: 18 },
  
  // Form Configuration
  formContainer: { backgroundColor: "#FFF", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 28 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, height: 48, marginBottom: 16, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#0F172A", fontSize: 15, height: "100%" },
  eyeBtn: { padding: 4 },
  submitButton: { height: 48, backgroundColor: "#8B5CF6", borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8 },
  submitButtonText: { color: "#FFF", fontSize: 15, fontWeight: "600" },

  // List Layouts
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 14 },
  managerCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 12 },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#475569" },
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