import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "s360_device_id";

function randomId(): string {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  let id = await AsyncStorage.getItem(KEY);
  if (!id) {
    id = randomId();
    await AsyncStorage.setItem(KEY, id);
  }
  cached = id;
  return id;
}
