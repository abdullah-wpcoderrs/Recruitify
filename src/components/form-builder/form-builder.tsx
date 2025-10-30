"use client";

import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Type, Mail, Phone, FileText, List, Upload, Settings, Palette, Eye, Layers, Save, Loader2, Globe, Share } from "lucide-react";
import { SortableFormField } from "./sortable-form-field";
import { FormDesignPanel } from "./form-design-panel";
import { FormSettingsPanel } from "./form-settings-panel";
import { MultiStepManager } from "./multi-step-manager";
import { useAuth } from "@/contexts/auth-context";
import { createForm, updateForm, getForm } from "@/lib/database";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { debounce } from "lodash";
import Link from "next/link";

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  stepId?: string;
  // File upload specific properties
  acceptedTypes?: string;
  maxFileSize?: number;
  allowMultiple?: boolean;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: string[];
}

export interface FormDesign {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontFamily: string;
  logoUrl?: string;
  headerImage?: string;
  customCss?: string;
}

export interface FormSettings {
  isMultiStep: boolean;
  showProgressBar: boolean;
  allowSaveAndContinue: boolean;
  requireAllFields: boolean;
  showFieldNumbers: boolean;
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  emailNotifications: boolean;
  notificationEmail?: string;
  collectAnalytics: boolean;
  customSlug?: string;
  maxSubmissions?: number;
  closeDate?: string;
  requireLogin?: boolean;
  // File upload default settings
  defaultFileTypes?: string;
  defaultMaxFileSize?: number;
  defaultAllowMultiple?: boolean;
}

const fieldTypes = [
  { type: 'text' as const, label: 'Text Input', icon: Type },
  { type: 'email' as const, label: 'Email', icon: Mail },
  { type: 'phone' as const, label: 'Phone', icon: Phone },
  { type: 'textarea' as const, label: 'Text Area', icon: FileText },
  { type: 'select' as const, label: 'Dropdown', icon: List },
  { type: 'file' as const, label: 'File Upload', icon: Upload },
];

