import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "../screens/HomeScreen";
import { FindHelpScreen } from "../screens/FindHelpScreen";
import { SafetyScreen } from "../screens/SafetyScreen";
import { AIAssistantScreen } from "../screens/AIAssistantScreen";
import { AccountScreen } from "../screens/AccountScreen";
import { TasksScreen } from "../screens/TasksScreen";
import { useAuth } from "../auth/AuthContext";

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const { role } = useAuth();
  const showTasksTab = role === "volunteer" || role === "field_team";

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Find Help" component={FindHelpScreen} />
      <Tab.Screen name="Safety" component={SafetyScreen} />
      {showTasksTab && <Tab.Screen name="Tasks" component={TasksScreen} />}
      <Tab.Screen name="Assistant" component={AIAssistantScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
