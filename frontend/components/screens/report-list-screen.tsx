
import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 테스트를 위한 가상의 리포트 데이터 (약 6개월치 = 25주)
const generateMockReports = () => {
  const reports = [];
  const today = new Date();
  for (let i = 0; i < 25; i++) {
    const reportDate = new Date(today);
    reportDate.setDate(today.getDate() - i * 7);

    reports.push({
      id: `report-${i}`,
      title: i === 0 ? "이번 주 건강 리포트" : `${i}주 전 건강 리포트`,
      date: reportDate,
      score: Math.floor(Math.random() * 30 + 70), // 70~100점 사이
      summary: "지난주보다 걷기 미션 달성률이 높아졌어요!",
    });
  }
  return reports;
};

const mockReports = generateMockReports();

export function ReportListScreen() {
  const { setScreen } = useAppStore();

  // 현재 보고 있는 '월' 기준 상태 (최초 접속 시 이번 달)
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 이전 달로 이동
  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  // 다음 달로 이동
  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  // 선택된 달에 해당하는 리포트만 필터링하고 최신순으로 정렬
  const filteredReports = useMemo(() => {
    return mockReports
      .filter(
        (report) =>
          report.date.getFullYear() === currentMonth.getFullYear() &&
          report.date.getMonth() === currentMonth.getMonth(),
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [currentMonth]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background pb-8 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => setScreen("mypage")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            주간 건강 리포트
          </h1>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-auto">
        {/* ✨ 월간 네비게이터 */}
        <div className="flex items-center justify-between bg-card p-3 rounded-2xl shadow-sm border border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="rounded-xl"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Button>

          <div className="font-bold text-lg text-foreground flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="rounded-xl"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>

        {/* Report List Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-sm font-semibold text-foreground">
              발행된 리포트
            </h2>
            <span className="text-xs text-muted-foreground">
              총 {filteredReports.length}건
            </span>
          </div>

          {filteredReports.length > 0 ? (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <Card
                  key={report.id}
                  className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer shadow-sm"
                  onClick={() => setScreen("report")}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center p-4 gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {report.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.date.toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={cn(
                            "text-base font-bold",
                            report.score >= 90
                              ? "text-success"
                              : report.score >= 80
                                ? "text-primary"
                                : "text-amber-500",
                          )}
                        >
                          {report.score}점
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-md">
                          상세보기
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-card rounded-2xl border border-dashed border-border/60">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                해당 월에 발행된 주간 리포트가 없습니다.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
