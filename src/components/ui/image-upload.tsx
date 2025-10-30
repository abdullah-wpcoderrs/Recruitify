"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  type: 'logo' | 'header';
  className?: string;
}

export function ImageUpload({ value, onChange, type, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);
      formData.append('type', type);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      setPreviewUrl(result.url);
      onChange(result.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!value || !user) return;

    try {
      // Extract path from URL
      const url = new URL(value);
      const path = url.pathname.split('/').slice(-2).join('/'); // Get userId/filename

      const response = await fetch(`/api/upload/image?path=${encodeURIComponent(path)}&userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPreviewUrl('');
        onChange('');
      }
    } catch (error) {
      console.error('Delete error:', error);
      // Still remove from UI even if delete fails
      setPreviewUrl('');
      onChange('');
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !user}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </Button>
        
        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {previewUrl && (
        <div className="mt-2">
          <div className="relative inline-block">
            {/* Use regular img tag for external URLs to avoid Next.js image config issues */}
            {previewUrl.startsWith('http') && !previewUrl.includes('supabase.co') ? (
              <img
                src={previewUrl}
                alt={`${type} preview`}
                className={`object-contain border border-gray-200 rounded ${
                  type === 'logo' ? 'h-10 w-auto max-w-[120px]' : 'h-20 w-auto max-w-[200px]'
                }`}
                onError={() => {
                  setPreviewUrl('');
                  onChange('');
                }}
              />
            ) : (
              <Image
                src={previewUrl}
                alt={`${type} preview`}
                width={type === 'logo' ? 120 : 200}
                height={type === 'logo' ? 40 : 80}
                className={`object-contain border border-gray-200 rounded ${
                  type === 'logo' ? 'h-10' : 'h-20'
                }`}
                onError={() => {
                  setPreviewUrl('');
                  onChange('');
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}