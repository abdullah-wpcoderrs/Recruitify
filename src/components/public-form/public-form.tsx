"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { FileUpload, UploadedFile } from "@/components/ui/file-upload";
import { 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { trackFormView, getTrackingMetadata } from "@/lib/tracking";

interface FormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  acceptedTypes?: string;
  maxFileSize?: number;
  allowMultiple?: boolean;
}

interface FormStep {
  id: string;
  title: string;
  fields: string[];
}

interface PublicFormData {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  branding?: {
    design?: {
      primaryColor?: string;
      backgroundColor?: string;
      logoUrl?: string;
      textColor?: string;
      borderRadius?: number;
      fontFamily?: string;
    };
    settings?: {
      isMultiStep?: boolean;
      showProgressBar?: boolean;
      submitButtonText?: string;
      successMessage?: string;
      redirectUrl?: string;
    };
    steps?: FormStep[];
  };
}

interface PublicFormProps {
  form: PublicFormData;
}

export function PublicForm({ form }: PublicFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [fileData, setFileData] = useState<Record<string, UploadedFile[]>>({});
  const [formStartTime] = useState<number>(Date.now()); // Track when form was loaded
  
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  // Track form view when component mounts
  useEffect(() => {
    if (!isPreview) {
      const trackView = async () => {
        try {
          const metadata = getTrackingMetadata();
          await trackFormView(form.id, metadata);
        } catch (error) {
          console.error('Error tracking form view:', error);
        }
      };
      
      trackView();
    }
  }, [form.id, isPreview]);

  // Parse form configuration
  const design = form.branding?.design || {
    primaryColor: '#16a34a',
    backgroundColor: '#ffffff',
    textColor: '#171717',
    borderRadius: 6,
    fontFamily: 'system',
  };

  const settings = form.branding?.settings || {
    isMultiStep: false,
    showProgressBar: true,
    submitButtonText: 'Submit Application',
    successMessage: 'Thank you for your application!',
  };

  const steps = form.branding?.steps || [];
  const fields = form.fields || [];
  const isMultiStep = settings.isMultiStep && steps.length > 1;

  // Get fields for current step
  const getCurrentStepFields = () => {
    if (!isMultiStep) return fields;
    const step = steps[currentStep];
    return fields.filter((field) => step?.fields.includes(field.id));
  };

  // Create dynamic validation schema
  const createValidationSchema = (stepFields: FormField[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    
    stepFields.forEach((field) => {
      if (field.type === 'file') {
        // File fields are handled separately through fileData state
        if (field.required) {
          schemaFields[field.id] = z.any().refine(
            () => {
              const files = fileData[field.id] || [];
              const completedFiles = files.filter(f => f.status === 'completed');
              return completedFiles.length > 0;
            },
            { message: `${field.label} is required` }
          );
        } else {
          schemaFields[field.id] = z.any().optional();
        }
      } else {
        let validator = z.string();

        if (field.type === 'email') {
          validator = validator.email('Please enter a valid email address');
        }

        if (field.required) {
          schemaFields[field.id] = validator.min(1, `${field.label} is required`);
        } else {
          schemaFields[field.id] = validator.optional();
        }
      }
    });
    
    return z.object(schemaFields);
  };

  const currentStepFields = getCurrentStepFields();
  const validationSchema = createValidationSchema(currentStepFields);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: formData,
  });

  // Handle step navigation
  const nextStep = async () => {
    const isValid = await trigger();
    if (isValid) {
      // Save current step data
      const stepData = getValues();
      setFormData({ ...formData, ...stepData });
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Handle form submission
  const onSubmit = async (data: Record<string, unknown>) => {
    if (isPreview) {
      // In preview mode, just show success without actually submitting
      setIsSubmitted(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Combine form data with file data
      const finalData = { ...formData, ...data };
      
      // Add file information to submission data
      Object.keys(fileData).forEach(fieldId => {
        const files = fileData[fieldId];
        const completedFiles = files.filter(f => f.status === 'completed');
        if (completedFiles.length > 0) {
          finalData[fieldId] = completedFiles.map(f => ({
            name: f.name,
            url: f.url,
            size: f.size,
            type: f.type
          }));
        }
      });
      
      // Calculate completion time
      const completionTimeSeconds = Math.floor((Date.now() - formStartTime) / 1000);
      const metadata = getTrackingMetadata();

      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form.id,
          data: finalData,
          files: fileData,
          completionTimeSeconds,
          metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit form');
      }

      setIsSubmitted(true);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setSubmitError(err.message || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render field based on type
  const renderField = (field: FormField) => {
    const fieldError = errors[field.id]?.message as string;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              {...register(field.id)}
              className={fieldError ? 'border-red-500' : ''}
              style={{
                borderRadius: `${design.borderRadius}px`,
                borderColor: fieldError ? '#ef4444' : design.primaryColor + '40',
              }}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              {...register(field.id)}
              className={fieldError ? 'border-red-500' : ''}
              style={{
                borderRadius: `${design.borderRadius}px`,
                borderColor: fieldError ? '#ef4444' : design.primaryColor + '40',
              }}
              rows={4}
            />
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <select
              id={field.id}
              {...register(field.id)}
              className={`w-full p-3 border rounded bg-white ${fieldError ? 'border-red-500' : 'border-gray-300'}`}
              style={{
                borderRadius: `${design.borderRadius}px`,
                borderColor: fieldError ? '#ef4444' : design.primaryColor + '40',
              }}
            >
              <option value="">Select an option</option>
              {field.options?.map((option: string, index: number) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <FileUpload
              fieldId={field.id}
              label={field.label}
              required={field.required}
              accept={field.acceptedTypes || '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png'}
              maxSize={field.maxFileSize || 10}
              multiple={field.allowMultiple || false}
              value={fileData[field.id] || []}
              onFileChange={(files) => {
                setFileData(prev => ({ ...prev, [field.id]: files }));
                // Update form data with file URLs for validation
                const completedFiles = files.filter(f => f.status === 'completed');
                const fileUrls = completedFiles.map(f => f.url).filter(Boolean);
                if (fileUrls.length > 0) {
                  setFormData(prev => ({ ...prev, [field.id]: fileUrls }));
                }
              }}
              error={fieldError}
              style={{
                borderRadius: `${design.borderRadius}px`,
                borderColor: fieldError ? '#ef4444' : design.primaryColor + '40'
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              {settings.successMessage || 'Your form has been submitted successfully.'}
            </p>
            {settings.redirectUrl && (
              <Button
                onClick={() => window.location.href = settings.redirectUrl!}
                style={{ backgroundColor: design.primaryColor }}
              >
                Continue
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-12 px-4"
      style={{ 
        backgroundColor: design.backgroundColor,
        color: design.textColor,
        fontFamily: design.fontFamily === 'system' 
          ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          : design.fontFamily
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Preview Banner */}
        {isPreview && (
          <div className="mb-6">
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                <strong>Preview Mode:</strong> This is how your form will look to respondents. Submissions won&apos;t be saved.
              </AlertDescription>
            </Alert>
          </div>
        )}

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
          <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
          {form.description && (
            <div 
              className="text-gray-600 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: form.description }}
            />
          )}
        </div>

        {/* Progress Bar */}
        {isMultiStep && settings.showProgressBar && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
            </div>
            <Progress 
              value={((currentStep + 1) / steps.length) * 100} 
              className="h-2"
            />
          </div>
        )}

        {/* Form */}
        <Card style={{ borderRadius: `${design.borderRadius}px` }}>
          <CardHeader>
            {isMultiStep && (
              <CardTitle>{steps[currentStep]?.title}</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {currentStepFields.map(renderField)}

              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                {isMultiStep && currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}

                <div className="ml-auto">
                  {isMultiStep && currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={isSubmitting}
                      style={{ backgroundColor: design.primaryColor }}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      style={{ backgroundColor: design.primaryColor }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {settings.submitButtonText || 'Submit'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}