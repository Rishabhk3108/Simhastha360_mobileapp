import { Image, StyleSheet, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { MapTrifold, Lifebuoy, UserCircle, ClipboardText, Bell, ChartBar, UsersThree } from "../components/icons";
import { HomeScreen } from "../screens/HomeScreen";
import { FindHelpScreen } from "../screens/FindHelpScreen";
import { SafetyScreen } from "../screens/SafetyScreen";
import { AccountScreen } from "../screens/AccountScreen";
import { TasksScreen } from "../screens/TasksScreen";
import { VolunteerHomeScreen } from "../screens/volunteer/VolunteerHomeScreen";
import { VolunteerNotificationsScreen } from "../screens/volunteer/VolunteerNotificationsScreen";
import { VolunteerStatsScreen } from "../screens/volunteer/VolunteerStatsScreen";
import { VolunteerProfileScreen } from "../screens/volunteer/VolunteerProfileScreen";
import { GuardianHomeScreen } from "../screens/guardian/GuardianHomeScreen";
import { GuardianProfileScreen } from "../screens/guardian/GuardianProfileScreen";
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
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator screenOptions={tabScreenOptions()}>
        <Tab.Screen name="Home" component={VolunteerHomeScreen} options={{ tabBarLabel: t("rootNavigation.home"), tabBarIcon: ({ color, size }) => <ClipboardText size={size} color={color} weight="fill" /> }} />
        <Tab.Screen name="Notifications" component={VolunteerNotificationsScreen} options={{ tabBarLabel: t("rootNavigation.notifications"), tabBarIcon: ({ color, size }) => <Bell size={size} color={color} /> }} />
        <Tab.Screen name="Stats" component={VolunteerStatsScreen} options={{ tabBarLabel: t("rootNavigation.stats"), tabBarIcon: ({ color, size }) => <ChartBar size={size} color={color} /> }} />
        <Tab.Screen name="Profile" component={VolunteerProfileScreen} options={{ tabBarLabel: t("rootNavigation.profile"), tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} /> }} />
      </Tab.Navigator>
      <SOSResponderOverlay />
    </View>
  );
}

function GuardianTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={tabScreenOptions()}>
      <Tab.Screen name="My People" component={GuardianHomeScreen} options={{ tabBarLabel: t("rootNavigation.myPeople"), tabBarIcon: ({ color, size }) => <UsersThree size={size} color={color} weight="fill" /> }} />
      <Tab.Screen name="Profile" component={GuardianProfileScreen} options={{ tabBarLabel: t("rootNavigation.profile"), tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

function PilgrimTabs({ showTasksTab }: { showTasksTab: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator screenOptions={tabScreenOptions()}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t("rootNavigation.home"), tabBarIcon: ({ color, size }) => <MapTrifold size={size} color={color} weight="fill" /> }} />
        <Tab.Screen name="Find Help" component={FindHelpScreen} options={{ tabBarLabel: t("rootNavigation.findHelp"), tabBarIcon: ({ color, size }) => <Lifebuoy size={size} color={color} /> }} />
        <Tab.Screen name="Safety" component={SafetyScreen} options={{ tabBarLabel: t("rootNavigation.safety"), tabBarIcon: ({ color, size }) => <Lifebuoy size={size} color={color} weight="fill" /> }} />
        {showTasksTab && (
          <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarLabel: t("rootNavigation.tasks"), tabBarIcon: ({ color, size }) => <ClipboardText size={size} color={color} weight="fill" /> }} />
        )}
        <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarLabel: t("rootNavigation.account"), tabBarIcon: ({ color, size }) => <AccountTabIcon color={color} size={size} /> }} />
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
  if (role === "guardian") return <GuardianTabs />;
  return <PilgrimTabs showTasksTab={role === "field_team"} />;
}
