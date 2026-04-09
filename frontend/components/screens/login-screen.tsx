
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Mail, Lock, Heart, LogIn, AlertCircle } from "lucide-react";
import { Character } from "@/components/character";

export function LoginScreen() {
  const {
    userProfile,
    character,
    setScreen,
    setIsAuthenticated,
    autoLogin,
    setAutoLogin,
  } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = () => {
    if (userProfile && email === userProfile.email && password.length >= 6) {
      setIsAuthenticated(true);
      setScreen("home");
    } else {
      setErrorMsg("이메일 또는 비밀번호가 일치하지 않습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FFEF] flex flex-col px-6 py-10">

      {/* 캐릭터 영역 */}
      <div className="flex flex-col items-center pt-10 pb-8 gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#CBF891]/50 blur-2xl scale-110" />
          <div className="relative">
            <Character mood="happy" level={character?.level || 1} size="xl" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-[26px] font-black text-[#2A2A2A] tracking-[-0.02em] flex items-center justify-center gap-2">
            다시 만나 반가워요!
            <Heart className="size-5 text-[#E05B7A] fill-[#E05B7A]" />
          </h1>
          <p className="text-[14px] font-medium text-[#7A7A7A]">
            {userProfile?.name}님, 오늘도 건강한 습관을 이어가볼까요?
          </p>
        </div>
      </div>

      {/* 로그인 폼 */}
      <div className="w-full max-w-sm mx-auto space-y-3">

        {/* 이메일 */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-4 space-y-1.5">
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
            <Mail className="size-3.5 text-[#87D57B]" />
            이메일
          </label>
          <Input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMsg("");
            }}
            className="border-0 bg-[#F5F5F5] rounded-xl h-11 text-[15px] font-medium placeholder:text-[#C8C8C8] focus-visible:ring-1 focus-visible:ring-[#87D57B]"
          />
        </div>

        {/* 비밀번호 */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-4 space-y-1.5">
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
            <Lock className="size-3.5 text-[#87D57B]" />
            비밀번호
          </label>
          <Input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMsg("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="border-0 bg-[#F5F5F5] rounded-xl h-11 text-[15px] font-medium placeholder:text-[#C8C8C8] focus-visible:ring-1 focus-visible:ring-[#87D57B]"
          />
        </div>

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-[#FFE8EE] rounded-2xl px-4 py-3">
            <AlertCircle className="size-4 text-[#C0305A] shrink-0" />
            <p className="text-[13px] font-medium text-[#C0305A]">{errorMsg}</p>
          </div>
        )}

        {/* 자동 로그인 */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-3.5">
          <div>
            <p className="text-[15px] font-semibold text-[#2A2A2A]">자동 로그인</p>
            <p className="text-[12px] font-medium text-[#9B9B9B] mt-0.5">다음 접속 시 바로 입장해요</p>
          </div>
          <Switch checked={autoLogin} onCheckedChange={setAutoLogin} />
        </div>

        {/* 로그인 버튼 */}
        <Button
          onClick={handleLogin}
          disabled={!email || !password}
          className="w-full h-14 text-[16px] font-bold rounded-2xl bg-[#87D57B] hover:bg-[#6DC462] text-white mt-2 disabled:opacity-40"
        >
          <LogIn className="size-5 mr-2" />
          로그인
        </Button>
      </div>

      {/* 하단 카피 */}
      <p className="text-center text-[11px] font-medium text-[#C8C8C8] mt-auto pt-10">
        © 2025 HealthyFriend. All rights reserved.
      </p>
    </div>
  );
}
