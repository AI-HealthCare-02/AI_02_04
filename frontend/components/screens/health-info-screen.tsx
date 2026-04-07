
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  ChevronLeft,
  User,
  Ruler,
  Scale,
  Calendar,
  Mail,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BackendUserType } from "@/lib/types";

const ButtonGroup = ({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: any }[];
  value: any;
  onChange: (val: any) => void;
}) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {options.map((opt) => (
      <button
        key={String(opt.value)}
        onClick={() => onChange(opt.value)}
        className={cn(
          "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all border",
          value === opt.value
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-muted-foreground border-border hover:bg-muted",
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export function HealthInfoScreen() {
  const { setScreen, setUserProfile } = useAppStore();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    // ✨ 계정 정보 추가
    email: "",
    password: "",
    passwordConfirm: "",

    name: "",
    age: "",
    gender: "" as "male" | "female" | "",
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

  // ✨ 이메일 중복 체크 관련 상태
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");

  // 비밀번호 일치 여부 및 유효성 확인
  const isPasswordValid = formData.password.length >= 6;
  const passwordsMatch =
    formData.password && formData.password === formData.passwordConfirm;

  // ✨ Step 1 검증 로직에 계정 정보 추가
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

  // ✨ 이메일 입력 시 중복 확인 상태 초기화
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, email: e.target.value });
    setIsEmailChecked(false);
    setEmailMessage("");
  };

  // ✨ 이메일 중복 확인 시뮬레이션
  const handleEmailCheck = () => {
    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      setEmailMessage("올바른 이메일 형식을 입력해주세요.");
      setIsEmailChecked(false);
      return;
    }

    // 백엔드 API 호출을 시뮬레이션합니다.
    setEmailMessage("사용 가능한 이메일입니다.");
    setIsEmailChecked(true);
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    let initialHealthType: BackendUserType = "pending";

    if (["1", "2", "unknown"].includes(formData.diabetesStatus)) {
      initialHealthType =
        formData.diabetesStatus === "1" ? "diabetic_1" : "diabetic_2";
    }

    setUserProfile({
      id: crypto.randomUUID(),
      email: formData.email, // ✨ 이메일 저장 (비밀번호는 전역 상태에 저장하지 않음)
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

    if (formData.diabetesStatus === "none") {
      setScreen("analysis");
    } else {
      setScreen("permissions");
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
    { label: "0-10일", value: "0-10" },
    { label: "11-20일", value: "11-20" },
    { label: "21-30일", value: "21-30" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col">
      <div className="p-6 pb-2">
        <Progress value={(step / 3) * 100} className="h-2 mb-4" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            {step === 1
              ? "기본 정보 입력"
              : step === 2
                ? "건강 상태 확인"
                : "생활 습관 확인"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === 1
              ? "맞춤형 건강 관리를 위해 기본 정보를 알려주세요."
              : step === 2
                ? "더 정확한 건강 위험도 예측을 위한 과정입니다."
                : "AI가 꼭 맞는 맞춤형 조언을 해드릴 거예요!"}
          </p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-auto pb-24">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            {/* ✨ 계정 정보 입력 (이메일 & 비밀번호) */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      이메일
                    </FieldLabel>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={handleEmailChange}
                        className="flex-1"
                      />
                      <Button
                        variant={isEmailChecked ? "default" : "outline"}
                        onClick={handleEmailCheck}
                        disabled={!formData.email || isEmailChecked}
                        className={cn(
                          "whitespace-nowrap transition-all",
                          isEmailChecked &&
                            "bg-success hover:bg-success text-white",
                        )}
                      >
                        {isEmailChecked ? "확인 완료" : "중복 확인"}
                      </Button>
                    </div>
                    {emailMessage && (
                      <p
                        className={cn(
                          "text-xs mt-1.5 font-medium",
                          isEmailChecked ? "text-success" : "text-destructive",
                        )}
                      >
                        {emailMessage}
                      </p>
                    )}
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      비밀번호
                    </FieldLabel>
                    <Input
                      type="password"
                      placeholder="비밀번호 (6자 이상)"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="mt-2 mb-2"
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
                    />
                    {formData.passwordConfirm && (
                      <p
                        className={cn(
                          "text-xs mt-1.5 font-medium",
                          passwordsMatch && isPasswordValid
                            ? "text-success"
                            : "text-destructive",
                        )}
                      >
                        {!isPasswordValid
                          ? "비밀번호는 6자 이상이어야 합니다."
                          : !passwordsMatch
                            ? "비밀번호가 일치하지 않습니다."
                            : "비밀번호가 일치합니다."}
                      </p>
                    )}
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      이름
                    </FieldLabel>
                    <Input
                      placeholder="이름을 입력하세요"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="mt-2"
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      나이
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder="나이를 입력하세요"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      className="mt-2"
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>성별</FieldLabel>
                    <ButtonGroup
                      options={[
                        { label: "남성", value: "male" },
                        { label: "여성", value: "female" },
                      ]}
                      value={formData.gender}
                      onChange={(v) => setFormData({ ...formData, gender: v })}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-primary" />키 (cm)
                      </FieldLabel>
                      <Input
                        type="number"
                        placeholder="입력"
                        value={formData.height}
                        onChange={(e) =>
                          setFormData({ ...formData, height: e.target.value })
                        }
                        className="mt-2"
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-primary" />
                        몸무게 (kg)
                      </FieldLabel>
                      <Input
                        type="number"
                        placeholder="입력"
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData({ ...formData, weight: e.target.value })
                        }
                        className="mt-2"
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <Card>
              <CardContent className="p-4 space-y-5">
                <Field>
                  <FieldLabel>고혈압을 진단받은 적이 있나요?</FieldLabel>
                  <ButtonGroup
                    options={yesNoOptions}
                    value={formData.highBp}
                    onChange={(v) => setFormData({ ...formData, highBp: v })}
                  />
                </Field>
                <Field>
                  <FieldLabel>
                    고콜레스테롤혈증을 진단받은 적이 있나요?
                  </FieldLabel>
                  <ButtonGroup
                    options={yesNoOptions}
                    value={formData.highCholesterol}
                    onChange={(v) =>
                      setFormData({ ...formData, highCholesterol: v })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>
                    심질환 (관상동맥 심장병 또는 심근경색) 여부
                  </FieldLabel>
                  <ButtonGroup
                    options={yesNoOptions}
                    value={formData.heartDisease}
                    onChange={(v) =>
                      setFormData({ ...formData, heartDisease: v })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>보행에 장애나 불편함이 있나요?</FieldLabel>
                  <ButtonGroup
                    options={yesNoOptions}
                    value={formData.walkingDifficulty}
                    onChange={(v) =>
                      setFormData({ ...formData, walkingDifficulty: v })
                    }
                  />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-5">
                <Field>
                  <FieldLabel>최근 30일 동안 아픈 날은 며칠인가요?</FieldLabel>
                  <ButtonGroup
                    options={daysOptions}
                    value={formData.sickDays}
                    onChange={(v) => setFormData({ ...formData, sickDays: v })}
                  />
                </Field>
                <Field>
                  <FieldLabel>평소 건강 상태를 어떻게 느끼시나요?</FieldLabel>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() =>
                          setFormData({ ...formData, generalHealth: score })
                        }
                        className={cn(
                          "flex-1 py-2 text-sm font-medium rounded-lg border",
                          formData.generalHealth === score
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground",
                        )}
                      >
                        {score}점
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                    <span>매우 나쁨</span>
                    <span>매우 좋음</span>
                  </div>
                </Field>
                <Field>
                  <FieldLabel>
                    과도한 음주를 하시나요?{" "}
                    <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                      (일주일 기준: 남성 14잔 / 여성 7잔 이상)
                    </span>
                  </FieldLabel>
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
                </Field>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <Card>
              <CardContent className="p-4 space-y-5">
                <Field>
                  <FieldLabel>
                    최근 30일 동안 신체활동을 한 날은 며칠인가요?
                  </FieldLabel>
                  <ButtonGroup
                    options={daysOptions}
                    value={formData.physicalActivity}
                    onChange={(v) =>
                      setFormData({ ...formData, physicalActivity: v })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>일일 과일 섭취 여부</FieldLabel>
                  <ButtonGroup
                    options={eatOptions}
                    value={formData.dailyFruit}
                    onChange={(v) =>
                      setFormData({ ...formData, dailyFruit: v })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>일일 채소 섭취 여부</FieldLabel>
                  <ButtonGroup
                    options={eatOptions}
                    value={formData.dailyVeggie}
                    onChange={(v) =>
                      setFormData({ ...formData, dailyVeggie: v })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>흡연을 하시나요?</FieldLabel>
                  <ButtonGroup
                    options={[
                      { label: "흡연함", value: true },
                      { label: "비흡연", value: false },
                    ]}
                    value={formData.smoking}
                    onChange={(v) => setFormData({ ...formData, smoking: v })}
                  />
                </Field>
              </CardContent>
            </Card>

            <Card className="border-primary/50">
              <CardContent className="p-4">
                <Field>
                  <FieldLabel className="text-primary font-bold">
                    당뇨병을 진단받은 적이 있나요?
                  </FieldLabel>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() =>
                        setFormData({ ...formData, diabetesStatus: "1" })
                      }
                      className={cn(
                        "py-2.5 rounded-xl text-sm border font-medium",
                        formData.diabetesStatus === "1"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground",
                      )}
                    >
                      1형 당뇨
                    </button>
                    <button
                      onClick={() =>
                        setFormData({ ...formData, diabetesStatus: "2" })
                      }
                      className={cn(
                        "py-2.5 rounded-xl text-sm border font-medium",
                        formData.diabetesStatus === "2"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground",
                      )}
                    >
                      2형 당뇨
                    </button>
                    <button
                      onClick={() =>
                        setFormData({ ...formData, diabetesStatus: "none" })
                      }
                      className={cn(
                        "py-2.5 rounded-xl text-sm border font-medium",
                        formData.diabetesStatus === "none"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground",
                      )}
                    >
                      없음 (해당없음)
                    </button>
                  </div>
                </Field>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="p-6 pt-0 bg-gradient-to-t from-background via-background to-transparent flex gap-3">
        {step > 1 && (
          <Button
            onClick={handlePrev}
            variant="outline"
            className="w-14 h-14 shrink-0 px-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={
            step === 1 ? !step1Valid : step === 2 ? !step2Valid : !step3Valid
          }
          className="flex-1 h-14 text-lg"
        >
          {step === 3
            ? formData.diabetesStatus === "none"
              ? "AI 진단 시작하기"
              : "완료하고 넘어가기"
            : "다음 단계로"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
