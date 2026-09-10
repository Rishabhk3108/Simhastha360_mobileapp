import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LanguageSelectionScreen } from "../screens/onboarding/LanguageSelectionScreen";
import { SplashScreen } from "../screens/onboarding/SplashScreen";
import { RoleSelectionScreen } from "../screens/onboarding/RoleSelectionScreen";
import { AccountCheckScreen } from "../screens/onboarding/AccountCheckScreen";
import { SignInScreen } from "../screens/onboarding/SignInScreen";
import { PilgrimRegisterScreen } from "../screens/onboarding/PilgrimRegisterScreen";
import { GuardianEntryScreen } from "../screens/onboarding/guardian/GuardianEntryScreen";
import { GuardianLoginScreen } from "../screens/onboarding/guardian/GuardianLoginScreen";
import { GuardianRegisterScreen } from "../screens/onboarding/guardian/GuardianRegisterScreen";
import { VolunteerEntryScreen } from "../screens/onboarding/volunteer/VolunteerEntryScreen";
import { VolunteerLoginScreen } from "../screens/onboarding/volunteer/VolunteerLoginScreen";
import { VolunteerRegisterScreen } from "../screens/onboarding/volunteer/VolunteerRegisterScreen";
import { VolunteerStatusScreen } from "../screens/onboarding/volunteer/VolunteerStatusScreen";
import { ForeignerEntryScreen } from "../screens/onboarding/foreigner/ForeignerEntryScreen";
import { ForeignerLoginScreen } from "../screens/onboarding/foreigner/ForeignerLoginScreen";
import { ForeignerRegisterScreen } from "../screens/onboarding/foreigner/ForeignerRegisterScreen";
import { ForeignerWelcomeScreen } from "../screens/onboarding/ForeignerWelcomeScreen";
import { RootNavigator } from "./RootNavigator";

export type OnboardingStackParamList = {
  LanguageSelection: undefined;
  Splash: undefined;
  RoleSelection: undefined;
  AccountCheck: undefined;
  SignIn: undefined;
  PilgrimRegister: undefined;
  GuardianEntry: undefined;
  GuardianLogin: undefined;
  GuardianRegister: undefined;
  VolunteerEntry: undefined;
  VolunteerLogin: undefined;
  VolunteerRegister: undefined;
  VolunteerStatus: { status: "pending" | "rejected"; reviewNote?: string | null; justSubmitted?: boolean };
  ForeignerEntry: undefined;
  ForeignerLogin: undefined;
  ForeignerRegister: undefined;
  ForeignerWelcome: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function AppStack({ initialRouteName }: { initialRouteName: "LanguageSelection" | "Splash" }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="AccountCheck" component={AccountCheckScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="PilgrimRegister" component={PilgrimRegisterScreen} />
      <Stack.Screen name="GuardianEntry" component={GuardianEntryScreen} />
      <Stack.Screen name="GuardianLogin" component={GuardianLoginScreen} />
      <Stack.Screen name="GuardianRegister" component={GuardianRegisterScreen} />
      <Stack.Screen name="VolunteerEntry" component={VolunteerEntryScreen} />
      <Stack.Screen name="VolunteerLogin" component={VolunteerLoginScreen} />
      <Stack.Screen name="VolunteerRegister" component={VolunteerRegisterScreen} />
      <Stack.Screen name="VolunteerStatus" component={VolunteerStatusScreen} />
      <Stack.Screen name="ForeignerEntry" component={ForeignerEntryScreen} />
      <Stack.Screen name="ForeignerLogin" component={ForeignerLoginScreen} />
      <Stack.Screen name="ForeignerRegister" component={ForeignerRegisterScreen} />
      <Stack.Screen name="ForeignerWelcome" component={ForeignerWelcomeScreen} />
      <Stack.Screen name="Main" component={RootNavigator} />
    </Stack.Navigator>
  );
}
