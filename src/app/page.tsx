'use client';

import { useGameStore } from '@/store/gameStore';
import { StorySelect } from '@/components/stages/StorySelect';
import { StageS00, StageS01, StageS02, StageS02b, StageS03, StageS04, StageS05 } from '@/components/stages/StageComponents';
import { GameScreen } from '@/components/game/GameScreen';
import { DeathScreen } from '@/components/game/DeathScreen';
import { useEffect, useState } from 'react';

export default function Home() {
  const { state } = useGameStore();
  const [mounted, setMounted] = useState(false);

  // 客户端水合保护
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-black flex items-center justify-center" style={{ height: '100dvh' }}>
        <div className="text-gray-500 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  // 根据当前阶段渲染对应组件
  switch (state.stage) {
    case 'STORY_SELECT': return <StorySelect />;
    case 'S00': return <StageS00 />;
    case 'S01': return <StageS01 />;
    case 'S02': return <StageS02 />;
    case 'S02b': return <StageS02b />;
    case 'S03': return <StageS03 />;
    case 'S04': return <StageS04 />;
    case 'S05': return <StageS05 />;
    case 'GAME': return <GameScreen />;
    case 'DEATH': return <DeathScreen />;
    default: return <StorySelect />;
  }
}
