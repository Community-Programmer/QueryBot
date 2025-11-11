import React from 'react';
import { Upload } from 'lucide-react';

interface UploadButtonProps {
  onFileUpload: (file: File) => void;
  disabled?: boolean;
  fileName?: string | null;
}

export const UploadButton: React.FC<UploadButtonProps> = ({ 
  onFileUpload, 
  disabled = false,
  fileName 
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-md mb-4">
      <label 
        htmlFor="database-upload" 
        className={`flex items-center justify-center gap-3 p-4 cursor-pointer 
          border-2 border-dashed rounded-xl transition-all duration-300
          ${disabled 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50' 
            : 'border-[#009B72] bg-white hover:bg-[#DDF7E3] hover:border-[#007d5c]'
          }`}
      >
        <Upload className={`w-5 h-5 ${disabled ? 'text-gray-400' : 'text-[#009B72]'}`} />
        <span className={`font-medium ${disabled ? 'text-gray-400' : 'text-[#333A3F]'}`}>
          {disabled 
            ? 'Uploading...' 
            : fileName 
              ? `Uploaded: ${fileName}` 
              : 'Upload .sqlite or .csv file'
          }
        </span>
      </label>
      <input
        id="database-upload"
        type="file"
        accept=".sqlite,.csv"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
      {fileName && !disabled && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          File ready! You can upload a new file to replace it.
        </p>
      )}
    </div>
  );
};