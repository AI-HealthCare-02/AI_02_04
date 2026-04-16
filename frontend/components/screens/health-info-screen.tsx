import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  ChevronLeft,
  User,
  Ruler,
  Scale,
  Calendar,
  Mail,
  Lock,
  HeartPulse,
  Activity,
  Leaf,
  Dna,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BackendUserType } from "@/lib/types";
import { registerUser } from "@/lib/api/auth";
import { setAuthToken } from "@/lib/api/client";

/* ── 공통 섹션 라벨 ── */
function SectionLabel({
  icon: Icon,
  label,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div
        className="size-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="size-3.5" style={{ color: iconColor }} />
      </div>
      <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
        {label}
      </p>
    </div>
  );
}

/* ── 버튼 그룹 (단일 선택) ── */
function ButtonGroup({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: { label: string; value: any }[];
  value: any;
  onChange: (val: any) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2.5">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => !disabled && onChange(opt.value)}
          disabled={disabled}
          className={cn(
            "flex-1 min-w-[72px] py-2.5 px-3 rounded-xl text-[14px] font-semibold transition-all",
            value === opt.value
              ? "bg-[#87D57B] text-white"
              : "bg-[#F5F5F5] text-[#6A6A6A]",
            disabled ? "cursor-not-allowed opacity-70" : "hover:bg-[#E8E8E8]",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ── 질문 행 ── */
function QuestionRow({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[15px] font-semibold text-[#2A2A2A]">{label}</p>
      {sub && (
        <p className="text-[12px] text-[#9B9B9B] font-medium mt-0.5">{sub}</p>
      )}
      {children}
    </div>
  );
}

export function HealthInfoScreen() {
  const { setScreen, setUserProfile, setTokens, setIsAuthenticated, kakaoProfile, setKakaoProfile } =
    useAppStore();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 카카오 로그인 경유 여부
  const isKakao = !!kakaoProfile;

  const [formData, setFormData] = useState({
    email: kakaoProfile?.email ?? "",
    password: "",
    passwordConfirm: "",
    name: kakaoProfile?.name ?? "",
    age: "",
    gender: (kakaoProfile?.gender ?? "") as "male" | "female" | "",
    height: "",
    weight: "",
    highBp: null as boolean | null,
    highCholesterol: null as boolean | null,
    heartDisease: null as boolean | null,
    walkingDifficulty: null as boolean | null,
    generalHealth: null as number | null,
    sickDays: "" as "0-10" | "11-20" | "21-30" | "",
    heavyDrinking: null as boolean | null,
    physicalActivity: "" as "0-10" | "11-20" | "21-30" | "",
    dailyFruit: null as boolean | null,
    dailyVeggie: null as boolean | null,
    smoking: null as boolean | null,
    diabetesStatus: "" as "1" | "2" | "unknown" | "none" | "",
  });

  const [isEmailChecked, setIsEmailChecked] = useState(isKakao); // 카카오는 이메일 인증 생략
  const [emailMessage, setEmailMessage] = useState(
    isKakao ? "카카오 계정 이메일이 자동으로 입력되었습니다." : "",
  );

  const isPasswordValid = isKakao || formData.password.length >= 6;
  const passwordsMatch =
    isKakao ||
    (!!formData.password && formData.password === formData.passwordConfirm);

  const step1Valid =
    isEmailChecked &&
    passwordsMatch &&
    isPasswordValid &&
    formData.name &&
    formData.age &&
    formData.gender &&
    formData.height &&
    formData.weight;

  const step2Valid =
    formData.highBp !== null &&
    formData.highCholesterol !== null &&
    formData.heartDisease !== null &&
    formData.walkingDifficulty !== null &&
    formData.generalHealth !== null &&
    formData.sickDays &&
    formData.heavyDrinking !== null;

  const step3Valid =
    formData.physicalActivity &&
    formData.dailyFruit !== null &&
    formData.dailyVeggie !== null &&
    formData.smoking !== null &&
    formData.diabetesStatus;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, email: e.target.value });
    setIsEmailChecked(false);
    setEmailMessage("");
  };

  const [isEmailChecking, setIsEmailChecking] = useState(false);

  const handleEmailCheck = async () => {
    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      setEmailMessage("올바른 이메일 형식을 입력해주세요.");
      setIsEmailChecked(false);
      return;
    }
    setIsEmailChecking(true);
    setEmailMessage("");
    try {
      await checkEmail(formData.email);
      // 200 응답 = 사용 가능
      setEmailMessage("사용 가능한 이메일입니다.");
      setIsEmailChecked(true);
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      // 409 응답 = 이미 사용 중
      if (msg.includes("이미")) {
        setEmailMessage(msg);
      } else {
        setEmailMessage("이미 사용 중인 이메일입니다.");
      }
      setIsEmailChecked(false);
    } finally {
      setIsEmailChecking(false);
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    // ── 프론트 필드 → 백엔드 필드 매핑 ──
    const genderInt = formData.gender === "male" ? 1 : 0;

    // physicalActivity "0-10" / "11-20" / "21-30" → 정수 (중간값)
    const exerciseFreqMap: Record<string, number> = {
      "0-10": 5, "11-20": 15, "21-30": 25,
    };
    const exerciseFreq = exerciseFreqMap[formData.physicalActivity] ?? null;

    // user_type 결정
    let userType: "normal" | "risk" | "diabetes" = "normal";
    let diabetesType: "1type" | "2type" | null = null;
    if (formData.diabetesStatus === "1") {
      userType = "diabetes"; diabetesType = "1type";
    } else if (formData.diabetesStatus === "2") {
      userType = "diabetes"; diabetesType = "2type";
    } else if (formData.diabetesStatus === "unknown") {
      userType = "risk";
    }

    // 프론트 스토어용 healthType
    let initialHealthType: BackendUserType = "pending";
    if (userType === "diabetes") {
      initialHealthType = formData.diabetesStatus === "1" ? "diabetic_1" : "diabetic_2";
    } else if (userType === "risk") {
      initialHealthType = "at_risk";
    }

    try {
      const res = await registerUser({
        email:             formData.email,
        password:          formData.password || "kakao_no_password",
        nickname:          formData.name,
        user_type:         userType,
        goal:              null,
        diabetes_type:     diabetesType,
        gender:            genderInt,
        age:               parseInt(formData.age),
        height:            parseFloat(formData.height),
        weight:            parseFloat(formData.weight),
        is_hypertension:   formData.highBp!,
        is_cholesterol:    formData.highCholesterol!,
        is_heart_disease:  formData.heartDisease!,
        walking_difficulty:formData.walkingDifficulty!,
        general_health:    formData.generalHealth!,
        alcohol_status:    formData.heavyDrinking!,
        smoke_status:      formData.smoking,
        exercise_freq:     exerciseFreq,
        fruit_intake:      formData.dailyFruit,
        veggie_intake:     formData.dailyVeggie,
      });

      // 토큰 저장
      const { access_token, refresh_token } = res.data;
      setAuthToken(access_token);
      setTokens(access_token, refresh_token);
      setIsAuthenticated(true);

      // 로컬 프로필 저장
      setUserProfile({
        id: String(res.data.user_id ?? crypto.randomUUID()),
        email: formData.email,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender as "male" | "female",
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        highBp: formData.highBp!,
        highCholesterol: formData.highCholesterol!,
        heartDisease: formData.heartDisease!,
        walkingDifficulty: formData.walkingDifficulty!,
        generalHealth: formData.generalHealth!,
        sickDays: formData.sickDays as any,
        heavyDrinking: formData.heavyDrinking!,
        physicalActivity: formData.physicalActivity as any,
        dailyFruit: formData.dailyFruit!,
        dailyVeggie: formData.dailyVeggie!,
        smoking: formData.smoking!,
        diabetesStatus: formData.diabetesStatus as any,
        healthGoal: "건강한 생활 습관 만들기",
        healthType: initialHealthType,
        points: 0,
        streak: 0,
        lastActiveDate: new Date(),
      });

      setKakaoProfile(null);
      if (formData.diabetesStatus === "none") setScreen("analysis");
      else setScreen("permissions");

    } catch (err: any) {
      setSubmitError(err?.message ?? "회원가입에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const yesNoOptions = [
    { label: "있다", value: true },
    { label: "없다", value: false },
  ];
  const eatOptions = [
    { label: "매일 먹는다", value: true },
    { label: "안 먹는다", value: false },
  ];
  const daysOptions = [
    { label: "0–10일", value: "0-10" },
    { label: "11–20일", value: "11-20" },
    { label: "21–30일", value: "21-30" },
  ];

  const stepTitles = ["기본 정보 입력", "건강 상태 확인", "생활 습관 확인"];
  const stepSubs = [
    "맞춤형 건강 관리를 위해 기본 정보를 알려주세요.",
    "더 정확한 건강 위험도 예측을 위한 과정입니다.",
    "AI가 꼭 맞는 맞춤형 조언을 해드릴 거예요!",
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* ── 헤더 + 프로그레스 ── */}
      <div className="bg-white border-b border-black/[0.06] px-5 pt-12 pb-5">
        {/* 프로그레스 바 */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                s <= step ? "bg-[#87D57B]" : "bg-[#E8E8E8]",
              )}
            />
          ))}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[22px] font-black text-[#2A2A2A] tracking-[-0.02em]">
              {stepTitles[step - 1]}
            </h1>
            <p className="text-[13px] font-medium text-[#7A7A7A] mt-0.5">
              {stepSubs[step - 1]}
            </p>
          </div>
          <span className="text-[13px] font-bold text-[#9B9B9B] mb-0.5">
            {step} / 3
          </span>
        </div>
      </div>

      {/* ── 폼 영역 ── */}
      <div className="flex-1 px-5 pt-5 pb-32 space-y-4 overflow-auto">
        {/* ───────── STEP 1 ───────── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* 계정 정보 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
              <SectionLabel
                icon={Mail}
                label="계정 정보"
                iconBg="#D6EEFF"
                iconColor="#2878B0"
              />

              {/* 이메일 */}
              <QuestionRow label="이메일">
                <div className="flex gap-2 mt-2.5">
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleEmailChange}
                    disabled={isKakao}
                    className={cn(
                      "flex-1 h-11 bg-[#F5F5F5] border-0 rounded-xl text-[14px] font-medium placeholder:text-[#C8C8C8] focus-visible:ring-1 focus-visible:ring-[#87D57B]",
                      isKakao && "opacity-60 cursor-not-allowed",
                    )}
                  />
                  {!isKakao && (
                    <button
                      onClick={handleEmailCheck}
                      disabled={!formData.email || isEmailChecked || isEmailChecking}
                      className={cn(
                        "h-11 px-3.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-colors",
                        isEmailChecked
                          ? "bg-[#E8F9D6] text-[#3E8C28]"
                          : "bg-[#87D57B] hover:bg-[#6DC462] text-white disabled:opacity-40",
                      )}
                    >
                      {isEmailChecking ? (
                        <div className="flex gap-0.5 px-1">
                          {[0,1,2].map((i) => (
                            <div key={i} className="size-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                          ))}
                        </div>
                      ) : isEmailChecked ? "확인 완료" : "중복 확인"}
                    </button>
                  )}
                </div>
                {emailMessage && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {isEmailChecked ? (
                      <CheckCircle2 className="size-3.5 text-[#3E8C28] shrink-0" />
                    ) : (
                      <AlertCircle className="size-3.5 text-[#C0305A] shrink-0" />
                    )}
                    <p className={cn(
                      "text-[12px] font-medium",
                      isEmailChecked ? "text-[#3E8C28]" : "text-[#C0305A]"
                    )}>
                      {emailMessage}
                    </p>
                  </div>
                )}
              </QuestionRow>

              {/* 비밀번호 — 카카오 유저는 불필요하므로 숨김 */}
              {isKakao ? (
                <div className="flex items-center gap-2.5 bg-[#FFF9E6] rounded-xl px-3.5 py-3">
                  <span className="text-base">🔐</span>
                  <p className="text-[12px] font-medium text-[#8C7010]">
                    카카오 로그인 사용자는 비밀번호가 필요 없어요
                  </p>
                </div>
              ) : (
                <QuestionRow label="비밀번호">
                  <div className="space-y-2 mt-2.5">
                    <Input
                      type="password"
                      placeholder="비밀번호 (6자 이상)"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="h-11 bg-[#F5F5F5] border-0 rounded-xl text-[14px] font-medium placeholder:text-[#C8C8C8] focus-visible:ring-1 focus-visible:ring-[#87D57B]"
                    />
                    <Input
                      type="password"
                      placeholder="비밀번호 재입력"
                      value={formData.passwordConfirm}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passwordConfirm: e.target.value,
                        })
                      }
                      className="h-11 bg-[#F5F5F5] border-0 rounded-xl text-[14px] font-medium placeholder:text-[#C8C8C8] focus-visible:ring-1 focus-visible:ring-[#87D57B]"
                    />
                    {formData.passwordConfirm && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {passwordsMatch && isPasswordValid ? (
                          <CheckCircle2 className="size-3.5 text-[#3E8C28] shrink-0" />
                        ) : (
                          <AlertCircle className="size-3.5 text-[#C0305A] shrink-0" />
                        )}
                        <p
                          className={cn(
                            "text-[12px] font-medium",
                            passwordsMatch && isPasswordValid
                              ? "text-[#3E8C28]"
                              : "text-[#C0305A]",
                          )}
                        >
                          {!isPasswordValid
                            ? "비밀번호는 6자 이상이어야 합니다."
                            : !passwordsMatch
                              ? "비밀번호가 일치하지 않습니다."
                              : "비밀번호가 일치합니다."}
                        </p>
                      </div>
                    )}
                  </div>
                </QuestionRow>
              )}
            </div>

            {/* 개인 정보 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
              <SectionLabel
                icon={User}
                label="개인 정보"
                iconBg="#E8F9D6"
                iconColor="#3E8C28"
              />

              {/* 이름 */}
              <QuestionRow label="이름">
                <Input
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={isKakao && !!kakaoProfile?.name}
                  className={cn(
                    "mt-2.5 h-11 bg-[#F5F5F5] border-0 rounded-xl text-[14px] font-medium placeholder:text-[#C8C8C8] focus-visible:ring-1 focus-visible:ring-[#87D57B]",
                    isKakao &&
                      kakaoProfile?.name &&
                      "opacity-60 cursor-not-allowed",
                  )}
                />
              </QuestionRow>

              {/* 나이 */}
              <QuestionRow
                label="나이"
                sub={
                  isKakao && kakaoProfile?.ageRange
                    ? `카카오 제공 연령대: ${kakaoProfile.ageRange}세`
                    : undefined
                }
              >
                <Input
                  type="number"
                  placeholder="나이를 입력하세요"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="mt-2.5 h-11 bg-[#F5F5F5] border-0 rounded-xl text-[14px] font-medium placeholder:text-[#C8C8C8] focus-visible:ring-1 focus-visible:ring-[#87D57B]"
                />
              </QuestionRow>

              {/* 성별 */}
              <QuestionRow label="성별">
                <ButtonGroup
                  options={[
                    { label: "남성", value: "male" },
                    { label: "여성", value: "female" },
                  ]}
                  value={formData.gender}
                  onChange={(v) => setFormData({ ...formData, gender: v })}
                  disabled={isKakao && !!kakaoProfile?.gender}
                />
              </QuestionRow>
            </div>

            {/* 신체 정보 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
              <SectionLabel
                icon={Ruler}
                label="신체 정보"
                iconBg="#FFB8CA"
                iconColor="#C0305A"
              />
              <div className="grid grid-cols-2 gap-3">
                <QuestionRow label="키">
                  <div className="relative mt-2.5">
                    <Input
                      type="number"
                      placeholder="cm"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData({ ...formData, height: e.target.value })
                      }
                      className="h-11 bg-[#F5F5F5] border-0 rounded-xl text-[14px] font-medium placeholder:text-[#C8C8C8] pr-10 focus-visible:ring-1 focus-visible:ring-[#87D57B]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#9B9B9B]">
                      cm
                    </span>
                  </div>
                </QuestionRow>
                <QuestionRow label="몸무게">
                  <div className="relative mt-2.5">
                    <Input
                      type="number"
                      placeholder="kg"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      className="h-11 bg-[#F5F5F5] border-0 rounded-xl text-[14px] font-medium placeholder:text-[#C8C8C8] pr-10 focus-visible:ring-1 focus-visible:ring-[#87D57B]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#9B9B9B]">
                      kg
                    </span>
                  </div>
                </QuestionRow>
              </div>
            </div>
          </div>
        )}

        {/* ───────── STEP 2 ───────── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* 건강 질환 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-5">
              <SectionLabel
                icon={HeartPulse}
                label="건강 질환"
                iconBg="#FFB8CA"
                iconColor="#C0305A"
              />

              <QuestionRow label="고혈압을 진단받은 적이 있나요?">
                <ButtonGroup
                  options={yesNoOptions}
                  value={formData.highBp}
                  onChange={(v) => setFormData({ ...formData, highBp: v })}
                />
              </QuestionRow>
              <div className="h-px bg-[#F5F5F5]" />
              <QuestionRow label="고콜레스테롤혈증을 진단받은 적이 있나요?">
                <ButtonGroup
                  options={yesNoOptions}
                  value={formData.highCholesterol}
                  onChange={(v) =>
                    setFormData({ ...formData, highCholesterol: v })
                  }
                />
              </QuestionRow>
              <div className="h-px bg-[#F5F5F5]" />
              <QuestionRow label="심질환 (관상동맥 심장병 또는 심근경색) 여부">
                <ButtonGroup
                  options={yesNoOptions}
                  value={formData.heartDisease}
                  onChange={(v) =>
                    setFormData({ ...formData, heartDisease: v })
                  }
                />
              </QuestionRow>
              <div className="h-px bg-[#F5F5F5]" />
              <QuestionRow label="보행에 장애나 불편함이 있나요?">
                <ButtonGroup
                  options={yesNoOptions}
                  value={formData.walkingDifficulty}
                  onChange={(v) =>
                    setFormData({ ...formData, walkingDifficulty: v })
                  }
                />
              </QuestionRow>
            </div>

            {/* 생활 상태 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-5">
              <SectionLabel
                icon={Calendar}
                label="생활 상태"
                iconBg="#FFF383"
                iconColor="#8C7010"
              />

              <QuestionRow label="최근 30일 동안 아픈 날은 며칠인가요?">
                <ButtonGroup
                  options={daysOptions}
                  value={formData.sickDays}
                  onChange={(v) => setFormData({ ...formData, sickDays: v })}
                />
              </QuestionRow>
              <div className="h-px bg-[#F5F5F5]" />
              <QuestionRow label="평소 건강 상태를 어떻게 느끼시나요?">
                <div className="flex gap-1.5 mt-2.5">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() =>
                        setFormData({ ...formData, generalHealth: score })
                      }
                      className={cn(
                        "flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-all",
                        formData.generalHealth === score
                          ? "bg-[#87D57B] text-white"
                          : "bg-[#F5F5F5] text-[#9B9B9B] hover:bg-[#E8E8E8]",
                      )}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[11px] font-medium text-[#C8C8C8] mt-1.5 px-1">
                  <span>매우 나쁨</span>
                  <span>매우 좋음</span>
                </div>
              </QuestionRow>
              <div className="h-px bg-[#F5F5F5]" />
              <QuestionRow
                label="과도한 음주를 하시나요?"
                sub="일주일 기준: 남성 14잔 / 여성 7잔 이상"
              >
                <ButtonGroup
                  options={[
                    { label: "예", value: true },
                    { label: "아니오", value: false },
                  ]}
                  value={formData.heavyDrinking}
                  onChange={(v) =>
                    setFormData({ ...formData, heavyDrinking: v })
                  }
                />
              </QuestionRow>
            </div>
          </div>
        )}

        {/* ───────── STEP 3 ───────── */}
        {step === 3 && (
          <div className="space-y-4">
            {/* 생활 습관 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-5">
              <SectionLabel
                icon={Activity}
                label="생활 습관"
                iconBg="#E8F9D6"
                iconColor="#3E8C28"
              />

              <QuestionRow label="최근 30일 동안 신체활동을 한 날은 며칠인가요?">
                <ButtonGroup
                  options={daysOptions}
                  value={formData.physicalActivity}
                  onChange={(v) =>
                    setFormData({ ...formData, physicalActivity: v })
                  }
                />
              </QuestionRow>
              <div className="h-px bg-[#F5F5F5]" />
              <QuestionRow label="일일 과일 섭취 여부">
                <ButtonGroup
                  options={eatOptions}
                  value={formData.dailyFruit}
                  onChange={(v) => setFormData({ ...formData, dailyFruit: v })}
                />
              </QuestionRow>
              <div className="h-px bg-[#F5F5F5]" />
              <QuestionRow label="일일 채소 섭취 여부">
                <ButtonGroup
                  options={eatOptions}
                  value={formData.dailyVeggie}
                  onChange={(v) => setFormData({ ...formData, dailyVeggie: v })}
                />
              </QuestionRow>
              <div className="h-px bg-[#F5F5F5]" />
              <QuestionRow label="흡연을 하시나요?">
                <ButtonGroup
                  options={[
                    { label: "흡연함", value: true },
                    { label: "비흡연", value: false },
                  ]}
                  value={formData.smoking}
                  onChange={(v) => setFormData({ ...formData, smoking: v })}
                />
              </QuestionRow>
            </div>

            {/* 당뇨 — 특별 강조 카드 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 border border-[#A1E8CE]">
              <SectionLabel
                icon={Dna}
                label="당뇨 여부"
                iconBg="#D6FFF0"
                iconColor="#1A8A6A"
              />
              <p className="text-[15px] font-semibold text-[#2A2A2A] mb-3">
                당뇨병을 진단받은 적이 있나요?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "1형 당뇨", value: "1" },
                  { label: "2형 당뇨", value: "2" },
                  { label: "없음 (해당없음)", value: "none" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        diabetesStatus: opt.value as any,
                      })
                    }
                    className={cn(
                      "py-3 rounded-xl text-[14px] font-semibold transition-all",
                      formData.diabetesStatus === opt.value
                        ? opt.value === "none"
                          ? "bg-[#87D57B] text-white"
                          : "bg-[#87D57B] text-white"
                        : "bg-[#F5F5F5] text-[#6A6A6A] hover:bg-[#E8E8E8]",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {formData.diabetesStatus &&
                formData.diabetesStatus !== "none" && (
                  <div className="flex items-center gap-2 mt-3 bg-[#fff9e6] rounded-xl px-3.5 py-2.5">
                    <Leaf className="size-3.5 text-[#8c7010] shrink-0" />
                    <p className="text-[12px] font-medium text-[#8c7010]">
                      당뇨 맞춤형 미션과 식단이 제공됩니다.
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* ── 하단 버튼 ── */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA] to-transparent">
        {submitError && (
          <div className="max-w-md mx-auto mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5">
            <AlertCircle className="size-4 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-600">{submitError}</p>
          </div>
        )}
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={handlePrev}
              className="size-14 shrink-0 rounded-2xl border-2 border-[#CBF891] bg-white flex items-center justify-center hover:bg-[#F9FFEF] transition-colors"
            >
              <ChevronLeft className="size-5 text-[#3C3C3C]" />
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={
              isSubmitting ||
              (step === 1 ? !step1Valid : step === 2 ? !step2Valid : !step3Valid)
            }
            className="flex-1 h-14 rounded-2xl bg-[#87D57B] hover:bg-[#6DC462] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-[16px] font-bold text-white transition-colors"
          >
            {isSubmitting ? (
              <div className="flex gap-1">
                {[0,1,2].map((i) => (
                  <div key={i} className="size-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                ))}
              </div>
            ) : (
              <>
                {step === 3
                  ? formData.diabetesStatus === "none"
                    ? "AI 진단 시작하기"
                    : "완료하고 넘어가기"
                  : "다음 단계로"}
                <ChevronRight className="size-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
