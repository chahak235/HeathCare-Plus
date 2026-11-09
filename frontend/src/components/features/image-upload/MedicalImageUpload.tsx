import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileImage,
  Loader2
} from 'lucide-react';
import { Button } from '../../ui/Button';

interface MedicalImageUploadProps {
  onImageSelect: (file: File) => void;
  selectedImage?: File | null;
  maxSizeMB?: number;
  allowedTypes?: string[];
  analysisType: 'skin' | 'xray' | 'wound' | 'general';
}

const MedicalImageUpload: React.FC<MedicalImageUploadProps> = ({
  onImageSelect,
  selectedImage,
  maxSizeMB = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/bmp'],
  analysisType,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError(`File size exceeds ${maxSizeMB}MB limit`);
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type. Please upload JPEG, PNG, or BMP images.');
      }
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      // Validate file
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File size must be less than ${maxSizeMB}MB`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload JPEG, PNG, or BMP images.');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      onImageSelect(file);
    }
  }, [onImageSelect, maxSizeMB, allowedTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/bmp': ['.bmp'],
    },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  });

  const removeImage = () => {
    setPreviewUrl(null);
    onImageSelect(null as any);
    setError(null);
  };

  const getAnalysisTypeInfo = () => {
    const info = {
      skin: {
        title: 'Skin Condition Analysis',
        description: 'Upload clear image of skin lesion or rash',
        tips: ['Good lighting', 'No shadows', 'Close-up view', 'Include scale reference if possible'],
        example: 'mole_skin_lesion.jpg',
      },
      xray: {
        title: 'X-ray Analysis',
        description: 'Upload chest X-ray or bone X-ray image',
        tips: ['High contrast', 'Properly cropped', 'Original DICOM preferred', 'Minimal artifacts'],
        example: 'chest_xray.png',
      },
      wound: {
        title: 'Wound Assessment',
        description: 'Upload clear image of wound or injury',
        tips: ['Clean surrounding area', 'Good lighting', 'Include scale', 'Multiple angles if possible'],
        example: 'surgical_wound.jpg',
      },
      general: {
        title: 'General Medical Image',
        description: 'Upload any medical image for analysis',
        tips: ['Clear focus', 'Proper orientation', 'Relevant area highlighted', 'No personal identifiers'],
        example: 'medical_image.png',
      },
    };
    return info[analysisType];
  };

  const typeInfo = getAnalysisTypeInfo();

  return (
    <div className="space-y-6">
      {/* Analysis Type Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
            <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {typeInfo.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {typeInfo.description}
            </p>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📋 Upload Tips:
              </h4>
              <ul className="grid grid-cols-2 gap-2">
                {typeInfo.tips.map((tip, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
          }
          ${error ? 'border-red-300 dark:border-red-700' : ''}
          ${selectedImage ? 'bg-green-50 dark:bg-green-900/10' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {selectedImage ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={previewUrl || ''}
                  alt="Preview"
                  className="max-h-64 max-w-full rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Image Ready for Analysis</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedImage.name} • {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className={`
                p-4 rounded-full transition-colors
                ${isDragActive 
                  ? 'bg-blue-100 dark:bg-blue-800/30' 
                  : 'bg-gray-100 dark:bg-gray-800'
                }
              `}>
                {isDragActive ? (
                  <Upload className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-bounce" />
                ) : (
                  <FileImage className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isDragActive ? 'Drop Image Here' : 'Upload Medical Image'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Drag & drop or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Supports: JPG, PNG, BMP • Max: {maxSizeMB}MB
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="mt-4"
            >
              Browse Files
            </Button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Example Format */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <ImageIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Example Format: {typeInfo.example}
          </h4>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          For best results, ensure image is clear, well-lit, and focused on the area of concern.
        </p>
      </div>
    </div>
  );
};

export default MedicalImageUpload;