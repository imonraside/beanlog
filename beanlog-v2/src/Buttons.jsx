import React from 'react';
import { useLongPress } from './useLongPress';

export const ScoreButton = ({ onClick, icon: Icon }) => {
  const longPressProps = useLongPress(onClick, 80, 400); 
  return <button {...longPressProps} className="w-8 h-8 bg-white rounded-full shadow border flex items-center justify-center active:scale-95 transition-transform no-select">{Icon}</button>;
};

export const ScoreButtonPlus = ({ onClick, icon: Icon }) => {
  const longPressProps = useLongPress(onClick, 80, 400); 
  return <button {...longPressProps} className="w-8 h-8 bg-slate-900 rounded-full shadow flex items-center justify-center active:scale-95 transition-transform no-select">{Icon}</button>;
};