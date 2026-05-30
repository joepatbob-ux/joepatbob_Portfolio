import type { PhoneDevice, PhoneSwapSnapshot } from '@/lib/phone-swap/phoneSwapLayout'

export function backDeviceFromSnapshot(
  snapshot: PhoneSwapSnapshot,
): PhoneDevice {
  if (snapshot.android.renderOrder !== snapshot.iphone.renderOrder) {
    return snapshot.android.renderOrder < snapshot.iphone.renderOrder
      ? 'android'
      : 'iphone'
  }
  return snapshot.android.scale <= snapshot.iphone.scale ? 'android' : 'iphone'
}

export function frontDeviceFromSnapshot(
  snapshot: PhoneSwapSnapshot,
): PhoneDevice {
  return backDeviceFromSnapshot(snapshot) === 'android' ? 'iphone' : 'android'
}
