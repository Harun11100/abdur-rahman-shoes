import React, { useState, useEffect } from "react";
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
  Modal,
  Platform,
  KeyboardAvoidingView,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function PaymentCollection() {
  const router = useRouter();

  // Primary operational states linked to Next.js API
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Focus targets for state update
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Pull initial data on assembly
  useEffect(() => {
    fetchPendingInvoices(searchQuery, true);
  }, []);

  // Debounce network calls to prevent hammering Next.js server while typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPendingInvoices(searchQuery, false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchPendingInvoices = async (query = "", showGlobalLoader = true) => {
    if (showGlobalLoader) setIsLoading(true);
    
    try {
      const targetUrl = `${API_URL}/api/dashboard/invoices?status=Pending&search=${encodeURIComponent(query)}`;
      const response = await fetch(targetUrl);
      const json = await response.json();
      
      if (response.ok && json.success) {
        setInvoices(json.data || []);
      } else {
        setInvoices([]);
        Alert.alert("Sync Error", json.message || "Could not retrieve ledger balance updates.");
      }
    } catch (err) {
      console.error("Network interface disconnected:", err);
      setInvoices([]);
      Alert.alert("Connection Failure", "Unable to connect to the cloud database server.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPendingInvoices(searchQuery, false);
  };

  const handleOpenSettleModal = (invoice) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  };

  const handleUpdatePaymentStatus = async () => {
    if (!selectedInvoice) return;
    setIsUpdating(true);

    try {
      const response = await fetch(`${API_URL}/api/dashboard/invoice-update-route`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          status: "Paid"
        })
      });

      const json = await response.json();

      if (response.ok && json.success) {
        Alert.alert("Success", `Invoice ${selectedInvoice.id} has been marked as settled.`);
        // Pop record dynamically from the active UI state array
        setInvoices((prev) => prev.filter((inv) => inv.id !== selectedInvoice.id));
      } else {
        Alert.alert("Mutation Refused", json.message || "Failed to update ledger balance status.");
      }
    } catch (err) {
      console.error("Mutation submission failure:", err);
      Alert.alert("Network Failure", "Could not send execution update. Check your connectivity.");
    } finally {
      setIsUpdating(false);
      setModalVisible(false);
      setSelectedInvoice(null);
    }
  };

  const renderInvoiceCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.invoiceCard} 
      activeOpacity={0.7}
      onPress={() => handleOpenSettleModal(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.invoiceIdBadge}>
          <Text style={styles.invoiceIdText}>{item.id}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.amberDot} />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        
        <View style={styles.metaRow}>
          <Ionicons name="call-outline" size={14} color="#64748B" />
          <Text style={styles.metaText}>{item.phoneNumber}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="cube-outline" size={14} color="#64748B" />
          <Text style={styles.metaText} numberOfLines={1}>{item.items}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#64748B" />
          <Text style={styles.metaText}>Created {item.time}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>Amount Due</Text>
        <Text style={styles.totalAmount}>৳{item.amount.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />
      
      {/* Search Header Banner */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Collect Payments</Text>
          <Text style={styles.headerSubtitle}>Resolve pending transactions and clear dues</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Stream Dynamic Queue Layout */}
      {isLoading ? (
        <View style={styles.centeredView}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Fetching unresolved invoices...</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          renderItem={renderInvoiceCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              colors={["#3B82F6"]}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Pending Dues</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? "Try refining your query search credentials" : "All customer transactions are fully settled!"}
              </Text>
            </View>
          }
        />
      )}

      {/* Modern Action Collection Overlay Drawer */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContentWrapper}
          >
            <View style={styles.bottomSheetCard}>
              <View style={styles.notchIndicator} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Receive Payment</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} disabled={isUpdating}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              {selectedInvoice && (
                <View style={styles.modalBody}>
                  <Text style={styles.summaryLabel}>CUSTOMER SUMMARY</Text>
                  
                  <View style={styles.summaryContainer}>
                    <View style={styles.summaryLine}>
                      <Text style={styles.sumLabel}>Customer</Text>
                      <Text style={styles.sumVal}>{selectedInvoice.customerName}</Text>
                    </View>
                    <View style={styles.summaryLine}>
                      <Text style={styles.sumLabel}>Phone No.</Text>
                      <Text style={styles.sumVal}>{selectedInvoice.phoneNumber}</Text>
                    </View>
                    <View style={styles.summaryLine}>
                      <Text style={styles.sumLabel}>Invoice ID</Text>
                      <Text style={styles.sumVal}>{selectedInvoice.id}</Text>
                    </View>
                    <View style={styles.summaryLine}>
                      <Text style={styles.sumLabel}>Purchased</Text>
                      <Text style={styles.sumVal} numberOfLines={1}>{selectedInvoice.items}</Text>
                    </View>
                  </View>

                  <View style={styles.amountBox}>
                    <Text style={styles.amountBoxLabel}>Total Collected Amount</Text>
                    <Text style={styles.amountBoxValue}>৳{selectedInvoice.amount.toLocaleString()}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.settleButton, isUpdating && styles.disabledButton]}
                    activeOpacity={0.8}
                    onPress={handleUpdatePaymentStatus}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={styles.btnIcon} />
                        <Text style={styles.settleButtonText}>Mark as PAID & Settle</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#E2E8F0" },
  backButton: { marginRight: 14, padding: 4 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  headerSubtitle: { fontSize: 11, color: "#64748B", marginTop: 1 },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#E2E8F0" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 10, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "500", padding: 0 },
  listContainer: { padding: 20, paddingBottom: 40 },
  invoiceCard: { backgroundColor: "#FFF", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.01, shadowRadius: 3, elevation: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  invoiceIdBadge: { backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  invoiceIdText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  statusBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  amberDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#D97706", marginRight: 4 },
  statusText: { fontSize: 10, fontWeight: "700", color: "#B45309", textTransform: "uppercase" },
  cardBody: { marginBottom: 14 },
  customerName: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  metaText: { fontSize: 12, color: "#64748B", marginLeft: 6, fontWeight: "500" },
  cardDivider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 12 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  totalAmount: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  loadingText: { fontSize: 13, color: "#64748B", marginTop: 10, fontWeight: "500" },
  emptyContainer: { alignItems: "center", justifyContent: "center", marginTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#475569", marginTop: 14 },
  emptySubtitle: { fontSize: 13, color: "#94A3B8", textAlign: "center", marginTop: 6, paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "flex-end" },
  modalContentWrapper: { width: "100%" },
  bottomSheetCard: { backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24 },
  notchIndicator: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  modalBody: {},
  summaryLabel: { fontSize: 11, fontWeight: "700", color: "#94A3B8", letterSpacing: 1, marginBottom: 10 },
  summaryContainer: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 20 },
  summaryLine: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  sumLabel: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  sumVal: { fontSize: 13, color: "#0F172A", fontWeight: "600", maxWidth: "60%" },
  amountBox: { backgroundColor: "#EFF6FF", borderRadius: 12, borderLeftWidth: 4, borderColor: "#3B82F6", padding: 16, marginBottom: 24 },
  amountBoxLabel: { fontSize: 12, color: "#1D4ED8", fontWeight: "600" },
  amountBoxValue: { fontSize: 24, fontWeight: "800", color: "#1E40AF", marginTop: 4 },
  settleButton: { flexDirection: "row", backgroundColor: "#10B981", height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  disabledButton: { backgroundColor: "#94A3B8" },
  btnIcon: { marginRight: 6 },
  settleButtonText: { color: "#FFF", fontWeight: "700", fontSize: 14 }
});