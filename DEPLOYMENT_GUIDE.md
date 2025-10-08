# 🚀 Vercel Deployment Guide

## Prerequisites
1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Push your code to GitHub
3. **Supabase Project** - Set up your Supabase project

## Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Add authentication system with 2FA"

# Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/jianka-travel-agency.git

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect SvelteKit
5. Click "Deploy"

### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? jianka-travel-agency
# - Directory? ./
# - Override settings? No
```

## Step 3: Configure Environment Variables

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:

```
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

## Step 4: Update Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to Authentication > URL Configuration
3. Add your Vercel domain to:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: 
     - `https://your-project.vercel.app/auth/callback`
     - `https://your-project.vercel.app/reset-password`

## Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Test the authentication flow:
   - Sign up
   - Verify email
   - Login
   - Account settings
   - 2FA setup

## Troubleshooting

### Common Issues:

1. **Build Errors**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript errors are resolved

2. **Environment Variables**
   - Make sure all required variables are set in Vercel
   - Redeploy after adding new variables

3. **Supabase Connection**
   - Verify your Supabase URL and keys
   - Check that your domain is whitelisted

4. **reCAPTCHA Issues**
   - Update your reCAPTCHA site key for production
   - Add your Vercel domain to reCAPTCHA settings

## Benefits of Vercel Deployment:

✅ **Consistent URL** - No more port changes  
✅ **HTTPS by default** - Required for Supabase auth  
✅ **Global CDN** - Fast loading worldwide  
✅ **Automatic deployments** - Updates on every push  
✅ **Environment management** - Secure variable storage  
✅ **Easy debugging** - Built-in logs and analytics  

## Next Steps After Deployment:

1. **Test all features** on the live site
2. **Set up custom domain** (optional)
3. **Configure monitoring** and analytics
4. **Set up CI/CD** for automatic deployments

Your authentication system will work perfectly on Vercel! 🎉
