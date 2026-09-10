import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Translate } from "./icons";
import { useLanguage } from "../language/LanguageContext";
import { colors, fonts } from "../theme";

// Deliberately not run through t() - each label names the language you'd be
// switching TO, written in that language's own script, so it stays findable
// no matter which language you're currently stuck looking at.
export function LanguageToggleButton() {
  const { language, setLanguage } = useLanguage();

  return (
    <TouchableOpacity style={styles.button} onPress={() => setLanguage(language === "en" ? "hi" : "en")}>
      <Translate size={16} color={colors.tealDeep} />
      <Text style={styles.text}>{language === "en" ? "हिन्दी में बदलें" : "Switch to English"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.tealTint,
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 8,
  },
  text: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.tealDeep },
});
