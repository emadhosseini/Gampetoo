import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

import { isNativeApp } from "./platform";

export function hapticLight(): void {
  if (!isNativeApp()) return;
  void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

export function hapticMedium(): void {
  if (!isNativeApp()) return;
  void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
}

export function hapticHeavy(): void {
  if (!isNativeApp()) return;
  void Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
}

export function hapticSuccess(): void {
  if (!isNativeApp()) return;
  void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}

export function hapticWarning(): void {
  if (!isNativeApp()) return;
  void Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
}

export function hapticSelection(): void {
  if (!isNativeApp()) return;
  void Haptics.selectionChanged().catch(() => {});
}
