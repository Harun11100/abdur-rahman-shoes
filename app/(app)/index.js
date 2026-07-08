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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../store/authStore"; 

const { width } = Dimensions.get("window");

// Mock product registry for real-time suggestion evaluation
const PRODUCT_DATABASE = [
  {
    model: "NK270001",
    name: "Nike Air Max 270",
    price: 5000,
    sizes: [
      { size: "40", quantity: 5 },
      { size: "41", quantity: 8 },
      { size: "42", quantity: 14 },
      { size: "43", quantity: 3 }
    ],

  },
  {
    model: "AD500122",
    name: "Adidas Ultraboost Light",
    price: 7500,
    sizes: [
      { size: "41", quantity: 6 },
      { size: "42", quantity: 10 },
      { size: "43", quantity: 8 }
    ]
  },
  {
    model: "NK882910",
    name: "Nike Pegasus 40",
    price: 6200,
    sizes: [
      { size: "40", quantity: 4 },
      { size: "41", quantity: 12 },
      { size: "42", quantity: 6 }
    ]
  }
];

export default function Dashboard() {
  const router = useRouter();
  const params = useLocalSearchParams(); // Intercepts params returned via router paths
  const { user, logout } = useAuthStore();
  const userRole = user?.role || "manager"; 

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  
  // Track total items dynamically so sales updates affect aggregate state
  const [totalStockCount, setTotalStockCount] = useState(1235);

const [recentSales, setRecentSales] = useState([
  { id: "INV-2026-003", items: "Nike Air Max Sports Shoes (Size 42) x2, Cotton Socks x1", amount: "৳3,400", time: "10 mins ago", status: "Paid" },
  { id: "INV-2026-002", items: "Classic Leather Chelsea Boots (Size 41) x1", amount: "৳4,500", time: "45 mins ago", status: "Paid" },
  { id: "INV-2026-001", items: "Breathable Running Sneakers (Size 43) x1", amount: "৳2,100", time: "2 hours ago", status: "Pending" },
]);

  // Hook to handle synchronization when returning from ManagerActions
  useEffect(() => {
    if (params?.newInvoice) {
      try {
        const freshInvoice = JSON.parse(params.newInvoice);
        
        // Check if this invoice has already been added to avoid duplicate loops on re-renders
        setRecentSales((prev) => {
          if (prev.some(sale => sale.id === freshInvoice.id)) return prev;
          
          // Deduct from aggregate stock level since an item was sold
          setTotalStockCount(current => current - 1);
          
          return [freshInvoice, ...prev];
        });

        // Optional: Mutate the inventory profile template matching params.updatedModelSku if needed
        if (params.updatedModelSku) {
          const match = PRODUCT_DATABASE.find(p => p.model === params.updatedModelSku);
          if (match) {
            // Note: In production prototypes, write these items into a true local state collection array!
            console.log(`Model ${params.updatedModelSku} stock updated to ${params.updatedStockQty}`);
          }
        }
      } catch (e) {
        console.error("Context sync error", e);
      }
    }
  }, [params?.newInvoice, params?.updatedModelSku, params?.updatedStockQty]);

  const handleLogout = async () => {
    try { await logout(); } catch (error) { console.error("Logout failed:", error); }
  };

  const handleTextChange = (text) => {
    setSearchQuery(text);
    const cleaned = text.trim().toUpperCase();

    if (cleaned.length > 0) {
      const matched = PRODUCT_DATABASE.filter(
        (item) => item.model.includes(cleaned) || item.name.toUpperCase().includes(cleaned)
      );
      setSuggestions(matched);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectProduct = (product) => {
    setSearchQuery(product.model);
    setSuggestions([]);

    // Sum up sizes to pass aggregate count to actions workspace
    const totalAvailable = product.sizes.reduce((acc, curr) => acc + curr.quantity, 0);

    router.push({
      pathname: "/manager/actions",
      params: {
        model: product.model,
        name: product.name,
        price: product.price.toString(),
        sizes: JSON.stringify(product.sizes)
      },
    });
  };

  const handleSearchSubmit = () => {
    const cleanedQuery = searchQuery.trim().toUpperCase();
    if (!cleanedQuery) return;

    const exactMatch = PRODUCT_DATABASE.find(p => p.model === cleanedQuery);
    if (exactMatch) {
      handleSelectProduct(exactMatch);
    } else {
      setSuggestions([]);
      router.push({
        pathname: "/products/search",
        params: { q: searchQuery },
      });
    }
  };

  const stats = [
    { id: 1, title: "Products Available", value: 248, icon: "cube-outline" , color: "#3B82F6", bgColor: "#EFF6FF" },
    { id: 2, title: "In Stock Total", value: totalStockCount, icon: "archive-outline" , color: "#10B981", bgColor: "#ECFDF5" },
    ...(userRole === "admin" ? [{ id: 3, title: "Today's Revenue", value: "৳12,450", icon: "cash-outline" , color: "#F59E0B", bgColor: "#FEF3C7" },
      { id: 4, title: "Low Stock Items", value: 8, icon: "warning-outline" , color: "#EF4444", bgColor: "#FEF2F2" }
    ] : []),
    ,
  ];

  const quickActions = [
    { title: "Daily Sales Log", icon: "receipt-outline", color: "#F59E0B", path: "/history/daily", roles: ["admin", "manager"] },
    { title: "Manage Catalog", icon: "options-outline", color: "#3B82F6", path: "/products/manage", roles: ["admin"] },
    { title: "Restock Inbound", icon: "add-circle-outline", color: "#10B981", path: "/products/restock", roles: ["admin"] },
    { title: "Manager Accounts", icon: "people-outline", color: "#8B5CF6", path: "/admin/users", roles: ["admin"] },
  ];

  const filteredActions = quickActions.filter(action => action.roles.includes(userRole));

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Profile Section */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>👋 Good Morning,</Text>
            <Text style={styles.name}>{user?.name || "User"}</Text>
            <View style={[styles.roleBadge, { backgroundColor: userRole === "admin" ? "#FEF2F2" : "#F0FDF4" }]}>
              <Text style={[styles.roleBadgeText, { color: userRole === "admin" ? "#EF4444" : "#16A34A" }]}>
                {userRole.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>

  <TouchableOpacity 
    style={styles.iconButton}
    activeOpacity={0.7}
    onPress={() => router.push("/profile/settings")}
  >
    <Ionicons 
      name="settings-outline" 
      size={21} 
      color="#475569" 
    />
  </TouchableOpacity>


  <TouchableOpacity 
    style={[styles.iconButton, styles.logoutIconButton]}
    activeOpacity={0.7}
    onPress={handleLogout}
  >
    <Ionicons 
      name="log-out-outline" 
      size={21} 
      color="#EF4444" 
    />
  </TouchableOpacity>

</View>
        </View>

        {/* Search Input Container Area */}
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

          {/* Floating Dynamic Autocomplete Suggestion Dropdown Tray */}
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

        {/* Grid Stats */}
      <View style={styles.grid}>
  {stats.map((item) => (
    <View 
      key={item.id} 
      style={[
        styles.card, 
        stats.length === 3 && item.id === 4 ? styles.fullWidthCard : null
      ]}
    >
      {/* Top Header Row within the card */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
          <Ionicons name={item.icon} size={16} color={item.color} />
        </View>
        <Text style={styles.cardValue}>{item.value}</Text>
      </View>
    
      {/* Small Clean Label */}
      <Text style={styles.cardTitle}>{item.title}</Text>
    </View>
  ))}
</View>

        {/* Dynamic Actions Grid Wrapper */}
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

        {/* Recent Sales Layout Section */}
        <View style={styles.salesHeaderRow}>
          <Text style={styles.sectionTitleText}>Recent Sales Flow</Text>
          <TouchableOpacity onPress={() => router.push("/history/daily")}>
            <Text style={styles.viewAllLink}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.salesListWrapper}>
          {recentSales.map((sale) => (
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
                <Text style={styles.saleAmountValue}>{sale.amount}</Text>
                <View style={[styles.statusLabelBadge, { backgroundColor: sale.status === "Paid" ? "#EAFAF1" : "#FEF3C7" }]}>
                  <Text style={[styles.statusLabelText, { color: sale.status === "Paid" ? "#1EA857" : "#D97706" }]}>
                    {sale.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Keeping your original style definitions un-mutated
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  contentContainer: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 10, marginBottom: 20 },
  headerActions: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},
iconButton: {
  width: 40,
  height: 40,
  borderRadius: 14,
  backgroundColor: "#FFFFFF",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#E2E8F0",

  // subtle shadow
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},


logoutIconButton: {
  backgroundColor: "#FFF7F7",
  borderColor: "#FECACA",
},
  userInfo: { flex: 1 },
  greeting: { fontSize: 14, fontWeight: "500", color: "#64748B" },
  name: { fontSize: 26, fontWeight: "700", color: "#0F172A", marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  roleBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  logoutButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: 'center', borderWidth: 1, borderColor: "#FEE2E2" },
  searchWrapperBlock: { zIndex: 50, marginBottom: 24 }, 
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, height: 48, paddingHorizontal: 14, shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: "#0F172A", fontSize: 15, height: "100%", fontWeight: "500" },
  clearButton: { padding: 4 },
  suggestionsTrayWindow: { position: "absolute", top: 54, left: 0, right: 0, backgroundColor: "#FFF", borderRadius: 12, borderWidth: 1, borderColor: "#CBD5E1", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, zIndex: 100, overflow: "hidden", paddingHorizontal: 4 },
  suggestionItemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  suggestionIconWrapper: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginRight: 10 },
  suggestionModelText: { fontSize: 13, fontWeight: "700", color: "#1E293B" },
  suggestionNameText: { fontSize: 11, color: "#64748B", marginTop: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap:10,marginBottom: 24},
  card: {
    // Math calculation for a perfect 2-column small grid with gap accounted for
    width: (width - 52) / 2, 
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0', // Crisp, thin divider lines
    
    // Smooth micro shadow for premium elevation
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  fullWidthCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 9, // Slightly squared-rounded premium look
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A', // Slate-900 (ultra premium dark text)
    letterSpacing: -0.3,
  },
  cardTitle: { fontSize: 13, color: "#64748B", marginTop: 4, fontWeight: "500" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginVertical: 20 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 12 },
  actionButton: { width: (width - 52) / 2, backgroundColor: "#FFF", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
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
});