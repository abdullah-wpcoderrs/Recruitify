"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
  FileArchive
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FileUploadProps {
  fieldId: string;
  label: string;
  required?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onFileChange?: (files: UploadedFile[]) => void;
  value?: UploadedFile[];
  error?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  formId?: string; // For public form uploads
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const ALLOWED_FILE_TYPES = {
  'application/pdf': { icon: FileText, color: 'text-red-500' },
  'application/msword': { icon: FileText, color: 'text-blue-500' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, color: 'text-blue-500' },
  'text/plain': { icon: FileText, color: 'text-gray-500' },
  'image/jpeg': { icon: ImageIcon, color: 'text-green-500' },
  'image/png': { icon: ImageIcon, color: 'text-green-500' },
  'image/gif': { icon: ImageIcon, color: 'text-green-500' },
  'application/zip': { icon: FileArchive, color: 'text-purple-500' },
  'application/x-zip-compressed': { icon: FileArchive, color: 'text-purple-500' },
};

export function FileUpload({
  fieldId,
  label: _label,
  required: _required = false,
  accept = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip",
  maxSize = 10, // 10MB default
  multiple = false,
  onFileChange,
  value = [],
  error,
  disabled = false,
  className = "",
  style = {},
  formId,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(value);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = acceptedTypes.some(type => 
      type === fileExtension || 
      type === file.type ||
      (type.startsWith('.') && fileExtension === type)
    );

    if (!isValidType) {
      return `File type not allowed. Accepted types: ${accept}`;
    }

    return null;
  };

  const uploadFileToSupabase = async (file: File, _uploadedFile: UploadedFile): Promise<string> => {
    if (formId) {
      // Use public form upload API for anonymous uploads
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldId', fieldId);
      formData.append('formId', formId);

      const response = await fetch('/api/forms/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      return result.file.url;
    } else {
      // Use direct Supabase upload for authenticated users
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `form-uploads/${fileName}`;

      const { error } = await supabase.storage
        .from('form-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('form-uploads')
        .getPublicUrl(filePath);

      return publicUrl;
    }
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validationError = validateFile(file);
      
      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: validationError ? 'error' : 'uploading',
        error: validationError || undefined,
        uploadProgress: 0,
      };

      newFiles.push(uploadedFile);
    }

    // Update files state
    const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
    setFiles(updatedFiles);
    onFileChange?.(updatedFiles);

    // Upload valid files
    for (let i = 0; i < newFiles.length; i++) {
      const uploadedFile = newFiles[i];
      if (uploadedFile.status === 'error') continue;

      const file = fileList[i];
      
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setFiles(current => 
            current.map(f => 
              f.id === uploadedFile.id 
                ? { ...f, uploadProgress: Math.min((f.uploadProgress || 0) + 10, 90) }
                : f
            )
          );
        }, 200);

        // Upload to Supabase
        const url = await uploadFileToSupabase(file, uploadedFile);
        
        clearInterval(progressInterval);
        
        // Update file with success status
        setFiles(current => {
          const updated = current.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, status: 'completed' as const, uploadProgress: 100, url }
              : f
          );
          onFileChange?.(updated);
          return updated;
        });

        toast.success(`${file.name} uploaded successfully`);
      } catch (error: unknown) {
        // Update file with error status
        const err = error as { message?: string };
        const errorMessage = err.message || 'Unknown error';
        setFiles(current => {
          const updated = current.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, status: 'error' as const, error: errorMessage }
              : f
          );
          onFileChange?.(updated);
          return updated;
        });

        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, multiple, maxSize, accept, onFileChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [handleFiles, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFileChange?.(updatedFiles);
  }, [files, onFileChange]);

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getFileIcon = (file: UploadedFile) => {
    const fileInfo = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];
    if (fileInfo) {
      const Icon = fileInfo.icon;
      return <Icon className={`w-5 h-5 ${fileInfo.color}`} />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : error 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={style}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className={`text-sm ${isDragging ? 'text-blue-600' : 'text-gray-600'}`}>
          {isDragging 
            ? 'Drop files here' 
            : 'Click to upload or drag and drop'
          }
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {accept.replace(/\./g, '').toUpperCase()} up to {maxSize}MB
          {multiple && ' (multiple files allowed)'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
            >
              {getFileIcon(file)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
                
                {file.status === 'uploading' && (
                  <div className="mt-1">
                    <Progress value={file.uploadProgress || 0} className="h-1" />
                  </div>
                )}
                
                {file.status === 'error' && file.error && (
                  <p className="text-xs text-red-500 mt-1">{file.error}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {file.status === 'uploading' && (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                )}
                
                {file.status === 'completed' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                
                {file.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="text-gray-400 hover:text-red-500"
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}