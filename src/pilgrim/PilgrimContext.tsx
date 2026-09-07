import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PilgrimIdentity {
  pilgrimId: string | null;
  name: string | null;
  registeredVia: "self" | "guardian" | null;
  ready: boolean;
  setIdentity: (pilgrimId: number, name: string, registeredVia: "self" | "guardian") => Promise<void>;
  clearIdentity: () => Promise<void>;
}

const PilgrimContext = createContext<PilgrimIdentity | null>(null);

export function PilgrimProvider({ children }: { children: ReactNode }) {
  const [pilgrimId, setPilgrimId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [registeredVia, setRegisteredVia] = useState<"self" | "guardian" | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [storedId, storedName, storedVia] = await Promise.all([
        AsyncStorage.getItem("s360_pilgrim_id"),
        AsyncStorage.getItem("s360_pilgrim_name"),
        AsyncStorage.getItem("s360_pilgrim_registered_via"),
      ]);
      setPilgrimId(storedId);
      setName(storedName);
      setRegisteredVia(storedVia as "self" | "guardian" | null);
      setReady(true);
    })();
  }, []);

  async function setIdentity(newPilgrimId: number, newName: string, newRegisteredVia: "self" | "guardian") {
    await AsyncStorage.multiSet([
      ["s360_pilgrim_id", String(newPilgrimId)],
      ["s360_pilgrim_name", newName],
      ["s360_pilgrim_registered_via", newRegisteredVia],
    ]);
    setPilgrimId(String(newPilgrimId));
    setName(newName);
    setRegisteredVia(newRegisteredVia);
  }

  async function clearIdentity() {
    await AsyncStorage.multiRemove(["s360_pilgrim_id", "s360_pilgrim_name", "s360_pilgrim_registered_via"]);
    setPilgrimId(null);
    setName(null);
    setRegisteredVia(null);
  }

  return (
    <PilgrimContext.Provider value={{ pilgrimId, name, registeredVia, ready, setIdentity, clearIdentity }}>
      {children}
    </PilgrimContext.Provider>
  );
}

export function usePilgrim() {
  const ctx = useContext(PilgrimContext);
  if (!ctx) throw new Error("usePilgrim must be used within PilgrimProvider");
  return ctx;
}
