import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   ConfirmDialog — confirm() 대체 컴포넌트
   yes/no 확인이 필요한 모든 팝업에서 사용
───────────────────────────────────────────────────────────── */
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive" | "outline";
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  icon: Icon,
  iconBg = "#F0FDF4",
  iconColor = "#3E8C28",
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  confirmVariant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="text-center">
        {/* 아이콘 (선택) */}
        {Icon && (
          <div
            className="size-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: iconBg }}
          >
            <Icon className="size-7" style={{ color: iconColor }} strokeWidth={2} />
          </div>
        )}

        <DialogTitle className="text-center">{title}</DialogTitle>

        {description && (
          <DialogDescription className="text-center mt-2">
            {description}
          </DialogDescription>
        )}

        {/* 버튼 행 */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 h-12 text-[14px] font-bold rounded-2xl"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            className={cn(
              "flex-1 h-12 text-[14px] font-bold rounded-2xl",
              confirmVariant === "destructive" &&
                "bg-[#E53E3E] hover:bg-[#C53030] text-white",
            )}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   AlertModal — alert() 대체 컴포넌트
   단순 알림 팝업 (버튼 1개)
───────────────────────────────────────────────────────────── */
interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  title: string;
  description?: string;
  confirmLabel?: string;
}

export function AlertModal({
  open,
  onOpenChange,
  icon: Icon,
  iconBg = "#F0FDF4",
  iconColor = "#3E8C28",
  title,
  description,
  confirmLabel = "확인",
}: AlertModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="text-center">
        {Icon && (
          <div
            className="size-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: iconBg }}
          >
            <Icon className="size-7" style={{ color: iconColor }} strokeWidth={2} />
          </div>
        )}

        <DialogTitle className="text-center">{title}</DialogTitle>

        {description && (
          <DialogDescription className="text-center mt-2">
            {description}
          </DialogDescription>
        )}

        <Button
          className="w-full h-12 text-[14px] font-bold rounded-2xl mt-6"
          onClick={() => onOpenChange(false)}
        >
          {confirmLabel}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
