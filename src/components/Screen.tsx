import type { ReactNode } from "react";
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import { colors, fonts } from "../theme";

interface ScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({ title, subtitle, children, refreshing, onRefresh }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.ink} /> : undefined}
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 8, gap: 12 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, marginBottom: 2 },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: -6 },
});
