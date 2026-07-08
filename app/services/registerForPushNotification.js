import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBadge: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  // =========================
  // CHECK REAL DEVICE
  // =========================

  if (!Device.isDevice) {

    return null;
  }

  // =========================
  // REQUEST PERMISSION
  // =========================

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== "granted") {
   

    return null;
  }

  // =========================
  // GET EXPO TOKEN
  // =========================

  try {
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId:
          "cf6d38c8-e70a-47a8-a577-992e442a2308",
      })
    ).data;

  } catch (err) {
    console.error(
      "❌ Failed to get Expo push token:",
      err
    );
    return null;
  }

  // =========================
  // ANDROID CHANNEL
  // =========================

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      "default",
      {
        name: "default",
        importance:
          Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      }
    );
  }

  return token;
}