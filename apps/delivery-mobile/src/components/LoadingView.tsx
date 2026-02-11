import { ActivityIndicator, Text, View } from "react-native";

type LoadingViewProps = {
  label?: string;
};

export function LoadingView({ label = "ဖွင့်နေပါတယ်..." }: LoadingViewProps) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <ActivityIndicator size="large" color="#0f172a" />
      <Text className="mt-3 text-sm text-slate-500">{label}</Text>
    </View>
  );
}
