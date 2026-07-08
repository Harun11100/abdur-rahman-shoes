import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function ManagerActions() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Validate if a valid product payload passed through from search
  const hasSearchedProduct = params && params.model;

  // Parse sizes array safely from stringified parameter fallback
  const parsedSizes = useMemo(() => {
    if (!params.sizes) return [];
    try {
      return typeof params.sizes === "string" ? JSON.parse(params.sizes) : params.sizes;
    } catch (e) {
      console.error("Failed to parse stock sizing structure", e);
      return [];
    }
  }, [params.sizes]);

  // Track the localized stock state for each separate size array option
  const [localStockVariants, setLocalStockVariants] = useState([]);
  
  // Track which variant size option the manager currently highlights
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  // NEW: Track the quantity chosen for the current transaction
  const [purchaseQty, setPurchaseQty] = useState(1);

  // Keep the local variant state in sync whenever parameters change
  useEffect(() => {
    if (parsedSizes && parsedSizes.length > 0) {
      setLocalStockVariants(parsedSizes);
      setSelectedSizeIndex(0); 
      setPurchaseQty(1); // Reset transaction counter to baseline unit
    }
  }, [parsedSizes]);

  // Reset purchase counter back to 1 safely if the manager flips to a different size chip
  useEffect(() => {
    setPurchaseQty(1);
  }, [selectedSizeIndex]);

  const activeSizeObj = localStockVariants[selectedSizeIndex] || null;
  const unitPrice = parseFloat(params.price || "0");
  const totalTransactionAmount = unitPrice * purchaseQty;

  // NEW: Manual adjustment logic for purchase metrics window
  const handleUpdatePurchaseQty = (type) => {
    if (!activeSizeObj) return;

    if (type === "decrease") {
      if (purchaseQty <= 1) return; // Keep transaction floor at minimum 1 item
      setPurchaseQty((prev) => prev - 1);
    } else if (type === "increase") {
      if (purchaseQty >= activeSizeObj.quantity) {
        Alert.alert("Cap Reached", `Cannot buy more than the available ${activeSizeObj.quantity} units currently in stock.`);
        return;
      }
      setPurchaseQty((prev) => prev + 1);
    }
  };

  const handleProcessSale = () => {
    if (!activeSizeObj) {
      Alert.alert("Error", "Please select a valid size variant.");
      return;
    }

    if (activeSizeObj.quantity < purchaseQty) {
      Alert.alert("Insufficient Stock", `Only ${activeSizeObj.quantity} left. You are attempting to purchase ${purchaseQty}.`);
      return;
    }

    Alert.alert(
      "Confirm Sale Transaction",
      `Are you sure you want to log a sale for:\n${purchaseQty}x ${params.name}\nSize: ${activeSizeObj.size}\nTotal Price: ৳${totalTransactionAmount.toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm & Log",
          onPress: () => {
            // 1. Automatically decrement stock variants count by chosen purchase metric
            const updatedVariants = localStockVariants.map((item, idx) => {
              if (idx === selectedSizeIndex) {
                return { ...item, quantity: item.quantity - purchaseQty };
              }
              return item;
            });

            setLocalStockVariants(updatedVariants);

            // 2. Generate updated receipt dataset map matching transaction logs
            const uniqueInvoiceId = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
            const dynamicInvoiceRecord = {
              id: uniqueInvoiceId,
              items: `${params.name} (Size ${activeSizeObj.size}) x${purchaseQty}`,
              amount: `৳${totalTransactionAmount.toLocaleString()}`,
              time: "Just now",
              status: "Paid",
            };

            Alert.alert(
              "Sale Successful",
              `Invoice ${uniqueInvoiceId} recorded.\nRemaining stock for Size ${activeSizeObj.size} is now ${activeSizeObj.quantity - purchaseQty}.`,
              [
                {
                  text: "Return to Dashboard",
                  onPress: () => {
                    router.replace({
                      pathname: "/",
                      params: {
                        newInvoice: JSON.stringify(dynamicInvoiceRecord),
                        updatedModelSku: params.model,
                        updatedSizes: JSON.stringify(updatedVariants),
                      },
                    });
                  },
                },
                { 
                  text: "Stay here", 
                  style: "default",
                  onPress: () => setPurchaseQty(1) // Reset back to default if staying
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Upper Header Layout */}
      <View style={styles.headerRibbon}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.screenHeading}>Product Control Sheet</Text>
          <Text style={styles.screenSubheading}>Stock reconciliation, direct point-of-sale logs</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {hasSearchedProduct ? (
          <View style={styles.mainCardContainer}>
            
            {/* Target Product Identity Metadata Panel */}
            <View style={styles.productFocusHeader}>
              <View style={styles.badgeRow}>
                <View style={styles.searchMatchBadge}>
                  <Text style={styles.searchMatchText}>Match Confirmed</Text>
                </View>
                <Text style={styles.modelSkuText}>SKU: {params.model}</Text>
              </View>
              <Text style={styles.productFocusName}>{params.name}</Text>
              <Text style={styles.productPriceTag}>
                ৳{unitPrice.toLocaleString()} <Text style={styles.unitPriceLabel}>/ unit</Text>
              </Text>
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

            {/* UPDATED: Purchase Quantity Controls (Updates local inventory on checkout) */}
            {activeSizeObj && activeSizeObj.quantity > 0 && (
              <View style={styles.adjustmentBlock}>
                <Text style={styles.adjustmentLabel}>
                  Select Purchase Quantity
                </Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity 
                    style={[styles.counterButton, purchaseQty <= 1 && styles.counterButtonDisabled]}
                    onPress={() => handleUpdatePurchaseQty("decrease")}
                    disabled={purchaseQty <= 1}
                  >
                    <Ionicons name="remove-outline" size={20} color={purchaseQty <= 1 ? "#CBD5E1" : "#475569"} />
                  </TouchableOpacity>
                  
                  <View style={styles.counterValueContainer}>
                    <Text style={styles.counterValueText}>{purchaseQty}</Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.counterButton, purchaseQty >= activeSizeObj.quantity && styles.counterButtonDisabled]}
                    onPress={() => handleUpdatePurchaseQty("increase")}
                    disabled={purchaseQty >= activeSizeObj.quantity}
                  >
                    <Ionicons name="add-outline" size={20} color={purchaseQty >= activeSizeObj.quantity ? "#CBD5E1" : "#475569"} />
                  </TouchableOpacity>

                  {purchaseQty > 1 && (
                    <Text style={styles.multiplierLabel}>
                      (৳{(unitPrice * purchaseQty).toLocaleString()})
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Current Context Breakdown Sub-panel */}
            {activeSizeObj && (
              <View style={styles.statusContextBox}>
                <Ionicons 
                  name={activeSizeObj.quantity <= 3 ? "warning-outline" : "checkmark-circle-outline"} 
                  size={18} 
                  color={activeSizeObj.quantity <= 3 ? "#D97706" : "#16A34A"} 
                />
                <Text style={styles.statusContextText}>
                  {activeSizeObj.quantity <= 0 
                    ? `Warning: Size ${activeSizeObj.size} is fully depleted.` 
                    : activeSizeObj.quantity <= 3 
                      ? `Warning: Running low on Size ${activeSizeObj.size} stock.`
                      : `Inventory stable. ${activeSizeObj.quantity} units available for custom transaction entry.`}
                </Text>
              </View>
            )}

            {/* Point of Sale Submission Footer */}
            <View style={styles.actionPanelWrapper}>
              <TouchableOpacity 
                style={[styles.primarySellButton, activeSizeObj?.quantity <= 0 && styles.disabledSellButton]} 
                onPress={handleProcessSale}
                disabled={activeSizeObj?.quantity <= 0}
              >
                <Ionicons name="cart-outline" size={20} color="#FFF" style={styles.buttonIconSpace} />
                <Text style={styles.primarySellButtonText}>
                  {activeSizeObj?.quantity <= 0 
                    ? "Selected Size Out of Stock" 
                    : `Register Sale • ৳${totalTransactionAmount.toLocaleString()}`}
                </Text>
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
  productFocusHeader: { padding: 20, borderBottomWidth: 1, borderColor: "#F1F5F9", backgroundColor: "#FAFAFA" },
  badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  searchMatchBadge: { backgroundColor: "#ECFDF5", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  searchMatchText: { fontSize: 10, fontWeight: "700", color: "#10B981", textTransform: "uppercase" },
  modelSkuText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  productFocusName: { fontSize: 22, fontWeight: "700", color: "#0F172A" },
  productPriceTag: { fontSize: 18, fontWeight: "700", color: "#3B82F6", marginTop: 6 },
  unitPriceLabel: { fontSize: 12, color: "#64748B", fontWeight: "400" },
  
  variantsSelectorSection: { padding: 20, paddingBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 12 },
  sizeChipsRow: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  sizeChipItem: { width: "22%", margin: "1.5%", paddingVertical: 10, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFF" },
  sizeChipItemSelected: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
  sizeChipItemDisabled: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0", opacity: 0.6 },
  sizeChipText: { fontSize: 14, fontWeight: "700", color: "#334155" },
  sizeChipTextSelected: { color: "#3B82F6" },
  sizeChipTextDisabled: { color: "#94A3B8", textDecorationLine: "line-through" },
  sizeChipQtyText: { fontSize: 10, color: "#64748B", marginTop: 2, fontWeight: "500" },
  sizeChipQtyTextSelected: { color: "#3B82F6", fontWeight: "600" },
  sizeChipQtyTextDisabled: { color: "#94A3B8" },

  adjustmentBlock: { paddingHorizontal: 20, paddingBottom: 20 },
  adjustmentLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 10 },
  counterRow: { flexDirection: "row", alignItems: "center" },
  counterButton: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  counterButtonDisabled: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0", opacity: 0.5 },
  counterValueContainer: { minWidth: 60, alignItems: "center", justifyContent: "center" },
  counterValueText: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  multiplierLabel: { marginLeft: 10, fontSize: 14, fontWeight: "600", color: "#64748B" },

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