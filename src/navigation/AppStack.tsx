import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SplashScreen } from "../screens/onboarding/SplashScreen";
import { RoleSelectionScreen } from "../screens/onboarding/RoleSelectionScreen";
import { PilgrimRegisterScreen } from "../screens/onboarding/PilgrimRegisterScreen";
import { GuardianRegisterScreen } from "../screens/onboarding/GuardianRegisterScreen";
import { RootNavigator } from "./RootNavigator";

export type OnboardingStackParamList = {
  Splash: undefined;
  RoleSelection: undefined;
  PilgrimRegister: undefined;
  GuardianRegister: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="PilgrimRegister" component={PilgrimRegisterScreen} />
      <Stack.Screen name="GuardianRegister" component={GuardianRegisterScreen} />
      <Stack.Screen name="Main" component={RootNavigator} />
    </Stack.Navigator>
  );
}
