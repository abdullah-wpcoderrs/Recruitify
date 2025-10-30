# Storage Setup Instructions

## Step 1: Run the Storage Setup SQL

You need to execute the SQL commands in `supabase/storage-setup.sql` in your Supabase dashboard.

### How to run:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `hiilrtwkheqxecchojkj`
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire content from `supabase/storage-setup.sql`
6. Click **Run** to execute the SQL

This will create:
- `form-images` bucket (public) - for logos and header images
- `form-uploads` bucket (private) - for form submission files
- Proper storage policies for security
- Helper functions for file access

## Step 2: Verify Storage Buckets

After running the SQL:

1. Go to **Storage** in your Supabase dashboard
2. You should see two new buckets:
   - `form-images` (public)
   - `form-uploads` (private)

## Step 3: Test the Image Upload

1. Start your development server: `npm run dev`
2. Go to the form builder
3. Try uploading a logo or header image using the upload buttons
4. The images should now work properly in the form preview

## Troubleshooting

If you encounter any issues:

1. **Storage policies error**: Make sure you're logged in as an authenticated user
2. **Upload fails**: Check the browser console for error messages
3. **Images don't display**: Verify the bucket was created as public
4. **Permission denied**: Ensure the storage policies were created correctly

## What This Fixes

- ✅ Logo upload button now works
- ✅ Header image upload button now works  
- ✅ Images display properly in form preview
- ✅ Secure file storage with proper access controls
- ✅ Automatic file cleanup when users delete images

The image upload functionality will now:
- Upload files to Supabase Storage
- Generate public URLs for images
- Show image previews
- Allow users to remove uploaded images
- Organize files by user ID for security