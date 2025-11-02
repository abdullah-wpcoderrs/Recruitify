"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, ExternalLink, Upload } from "lucide-react";
import { FormField, FormStep, FormDesign, FormSettings } from "./form-builder";
import Image from "next/image";

// Font mapping function
const getFontFamily = (fontValue: string) => {
  const fontMap: Record<string, string> = {
    'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Inter, sans-serif': 'var(--font-inter), Inter, sans-serif',
    'Roboto, sans-serif': 'var(--font-roboto), Roboto, sans-serif',
    'Open Sans, sans-serif': 'var(--font-open-sans), "Open Sans", sans-serif',
    'Lato, sans-serif': 'var(--font-lato), Lato, sans-serif',
    'Montserrat, sans-serif': 'var(--font-montserrat), Montserrat, sans-serif',
    'Poppins, sans-serif': 'var(--font-poppins), Poppins, sans-serif',
    'Rubik, sans-serif': 'var(--font-rubik), Rubik, sans-serif',
  };
  
  return fontMap[fontValue] || fontValue;
};

interface FormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  formDescription: string;
  fields: FormField[];
  steps: FormStep[];
  design: FormDesign;
  settings: FormSettings;
  formId?: string;
}

export function FormPreviewModal({
  isOpen,
  onClose,
  formTitle,
  formDescription,
  fields,
  steps,
  design,
  settings,
  formId
}: FormPreviewModalProps) {
  const openInNewTab = () => {
    if (formId) {
      const previewUrl = `${window.location.origin}/forms/${formId}?preview=true`;
      window.open(previewUrl, '_blank');
    }
  };

  const renderField = (field: FormField) => {
    const baseStyle = {
      borderRadius: `${design.borderRadius}px`,
      borderColor: design.primaryColor + '40',
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              className="w-full p-3 border border-gray-300 rounded"
              style={baseStyle}
              disabled
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              className="w-full p-3 border border-gray-300 rounded resize-none h-24"
              style={baseStyle}
              disabled
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select className="w-full p-3 border border-gray-300 rounded" style={baseStyle} disabled>
              <option>Select an option</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded p-6 text-center"
              style={{ borderRadius: `${design.borderRadius}px` }}
            >
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Form Preview</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Preview Mode</Badge>
              {formId && (
                <Button variant="outline" size="sm" onClick={openInNewTab}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div 
          className="p-6 rounded-lg border"
          style={{ 
            backgroundColor: design.backgroundColor,
            color: design.textColor,
            borderRadius: `${design.borderRadius}px`,
            fontFamily: getFontFamily(design.fontFamily || 'system')
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            {design.logoUrl && (
              <div className="relative h-12 mb-4 flex justify-center">
                <Image 
                  src={design.logoUrl} 
                  alt="Logo" 
                  width={200}
                  height={48}
                  className="h-12 object-contain"
                />
              </div>
            )}
            <h1 className="text-3xl font-bold mb-2">{formTitle}</h1>
            {formDescription && (
              <div 
                className="text-gray-600 prose prose-sm max-w-none mx-auto"
                dangerouslySetInnerHTML={{ __html: formDescription }}
              />
            )}
          </div>

          {/* Progress Bar */}
          {settings.isMultiStep && settings.showProgressBar && (
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Step 1 of {steps.length}</span>
                <span>{Math.round((1 / steps.length) * 100)}% Complete</span>
              </div>
              <Progress value={(1 / steps.length) * 100} className="h-2" />
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            {fields.slice(0, 3).map(renderField)} {/* Show first 3 fields as preview */}
            
            {fields.length > 3 && (
              <div className="text-center py-4 text-gray-500">
                <p>... and {fields.length - 3} more field{fields.length - 3 !== 1 ? 's' : ''}</p>
              </div>
            )}

            {/* Submit Button Preview */}
            <div className="pt-6">
              <button
                className="w-full py-3 px-6 text-white font-medium rounded transition-colors"
                style={{
                  backgroundColor: design.primaryColor,
                  borderRadius: `${design.borderRadius}px`
                }}
                disabled
              >
                {settings.submitButtonText || 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}