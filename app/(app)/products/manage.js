import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Mock Database Initializer for Footwear Catalog Grid
const INITIAL_CATALOG = [
  {
    id: "1",
    name: "Nike Air Max Alpha",
    sku: "NKE-AIRMAX-2026",
    colorway: "Black-Crimson-004",
    costPrice: "4200",
    sellingPrice: "5800",
    sizes: { "6": 5, "7": 10, "8": 15, "9": 12, "10": 8, "11": 4 },
  },
  {
    id: "2",
    name: "Adidas UltraBoost Light",
    sku: "ADI-UB-WHT",
    colorway: "Cloud White / Silver",
    costPrice: "6500",
    sellingPrice: "8900",
    sizes: { "6": 2, "7": 4, "8": 0, "9": 7, "10": 5, "11": 1 },
  },
  {
    id: "3",
    name: "Puma Velocity Nitro 3",
    sku: "PMA-NITRO-BLU",
    colorway: "Electric Blue / Neon",
    costPrice: "3800",
    sellingPrice: "5200",
    sizes: { "6": 8, "7": 6, "8": 10, "9": 4, "10": 0, "11": 0 },
  },
];

export default function ManageCatalog() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogItems, setCatalogItems] = useState(INITIAL_CATALOG);

  // Computed metric tracker to instantly surface out of stock individual variant sizes
  const getTotalPairs = (sizesObj) => {
    return Object.values(sizesObj).reduce((acc, qty) => acc + qty, 0);
  };

  // Live filter query matching Name or SKU parameters
  const filteredCatalog = catalogItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProductCard = ({ item }) => {
    const totalStock = getTotalPairs(item.sizes);
    
    return (
      <View style={styles.catalogCard}>
        {/* Top Segment Info Headers - FIXED: Changed <div> to native <View> */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productSku}>{item.sku} • <Text style={styles.colorwayText}>{item.colorway}</Text></Text>
          </View>
          <View style={[styles.badge, totalStock === 0 ? styles.badgeAlert : totalStock < 15 ? styles.badgeWarning : styles.badgeSuccess]}>
            <Text style={[styles.badgeText, totalStock === 0 ? styles.badgeTextAlert : totalStock < 15 ? styles.badgeTextWarning : styles.badgeTextSuccess]}>
              {totalStock === 0 ? "OOS" : `${totalStock} Pairs`}
            </Text>
          </View>
        </View>

        {/* Pricing Segment Breakdown Columns */}
        <View style={styles.pricingDividerRow}>
          <View>
            <Text style={styles.priceLabel}>Cost Matrix</Text>
            <Text style={styles.priceValue}>৳{item.costPrice}</Text>
          </View>
          <View>
            <Text style={styles.priceLabel}>Retail MRP</Text>
            <Text style={styles.priceValueRetail}>৳{item.sellingPrice}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.priceLabel}>Margin</Text>
            <Text style={styles.marginValue}>+৳{parseInt(item.sellingPrice) - parseInt(item.costPrice)}</Text>
          </View>
        </View>

        {/* Dynamic Size Variant Chips Row Grid */}
        <Text style={styles.sizeSectionHeader}>Stock Level Across Variant Matrix:</Text>
        <View style={styles.sizeMatrixTrack}>
          {Object.entries(item.sizes).map(([size, qty]) => (
            <View 
              key={size} 
              style={[
                styles.sizePill, 
                qty === 0 ? styles.sizePillEmpty : qty < 5 ? styles.sizePillLow : null
              ]}
            >
              <Text style={[styles.sizePillNum, qty === 0 ? styles.disabledText : null]}>UK {size}</Text>
              <Text style={[styles.sizePillQty, qty === 0 ? styles.disabledTextQty : qty < 5 ? styles.lowTextQty : null]}>
                {qty}
              </Text>
            </View>
          ))}
        </View>

        {/* Individual Card Context Management Actions Footer */}
        <View style={styles.cardActionsFooter}>
          <TouchableOpacity 
            style={styles.actionOutlineBtn}
            onPress={() => router.push({ pathname: "/products/restock", params: { sku: item.sku, mode: "restock" } })}
          >
            <Ionicons name="refresh-outline" size={14} color="#475569" />
            <Text style={styles.actionOutlineBtnText}>Restock Sizes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editActionBtn}>
            <Ionicons name="create-outline" size={14} color="#1E293B" />
            <Text style={styles.editActionBtnText}>Edit Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />
      
      {/* Dynamic Upper Top Title Dashboard Ribbon Row */}
      <View style={styles.headerRibbon}>
        <View>
          <Text style={styles.screenHeading}>Shoe Catalog</Text>
          <Text style={styles.screenSubheading}>Manage items, models</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.primaryAddBtn}
          onPress={() => router.push("/products/restock")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.primaryAddBtnText}>Add Shoe</Text>
        </TouchableOpacity>
      </View>

      {/* Persistent Dynamic Filter Search Wrapper Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search catalog by model name, variant or SKU..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Main Core Scrollable Render Grid List Layout */}
      <FlatList
        data={filteredCatalog}
        keyExtractor={(item) => item.id}
        renderItem={renderProductCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyStateTitle}>No Footwear Found</Text>
            <Text style={styles.emptyStateSubtitle}>Try refining your query search syntax or insert a new product code entry.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  listContent: { padding: 16, paddingBottom: 40 },

  // Header Dashboard Ribbon
  headerRibbon: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, marginBottom: 14 },
  screenHeading: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  screenSubheading: { fontSize: 12, color: "#64748B", marginTop: 2 },
  primaryAddBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#10B981", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, shadowColor: "#10B981", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  primaryAddBtnText: { color: "#FFF", fontSize: 13, fontWeight: "600", marginLeft: 4 },

  // Filter Bar Modules
  searchContainer: { paddingHorizontal: 16, marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, height: 44, paddingHorizontal: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.01, shadowRadius: 1 },
  searchInput: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "500" },

  // Modular Multi Variant Product Cards
  catalogCard: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", padding: 14, marginBottom: 14, shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.01, shadowRadius: 3 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  productName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  productSku: { fontSize: 11, fontWeight: "600", color: "#64748B", marginTop: 2 },
  colorwayText: { fontWeight: "400", color: "#94A3B8" },

  // Stock Status Badges
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSuccess: { backgroundColor: "#DCFCE7" },
  badgeWarning: { backgroundColor: "#FEF9C3" },
  badgeAlert: { backgroundColor: "#FEE2E2" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeTextSuccess: { color: "#15803D" },
  badgeTextWarning: { color: "#A16207" },
  badgeTextAlert: { color: "#B91C1C" },

  // Card Pricing Layout Splits
  pricingDividerRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#F8FAFC", borderRadius: 10, padding: 10, marginBottom: 12, borderStyle: "dashed", borderWidth: 1, borderColor: "#E2E8F0" },
  priceLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "600", textTransform: "uppercase" },
  priceValue: { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 2 },
  priceValueRetail: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginTop: 2 },
  marginValue: { fontSize: 13, fontWeight: "700", color: "#10B981", marginTop: 2 },

  // Size Multi Variant Map Sections
  sizeSectionHeader: { fontSize: 11, fontWeight: "600", color: "#475569", marginBottom: 6 },
  sizeMatrixTrack: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  sizePill: { flex: 1, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingVertical: 6, alignItems: "center", marginRight: 4 },
  sizePillEmpty: { backgroundColor: "#F8FAFC", borderColor: "#F1F5F9" },
  sizePillLow: { borderColor: "#FED7AA" },
  sizePillNum: { fontSize: 10, fontWeight: "600", color: "#64748B" },
  sizePillQty: { fontSize: 12, fontWeight: "700", color: "#0F172A", marginTop: 1 },
  disabledText: { color: "#CBD5E1" },
  disabledTextQty: { color: "#EF4444", fontWeight: "500" },
  lowTextQty: { color: "#EA580C" },

  // Action Bar Footer Controls
  cardActionsFooter: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 10 },
  actionOutlineBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, paddingVertical: 6, flex: 0.48 },
  actionOutlineBtnText: { color: "#475569", fontSize: 12, fontWeight: "600", marginLeft: 4 },
  editActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#E2E8F0", borderRadius: 8, paddingVertical: 6, flex: 0.48 },
  editActionBtnText: { color: "#1E293B", fontSize: 12, fontWeight: "600", marginLeft: 4 },

  // Empty List Indicators
  emptyStateContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyStateTitle: { fontSize: 15, fontWeight: "700", color: "#475569", marginTop: 12 },
  emptyStateSubtitle: { fontSize: 12, color: "#94A3B8", textAlign: "center", paddingHorizontal: 32, marginTop: 4, lineHeight: 16 },
});