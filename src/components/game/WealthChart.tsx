'use client';

import { useMemo } from 'react';
import type { WealthRecord } from '@/lib/types';

interface WealthChartProps {
  history: WealthRecord[];
  currentMoney: number;
}

/** 简单的资产趋势图（纯CSS+SVG实现，无需图表库） */
export function WealthChart({ history, currentMoney }: WealthChartProps) {
  const chartData = useMemo(() => {
    if (history.length < 2) return null;

    const values = history.map(h => h.money);
    const maxVal = Math.max(...values, 0);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    const width = 300;
    const height = 80;
    const padding = 4;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    const points = values.map((v, i) => ({
      x: padding + (i / (values.length - 1)) * plotWidth,
      y: padding + plotHeight - ((v - minVal) / range) * plotHeight,
    }));

    // 生成SVG路径
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // 填充区域
    const areaPath = linePath +
      ` L ${points[points.length - 1].x} ${height - padding}` +
      ` L ${points[0].x} ${height - padding} Z`;

    // 判断趋势
    const last3 = values.slice(-3);
    const trend = last3.length >= 2
      ? last3[last3.length - 1] - last3[0]
      : 0;

    // 零线位置
    const zeroY = minVal < 0
      ? padding + plotHeight - ((0 - minVal) / range) * plotHeight
      : null;

    return { linePath, areaPath, width, height, trend, zeroY, maxVal, minVal };
  }, [history]);

  if (!chartData || history.length < 2) return null;

  const { linePath, areaPath, width, height, trend, zeroY, maxVal, minVal } = chartData;
  const trendUp = trend >= 0;

  // 最近3个月的对比
  const recentHistory = history.slice(-4);
  const monthChange = recentHistory.length >= 2
    ? recentHistory[recentHistory.length - 1].money - recentHistory[recentHistory.length - 2].money
    : 0;

  return (
    <div className="mt-3 pt-3 border-t border-gray-800">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-500 text-xs">📈 资产走势</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-bold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} 近期{trendUp ? '上涨' : '下跌'}
          </span>
          {monthChange !== 0 && (
            <span className={`text-[10px] ${monthChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              较上月 {monthChange >= 0 ? '+' : ''}{monthChange.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-20 rounded-lg overflow-hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        {/* 填充区域 */}
        <path
          d={areaPath}
          fill={trendUp ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
        />
        {/* 折线 */}
        <path
          d={linePath}
          fill="none"
          stroke={trendUp ? '#22c55e' : '#ef4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 零线 */}
        {zeroY !== null && (
          <line
            x1="4"
            y1={zeroY}
            x2={width - 4}
            y2={zeroY}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}
        {/* 最后一个点 */}
        <circle
          cx={4 + ((history.length - 1) / (history.length - 1)) * (width - 8)}
          cy={4 + (height - 8) - ((currentMoney - (minVal || 0)) / ((maxVal - minVal) || 1)) * (height - 8)}
          r="3"
          fill={trendUp ? '#22c55e' : '#ef4444'}
        />
      </svg>

      {/* 底部标注 */}
      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
        <span>第{history[0]?.round || 1}月</span>
        <span>第{history[history.length - 1]?.round || 1}月</span>
      </div>
    </div>
  );
}
