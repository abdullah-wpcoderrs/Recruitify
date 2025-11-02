# Custom Slug Usage Guide

## Overview
Custom slugs allow you to create memorable, branded URLs for your forms instead of using UUIDs.

## Examples

### Without Custom Slug (UUID)
```
https://yoursite.com/forms/26a863b7-0839-45f8-b1c0-8b90eefc2b57
```

### With Custom Slug
```
https://yoursite.com/forms/software-engineer-application
https://yoursite.com/forms/summer-internship-2024
https://yoursite.com/forms/contact-us
```

## How It Works

The `getForm()` function now supports both custom slugs and UUIDs:

1. **First**, it tries to find a form by custom_slug
2. **If not found**, it falls back to searching by UUID (id)

This means:
- Old UUID links continue to work
- New custom slug links work automatically
- No breaking changes for existing forms

## Setting a Custom Slug

### Option 1: In Form Settings (UI)
1. Open your form in the builder
2. Go to Settings tab
3. Enter a custom slug in the "Custom URL Slug" field
4. Save the form

### Option 2: Directly in Database
```sql
UPDATE forms 
SET custom_slug = 'my-custom-slug' 
WHERE id = 'your-form-uuid';
```

## Custom Slug Rules

### Valid Slugs
- ✅ `software-engineer-application`
- ✅ `summer-internship-2024`
- ✅ `contact_us`
- ✅ `apply-now`

### Invalid Slugs
- ❌ `Software Engineer Application` (spaces not allowed)
- ❌ `apply/now` (slashes not allowed)
- ❌ `form#1` (special characters not allowed)

### Best Practices
- Use lowercase letters
- Use hyphens (-) or underscores (_) to separate words
- Keep it short and memorable
- Make it descriptive of the form's purpose
- Avoid special characters

## Technical Implementation

### Database Schema
```sql
ALTER TABLE forms 
ADD COLUMN custom_slug TEXT UNIQUE;

CREATE INDEX idx_forms_custom_slug ON forms(custom_slug);
```

### Code Implementation
```typescript
export const getForm = async (formId: string) => {
  // Try to get by custom slug first
  let { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('custom_slug', formId)
    .maybeSingle();

  // If not found by custom slug, try by ID
  if (!data && !error) {
    const result = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();
    
    data = result.data;
    error = result.error;
  }

  return { data, error };
};
```

## Testing Custom Slugs

### Test 1: Access by Custom Slug
```
GET /forms/my-custom-slug
```
Should load the form with custom_slug = 'my-custom-slug'

### Test 2: Access by UUID (Backward Compatibility)
```
GET /forms/26a863b7-0839-45f8-b1c0-8b90eefc2b57
```
Should still work for forms without custom slugs

### Test 3: Uniqueness
```sql
-- This should fail (duplicate custom_slug)
UPDATE forms SET custom_slug = 'existing-slug' WHERE id = 'form-2';
```

## Troubleshooting

### Form Not Loading with Custom Slug

**Check 1: Verify custom_slug exists**
```sql
SELECT id, title, custom_slug 
FROM forms 
WHERE custom_slug = 'your-slug';
```

**Check 2: Verify column exists**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'forms' AND column_name = 'custom_slug';
```

**Check 3: Check for typos**
- Custom slugs are case-sensitive
- Ensure no extra spaces or special characters

### Duplicate Slug Error

If you get a unique constraint violation:
```sql
-- Find the conflicting form
SELECT id, title, custom_slug 
FROM forms 
WHERE custom_slug = 'your-slug';

-- Change one of them
UPDATE forms 
SET custom_slug = 'your-slug-2' 
WHERE id = 'form-id';
```

## Migration Status

To check if the custom_slug migration has been applied:

```sql
-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'forms' AND column_name = 'custom_slug';

-- Check if index exists
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'forms' AND indexname = 'idx_forms_custom_slug';
```

If not applied, run: `supabase/migration-add-missing-columns.sql`