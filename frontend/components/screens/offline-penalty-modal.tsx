import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Character } from "@/components/character";
import { Heart, HeartCrack } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface OfflinePenaltyModalProps {
  open: boolean;
  onClose: () => void;
}

export function OfflinePenaltyModal({ open, onClose }: OfflinePenaltyModalProps) {
  const { character, updateCharacterMood } = useAppStore();

  const handleHeal = () => {
    updateCharacterMood("normal");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="text-center">

        {/* 아이콘 헤더 */}
        <div className="size-14 rounded-full bg-[#FFB8CA] flex items-center justify-center mx-auto mb-1">
          <HeartCrack className="size-7 text-[#C0305A]" strokeWidth={2} />
        </div>

        {/* 제목 */}
        <DialogTitle className="text-center">오랜만이에요...</DialogTitle>

        {/* 캐릭터 */}
        <div className="flex justify-center py-4">
          <Character
            mood={character?.mood === "sick" ? "sick" : "sad"}
            level={character?.level}
            size="lg"
          />
        </div>

        {/* 메시지 */}
        <div className="space-y-1.5 mb-2">
          <p className="text-[14px] font-bold text-[#3C3C3C]">
            {character?.name}이(가) 많이 외로워했어요
          </p>
          <p className="text-[13px] text-[#7A7A7A] leading-normal">
            오늘 미션을 수행하면 기분이 나아질 거예요!
          </p>
        </div>

        {/* 버튼 */}
        <Button
          className="w-full h-12 text-[15px] font-bold rounded-2xl mt-4"
          onClick={handleHeal}
        >
          <Heart className="size-4 me-2 fill-current" />
          힘내자!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
