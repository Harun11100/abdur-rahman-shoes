import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function DailySalesLog() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All"); // All, Paid, Pending

  // Mock ledger array representing transactions made today
  const [salesLog, setSalesLog] = useState([
    {
      id: "INV-2026-003",
      items: [
        { name: "Wireless Mouse", qty: 2, price: 1200 },
        { name: "Mechanical Keyboard", qty: 1, price: 1000 },
      ],
      total: "৳3,400",
      time: "10:42 AM",
      operator: "Rahat Khan",
      status: "Paid",
    },
    {
      id: "INV-2026-002",
      items: [{ name: "Bluetooth Headphones", qty: 1, price: 4500 }],
      total: "৳4,500",
      time: "09:15 AM",
      operator: "Anika Ahmed",
      status: "Paid",
    },
    {
      id: "INV-2026-001",
      items: [{ name: "USB-C Hub Multiport", qty: 1, price: 2100 }],
      total: "৳2,100",
      time: "08:30 AM",
      operator: "Rahat Khan",
      status: "Pending",
    },
  ]);

  // Handle viewing specific receipt details
  const handleViewInvoice = (invoiceId) => {
    Alert.alert("Invoice Receipt", `Fetching detailed manifest for transaction ${invoiceId}`);
    // Real implementation routes directly into dynamic parameters matching layout:
    // router.push(`/sales/receipt/${invoiceId}`);
  };

  // Filter pipeline logic
  const filteredSales = salesLog.filter((sale) => {
    const matchesSearch =
      sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      activeFilter === "All" ? true : sale.status === activeFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Navigation Row */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Daily Ledger</Text>
        <TouchableOpacity style={styles.syncButton} onPress={() => Alert.alert("Synced", "Ledger is up to date.")}>
          <Ionicons name="refresh-outline" size={20} color="#16A34A" />
        </TouchableOpacity>
      </View>

      {/* Summary Matrix Cards Strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Orders</Text>
          <Text style={styles.summaryValue}>{salesLog.length}</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: "#10B981" }]}>
          <Text style={[styles.summaryLabel, { color: "#047857" }]}>Gross Today</Text>
          <Text style={[styles.summaryValue, { color: "#10B981" }]}>৳10,000</Text>
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
              <View>
                <Text style={styles.invoiceId}>{sale.id}</Text>
                <Text style={styles.metaTimeSubtext}>
                  Time: {sale.time} • Operator: {sale.operator}
                </Text>
              </View>
              
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: sale.status === "Paid" ? "#E6F4EA" : "#FEF3C7" },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: sale.status === "Paid" ? "#137333" : "#D97706" },
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
                  • {item.name} <Text style={{ fontWeight: "700" }}>x{item.qty}</Text> (৳{item.price})
                </Text>
              ))}
            </View>

            {/* Footer containing pricing execution fields */}
            <View style={styles.cardFooterRow}>
              <Text style={styles.totalLabel}>Grand Collection</Text>
              <Text style={styles.totalValue}>{sale.total}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  contentContainer: { padding: 20, paddingBottom: 40 },

  // Navigation layout header structure
  navHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  syncButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  navTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },

  // Top Metric Cards Box
  summaryStrip: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: "#FFF", borderLeftWidth: 4, borderLeftColor: "#3B82F6", padding: 12, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  summaryLabel: { fontSize: 11, fontWeight: "600", color: "#64748B", uppercase: true },
  summaryValue: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginTop: 4 },

  // Search input components setup
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, height: 44, paddingHorizontal: 12, marginBottom: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: "#0F172A", fontSize: 14, height: "100%", fontWeight: "500" },

  // Segment Tab Filtering bars layouts
  filterRow: { flexDirection: "row", marginBottom: 24, backgroundColor: "#F1F5F9", borderRadius: 8, padding: 4 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  activeFilterTab: { backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 },
  filterTabText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  activeFilterTabText: { color: "#0F172A", fontWeight: "700" },

  // Ledger manifest cards item styling
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