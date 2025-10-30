"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, Trash2, Settings, Plus, Minus, Upload } from "lucide-react";
import { FormField, FormDesign } from "./form-builder";
import { useState } from "react";

interface SortableFormFieldProps {
  field: FormField;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onRemove: (id: string) => void;
  design?: FormDesign;
  showNumbers?: boolean;
  fieldIndex?: number;
}

export function SortableFormField({ 
  field, 
  onUpdate, 
  onRemove, 
  design, 
  showNumbers = false, 
  fieldIndex = 0 
}: SortableFormFieldProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const addOption = () => {
    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
    onUpdate(field.id, { options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index) || [];
    onUpdate(field.id, { options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = value;
    onUpdate(field.id, { options: newOptions });
  };

  const renderFieldPreview = () => {
    const baseStyle = {
      borderRadius: `${design?.borderRadius || 2}px`,
      borderColor: design?.primaryColor + '40',
      backgroundColor: design?.backgroundColor || '#ffffff',
      color: design?.textColor || '#171717',
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            disabled
            className="bg-gray-50"
            style={baseStyle}
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            disabled
            className="w-full p-3 border border-gray-100 rounded bg-gray-50 resize-none h-24"
            style={baseStyle}
          />
        );
      case 'select':
        return (
          <select disabled className="w-full p-3 border border-gray-100 rounded bg-gray-50" style={baseStyle}>
            <option>Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'file':
        return (
          <div 
            className="border-2 border-dashed border-gray-100 rounded p-6 text-center bg-gray-50 transition-colors hover:border-gray-200"
            style={{ 
              borderRadius: `${design?.borderRadius || 6}px`,
              borderColor: design?.primaryColor + '20'
            }}
          >
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 10MB</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <button
              {...listeners}
              className="mt-2 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  {showNumbers && (
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center">
                      {fieldIndex + 1}
                    </span>
                  )}
                  <Input
                    value={field.label}
                    onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                    className="font-medium border-none bg-transparent focus:ring-0 p-0 text-sm flex-1"
                    placeholder="Field label"
                  />
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdate(field.id, { required: !field.required })}
                    className={field.required ? "text-primary-600" : "text-gray-400"}
                  >
                    Required
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(field.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {showAdvanced && (
                <div className="space-y-3 p-3 bg-gray-50 rounded">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Placeholder Text</label>
                    <Input
                      value={field.placeholder || ''}
                      onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                      placeholder="Enter placeholder text"
                      className="mt-1 text-sm"
                    />
                  </div>

                  {field.type === 'select' && (
                    <div>
                      <label className="text-xs font-medium text-gray-700">Options</label>
                      <div className="space-y-2 mt-1">
                        {field.options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(index, e.target.value)}
                              className="text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  {field.type === 'file' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700">Accepted File Types</label>
                        <Input
                          value={field.acceptedTypes || '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png'}
                          onChange={(e) => onUpdate(field.id, { acceptedTypes: e.target.value })}
                          placeholder=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                          className="mt-1 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Comma-separated file extensions (e.g., .pdf,.doc,.jpg)
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-700">Maximum File Size (MB)</label>
                        <Input
                          type="number"
                          value={field.maxFileSize || 10}
                          onChange={(e) => onUpdate(field.id, { maxFileSize: parseInt(e.target.value) || 10 })}
                          min="1"
                          max="100"
                          className="mt-1 text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`multiple-${field.id}`}
                          checked={field.allowMultiple || false}
                          onChange={(e) => onUpdate(field.id, { allowMultiple: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor={`multiple-${field.id}`} className="text-xs font-medium text-gray-700">
                          Allow multiple files
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                {renderFieldPreview()}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <span className="capitalize">{field.type}</span>
                  {field.required && <span className="text-red-500">*</span>}
                </div>
                {field.stepId && (
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                    Step field
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}