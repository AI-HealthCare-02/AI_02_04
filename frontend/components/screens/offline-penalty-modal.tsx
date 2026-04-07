'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Character } from '@/components/character';
import { Heart, HeartCrack } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface OfflinePenaltyModalProps {
  open: boolean;
  onClose: () => void;
}

export function OfflinePenaltyModal({ open, onClose }: OfflinePenaltyModalProps) {
  const { character, updateCharacterMood } = useAppStore();

  const handleHeal = () => {
    updateCharacterMood('normal');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <HeartCrack className="w-5 h-5 text-destructive" />
            오랜만이에요...
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 space-y-4">
          {/* Sad/Sick Character */}
          <Character 
            mood={character?.mood === 'sick' ? 'sick' : 'sad'} 
            level={character?.level} 
            size="lg" 
          />

          <div className="text-center space-y-2">
            <p className="text-foreground font-medium">
              {character?.name}이(가) 많이 외로워했어요
            </p>
            <p className="text-sm text-muted-foreground">
              오늘 미션을 수행하면 기분이 나아질 거예요!
            </p>
          </div>

          <Button onClick={handleHeal} className="w-full">
            <Heart className="w-4 h-4 mr-2 fill-current" />
            힘내자!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
