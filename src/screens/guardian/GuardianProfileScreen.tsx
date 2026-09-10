import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { LogOut } from "../../components/icons";
import { useAuth } from "../../auth/AuthContext";
import { colors, fonts } from "../../theme";

export function GuardianProfileScreen() {
  const { name, logout } = useAuth();

  return (
    <Screen title="Profile">
      <Card>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(name ?? "?").slice(0, 2).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.muted}>Guardian</Text>
          </View>
        </View>
      </Card>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <LogOut size={16} color={colors.redDeep} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.tealTint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.teal },
  name: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.redDeep },
});
