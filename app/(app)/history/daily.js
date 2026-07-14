import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";

const { width } = Dimensions.get("window");
const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function DailySalesLog() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All"); // All, Paid, Pending

  const [salesLog, setSalesLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grossRevenue, setGrossRevenue] = useState(0);

  // Core network ledger synchronization pipeline
  const fetchLedgerData = async (isPullToRefresh = false) => {
    if (isPullToRefresh) setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/sale/daily-ledger`);
      const json = await response.json();
      
      if (json.success) {
        setSalesLog(json.data.sales);
        setGrossRevenue(json.data.grossToday || 0);
      } else {
        throw new Error(json.message || "Failed manifest loading sequence.");
      }
    } catch (error) {
      console.error("Ledger sync failure:", error);
      Alert.alert("Sync Error", "Could not synchronize real-time shifting lines.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  const handleViewInvoice = (invoiceId) => {
    router.push({
      pathname: `/sales/receipt/${invoiceId}`,
    });
  };

  // Filter pipeline logic
  const filteredSales = salesLog.filter((sale) => {
    const matchesSearch =
      sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      activeFilter === "All" ? true : sale.status.toLowerCase() === activeFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerLoader]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Fixed Navigation Row */}
      <View style={styles.fixedHeader}>
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Daily Ledger</Text>
          <TouchableOpacity style={styles.syncButton} onPress={() => fetchLedgerData(true)}>
            <Ionicons name="refresh-outline" size={20} color="#16A34A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => fetchLedgerData(true)} 
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Summary Matrix Cards Strip */}
        <View style={styles.summaryStrip}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>{salesLog.length}</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: "#10B981" }]}>
            <Text style={[styles.summaryLabel, { color: "#047857" }]}>Gross Today</Text>
            <Text style={[styles.summaryValue, { color: "#10B981" }]}>
              ৳{grossRevenue.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Internal Log Search bar filtering tool */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Invoice, Operator, Item..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Segmented control tabs filter array line */}
        <View style={styles.filterRow}>
          {["All", "Paid", "Pending"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterTab,
                activeFilter === type ? styles.activeFilterTab : null,
              ]}
              onPress={() => setActiveFilter(type)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === type ? styles.activeFilterTabText : null,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Core Flow Ledger Rows */}
        <Text style={styles.sectionTitle}>Recorded Shift Invoices</Text>

        {filteredSales.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyText}>No matching transaction lines match current criteria.</Text>
          </View>
        ) : (
          filteredSales.map((sale) => (
            <TouchableOpacity
              key={sale.id}
              style={styles.invoiceCard}
              onPress={() => handleViewInvoice(sale.id)}
              activeOpacity={0.7}
            >
              {/* Upper invoice block containing baseline meta tags */}
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.invoiceId}>{sale.id}</Text>
                  <Text style={styles.metaTimeSubtext}>
                    Time: {sale.time} • Op: {sale.operator}
                  </Text>
                </View>
                
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: sale.status.toLowerCase() === "paid" ? "#E6F4EA" : "#FEF3C7" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: sale.status.toLowerCase() === "paid" ? "#137333" : "#D97706" },
                    ]}
                  >
                    {sale.status}
                  </Text>
                </View>
              </View>

              {/* Middle detailed item rows manifest block */}
              <View style={styles.itemsManifestBox}>
                {sale.items.map((item, index) => (
                  <Text key={index} style={styles.manifestLineText} numberOfLines={1}>
                    • {item.name} <Text style={{ fontWeight: "700" }}>x{item.qty}</Text> (৳{item.price?.toLocaleString()})
                  </Text>
                ))}
              </View>

              {/* Footer containing pricing execution fields */}
              <View style={styles.cardFooterRow}>
                <Text style={styles.totalLabel}>Grand Collection</Text>
                <Text style={styles.totalValue}>
                  ৳{typeof sale.total === 'number' ? sale.total.toLocaleString() : sale.total}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerLoader: { justifyContent: "center", alignItems: "center" },
  fixedHeader: { backgroundColor: "#F8FAFC", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  navHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  syncButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  navTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  summaryStrip: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: "#FFF", borderLeftWidth: 4, borderLeftColor: "#3B82F6", padding: 12, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  summaryLabel: { fontSize: 11, fontWeight: "600", color: "#64748B", textTransform: "uppercase" },
  summaryValue: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginTop: 4 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, height: 44, paddingHorizontal: 12, marginBottom: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: "#0F172A", fontSize: 14, height: "100%", fontWeight: "500" },
  filterRow: { flexDirection: "row", marginBottom: 24, backgroundColor: "#F1F5F9", borderRadius: 8, padding: 4 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  activeFilterTab: { backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 },
  filterTabText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  activeFilterTabText: { color: "#0F172A", fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 14 },
  invoiceCard: { backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", padding: 16, marginBottom: 14 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  invoiceId: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  metaTimeSubtext: { fontSize: 11, color: "#64748B", marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700" },
  itemsManifestBox: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", borderStyle: "dashed" },
  manifestLineText: { fontSize: 13, color: "#475569", marginBottom: 4 },
  cardFooterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  totalLabel: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#16A34A" },
  emptyContainer: { alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0" },
  emptyText: { color: "#94A3B8", fontSize: 13, marginTop: 8, textAlign: "center" },
});