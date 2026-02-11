import "./global.css";

import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { Platform, Pressable, SafeAreaView, Text, View } from "react-native";
import { useEffect, useState } from "react";

import { LoadingView } from "./src/components/LoadingView";
import { useDeliveryApp } from "./src/hooks/useDeliveryApp";
import { tr } from "./src/i18n/strings";
import { LoginScreen } from "./src/screens/LoginScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { OrderDetailScreen } from "./src/screens/OrderDetailScreen";
import { OrdersListScreen } from "./src/screens/OrdersListScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

const APP_RELEASE = "v0.5.1";

type TabKey = "home" | "notifications" | "profile";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const app = useDeliveryApp();
  const dark = app.theme === "dark";
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  useEffect(() => {
    if (activeTab === "notifications") {
      app.notifications.markRead();
    }
  }, [activeTab]);

  if (app.booting) {
    return <LoadingView label={tr(app.locale, "appPreparing")} />;
  }

  if (!app.session.token || !app.session.user) {
    return (
      <SafeAreaView className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`}>
        <StatusBar style={dark ? "light" : "dark"} />
        <LoginScreen
          locale={app.locale}
          release={APP_RELEASE}
          email={app.login.email}
          password={app.login.password}
          busy={app.login.busy}
          error={app.login.error}
          onEmailChange={app.login.setEmail}
          onPasswordChange={app.login.setPassword}
          onSubmit={() => void app.login.signIn()}
        />
      </SafeAreaView>
    );
  }

  if (app.orders.selected) {
    return (
      <SafeAreaView className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`}>
        <StatusBar style={dark ? "light" : "dark"} />
        <OrderDetailScreen
          order={app.orders.selected}
          busyAction={app.orders.actionBusy}
          refreshing={app.orders.refreshing}
          theme={app.theme}
          onBack={app.orders.closeOrder}
          onRefresh={() => void app.orders.refreshOrders()}
          onUpdateLocation={() => void app.orders.updateCurrentLocation()}
          onUploadProof={() => void app.orders.uploadProofAndMarkShipped()}
          onMarkDelivered={() => void app.orders.markDelivered()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${dark ? "bg-slate-950" : "bg-slate-100"}`}>
      <StatusBar style={dark ? "light" : "dark"} />

      {activeTab === "home" ? (
        <OrdersListScreen
          locale={app.locale}
          user={app.session.user}
          orders={app.orders.list}
          refreshing={app.orders.refreshing}
          theme={app.theme}
          unreadCount={app.notifications.unreadCount}
          onRefresh={() => void app.orders.refreshOrders()}
          onOpenOrder={(order) => void app.orders.openOrder(order)}
          onOpenNotifications={() => setActiveTab("notifications")}
        />
      ) : null}

      {activeTab === "notifications" ? (
        <NotificationsScreen
          locale={app.locale}
          theme={app.theme}
          notifications={app.notifications.list}
          onMarkAllRead={app.notifications.markRead}
        />
      ) : null}

      {activeTab === "profile" ? (
        <ProfileScreen
          locale={app.locale}
          theme={app.theme}
          user={app.session.user}
          profile={app.session.profile}
          salaryPreview={app.session.salaryPreview}
          onToggleTheme={app.actions.toggleTheme}
          onLogout={app.actions.logout}
          onSetLanguage={app.actions.setLanguage}
        />
      ) : null}

      <View
        className={`absolute left-4 right-4 flex-row rounded-2xl p-2 ${dark ? "bg-slate-900/95" : "bg-white"}`}
        style={{ bottom: Platform.OS === "android" ? 30 : 20 }}
      >
        <TabButton label={tr(app.locale, "tabHome")} active={activeTab === "home"} onPress={() => setActiveTab("home")} dark={dark} />
        <TabButton
          label={tr(app.locale, "tabNotifications")}
          active={activeTab === "notifications"}
          onPress={() => setActiveTab("notifications")}
          dark={dark}
          badge={app.notifications.unreadCount}
        />
        <TabButton label={tr(app.locale, "tabProfile")} active={activeTab === "profile"} onPress={() => setActiveTab("profile")} dark={dark} />
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  dark,
  onPress,
  badge = 0,
}: {
  label: string;
  active: boolean;
  dark: boolean;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Pressable
      className={`relative flex-1 items-center rounded-xl px-2 py-3 ${active ? (dark ? "bg-cyan-500" : "bg-slate-900") : "bg-transparent"}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-bold ${active ? "text-white" : dark ? "text-slate-300" : "text-slate-600"}`}>{label}</Text>
      {badge > 0 ? (
        <View className="absolute right-3 top-1 min-w-5 rounded-full bg-rose-500 px-1">
          <Text className="text-center text-[10px] font-bold text-white">{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
