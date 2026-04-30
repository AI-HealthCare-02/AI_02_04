'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Character } from '@/components/character';
import { getRandomEggSrc } from '@/lib/character-images';
import { Sparkles, Heart, Star, Egg } from 'lucide-react';
import { cn } from '@/lib/utils';

type BirthStage = 'egg' | 'hatching' | 'born' | 'named';

const STAGES: { key: BirthStage; label: string }[] = [
  { key: 'egg',      label: '알 발견' },
  { key: 'hatching', label: '부화 중' },
  { key: 'born',     label: '탄생'    },
  { key: 'named',    label: '완료'    },
];

const STAGE_INDEX: Record<BirthStage, number> = {
  egg: 0, hatching: 1, born: 2, named: 3,
};

const PARTICLES = [...Array(24)].map((_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top:  `${(i * 53 + 7)  % 100}%`,
  delay: `${(i * 0.07).toFixed(2)}s`,
  color: i % 3 === 0 ? '#FFF383' : i % 3 === 1 ? '#CBF891' : '#AEE1F9',
}));

export function CharacterBirthScreen() {
  const { setScreen, setCharacter, userProfile } = useAppStore();
  const [stage, setStage] = useState<BirthStage>('egg');
  const [characterName, setCharacterName] = useState('');
  const [showSparkles, setShowSparkles] = useState(false);

  const eggSrc = useMemo(() => getRandomEggSrc(), []);
  const currentIdx = STAGE_INDEX[stage];

  const handleTapEgg = () => {
    if (stage !== 'egg') return;
    setStage('hatching');
    setTimeout(() => {
      setShowSparkles(true);
      setTimeout(() => setStage('born'), 600);
    }, 1500);
  };

  const handleNameSubmit = () => {
    if (!characterName.trim()) return;
    setCharacter({
      id: crypto.randomUUID(),
      name: characterName,
      level: 1,
      mood: 'happy',
      experience: 0,
      experienceToNextLevel: 800,
      createdAt: new Date(),
    });
    setStage('named');
    setTimeout(() => setScreen('home'), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F9FFEF] flex flex-col items-center px-6 pt-14 pb-10 relative overflow-hidden">

      {/* ── 배경 파티클 ── */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none">
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute size-2 rounded-full animate-ping"
              style={{
                left: p.left, top: p.top,
                animationDelay: p.delay,
                backgroundColor: p.color,
                opacity: 0.75,
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* ── 단계 인디케이터 ── */}
        <div className="w-full bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-5 py-3.5 flex items-center justify-between">
          {STAGES.map((s, idx) => {
            const isDone    = idx < currentIdx;
            const isActive  = idx === currentIdx;
            return (
              <div key={s.key} className="flex items-center gap-2">
                {/* 연결선 */}
                {idx > 0 && (
                  <div className={cn(
                    'w-6 h-0.5 rounded-full transition-colors duration-500',
                    isDone ? 'bg-[#87D57B]' : 'bg-[#E8E8E8]',
                  )} />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'size-6 rounded-full flex items-center justify-center transition-all duration-300',
                    isActive  ? 'bg-[#87D57B]' : isDone ? 'bg-[#CBF891]' : 'bg-[#E8E8E8]',
                  )}>
                    {isDone ? (
                      <Sparkles className="size-3 text-[#3E8C28]" />
                    ) : (
                      <div className={cn(
                        'size-2 rounded-full',
                        isActive ? 'bg-white' : 'bg-[#C8C8C8]',
                      )} />
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold transition-colors duration-300 whitespace-nowrap',
                    isActive ? 'text-[#3E8C28]' : isDone ? 'text-[#87D57B]' : 'text-[#C8C8C8]',
                  )}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 캐릭터 디스플레이 ── */}
        <div
          className={cn(
            'relative transition-transform duration-200',
            stage === 'egg' && 'cursor-pointer hover:scale-105 active:scale-95',
          )}
          onClick={handleTapEgg}
        >
          {/* 단계별 글로우 */}
          <div className={cn(
            'absolute inset-0 rounded-full blur-2xl scale-125 transition-all duration-700',
            stage === 'egg'      && 'bg-[#CBF891]/50 animate-pulse',
            stage === 'hatching' && 'bg-[#FFF383]/70 animate-pulse',
            stage === 'born'     && 'bg-[#CBF891]/60',
            stage === 'named'    && 'bg-[#FFF383]/60',
          )} />
          <div className="relative">
            {stage === 'egg' || stage === 'hatching' ? (
              <div className={cn(stage === 'hatching' && 'animate-bounce')}>
                <img
                  src={eggSrc}
                  alt="알"
                  className={cn(
                    "w-40 h-40 object-contain",
                    stage === 'egg' && 'animate-bounce-gentle',
                  )}
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            ) : (
              <Character mood="happy" level={1} size="xl" />
            )}
          </div>
        </div>

        {/* ── 단계별 콘텐츠 ── */}

        {/* EGG */}
        {stage === 'egg' && (
          <div className="w-full space-y-4 text-center">
            <div className="space-y-1.5">
              <p className="text-[12px] font-bold text-[#87D57B] uppercase tracking-[0.18em]">
                NEW LIFE
              </p>
              <h1 className="text-[26px] font-black text-[#2A2A2A] tracking-[-0.02em]">
                알을 터치해보세요!
              </h1>
              <p className="text-[14px] font-medium text-[#7A7A7A]">
                당신만의 캐릭터가 태어날 거예요
              </p>
            </div>

            {/* 탭 힌트 카드 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-4 flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-[#E8F9D6] flex items-center justify-center shrink-0 animate-bounce">
                <span className="text-2xl">👆</span>
              </div>
              <div className="text-left">
                <p className="text-[14px] font-bold text-[#2A2A2A]">알을 탭해서 부화시키기</p>
                <p className="text-[12px] font-medium text-[#9B9B9B] mt-0.5">한 번만 탭하면 돼요!</p>
              </div>
            </div>
          </div>
        )}

        {/* HATCHING */}
        {stage === 'hatching' && (
          <div className="w-full space-y-4 text-center">
            <div className="space-y-1.5">
              <p className="text-[12px] font-bold text-[#8C7010] uppercase tracking-[0.18em] animate-pulse">
                HATCHING
              </p>
              <h1 className="text-[26px] font-black text-[#2A2A2A] tracking-[-0.02em] animate-pulse">
                부화 중...
              </h1>
              <p className="text-[14px] font-medium text-[#7A7A7A]">
                조금만 기다려주세요!
              </p>
            </div>

            {/* 로딩 바 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-5 py-4 space-y-2">
              <div className="h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                <div className="h-full bg-[#FFF383] rounded-full animate-[grow_1.5s_ease-in-out_forwards]"
                  style={{ width: '100%', animation: 'none', transition: 'width 1.5s ease-in-out', }}
                />
              </div>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="size-2 rounded-full bg-[#FFF383] animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BORN */}
        {stage === 'born' && (
          <div className="w-full space-y-4">
            {/* 축하 헤더 */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-[#FFF383] px-3 py-1.5 rounded-full mb-1">
                <Sparkles className="size-3.5 text-[#8C7010]" />
                <span className="text-[12px] font-bold text-[#8C7010]">탄생 완료!</span>
              </div>
              <h1 className="text-[26px] font-black text-[#2A2A2A] tracking-[-0.02em]">
                축하합니다! 🎉
              </h1>
              <p className="text-[14px] font-medium text-[#7A7A7A]">
                캐릭터가 태어났어요, 이름을 지어주세요
              </p>
            </div>

            {/* 이름 입력 카드 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-4 space-y-3">
              <label className="text-[12px] font-bold text-[#6A6A6A] uppercase tracking-[0.05em]">
                캐릭터 이름
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="이름을 입력해주세요"
                maxLength={10}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                className="w-full h-12 px-4 text-center text-[18px] font-black text-[#2A2A2A] rounded-xl bg-[#F5F5F5] border-0 placeholder:text-[#C8C8C8] placeholder:font-medium placeholder:text-[15px] focus:outline-none focus:ring-2 focus:ring-[#87D57B] transition-all"
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-[#C8C8C8]">
                  한글, 영문 최대 10자
                </p>
                <p className={cn(
                  'text-[11px] font-bold transition-colors',
                  characterName.length > 0 ? 'text-[#87D57B]' : 'text-[#C8C8C8]',
                )}>
                  {characterName.length} / 10
                </p>
              </div>
            </div>

            {/* 이름 짓기 버튼 */}
            <button
              onClick={handleNameSubmit}
              disabled={!characterName.trim()}
              className="w-full h-14 rounded-2xl bg-[#87D57B] hover:bg-[#6DC462] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[16px] font-bold text-white transition-all"
            >
              <Heart className="size-5 fill-white" />
              이름 짓기
            </button>
          </div>
        )}

        {/* NAMED */}
        {stage === 'named' && (
          <div className="w-full space-y-5 text-center">
            {/* 이름 + 완료 표시 */}
            <div className="space-y-2">
              <p className="text-[12px] font-bold text-[#87D57B] uppercase tracking-[0.18em]">
                BORN
              </p>
              <h1 className="text-[32px] font-black text-[#2A2A2A] tracking-[-0.02em]">
                {characterName}
              </h1>
              <p className="text-[14px] font-medium text-[#7A7A7A]">
                {userProfile?.name}님과 함께할 준비가 됐어요!
              </p>
            </div>

            {/* 스탯 카드 */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-4 flex items-center justify-around">
              {[
                { icon: Star,     label: 'LV.1',   sub: '레벨',    color: '#8C7010', bg: '#FFF383' },
                { icon: Heart,    label: '100%',   sub: '건강도',   color: '#C0305A', bg: '#FFB8CA' },
                { icon: Sparkles, label: '행복',   sub: '기분',    color: '#3E8C28', bg: '#E8F9D6' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex flex-col items-center gap-1.5">
                    <div
                      className="size-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: stat.bg }}
                    >
                      <Icon className="size-5" style={{ color: stat.color }} />
                    </div>
                    <p className="text-[15px] font-black text-[#2A2A2A]">{stat.label}</p>
                    <p className="text-[11px] font-medium text-[#9B9B9B]">{stat.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* 홈으로 이동 중 로딩 */}
            <div className="space-y-2">
              <p className="text-[12px] font-medium text-[#9B9B9B]">홈 화면으로 이동 중...</p>
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="size-2 rounded-full bg-[#87D57B] animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
