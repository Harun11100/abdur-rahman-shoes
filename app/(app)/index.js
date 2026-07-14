import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl, // Imported native pull-down refresh tool
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../store/authStore"; 
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL;
const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const { user, logout } = useAuthStore();
  const userRole = user?.role || "manager"; 

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Explicit tracking for pull-down state updates
  const [refreshing, setRefreshing] = useState(false);
  
  const [totalStockCount, setTotalStockCount] = useState(0);
  const [productsAvailable, setProductsAvailable] = useState(0);
  const [adminMetrics, setAdminMetrics] = useState({ todayRevenue: "৳0", lowStockCount: 0 });
  const [recentSales, setRecentSales] = useState([]);

  // Refactored metric query core pipeline
  const fetchDashboardData = async (isPullToRefresh = false) => {
    if (isPullToRefresh) setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/dashboard?role=${userRole}`);
      const json = await response.json();
      if (json.success) {
        setTotalStockCount(json.data.totalStockCount);
        setProductsAvailable(json.data.productsAvailable);
        setRecentSales(json.data.recentSales);
        if (json.data.adminStats) {
          setAdminMetrics(json.data.adminStats);
        }
      }
    } catch (error) {
      console.error("Error retrieving metrics context:", error);
      Alert.alert("Sync Error", "Could not synchronize real-time statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false); // Reset top loading bar tracker safely
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userRole]);

  useEffect(() => {
    if (params?.newInvoice) {
      fetchDashboardData();
      setSearchQuery("");
      router.setParams({ newInvoice: undefined, updatedModelSku: undefined, updatedSizes: undefined });
    }
  }, [params?.newInvoice]);

  // Handle manual pull down execution callback
  const handleOnRefresh = () => {
    fetchDashboardData(true);
  };

 const handleLogout = () => {
  Alert.alert(
    "Logout",
    "Are you sure you want to log out of your account?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Logout failed:", error);

            Alert.alert(
              "Error",
              "Unable to log out. Please try again."
            );
          }
        },
      },
    ],
    { cancelable: true }
  );
};
  const handleTextChange = async (text) => {
    setSearchQuery(text);
    if (text.trim().length > 0) {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/search?q=${encodeURIComponent(text)}`);
        const json = await response.json();
        if (json.success) {
          setSuggestions(json.suggestions);
        }
      } catch (error) {
        console.error("Asynchronous autocomplete retrieval failure:", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectProduct = (product) => {

    setSearchQuery(product.model);
    setSuggestions([]);

    router.push({
      pathname: "/manager/actions",
      params: {
        model: product.model,
        name: product.name,
        productImage: product.images?.[0]?.url || "",
        sellingPrice: product.price,
        sizes: product.sizes ? JSON.stringify(product.sizes) : undefined,
      },
    });
  };

  const handleSearchSubmit = async () => {
    const cleanedQuery = searchQuery.trim().toUpperCase();
    if (!cleanedQuery) return;

    try {
      const response = await fetch(`${API_URL}/api/dashboard/search?q=${encodeURIComponent(cleanedQuery)}`);
      const json = await response.json();
      
      const exactMatch = json.success && json.suggestions.find(p => p.model === cleanedQuery);
      if (exactMatch) {
        handleSelectProduct(exactMatch);
      } else {
        setSuggestions([]);
        router.push({
          pathname: "/products/search",
          params: { q: searchQuery },
        });
      }
    } catch (e) {
      console.error("Submission lookup error:", e);
    }
  };

  const stats = [
    { id: 1, title: "Products Available", value: productsAvailable, icon: "cube-outline" , color: "#3B82F6", bgColor: "#EFF6FF" },
    { id: 2, title: "In Stock Total", value: totalStockCount, icon: "archive-outline" , color: "#10B981", bgColor: "#ECFDF5" },
    ...(userRole === "admin" ? [
      { id: 3, title: "Today's Revenue", value: adminMetrics.todayRevenue, icon: "cash-outline" , color: "#F59E0B", bgColor: "#FEF3C7" },
      { id: 4, title: "Low Stock Items", value: adminMetrics.lowStockCount, icon: "warning-outline" , color: "#EF4444", bgColor: "#FEF2F2" }
    ] : []),
  ];

  const quickActions = [
    { title: "Daily Sales Log", icon: "receipt-outline", color: "#F59E0B", path: "/history/daily", roles: ["admin", "manager"] },
    { title: "Manage Catalog", icon: "options-outline", color: "#3B82F6", path: "/products/manage", roles: ["admin"] },
    { title: "Restock Inbound", icon: "add-circle-outline", color: "#10B981", path: "/products/restock", roles: ["admin"] },
    { title: "Manager Accounts", icon: "people-outline", color: "#8B5CF6", path: "/admin/users", roles: ["admin"] },
  ];

  const filteredActions = quickActions.filter(action => action.roles.includes(userRole));

  // Base loader used only for the *initial* app mount state
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerLoader]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.coverContainer}>
        <Image 
          source={{ uri: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop" }} 
          style={styles.coverPhoto} 
        />
        <View style={styles.coverOverlay} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // Attaches top dynamic refresh gesture controller configurations
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleOnRefresh}
            colors={["#3B82F6"]} // Android Spinner Theme Line
            tintColor="#3B82F6"  // iOS Loading Accent Metric
          />
        }
      >
        <View style={styles.headerProfileWrapper}>
          <View style={styles.profilePlacementRow}>
            <View style={styles.profilePhotoContainer}>
              <Image 
                source={{ uri: user?.image?.url||"https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=1200&auto=format&fit=crop"}}
                style={styles.profileImage} 
              />
            </View>
          </View>

          <View style={styles.headerActions}>
            {userRole === "admin" && (
              <TouchableOpacity 
                style={styles.iconButton}
                activeOpacity={0.7}
                onPress={() => router.push("/profile/settings")}
              >
                <Ionicons name="settings-outline" size={19} color="#475569" />
              </TouchableOpacity>
            )}
              
            <TouchableOpacity 
              style={[styles.iconButton, styles.logoutIconButton]}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={19} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.userInfoBlock}>
          <Text style={styles.name}>{user?.name || "User"}</Text>
          <View style={[styles.roleBadge, { backgroundColor: userRole === "admin" ? "#FEF2F2" : "#F0FDF4" }]}>
            <Text style={[styles.roleBadgeText, { color: userRole === "admin" ? "#EF4444" : "#16A34A" }]}>
              {userRole.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Search Bar Block Wrapper */}
        <View style={styles.searchWrapperBlock}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name, model, code..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={handleTextChange}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setSuggestions([]); }} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestionsTrayWindow}>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={item.model}
                  style={[styles.suggestionItemRow, index === suggestions.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => handleSelectProduct(item)}
                >
                  <View style={styles.suggestionIconWrapper}>
                    <Ionicons name="pricetag-outline" size={16} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionModelText}>{item.model}</Text>
                    <Text style={styles.suggestionNameText} numberOfLines={1}>{item.name}</Text>
                  </View>
                  <Ionicons name="arrow-forward-outline" size={14} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Dashboard Metrics Grid Layout */}
        <View style={styles.grid}>
          {stats.map((item) => {
            const isFullWidth = stats.length === 3 && item.id === 3;
            return (
              <View 
                key={item.id} 
                style={[styles.card, isFullWidth && styles.fullWidthCard]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                    <Ionicons name={item.icon} size={16} color={item.color} />
                  </View>
                  <Text style={styles.cardValue}>{item.value}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Authorized Tasks</Text>
        <View style={styles.actionsGrid}>
          {filteredActions.map((action) => (
            <TouchableOpacity 
              key={action.title} 
              style={styles.actionButton}
              onPress={() => router.push(action.path)}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: action.color + "12" }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.actionButtonText} numberOfLines={1}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.salesHeaderRow}>
          <Text style={styles.sectionTitleText}>Recent Sales Flow</Text>
          <TouchableOpacity onPress={() => router.push("/history/daily")}>
            <Text style={styles.viewAllLink}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.salesListWrapper}>
          {recentSales.length === 0 ? (
            <Text style={styles.emptySalesText}>No sales recorded today yet.</Text>
          ) : (
            recentSales.map((sale) => (
              <View key={sale.id} style={styles.saleRowItem}>
                <View style={styles.saleLeftColumn}>
                  <View style={styles.receiptIconBox}>
                    <Ionicons name="receipt-outline" size={18} color="#475569" />
                  </View>
                  <View style={styles.saleMetaDetails}>
                    <Text style={styles.saleInvoiceId}>{sale.id}</Text>
                    <Text style={styles.saleProductsDescription} numberOfLines={1}>
                      {sale.items}
                    </Text>
                    <Text style={styles.saleTimestamp}>{sale.time}</Text>
                  </View>
                </View>

                <View style={styles.saleRightColumn}>
                  <Text style={styles.saleAmountValue}>
                    {typeof sale.amount === 'number' ? `৳${sale.amount.toLocaleString()}` : sale.amount}
                  </Text>
                  <View style={[styles.statusLabelBadge, { backgroundColor: sale.status === "Paid" ? "#EAFAF1" : "#FEF3C7" }]}>
                    <Text style={[styles.statusLabelText, { color: sale.status === "Paid" ? "#1EA857" : "#D97706" }]}>
                      {sale.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerLoader: { justifyContent: "center", alignItems: "center" },
  coverContainer: { position: "absolute", top: 0, left: 0, right: 0, height: 150, backgroundColor: "#1E293B" },
  coverPhoto: { width: "100%", height: "100%", resizeMode: "cover" },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15, 23, 42, 0.25)" },
  headerProfileWrapper: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 80, marginBottom: 25 },
  profilePlacementRow: { flexDirection: "row", alignItems: "flex-end", flex: 1 },
  profilePhotoContainer: { width: 76, height: 76, borderRadius: 22, backgroundColor: "#FFFFFF", padding: 3, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  profileImage: { width: "100%", height: "100%", borderRadius: 19 },
  userInfoBlock: { marginLeft: 4, marginBottom: 12 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  iconButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  logoutIconButton: { backgroundColor: "#FFF7F7", borderColor: "#FECACA" },
  name: { fontSize: 22, fontWeight: "700", color: "#0F172A", marginTop: 1 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  roleBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  searchWrapperBlock: { zIndex: 50, marginBottom: 24, position: "relative" }, 
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, height: 48, paddingHorizontal: 14, shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: "#0F172A", fontSize: 15, height: "100%", fontWeight: "500" },
  clearButton: { padding: 4 },
  suggestionsTrayWindow: { position: "absolute", top: 54, left: 0, right: 0, backgroundColor: "#FFF", borderRadius: 12, borderWidth: 1, borderColor: "#CBD5E1", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, zIndex: 100, overflow: "hidden", paddingHorizontal: 4 },
  suggestionItemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  suggestionIconWrapper: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginRight: 10 },
  suggestionModelText: { fontSize: 13, fontWeight: "700", color: "#1E293B" },
  suggestionNameText: { fontSize: 11, color: "#64748B", marginTop: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24, zIndex: 1 },
  card: { width: (width - 50) / 2, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  fullWidthCard: { width: '100%' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  iconContainer: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardValue: { fontSize: 16, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  cardTitle: { fontSize: 13, color: "#64748B", marginTop: 4, fontWeight: "500" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginVertical: 20 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 12 },
  actionButton: { width: (width - 50) / 2, backgroundColor: "#FFF", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  actionIconWrapper: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 12 },
  actionButtonText: { color: "#334155", fontWeight: "600", fontSize: 13, flex: 1 },
  salesHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 14 },
  sectionTitleText: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  viewAllLink: { fontSize: 13, fontWeight: "600", color: "#3B82F6" },
  salesListWrapper: { backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", paddingVertical: 6, paddingHorizontal: 16 },
  saleRowItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  saleLeftColumn: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 },
  receiptIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  saleMetaDetails: { marginLeft: 12, flex: 1 },
  saleInvoiceId: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  saleProductsDescription: { fontSize: 12, color: "#64748B", marginTop: 2 },
  saleTimestamp: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  saleRightColumn: { alignItems: "flex-end" },
  saleAmountValue: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  statusLabelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  statusLabelText: { fontSize: 10, fontWeight: "700" },
  emptySalesText: { textAlign: "center", color: "#94A3B8", paddingVertical: 20, fontSize: 13 },
});