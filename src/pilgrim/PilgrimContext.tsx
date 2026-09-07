import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/client";
import type { GuardianFields, PilgrimFields } from "../screens/onboarding/types";

export interface PilgrimProfile {
  pilgrimId: number;
  registeredVia: "self" | "guardian";
  pilgrim: PilgrimFields;
  guardian: GuardianFields;
}

interface PilgrimIdentity {
  profile: PilgrimProfile | null;
  ready: boolean;
  setProfile: (profile: PilgrimProfile) => Promise<void>;
  clearProfile: () => Promise<void>;
}

const STORAGE_KEY = "s360_pilgrim_profile";

const PilgrimContext = createContext<PilgrimIdentity | null>(null);

export function PilgrimProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<PilgrimProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: PilgrimProfile | null = stored ? JSON.parse(stored) : null;

      if (parsed) {
        try {
          await api.get(`/pilgrims/${parsed.pilgrimId}`);
        } catch (err: any) {
          if (err.response?.status === 404) {
            // The device remembers a registration the backend no longer has
            // (e.g. the database was reset independently of this phone) -
            // clear the stale local profile so onboarding runs again.
            await AsyncStorage.removeItem(STORAGE_KEY);
            setReady(true);
            return;
          }
          // Any other failure (offline, timeout, server error) - don't force
          // a re-registration just because we couldn't verify; fail open.
        }
      }

      setProfileState(parsed);
      setReady(true);
    })();
  }, []);

  async function setProfile(newProfile: PilgrimProfile) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    setProfileState(newProfile);
  }

  async function clearProfile() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setProfileState(null);
  }

  return <PilgrimContext.Provider value={{ profile, ready, setProfile, clearProfile }}>{children}</PilgrimContext.Provider>;
}

export function usePilgrim() {
  const ctx = useContext(PilgrimContext);
  if (!ctx) throw new Error("usePilgrim must be used within PilgrimProvider");
  return ctx;
}
