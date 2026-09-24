import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Locale, User } from '@/types/domain';

interface SessionState {
  user: User | null;
  locale: Locale;
  /** Username remembered for biometric sign in. */
  biometricUsername: string | null;
  hydrated: boolean;
  signIn: (user: User) => void;
  signOut: () => void;
  setUser: (user: User) => void;
  setLocale: (locale: Locale) => void;
  setBiometricUsername: (username: string | null) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      locale: 'en',
      biometricUsername: null,
      hydrated: false,
      signIn: (user) => set({ user, biometricUsername: user.username }),
      signOut: () => set({ user: null }),
      setUser: (user) => set({ user }),
      setLocale: (locale) => set({ locale }),
      setBiometricUsername: (biometricUsername) => set({ biometricUsername }),
    }),
    {
      name: 'sense.session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ user, locale, biometricUsername }) => ({ user, locale, biometricUsername }),
      onRehydrateStorage: () => () => useSession.setState({ hydrated: true }),
    },
  ),
);

/** Current user; screens under (app) are guarded so it is always set there. */
export const useUser = () => useSession((s) => s.user) as User;
