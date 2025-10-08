# Authentication System Setup

This project includes a comprehensive authentication system with the following features:

## Features Implemented

### 🔐 Authentication Pages
- **Login Page** (`/login`) - User login with email/password
- **Signup Page** (`/signup`) - User registration with email verification
- **Forgot Password** (`/forgot-password`) - Password reset via email
- **Reset Password** (`/reset-password`) - New password setup

### 🛡️ Security Features
- **Password Visibility Toggle** - Show/hide passwords on all forms
- **Password Strength Validation** - Enforces strong password requirements
- **reCAPTCHA Integration** - Bot protection on login/signup/forgot password
- **Two-Factor Authentication (2FA)** - Google Authenticator integration

### ⚙️ Account Management
- **Account Settings** (`/account-settings`) - Comprehensive user management
- **Password Change** - Secure password updates
- **2FA Setup** - QR code generation for authenticator apps
- **User Profile** - Display account information

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in your project root with the following variables:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# reCAPTCHA Configuration (for production, replace with your actual site key)
PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Enable Email Authentication in Authentication > Settings
4. Configure your site URL in Authentication > URL Configuration

### 3. reCAPTCHA Setup (Optional)
1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Create a new site with reCAPTCHA v2
3. Add your domain to the site list
4. Replace the test key with your actual site key

### 4. Dependencies
The following packages have been installed:
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Server-side rendering support
- `qrcode` - QR code generation for 2FA
- `@types/qrcode` - TypeScript types
- `speakeasy` - 2FA secret generation
- `@types/speakeasy` - TypeScript types

## Usage

### Navigation Integration
The authentication system is fully integrated with the existing navigation:
- **Login Button** - Shows when user is not authenticated
- **Account Dropdown** - Shows when user is authenticated
  - User email and last login time
  - Account Settings link
  - Logout button

### Account Settings Features
- **Account Information** - Display user details
- **Password Management** - Change password with validation
- **Two-Factor Authentication** - Enable/disable 2FA with QR code setup
- **Account Actions** - Sign out functionality

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## File Structure

```
src/
├── lib/
│   ├── Nav.svelte              # Updated navigation with auth
│   └── supabaseClient.ts       # Supabase client configuration
├── routes/
│   ├── +layout.server.ts       # Server-side auth state
│   ├── +layout.svelte          # Layout with auth integration
│   ├── login/
│   │   └── +page.svelte        # Login page
│   ├── signup/
│   │   └── +page.svelte        # Signup page
│   ├── forgot-password/
│   │   └── +page.svelte        # Forgot password page
│   ├── reset-password/
│   │   └── +page.svelte        # Reset password page
│   ├── account-settings/
│   │   └── +page.svelte        # Account settings page
│   └── auth/
│       └── callback/
│           └── +page.ts        # Auth callback handler
```

## Security Notes

- All authentication is handled server-side through Supabase
- Passwords are never stored locally
- 2FA secrets are stored in user metadata
- reCAPTCHA prevents bot registrations
- Email verification is required for new accounts

## Testing

The system uses test reCAPTCHA keys by default. For production:
1. Replace with your actual reCAPTCHA site key
2. Configure Supabase email templates
3. Set up proper domain restrictions
4. Test all authentication flows

## Support

For issues or questions about the authentication system, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [SvelteKit Documentation](https://kit.svelte.dev)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)
