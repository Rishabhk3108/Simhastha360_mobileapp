import { useCallback, useEffect } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts as useMarcellus, Marcellus_400Regular } from "@expo-google-fonts/marcellus";
import { useFonts as useRozha, RozhaOne_400Regular } from "@expo-google-fonts/rozha-one";
import {
  useFonts as useDMSans,
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import "./src/i18n";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { PilgrimProvider, usePilgrim } from "./src/pilgrim/PilgrimContext";
import { LanguageProvider, useLanguage } from "./src/language/LanguageContext";
import { AppStack } from "./src/navigation/AppStack";
import { colors } from "./src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate({ fontsReady }: { fontsReady: boolean }) {
  const { ready: authReady } = useAuth();
  const { ready: pilgrimReady } = usePilgrim();
  const { ready: languageReady, hasChosenLanguage } = useLanguage();
  const ready = authReady && pilgrimReady && languageReady;
  const onLayout = useCallback(async () => {
    if (ready && fontsReady) {
      await SplashScreen.hideAsync();
    }
  }, [ready, fontsReady]);

  useEffect(() => {
    onLayout();
  }, [onLayout]);

  if (!ready || !fontsReady) return null;
  return <AppStack initialRouteName={hasChosenLanguage ? "Splash" : "LanguageSelection"} />;
}

export default function App() {
  const [marcellusLoaded] = useMarcellus({ Marcellus_400Regular });
  const [rozhaLoaded] = useRozha({ RozhaOne_400Regular });
  const [dmSansLoaded] = useDMSans({ DMSans_300Light, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  const fontsReady = marcellusLoaded && rozhaLoaded && dmSansLoaded;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <LanguageProvider>
          <AuthProvider>
            <PilgrimProvider>
              <NavigationContainer>
                <Gate fontsReady={fontsReady} />
                <StatusBar style="dark" />
              </NavigationContainer>
            </PilgrimProvider>
          </AuthProvider>
        </LanguageProvider>
      </View>
    </SafeAreaProvider>
  );
}
