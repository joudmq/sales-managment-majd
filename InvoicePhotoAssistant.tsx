import React, { useState, useRef } from 'react';
import { compressImageFile } from '../lib/imageUtils';
import {
  Camera,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Trash2,
  Eye,
  RefreshCw,
  HelpCircle,
  FileImage,
  X,
} from 'lucide-react';

interface InvoicePhotoAssistantProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export const InvoicePhotoAssistant: React.FC<InvoicePhotoAssistantProps> = ({
  imageUrl,
  onImageChange,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Compress with high quality for invoices to keep text crisp and legible
      const compressed = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
        mimeType: 'image/jpeg',
      });
      onImageChange(compressed);
      setZoomLevel(1);
      setRotation(0);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في معالجة وضغط صورة الفاتورة.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // reset input so same file can be selected again
    e.target.value = '';
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleRemove = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إزالة صورة الفاتورة؟')) {
      onImageChange(null);
      setZoomLevel(1);
      setRotation(0);
      setIsFullscreen(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" dir="rtl">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header bar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold flex items-center gap-2">
              <span>إدخال الفاتورة عبر الصورة (معاينة يدوية متزامنة)</span>
              {imageUrl && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                  مرفقة ومحفوظة
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-300">
              صوّر الفاتورة الورقية وتابع الأصناف والأسعار في الصورة أثناء كتابتها في النموذج
            </p>
          </div>
        </div>

        {/* Controls when image is loaded */}
        {imageUrl ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleZoomIn}
              title="تكبير"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="تصغير"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              title="تدوير 90 درجة"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-1 text-[11px]"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{rotation}°</span>
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="إعادة ضبط الحجم"
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-[11px] font-mono"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              title="شاشة كاملة"
              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              title="إعادة التصوير بالكاميرا"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              title="إزالة الصورة"
              className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>التقاط بالكاميرا</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع صورة</span>
            </button>
          </div>
        )}
      </div>

      {/* Error notification if any */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 text-rose-700 text-xs border-b border-rose-200 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Body Area */}
      {imageUrl ? (
        <div className="relative bg-slate-950 p-2 overflow-hidden flex flex-col items-center justify-center min-h-[320px] max-h-[500px]">
          {/* Helper hint watermark */}
          <div className="absolute top-3 right-3 z-10 bg-slate-900/80 backdrop-blur-xs text-slate-300 text-[11px] px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-blue-400" />
            <span>يمكنك التكبير بالضغط على الأزرار بالأعلى أثناء نقل البنود</span>
          </div>

          <div
            className="w-full h-full flex items-center justify-center overflow-auto p-4 select-none"
            style={{ minHeight: '300px' }}
          >
            <img
              src={imageUrl}
              alt="صورة الفاتورة الأصلية"
              className="max-w-full max-h-[440px] object-contain rounded transition-transform duration-150 ease-out shadow-lg"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            />
          </div>
        </div>
      ) : (
        /* Empty State Dropzone */
        <div className="p-6 bg-slate-50 border-dashed border-2 border-slate-200 m-3 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
            <FileImage className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-bold text-slate-800">
            هل لديك فاتورة ورقية وتريد إدخالها بسهولة؟
          </h4>
          <p className="text-[11px] text-slate-500 max-w-md mt-1 mb-4">
            التقط صورة للفاتورة بهاتفك أو ارفعها من حاسوبك لتظهر أمامك مباشرة وتتمكن من نقل أسماء المنتجات والكميات والأسعار إلى الفاتورة خطوة بخطوة.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>{isProcessing ? 'جاري المعالجة...' : 'فتح الكاميرا والتقاط صورة'}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>اختيار صورة من الملفات</span>
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Viewer Modal */}
      {isFullscreen && imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">معاينة صورة الفاتورة (شاشة كاملة)</span>
              <span className="text-xs text-white/60 font-mono">
                {Math.round(zoomLevel * 100)}% | {rotation}°
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomIn}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs"
              >
                إعادة ضبط
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors mr-2"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-6">
            <img
              src={imageUrl}
              alt="صورة الفاتورة بشاشة كاملة"
              className="max-w-full max-h-full object-contain select-none transition-transform duration-150"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
