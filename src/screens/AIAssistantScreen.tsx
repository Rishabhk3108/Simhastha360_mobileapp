import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkle, Microphone } from "phosphor-react-native";
import { api } from "../api/client";
import { useLocation } from "../location/useLocation";
import { colors, fonts } from "../theme";

interface Message {
  id: string;
  from: "user" | "assistant";
  text: string;
}

export function AIAssistantScreen() {
  const { coords } = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", from: "assistant", text: "Ask me about nearby medical centers, toilets, water points, help desks, or current crowd levels." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((prev) => [...prev, { id: `${Date.now()}-u`, from: "user", text }]);
    setSending(true);
    try {
      const { data } = await api.post("/ai/chat", { message: text, lat: coords?.lat, lng: coords?.lng });
      setMessages((prev) => [...prev, { id: `${Date.now()}-a`, from: "assistant", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: `${Date.now()}-e`, from: "assistant", text: "Sorry, I couldn't reach the assistant right now." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Sparkle size={18} color={colors.surface} weight="fill" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Sahayak</Text>
          <Text style={styles.subtitle}>Answers only from verified Simhastha data</Text>
        </View>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from === "user" ? styles.userBubble : styles.assistantBubble]}>
            <Text style={item.from === "user" ? styles.userText : styles.assistantText}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Ask anything, or hold to speak" onSubmitEditing={send} />
        <TouchableOpacity style={styles.sendButton} onPress={send} disabled={sending}>
          <Microphone size={20} color={colors.surface} weight="fill" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingBottom: 8 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.saffron, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.teal },
  list: { padding: 16, gap: 10 },
  bubble: { borderRadius: 20, padding: 13, maxWidth: "85%" },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.ink, borderBottomRightRadius: 6 },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 6 },
  userText: { fontFamily: fonts.body, color: colors.surface, fontSize: 14.5, lineHeight: 21 },
  assistantText: { fontFamily: fonts.body, color: colors.ink, fontSize: 14.5, lineHeight: 22 },
  inputRow: { flexDirection: "row", padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, fontFamily: fonts.body },
  sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.saffron, alignItems: "center", justifyContent: "center" },
});
