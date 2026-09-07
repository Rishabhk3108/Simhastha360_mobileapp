import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MapTrifold, Lifebuoy, Sparkle, UserCircle, ClipboardText } from "phosphor-react-native";
import { HomeScreen } from "../screens/HomeScreen";
import { FindHelpScreen } from "../screens/FindHelpScreen";
import { SafetyScreen } from "../screens/SafetyScreen";
import { AIAssistantScreen } from "../screens/AIAssistantScreen";
import { AccountScreen } from "../screens/AccountScreen";
import { TasksScreen } from "../screens/TasksScreen";
import { useAuth } from "../auth/AuthContext";
import { colors, fonts } from "../theme";

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const { role } = useAuth();
  const showTasksTab = role === "volunteer" || role === "field_team";

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <MapTrifold size={size} color={color} weight="fill" /> }} />
      <Tab.Screen name="Find Help" component={FindHelpScreen} options={{ tabBarIcon: ({ color, size }) => <Lifebuoy size={size} color={color} /> }} />
      <Tab.Screen name="Safety" component={SafetyScreen} options={{ tabBarIcon: ({ color, size }) => <Lifebuoy size={size} color={color} weight="fill" /> }} />
      {showTasksTab && (
        <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: ({ color, size }) => <ClipboardText size={size} color={color} weight="fill" /> }} />
      )}
      <Tab.Screen name="Assistant" component={AIAssistantScreen} options={{ tabBarIcon: ({ color, size }) => <Sparkle size={size} color={color} weight="fill" /> }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
