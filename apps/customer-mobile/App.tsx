import "./global.css";

import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { BackHandler, LogBox } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { BottomTabs } from "./src/components/BottomTabs";
import { LoadingView } from "./src/components/LoadingView";
import { useCustomerApp } from "./src/hooks/useCustomerApp";
import { AccountScreen } from "./src/screens/AccountScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { OrderDetailScreen } from "./src/screens/OrderDetailScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { ProductDetailScreen } from "./src/screens/ProductDetailScreen";
import { SupportScreen } from "./src/screens/SupportScreen";

LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

export default function App() {
  const app = useCustomerApp();

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!app.session?.token || !app.session.user) {
        return true;
      }

      if (app.detail.view !== "none") {
        app.detail.close();
        return true;
      }

      if (app.activeTab !== "home") {
        app.setActiveTab("home");
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [app]);

  if (app.booting) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className={`flex-1 ${app.dark ? "bg-slate-950" : "bg-slate-100"}`} edges={["top", "bottom", "left", "right"]}>
          <LoadingView dark={app.dark} label="Preparing app..." />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!app.session?.token || !app.session.user) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-slate-100" edges={["top", "bottom", "left", "right"]}>
          <StatusBar style="dark" />
          <LoginScreen
            locale={app.locale}
            registerName={app.login.registerName}
            registerConfirmPassword={app.login.registerConfirmPassword}
            email={app.login.email}
            password={app.login.password}
            busy={app.login.busy}
            error={app.login.error}
            message={app.login.message}
            onRegisterNameChange={app.login.setRegisterName}
            onRegisterConfirmPasswordChange={app.login.setRegisterConfirmPassword}
            onEmailChange={app.login.setEmail}
            onPasswordChange={app.login.setPassword}
            onSubmitLogin={() => void app.login.submit()}
            onSubmitRegister={() => void app.login.submitRegister()}
            onForgotPassword={() => void app.login.forgotPassword()}
            onResendVerification={() => void app.login.resendVerification()}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (app.detail.view === "product") {
    return (
      <SafeAreaProvider>
        <SafeAreaView className={`flex-1 ${app.dark ? "bg-slate-950" : "bg-slate-100"}`} edges={["top", "left", "right"]}>
          <StatusBar style={app.dark ? "light" : "dark"} />
          <ProductDetailScreen
            locale={app.locale}
            dark={app.dark}
            product={app.detail.product}
            busy={app.detail.busy}
            error={app.detail.error}
            reviewBusy={app.detail.reviewBusy}
            reviewError={app.detail.reviewError}
            reviewMessage={app.detail.reviewMessage}
            adding={app.catalog.addingProductId === app.detail.product?.id}
            onBack={app.detail.close}
            onOpenCart={() => {
              app.detail.close();
              app.setActiveTab("cart");
            }}
            cartCount={app.cartCount}
            onOpenProduct={(product) => void app.catalog.openProductDetail(product)}
            onAddToCart={(product, variantId, quantity) => void app.catalog.addToCart(product, variantId, quantity)}
            onSubmitReview={(rating, comment) => void app.detail.submitReview(rating, comment)}
          />
          <BottomTabs
            activeTab={app.activeTab}
            onChange={(tab) => {
              app.detail.close();
              app.setActiveTab(tab);
            }}
            items={app.tabItems}
            dark={app.dark}
            badges={{ cart: app.cartCount, orders: app.notificationsUnreadCount }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (app.detail.view === "order") {
    return (
      <SafeAreaProvider>
        <SafeAreaView className={`flex-1 ${app.dark ? "bg-slate-950" : "bg-slate-100"}`} edges={["top", "bottom", "left", "right"]}>
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
      </SafeAreaProvider>
    );
  }

  if (app.detail.view === "checkout") {
    return (
      <SafeAreaProvider>
        <SafeAreaView className={`flex-1 ${app.dark ? "bg-slate-950" : "bg-slate-100"}`} edges={["top", "bottom", "left", "right"]}>
          <StatusBar style={app.dark ? "light" : "dark"} />
          <CheckoutScreen
            locale={app.locale}
            dark={app.dark}
            cartItems={app.cart.items}
            phone={app.cart.checkoutPhone}
            address={app.cart.checkoutAddress}
            paymentSlipUri={app.cart.checkoutSlipUri}
          qrData={app.cart.checkoutQrData}
          busy={app.cart.checkoutBusy}
          error={app.cart.checkoutError}
          removingItemId={app.cart.removingItemId}
          onPhoneChange={app.cart.setCheckoutPhone}
          onAddressChange={app.cart.setCheckoutAddress}
          onSlipUriChange={app.cart.setCheckoutSlipUri}
          onQrDataChange={app.cart.setCheckoutQrData}
          onRemoveItem={(cartItemId) => void app.cart.removeItem(cartItemId)}
          onBack={app.detail.close}
          onConfirm={() => void app.cart.confirmCheckout()}
        />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className={`flex-1 ${app.dark ? "bg-slate-950" : "bg-slate-100"}`} edges={["top", "left", "right"]}>
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
          notificationsUnreadCount={app.notificationsUnreadCount}
          onOpenNotifications={() => app.setActiveTab("orders")}
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
          onCheckout={() => void app.cart.openCheckout()}
          onRemoveItem={(cartItemId) => void app.cart.removeItem(cartItemId)}
          onOpenProduct={(productId) => void app.catalog.openProductDetailById(productId)}
        />
      ) : null}

      {app.activeTab === "support" ? (
        <SupportScreen
          locale={app.locale}
          dark={app.dark}
          userId={app.session.user.id}
          assignedStaffName={app.support.assignedStaffName}
          messages={app.support.messages}
          draft={app.support.draft}
          imageUri={app.support.imageUri}
          busy={app.support.busy}
          sending={app.support.sending}
          error={app.support.error}
          onDraftChange={app.support.setDraft}
          onImageUriChange={app.support.setImageUri}
          onSend={() => void app.support.send()}
          onRefresh={() => void app.support.refresh()}
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
          profilePhotoUrl={app.account.profilePhotoUrl}
          profilePhotoBusy={app.account.profilePhotoBusy}
          onProfileNameChange={app.account.setProfileName}
          onProfileEmailChange={app.account.setProfileEmail}
          onProfilePhoneChange={app.account.setProfilePhone}
          onProfileNrcChange={app.account.setProfileNrc}
          onProfileAddressChange={app.account.setProfileAddress}
          onProfileCityChange={app.account.setProfileCity}
          onProfileStateChange={app.account.setProfileState}
          onProfilePostalCodeChange={app.account.setProfilePostalCode}
          onUploadProfilePhoto={(uri) => void app.account.uploadProfilePhoto(uri)}
          onProfileAddressResolved={({ address, city, state }) => {
            app.account.setProfileAddress(address);
            if (typeof city === "string") app.account.setProfileCity(city);
            if (typeof state === "string") app.account.setProfileState(state);
          }}
          onSaveProfile={() => void app.account.saveProfile()}
          onToggleLocale={() => void app.account.toggleLocale()}
          onToggleTheme={() => void app.account.toggleTheme()}
          onLogout={() => void app.account.logout()}
        />
      ) : null}

        <BottomTabs
          activeTab={app.activeTab}
          onChange={app.setActiveTab}
          items={app.tabItems}
          dark={app.dark}
          badges={{ cart: app.cartCount, orders: app.notificationsUnreadCount }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
