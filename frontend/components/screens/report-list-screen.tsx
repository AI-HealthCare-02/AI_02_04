
import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { fetchWeeklyReport } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollHeader } from "@/components/ui/scroll-header";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import {
  ArrowLeft,
  FileText,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 시드 기반 결정론적 점수 — Math.random() 제거로 새로고침마다 바뀌는 문제 해결
const FIXED_SCORES = [82, 78, 85, 73, 90, 76, 88, 81, 74, 79, 83, 77, 86, 71, 80, 75, 84, 88, 72, 90, 78, 85, 76, 82, 79];
const FIXED_DIFFS  = [ 3, -2,  0,  4, -1,  2, -3,  1,  0,  2, -1,  3, -2,  1,  0,  4, -1, -3,  2,  1, -2,  3,  0, -1,  2];

const generateBaseReports = () => {
  const today = new Date();
  return Array.from({ length: 25 }, (_, i) => {
    const reportDate = new Date(today);
    reportDate.setDate(today.getDate() - i * 7);
    return {
      id: `report-${i}`,
      title: i === 0 ? "이번 주 건강 리포트" : `${i}주 전 건강 리포트`,
      date: reportDate,
      score: FIXED_SCORES[i] ?? 80,
      diff:  FIXED_DIFFS[i]  ?? 0,
    };
  });
};

// 점수별 색상 팔레트
const getScoreStyle = (score: number) => {
  if (score >= 90) return { bg: "#E8F9D6", color: "#3E8C28", label: "우수" };
  if (score >= 80) return { bg: "#CBF891", color: "#2A6020", label: "양호" };
  if (score >= 70) return { bg: "#FFF383", color: "#8C7010", label: "보통" };
  return { bg: "#FFB8CA", color: "#C0305A", label: "분발" };
};

export function ReportListScreen() {
  const { setScreen } = useAppStore();
  const isScrolled = useScrollHeader();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 리포트 목록 — 결정론적 mock을 즉시 표시, 현재 주 점수는 API 응답 시 조용히 보정
  const [reports, setReports] = useState(generateBaseReports);

  useEffect(() => {
    fetchWeeklyReport()
      .then((data) => {
        if (data.health_score != null) {
          // 현재 주(index=0) 점수를 실제 API 값으로 교체
          setReports((prev) => {
            const next = [...prev];
            next[0] = {
              ...next[0],
              score: data.health_score!,
              // 전주 대비: 이번 주 실점수 - 1주 전 고정 점수
              diff: data.health_score! - (FIXED_SCORES[1] ?? 80),
            };
            return next;
          });
        }
      })
      .catch(() => { /* API 실패 시 결정론적 mock 유지 */ });
  }, []);

  const handlePrevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const filteredReports = useMemo(() =>
    reports
      .filter(
        (r) =>
          r.date.getFullYear() === currentMonth.getFullYear() &&
          r.date.getMonth() === currentMonth.getMonth(),
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [currentMonth],
  );

  // 이번 달 평균 점수
  const avgScore =
    filteredReports.length > 0
      ? Math.round(filteredReports.reduce((s, r) => s + r.score, 0) / filteredReports.length)
      : null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-10">
      {/* ── 스크롤 컴팩트 헤더 ── */}
      <ScrollHeader
        title="주간 건강 리포트"
        onBack={() => setScreen("mypage")}
        visible={isScrolled}
      />

      {/* ── 기본 헤더 ── */}
      <div className="bg-white border-b border-black/[0.06]">
        <div className="flex items-center gap-1 px-4 pt-12 pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScreen("mypage")}
            className="shrink-0 text-[#3C3C3C]"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="ms-1">
            <h1 className="text-[18px] font-bold text-[#3C3C3C] leading-snug">주간 건강 리포트</h1>
            <p className="text-[13px] text-[#7A7A7A] font-medium">AI 분석 리포트 열람</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">

        {/* ── 월 네비게이터 ── */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-between px-2 py-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="text-[#9B9B9B] hover:text-[#3C3C3C]"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div className="flex flex-col items-center">
            <p className="text-[17px] font-bold text-[#2A2A2A]">
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </p>
            {avgScore !== null && (
              <p className="text-[11px] font-medium text-[#9B9B9B]">
                이번 달 평균{" "}
                <span className="font-bold" style={{ color: getScoreStyle(avgScore).color }}>
                  {avgScore}점
                </span>
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="text-[#9B9B9B] hover:text-[#3C3C3C]"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>

        {/* ── 리포트 목록 ── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
              발행된 리포트
            </p>
            <span className="text-[12px] font-medium text-[#9B9B9B]">
              총 {filteredReports.length}건
            </span>
          </div>

          {filteredReports.length > 0 ? (
            <div className="space-y-2.5">
              {filteredReports.map((report) => {
                const style = getScoreStyle(report.score);
                const isFirst = report.id === filteredReports[0].id;

                return (
                  <button
                    key={report.id}
                    className={cn(
                      "w-full bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-4 flex items-center gap-3.5 text-left hover:bg-[#F9FFEF] transition-colors",
                      isFirst && "border border-[#CBF891]",
                    )}
                    onClick={() => setScreen("report")}
                  >
                    {/* 아이콘 */}
                    <div
                      className="size-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: style.bg }}
                    >
                      <FileText className="size-5" style={{ color: style.color }} />
                    </div>

                    {/* 텍스트 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[15px] font-bold text-[#2A2A2A] truncate">
                          {report.title}
                        </p>
                        {isFirst && (
                          <span className="shrink-0 text-[10px] font-bold bg-[#CBF891] text-[#3E8C28] px-2 py-0.5 rounded-full">
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] font-medium text-[#9B9B9B]">
                        {report.date.toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* 점수 */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-[22px] font-black leading-none" style={{ color: style.color }}>
                        {report.score}
                        <span className="text-[11px] font-medium ms-0.5">점</span>
                      </p>
                      {/* 전주 대비 */}
                      <div
                        className={cn(
                          "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          report.diff > 0
                            ? "bg-[#E8F9D6] text-[#3E8C28]"
                            : report.diff < 0
                              ? "bg-[#FFE4ED] text-[#C0305A]"
                              : "bg-[#F5F5F5] text-[#9B9B9B]",
                        )}
                      >
                        {report.diff > 0 ? (
                          <TrendingUp className="size-2.5" strokeWidth={2.5} />
                        ) : report.diff < 0 ? (
                          <TrendingDown className="size-2.5" strokeWidth={2.5} />
                        ) : (
                          <Minus className="size-2.5" strokeWidth={2.5} />
                        )}
                        {report.diff > 0 ? `+${report.diff}` : report.diff}점
                      </div>
                    </div>

                    <ChevronRight className="size-4 text-[#C8C8C8] shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : (
            /* 빈 상태 */
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] py-16 flex flex-col items-center text-center gap-3">
              <div className="size-14 rounded-2xl bg-[#F5F5F5] flex items-center justify-center">
                <FileText className="size-7 text-[#C8C8C8]" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#3C3C3C] mb-1">
                  아직 리포트가 없어요
                </p>
                <p className="text-[13px] text-[#9B9B9B] font-medium leading-relaxed">
                  미션을 달성하면 매주 AI 리포트가<br />자동으로 발행돼요!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
