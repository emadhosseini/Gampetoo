import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gampetoo.app",
  appName: "Gampetoo",
  webDir: "dist",
  ios: {
    // Let CSS env(safe-area-inset-*) handle notch/Dynamic Island/home indicator
    // consistently with MobileContainer and BottomNavigation.
    contentInset: "never",
    backgroundColor: "#132f18",
    allowsLinkPreview: false,
    preferredContentMode: "mobile",
    // Explicitly keep the standard Capacitor scheme so CORS allow-lists in
    // Supabase Edge Functions ("capacitor://localhost") match reliably.
    scheme: "capacitor",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 450,
      launchAutoHide: true,
      launchFadeOutDuration: 250,
      backgroundColor: "#132f18",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      sound: "default",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
