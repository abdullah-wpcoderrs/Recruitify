"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Palette, Type, Image as ImageIcon } from "lucide-react";
import { FormDesign } from "./form-builder";
import { ImageUpload } from "@/components/ui/image-upload";
import Image from "next/image";

interface FormDesignPanelProps {
  design: FormDesign;
  onDesignChange: (design: FormDesign) => void;
  formTitle: string;
  formDescription: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

const colorPresets = [
  { name: 'Green', value: '#16a34a' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Pink', value: '#db2777' },
];

const fontOptions = [
  { name: 'System Default', value: 'system' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
];

export function FormDesignPanel({ 
  design, 
  onDesignChange, 
  formTitle, 
  formDescription, 
  onTitleChange, 
  onDescriptionChange 
}: FormDesignPanelProps) {
  const updateDesign = (updates: Partial<FormDesign>) => {
    onDesignChange({ ...design, ...updates });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Design Controls */}
      <div className="space-y-6">
        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Type className="w-5 h-5" />
              <span>Form Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="form-title">Form Title</Label>
              <Input
                id="form-title"
                value={formTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Enter form title"
              />
            </div>
            <div>
              <Label htmlFor="form-description">Form Description</Label>
              <div className="mt-2">
                <RichTextEditor
                  content={formDescription}
                  onChange={onDescriptionChange}
                  placeholder="Enter form description (optional). You can format text, add links, and create lists."
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use rich formatting to create professional job descriptions and form instructions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Colors & Branding</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={design.primaryColor}
                  onChange={(e) => updateDesign({ primaryColor: e.target.value })}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  value={design.primaryColor}
                  onChange={(e) => updateDesign({ primaryColor: e.target.value })}
                  placeholder="#16a34a"
                  className="flex-1"
                />
              </div>
              <div className="grid grid-cols-6 gap-2 mt-3">
                {colorPresets.map((color) => (
                  <button
                    key={color.name}
                    className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color.value }}
                    onClick={() => updateDesign({ primaryColor: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="bg-color">Background Color</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  id="bg-color"
                  type="color"
                  value={design.backgroundColor}
                  onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  value={design.backgroundColor}
                  onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="text-color">Text Color</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  id="text-color"
                  type="color"
                  value={design.textColor}
                  onChange={(e) => updateDesign({ textColor: e.target.value })}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  value={design.textColor}
                  onChange={(e) => updateDesign({ textColor: e.target.value })}
                  placeholder="#171717"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography & Layout */}
        <Card>
          <CardHeader>
            <CardTitle>Typography & Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="font-family">Font Family</Label>
              <select
                id="font-family"
                value={design.fontFamily}
                onChange={(e) => updateDesign({ fontFamily: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded bg-white"
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="border-radius">Border Radius (px)</Label>
              <Input
                id="border-radius"
                type="number"
                min="0"
                max="24"
                value={design.borderRadius}
                onChange={(e) => updateDesign({ borderRadius: parseInt(e.target.value) || 6 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="w-5 h-5" />
              <span>Images</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Logo URL</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  value={design.logoUrl || ''}
                  onChange={(e) => updateDesign({ logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="flex-1"
                />
                <ImageUpload
                  value={design.logoUrl}
                  onChange={(url) => updateDesign({ logoUrl: url })}
                  type="logo"
                />
              </div>
            </div>

            <div>
              <Label>Header Image URL</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  value={design.headerImage || ''}
                  onChange={(e) => updateDesign({ headerImage: e.target.value })}
                  placeholder="https://example.com/header.jpg"
                  className="flex-1"
                />
                <ImageUpload
                  value={design.headerImage}
                  onChange={(url) => updateDesign({ headerImage: url })}
                  type="header"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom CSS */}
        <Card>
          <CardHeader>
            <CardTitle>Custom CSS</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={design.customCss || ''}
              onChange={(e) => updateDesign({ customCss: e.target.value })}
              placeholder="/* Add your custom CSS here */
.form-container {
  /* Custom styles */
}"
              rows={6}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 border border-gray-100 rounded-lg"
              style={{
                backgroundColor: design.backgroundColor,
                color: design.textColor,
                borderRadius: `${design.borderRadius}px`,
                fontFamily: design.fontFamily === 'system' 
                  ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  : design.fontFamily
              }}
            >
              {design.logoUrl && (
                <div className="mb-6 relative h-12">
                  {design.logoUrl.startsWith('http') && !design.logoUrl.includes('supabase.co') ? (
                    <img 
                      src={design.logoUrl} 
                      alt="Logo" 
                      className="h-12 object-contain max-w-[200px]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Image 
                      src={design.logoUrl} 
                      alt="Logo" 
                      width={200}
                      height={48}
                      className="h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}

              {design.headerImage && (
                <div className="mb-6 -mx-6 -mt-6 relative h-32">
                  {design.headerImage.startsWith('http') && !design.headerImage.includes('supabase.co') ? (
                    <img 
                      src={design.headerImage} 
                      alt="Header" 
                      className="w-full h-32 object-cover"
                      style={{ borderRadius: `${design.borderRadius}px ${design.borderRadius}px 0 0` }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Image 
                      src={design.headerImage} 
                      alt="Header" 
                      fill
                      className="object-cover"
                      style={{ borderRadius: `${design.borderRadius}px ${design.borderRadius}px 0 0` }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}

              <h2 className="text-2xl font-bold mb-2">{formTitle || 'Form Title'}</h2>
              {formDescription && (
                <div 
                  className="mb-6 opacity-80 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formDescription }}
                />
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sample Field</label>
                  <input
                    type="text"
                    placeholder="This is how your fields will look"
                    className="w-full p-3 border border-gray-100 rounded"
                    style={{
                      borderRadius: `${design.borderRadius}px`,
                      borderColor: design.primaryColor + '40',
                      backgroundColor: design.backgroundColor,
                      color: design.textColor
                    }}
                  />
                </div>

                <button
                  className="w-full py-3 px-6 text-white font-medium rounded transition-colors"
                  style={{
                    backgroundColor: design.primaryColor,
                    borderRadius: `${design.borderRadius}px`
                  }}
                >
                  Submit Application
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {design.customCss && (
          <Card>
            <CardHeader>
              <CardTitle>CSS Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-x-auto">
                <code>{design.customCss}</code>
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}