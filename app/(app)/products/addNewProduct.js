import React, { useState, useMemo, useEffect } from "react";
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
  Image,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { uploadImages } from "../../upload/upload";
import * as ImagePicker from "expo-image-picker";

export default function AddNewProductForm() {
  const router = useRouter();
  
  const [prodName, setProdName] = useState("");
  const [prodCode, setProdCode] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImages, setProductImages] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState("Men"); 

  const pickImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please grant permission to access the media library.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 3,
        quality: 0.7,
      });

      if (!result.canceled) {
        setProductImages((prev) => [...prev, ...result.assets].slice(0, 3));
      }
    } catch (error) {
      Alert.alert("ত্রুটি", "ছবি নির্বাচন করা যায়নি");
    }
  };

  const removeImage = (index) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const availableSizes = useMemo(() => {
    let start = 39, end = 45;
    if (selectedCategory === "Women") { start = 36; end = 45; }
    else if (selectedCategory === "Children") { start = 15; end = 40; }
    
    const sizesArray = [];
    for (let i = start; i <= end; i++) {
      sizesArray.push(String(i));
    }
    return sizesArray;
  }, [selectedCategory]);

  const [selectedSize, setSelectedSize] = useState("39"); 

  useEffect(() => {
    if (selectedCategory === "Men") setSelectedSize("39");
    else if (selectedCategory === "Women") setSelectedSize("36");
    else if (selectedCategory === "Children") setSelectedSize("15");
  }, [selectedCategory]);
  
  const [sizeQuantities, setSizeQuantities] = useState({
    Men: { "39": "0", "40": "0", "41": "0", "42": "0", "43": "0", "44": "0", "45": "0" },
    Women: { "36": "0", "37": "0", "38": "0", "39": "0", "40": "0", "41": "0", "42": "0", "43": "0", "44": "0", "45": "0" },
    Children: {
      "15":"0","16":"0","17":"0", "18": "0", "19": "0", "20": "0", "21": "0",
      "22": "0", "23": "0", "24": "0", "25": "0", "26": "0", "27": "0", "28": "0",
      "29": "0","30": "0","31": "0", "32": "0", "33": "0", "34": "0", "35": "0",
      "36": "0", "37": "0", "38": "0", "39": "0", "40": "0"
    },
  });
  
  const adjustQuantity = (amount) => {
    const current = parseInt(sizeQuantities[selectedCategory][selectedSize], 10) || 0;
    const computed = current + amount;
    const updatedValue = computed >= 0 ? String(computed) : "0";
    
    setSizeQuantities(prev => ({
      ...prev,
      [selectedCategory]: {
        ...prev[selectedCategory],
        [selectedSize]: updatedValue,
      },
    }));
  };

  const handleManualQtyChange = (text) => {
    setSizeQuantities(prev => ({
      ...prev,
      [selectedCategory]: {
        ...prev[selectedCategory],
        [selectedSize]: text.replace(/[^0-9]/g, ""),
      },
    }));
  };

  const handleFormSubmit = async () => {
    if (!prodName.trim() || !prodCode.trim() || !sellingPrice.trim()) {
      Alert.alert("Required Fields Missing", "Please provide a Shoe Model Name, Unique Code/SKU, and Retail Selling Price.");
      return;
    }
    if (productImages.length === 0) {
      return Alert.alert("Image Required", "Please add at least one image.");
    }

    try {
      setIsSubmitting(true);
      let remoteUrls = [];

      const imageFormData = new FormData();
      productImages.forEach((img) => {
        const fileExtension = img.uri.substring(img.uri.lastIndexOf(".") + 1);
        imageFormData.append("images", {
          uri: Platform.OS === "ios" ? img.uri.replace("file://", "") : img.uri,
          name: img.fileName || `product-${Date.now()}.${fileExtension}`,
          type: img.mimeType || `image/${fileExtension}`,
        });
      });

      remoteUrls = await uploadImages(imageFormData);
      if (!remoteUrls || remoteUrls.length === 0) {
        throw new Error("Image upload failed");
      }

      const payload = {
        formType: "new",
        prodCode: prodCode.trim().toUpperCase(),
        prodName: prodName.trim(),
        modelNumber: modelNumber.trim(),
        selectedCategory,
        selectedSize,
        sizeQuantities: sizeQuantities[selectedCategory],
        costPrice: costPrice || "0",
        sellingPrice: sellingPrice,
        images: remoteUrls, 
      };

      const BACKEND_URL = "https://abdur-rahman-shoes-web-app.vercel.app/api/admin/product/addProduct"; 

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Server rejected transaction logic.");
      }

      Alert.alert(
        "Inventory Synced", 
        `"${prodName}" has been initialized into your digital ledger catalogs.`
      );

      setProdName("");
      setProdCode("");
      setModelNumber("");
      setCostPrice("");
      setSellingPrice("");
      setProductImages([]); 
      
      const deepReset = JSON.parse(JSON.stringify(sizeQuantities));
      Object.keys(deepReset).forEach(cat => {
        Object.keys(deepReset[cat]).forEach(size => {
          deepReset[cat][size] = "0";
        });
      });
      setSizeQuantities(deepReset);

    } catch (error) {
      console.error("Network synchronization fault:", error);
      Alert.alert("Sync Operation Failed", error.message || "Could not reach database network relay nodes.");
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
          <Text style={styles.navTitle}>Inbound Shoe Logistics</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Informational Subtitle */}
        <View style={styles.infoSection}>
          <Text style={styles.formSectionTitle}>Register Fresh Footwear Profile</Text>
          <Text style={styles.infoSubtitle}>
            Creates a completely new product row inside your system ledger database.
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.cardForm}>
          <Text style={styles.inputLabel}>Target Customer Segment</Text>
          <View style={styles.categoryToggleTrack}>
            {["Men", "Women", "Children"].map((category) => {
              const isCatActive = selectedCategory === category;
              let segmentIcon = "man-outline";
              if (category === "Women") segmentIcon = "woman-outline";
              if (category === "Children") segmentIcon = "balloon-outline";

              return (
                <TouchableOpacity
                  key={category}
                  activeOpacity={0.8}
                  style={[styles.categorySegment, isCatActive && styles.categorySegmentActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Ionicons 
                    name={segmentIcon} 
                    size={14} 
                    color={isCatActive ? "#10B981" : "#64748B"} 
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.categoryToggleText, isCatActive && styles.categoryToggleTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PRODUCT CODE / BASE SKU */}
          <Text style={styles.inputLabel}>Base SKU / Model Number <Text style={styles.requiredAsterisk}>*</Text></Text>
          <View style={styles.inputFieldBox}>
            <Ionicons name="barcode-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g., NKE-AIRMAX-2026"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={prodCode}
              onChangeText={setProdCode}
            />
          </View>

          {/* PRODUCT MEDIA GALLERY */}
          <Text style={styles.sectionLabel}>Product Media Gallery</Text>
          <View style={styles.imageGrid}>
            <TouchableOpacity style={styles.addImgBtn} onPress={pickImages}>
              <View style={styles.uploadIconCircle}>
                <Feather name="camera" size={20} color="#059669" />
              </View>
              <Text style={styles.addImgText}>{productImages.length}/3 Upload</Text>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
              {productImages.map((img, index) => (
                <View key={index} style={styles.imgWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.previewImg} />
                  <TouchableOpacity style={styles.removeBadge} onPress={() => removeImage(index)}>
                    <Feather name="x" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* SHOE MODEL NAME */}
          <Text style={styles.inputLabel}>Shoe Model Name <Text style={styles.requiredAsterisk}>*</Text></Text>
          <View style={styles.inputFieldBox}>
            <Ionicons name="cube-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Nike Air Max Alpha"
              placeholderTextColor="#94A3B8"
              value={prodName}
              onChangeText={setProdName}
            />
          </View>

          {/* COLORWAY / ARTICLE CODE */}
          <Text style={styles.inputLabel}>Colorway / Article Code</Text>
          <View style={styles.inputFieldBox}>
            <Ionicons name="pricetag-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Black-Crimson-004"
              placeholderTextColor="#94A3B8"
              value={modelNumber}
              onChangeText={setModelNumber}
            />
          </View>

          {/* SIZE MATRIX CONTAINER */}
          <Text style={styles.inputLabel}>Select Variant Size (EU Range)</Text>
          <View style={styles.sizeMatrixGrid}>
            {availableSizes.map((size) => {
              const isSelected = selectedSize === size;
              const hasStock = parseInt(sizeQuantities[selectedCategory][size], 10) > 0;
              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeBubble,
                    isSelected ? styles.activeSizeBubble : null,
                    !isSelected && hasStock ? styles.hasStockSizeBubble : null
                  ]}
                  onPress={() => setSelectedSize(size)}
                >
                  <Text style={[styles.sizeText, isSelected ? styles.activeSizeText : null]}>
                    Size {size}
                  </Text>
                  <Text style={[styles.sizeStockIndicator, isSelected ? styles.activeSizeStockIndicator : null]}>
                    ({sizeQuantities[selectedCategory][size] || 0} pairs)
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* QUANTITY COUNTER ADJUSTMENT */}
          <Text style={styles.inputLabel}>
            Modify Batch Intake for <Text style={styles.focusedSizeLabel}>Size {selectedSize} ({selectedCategory})</Text> <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={styles.counterRow}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => adjustQuantity(-1)}>
              <Ionicons name="remove" size={20} color="#0F172A" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.counterInput}
              keyboardType="number-pad"
              value={sizeQuantities[selectedCategory][selectedSize] || "0"}
              onChangeText={handleManualQtyChange}
              textAlign="center"
            />

            <TouchableOpacity style={styles.counterBtn} onPress={() => adjustQuantity(1)}>
              <Ionicons name="add" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* PRICING SECTIONS */}
          <View style={styles.pricingGridRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.inputLabel}>Purchase Cost</Text>
              <View style={styles.inputFieldBox}>
                <Text style={styles.currencySymbolPrefix}>৳</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="4200"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={costPrice}
                  onChangeText={setCostPrice}
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Retail MRP <Text style={styles.requiredAsterisk}>*</Text></Text>
              <View style={styles.inputFieldBox}>
                <Text style={styles.currencySymbolPrefix}>৳</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="5800"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                />
              </View>
            </View>
          </View>

          {/* SUBMIT BUTTON */}
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
                <Ionicons name="cube-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitActionBtnText}>Save Shoe & Initialize Stock</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  infoSection: { marginBottom: 18 },
  formSectionTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  infoSubtitle: { fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 16 },
  categoryToggleTrack: { flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 12, padding: 4, marginBottom: 20 },
  categorySegment: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 9 },
  categorySegmentActive: { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 },
  categoryToggleText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  categoryToggleTextActive: { color: "#0F172A", fontWeight: "700" },
  cardForm: { backgroundColor: "#FFF", borderRadius: 16, borderStyle: "solid", borderWidth: 1, borderColor: "#E2E8F0", padding: 18, shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8 },
  requiredAsterisk: { color: "#EF4444" },
  inputFieldBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, height: 46, marginBottom: 16, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  currencySymbolPrefix: { fontSize: 15, fontWeight: "700", color: "#64748B", marginRight: 8 },
  textInput: { flex: 1, color: "#0F172A", fontSize: 14, height: "100%", fontWeight: "500" },
  sizeMatrixGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-start", marginBottom: 18 },
  sizeBubble: { width: "31.5%", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingVertical: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  hasStockSizeBubble: { borderColor: "#CBD5E1", backgroundColor: "#F1F5F9" },
  activeSizeBubble: { backgroundColor: "#10B981", borderColor: "#10B981" },
  sizeText: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  activeSizeText: { color: "#FFF" },
  sizeStockIndicator: { fontSize: 10, color: "#64748B", marginTop: 2 },
  activeSizeStockIndicator: { color: "#E6F4EA", fontWeight: "500" },
  focusedSizeLabel: { color: "#10B981", fontWeight: "700" },
  pricingGridRow: { flexDirection: "row", justifyContent: "space-between" },
  counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, height: 48, paddingHorizontal: 6, marginBottom: 20 },
  counterBtn: { width: 38, height: 38, borderRadius: 8, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 1, elevation: 1 },
  counterInput: { flex: 1, fontSize: 16, fontWeight: "700", color: "#0F172A", height: "100%" },
  submitActionBtn: { height: 48, backgroundColor: "#10B981", borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8, shadowColor: "#10B981", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  disabledBtn: { opacity: 0.6 },
  submitActionBtnText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8 },
  imageGrid: { flexDirection: "column", marginBottom: 16 },
  addImgBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderStyle: "dashed", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 12, padding: 12, marginBottom: 8 },
  uploadIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E6F4EA", alignItems: "center", justifyContent: "center", marginRight: 12 },
  addImgText: { fontSize: 13, color: "#059669", fontWeight: "600" },
  previewScroll: { flexDirection: "row" },
  imgWrapper: { position: "relative", marginRight: 10, marginTop: 6 },
  previewImg: { width: 70, height: 70, borderRadius: 8 },
  removeBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#EF4444", width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" }
});