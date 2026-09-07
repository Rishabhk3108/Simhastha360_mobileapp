import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api/client";
import { useLocation } from "../location/useLocation";

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
    const userMsg: Message = { id: `${Date.now()}-u`, from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
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
      <Text style={styles.title}>AI Assistant</Text>
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
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="nearest hospital?"
          onSubmitEditing={send}
        />
        <TouchableOpacity style={styles.sendButton} onPress={send} disabled={sending}>
          <Text style={styles.sendText}>{sending ? "..." : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f6f8" },
  title: { fontSize: 22, fontWeight: "700", padding: 16, paddingBottom: 8, color: "#1c2733" },
  list: { padding: 16, gap: 8 },
  bubble: { borderRadius: 12, padding: 10, maxWidth: "85%" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#1d5fbf" },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: "white", borderWidth: 1, borderColor: "#dde2e7" },
  userText: { color: "white" },
  assistantText: { color: "#1c2733" },
  inputRow: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#dde2e7", backgroundColor: "white" },
  input: { flex: 1, borderWidth: 1, borderColor: "#dde2e7", borderRadius: 8, padding: 10 },
  sendButton: { backgroundColor: "#1d5fbf", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  sendText: { color: "white", fontWeight: "700" },
});
