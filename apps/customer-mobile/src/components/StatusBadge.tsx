import { Text } from "react-native";
import { tr } from "../i18n/strings";
import type { Locale } from "../types/domain";

export function StatusBadge({ status, locale, dark }: { status: string; locale: Locale; dark: boolean }) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "pending") {
    return (
      <Text className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-[10px] font-black uppercase text-amber-800">
        {tr(locale, "pending")}
      </Text>
    );
  }

  if (normalized === "confirmed") {
    return (
      <Text className="rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-[10px] font-black uppercase text-sky-800">
        {tr(locale, "confirmed")}
      </Text>
    );
  }

  if (normalized === "shipped") {
    return (
      <Text className="rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-[10px] font-black uppercase text-indigo-800">
        {tr(locale, "shipped")}
      </Text>
    );
  }

  if (normalized === "delivered") {
    return (
      <Text className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase text-emerald-800">
        {tr(locale, "delivered")}
      </Text>
    );
  }

  if (normalized === "cancelled") {
    return (
      <Text className="rounded-full border border-rose-200 bg-rose-100 px-3 py-1 text-[10px] font-black uppercase text-rose-800">
        {tr(locale, "cancelled")}
      </Text>
    );
  }

  if (normalized === "refund_requested") {
    return (
      <Text className="rounded-full border border-violet-200 bg-violet-100 px-3 py-1 text-[10px] font-black uppercase text-violet-800">
        {tr(locale, "refund_requested")}
      </Text>
    );
  }

  if (normalized === "refunded") {
    return (
      <Text className="rounded-full border border-fuchsia-200 bg-fuchsia-100 px-3 py-1 text-[10px] font-black uppercase text-fuchsia-800">
        {tr(locale, "refunded")}
      </Text>
    );
  }

  if (normalized === "return_requested") {
    return (
      <Text className="rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-[10px] font-black uppercase text-orange-800">
        {tr(locale, "return_requested")}
      </Text>
    );
  }

  if (normalized === "returned") {
    return (
      <Text className="rounded-full border border-slate-300 bg-slate-200 px-3 py-1 text-[10px] font-black uppercase text-slate-800">
        {tr(locale, "returned")}
      </Text>
    );
  }

  return (
    <Text
      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
        dark ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"
      }`}
    >
      {status}
    </Text>
  );
}
