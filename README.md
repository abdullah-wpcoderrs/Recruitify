# Recruitify - Form Creation Tool

A modern, drag-and-drop form builder for recruitment teams to create custom job application forms with Google Sheets integration.

## Features

### 🎨 **Advanced Design System**
- Custom color palettes with live preview
- Typography and font selection
- Logo and header image support
- Custom CSS injection
- 6px border radius design system with very faint gray borders
- Real-time design preview

### 🔧 **Powerful Form Builder**
- Drag & drop interface with 6 field types
- Advanced field configuration
- Field validation and requirements
- Conditional field display
- Field numbering options

### 📋 **Multi-Step Forms**
- Create complex multi-step workflows
- Visual step management
- Progress bar indicators
- Field assignment between steps
- Save and continue functionality

### ⚙️ **Comprehensive Settings**
- Form behavior customization
- Submit button and success message configuration
- Email notifications
- Analytics and tracking options
- Form limits and scheduling
- Security and privacy controls

### 📊 **Advanced Analytics Dashboard**
- Comprehensive form performance metrics
- Response analytics with interactive charts
- Individual response management and filtering
- Export functionality (CSV, Excel, PDF)
- Drop-off analysis and completion tracking
- Real-time submission trends

### 📊 **Google Sheets Integration**
- **OAuth 2.0 Authentication** - Secure Google account connection
- **Create New Spreadsheets** - Automatic creation with form headers
- **Connect Existing Sheets** - Link forms to existing Google Sheets
- **Real-time Data Sync** - Form submissions automatically sync to sheets
- **Sheet Management** - View, sync, disconnect, and manage spreadsheets
- **URL/ID Support** - Connect using full URLs or spreadsheet IDs
- **Permission Validation** - Automatic access and permission checking
- **Token Refresh** - Automatic handling of expired tokens
- **Error Handling** - Comprehensive error handling and user feedback
- **Direct Sheet Access** - One-click opening of Google Sheets

### 🎛️ **Dashboard Views**
- Toggle between List and Grid view
- Clickable form cards with quick actions
- Performance metrics at a glance
- Direct navigation to analytics

### 🔐 **Authentication & Security**
- **Email/password authentication** with Supabase Auth
- **Protected routes** with automatic redirects
- **User session management** with React Context
- **Row-level security** policies in database
- **Secure form ownership** - users only see their own forms
- **Privacy-compliant** data handling

### 📱 **Public Form Experience**
- **Dynamic Form Rendering** - Public forms at `/forms/[id]` URLs
- **Multi-step Support** - Progress bars and step navigation
- **Custom Branding** - Forms reflect user's design choices
- **Form Validation** - Real-time validation with error messages
- **Mobile Responsive** - Perfect experience on all devices
- **Submission Handling** - Automatic database and Google Sheets sync
- **Success Pages** - Customizable thank you messages and redirects

### 🚀 **Publishing & Sharing**
- **Publish/Unpublish** - Control form availability with one click
- **Public URLs** - Shareable links for form distribution
- **Copy to Clipboard** - Easy URL sharing from dashboard
- **Live Preview** - View published forms directly from builder
- **SEO Friendly** - Dynamic meta tags for shared forms

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom green theme
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with Google OAuth
- **Form Builder**: @dnd-kit for drag and drop
- **UI Components**: Custom components with Radix UI primitives
- **Google Integration**: Google Sheets API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Cloud Console project (for OAuth and Sheets API)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd recruitify
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Update `.env.local` with your Supabase credentials

4. **Configure Google OAuth**
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Update `.env.local` with client ID and secret

5. **Configure Google Sheets API**
   - Enable Google Sheets API in Google Cloud Console
   - Create a service account
   - Download the JSON key file
   - Update `.env.local` with service account credentials

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
recruitify/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── builder/           # Form builder page
│   │   ├── forms/[id]/        # Public form pages
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── form-builder/      # Form builder components
│   │   └── ui/                # Reusable UI components
│   └── lib/                   # Utilities and configurations
├── supabase/
│   └── schema.sql             # Database schema
└── public/                    # Static assets
```

## Development Plan

### Phase 1: Foundation ✅
- [x] Project setup with Next.js and TypeScript
- [x] Tailwind CSS configuration with green theme (6px border radius)
- [x] Comprehensive UI component library
- [x] Dashboard layout with stats cards and view toggles

### Phase 2: Form Builder ✅
- [x] Drag and drop form builder interface
- [x] Field types (text, email, phone, textarea, select, file)
- [x] Real-time form preview
- [x] Advanced field configuration and validation
- [x] Multi-step form support
- [x] Comprehensive design system
- [x] Form settings and behavior controls

### Phase 3: Database & Auth ✅
- [x] Supabase integration with TypeScript types
- [x] Email/password authentication system
- [x] User profiles and session management
- [x] Protected routes and auth context
- [x] Database schema with RLS policies
- [x] Form CRUD operations with real-time data
- [x] Form builder save/edit functionality
- [x] Real-time dashboard analytics from database

### Phase 4: Google Sheets Integration ✅
- [x] Google OAuth 2.0 authentication flow
- [x] Google Sheets API integration with full CRUD operations
- [x] Automatic spreadsheet creation with form headers
- [x] Real-time data synchronization to sheets
- [x] Sheet preview and connection management
- [x] Token refresh and error handling
- [x] Integrated sheet viewer in analytics dashboard

### Phase 5: Analytics & Views ✅
- [x] Comprehensive form analytics dashboard
- [x] Response analytics with charts and visualizations
- [x] Individual response management
- [x] Export functionality (CSV, Excel, PDF)
- [x] Dashboard view toggle (List/Grid view)
- [x] Clickable form cards with analytics navigation

### Phase 6: Public Forms ✅
- [x] Dynamic public form pages (`/forms/[id]`)
- [x] Multi-step form rendering with progress bars
- [x] Form submission handling and validation
- [x] Real-time Google Sheets synchronization
- [x] Publish/unpublish functionality
- [x] Public URL sharing and copying
- [x] Custom form styling and branding
- [x] Success pages and redirects
- [ ] File upload functionality (next enhancement)

### Phase 7: Advanced Features (Future)
- [ ] Custom domain support
- [ ] Email notifications
- [ ] Form templates
- [ ] AI-powered form optimization

## 🚀 Production Deployment

This application is ready for production deployment. Follow the steps in [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Deployment Options

1. **Vercel** (Recommended): Connect your repository to Vercel for automatic deployments
2. **Docker**: Use the provided Dockerfile for containerized deployment
3. **Traditional Server**: Deploy to any Node.js hosting provider

### Production Checklist

- [x] Environment configuration files
- [x] Security headers
- [x] Performance optimizations
- [x] Docker support
- [x] Standalone builds
- [x] Deployment documentation

### Long-term Goals
3. **Production Deployment**
   - Environment configuration ✅
   - Performance optimization ✅
   - Security hardening ✅

## Design System

The application uses a consistent green color palette with 2px border radius:

- **Primary Colors**: Green shades from 50 to 950
- **Border Radius**: 6px default for all components with very faint gray borders
- **Typography**: System font stack for optimal readability
- **Spacing**: Consistent 4px grid system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.