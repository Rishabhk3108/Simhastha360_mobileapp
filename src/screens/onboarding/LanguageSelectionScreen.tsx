import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLanguage, type Language } from "../../language/LanguageContext";
import { colors, fonts } from "../../theme";
import type { OnboardingStackParamList } from "../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "LanguageSelection">;

const OPTIONS: { code: Language; label: string; hint: string }[] = [
  { code: "en", label: "English", hint: "Continue in English" },
  { code: "hi", label: "हिन्दी", hint: "हिन्दी में जारी रखें" },
];

export function LanguageSelectionScreen({ navigation }: Props) {
  const { setLanguage } = useLanguage();

  async function choose(code: Language) {
    await setLanguage(code);
    navigation.replace("Splash");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose your language</Text>
        <Text style={styles.subtitle}>भाषा चुनें</Text>

        {OPTIONS.map((option) => (
          <TouchableOpacity key={option.code} style={styles.card} onPress={() => choose(option.code)}>
            <Text style={styles.cardTitle}>{option.label}</Text>
            <Text style={styles.cardSubtitle}>{option.hint}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: 24, justifyContent: "center", gap: 14 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, textAlign: "center" },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 14 },
  card: {
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.ink },
  cardSubtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },
});