export function FormBuilder() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [steps, setSteps] = useState<FormStep[]>([
    { id: 'step-1', title: 'Step 1', description: 'Basic Information', fields: [] }
  ]);
  const [currentStep, setCurrentStep] = useState('step-1');
  const [formTitle, setFormTitle] = useState("Untitled Form");
  const [formDescription, setFormDescription] = useState("");
  const [activeTab, setActiveTab] = useState("build");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editFormId = searchParams.get('edit');
  
  const [design, setDesign] = useState<FormDesign>({
    primaryColor: '#16a34a',
    backgroundColor: '#ffffff',
    textColor: '#171717',
    borderRadius: 6,
    fontFamily: 'system',
  });

  const [settings, setSettings] = useState<FormSettings>({
    isMultiStep: false,
    showProgressBar: true,
    allowSaveAndContinue: false,
    requireAllFields: false,
    showFieldNumbers: false,
    submitButtonText: 'Submit Application',
    successMessage: 'Thank you for your application!',
    emailNotifications: false,
    collectAnalytics: true,
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `${fieldTypes.find(f => f.type === type)?.label} Field`,
      placeholder: '',
      required: false,
      options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
      stepId: settings.isMultiStep ? currentStep : undefined,
      // Add default file upload settings for file fields
      ...(type === 'file' && {
        acceptedTypes: settings.defaultFileTypes || '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png',
        maxFileSize: settings.defaultMaxFileSize || 10,
        allowMultiple: settings.defaultAllowMultiple || false,
      }),
    };
    setFields([...fields, newField]);
    
    // Add field to current step if multi-step is enabled
    if (settings.isMultiStep) {
      setSteps(steps.map(step => 
        step.id === currentStep 
          ? { ...step, fields: [...step.fields, newField.id] }
          : step
      ));
    }
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
    // Remove from steps
    setSteps(steps.map(step => ({
      ...step,
      fields: step.fields.filter(fieldId => fieldId !== id)
    })));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === String(active.id));
        const newIndex = items.findIndex(item => item.id === String(over.id));

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const getCurrentStepFields = () => {
    if (!settings.isMultiStep) return fields;
    const step = steps.find(s => s.id === currentStep);
    return fields.filter(field => step?.fields.includes(field.id));
  };

  const updateSettings = (newSettings: Partial<FormSettings>) => {
    setSettings({ ...settings, ...newSettings });
    
    // If switching to multi-step, ensure we have at least one step
    if (newSettings.isMultiStep && steps.length === 0) {
      setSteps([{ id: 'step-1', title: 'Step 1', description: 'Basic Information', fields: [] }]);
      setCurrentStep('step-1');
    }
  };

  // Load existing form if editing
  useEffect(() => {
    const loadForm = async () => {
      if (editFormId && user) {
        setLoading(true);
        const { data, error } = await getForm(editFormId);
        
        if (error) {
          console.error('Error loading form:', error);
          return;
        }
        
        if (data) {
          interface LoadedFormData {
            id: string;
            title: string;
            description?: string;
            fields?: FormField[];
            is_published?: boolean;
            branding?: {
              design?: FormDesign;
              settings?: FormSettings;
              steps?: FormStep[];
            };
          }
          const formData = data as unknown as LoadedFormData;
          setFormId(formData.id);
          setFormTitle(formData.title);
          setFormDescription(formData.description || "");
          setFields(formData.fields || []);
          setIsPublished(formData.is_published || false);
          
          // Load branding data
          if (formData.branding) {
            if (formData.branding.design) setDesign(formData.branding.design);
            if (formData.branding.settings) setSettings(formData.branding.settings);
            if (formData.branding.steps) setSteps(formData.branding.steps);
          }
        }
        setLoading(false);
      }
    };
    
    loadForm();
  }, [editFormId, user]);

  const saveForm = async (showToast = true) => {
    if (!user) {
      toast.error('No user found. Please sign in again.');
      return;
    }
    
    setSaving(true);
    
    try {
      if (formId) {
        // Update existing form
        const { error } = await updateForm(formId, {
          title: formTitle,
          description: formDescription,
          fields,
          steps: settings.isMultiStep ? steps : undefined,
          design,
          settings,
          custom_slug: settings.customSlug,
        });
        
        if (error) throw error;
        if (showToast) toast.success('Form updated successfully');
      } else {
        // Create new form
        const formData = {
          title: formTitle,
          description: formDescription,
          fields,
          steps: settings.isMultiStep ? steps : undefined,
          design,
          settings,
          user_id: user.id,
        };
        
        const { data, error } = await createForm(formData);
        
        if (error) throw error;
        
        if (data) {
          const createdForm = data as unknown as { id: string };
          setFormId(createdForm.id);
          router.replace(`/builder?edit=${createdForm.id}`);
          if (showToast) toast.success('Form created successfully');
        }
      }
    } catch (error: unknown) {
      console.error('Error saving form:', error);
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save function with debouncing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const autoSaveForm = useCallback(
    debounce(async () => {
      if (!user || !formTitle.trim()) return;
      
      setAutoSaving(true);
      try {
        await saveForm(false); // Don't show toast for auto-save
      } finally {
        setAutoSaving(false);
      }
    }, 2000),
    [user, formTitle, formDescription, fields, design, settings, steps, formId]
  );

  // Trigger auto-save when form data changes
  useEffect(() => {
    if (formId && user) {
      autoSaveForm();
    }
  }, [formTitle, formDescription, fields, design, settings, steps, autoSaveForm, formId, user]);

  const togglePublish = async () => {
    if (!formId) {
      // Save form first if it doesn't exist
      await saveForm();
      if (!formId) return;
    }

    setPublishing(true);
    
    try {
      const { error } = await updateForm(formId, {
        is_published: !isPublished,
      });
      
      if (error) throw error;
      
      const newPublishState = !isPublished;
      setIsPublished(newPublishState);
      
      if (newPublishState) {
        toast.success('Form published successfully! Share your form with the world.');
      } else {
        toast.success('Form unpublished. It\'s no longer accessible to the public.');
      }
    } catch (error: unknown) {
      console.error('Error toggling publish status:', error);
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to update publish status');
    } finally {
      setPublishing(false);
    }
  };

  const getPublicUrl = () => {
    if (!formId) return '';
    const slug = settings.customSlug || formId;
    return `${window.location.origin}/forms/${slug}`;
  };

  const openPreview = () => {
    if (!formId) {
      toast.error('Please save the form first to preview it');
      return;
    }
    
    // Create a preview URL with a special parameter
    const previewUrl = `${getPublicUrl()}?preview=true`;
    window.open(previewUrl, '_blank', 'width=800,height=900,scrollbars=yes,resizable=yes');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-xl font-bold text-primary-600">Recruitify</span>
              </Link>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center space-x-3">
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  onBlur={() => {
                    if (formId && formTitle.trim()) {
                      autoSaveForm();
                    }
                  }}
                  className="text-lg font-semibold border-none bg-transparent focus:ring-0 focus:bg-white focus:border focus:border-primary-200 rounded px-2 py-1 max-w-md transition-all"
                  placeholder="Enter form title..."
                />
                
                {autoSaving && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Saving...
                  </div>
                )}
                
                {settings.isMultiStep && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Multi-step Form
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={openPreview}
                disabled={!formId}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Form
              </Button>
              
              {formId && isPublished && (
                <Button
                  variant="outline"
                  onClick={() => window.open(getPublicUrl(), '_blank')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  View Live Form
                </Button>
              )}
              
              <Button onClick={() => saveForm()} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {formId ? 'Update Form' : 'Save Form'}
                  </>
                )}
              </Button>

              <Button
                onClick={togglePublish}
                disabled={publishing || (!formId && !saving)}
                variant={isPublished ? "outline" : "default"}
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isPublished ? 'Unpublishing...' : 'Publishing...'}
                  </>
                ) : isPublished ? (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Share className="w-4 h-4 mr-2" />
                    Publish Form
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="build" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Build</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Design</span>
            </TabsTrigger>
            <TabsTrigger value="steps" className="flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <span>Steps</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="build" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Field Types Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Form Fields</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {fieldTypes.map((fieldType) => {
                      const Icon = fieldType.icon;
                      return (
                        <Button
                          key={fieldType.type}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addField(fieldType.type)}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {fieldType.label}
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>

                {settings.isMultiStep && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Current Step</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {steps.map((step) => (
                          <Button
                            key={step.id}
                            variant={currentStep === step.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => setCurrentStep(step.id)}
                          >
                            {step.title}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Form Builder Area */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {settings.isMultiStep 
                        ? `${steps.find(s => s.id === currentStep)?.title || 'Form Preview'}`
                        : 'Form Preview'
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4" style={{ 
                      backgroundColor: design.backgroundColor,
                      color: design.textColor,
                      borderRadius: `${design.borderRadius}px`
                    }}>
                      <div className="p-6">
                        <h2 className="text-2xl font-bold mb-2">{formTitle}</h2>
                        {formDescription && (
                          <div 
                            className="text-gray-600 mb-6 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: formDescription }}
                          />
                        )}
                        
                        {getCurrentStepFields().length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No fields added yet. Add fields from the sidebar to get started.</p>
                          </div>
                        ) : (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext items={getCurrentStepFields().map(f => f.id)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-4">
                                {getCurrentStepFields().map((field) => (
                                  <SortableFormField
                                    key={field.id}
                                    field={field}
                                    onUpdate={updateField}
                                    onRemove={removeField}
                                    design={design}
                                    showNumbers={settings.showFieldNumbers}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="design">
            <FormDesignPanel 
              design={design} 
              onDesignChange={setDesign}
              formTitle={formTitle}
              formDescription={formDescription}
              onTitleChange={setFormTitle}
              onDescriptionChange={setFormDescription}
            />
          </TabsContent>

          <TabsContent value="steps">
            <MultiStepManager
              steps={steps}
              onStepsChange={setSteps}
              fields={fields}
              currentStep={currentStep}
              onCurrentStepChange={setCurrentStep}
              isMultiStep={settings.isMultiStep}
              onMultiStepToggle={(enabled) => updateSettings({ isMultiStep: enabled })}
            />
          </TabsContent>

          <TabsContent value="settings">
            <FormSettingsPanel 
              settings={settings} 
              onSettingsChange={updateSettings}
              formId={formId || undefined}
              formFields={fields}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}