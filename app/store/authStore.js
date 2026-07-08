// store/authStore.js
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false, // Tracks if we've finished reading from AsyncStorage

  // Called once when the root layout mounts
  checkSavedSession: async () => {
    try {
      const savedUser = await AsyncStorage.getItem("@user_session");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        set({ user: parsedUser, isAuthenticated: true });
      }
    } catch (e) {
      console.error("Error reading authentication state", e);
    } finally {
      set({ isHydrated: true });
    }
  },

  login: async (email, password, role) => {
    // Mimic API logic
    const mockUser = {
      name: role === "admin" ? "AyEsha(Admin)" : "Ayesha",
      role: role,
      email: email,
    };

    await AsyncStorage.setItem("@user_session", JSON.stringify(mockUser));
    set({ user: mockUser, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem("@user_session");
    set({ user: null, isAuthenticated: false });
  },
}));