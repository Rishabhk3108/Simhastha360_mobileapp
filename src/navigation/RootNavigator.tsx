import { Image, StyleSheet, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MapTrifold, Lifebuoy, Sparkle, UserCircle, ClipboardText, Bell, ChartBar } from "../components/icons";
import { HomeScreen } from "../screens/HomeScreen";
import { FindHelpScreen } from "../screens/FindHelpScreen";
import { SafetyScreen } from "../screens/SafetyScreen";
import { AIAssistantScreen } from "../screens/AIAssistantScreen";
import { AccountScreen } from "../screens/AccountScreen";
import { TasksScreen } from "../screens/TasksScreen";
import { VolunteerHomeScreen } from "../screens/volunteer/VolunteerHomeScreen";
import { VolunteerNotificationsScreen } from "../screens/volunteer/VolunteerNotificationsScreen";
import { VolunteerStatsScreen } from "../screens/volunteer/VolunteerStatsScreen";
import { VolunteerProfileScreen } from "../screens/volunteer/VolunteerProfileScreen";
import { FloatingReportButton } from "../components/FloatingReportButton";
import { SOSResponderOverlay } from "../components/SOSResponderOverlay";
import { useAuth } from "../auth/AuthContext";
import { usePilgrim } from "../pilgrim/PilgrimContext";
import { colors, fonts } from "../theme";

const Tab = createBottomTabNavigator();

function AccountTabIcon({ color, size }: { color: string; size: number }) {
  const { profile } = usePilgrim();
  const photo = profile?.pilgrim.photoBase64;

  if (photo) {
    return <Image source={{ uri: photo }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, borderColor: color }]} />;
  }
  return <UserCircle size={size} color={color} />;
}

const styles = StyleSheet.create({
  avatar: { borderWidth: 1.5 },
});

function tabScreenOptions() {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.ink,
    tabBarInactiveTintColor: colors.faint,
    tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
  } as const;
}

function VolunteerTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator screenOptions={tabScreenOptions()}>
        <Tab.Screen name="Home" component={VolunteerHomeScreen} options={{ tabBarIcon: ({ color, size }) => <ClipboardText size={size} color={color} weight="fill" /> }} />
        <Tab.Screen name="Notifications" component={VolunteerNotificationsScreen} options={{ tabBarIcon: ({ color, size }) => <Bell size={size} color={color} /> }} />
        <Tab.Screen name="Stats" component={VolunteerStatsScreen} options={{ tabBarIcon: ({ color, size }) => <ChartBar size={size} color={color} /> }} />
        <Tab.Screen name="Assistant" component={AIAssistantScreen} options={{ tabBarIcon: ({ color, size }) => <Sparkle size={size} color={color} weight="fill" /> }} />
        <Tab.Screen name="Profile" component={VolunteerProfileScreen} options={{ tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} /> }} />
      </Tab.Navigator>
      <SOSResponderOverlay />
    </View>
  );
}

function PilgrimTabs({ showTasksTab }: { showTasksTab: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator screenOptions={tabScreenOptions()}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <MapTrifold size={size} color={color} weight="fill" /> }} />
        <Tab.Screen name="Find Help" component={FindHelpScreen} options={{ tabBarIcon: ({ color, size }) => <Lifebuoy size={size} color={color} /> }} />
        <Tab.Screen name="Safety" component={SafetyScreen} options={{ tabBarIcon: ({ color, size }) => <Lifebuoy size={size} color={color} weight="fill" /> }} />
        {showTasksTab && (
          <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: ({ color, size }) => <ClipboardText size={size} color={color} weight="fill" /> }} />
        )}
        <Tab.Screen name="Assistant" component={AIAssistantScreen} options={{ tabBarIcon: ({ color, size }) => <Sparkle size={size} color={color} weight="fill" /> }} />
        <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarIcon: ({ color, size }) => <AccountTabIcon color={color} size={size} /> }} />
      </Tab.Navigator>
      {/* Field team members respond to reports, they don't file them - so the
          floating reporter button only shows for actual pilgrims/guardians. */}
      {!showTasksTab && <FloatingReportButton />}
      {/* Field team are always emergency-eligible responders (no opt-in
          toggle, unlike volunteers), so they get the same overlay. */}
      {showTasksTab && <SOSResponderOverlay />}
    </View>
  );
}

export function RootNavigator() {
  const { role } = useAuth();

  if (role === "volunteer") return <VolunteerTabs />;
  return <PilgrimTabs showTasksTab={role === "field_team"} />;
}
