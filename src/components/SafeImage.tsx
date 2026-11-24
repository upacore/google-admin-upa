import { useState } from 'react';
import { Car } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle = 'UPA Mobilidade Angola',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0A192F] to-[#112240] text-white p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-12 h-12 rounded-xl bg-[#00A859]/20 text-[#00A859] flex items-center justify-center mb-3">
          <Car className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold tracking-tight">{fallbackTitle}</p>
        <p className="text-xs text-slate-300 mt-1">Huambo · Sede Nacional</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
