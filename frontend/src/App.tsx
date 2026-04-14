import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { setAuthToken } from "@/lib/api/client";
import { SplashScreen } from "@/components/screens/splash-screen";
import { LoginScreen } from "@/components/screens/login-screen";
import { OnboardingScreen } from "@/components/screens/onboarding-screen";
import { HealthInfoScreen } from "@/components/screens/health-info-screen";
import { AnalysisScreen } from "@/components/screens/analysis-screen";
import { PermissionsScreen } from "@/components/screens/permissions-screen";
import { CharacterBirthScreen } from "@/components/screens/character-birth-screen";
import { HomeScreen } from "@/components/screens/home-screen";
import { MissionsScreen } from "@/components/screens/missions-screen";
import { DietScreen } from "@/components/screens/diet-screen";
import { ShopScreen } from "@/components/screens/shop-screen";
import { CollectionScreen } from "@/components/screens/collection-screen";
import { ReportScreen } from "@/components/screens/report-screen";
import { ReportListScreen } from "@/components/screens/report-list-screen";
import { MyPageScreen } from "@/components/screens/mypage-screen";
import { DailyLogScreen } from "@/components/screens/daily-log-screen";
import { DataSyncScreen } from "@/components/screens/data-sync-screen";
import { NotificationSettingsScreen } from "@/components/screens/notification-settings-screen";
import { EditHealthInfoScreen } from "@/components/screens/edit-health-info-screen";
import { PasswordResetScreen } from "@/components/screens/password-reset-screen";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  const { currentScreen, resetApp, accessToken } = useAppStore();
  const [isMounted, setIsMounted] = useState(false);

  // 브라우저 자동 스크롤 복원 비활성화 (최초 1회)
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  // 화면 전환 시 스크롤 최상단으로 즉시 이동
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentScreen]);

  // 저장된 토큰을 API 클라이언트에 복원
  useEffect(() => {
    if (accessToken) setAuthToken(accessToken);
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <main className="min-h-screen max-w-md mx-auto bg-background relative overflow-hidden">
        <div className="min-h-screen">
          <SplashScreen />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-md mx-auto bg-background relative overflow-hidden">
      {currentScreen !== "splash" && currentScreen !== "login" && (
        <button
          onClick={resetApp}
          className="fixed top-2 right-2 z-50 px-2 py-1 text-xs bg-muted/80 text-muted-foreground rounded-md hover:bg-muted transition-colors"
        >
          초기화 (테스트용)
        </button>
      )}

      <div className="min-h-screen">
        {currentScreen === "splash" && <SplashScreen />}
        {currentScreen === "login" && <LoginScreen />}
        {currentScreen === "onboarding" && <OnboardingScreen />}
        {currentScreen === "health-info" && <HealthInfoScreen />}
        {currentScreen === "analysis" && <AnalysisScreen />}
        {currentScreen === "permissions" && <PermissionsScreen />}
        {currentScreen === "character-birth" && <CharacterBirthScreen />}
        {currentScreen === "home" && <HomeScreen />}
        {currentScreen === "missions" && <MissionsScreen />}
        {currentScreen === "diet" && <DietScreen />}
        {currentScreen === "shop" && <ShopScreen />}
        {currentScreen === "collection" && <CollectionScreen />}
        {currentScreen === "report" && <ReportScreen />}
        {currentScreen === "report-list" && <ReportListScreen />}
        {currentScreen === "mypage" && <MyPageScreen />}
        {currentScreen === "daily-log" && <DailyLogScreen />}
        {currentScreen === "data-sync" && <DataSyncScreen />}
        {currentScreen === "notification-settings" && (
          <NotificationSettingsScreen />
        )}
        {currentScreen === "edit-health-info" && <EditHealthInfoScreen />}
        {currentScreen === "password-reset" && <PasswordResetScreen />}
      </div>

      <Toaster />
    </main>
  );
}
