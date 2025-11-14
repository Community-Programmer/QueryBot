import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Base64ImageDisplayProps {
  base64Data: string;
  alt?: string;
  className?: string;
  error?: string;
  showDownloadButton?: boolean;
  fileName?: string;
}

const Base64ImageDisplay: React.FC<Base64ImageDisplayProps> = ({ 
  base64Data, 
  alt = 'Generated Chart', 
  className = '',
  error,
  showDownloadButton = true,
  fileName = 'chart'
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

  // Function to handle download
  const handleDownload = () => {
    try {
      // Clean filename: remove special characters and ensure valid filename
      const cleanFileName = fileName
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${cleanFileName}.png`;
      
      // Append to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Optional: Show success feedback (you can uncomment this if you want user feedback)
      // console.log(`Chart downloaded as ${cleanFileName}.png`);
    } catch (error) {
      console.error('Error downloading image:', error);
      // Optional: You could show a toast notification here for better UX
    }
  };

  return (
    <div className={`w-full min-h-full ${className}`}>
      <div className="relative">
        {/* Download Button - positioned at top right */}
        {showDownloadButton && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              onClick={handleDownload}
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white shadow-md border transition-all hover:scale-105"
              title="Download chart as PNG"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        )}
        
        <div className="flex items-center justify-center p-10 min-h-full">
          <img 
            src={dataUrl} 
            alt={alt}
            className="w-auto h-auto rounded-lg shadow-sm"
            style={{ 
              maxWidth: '70%',
              maxHeight: '70%',
              minWidth: '150px',
              display: 'block'
            }}
            onError={(e) => {
              console.error('Error loading base64 image:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Base64ImageDisplay;