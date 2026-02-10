'use client';

import { useGameStore } from '@/store/gameStore';
import storiesIndex from '@/data/stories.json';
import { motion } from 'framer-motion';
import { useState } from 'react';

/** 故事选择界面 */
export function StorySelect() {
  const { selectStory, randomStory, skipToGame } = useGameStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const stories = storiesIndex.stories;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
      {/* 标题区域 */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-3">
          🇺🇸 <span className="bg-gradient-to-r from-red-500 via-white to-blue-500 bg-clip-text text-transparent">美利坚生存指南</span>
        </h1>
        <p className="text-gray-500 text-base md:text-lg">每个人都有自己的理由来到这里。你的故事是什么？</p>
      </motion.div>

      {/* 随机开始按钮 */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        onClick={randomStory}
        className="mb-10 px-8 py-4 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 hover:from-red-500 hover:via-purple-500 hover:to-blue-500 text-white text-lg font-bold rounded-xl shadow-lg shadow-purple-900/50 transition-all hover:scale-105 active:scale-95"
      >
        🎲 随机开始一段命运
      </motion.button>

      <div className="text-gray-600 text-sm mb-6">—— 或者选择你的故事 ——</div>

      {/* 故事卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {stories.map((story, i) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
            onClick={() => selectStory(story.id)}
            onMouseEnter={() => setHoveredId(story.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="relative bg-gray-900 border border-gray-800 rounded-xl p-6 cursor-pointer transition-all duration-300 group overflow-hidden"
            style={{
              borderColor: hoveredId === story.id ? story.color : undefined,
              boxShadow: hoveredId === story.id ? `0 0 30px ${story.color}30` : undefined,
            }}
          >
            {/* 背景光效 */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              style={{ background: `radial-gradient(circle at center, ${story.color}, transparent 70%)` }}
            />

            {/* 图标 */}
            <div className="text-4xl mb-4">{story.icon}</div>

            {/* 标题 */}
            <h3
              className="text-xl font-bold mb-1 transition-colors"
              style={{ color: hoveredId === story.id ? story.color : '#fff' }}
            >
              {story.title}
            </h3>
            <p className="text-gray-500 text-sm mb-3">{story.subtitle}</p>

            {/* 描述 */}
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              {story.description}
            </p>

            {/* 标签 */}
            <div className="flex flex-wrap gap-2">
              {story.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-xs border"
                  style={{
                    borderColor: `${story.color}50`,
                    color: story.color,
                    backgroundColor: `${story.color}15`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 难度标识 */}
            <div className="absolute top-4 right-4 text-xs text-gray-600">
              {story.difficulty}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 底部提示 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-10 text-gray-700 text-xs"
      >
        不同的故事有不同的开场剧情和入境路线，进入游戏后的生存系统通用。
      </motion.p>

      {/* 一键跳过剧情 */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={skipToGame}
        className="mt-4 px-6 py-2 text-gray-600 hover:text-gray-400 text-xs border border-gray-800 hover:border-gray-600 rounded-lg transition-all"
      >
        ⚡ 跳过剧情，直接开始生存
      </motion.button>
    </div>
  );
}