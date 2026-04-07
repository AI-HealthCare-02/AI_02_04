
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  User,
  Activity,
  Heart,
  ClipboardCheck,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BackendUserType } from "@/lib/types";

export function EditHealthInfoScreen() {
  const { userProfile, setUserProfile, setScreen } = useAppStore();

  // ✨ 편집 모드 상태 (기본값: false = 뷰어 모드)
  const [isEditing, setIsEditing] = useState(false);

  // 모든 프로필 데이터를 상태로 관리
  const [formData, setFormData] = useState({
    ...userProfile,
    age: userProfile?.age || 0,
    height: userProfile?.height || 0,
    weight: userProfile?.weight || 0,
    gender: userProfile?.gender || "male",
    diabetesStatus: userProfile?.diabetesStatus || "none",
    highBp: userProfile?.highBp || false,
    highCholesterol: userProfile?.highCholesterol || false,
    heartDisease: userProfile?.heartDisease || false,
    smoking: userProfile?.smoking || false,
    heavyDrinking: userProfile?.heavyDrinking || false,
    physicalActivity: userProfile?.physicalActivity || "0-10",
  });

  const handleSave = () => {
    if (userProfile) {
      // ✨ 백그라운드 AI 재분석 로직 (화면 이동 없이 타입 즉시 재계산)
      let newHealthType: BackendUserType = userProfile.healthType;
      const bmi = formData.weight / (formData.height / 100) ** 2;
      const isRiskAge = formData.age >= 45;
      const isRiskGroup = bmi >= 25 || isRiskAge;

      if (formData.diabetesStatus === "1") {
        newHealthType = "diabetic_1";
      } else if (formData.diabetesStatus === "2") {
        newHealthType = "diabetic_2";
      } else if (isRiskGroup) {
        newHealthType = "at_risk";
      } else if (
        ["diabetic_1", "diabetic_2", "at_risk"].includes(newHealthType)
      ) {
        // 위험군/당뇨였으나 정상으로 호전된 경우 기본값으로 폴백
        newHealthType = "general_health";
      }

      const updatedProfile = {
        ...userProfile,
        ...formData,
        healthType: newHealthType,
      };

      // 스토어 업데이트 (store.ts의 미션 팩토리가 즉시 새 미션을 생성함)
      setUserProfile(updatedProfile);

      // 저장 완료 후 뷰어 모드로 전환
      setIsEditing(false);
      alert("건강 정보가 업데이트되고 맞춤 미션이 재설정되었습니다.");
    }
  };

  const SectionTitle = ({
    icon: Icon,
    title,
  }: {
    icon: any;
    title: string;
  }) => (
    <div className="flex items-center gap-2 mb-4 mt-6">
      <Icon className="w-5 h-5 text-primary" />
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScreen("mypage")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">
            {isEditing ? "건강 프로필 수정" : "내 건강 정보"}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-2">
        {/* 안내 메시지 (편집 모드일 때만 표시) */}
        {isEditing && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-snug">
              저장 시 AI가 건강 상태를 다시 분석하며, 결과에 따라 **오늘의
              미션이 즉시 새롭게 변경**됩니다.
            </p>
          </div>
        )}

        {/* 1. 기본 신체 정보 */}
        <SectionTitle icon={User} title="기본 신체 정보" />
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">나이</Label>
                <Input
                  type="number"
                  value={formData.age}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setFormData({ ...formData, age: Number(e.target.value) })
                  }
                  className={cn(
                    !isEditing &&
                      "bg-muted/30 font-semibold border-transparent",
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">성별</Label>
                <div
                  className={cn(
                    "flex bg-muted rounded-md p-1 h-10",
                    !isEditing && "pointer-events-none opacity-90",
                  )}
                >
                  <button
                    className={cn(
                      "flex-1 text-xs rounded-md transition-all",
                      formData.gender === "male"
                        ? "bg-background shadow-sm font-bold text-foreground"
                        : "text-muted-foreground",
                    )}
                    onClick={() => setFormData({ ...formData, gender: "male" })}
                  >
                    남성
                  </button>
                  <button
                    className={cn(
                      "flex-1 text-xs rounded-md transition-all",
                      formData.gender === "female"
                        ? "bg-background shadow-sm font-bold text-foreground"
                        : "text-muted-foreground",
                    )}
                    onClick={() =>
                      setFormData({ ...formData, gender: "female" })
                    }
                  >
                    여성
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">키 (cm)</Label>
                <Input
                  type="number"
                  value={formData.height}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setFormData({ ...formData, height: Number(e.target.value) })
                  }
                  className={cn(
                    !isEditing &&
                      "bg-muted/30 font-semibold border-transparent",
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  몸무게 (kg)
                </Label>
                <Input
                  type="number"
                  value={formData.weight}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: Number(e.target.value) })
                  }
                  className={cn(
                    !isEditing &&
                      "bg-muted/30 font-semibold border-transparent",
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. 질환 및 위험 요인 */}
        <SectionTitle icon={Heart} title="질환 및 위험 요인" />
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent
            className={cn(
              "p-4 space-y-4 divide-y divide-border/30",
              !isEditing && "pointer-events-none opacity-90",
            )}
          >
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">고혈압</Label>
                <p className="text-[10px] text-muted-foreground">
                  진단받았거나 약을 복용 중인가요?
                </p>
              </div>
              <Switch
                checked={formData.highBp}
                onCheckedChange={(val) =>
                  setFormData({ ...formData, highBp: val })
                }
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between pt-3 py-1">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">고콜레스테롤</Label>
                <p className="text-[10px] text-muted-foreground">
                  혈중 콜레스테롤 수치가 높은가요?
                </p>
              </div>
              <Switch
                checked={formData.highCholesterol}
                onCheckedChange={(val) =>
                  setFormData({ ...formData, highCholesterol: val })
                }
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between pt-3 py-1">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">심장 질환</Label>
                <p className="text-[10px] text-muted-foreground">
                  협심증, 심근경색 등 이력이 있나요?
                </p>
              </div>
              <Switch
                checked={formData.heartDisease}
                onCheckedChange={(val) =>
                  setFormData({ ...formData, heartDisease: val })
                }
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. 당뇨 상태 상세 */}
        <SectionTitle icon={ClipboardCheck} title="당뇨병 진단 여부" />
        <div
          className={cn(
            "grid grid-cols-3 gap-2",
            !isEditing && "pointer-events-none opacity-90",
          )}
        >
          {[
            { value: "none", label: "없음" },
            { value: "1", label: "제1형" },
            { value: "2", label: "제2형" },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={
                formData.diabetesStatus === opt.value ? "default" : "outline"
              }
              className={cn(
                "h-14 rounded-xl text-xs font-semibold",
                !isEditing &&
                  formData.diabetesStatus !== opt.value &&
                  "bg-muted/20 text-muted-foreground border-transparent",
              )}
              onClick={() =>
                setFormData({ ...formData, diabetesStatus: opt.value as any })
              }
              disabled={!isEditing}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* 4. 생활 습관 */}
        <SectionTitle icon={Activity} title="생활 습관" />
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent
            className={cn(
              "p-4 space-y-4 divide-y divide-border/30",
              !isEditing && "pointer-events-none opacity-90",
            )}
          >
            <div className="flex items-center justify-between py-1">
              <Label className="text-sm font-medium">현재 흡연 여부</Label>
              <Switch
                checked={formData.smoking}
                onCheckedChange={(val) =>
                  setFormData({ ...formData, smoking: val })
                }
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between pt-3 py-1">
              <Label className="text-sm font-medium">
                과음 여부 (주 2회 이상)
              </Label>
              <Switch
                checked={formData.heavyDrinking}
                onCheckedChange={(val) =>
                  setFormData({ ...formData, heavyDrinking: val })
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-3 pt-3">
              <Label className="text-sm font-medium">
                월간 신체 활동량 (일)
              </Label>
              <div className="flex bg-muted rounded-xl p-1 h-12">
                {["0-10", "11-20", "21-30"].map((range) => (
                  <button
                    key={range}
                    className={cn(
                      "flex-1 text-xs rounded-lg transition-all",
                      formData.physicalActivity === range
                        ? "bg-background shadow-sm font-bold text-primary"
                        : "text-muted-foreground",
                    )}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        physicalActivity: range as any,
                      })
                    }
                  >
                    {range === "21-30" ? "매일 가깝게" : range + "일"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 하단 플로팅 버튼 (뷰어 모드일 때는 '수정하기'로 표시) */}
        <div className="pt-6 pb-12">
          {isEditing ? (
            <Button
              className="w-full h-14 text-lg rounded-2xl shadow-lg gap-2 animate-in slide-in-from-bottom-2"
              onClick={handleSave}
            >
              <Save className="w-5 h-5" />
              정보 업데이트 및 저장
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full h-14 text-lg rounded-2xl border-primary/50 text-primary gap-2"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="w-5 h-5" />
              수정하기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
