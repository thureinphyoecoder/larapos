import "./global.css";

import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native";

import { BottomTabs } from "./src/components/BottomTabs";
import { LoadingView } from "./src/components/LoadingView";
import { useCustomerApp } from "./src/hooks/useCustomerApp";
import { AccountScreen } from "./src/screens/AccountScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { OrderDetailScreen } from "./src/screens/OrderDetailScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { ProductDetailScreen } from "./src/screens/ProductDetailScreen";

export default function App() {
  const app = useCustomerApp();

  if (app.booting) {
    return <LoadingView dark={app.dark} label="Preparing app..." />;
  }

  if (!app.session?.token || !app.session.user) {
    return (
      <SafeAreaView className="flex-1 bg-slate-100">
        <StatusBar style="dark" />
        <LoginScreen
          locale={app.locale}
          email={app.login.email}
          password={app.login.password}
          busy={app.login.busy}
          error={app.login.error}
          onEmailChange={app.login.setEmail}
          onPasswordChange={app.login.setPassword}
          onSubmit={() => void app.login.submit()}
        />
      </SafeAreaView>
    );
  }

  if (app.detail.view === "product") {
    return (
      <SafeAreaView className={`flex-1 ${app.dark ? "bg-slate-950" : "bg-slate-100"}`}>
        <StatusBar style={app.dark ? "light" : "dark"} />
        <ProductDetailScreen
          locale={app.locale}
          dark={app.dark}
          product={app.detail.product}
          busy={app.detail.busy}
          error={app.detail.error}
          adding={app.catalog.addingProductId === app.detail.product?.id}
          onBack={app.detail.close}
          onAddToCart={(product, variantId, quantity) => void app.catalog.addToCart(product, variantId, quantity)}
        />
      </SafeAreaView>
    );
  }

  if (app.detail.view === "order") {
    return (
      <SafeAreaView className={`flex-1 ${app.dark ? "bg-slate-950" : "bg-slate-100"}`}>
        <StatusBar style={app.dark ? "light" : "dark"} />
        <OrderDetailScreen
          locale={app.locale}
          dark={app.dark}
          order={app.detail.order}
          busy={app.detail.busy}
          error={app.detail.error}
          actionBusy={app.detail.actionBusy}
          actionMessage={app.detail.actionMessage}
          onCancelOrder={(reason) => void app.detail.cancelOrder(reason)}
          onRequestRefund={() => void app.detail.requestRefund()}
          onRequestReturn={(reason) => void app.detail.requestReturn(reason)}
          onBack={app.detail.close}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${app.dark ? "bg-slate-950" : "bg-slate-100"}`}>
      <StatusBar style={app.dark ? "light" : "dark"} />

      {app.activeTab === "home" ? (
        <HomeScreen
          locale={app.locale}
          dark={app.dark}
          userName={app.session.user.name}
          query={app.catalog.query}
          categories={app.catalog.categories}
          activeCategoryId={app.catalog.activeCategoryId}
          products={app.catalog.products}
          addingProductId={app.catalog.addingProductId}
          refreshing={app.refreshing}
          onQueryChange={app.catalog.setQuery}
          onSelectCategory={app.catalog.setActiveCategoryId}
          onAddToCart={(product) => void app.catalog.addToCart(product)}
          onOpenProduct={(product) => void app.catalog.openProductDetail(product)}
          onRefresh={() => void app.refreshAll()}
        />
      ) : null}

      {app.activeTab === "orders" ? (
        <OrdersScreen
          locale={app.locale}
          dark={app.dark}
          orders={app.orders}
          refreshing={app.refreshing}
          onOpenOrder={(orderId) => void app.detail.openOrderDetail(orderId)}
          onRefresh={() => void app.refreshAll()}
        />
      ) : null}

      {app.activeTab === "cart" ? (
        <CartScreen
          locale={app.locale}
          dark={app.dark}
          cartItems={app.cart.items}
          removingItemId={app.cart.removingItemId}
          busyCheckout={app.cart.checkoutBusy}
          onCheckout={() => void app.cart.checkout()}
          onRemoveItem={(cartItemId) => void app.cart.removeItem(cartItemId)}
        />
      ) : null}

      {app.activeTab === "account" ? (
        <AccountScreen
          locale={app.locale}
          dark={app.dark}
          userName={app.session.user.name}
          userEmail={app.session.user.email}
          theme={app.theme}
          profileBusy={app.account.profileBusy}
          profileError={app.account.profileError}
          profileMessage={app.account.profileMessage}
          profileName={app.account.profileName}
          profileEmail={app.account.profileEmail}
          profilePhone={app.account.profilePhone}
          profileNrc={app.account.profileNrc}
          profileAddress={app.account.profileAddress}
          profileCity={app.account.profileCity}
          profileState={app.account.profileState}
          profilePostalCode={app.account.profilePostalCode}
          onProfileNameChange={app.account.setProfileName}
          onProfileEmailChange={app.account.setProfileEmail}
          onProfilePhoneChange={app.account.setProfilePhone}
          onProfileNrcChange={app.account.setProfileNrc}
          onProfileAddressChange={app.account.setProfileAddress}
          onProfileCityChange={app.account.setProfileCity}
          onProfileStateChange={app.account.setProfileState}
          onProfilePostalCodeChange={app.account.setProfilePostalCode}
          onSaveProfile={() => void app.account.saveProfile()}
          onToggleLocale={() => void app.account.toggleLocale()}
          onToggleTheme={() => void app.account.toggleTheme()}
          onLogout={() => void app.account.logout()}
        />
      ) : null}

      <BottomTabs activeTab={app.activeTab} onChange={app.setActiveTab} items={app.tabItems} dark={app.dark} />
    </SafeAreaView>
  );
}
