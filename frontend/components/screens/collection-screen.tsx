import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollHeader } from "@/components/ui/scroll-header";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Character } from "@/components/character";
import {
  ArrowLeft,
  Star,
  Calendar,
  Award,
  Zap,
  Sparkles,
  Rocket,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GraduatedCharacter } from "@/lib/types";
import { BottomNav } from "@/components/ui/navigation-menu";

export function CollectionScreen() {
  const { setScreen, character, graduatedCharacters, graduateCharacter } =
    useAppStore();

  const [selectedCharacter, setSelectedCharacter] =
    useState<GraduatedCharacter | null>(null);
  const [showGraduationModal, setShowGraduationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const canGraduate = character?.level === 5;
  const isScrolled = useScrollHeader();

  const handleGraduate = () => {
    graduateCharacter();
    setShowGraduationModal(false);
    setScreen("character-birth");
  };

  return (
    <div className="min-h-screen bg-[#F9FFEF] pb-28">
      {/* ── 스크롤 시 나타나는 컴팩트 헤더 ── */}
      <ScrollHeader
        title="추억 보관함"
        onBack={() => setScreen("home")}
        visible={isScrolled}
      />

      {/* ── 기본 헤더 (default) ── */}
      <div className="bg-white border-b border-black/[0.06]">
        <div className="flex items-center gap-1 px-4 pt-12 pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScreen("home")}
            className="shrink-0 text-[#3C3C3C]"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="ms-1 flex-1">
            <h1 className="text-[18px] font-bold text-[#3C3C3C] leading-snug">
              추억 보관함
            </h1>
            <p className="text-[13px] text-[#7A7A7A] font-medium">
              별나라로 떠난 친구들
            </p>
          </div>
          {/* 졸업 수 뱃지 */}
          <div className="flex items-center gap-1 bg-[#FFF383] rounded-full px-3 py-1.5">
            <Star className="size-3.5 text-[#8C7010] fill-current" />
            <span className="text-[13px] font-bold text-[#8C7010]">
              {graduatedCharacters.length}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* ── 현재 캐릭터 카드 ── */}
        {character && (
          <div className="bg-white rounded-3xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-5">
              <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em] mb-4">
                현재 캐릭터
              </p>
              <div className="flex items-center gap-4">
                <Character
                  mood={character.mood}
                  level={character.level}
                  size="md"
                  showPlatform={false}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[16px] font-bold text-[#3C3C3C]">
                      {character.name}
                    </h3>
                    <span className="text-[11px] font-bold bg-[#CBF891] text-[#3E8C28] px-2 py-0.5 rounded-full">
                      현재
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-[#7A7A7A]">
                      <Trophy className="size-3.5 text-[#8C7010]" />
                      Lv.{character.level}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-[#7A7A7A]">
                      <Calendar className="size-3.5 text-[#2878B0]" />
                      {Math.floor(
                        (Date.now() - new Date(character.createdAt).getTime()) /
                          (1000 * 60 * 60 * 24),
                      )}
                      일째
                    </span>
                  </div>
                </div>
                {canGraduate && (
                  <Button
                    size="sm"
                    className="h-9 px-3.5 rounded-xl text-[13px] font-bold bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 border-0 shadow-sm"
                    onClick={() => setShowGraduationModal(true)}
                  >
                    <Rocket className="size-3.5 mr-1" />
                    졸업
                  </Button>
                )}
              </div>
            </div>

            {/* 졸업 가능 배너 */}
            {canGraduate && (
              <div className="mx-5 mb-5 px-4 py-3 bg-[#FFF9D6] rounded-2xl border border-[#FFF383]">
                <p className="text-[12px] font-bold text-[#8C6010] text-center">
                  🎉 축하해요! {character.name}이(가) 별나라로 떠날 준비가
                  됐어요!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── 별나라의 친구들 ── */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Star className="size-4 text-[#8C7010] fill-[#FFF383]" />
            <p className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
              별나라의 친구들
            </p>
          </div>

          {graduatedCharacters.length === 0 ? (
            /* 비어있을 때 */
            <div className="bg-white rounded-3xl border border-black/[0.06] p-10 flex flex-col items-center text-center gap-3">
              <div className="size-16 rounded-2xl bg-[#FFF9D6] flex items-center justify-center">
                <Star className="size-8 text-[#D97706]" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#3C3C3C] mb-1">
                  아직 졸업한 친구가 없어요
                </p>
                <p className="text-[13px] text-[#7A7A7A] leading-relaxed">
                  캐릭터를 레벨 5까지 키워서
                  <br />
                  별나라로 보내보세요!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {graduatedCharacters.map((char) => (
                <button
                  key={char.id}
                  className="bg-white rounded-3xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-4 flex flex-col items-center text-center hover:bg-[#F9FFEF] hover:border-[#CBF891] transition-all active:scale-[0.98]"
                  onClick={() => {
                    setSelectedCharacter(char);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="relative mb-3">
                    <Character
                      mood="happy"
                      level={5}
                      size="sm"
                      showPlatform={false}
                    />
                    <div className="absolute -top-1 -right-1 size-6 bg-[#FFC107] rounded-full flex items-center justify-center shadow-sm">
                      <Star className="size-3 text-white fill-current" />
                    </div>
                  </div>
                  <p className="text-[14px] font-bold text-[#3C3C3C]">
                    {char.name}
                  </p>
                  <p className="text-[11px] font-medium text-[#9B9B9B] mt-0.5">
                    {char.totalDays}일 함께함
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold bg-[#CBF891] text-[#3E8C28] px-2 py-0.5 rounded-full">
                      Lv.5
                    </span>
                    <span className="text-[10px] font-bold bg-[#FFF383] text-[#8C7010] px-2 py-0.5 rounded-full">
                      {char.finalStats.totalExp}XP
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* ── 졸업 모달 ── */}
      <Dialog open={showGraduationModal} onOpenChange={setShowGraduationModal}>
        <DialogContent showCloseButton={false}>
          {/* 반짝임 헤더 */}
          <div className="size-14 rounded-full bg-[#FFF383] flex items-center justify-center mx-auto mb-1">
            <Sparkles className="size-7 text-[#D97706]" strokeWidth={2} />
          </div>

          <DialogTitle className="text-center">별나라 졸업식 🌟</DialogTitle>
          <p className="text-[13px] text-[#7A7A7A] leading-normal text-center mt-1">
            함께 한 시간 동안 정말 고마웠어요.
            <br />
            이제 별나라에서 행복하게 지낼 거예요!
          </p>

          {/* 캐릭터 */}
          <div className="flex justify-center py-2">
            <Character mood="happy" level={5} size="lg" />
          </div>

          {/* 이름 */}
          <p className="text-[16px] font-black text-[#3C3C3C] text-center">
            {character?.name}이(가) 졸업해요!
          </p>

          {/* 버튼 */}
          <div className="flex gap-3 mt-5">
            <Button
              variant="outline"
              className="flex-1 h-12 text-[14px] font-bold rounded-2xl"
              onClick={() => setShowGraduationModal(false)}
            >
              조금 더 함께하기
            </Button>
            <Button
              className="flex-1 h-12 text-[14px] font-bold rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 border-0"
              onClick={handleGraduate}
            >
              <Rocket className="size-4 me-1.5" />
              졸업시키기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 추억 카드 모달 ── */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent showCloseButton={false}>
          {/* 별 헤더 */}
          <div className="size-14 rounded-full bg-[#FFF383] flex items-center justify-center mx-auto mb-1">
            <Star
              className="size-7 text-[#D97706] fill-[#D97706]"
              strokeWidth={1.5}
            />
          </div>

          <DialogTitle className="text-center">추억 카드</DialogTitle>

          {selectedCharacter && (
            <>
              {/* 캐릭터 */}
              <div className="flex justify-center py-1">
                <Character mood="happy" level={5} size="lg" />
              </div>

              {/* 이름 + 기간 */}
              <p className="text-[18px] font-black text-[#3C3C3C] text-center flex items-center justify-center gap-1.5">
                <Star className="size-4 text-[#FFC107] fill-[#FFC107]" />
                {selectedCharacter.name}
                <Star className="size-4 text-[#FFC107] fill-[#FFC107]" />
              </p>
              <p className="text-[12px] text-[#9B9B9B] text-center mt-0.5">
                {new Date(selectedCharacter.startDate).toLocaleDateString(
                  "ko-KR",
                )}{" "}
                ~{" "}
                {new Date(selectedCharacter.endDate).toLocaleDateString(
                  "ko-KR",
                )}
              </p>

              {/* 스탯 3개 */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="flex flex-col items-center gap-1 py-3.5 bg-[#CBF891] rounded-2xl">
                  <Calendar className="size-5 text-[#3E8C28]" />
                  <p className="text-[17px] font-black text-[#1A2E1C] leading-none">
                    {selectedCharacter.totalDays}
                  </p>
                  <p className="text-[10px] font-bold text-[#3E8C28]">
                    함께한 날
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1 py-3.5 bg-[#AEE1F9] rounded-2xl">
                  <Award className="size-5 text-[#2878B0]" />
                  <p className="text-[17px] font-black text-[#0D2E50] leading-none">
                    {selectedCharacter.finalStats.totalMissions}
                  </p>
                  <p className="text-[10px] font-bold text-[#2878B0]">
                    완료 미션
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1 py-3.5 bg-[#EEF2FF] rounded-2xl">
                  <Zap className="size-5 text-[#6366F1]" />
                  <p className="text-[17px] font-black text-[#3C2A00] leading-none">
                    {selectedCharacter.finalStats.totalExp}
                  </p>
                  <p className="text-[10px] font-bold text-[#6366F1]">
                    획득 경험치
                  </p>
                </div>
              </div>

              <Button
                className="w-full h-12 text-[14px] font-bold rounded-2xl mt-5"
                onClick={() => setShowDetailModal(false)}
              >
                닫기
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
