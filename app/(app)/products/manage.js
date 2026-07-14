import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const BACKEND_URL = "https://abdur-rahman-shoes-web-app.vercel.app/api/admin/getProducts";
const LIMIT = 10;

export default function ManageCatalog() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogItems, setCatalogItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  // Use a ref to lock duplicate concurrent scroll requests
  const onEndReachedCalledDuringMomentum = useRef(true);

  // 1. Unified API Fetch Logic supporting Pagination
  const fetchCatalog = async (query = "", pageNum = 1, append = false) => {
    if (pageNum === 1 && !isRefreshing) {
      setIsLoading(true);
    } else if (pageNum > 1) {
      setIsFetchingNextPage(true);
    }

    try {
      const cleanQuery = query.trim();
      let targetUrl = `${BACKEND_URL}?page=${pageNum}&limit=${LIMIT}`;
      if (cleanQuery !== "") {
        targetUrl += `&q=${encodeURIComponent(cleanQuery)}`;
      }

      const response = await fetch(targetUrl);
      const json = await response.json();
      
      if (response.ok && json.success) {
        const products = (json.data || json.suggestions || []).map((prod) => ({
          id: prod._id || prod.id,
          name: prod.prodName || prod.name || "Unknown Product Name",
          sku: prod.prodCode || prod.sku || "",
          colorway: prod.modelNumber || prod.colorway || "Standard Colorway",
          costPrice: String(prod.costPrice || "0"),
          sellingPrice: String(prod.sellingPrice || "0"),
          sizes: prod.sizeQuantities || prod.sizes || {},
        }));

        setCatalogItems((prevItems) => (append ? [...prevItems, ...products] : products));
        setHasMore(json.hasMore ?? false);
        setPage(pageNum);
      } else {
        throw new Error(json.message || "Failed to retrieve catalog schema.");
      }
    } catch (error) {
      console.error("Database connection failure:", error);
      Alert.alert(
        "Network Interrupted", 
        "Could not load physical store stock catalogs right now. Please check your network connection."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsFetchingNextPage(false);
    }
  };

  // 2. Debounce Search Queries and reset pagination
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchCatalog(searchQuery, 1, false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 3. Pull-To-Refresh Reset Handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setSearchQuery(""); 
    setPage(1);
    setHasMore(true);
    fetchCatalog("", 1, false);
  }, []);

  // 4. Infinite Scroll Trigger (Load More on bottom reached)
  const handleLoadMore = () => {
    if (!onEndReachedCalledDuringMomentum.current && hasMore && !isFetchingNextPage && !isLoading) {
      onEndReachedCalledDuringMomentum.current = true;
      fetchCatalog(searchQuery, page + 1, true);
    }
  };

  // Safe helper to compile total pairs
  const getTotalPairs = (sizesObj) => {
    if (!sizesObj || typeof sizesObj !== "object") return 0;
    let grandTotal = 0;
    const hasSubCategories = ["Men", "Women", "Children"].some(cat => cat in sizesObj);

    if (hasSubCategories) {
      Object.values(sizesObj).forEach((categoryMap) => {
        if (categoryMap && typeof categoryMap === "object") {
          Object.values(categoryMap).forEach((qty) => {
            grandTotal += parseInt(qty, 10) || 0;
          });
        }
      });
    } else {
      Object.values(sizesObj).forEach((qty) => {
        grandTotal += parseInt(qty, 10) || 0;
      });
    }
    return grandTotal;
  };

  // Safe helper to map visual size pills
  const renderSizePills = (sizesObj) => {
    if (!sizesObj || typeof sizesObj !== "object") {
      return <Text style={styles.noSizesPlaceholder}>No sizes configured yet</Text>;
    }
    const hasSubCategories = ["Men", "Women", "Children"].some(cat => cat in sizesObj);
    let sizeEntries = [];

    if (hasSubCategories) {
      const mergedMap = {};
      ["Men", "Women", "Children"].forEach((cat) => {
        if (sizesObj[cat] && typeof sizesObj[cat] === "object") {
          Object.entries(sizesObj[cat]).forEach(([sz, qty]) => {
            const currentQty = parseInt(mergedMap[sz] || "0", 10);
            mergedMap[sz] = String(currentQty + (parseInt(qty, 10) || 0));
          });
        }
      });
      sizeEntries = Object.entries(mergedMap);
    } else {
      sizeEntries = Object.entries(sizesObj);
    }

    sizeEntries.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
    if (sizeEntries.length === 0) {
      return <Text style={styles.noSizesPlaceholder}>No sizes configured yet</Text>;
    }

    return sizeEntries.map(([size, qtyStr]) => {
      const qty = parseInt(qtyStr, 10) || 0;
      return (
        <View 
          key={size} 
          style={[
            styles.sizePill, 
            qty === 0 ? styles.sizePillEmpty : qty < 5 ? styles.sizePillLow : null
          ]}
        >
          <Text style={[styles.sizePillNum, qty === 0 ? styles.disabledText : null]}>EU {size}</Text>
          <Text style={[styles.sizePillQty, qty === 0 ? styles.disabledTextQty : qty < 5 ? styles.lowTextQty : null]}>
            {qty}
          </Text>
        </View>
      );
    });
  };

  const renderProductCard = ({ item }) => {
    const totalStock = getTotalPairs(item.sizes);
    const costPriceNum = parseInt(item.costPrice, 10) || 0;
    const sellingPriceNum = parseInt(item.sellingPrice, 10) || 0;
    
    return (
      <View style={styles.catalogCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productSku}>{item.sku} • <Text style={styles.colorwayText}>{item.colorway}</Text></Text>
          </View>
          <View style={[styles.badge, totalStock === 0 ? styles.badgeAlert : totalStock < 15 ? styles.badgeWarning : styles.badgeSuccess]}>
            <Text style={[styles.badgeText, totalStock === 0 ? styles.badgeTextAlert : totalStock < 15 ? styles.badgeTextWarning : styles.badgeTextSuccess]}>
              {totalStock === 0 ? "OOS" : `${totalStock} Pairs`}
            </Text>
          </View>
        </View>

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
            <Text style={styles.marginValue}>+৳{sellingPriceNum - costPriceNum}</Text>
          </View>
        </View>

        <Text style={styles.sizeSectionHeader}>Stock Level Across Variant Matrix:</Text>
        <View style={styles.sizeMatrixTrack}>
          {renderSizePills(item.sizes)}
        </View>

        <View style={styles.cardActionsFooter}>
          <TouchableOpacity 
            style={styles.actionOutlineBtn}
            onPress={() => router.push({ pathname: "/products/restock", params: { sku: item.sku, mode: "restock" } })}
          >
            <Ionicons name="refresh-outline" size={14} color="#475569" />
            <Text style={styles.actionOutlineBtnText}>Restock Sizes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.editActionBtn}
            onPress={() => Alert.alert("Feature Notice", "Detailed property modification is arriving soon.")}
          >
            <Ionicons name="create-outline" size={14} color="#1E293B" />
            <Text style={styles.editActionBtnText}>Edit Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Footer spinner for loading the next page
  const renderFooter = () => {
    if (!isFetchingNextPage) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#10B981" />
        <Text style={styles.footerLoaderText}>Loading more products...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />
      
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

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loaderText}>Syncing store ledger inventories...</Text>
        </View>
      ) : (
        <FlatList
          data={catalogItems}
          keyExtractor={(item) => item.id}
          renderItem={renderProductCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          
          // Pull-to-refresh
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#10B981"]}
            />
          }

          // Pagination Attributes
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          onMomentumScrollBegin={() => { onEndReachedCalledDuringMomentum.current = false; }}
          ListFooterComponent={renderFooter}

          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyStateTitle}>No Footwear Found</Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery 
                  ? "Try refining your search query." 
                  : "Database registry is empty. Tap 'Add Shoe' to initialize your digital catalogs."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  listContent: { padding: 16, paddingBottom: 20 },

  // Loader styles
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 12, fontSize: 13, color: "#64748B", fontWeight: "600" },

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
  sizeMatrixTrack: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", marginBottom: 14 },
  noSizesPlaceholder: { fontSize: 12, fontStyle: "italic", color: "#94A3B8", paddingVertical: 4 },
  sizePill: { minWidth: 48, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingVertical: 6, alignItems: "center", marginRight: 6, marginBottom: 6 },
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

  // Footer loader for infinite scroll
  footerLoader: { paddingVertical: 20, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  footerLoaderText: { marginLeft: 8, fontSize: 12, color: "#64748B", fontWeight: "500" },

  // Empty List Indicators
  emptyStateContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyStateTitle: { fontSize: 15, fontWeight: "700", color: "#475569", marginTop: 12 },
  emptyStateSubtitle: { fontSize: 12, color: "#94A3B8", textAlign: "center", paddingHorizontal: 32, marginTop: 4, lineHeight: 16 },
});