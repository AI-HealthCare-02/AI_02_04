import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollHeaderProps {
  /** 컴팩트 헤더에 표시할 제목 */
  title: string;
  /** 뒤로가기 클릭 핸들러 */
  onBack: () => void;
  /** true = 화면에 표시, false = 위로 숨김 */
  visible: boolean;
}

/**
 * 스크롤 시 나타나는 고정 컴팩트 헤더.
 * - 높이 50px, 흰 배경, 하단 border
 * - 뒤로가기 아이콘 + h1 타이틀만 표시
 * - visible prop으로 슬라이드 인/아웃 애니메이션 제어
 */
export function ScrollHeader({ title, onBack, visible }: ScrollHeaderProps) {
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-200 ease-out",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
    >
      {/* max-w-md 로 앱 컨테이너 너비에 맞춤 */}
      <div className="max-w-md mx-auto h-[50px] bg-white border-b border-black/[0.08] flex items-center px-3 gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0 text-[#3C3C3C]"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-[16px] font-bold text-[#3C3C3C] truncate">
          {title}
        </h1>
      </div>
    </div>
  );
}
