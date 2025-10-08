# JIANKA Travel Agency - Custom Email Templates

This directory contains custom email templates for Supabase authentication emails.

## Templates Included

### 1. Forgot Password Email (`forgot-password.html`)
- Black banner with JIANKA logo in Satoshi font
- Professional password reset interface
- Security information and expiry notice
- Responsive design for mobile devices

### 2. Email Verification (`email-verification.html`)
- Black banner with JIANKA logo in Satoshi font
- Welcome message with company features
- Feature highlights (Cultural Immersion, Culinary Adventures, Architectural Wonders)
- Security information and expiry notice
- Responsive design for mobile devices

## Supabase Configuration

To use these templates in Supabase:

### 1. Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### 2. Configure Forgot Password Template
1. Click on **"Forgot Password"** template
2. Select **"Custom SMTP"** or **"Custom HTML"**
3. Copy the content from `forgot-password.html`
4. Replace `{{ .ConfirmationURL }}` with `{{ .ConfirmationURL }}` (Supabase will automatically replace this)
5. Save the template

### 3. Configure Email Verification Template
1. Click on **"Confirm signup"** template
2. Select **"Custom SMTP"** or **"Custom HTML"**
3. Copy the content from `email-verification.html`
4. Replace `{{ .ConfirmationURL }}` with `{{ .ConfirmationURL }}` (Supabase will automatically replace this)
5. Save the template

### 4. Template Variables
Supabase automatically replaces these variables:
- `{{ .ConfirmationURL }}` - The verification/reset link
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your site URL

### 5. Testing
1. Test the forgot password flow
2. Test the email verification flow
3. Check email rendering on different clients (Gmail, Outlook, Apple Mail)
4. Test mobile responsiveness

## Design Features

### Visual Elements
- **Black Banner**: Matches site aesthetic with subtle texture pattern
- **Satoshi Font**: Premium typography for brand consistency
- **JIANKA Logo**: Prominent branding in the header
- **Gold CTA Buttons**: Matches site color scheme (#cb9f4d)
- **Responsive Design**: Works on all devices

### Content Structure
- **Clear Headlines**: Easy to understand purpose
- **Professional Copy**: Brand-appropriate messaging
- **Security Information**: Clear instructions and warnings
- **Feature Highlights**: Showcases company value proposition
- **Contact Information**: Easy access to support

## Customization

To modify the templates:
1. Edit the HTML files in this directory
2. Update the Supabase templates with new content
3. Test thoroughly before deploying

## Brand Consistency

These templates maintain consistency with:
- Site color scheme (black, gold, white)
- Typography (Satoshi font family)
- Brand messaging and tone
- Visual hierarchy and spacing
- Mobile-first responsive design
