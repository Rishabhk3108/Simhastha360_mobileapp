import type { ReactNode } from "react";
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";

interface ScreenProps {
  title: string;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({ title, children, refreshing, onRefresh }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
      >
        <Text style={styles.title}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f6f8" },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4, color: "#1c2733" },
});
