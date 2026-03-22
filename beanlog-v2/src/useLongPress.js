import { useRef, useCallback } from 'react';

export const useLongPress = (callback = () => {}, speed = 100, delay = 400) => {
  const timerRef = useRef(null); 
  const delayRef = useRef(null); 
  const isTouchRef = useRef(false);
  
  const start = useCallback((event) => {
    if (event.type === 'touchstart') isTouchRef.current = true;
    else if (event.type === 'mousedown' && isTouchRef.current) return;
    callback(); 
    delayRef.current = setTimeout(() => { timerRef.current = setInterval(callback, speed); }, delay);
  }, [callback, speed, delay]);
  
  const stop = useCallback(() => {
    if (delayRef.current) clearTimeout(delayRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    delayRef.current = null; timerRef.current = null;
    setTimeout(() => { isTouchRef.current = false; }, 500);
  }, []);
  
  return { onMouseDown: start, onMouseUp: stop, onMouseLeave: stop, onTouchStart: (e) => { if(e.cancelable) e.preventDefault(); start(e); }, onTouchEnd: stop };
};