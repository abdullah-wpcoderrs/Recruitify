# Supabase Setup Guide

Follow these steps to set up Supabase for your Recruitify application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: recruitify
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **service_role** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

## 3. Update Environment Variables

Update your `.env.local` file with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 4. Run Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New query"
3. Copy and paste the contents of `supabase/schema.sql`
4. Click "Run" to execute the schema

## 4.1. Fix Existing Users (If Applicable)

If you have existing users without profiles:

1. In **SQL Editor**, create another new query
2. Copy and paste the contents of `supabase/migration-fix-profiles.sql`
3. Click "Run" to create missing profiles

## 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000/auth`
4. Enable **Email confirmations** if desired
5. Configure **Email templates** (optional)

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. You should be redirected to `/auth`
4. Try creating an account
5. Check the **Authentication** → **Users** tab in Supabase to see your new user

## 7. Database Tables Created

The schema creates these tables:

- **profiles**: User profiles extending Supabase auth
- **forms**: Form definitions with fields, design, and settings
- **form_submissions**: Form submission data

## 8. Row Level Security (RLS)

The schema includes RLS policies that ensure:
- Users can only see their own forms
- Users can only see submissions for their forms
- Public can view published forms
- Public can submit to published forms

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Double-check your environment variables
2. **"Row Level Security policy violation"**: Make sure you're authenticated
3. **"relation does not exist"**: Run the database schema
4. **Email not confirmed**: Check your email or disable email confirmation

### Useful Supabase Dashboard Sections:

- **Table Editor**: View and edit data directly
- **SQL Editor**: Run custom queries
- **Authentication**: Manage users and settings
- **Logs**: Debug API calls and errors