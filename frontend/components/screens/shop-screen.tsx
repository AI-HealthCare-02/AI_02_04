
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Character } from "@/components/character";
import {
  ArrowLeft,
  Coins,
  Check,
  Palette,
  Sparkles,
  Package,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShopItem } from "@/lib/types";
import { BottomNav } from "@/components/ui/navigation-menu";

type Category = "all" | "background" | "accessory" | "special";

const categoryLabels: Record<Category, string> = {
  all: "전체",
  background: "배경",
  accessory: "악세서리",
  special: "특수 아이템",
};

const categoryIcons: Record<Exclude<Category, "all">, React.ElementType> = {
  background: Palette,
  accessory: Sparkles,
  special: Package,
};

export function ShopScreen() {
  const { setScreen, userProfile, shopItems, purchaseItem, equipItem } =
    useAppStore();

  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const filteredItems =
    selectedCategory === "all"
      ? shopItems
      : shopItems.filter((item) => item.category === selectedCategory);

  const handlePurchase = (item: ShopItem) => {
    if (userProfile && userProfile.points >= item.price && !item.owned) {
      purchaseItem(item.id);
      setShowPurchaseModal(false);
    }
  };

  const handleEquip = (item: ShopItem) => {
    if (item.owned) {
      equipItem(item.id);
    }
  };

  const getCategoryIcon = (category: ShopItem["category"]) => {
    const Icon = categoryIcons[category];
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background pb-24">
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setScreen("home")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">상점</h1>
          <p className="text-sm text-muted-foreground">
            포인트로 아이템을 구매하세요
          </p>
        </div>
        <div className="flex items-center gap-1 bg-accent/50 rounded-full px-3 py-1.5">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-sm">
            {userProfile?.points || 0}
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(Object.keys(categoryLabels) as Category[]).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </div>

      {/* Character Preview */}
      <div className="px-4 mb-6">
        <Card className="bg-gradient-to-br from-primary/5 via-card to-accent/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Character mood="happy" size="md" showPlatform={false} />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">미리보기</h3>
                <p className="text-sm text-muted-foreground">
                  아이템을 탭해서 미리보기하세요
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                item.equipped && "ring-2 ring-primary",
                item.owned && "bg-success/5",
              )}
              onClick={() => {
                setSelectedItem(item);
                if (item.owned) {
                  setShowPreviewModal(true);
                } else {
                  setShowPurchaseModal(true);
                }
              }}
            >
              <CardContent className="p-4">
                {/* Item Image Placeholder */}
                <div className="aspect-square bg-muted rounded-xl mb-3 flex items-center justify-center relative">
                  {getCategoryIcon(item.category)}
                  {item.owned && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success-foreground" />
                    </div>
                  )}
                  {item.equipped && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-primary-foreground fill-current" />
                    </div>
                  )}
                </div>

                {/* Item Info */}
                <div className="space-y-1">
                  <h4 className="font-medium text-foreground text-sm truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground capitalize">
                      {categoryLabels[item.category as Category]}
                    </span>
                    {!item.owned && (
                      <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-500" />
                        <span className="text-sm font-semibold">
                          {item.price}
                        </span>
                      </div>
                    )}
                    {item.owned && !item.equipped && (
                      <span className="text-xs text-success font-medium">
                        보유중
                      </span>
                    )}
                    {item.equipped && (
                      <span className="text-xs text-primary font-medium">
                        장착중
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <BottomNav />

      {/* ── 구매 모달 ── */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent showCloseButton={false} className="text-center">
          <DialogTitle className="text-center">아이템 구매</DialogTitle>

          {selectedItem && (
            <>
              {/* 아이템 아이콘 */}
              <div className="size-20 bg-[#F0FDF4] rounded-2xl flex items-center justify-center mx-auto mt-3 mb-1">
                {getCategoryIcon(selectedItem.category)}
              </div>

              {/* 이름 + 설명 */}
              <p className="text-[15px] font-bold text-[#3C3C3C] mt-1">{selectedItem.name}</p>
              <p className="text-[13px] text-[#7A7A7A] leading-normal mt-1">{selectedItem.description}</p>

              {/* 가격 */}
              <div className="flex items-center justify-center gap-2 bg-[#FFF9A0] rounded-2xl px-5 py-3 mt-4">
                <Coins className="size-5 text-[#8C7010]" />
                <span className="text-[20px] font-black text-[#8C7010]">{selectedItem.price.toLocaleString()}</span>
                <span className="text-[14px] font-bold text-[#8C7010]">P</span>
              </div>

              {/* 포인트 부족 경고 */}
              {userProfile && userProfile.points < selectedItem.price && (
                <p className="text-[12px] font-semibold text-[#E53E3E] mt-2">
                  포인트가 부족합니다 (보유: {userProfile.points.toLocaleString()}P)
                </p>
              )}

              {/* 버튼 */}
              <div className="flex gap-3 mt-5">
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-[14px] font-bold rounded-2xl"
                  onClick={() => setShowPurchaseModal(false)}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 h-12 text-[14px] font-bold rounded-2xl"
                  disabled={!userProfile || userProfile.points < selectedItem.price}
                  onClick={() => handlePurchase(selectedItem)}
                >
                  구매하기
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 아이템 미리보기 / 장착 모달 ── */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="text-center">
          <DialogTitle className="text-center">아이템 미리보기</DialogTitle>

          {selectedItem && (
            <>
              {/* 캐릭터 프리뷰 */}
              <div className="flex justify-center py-4">
                <Character mood="happy" size="lg" />
              </div>

              {/* 이름 + 설명 */}
              <p className="text-[15px] font-bold text-[#3C3C3C]">{selectedItem.name}</p>
              <p className="text-[13px] text-[#7A7A7A] leading-normal mt-1">{selectedItem.description}</p>

              {/* 버튼 */}
              <Button
                className="w-full h-12 text-[14px] font-bold rounded-2xl mt-5"
                variant={selectedItem.equipped ? "outline" : "default"}
                onClick={() => { handleEquip(selectedItem); setShowPreviewModal(false); }}
              >
                {selectedItem.equipped ? "장착 해제" : "장착하기"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

