import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getCurrentUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fieldId = formData.get('fieldId') as string;
    const formId = formData.get('formId') as string;

    if (!file || !fieldId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `form-uploads/${user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('form-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('form-files')
      .getPublicUrl(filePath);

    // Save file record to database (if formId is provided)
    if (formId) {
      const fileRecord = {
        form_id: formId,
        field_id: fieldId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filePath,
        public_url: publicUrl,
        uploaded_by: user.id,
      };
      
      const { error: dbError } = await supabase
        .from('form_files')
        .insert(fileRecord as never);

      if (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the upload if database save fails
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        id: uploadData.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getCurrentUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }

    // Check if user owns the file (path should start with their user ID)
    if (!filePath.startsWith(`form-uploads/${user.id}/`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('form-files')
      .remove([filePath]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('form_files')
      .delete()
      .eq('storage_path', filePath)
      .eq('uploaded_by', user.id);

    if (dbError) {
      console.error('Database delete error:', dbError);
      // Don't fail if database delete fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}