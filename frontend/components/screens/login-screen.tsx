
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Mail, Lock, Heart, LogIn } from "lucide-react";
import { Character } from "@/components/character";
import { cn } from "@/lib/utils";

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
    // 실제 환경에서는 서버 통신. 여기서는 로컬 데이터(userProfile)로 모의 검증
    if (userProfile && email === userProfile.email && password.length >= 6) {
      setIsAuthenticated(true);
      setScreen("home");
    } else {
      setErrorMsg("이메일 또는 비밀번호가 일치하지 않습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col p-6 animate-in fade-in zoom-in duration-500">
      {/* 캐릭터 환영 인사 */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          {/* 캐릭터가 생성된 유저라면 내 캐릭터를 보여주고, 아니면 기본 캐릭터 노출 */}
          <Character mood="happy" level={character?.level || 1} size="xl" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            다시 만나 반가워요!
            <Heart className="w-6 h-6 text-primary fill-primary" />
          </h1>
          <p className="text-muted-foreground">
            {userProfile?.name}님, 오늘도 건강한 습관을 이어가볼까요?
          </p>
        </div>

        {/* 로그인 폼 */}
        <div className="w-full max-w-sm space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    이메일
                  </FieldLabel>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMsg("");
                    }}
                    className="mt-2"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    비밀번호
                  </FieldLabel>
                  <Input
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg("");
                    }}
                    className="mt-2"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  {errorMsg && (
                    <p className="text-xs mt-2 font-medium text-destructive">
                      {errorMsg}
                    </p>
                  )}
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-medium text-muted-foreground">
              자동 로그인
            </span>
            <Switch checked={autoLogin} onCheckedChange={setAutoLogin} />
          </div>

          <Button
            onClick={handleLogin}
            disabled={!email || !password}
            className="w-full h-14 text-lg mt-4"
          >
            <LogIn className="w-5 h-5 mr-2" />
            로그인
          </Button>
        </div>
      </div>
    </div>
  );
}
