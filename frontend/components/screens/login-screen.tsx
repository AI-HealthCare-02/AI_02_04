import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Character } from "@/components/character";
import { kakaoLogin } from "@/lib/kakao";
import { loginUser } from "@/lib/api/auth";
import { setAuthToken } from "@/lib/api/client";

/* ── 카카오 로고 SVG ─────────────────────────────────────── */
function KakaoLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.6 5.08 4.02 6.53L5.1 20.6a.37.37 0 0 0 .54.41l3.96-2.63A11.6 11.6 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3Z" />
    </svg>
  );
}

export function LoginScreen() {
  const {
    userProfile,
    character,
    setScreen,
    setIsAuthenticated,
    setKakaoProfile,
    setTokens,
    autoLogin,
    setAutoLogin,
  } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [kakaoError, setKakaoError] = useState("");

  const isReturningUser = !!(userProfile && character);

  /* ── 이메일 로그인 ── */
  const handleEmailLogin = async () => {
    if (!email || !password) return;
    setLoginLoading(true);
    setEmailError("");
    try {
      const res = await loginUser(email, password);
      const { access_token, refresh_token } = res.data;
      setAuthToken(access_token);
      setTokens(access_token, refresh_token);
      setIsAuthenticated(true);
      setScreen("home");
    } catch (err: any) {
      setEmailError(
        err?.message ?? "이메일 또는 비밀번호가 일치하지 않습니다.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  /* ── 카카오 로그인 ── */
  const handleKakaoLogin = async () => {
    setKakaoLoading(true);
    setKakaoError("");
    try {
      const info = await kakaoLogin();
      const kakaoName = info.kakao_account?.profile?.nickname ?? "";
      const kakaoEmail = info.kakao_account?.email ?? "";
      console.info("[Kakao] 로그인 성공:", kakaoName, kakaoEmail);

      if (isReturningUser) {
        // 기존 유저 → 바로 홈
        setIsAuthenticated(true);
        setScreen("home");
      } else {
        // 신규 유저 → 카카오 정보 저장 후 회원가입
        setKakaoProfile({
          id: info.id,
          email: kakaoEmail,
          name: kakaoName,
          gender: info.kakao_account?.gender,
          ageRange: info.kakao_account?.age_range,
        });
        setScreen("health-info");
      }
    } catch (err) {
      console.error("[Kakao] 로그인 실패:", err);
      setKakaoError("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setKakaoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6">
      {/* ── 캐릭터 + 타이틀 ── */}
      <div className="flex flex-col items-center pt-14 pb-8 gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#CBF891]/50 blur-2xl scale-125" />
          <div className="relative">
            <Character mood="happy" level={character?.level ?? 1} size="xl" />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <h1 className="text-[26px] font-black text-foreground tracking-[-0.02em]">
            {isReturningUser ? `${userProfile.name}님, 반가워요!` : "당마고치"}
          </h1>
          <p className="text-[14px] font-medium text-muted-foreground">
            {isReturningUser
              ? "오늘도 건강한 습관을 이어가볼까요?"
              : "건강한 습관, 귀여운 친구와 함께 시작해요"}
          </p>
        </div>
      </div>

      {/* ── 로그인 폼 ── */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-3">
        {/* 이메일 인풋 */}
        <div className="bg-card rounded-2xl px-4 py-4 space-y-1.5 shadow-whisper">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.07em]">
            <Mail className="size-3.5 text-primary" />
            이메일
          </label>
          <Input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
            className="border-0 bg-muted rounded-xl h-11 text-[15px] font-medium placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        {/* 비밀번호 인풋 */}
        <div className="bg-card rounded-2xl px-4 py-4 space-y-1.5 shadow-whisper">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.07em]">
            <Lock className="size-3.5 text-primary" />
            비밀번호
          </label>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setEmailError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
              className="border-0 bg-muted rounded-xl h-11 text-[15px] font-medium placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPw ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {emailError && (
          <div className="flex items-center gap-2 bg-destructive/10 rounded-2xl px-4 py-3 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0" />
            <p className="text-[13px] font-medium text-destructive">
              {emailError}
            </p>
          </div>
        )}

        {/* 로그인 버튼 */}
        <Button
          onClick={handleEmailLogin}
          disabled={!email || !password || loginLoading}
          className="w-full h-13 text-[16px] font-bold rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 mt-1"
        >
          {loginLoading ? (
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-1.5 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          ) : (
            <>
              <LogIn className="size-4 mr-2" />
              로그인
            </>
          )}
        </Button>

        {/* 회원가입 */}
        <Button
          onClick={() => setScreen("health-info")}
          variant="outline"
          className="w-full h-13 text-[16px] font-bold rounded-2xl bg-card border-1 border-border text-foreground hover:bg-muted transition-colors"
        >
          회원가입
        </Button>

        {/* 자동 로그인 */}
        <div className="flex items-center justify-between bg-card rounded-2xl px-4 py-3.5 shadow-whisper">
          <div>
            <p className="text-[14px] font-semibold text-foreground">
              자동 로그인
            </p>
            <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
              다음 접속 시 바로 입장해요
            </p>
          </div>
          <Switch checked={autoLogin} onCheckedChange={setAutoLogin} />
        </div>

        {/* 소셜 로그인 구분선 */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.07em]">
            소셜 로그인
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* 카카오 버튼 (작게, 중앙 정렬) */}
        <div className="flex justify-center pb-2">
          <button
            onClick={handleKakaoLogin}
            disabled={kakaoLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: "#FEE500", color: "#3C1E1E" }}
          >
            {kakaoLoading ? (
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="size-1.5 rounded-full bg-[#3C1E1E]/40 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            ) : (
              <>
                <KakaoLogo className="size-4" />
                카카오로 계속하기
              </>
            )}
          </button>
        </div>

        {/* 카카오 에러 */}
        {kakaoError && (
          <div className="flex items-center gap-2 bg-destructive/10 rounded-2xl px-4 py-3 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0" />
            <p className="text-[13px] font-medium text-destructive">
              {kakaoError}
            </p>
          </div>
        )}
      </div>

      {/* 하단 카피 */}
      <p className="text-center text-[11px] font-medium text-muted-foreground/60 mt-auto py-8">
        © 2026 Dangmagotchi. All rights reserved.
      </p>
    </div>
  );
}
