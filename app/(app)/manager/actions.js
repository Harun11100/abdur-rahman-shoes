import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function ManagerActions() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const hasSearchedProduct = params && params.model;
  
  // Track whether local stock state has been seeded from route params
  const isInitialized = useRef(false);

  // Parse key-value sizing map safely
  const parsedSizesArray = useMemo(() => {
    if (!params.sizes) return [];
    try {
      const rawObject = typeof params.sizes === "string" ? JSON.parse(params.sizes) : params.sizes;
      return Object.keys(rawObject).map((sizeKey) => ({
        size: sizeKey,
        quantity: parseInt(rawObject[sizeKey] || "0", 10)
      })).sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    } catch (e) {
      console.error("Failed to parse stock sizing structure", e);
      return [];
    }
  }, [params.sizes]);

  const [localStockVariants, setLocalStockVariants] = useState([]);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State tracking for the negotiable unit price input
  const [customPriceInput, setCustomPriceInput] = useState("");

  // Base unit price default fallback configuration
  const defaultUnitPrice = useMemo(() => {
    return parseFloat(params.sellingPrice || params.price || "0");
  }, [params.sellingPrice, params.price]);

  // 1. FIXED: Seed local state EXACTLY ONCE on mount or when param data arrives
  useEffect(() => {
    if (parsedSizesArray && parsedSizesArray.length > 0 && !isInitialized.current) {
      setLocalStockVariants(parsedSizesArray);
      setSelectedSizeIndex(0); 
      setPurchaseQty(1);
      isInitialized.current = true; // Lock down initialization
    }
  }, [parsedSizesArray]);

  // Synchronize unit price field fallback when base product metadata changes
  useEffect(() => {
    setCustomPriceInput(defaultUnitPrice.toString());
  }, [defaultUnitPrice]);

  // Reset purchase counter back to 1 safely if the manager flips to a different size chip
  useEffect(() => {
    setPurchaseQty(1);
  }, [selectedSizeIndex]);

  const activeSizeObj = localStockVariants[selectedSizeIndex] || null;

  // Dynamic calculated processing totals based on manual user override inputs
  const finalUnitPrice = parseFloat(customPriceInput) || 0;
  const totalTransactionAmount = finalUnitPrice * purchaseQty;

  const handleUpdatePurchaseQty = (type) => {
    if (!activeSizeObj) return;

    if (type === "decrease") {
      if (purchaseQty <= 1) return;
      setPurchaseQty((prev) => prev - 1);
    } else if (type === "increase") {
      if (purchaseQty >= activeSizeObj.quantity) {
        Alert.alert("Cap Reached", `Cannot buy more than the available ${activeSizeObj.quantity} units currently in stock.`);
        return;
      }
      setPurchaseQty((prev) => prev + 1);
    }
  };

  const convertArrayToSchemaObject = (variantsArray) => {
    const targetObj = {};
    variantsArray.forEach((item) => {
      targetObj[item.size] = item.quantity;
    });
    return targetObj;
  };

  const executeApiSync = async (updatedVariants, dynamicInvoiceRecord) => {
    setIsSubmitting(true);
    try {
      const payloadSchemaSizesObj = convertArrayToSchemaObject(updatedVariants);
     
    

      const response = await fetch(`${API_URL}/api/dashboard/sync-invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          freshInvoice: dynamicInvoiceRecord,
          updatedModelSku: params.model,
          updatedStockQty: payloadSchemaSizesObj,
        }),
      });

      const responseText = await response.text();
      let json;

      try {
        json = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`Invalid server payload response format. HTML trace text: ${responseText.substring(0, 150)}`);
      }

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to sync transaction with server");
      }

      Alert.alert(
        "Sale Successful",
        `Invoice ${dynamicInvoiceRecord.id} recorded globally.\nRemaining stock for Size ${activeSizeObj.size} is now ${activeSizeObj.quantity - purchaseQty}.`,
        [
          {
            text: "Return to Dashboard",
            onPress: () => {
              router.replace({
                pathname: "/",
                params: {
                  newInvoice: JSON.stringify(dynamicInvoiceRecord),
                  updatedModelSku: params.model,
                  updatedSizes: JSON.stringify(payloadSchemaSizesObj),
                },
              });
            },
          },
          { 
            text: "Stay here", 
            style: "default",
            onPress: () => {
              // 2. FIXED: Local memory updates cleanly without being wiped out by the initial useEffect hook
              setLocalStockVariants(updatedVariants);
              setPurchaseQty(1);
            }
          },
        ]
      );

    } catch (err) {
      console.error("Sync Failure:", err);
      Alert.alert("Sync Error", err.message || "Network request failed. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessSale = () => {
    Keyboard.dismiss();

    if (!activeSizeObj) {
      Alert.alert("Error", "Please select a valid size variant.");
      return;
    }

    if (activeSizeObj.quantity < purchaseQty || activeSizeObj.quantity <= 0) {
      Alert.alert("Insufficient Stock", `Only ${activeSizeObj.quantity} left. You are attempting to purchase ${purchaseQty}.`);
      return;
    }

    // Negotiated price integrity guard checks
    if (!customPriceInput || finalUnitPrice <= 0) {
      Alert.alert("Invalid Price", "Please input a valid negotiated sale price greater than ৳0.");
      return;
    }

    Alert.alert(
      "Confirm Sale Transaction",
      `Are you sure you want to log a sale for:\n${purchaseQty}x ${params.name}\nSize: ${activeSizeObj.size}\nFinal Unit Price: ৳${finalUnitPrice.toLocaleString()}\nTotal Price: ৳${totalTransactionAmount.toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm & Log",
          onPress: () => {
            const updatedVariants = localStockVariants.map((item) => {
              if (item.size === activeSizeObj.size) {
                return { ...item, quantity: item.quantity - purchaseQty };
              }
              return item;
            });

            const uniqueInvoiceId = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
            const dynamicInvoiceRecord = {
              id: uniqueInvoiceId,
              items: `${params.name} (Size ${activeSizeObj.size}) x${purchaseQty}`,
              amount: totalTransactionAmount, // Captures final negotiated total metrics
              time: "Just now",
              status: "Paid",
            };

            executeApiSync(updatedVariants, dynamicInvoiceRecord);
          },
        },
      ]
    );
  };

  return (
       <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}>
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerRibbon}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isSubmitting}>
          <Ionicons name="arrow-back-outline" size={22} color={isSubmitting ? "#CBD5E1" : "#0F172A"} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.screenHeading}>Product Control Sheet</Text>
          <Text style={styles.screenSubheading}>Stock reconciliation, direct point-of-sale logs</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {hasSearchedProduct ? (
          <View style={styles.mainCardContainer}>
            
            {/* Target Product Identity Metadata Panel */}
        <View style={styles.productFocusCard}>
  <View style={styles.productFocusHeader}>
    {/* Product Image & Meta Column */}
    <View style={styles.productMetaContainer}>
      {params.productImage && (
        <Image
          source={{ uri: params.productImage }}
          style={styles.productImage}
        />
      )}

      <View style={styles.productTextColumn}>
        <View style={styles.searchMatchBadge}>
          <Ionicons name="checkmark-circle-sharp" size={13} color="#059669" />
          <Text style={styles.searchMatchText}>Match Confirmed</Text>
        </View>

        <Text style={styles.productNameText} numberOfLines={2}>
          {params.name}
        </Text>
        
        <Text style={styles.modelSkuText}>
          SKU • <Text style={styles.skuHighlight}>{params.model}</Text>
        </Text>
      </View>
    </View>

    {/* Pricing Footer Strip */}
    <View style={styles.priceStrip}>
      <Text style={styles.priceUnitLabel}>Original Unit Retail</Text>
      <Text style={styles.productPriceTag}>
        ৳{defaultUnitPrice.toLocaleString()}
      </Text>
    </View>
  </View>
</View>

            {/* Size Variant Picker Segment */}
            <View style={styles.variantsSelectorSection}>
              <Text style={styles.sectionLabel}>Select Customer Size Focus</Text>
              <View style={styles.sizeChipsRow}>
                {localStockVariants.map((item, index) => {
                  const isSelected = index === selectedSizeIndex;
                  const isOutOfStock = item.quantity <= 0;

                  return (
                    <TouchableOpacity
                      key={item.size}
                      activeOpacity={0.7}
                      // 3. FIXED: Prevent interaction completely if the size is out of stock or loading
                      disabled={isOutOfStock || isSubmitting}
                      style={[
                        styles.sizeChipItem,
                        isSelected && styles.sizeChipItemSelected,
                        isOutOfStock && styles.sizeChipItemDisabled,
                      ]}
                      onPress={() => setSelectedSizeIndex(index)}
                    >
                      <Text style={[
                        styles.sizeChipText,
                        isSelected && styles.sizeChipTextSelected,
                        isOutOfStock && styles.sizeChipTextDisabled
                      ]}>
                        EU {item.size}
                      </Text>
                      <Text style={[
                        styles.sizeChipQtyText,
                        isSelected && styles.sizeChipQtyTextSelected,
                        isOutOfStock && styles.sizeChipQtyTextDisabled
                      ]}>
                        {isOutOfStock ? "Out" : `${item.quantity} left`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Purchase Quantity Controls */}
            {activeSizeObj && activeSizeObj.quantity > 0 && (
              <View style={styles.adjustmentBlock}>
                <Text style={styles.adjustmentLabel}>
                  Select Purchase Quantity
                </Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity 
                    style={[styles.counterButton, (purchaseQty <= 1 || isSubmitting) && styles.counterButtonDisabled]}
                    onPress={() => handleUpdatePurchaseQty("decrease")}
                    disabled={purchaseQty <= 1 || isSubmitting}
                  >
                    <Ionicons name="remove-outline" size={20} color={purchaseQty <= 1 ? "#CBD5E1" : "#475569"} />
                  </TouchableOpacity>
                  
                  <View style={styles.counterValueContainer}>
                    <Text style={styles.counterValueText}>{purchaseQty}</Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.counterButton, (purchaseQty >= activeSizeObj.quantity || isSubmitting) && styles.counterButtonDisabled]}
                    onPress={() => handleUpdatePurchaseQty("increase")}
                    disabled={purchaseQty >= activeSizeObj.quantity || isSubmitting}
                  >
                    <Ionicons name="add-outline" size={20} color={purchaseQty >= activeSizeObj.quantity ? "#CBD5E1" : "#475569"} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Custom Negotiated Price Input Section */}
            {activeSizeObj && activeSizeObj.quantity > 0 && (
            
              <View style={styles.negotiationBlock}>
                <Text style={styles.adjustmentLabel}>Negotiated Price per Unit (৳)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencyPrefix}>৳</Text>
                  <TextInput
                    style={styles.priceInputField}
                    keyboardType="numeric"
                    placeholder="Enter final selling price..."
                    value={customPriceInput}
                    onChangeText={(text) => setCustomPriceInput(text.replace(/[^0-9.]/g, ""))}
                    editable={!isSubmitting}
                  />
                  {finalUnitPrice !== defaultUnitPrice && (
                    <TouchableOpacity 
                      style={styles.resetPriceBtn} 
                      onPress={() => setCustomPriceInput(defaultUnitPrice.toString())}
                    >
                      <Text style={styles.resetPriceText}>Reset</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
            )}
          

            {/* Point of Sale Submission Footer */}
            <View style={styles.actionPanelWrapper}>
              <TouchableOpacity 
                style={[
                  styles.primarySellButton, 
                  (activeSizeObj?.quantity <= 0 || finalUnitPrice <= 0 || isSubmitting) && styles.disabledSellButton
                ]} 
                onPress={handleProcessSale}
                disabled={activeSizeObj?.quantity <= 0 || finalUnitPrice <= 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={20} color="#FFF" style={styles.buttonIconSpace} />
                    <Text style={styles.primarySellButtonText}>
                      {activeSizeObj?.quantity <= 0 
                        ? "Selected Size Out of Stock" 
                        : `Register Sale • ৳${totalTransactionAmount.toLocaleString()}`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="search-circle-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>No Product Targeted</Text>
            <Text style={styles.emptyStateMessage}>
              Please search for a product model code via the Main Dashboard view to execute manager inventory actions.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  headerRibbon: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#E2E8F0" },
  backButton: { marginRight: 14, padding: 4 },
  headerTitleGroup: { flex: 1 },
  screenHeading: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  screenSubheading: { fontSize: 11, color: "#64748B", marginTop: 1 },
  scrollContent: { padding: 20 },
  
  mainCardContainer: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
 productFocusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Soft slate border
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    marginVertical:0,
    overflow: "hidden",
  },
  productFocusHeader: {
    padding: 16,
  },
  // Row for Image + Text Column
  productMetaContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9", // Crisp separator line
  },
  productImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 14,
  },
  productTextColumn: {
    flex: 1,
    justifyContent: "center",
  },
  // Badge Style (Pill shape, softer greens)
  searchMatchBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5", // Soft emerald tint
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  searchMatchText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  productNameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A", // Dark Slate
    lineHeight: 22,
    marginBottom: 4,
  },
  modelSkuText: {
    fontSize: 12,
    color: "#64748B", // Cool Grey
    fontWeight: "500",
  },
  skuHighlight: {
    color: "#0F172A",
    fontWeight: "700",
  },
  // Bottom Price Alignment Bar
  priceStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
  },
  priceUnitLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  productPriceTag: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  variantsSelectorSection: { padding: 20, paddingBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 12 },
  sizeChipsRow: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  sizeChipItem: { width: "22%", margin: "1.5%", paddingVertical: 10, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFF" },
  sizeChipItemSelected: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
  sizeChipItemDisabled: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0", opacity: 0.5 },
  sizeChipText: { fontSize: 14, fontWeight: "700", color: "#334155" },
  sizeChipTextSelected: { color: "#3B82F6" },
  sizeChipTextDisabled: { color: "#94A3B8", textDecorationLine: "line-through" },
  sizeChipQtyText: { fontSize: 10, color: "#64748B", marginTop: 2, fontWeight: "500" },
  sizeChipQtyTextSelected: { color: "#3B82F6", fontWeight: "600" },
  sizeChipQtyTextDisabled: { color: "#94A3B8" },

  adjustmentBlock: { paddingHorizontal: 20, paddingBottom: 15 },
  adjustmentLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 10 },
  counterRow: { flexDirection: "row", alignItems: "center" },
  counterButton: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  counterButtonDisabled: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0", opacity: 0.5 },
  counterValueContainer: { minWidth: 60, alignItems: "center", justifyContent: "center" },
  counterValueText: { fontSize: 18, fontWeight: "700", color: "#0F172A" },

  negotiationBlock: { paddingHorizontal: 20, paddingBottom: 20 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 10, height: 46, paddingHorizontal: 12, backgroundColor: "#FFF" },
  currencyPrefix: { fontSize: 16, fontWeight: "600", color: "#475569", marginRight: 6 },
  priceInputField: { flex: 1, fontSize: 16, color: "#0F172A", fontWeight: "600", padding: 0 },
  resetPriceBtn: { backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  resetPriceText: { fontSize: 12, fontWeight: "600", color: "#475569" },

  statusContextBox: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 20, padding: 12, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#F1F5F9" },
  statusContextText: { fontSize: 12, color: "#475569", marginLeft: 8, fontWeight: "500", flex: 1 },

  actionPanelWrapper: { padding: 20, borderTopWidth: 1, borderColor: "#F1F5F9", backgroundColor: "#FCFCFD" },
  primarySellButton: { flexDirection: "row", backgroundColor: "#10B981", height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  disabledSellButton: { backgroundColor: "#94A3B8" },
  buttonIconSpace: { marginRight: 8 },
  primarySellButtonText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  emptyStateContainer: { alignItems: "center", justifyContent: "center", marginTop: 80, paddingHorizontal: 20 },
  emptyStateTitle: { fontSize: 16, fontWeight: "700", color: "#475569", marginTop: 14 },
  emptyStateMessage: { fontSize: 13, color: "#94A3B8", textAlign: "center", marginTop: 6, lineHeight: 18 },
});