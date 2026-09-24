import { CameraView, useCameraPermissions } from 'expo-camera';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export interface CameraBackdropHandle {
  /** Takes a picture if the camera is live; resolves undefined in demo mode. */
  capture: () => Promise<string | undefined>;
}

/**
 * Live camera background with automatic fallback to a static demo scene
 * (emulator, web, permission denied or `demo` forced).
 */
export const CameraBackdrop = forwardRef<CameraBackdropHandle, { demo?: boolean; fallback: ReactNode; onModeChange?: (live: boolean) => void }>(
  function CameraBackdrop({ demo, fallback, onModeChange }, ref) {
    const [permission, requestPermission] = useCameraPermissions();
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);
    const cam = useRef<CameraView>(null);

    useEffect(() => {
      if (!demo && permission && !permission.granted && permission.canAskAgain) requestPermission().catch(() => setFailed(true));
    }, [demo, permission, requestPermission]);

    const live = !demo && !failed && !!permission?.granted && Platform.OS !== 'web';
    useEffect(() => onModeChange?.(live), [live, onModeChange]);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (!live || !ready || !cam.current) return undefined;
        try {
          const pic = await cam.current.takePictureAsync({ quality: 0.6 });
          return pic?.uri;
        } catch {
          return undefined;
        }
      },
    }));

    return (
      <View style={StyleSheet.absoluteFill}>
        {live ? (
          <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} onMountError={() => setFailed(true)} />
        ) : (
          fallback
        )}
      </View>
    );
  },
);
