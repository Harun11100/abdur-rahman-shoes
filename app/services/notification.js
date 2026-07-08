// utils/notifications.js
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Alert } from "react-native";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert("ত্রুটি", "Push notifications শুধুমাত্র physical device এ কাজ করবে।");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    Alert.alert("ত্রুটি", "Notification permission দেওয়া হয়নি!");
    return;
  }
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();

    return tokenData.data;
  } catch (err) {
    console.error("Failed to get Expo push token:", err);
    Alert.alert("ত্রুটি", "Push token নেওয়া সম্ভব হয়নি।");
  }
}
