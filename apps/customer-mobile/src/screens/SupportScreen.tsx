import Ionicons from "expo/node_modules/@expo/vector-icons/Ionicons";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { tr } from "../i18n/strings";
import type { Locale, SupportMessage } from "../types/domain";
import { formatDate } from "../utils/format";

type Props = {
  locale: Locale;
  dark: boolean;
  userId: number;
  assignedStaffName: string | null;
  messages: SupportMessage[];
  draft: string;
  busy: boolean;
  sending: boolean;
  error: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onRefresh: () => void;
};

export function SupportScreen({
  locale,
  dark,
  userId,
  assignedStaffName,
  messages,
  draft,
  busy,
  sending,
  error,
  onDraftChange,
  onSend,
  onRefresh,
}: Props) {
  return (
    <View className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`}>
      <View className={`border-b px-4 py-4 ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <Text className={`text-xl font-black ${dark ? "text-white" : "text-slate-900"}`}>{tr(locale, "supportTitle")}</Text>
        <Text className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {assignedStaffName ? `${tr(locale, "assignedTo")}: ${assignedStaffName}` : tr(locale, "supportSubtitle")}
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-3" contentContainerStyle={{ paddingBottom: 16 }}>
        {messages.length ? (
          <View className="gap-3">
            {messages.map((message) => {
              const mine = Number(message.sender_id) === Number(userId);
              return (
                <View key={message.id} className={`flex ${mine ? "items-end" : "items-start"}`}>
                  <View className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "bg-orange-600" : dark ? "bg-slate-800" : "bg-white"}`}>
                    <Text className={`text-[11px] font-bold ${mine ? "text-orange-100" : dark ? "text-slate-400" : "text-slate-500"}`}>
                      {mine ? tr(locale, "you") : message.sender?.name || tr(locale, "supportAgent")}
                    </Text>
                    <Text className={`mt-1 text-sm ${mine ? "text-white" : dark ? "text-slate-100" : "text-slate-800"}`}>{message.message || "-"}</Text>
                    <Text className={`mt-1 text-[10px] ${mine ? "text-orange-100" : dark ? "text-slate-500" : "text-slate-400"}`}>{formatDate(message.created_at)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className={`rounded-2xl border p-6 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <Text className={`${dark ? "text-slate-300" : "text-slate-500"}`}>{tr(locale, "supportEmpty")}</Text>
          </View>
        )}

        {busy ? <Text className={`mt-3 text-center text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{tr(locale, "loading")}</Text> : null}
      </ScrollView>

      <View className={`border-t px-4 py-3 ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
        {error ? <Text className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</Text> : null}

        <View className="flex-row items-end gap-2">
          <Pressable
            onPress={onRefresh}
            className={`h-11 w-11 items-center justify-center rounded-xl border ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
          >
            <Ionicons name="refresh-outline" size={16} color={dark ? "#cbd5e1" : "#475569"} />
          </Pressable>

          <TextInput
            value={draft}
            onChangeText={onDraftChange}
            multiline
            numberOfLines={2}
            placeholder={tr(locale, "supportPlaceholder")}
            placeholderTextColor={dark ? "#64748b" : "#94a3b8"}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm ${dark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
          />

          <Pressable onPress={onSend} disabled={sending || !draft.trim()} className={`h-11 w-11 items-center justify-center rounded-xl ${sending || !draft.trim() ? "bg-slate-300" : "bg-orange-600"}`}>
            <Ionicons name="send" size={14} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
