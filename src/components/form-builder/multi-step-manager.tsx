"use client";

// import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, ArrowRight, ArrowLeft } from "lucide-react";
import { FormStep, FormField } from "./form-builder";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MultiStepManagerProps {
  steps: FormStep[];
  onStepsChange: (steps: FormStep[]) => void;
  fields: FormField[];
  currentStep: string;
  onCurrentStepChange: (stepId: string) => void;
  isMultiStep: boolean;
  onMultiStepToggle: (enabled: boolean) => void;
}

interface SortableStepProps {
  step: FormStep;
  fields: FormField[];
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<FormStep>) => void;
  onDelete: () => void;
}

function SortableStep({ step, fields, isActive, onSelect, onUpdate, onDelete }: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stepFields = fields.filter(field => step.fields.includes(field.id));

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <button
              {...listeners}
              className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            
            <div className="flex-1" onClick={onSelect}>
              <div className="flex items-center justify-between mb-2">
                <Input
                  value={step.title}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdate({ title: e.target.value });
                  }}
                  className="font-medium border-none bg-transparent focus:ring-0 p-0 text-sm"
                  placeholder="Step title"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <Textarea
                value={step.description || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdate({ description: e.target.value });
                }}
                placeholder="Step description (optional)"
                className="text-xs border-none bg-transparent focus:ring-0 p-0 resize-none"
                rows={2}
              />
              
              <div className="mt-2 text-xs text-gray-500">
                {stepFields.length} field{stepFields.length !== 1 ? 's' : ''}
                {stepFields.length > 0 && (
                  <span className="ml-2">
                    ({stepFields.map(f => f.label).join(', ')})
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

export function MultiStepManager({
  steps,
  onStepsChange,
  fields,
  currentStep,
  onCurrentStepChange,
  isMultiStep,
  onMultiStepToggle
}: MultiStepManagerProps) {
  // const [editingStep, setEditingStep] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addStep = () => {
    const newStep: FormStep = {
      id: `step-${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      description: '',
      fields: []
    };
    onStepsChange([...steps, newStep]);
    onCurrentStepChange(newStep.id);
  };

  const updateStep = (stepId: string, updates: Partial<FormStep>) => {
    onStepsChange(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const deleteStep = (stepId: string) => {
    if (steps.length <= 1) return; // Don't delete the last step
    
    const newSteps = steps.filter(step => step.id !== stepId);
    onStepsChange(newSteps);
    
    // If we're deleting the current step, switch to the first step
    if (currentStep === stepId) {
      onCurrentStepChange(newSteps[0]?.id || '');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex(item => item.id === String(active.id));
      const newIndex = steps.findIndex(item => item.id === String(over.id));
      onStepsChange(arrayMove(steps, oldIndex, newIndex));
    }
  };

  const moveFieldToStep = (fieldId: string, targetStepId: string) => {
    // Remove field from all steps first
    const updatedSteps = steps.map(step => ({
      ...step,
      fields: step.fields.filter(id => id !== fieldId)
    }));
    
    // Add field to target step
    const finalSteps = updatedSteps.map(step => 
      step.id === targetStepId 
        ? { ...step, fields: [...step.fields, fieldId] }
        : step
    );
    
    onStepsChange(finalSteps);
  };

  const getUnassignedFields = () => {
    const assignedFieldIds = steps.flatMap(step => step.fields);
    return fields.filter(field => !assignedFieldIds.includes(field.id));
  };

  return (
    <div className="space-y-6">
      {/* Multi-step Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-step Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="multi-step-toggle" className="text-base font-medium">
                Enable Multi-step Form
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Break your form into multiple steps for better user experience
              </p>
            </div>
            <Switch
              id="multi-step-toggle"
              checked={isMultiStep}
              onCheckedChange={onMultiStepToggle}
            />
          </div>
        </CardContent>
      </Card>

      {isMultiStep && (
        <>
          {/* Steps Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Form Steps</CardTitle>
                    <Button onClick={addStep} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {steps.map((step, index) => (
                          <div key={step.id} className="relative">
                            <SortableStep
                              step={step}
                              fields={fields}
                              isActive={currentStep === step.id}
                              onSelect={() => onCurrentStepChange(step.id)}
                              onUpdate={(updates) => updateStep(step.id, updates)}
                              onDelete={() => deleteStep(step.id)}
                            />
                            {index < steps.length - 1 && (
                              <div className="flex justify-center my-2">
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>
            </div>

            {/* Field Assignment */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Field Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Step Fields */}
                  <div>
                    <Label className="text-sm font-medium">
                      Fields in {steps.find(s => s.id === currentStep)?.title || 'Current Step'}
                    </Label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {fields
                        .filter(field => steps.find(s => s.id === currentStep)?.fields.includes(field.id))
                        .map((field) => (
                          <div key={field.id} className="flex items-center justify-between p-2 bg-primary-50 rounded text-sm">
                            <span>{field.label}</span>
                            <select
                              value={currentStep}
                              onChange={(e) => moveFieldToStep(field.id, e.target.value)}
                              className="text-xs border rounded px-2 py-1"
                            >
                              {steps.map((step) => (
                                <option key={step.id} value={step.id}>
                                  {step.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Unassigned Fields */}
                  {getUnassignedFields().length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Unassigned Fields</Label>
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                        {getUnassignedFields().map((field) => (
                          <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span>{field.label}</span>
                            <select
                              value=""
                              onChange={(e) => moveFieldToStep(field.id, e.target.value)}
                              className="text-xs border rounded px-2 py-1"
                            >
                              <option value="">Assign to step...</option>
                              {steps.map((step) => (
                                <option key={step.id} value={step.id}>
                                  {step.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step Navigation Preview */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Navigation Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" disabled>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    
                    <div className="flex space-x-2">
                      {steps.map((step) => (
                        <div
                          key={step.id}
                          className={`w-3 h-3 rounded-full ${
                            step.id === currentStep 
                              ? 'bg-primary-600' 
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <Button size="sm">
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}