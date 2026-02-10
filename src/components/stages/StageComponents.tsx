'use client';

import { useGameStore } from '@/store/gameStore';
import stagesData from '@/data/stages.json';
import { motion, AnimatePresence } from 'framer-motion';

/** S00 - 压抑的现实（逐行打字机） */
export function StageS00() {
  const { state, nextS00Line, setStage } = useGameStore();
  const stage = stagesData.S00;
  const idx = state.bgLineIdx;
  const lines = stage.lines;

  if (idx >= lines.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-black"
      >
        <button
          onClick={() => setStage('S01')}
          className="px-8 py-4 text-xl bg-red-700 hover:bg-red-600 text-white rounded-lg transition-all"
        >
          {stage.cta}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-300 flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl text-center"
        >
          <p className="text-lg md:text-xl leading-relaxed mb-8">{lines[idx]}</p>
        </motion.div>
      </AnimatePresence>
      <button
        onClick={nextS00Line}
        className="mt-8 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all text-sm"
      >
        继续
      </button>
      <div className="mt-4 flex gap-1">
        {lines.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i <= idx ? 'bg-red-500' : 'bg-gray-700'}`} />
        ))}
      </div>
    </div>
  );
}

/** S01 - 起点 */
export function StageS01() {
  const { setStage } = useGameStore();
  const stage = stagesData.S01;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-bold mb-8 text-center"
      >
        {stage.mainText}
      </motion.h1>
      <div className="max-w-2xl space-y-4 mb-12">
        {stage.lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.3 }}
            className="text-gray-400 text-base md:text-lg"
          >
            {line.text}
          </motion.p>
        ))}
      </div>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        onClick={() => setStage('S02')}
        className="px-10 py-4 bg-red-700 hover:bg-red-600 text-white text-xl rounded-lg transition-all shadow-lg shadow-red-900/50"
      >
        {stage.button}
      </motion.button>
    </div>
  );
}

/** S02 - 身份选择 */
export function StageS02() {
  const { selectPath, setStage } = useGameStore();
  const stage = stagesData.S02;

  const handleSelect = (id: string) => {
    selectPath(id as 'A' | 'B' | 'C' | 'D');
    setStage('S02b');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-bold text-center mb-4"
        >
          {stage.title}
        </motion.h2>
        <p className="text-gray-500 text-center mb-10">{stage.desc}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stage.identityOptions.map((option, i) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              onClick={() => handleSelect(option.id)}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-red-500 hover:bg-gray-800 transition-all group"
            >
              <h3 className="text-xl font-bold mb-2 group-hover:text-red-400">{option.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{option.desc}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded">💰 ${option.stats.money}</span>
                <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded">❤️ {option.stats.health}</span>
                <span className="bg-purple-900/50 text-purple-400 px-2 py-1 rounded">🧠 {option.stats.san}</span>
                <span className="bg-blue-900/50 text-blue-400 px-2 py-1 rounded">💳 {option.stats.credit}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** S02b - 斩杀线叙事 */
export function StageS02b() {
  const { state, nextS02bScene, setStage } = useGameStore();
  const stage = stagesData.S02b;
  const idx = state.s02bSceneIdx;
  const scenes = stage.scenes;

  if (idx >= scenes.length) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <button
          onClick={() => setStage('S03')}
          className="px-8 py-4 text-xl bg-red-700 hover:bg-red-600 text-white rounded-lg"
        >
          继续
        </button>
      </div>
    );
  }

  const scene = scenes[idx];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-2xl text-center"
        >
          <h3 className="text-sm text-gray-500 mb-6">{scene.scene}</h3>
          <div className="text-gray-300 leading-relaxed whitespace-pre-line text-left">
            {scene.monologue}
          </div>
        </motion.div>
      </AnimatePresence>
      <button
        onClick={nextS02bScene}
        className="mt-10 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm"
      >
        继续 ({idx + 1}/{scenes.length})
      </button>
    </div>
  );
}

/** S03 - 入境 */
export function StageS03() {
  const { state, setStage } = useGameStore();
  const stage = stagesData.S03;
  const pathData = stage.byPath[state.pathId as keyof typeof stage.byPath];

  if (!pathData) return <div className="min-h-screen bg-black flex items-center justify-center text-white">路线数据加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-400">{stage.title}</h2>
        <div className="space-y-6">
          {pathData.lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.4 }}
              className="flex gap-4"
            >
              <span className="text-red-500 text-sm font-mono whitespace-nowrap mt-1">{line.day}</span>
              <p className="text-gray-300 text-sm leading-relaxed">{line.text}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: pathData.lines.length * 0.4 + 0.5 }}
          className="mt-12 text-center"
        >
          <button
            onClick={() => setStage('S04')}
            className="px-8 py-4 bg-red-700 hover:bg-red-600 text-white rounded-lg text-lg"
          >
            {pathData.button}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/** S04 - 落地即归零 */
export function StageS04() {
  const { state, setStage } = useGameStore();
  const stage = stagesData.S04;
  const pathData = stage.byPath[state.pathId as keyof typeof stage.byPath];

  if (!pathData) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl text-center"
      >
        <h3 className="text-sm text-gray-500 mb-6">{pathData.scene}</h3>
        <div className="text-gray-300 leading-relaxed whitespace-pre-line text-left mb-10">
          {pathData.monologue}
        </div>
        <button
          onClick={() => setStage('S05')}
          className="px-8 py-4 bg-red-700 hover:bg-red-600 text-white rounded-lg"
        >
          继续
        </button>
      </motion.div>
    </div>
  );
}

/** S05 - 强制教程 */
export function StageS05() {
  const { state, advanceTutorial } = useGameStore();
  const stagesDataImport = stagesData as Record<string, unknown>;
  const stage = stagesDataImport.S05 as { title: string; desc: string; tutorialByPath: Record<string, { button: string; script: Array<{ day: number; text: string; effects?: Array<{ stat: string; delta?: number; reason?: string }>; spotlight?: { key: string; tip: string } }> }> };
  const pathId = state.pathId || 'A';
  const tutorial = stage.tutorialByPath[pathId];
  const script = tutorial?.script || [];
  const step = state.tutorialStep;

  if (step >= script.length) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>教程完成，正在进入游戏...</p>
      </div>
    );
  }

  const current = script[step];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-12 flex flex-col items-center justify-center">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-2">{stage.title}</h2>
        <p className="text-gray-500 text-center mb-8">{stage.desc}</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6"
          >
            <div className="text-red-500 text-sm mb-2">Day {current.day}</div>
            <p className="text-gray-300 leading-relaxed">{current.text}</p>

            {current.effects && (
              <div className="mt-4 flex flex-wrap gap-2">
                {current.effects.map((eff, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded text-xs ${
                      (eff.delta || 0) < 0 ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'
                    }`}
                  >
                    {eff.reason}: {(eff.delta || 0) > 0 ? '+' : ''}{eff.delta}
                  </span>
                ))}
              </div>
            )}

            {current.spotlight && (
              <div className="mt-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">💡 {current.spotlight.tip}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="text-center">
          <button
            onClick={advanceTutorial}
            className="px-8 py-3 bg-red-700 hover:bg-red-600 text-white rounded-lg"
          >
            {step < script.length - 1 ? '继续' : tutorial.button}
          </button>
        </div>

        <div className="mt-4 flex justify-center gap-1">
          {script.map((_: unknown, i: number) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i <= step ? 'bg-red-500' : 'bg-gray-700'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
