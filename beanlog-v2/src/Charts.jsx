import React from 'react';
import { TASTE_ITEMS } from './constants';

export const AccurateRadarChart = ({ scores }) => {
  const size = 100, center = size / 2, radius = size * 0.45;
  const keys = ['acidity', 'balance', 'sweetness', 'cleanCup', 'body', 'flavor'];
  const labels = ['산미', '밸런스', '단맛', '클린컵', '바디', '아로마'];
  const getPoint = (value, index) => { const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2; const val = parseFloat(value) || 0; const r = (val / 10) * radius; return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`; };
  const gridLevels = [10, 8, 6, 4, 2];
  const bgPoints = gridLevels.map(scale => keys.map((_, i) => getPoint(scale, i)).join(' '));
  const dataPoints = keys.map((key, i) => getPoint(scores[key], i)).join(' ');
  const labelCoords = keys.map((_, i) => { const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2; const r = radius + 12; return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle), text: labels[i] }; });
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible font-capture">
      {bgPoints.map((pts, i) => <polygon key={i} points={pts} fill="none" stroke="#e2e8f0" strokeWidth={i === 0 ? "0.8" : "0.5"} />)}
      {keys.map((_, i) => { const end = getPoint(10, i).split(','); return <line key={i} x1={center} y1={center} x2={end[0]} y2={end[1]} stroke="#e2e8f0" strokeWidth="0.8" /> })}
      <polygon points={dataPoints} fill="rgba(120, 53, 15, 0.3)" stroke="#78350f" strokeWidth="1.5" />
      {labelCoords.map((l, i) => <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#64748b" fontWeight="bold">{l.text}</text>)}
    </svg>
  );
};

export const RadarChart = ({ scores }) => {
    const size=120, center=size/2, radius=size*0.4;
    const pts = TASTE_ITEMS.map((item, i) => { const angle = (Math.PI*2*i)/6 - Math.PI/2; const val = parseFloat(scores[item.id])||0; return `${center + (val/10)*radius * Math.cos(angle)},${center + (val/10)*radius * Math.sin(angle)}`; }).join(' ');
    return <svg width={size} height={size} className="overflow-visible">{[1,2,3,4,5].map(s=><polygon key={s} points={TASTE_ITEMS.map((_,i)=>{const a=(Math.PI*2*i)/6-Math.PI/2;const r=(s/5)*radius;return`${center+r*Math.cos(a)},${center+r*Math.sin(a)}`;}).join(' ')} fill="none" stroke="#e2e8f0" strokeWidth="1"/>)}<polygon points={pts} fill="rgba(120, 53, 15, 0.3)" stroke="#78350f" strokeWidth="2"/>{TASTE_ITEMS.map((t,i)=><text key={i} x={center+(radius+15)*Math.cos((Math.PI*2*i)/6-Math.PI/2)} y={center+(radius+15)*Math.sin((Math.PI*2*i)/6-Math.PI/2)} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="bold" fill="#475569">{t.label}</text>)}</svg>;
};