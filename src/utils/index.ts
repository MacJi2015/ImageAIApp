import React from 'react';
import Svg, { Path } from 'react-native-svg';

function trimOneDecimal(x: number): string {
  const s = x.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

/**
 * 预览数量展示（整数）：
 * - &lt; 1000：原样
 * - ≥ 10000：以「万」为单位，后缀 W（如 1W、10.5W）
 * - 其余：以千为单位，后缀 K（如 1K、9.9K）
 */
export function formatPreviewCount(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const v = Math.max(0, Math.floor(n));
  if (v < 1000) return String(v);
  if (v < 10_000) return `${trimOneDecimal(v / 1000)}K`;
  return `${trimOneDecimal(v / 10_000)}W`;
}

export function PromptCloseIcon({
  size = 14,
  color = 'rgba(255,255,255,0.8)',
}: {
  size?: number;
  color?: string;
}) {
  return React.createElement(
    Svg,
    { width: size, height: size, viewBox: '0 0 14 14', fill: 'none' },
    React.createElement(Path, {
      d: 'M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5',
      stroke: color,
      strokeWidth: 1.15,
      strokeLinecap: 'round',
    })
  );
}

export { saveMediaToGallery, type SaveMediaResult, type SaveMediaType } from './media';
