'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CharacterEgg } from '@/components/character';
import { Activity, Heart, Smartphone, Bell, ChevronRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const permissions = [
  {
    id: 'health',
    icon: Heart,
    title: '건강 데이터',
    description: '걸음 수, 운동량 등 건강 데이터를 연동합니다',
    required: true
  },
  {
    id: 'activity',
    icon: Activity,
    title: '활동 추적',
    description: '일일 활동량을 자동으로 추적합니다',
    required: true
  },
  {
    id: 'notifications',
    icon: Bell,
    title: '알림',
    description: '미션 알림과 캐릭터 상태를 알려드립니다',
    required: false
  },
  {
    id: 'camera',
    icon: Smartphone,
    title: '카메라',
    description: '식단 사진 촬영을 위해 필요합니다',
    required: false
  }
];

export function PermissionsScreen() {
  const { setScreen } = useAppStore();
  const [granted, setGranted] = useState<Record<string, boolean>>({
    health: false,
    activity: false,
    notifications: false,
    camera: false
  });

  const requiredGranted = permissions
    .filter((p) => p.required)
    .every((p) => granted[p.id]);

  const handleToggle = (id: string) => {
    setGranted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContinue = () => {
    setScreen('character-birth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0 space-y-4">
        <div className="flex justify-center">
          <CharacterEgg size="md" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            권한을 허용해주세요
          </h1>
          <p className="text-muted-foreground">
            최적의 건강 관리를 위해 다음 권한이 필요합니다
          </p>
        </div>
      </div>

      {/* Permissions List */}
      <div className="flex-1 p-6 space-y-3 overflow-auto">
        {permissions.map((permission) => {
          const Icon = permission.icon;
          const isGranted = granted[permission.id];
          
          return (
            <Card 
              key={permission.id}
              className={cn(
                'transition-all',
                isGranted && 'ring-2 ring-primary/50'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                    isGranted ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    <Icon className={cn(
                      'w-6 h-6 transition-colors',
                      isGranted ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {permission.title}
                      </span>
                      {permission.required && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          필수
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {permission.description}
                    </p>
                  </div>
                  
                  <Switch
                    checked={isGranted}
                    onCheckedChange={() => handleToggle(permission.id)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Privacy Notice */}
      <div className="px-6 pb-4">
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
          <Shield className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            수집된 데이터는 건강 관리 목적으로만 사용되며, 
            암호화되어 안전하게 보관됩니다.
          </p>
        </div>
      </div>

      {/* Continue Button */}
      <div className="p-6 pt-0">
        <Button 
          onClick={handleContinue}
          disabled={!requiredGranted}
          className="w-full h-14 text-lg"
        >
          {requiredGranted ? '캐릭터 만나러 가기' : '필수 권한을 허용해주세요'}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
