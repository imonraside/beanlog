import React, { useRef, useLayoutEffect } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

export const ImageCropper = ({ imageSrc, aspectRatio, onComplete, onCancel }) => {
  const imageRef = useRef(null);
  const cropperRef = useRef(null);

  useLayoutEffect(() => {
    if (imageRef.current) {
      cropperRef.current = new Cropper(imageRef.current, {
        aspectRatio: aspectRatio,
        viewMode: 1,
        autoCropArea: 0.8,
        background: false,
        guides: true,
        rotatable: true,
      });
    }
    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
      }
    };
  }, [imageSrc, aspectRatio]);

  const handleCrop = () => {
    if (cropperRef.current) {
      const canvas = cropperRef.current.getCroppedCanvas({ width: 800, height: 800 });
      if (canvas) { onComplete(canvas.toDataURL('image/jpeg', 0.85)); }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col animate-in fade-in">
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden"><div className="relative w-[90%] h-[80%]"><img ref={imageRef} src={imageSrc} alt="Crop" style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', opacity: 0 }} /></div></div>
      <div className="p-5 bg-slate-900 flex justify-between gap-4"><button onClick={onCancel} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold">취소</button><button onClick={handleCrop} className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-bold">완료</button></div>
    </div>
  );
};