import * as LocalAuthentication from 'expo-local-authentication';

/** True when the device has biometric hardware with enrolled credentials. */
export async function biometricsAvailable(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export async function authenticateBiometric(promptMessage: string): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({ promptMessage, disableDeviceFallback: false });
    return res.success;
  } catch {
    return false;
  }
}
