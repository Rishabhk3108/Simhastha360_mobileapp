import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
import { RootNavigator } from "./RootNavigator";

export type OnboardingStackParamList = {
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
  Main: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
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
      <Stack.Screen name="Main" component={RootNavigator} />
    </Stack.Navigator>
  );
}
