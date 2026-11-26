import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Keyboard, KeyboardStyle } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

let shellInitialized = false;

function isDevIosPreview(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("iosPreview") === "1") {
      sessionStorage.setItem("gampetoo-dev-ios-preview", "1");
      return true;
    }
    if (params.get("iosPreview") === "0") {
      sessionStorage.removeItem("gampetoo-dev-ios-preview");
      return false;
    }
    return sessionStorage.getItem("gampetoo-dev-ios-preview") === "1";
  } catch {
    return false;
  }
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform() || isDevIosPreview();
}

export function isNativeIos(): boolean {
  return (
    (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") ||
    isDevIosPreview()
  );
}

/**
 * Configures the native iOS shell (status bar, keyboard theme, splash screen,
 * foreground/background lifecycle hooks). Completely inert on web PWA.
 */
export async function initNativeShell(
  onAppResume?: () => void,
  onAppPause?: () => void,
): Promise<void> {
  if (!isNativeApp() || shellInitialized) return;
  shellInitialized = true;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // Safe to ignore on simulators or platforms where StatusBar is unavailable.
  }

  try {
    await Keyboard.setStyle({ style: KeyboardStyle.Dark });
    // Keep iOS's native Done/toolbar visible above decimal/numeric keypads,
    // which otherwise have no Return key to dismiss the keyboard.
    await Keyboard.setAccessoryBarVisible({ isVisible: true });
  } catch {
    // Ignore if Keyboard plugin is not active.
  }

  try {
    await App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        onAppResume?.();
      } else {
        onAppPause?.();
      }
    });
  } catch {
    // Ignore listener setup errors.
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Ignore if splash screen already hid automatically.
  }
}
