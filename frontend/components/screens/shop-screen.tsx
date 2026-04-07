
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

      {/* Purchase Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>아이템 구매</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
                {getCategoryIcon(selectedItem.category)}
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-semibold text-foreground">
                  {selectedItem.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.description}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 bg-amber-500/10 rounded-xl p-3">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-xl font-bold">{selectedItem.price}P</span>
              </div>

              {userProfile && userProfile.points < selectedItem.price && (
                <p className="text-sm text-destructive text-center">
                  포인트가 부족합니다
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPurchaseModal(false)}
                >
                  취소
                </Button>
                <Button
                  className="flex-1"
                  disabled={
                    !userProfile || userProfile.points < selectedItem.price
                  }
                  onClick={() => handlePurchase(selectedItem)}
                >
                  구매하기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview/Equip Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>아이템 미리보기</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="flex justify-center py-4">
                <Character mood="happy" size="lg" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-semibold text-foreground">
                  {selectedItem.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.description}
                </p>
              </div>

              <Button
                className="w-full"
                variant={selectedItem.equipped ? "outline" : "default"}
                onClick={() => {
                  handleEquip(selectedItem);
                  setShowPreviewModal(false);
                }}
              >
                {selectedItem.equipped ? "장착 해제" : "장착하기"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

