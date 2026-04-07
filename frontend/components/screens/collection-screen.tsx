import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Character } from "@/components/character";
import {
  ArrowLeft,
  Star,
  Calendar,
  Footprints,
  Award,
  Coins,
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

  const handleGraduate = () => {
    graduateCharacter();
    setShowGraduationModal(false);
    // After graduation, user would need to create a new character
    setScreen("character-birth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background pb-24">
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setScreen("home")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">추억 보관함</h1>
          <p className="text-sm text-muted-foreground">별나라로 떠난 친구들</p>
        </div>
        <div className="flex items-center gap-1 bg-primary/10 rounded-full px-3 py-1.5">
          <Star className="w-4 h-4 text-primary fill-current" />
          <span className="font-semibold text-sm">
            {graduatedCharacters.length}
          </span>
        </div>
      </div>

      {/* Current Character Card */}
      {character && (
        <div className="px-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 via-card to-accent/10 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Character
                  mood={character.mood}
                  level={character.level}
                  size="md"
                  showPlatform={false}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">
                      {character.name}
                    </h3>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      현재
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Lv.{character.level}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {Math.floor(
                        (Date.now() - character.createdAt.getTime()) /
                          (1000 * 60 * 60 * 24),
                      )}
                      일째
                    </span>
                  </div>
                </div>

                {canGraduate && (
                  <Button
                    size="sm"
                    onClick={() => setShowGraduationModal(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Rocket className="w-4 h-4 mr-1" />
                    졸업
                  </Button>
                )}
              </div>

              {canGraduate && (
                <div className="mt-3 p-2 bg-amber-500/10 rounded-lg">
                  <p className="text-xs text-amber-700 text-center">
                    축하해요! {character.name}이(가) 별나라로 떠날 준비가
                    됐어요!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graduated Characters */}
      <div className="px-4">
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          별나라의 친구들
        </h2>

        {graduatedCharacters.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Star className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2">
                아직 졸업한 친구가 없어요
              </h3>
              <p className="text-sm text-muted-foreground">
                캐릭터를 레벨 5까지 키워서
                <br />
                별나라로 보내보세요!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {graduatedCharacters.map((char) => (
              <Card
                key={char.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedCharacter(char);
                  setShowDetailModal(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="relative mb-3">
                    <Character
                      mood="happy"
                      level={5}
                      size="sm"
                      showPlatform={false}
                    />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white fill-current" />
                    </div>
                  </div>
                  <h4 className="font-medium text-foreground text-sm">
                    {char.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {char.totalDays}일 함께함
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {/* Graduation Modal */}
      <Dialog open={showGraduationModal} onOpenChange={setShowGraduationModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">별나라 졸업식</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative flex justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent rounded-full blur-2xl" />
              <Character mood="happy" level={5} size="lg" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {character?.name}이(가) 졸업해요!
              </h3>
              <p className="text-sm text-muted-foreground">
                함께 한 시간 동안 정말 고마웠어요.
                <br />
                이제 별나라에서 행복하게 지낼 거예요!
              </p>
            </div>

            <div className="flex items-center justify-center gap-1 text-amber-500">
              <Sparkles className="w-5 h-5" />
              <Sparkles className="w-4 h-4" />
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="flex items-center">
              {/* <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowGraduationModal(false)}
              >
                조금 더 함께하기
              </Button> */}
              <Button
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={handleGraduate}
              >
                <Rocket className="w-4 h-4 mr-1" />
                졸업시키기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Character Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">추억 카드</DialogTitle>
          </DialogHeader>

          {selectedCharacter && (
            <div className="space-y-4 py-4">
              <div className="relative flex justify-center">
                <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-2xl" />
                <Character mood="happy" level={5} size="lg" />
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-current" />
                  {selectedCharacter.name}
                  <Star className="w-5 h-5 text-amber-500 fill-current" />
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(selectedCharacter.startDate).toLocaleDateString(
                    "ko-KR",
                  )}{" "}
                  ~
                  {new Date(selectedCharacter.endDate).toLocaleDateString(
                    "ko-KR",
                  )}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 bg-primary/10 rounded-xl">
                  <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold text-foreground">
                    {selectedCharacter.totalDays}
                  </div>
                  <div className="text-xs text-muted-foreground">함께한 날</div>
                </div>
                <div className="text-center p-3 bg-success/10 rounded-xl">
                  <Award className="w-5 h-5 text-success mx-auto mb-1" />
                  <div className="text-lg font-bold text-foreground">
                    {selectedCharacter.finalStats.totalMissions}
                  </div>
                  <div className="text-xs text-muted-foreground">완료 미션</div>
                </div>
                <div className="text-center p-3 bg-amber-500/10 rounded-xl">
                  <Coins className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-foreground">
                    {selectedCharacter.finalStats.totalPoints}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    획득 포인트
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setShowDetailModal(false)}
              >
                닫기
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
