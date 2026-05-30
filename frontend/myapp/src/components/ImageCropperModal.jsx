// components/ImageCropperModal.jsx
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Loader2 } from 'lucide-react';

export default function ImageCropperModal({ image, onClose, onCropComplete, aspect = 16/9 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onRotationChange = () => {
    setRotation(rotation + 90);
  };

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) {
      alert("Please adjust the image crop area first");
      return;
    }
    
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
      alert("Failed to crop image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-[30px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-800">Adjust Cover Image (Landscape)</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Cropper Container - Landscape mode */}
        <div className="relative h-80 bg-slate-900">
          {image ? (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onRotationChange={setRotation}
              onCropComplete={onCropCompleteHandler}
              objectFit="contain"
              showGrid={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              No image selected
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="p-4 bg-slate-50">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <ZoomIn size={18} className="text-slate-500" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                className="w-32 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <ZoomOut size={18} className="text-slate-500" />
            </div>
            
            <button
              onClick={onRotationChange}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RotateCw size={18} className="text-slate-600" />
            </button>
          </div>
          
          {/* Preview - Landscape preview */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-white rounded-xl border border-slate-100">
            <div className="text-[10px] font-black uppercase text-slate-400">Preview:</div>
            <div className="w-20 h-12 rounded-lg overflow-hidden border-2 border-emerald-500 shadow-sm bg-slate-100">
              {croppedAreaPixels && (
                <div className="w-full h-full bg-slate-100" />
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              Drag to move • Use slider to zoom
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createCroppedImage}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-xl bg-emerald-500 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Apply Changes
            </button>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="p-3 bg-blue-50 border-t border-blue-100">
          <p className="text-[9px] text-blue-600 text-center">
            💡 Drag to position • Use slider to zoom • Rotate if needed • Best for landscape covers (16:9)
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to get cropped image
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const croppedImageUrl = URL.createObjectURL(blob);
      resolve(croppedImageUrl);
    }, 'image/jpeg', 0.9);
  });
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}