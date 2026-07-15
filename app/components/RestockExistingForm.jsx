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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function RestockExistingForm() {
  const router = useRouter();

  const [modelNumber, setModelNumber] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  
  // Stores the product information fetched from backend
  const [productDetails, setProductDetails] = useState(null);
  // Key-value store tracking only changed size variations (e.g., {"39": 5, "42": -2})
  const [restockUpdates, setRestockUpdates] = useState({});

  // 1. Fetch existing profile configuration from backend
  const handleFetchProduct = async () => {
    if (!modelNumber.trim()) {
      Alert.alert("Required Input", "Please provide a valid Product SKU or Model Number.");
      return;
    }

    try {
      setIsFetching(true);
      setHasFetched(false);
      
      // Update this endpoint matching your API syntax mapping rules
      const FETCH_URL = `https://abdur-rahman-shoes-web-app.vercel.app/api/admin/product/${modelNumber.trim().toUpperCase()}`;
      
      const response = await fetch(FETCH_URL, { method: "GET" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Model number could not be recognized.");
      }

      // Expecting result.data to contain: { prodName, prodCode, selectedCategory, sizeQuantities: { "39": "4", "40": "12" } }
      setProductDetails(result.data);
      setRestockUpdates({}); // Reset working edit buffer
      setHasFetched(true);
    } catch (error) {
      console.error("Fetch operation fault:", error);
      Alert.alert("Profile Lookup Failed", error.message || "Network error looking up product code ledger.");
    } finally {
      setIsFetching(false);
    }
  };

  // Helper adjustment logic
  const handleQtyChange = (size, changeAmt) => {
    const baseStock = parseInt(productDetails?.sizeQuantities?.[size] || 0, 10);
    const currentModifier = restockUpdates[size] || 0;
    const newModifier = currentModifier + changeAmt;

    // Prevent running current absolute volume into inventory negatives
    if (baseStock + newModifier < 0) return;

    setRestockUpdates(prev => ({
      ...prev,
      [size]: newModifier
    }));
  };

  const handleManualQtyChange = (size, text) => {
    const numericVal = parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
    const baseStock = parseInt(productDetails?.sizeQuantities?.[size] || 0, 10);
    
    setRestockUpdates(prev => ({
      ...prev,
      [size]: numericVal - baseStock
    }));
  };

  // 2. Transmit updated quantity structures
  const handleFormSubmit = async () => {
    // Check if any actual alterations were registered
    const changedSizes = Object.keys(restockUpdates).filter(size => restockUpdates[size] !== 0);
    
    if (changedSizes.length === 0) {
      Alert.alert("No Shifts Registered", "Please modify at least one structural inventory sizing row before submitting adjustments.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Construct update map detailing modifications
      const sizePayload = {};
      changedSizes.forEach(size => {
        sizePayload[size] = restockUpdates[size];
      });

      const payload = {
        formType: "restock_existing",
        prodCode: productDetails.prodCode.toUpperCase(),
        category: productDetails.selectedCategory,
        quantityChanges: sizePayload, // Transmit delta shifts (+/- adjustments)
      };

      const UPDATE_URL = "https://abdur-rahman-shoes-web-app.vercel.app/api/admin/product/restock"; 

      const response = await fetch(UPDATE_URL, {
        method: "PATCH", // Using PATCH since it represents a localized update operation
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Server rejected transaction logic.");
      }

      Alert.alert("Inventory Synced", "Existing catalog storage counts successfully incremented.");
      
      // Complete state refresh
      setHasFetched(false);
      setProductDetails(null);
      setRestockUpdates({});
      setModelNumber("");
    } catch (error) {
      console.error("Network sync fault:", error);
      Alert.alert("Sync Operation Failed", error.message || "Could not patch values into transaction cluster paths.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Restock Existing Ledger</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Header Container Card */}
        <View style={styles.cardForm}>
          <Text style={styles.inputLabel}>Enter Product Model SKU <Text style={styles.requiredAsterisk}>*</Text></Text>
          <View style={styles.searchRow}>
            <View style={[styles.inputFieldBox, { flex: 1, marginBottom: 0 }]}>
              <Ionicons name="barcode-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g., NKE-AIRMAX-2026"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={modelNumber}
                onChangeText={setModelNumber}
                editable={!isFetching && !isSubmitting}
              />
            </View>
            <TouchableOpacity 
              style={styles.fetchBtn} 
              onPress={handleFetchProduct}
              disabled={isFetching || isSubmitting}
            >
              {isFetching ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Ionicons name="search-outline" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Display of Stock Changes */}
        {hasFetched && productDetails && (
          <View style={[styles.cardForm, { marginTop: 20 }]}>
            {/* Meta Info Header */}
            <View style={styles.metaBadgeRow}>
              <View>
                <Text style={styles.metaTitleText}>{productDetails.prodName}</Text>
                <Text style={styles.metaSKUText}>SKU: {productDetails.prodCode}</Text>
              </View>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{productDetails.selectedCategory}</Text>
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10, marginBottom: 12 }]}>
              Modify Size Matrix Configurations
            </Text>

            {/* List Array Generation */}
            <View style={styles.matrixContainer}>
              {Object.keys(productDetails.sizeQuantities)
                .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
                .map((size) => {
                  const baseQty = parseInt(productDetails.sizeQuantities[size] || 0, 10);
                  const modification = restockUpdates[size] || 0;
                  const finalCalculatedVal = baseQty + modification;

                  return (
                    <View key={size} style={styles.sizeStockRow}>
                      <View style={styles.sizeInfoLeft}>
                        <Text style={styles.sizeLabelText}>Size {size}</Text>
                        <Text style={styles.currentStockLabel}>Current: {baseQty} pairs</Text>
                      </View>

                      {/* Control Panel Block */}
                      <View style={styles.counterControlWrapper}>
                        <TouchableOpacity 
                          style={styles.miniCounterBtn} 
                          onPress={() => handleQtyChange(size, -1)}
                        >
                          <Ionicons name="remove" size={16} color="#0F172A" />
                        </TouchableOpacity>

                        <TextInput
                          style={styles.miniCounterInput}
                          keyboardType="number-pad"
                          value={String(finalCalculatedVal)}
                          onChangeText={(text) => handleManualQtyChange(size, text)}
                          textAlign="center"
                        />

                        <TouchableOpacity 
                          style={styles.miniCounterBtn} 
                          onPress={() => handleQtyChange(size, 1)}
                        >
                          <Ionicons name="add" size={16} color="#0F172A" />
                        </TouchableOpacity>
                      </View>

                      {/* Visual Indicator of Change status */}
                      <View style={styles.deltaIndicatorFrame}>
                        {modification !== 0 && (
                          <Text style={[styles.deltaText, modification > 0 ? styles.positiveText : styles.negativeText]}>
                            {modification > 0 ? `+${modification}` : modification}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
            </View>

            {/* UPDATE DATABASE TRIGGER */}
            <TouchableOpacity
              style={[styles.submitActionBtn, isSubmitting ? styles.disabledBtn : null]}
              onPress={handleFormSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitActionBtnText}>Update Storage Metrics</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  contentContainer: { padding: 20, paddingBottom: 60 },
  navHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  navTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  cardForm: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", padding: 18, shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8 },
  requiredAsterisk: { color: "#EF4444" },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  inputFieldBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, height: 46, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, color: "#0F172A", fontSize: 14, height: "100%", fontWeight: "500" },
  fetchBtn: { width: 48, height: 46, backgroundColor: "#10B981", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  
  // Product details formatting blocks
  metaBadgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", marginBottom: 10 },
  metaTitleText: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  metaSKUText: { fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: "500" },
  categoryTag: { backgroundColor: "#E6F4EA", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoryTagText: { fontSize: 11, color: "#059669", fontWeight: "700" },
  
  // Row Matrix presentation
  matrixContainer: { marginBottom: 20 },
  sizeStockRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  sizeInfoLeft: { width: "30%" },
  sizeLabelText: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  currentStockLabel: { fontSize: 11, color: "#64748B", marginTop: 1 },
  
  // Custom Inline Counter structures
  counterControlWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, height: 36, paddingHorizontal: 4 },
  miniCounterBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center" },
  miniCounterInput: { width: 45, fontSize: 14, fontWeight: "700", color: "#0F172A", height: "100%" },
  
  // Delta change presentation labels
  deltaIndicatorFrame: { width: "18%", alignItems: "flex-end" },
  deltaText: { fontSize: 13, fontWeight: "700" },
  positiveText: { color: "#10B981" },
  negativeText: { color: "#EF4444" },
  
  submitActionBtn: { height: 48, backgroundColor: "#10B981", borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", shadowColor: "#10B981", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  disabledBtn: { opacity: 0.6 },
  submitActionBtnText: { color: "#FFF", fontSize: 15, fontWeight: "600" }
});