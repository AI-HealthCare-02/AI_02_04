
import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { fetchWeeklyReport } from "@/lib/api";
import type { WeeklyReportResponse, FailurePattern, ChallengeRedesignSuggestion } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollHeader } from "@/components/ui/scroll-header";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import {
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Target as TargetIcon,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Clock,
  Zap,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FALLBACK_SCORE = 85;

// 건강한 식품 키워드 (간단 판별용)
const HEALTHY_KEYWORDS = ["샐러드", "닭가슴살", "현미", "두부", "나물", "고구마", "아몬드", "견과", "채소", "브로콜리", "연어", "계란"];

// 활동 레벨별 색상
const activityColor = (level: number) =>
  level === 1 ? { bg: "#CBF891", text: "#3E8C28" } : { bg: "#F0F0F0", text: "#9B9B9B" };

/* ── 실패 패턴 타입 라벨 & 스타일 ── */
const FAILURE_PATTERN_META = {
  day_based:     { label: "요일 패턴",     icon: Calendar,   border: "#FFF383", bg: "#FFFDF0", accent: "#8C7010" },
  time_based:    { label: "시간대 패턴",   icon: Clock,      border: "#AEE1F9", bg: "#F0F9FF", accent: "#2878B0" },
  streak_based:  { label: "연속 실패",     icon: TrendingUp, border: "#FFB8CA", bg: "#FFF0F5", accent: "#C0305A" },
  trigger_based: { label: "트리거 패턴",   icon: Zap,        border: "#CBF891", bg: "#F0FDF4", accent: "#3E8C28" },
};

/* ── 실패 패턴 카드 ── */
function FailurePatternCard({ pattern }: { pattern: FailurePattern }) {
  const meta = FAILURE_PATTERN_META[pattern.pattern_type] ?? FAILURE_PATTERN_META.day_based;
  const Icon = meta.icon;
  const confPct = Math.round(pattern.confidence * 100);

  return (
    <div
      className="rounded-2xl p-4 border-l-4"
      style={{ backgroundColor: meta.bg, borderLeftColor: meta.border, borderWidth: "0 0 0 4px", borderStyle: "solid" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="size-6 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: meta.border }}
          >
            <Icon className="size-3.5" style={{ color: meta.accent }} strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-bold" style={{ color: meta.accent }}>
            {meta.label}
          </span>
        </div>
        <span className="text-[11px] font-bold text-[#9B9B9B]">
          확신도 {confPct}%
        </span>
      </div>
      <p className="text-[13px] text-[#3C3C3C] leading-relaxed mb-2">
        {pattern.detail}
      </p>
      <div className="flex items-start gap-1.5">
        <span className="text-[12px] shrink-0">💡</span>
        <p className="text-[12px] text-[#7A7A7A] leading-relaxed">
          {pattern.suggested_action}
        </p>
      </div>
    </div>
  );
}

/* ── 챌린지 재설계 카드 ── */
function RedesignCard({ suggestion }: { suggestion: ChallengeRedesignSuggestion }) {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  return (
    <div className="rounded-2xl border border-[#AEE1F9] bg-[#F0F9FF] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-6 rounded-lg bg-[#AEE1F9] flex items-center justify-center">
          <RefreshCw className="size-3.5 text-[#2878B0]" strokeWidth={2.5} />
        </div>
        <span className="text-[13px] font-bold text-[#2878B0]">챌린지 재설계 제안</span>
      </div>

      <div className="flex items-center gap-2 mb-2 bg-white rounded-xl px-3 py-2.5 border border-[#D6EEFF]">
        <span className="text-[12px] text-[#9B9B9B] shrink-0">현재</span>
        <span className="text-[13px] text-[#9B9B9B] line-through flex-1">{suggestion.current_challenge}</span>
        <ArrowRight className="size-3.5 text-[#2878B0] shrink-0" />
        <span className="text-[13px] font-bold text-[#2878B0]">{suggestion.suggested_change}</span>
      </div>

      {suggestion.reason && (
        <p className="text-[12px] text-[#7A7A7A] leading-relaxed mb-3">{suggestion.reason}</p>
      )}

      {accepted === null ? (
        <div className="flex gap-2">
          <Button
            className="flex-1 h-10 text-[13px] font-bold rounded-xl bg-[#2878B0] hover:bg-[#1A5A8A] text-white border-0"
            onClick={() => setAccepted(true)}
          >
            ✅ 적용하기
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-10 text-[13px] font-bold rounded-xl border-[#AEE1F9] text-[#7A7A7A]"
            onClick={() => setAccepted(false)}
          >
            유지하기
          </Button>
        </div>
      ) : accepted ? (
        <div className="text-center py-2.5 bg-[#E8F9D6] rounded-xl text-[13px] font-bold text-[#3E8C28]">
          ✅ 챌린지가 재설계되었습니다
        </div>
      ) : (
        <div className="text-center py-2.5 bg-[#F5F5F5] rounded-xl text-[13px] font-medium text-[#9B9B9B]">
          기존 목표를 유지합니다
        </div>
      )}
    </div>
  );
}

// 이번 주 월~일 날짜 범위 계산
function getWeekLabel() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const month = monday.getMonth() + 1;
  // 이번 달의 몇 번째 주인지
  const weekNum = Math.ceil(monday.getDate() / 7);
  return `${month}월 ${weekNum}주차 분석 결과`;
}

export function ReportScreen() {
  const { setScreen, missions, dietEntries } = useAppStore();
  const isScrolled = useScrollHeader();
  const [reportData, setReportData] = useState<WeeklyReportResponse | null>(null);

  useEffect(() => {
    fetchWeeklyReport()
      .then(setReportData)
      .catch(() => { /* API 실패 시 하드코딩 폴백 */ });
  }, []);

  // 주간 날짜 라벨
  const weekLabel = useMemo(() => getWeekLabel(), []);

  // 이번 주 미션 완료 여부 → 요일별 활동량
  // (당일 완료 미션 비율 기준: 50% 이상이면 활동 있음으로 표시)
  const weekDayActivity = useMemo(() => {
    const today = new Date();
    const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const completedRatio = missions.length > 0
      ? missions.filter((m) => m.completed).length / missions.length
      : 0;
    return ["월", "화", "수", "목", "금", "토", "일"].map((day, idx) => ({
      day,
      level: idx < todayIdx ? 1 : idx === todayIdx ? (completedRatio >= 0.5 ? 1 : 0) : 0,
    }));
  }, [missions]);

  // 식단 항목 → 워드클라우드 (최근 7일 항목 기반)
  const wordCloudData = useMemo(() => {
    const SIZES = ["text-[22px]", "text-[20px]", "text-[18px]", "text-[15px]", "text-[13px]"];
    if (dietEntries.length === 0) {
      // 기록 없으면 기본 데이터
      return [
        { text: "샐러드",   size: SIZES[0], healthy: true  },
        { text: "라면",     size: SIZES[1], healthy: false },
        { text: "닭가슴살", size: SIZES[2], healthy: true  },
        { text: "현미밥",   size: SIZES[3], healthy: true  },
        { text: "빵",       size: SIZES[1], healthy: false },
      ];
    }
    // 최근 7개 식단 항목을 워드클라우드로 변환
    const recent = dietEntries.slice(-7);
    return recent.map((entry, i) => ({
      text: entry.name,
      size: SIZES[Math.min(i, SIZES.length - 1)],
      healthy: HEALTHY_KEYWORDS.some((k) => entry.name.includes(k)),
    }));
  }, [dietEntries]);

  // 식단 영양소 평균 계산
  const nutritionAvg = useMemo(() => {
    if (dietEntries.length === 0) return { carbs: 50, protein: 30, fat: 20 };
    const recent = dietEntries.slice(-7);
    const total = recent.reduce(
      (acc, e) => ({ carbs: acc.carbs + (e.carbs ?? 0), protein: acc.protein + (e.protein ?? 0) }),
      { carbs: 0, protein: 0 },
    );
    const avgCarbs = Math.round(total.carbs / recent.length);
    const avgProtein = Math.round(total.protein / recent.length);
    const avgFat = Math.max(0, 100 - avgCarbs - avgProtein);
    return { carbs: avgCarbs || 50, protein: avgProtein || 30, fat: avgFat || 20 };
  }, [dietEntries]);

  const weeklyScore = reportData?.health_score ?? FALLBACK_SCORE;
  const aiBriefing = reportData?.ai_briefing ?? {
    good: "수요일과 목요일에 식이섬유가 풍부한 식단을 완벽히 지켜주셨어요! 혈당 관리에 아주 좋은 습관입니다.",
    bad: "주말에 정제 탄수화물(빵, 면) 섭취 빈도가 평일 대비 40% 증가했습니다. 다음 주말엔 통곡물 빵으로 대체해 보는 건 어떨까요?",
    next_week: "다음 주에는 식후 15분 걷기 미션을 매일 달성하여 식후 혈당 스파이크를 잡아볼까요?",
  };

  // 원형 그래프 계산
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (weeklyScore / 100) * circumference;

  // 섹션 레이블 컴포넌트
  const SectionLabel = ({
    icon: Icon,
    title,
    iconBg,
    iconColor,
  }: {
    icon: React.ElementType;
    title: string;
    iconBg: string;
    iconColor: string;
  }) => (
    <div className="flex items-center gap-2.5 mb-3 px-1">
      <div
        className="size-7 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="size-3.5" style={{ color: iconColor }} strokeWidth={2} />
      </div>
      <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
        {title}
      </p>
    </div>
  );

  /* ── mini: 캐릭터 독려 메시지만 표시 ── */
  if (reportData?.report_type === "mini") {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-8 gap-5">
        <div className="size-16 rounded-full bg-[#CBF891] flex items-center justify-center">
          <ThumbsUp className="size-8 text-[#3E8C28]" strokeWidth={2} />
        </div>
        <div className="text-center">
          <p className="text-[18px] font-bold text-[#3C3C3C] mb-2">기록을 더 채워볼까요?</p>
          <p className="text-[14px] text-[#7A7A7A] leading-relaxed">
            {reportData.character_message ?? "기록이 2일 이하예요. 더 많은 기록을 남기면 맞춤 리포트를 드릴게요!"}
          </p>
        </div>
        <Button variant="outline" onClick={() => setScreen("report-list")} className="rounded-2xl px-8">
          돌아가기
        </Button>
      </div>
    );
  }

  /* ── partial: 간소화 리포트 ── */
  if (reportData?.report_type === "partial") {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pb-12">
        <div className="bg-white border-b border-black/[0.06]">
          <div className="flex items-center gap-1 px-4 pt-12 pb-4">
            <Button variant="ghost" size="icon" onClick={() => setScreen("report-list")} className="shrink-0 text-[#3C3C3C]">
              <ArrowLeft className="size-5" />
            </Button>
            <div className="ms-1">
              <h1 className="text-[18px] font-bold text-[#3C3C3C]">주간 건강 리포트</h1>
              <p className="text-[13px] text-[#7A7A7A] font-medium">{weekLabel}</p>
            </div>
          </div>
        </div>
        <div className="px-5 pt-6 space-y-4">
          <div className="bg-[#FFF9E6] rounded-2xl border border-[#FFF383] p-5 flex items-start gap-3">
            <AlertCircle className="size-5 text-[#8C7010] shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-bold text-[#5C4A00] mb-1">기록을 더 채워보세요</p>
              <p className="text-[13px] text-[#8C7010] leading-relaxed">
                {reportData.character_message ?? "3~4일 기록됐어요. 5일 이상 기록하면 정밀 리포트를 받을 수 있어요!"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-12">
      {/* ── 스크롤 컴팩트 헤더 ── */}
      <ScrollHeader
        title="주간 건강 리포트"
        onBack={() => setScreen("report-list")}
        visible={isScrolled}
      />

      {/* ── 기본 헤더 ── */}
      <div className="bg-white border-b border-black/[0.06]">
        <div className="flex items-center gap-1 px-4 pt-12 pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScreen("report-list")}
            className="shrink-0 text-[#3C3C3C]"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="ms-1">
            <h1 className="text-[18px] font-bold text-[#3C3C3C] leading-snug">주간 건강 리포트</h1>
            <p className="text-[13px] text-[#7A7A7A] font-medium">{weekLabel}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">

        {/* ══════════════════════════
            1. 주간 점수 히어로
        ══════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col items-center">
          {/* 원형 프로그레스 */}
          <div className="relative size-36 flex items-center justify-center mb-4">
            <svg className="size-full -rotate-90 absolute" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="#E8E8E8" strokeWidth="10" />
              <circle
                cx="64" cy="64" r={radius}
                fill="none" stroke="#3E8C28" strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[42px] font-black text-[#3E8C28] leading-none">
                {weeklyScore}
              </span>
              <span className="text-[12px] font-bold text-[#9B9B9B]">/ 100점</span>
            </div>
          </div>

          <h2 className="text-[18px] font-bold text-[#2A2A2A]">
            이번 주 건강 점수 {weeklyScore}점!
          </h2>

          {/* 전주 대비 — API에서 데이터 올 때만 표시 */}
          {reportData?.health_score && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-[#3E8C28]">
                <TrendingUp className="size-4" strokeWidth={2.5} />
              </div>
              <span className="text-[13px] text-[#7A7A7A] font-medium">이번 주 AI 분석 결과예요 📊</span>
            </div>
          )}

          {/* 점수 범례 */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F5F5F5] w-full justify-center">
            {[
              { label: "우수", range: "90↑", bg: "#E8F9D6", color: "#3E8C28" },
              { label: "양호", range: "80↑", bg: "#CBF891", color: "#2A6020" },
              { label: "보통", range: "70↑", bg: "#FFF383", color: "#8C7010" },
              { label: "분발", range: "~69", bg: "#FFB8CA", color: "#C0305A" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: item.bg, border: `1.5px solid ${item.color}` }} />
                <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════
            2. 달성 사항 (API 데이터 있을 때)
        ══════════════════════════ */}
        {reportData?.achievements && reportData.achievements.length > 0 && (
          <div>
            <SectionLabel icon={ThumbsUp} title="이번 주 잘한 점" iconBg="#CBF891" iconColor="#3E8C28" />
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-2">
              {reportData.achievements.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="size-5 rounded-full bg-[#CBF891] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="size-3 text-[#3E8C28]" />
                  </div>
                  <p className="text-[13px] text-[#3C3C3C] leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════
            3. 실패 패턴 분석 (API 데이터 있을 때)
        ══════════════════════════ */}
        {reportData?.failure_patterns && reportData.failure_patterns.length > 0 && (
          <div>
            <SectionLabel icon={AlertCircle} title="실패 패턴 분석" iconBg="#FFB8CA" iconColor="#C0305A" />
            <div className="space-y-2.5">
              {reportData.failure_patterns.map((pattern, i) => (
                <FailurePatternCard key={i} pattern={pattern} />
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════
            4. 미션 달성 현황
        ══════════════════════════ */}
        <div>
          <SectionLabel icon={CheckCircle2} title="미션 달성 현황" iconBg="#CBF891" iconColor="#3E8C28" />

          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
            {/* 연속 달성 배너 */}
            <div className="flex items-center gap-3 bg-[#F0FDF4] rounded-xl px-4 py-3 border border-[#CBF891]">
              <span className="text-[18px]">🔥</span>
              <p className="text-[14px] font-bold text-[#2A6020]">3주 연속 주간 목표 달성 중!</p>
            </div>

            {/* 요일별 활동량 */}
            <div>
              <p className="text-[11px] font-bold text-[#6A6A6A] uppercase tracking-[0.04em] mb-3">
                요일별 활동량
              </p>
              <div className="flex justify-between gap-1.5">
                {weekDayActivity.map(({ day, level }) => {
                  const c = activityColor(level);
                  return (
                    <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                      <div
                        className="w-full h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: c.bg }}
                      >
                        {level === 1 && (
                          <CheckCircle2 className="size-4" style={{ color: c.text }} />
                        )}
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: c.text }}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 챌린지 재설계 제안 — API 데이터 있을 때 표시 */}
            {reportData?.challenge_redesign_suggestions &&
              reportData.challenge_redesign_suggestions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-[#6A6A6A] uppercase tracking-[0.04em]">
                    챌린지 재설계 제안
                  </p>
                  {reportData.challenge_redesign_suggestions.map((s, i) => (
                    <RedesignCard key={i} suggestion={s} />
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* ══════════════════════════
            3. 식단 & 영양 분석
        ══════════════════════════ */}
        <div>
          <SectionLabel icon={TrendingUp} title="주간 식단 & 영양 분석" iconBg="#AEE1F9" iconColor="#2878B0" />

          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-5">
            {/* 영양소 비율 */}
            <div className="flex items-center gap-5">
              {/* 도넛 차트 */}
              <div className="relative size-24 shrink-0">
                <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#FFF383" strokeWidth="4" strokeDasharray="50 50" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#FFB8CA" strokeWidth="4" strokeDasharray="30 70" strokeDashoffset="-50" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#AEE1F9" strokeWidth="4" strokeDasharray="20 80" strokeDashoffset="-80" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[10px] font-bold text-[#6A6A6A]">영양소</p>
                </div>
              </div>

              {/* 범례 */}
              <div className="flex-1 space-y-2.5">
                {[
                  { label: "탄수화물", pct: nutritionAvg.carbs,   goal: 45, bg: "#FFF9D6", color: "#8C7010", dot: "#FFF383" },
                  { label: "단백질",   pct: nutritionAvg.protein, goal: 30, bg: "#FFE4ED", color: "#C0305A", dot: "#FFB8CA" },
                  { label: "지방",     pct: nutritionAvg.fat,     goal: 25, bg: "#D6EEFF", color: "#2878B0", dot: "#AEE1F9" },
                ].map((n) => (
                  <div key={n.label} className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: n.dot }} />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[12px] font-bold" style={{ color: n.color }}>{n.label} {n.pct}%</span>
                        <span className="text-[10px] font-medium text-[#9B9B9B]">권장 {n.goal}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: n.dot }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(n.pct / (n.goal * 1.5)) * 100}%`, backgroundColor: n.color, opacity: 0.7 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-[#F5F5F5]" />

            {/* 자주 먹은 음식 워드 클라우드 */}
            <div>
              <p className="text-[11px] font-bold text-[#6A6A6A] uppercase tracking-[0.04em] mb-3">
                이번 주 자주 먹은 음식
              </p>
              <div className="bg-[#FAFAFA] rounded-xl p-4 flex flex-wrap justify-center items-center gap-x-3 gap-y-2.5">
                {wordCloudData.map((word, i) => (
                  <span
                    key={i}
                    className={cn("font-black", word.size)}
                    style={{ color: word.healthy ? "#3E8C28" : "#C0305A" }}
                  >
                    {word.text}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 justify-center mt-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-[#87D57B]" />
                  <span className="text-[10px] font-medium text-[#7A7A7A]">건강 식품</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-[#F09BB0]" />
                  <span className="text-[10px] font-medium text-[#7A7A7A]">주의 식품</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════
            4. AI 주간 브리핑
        ══════════════════════════ */}
        <div>
          <SectionLabel icon={TargetIcon} title="AI 주간 브리핑" iconBg="#CBF891" iconColor="#3E8C28" />

          <div className="space-y-2.5">
            {/* 잘한 점 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex gap-3.5">
              <div className="size-9 rounded-xl bg-[#E8F9D6] flex items-center justify-center shrink-0">
                <ThumbsUp className="size-4 text-[#3E8C28]" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-[#2A2A2A] mb-1">정말 잘하셨어요!</p>
                <p className="text-[13px] text-[#7A7A7A] leading-relaxed">
                  {aiBriefing.good}
                </p>
              </div>
            </div>

            {/* 아쉬운 점 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex gap-3.5">
              <div className="size-9 rounded-xl bg-[#FFE4ED] flex items-center justify-center shrink-0">
                <AlertCircle className="size-4 text-[#C0305A]" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-[#2A2A2A] mb-1">조금 아쉬워요</p>
                <p className="text-[13px] text-[#7A7A7A] leading-relaxed">
                  {aiBriefing.bad}
                </p>
              </div>
            </div>

            {/* 다음 주 전략 — 배열이면 번호 목록, 없으면 ai_briefing.next_week */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex gap-3.5">
              <div className="size-9 rounded-xl bg-[#AEE1F9] flex items-center justify-center shrink-0 mt-0.5">
                <TargetIcon className="size-4 text-[#2878B0]" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-[#2A2A2A] mb-2">다음 주 전략 제안</p>
                {reportData?.next_week_strategy && reportData.next_week_strategy.length > 0 ? (
                  <div className="space-y-1.5">
                    {reportData.next_week_strategy.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[12px] font-bold text-[#2878B0] shrink-0 mt-0.5">
                          {i + 1}.
                        </span>
                        <p className="text-[13px] text-[#7A7A7A] leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#7A7A7A] leading-relaxed">
                    {aiBriefing.next_week}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 면책 조항 */}
        <p className="text-[11px] text-[#C8C8C8] text-center leading-relaxed pt-2 pb-4">
          본 리포트는 생활 습관 참고용이며, 의학적 진단을 대체하지 않습니다.<br />
          필요 시 반드시 전문 의료진과 상담하시기 바랍니다.
        </p>
      </div>

    </div>
  );
}
