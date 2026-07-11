import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ShoeSizeSelector() {
  // 1. State for managing active customer segment toggle
  const [selectedCategory, setSelectedCategory] = useState("Men"); // Fallback defaults to 'Men'
  
  // 2. State for tracking the specifically clicked shoe size chip
  const [selectedSize, setSelectedSize] = useState(null);

  // 3. Dynamic layout rule compilation based on category selection
  const sizeOptions = useMemo(() => {
    let start = 39, end = 45;

    if (selectedCategory === "Women") {
      start = 35;
      end = 40;
    } else if (selectedCategory === "Children") {
      start = 19;
      end = 29;
    }

    // Generate consecutive integers array between target scopes
    const sizesArray = [];
    for (let i = start; i <= end; i++) {
      sizesArray.push(i);
    }
    return sizesArray;
  }, [selectedCategory]);

  // Handle category changes and reset selected size safely
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedSize(null); 
  };

  return (
    <View style={styles.container}>
      {/* SECTION LABEL */}
      <Text style={styles.sectionTitle}>Target Customer Segment</Text>

      {/* PREMIUM SEGMENTED TOGGLE TRACK BAR */}
      <View style={styles.toggleTrackContainer}>
        {["Men", "Women", "Children"].map((category) => {
          const isActive = selectedCategory === category;
          
          // Render segment contextual layout icons
          let iconName = "man-outline";
          if (category === "Women") iconName = "woman-outline";
          if (category === "Children") iconName = "balloon-outline";

          return (
            <TouchableOpacity
              key={category}
              activeOpacity={0.8}
              style={[styles.toggleSegment, isActive && styles.toggleSegmentActive]}
              onPress={() => handleCategoryChange(category)}
            >
              <Ionicons 
                name={iconName} 
                size={14} 
                color={isActive ? "#3B82F6" : "#64748B"} 
                style={styles.segmentIcon} 
              />
              <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* DYNAMIC SHIFTING SIZE OPTIONS PANEL */}
      <Text style={styles.sectionTitle}>Available Sizes ({selectedCategory})</Text>
      
      <View style={styles.sizeGrid}>
        {sizeOptions.map((size) => {
          const isSizeSelected = selectedSize === size;

          return (
            <TouchableOpacity
              key={size}
              activeOpacity={0.7}
              style={[styles.sizeChip, isSizeSelected && styles.sizeChipActive]}
              onPress={() => setSelectedSize(size)}
            >
              <Text style={[styles.sizeText, isSizeSelected && styles.sizeTextActive]}>
                EU {size}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  
  // Premium Segmented Pill Bar Styles
  toggleTrackContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleSegment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 9,
  },
  toggleSegmentActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentIcon: {
    marginRight: 4,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  toggleTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },

  // Premium Mini Size Option Chip Grids
  sizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeChip: {
    width: "22.5%", // Exactly 4 columns across inside the card with gap allocation
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sizeChipActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  sizeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  sizeTextActive: {
    color: "#3B82F6",
    fontWeight: "700",
  },
});