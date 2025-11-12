import React from 'react';

interface Base64ImageDisplayProps {
  base64Data: string;
  alt?: string;
  className?: string;
  error?: string;
}

const Base64ImageDisplay: React.FC<Base64ImageDisplayProps> = ({ 
  base64Data, 
  alt = 'Generated Chart', 
  className = '',
  error 
}) => {
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 font-medium mb-2">Chart Generation Error</div>
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!base64Data) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-500">No chart data available</div>
      </div>
    );
  }

  // Create data URL for the image
  const dataUrl = `data:image/png;base64,${base64Data}`;

  return (
    <div className={`overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${className}`}>
      <div className="flex items-center justify-center min-h-full p-4">
        <img 
          src={dataUrl} 
          alt={alt}
          className="max-w-full h-auto rounded-lg shadow-sm"
          style={{ 
            minWidth: '300px', 
            maxWidth: '100%',
            height: 'auto'
          }}
          onError={(e) => {
            console.error('Error loading base64 image:', e);
            e.currentTarget.style.display = 'none';
          }}
          onLoad={(e) => {
            // Ensure image is properly centered and sized
            const img = e.currentTarget;
            const container = img.parentElement;
            if (container) {
              container.style.minHeight = `${Math.min(img.naturalHeight + 32, 600)}px`;
            }
          }}
        />
      </div>
    </div>
  );
};

export default Base64ImageDisplay;