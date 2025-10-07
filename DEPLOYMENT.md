# Vitrina Dashboard - Deployment Guide

This guide provides step-by-step instructions for deploying the Vitrina Dashboard to Vercel.

## Prerequisites

1. **Vercel Account**: Create an account at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to a GitHub repository
3. **Neon.tech Database**: Ensure your Neon.tech PostgreSQL database is set up and accessible

## Environment Variables

Before deploying, you'll need to configure the following environment variables in your Vercel project:

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.neon.tech/neondb?sslmode=require"

# Lemlist API Keys
LEMLIST_API_KEY="your_lemlist_api_key_1"
LEMLIST_API_KEY2="your_lemlist_api_key_2"

# NextAuth.js
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="your_secure_nextauth_secret_key_32_chars_plus"

# App URL
NEXT_PUBLIC_APP_URL="https://your-app-name.vercel.app"
```

## Deployment Steps

### Step 1: Prepare Your Repository

1. **Commit all changes** to your local repository:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. **Import your GitHub repository**
4. Select the repository containing your Vitrina Dashboard

### Step 3: Configure Project Settings

1. **Framework Preset**: Vercel should automatically detect Next.js
2. **Root Directory**: Leave as default (root)
3. **Build Command**: `npm run build` (auto-detected)
4. **Install Command**: `npm install` (auto-detected)

### Step 4: Set Environment Variables

1. In the Vercel dashboard, go to your project settings
2. Navigate to **"Environment Variables"**
3. Add each environment variable listed above:
   - Click **"Add"**
   - Enter the **Name** (e.g., `DATABASE_URL`)
   - Enter the **Value** (your actual values)
   - Select **"Production"**, **"Preview"**, and **"Development"**
   - Click **"Save"**

### Step 5: Deploy

1. Click **"Deploy"** to start the deployment process
2. Wait for the build to complete (usually 1-3 minutes)
3. Once deployed, you'll receive a URL like `https://your-app-name.vercel.app`

## Post-Deployment Configuration

### Update Environment Variables

After deployment, update these environment variables with your actual Vercel URL:

```bash
NEXTAUTH_URL="https://your-actual-vercel-url.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-actual-vercel-url.vercel.app"
```

### Database Setup

1. **Ensure your Neon.tech database is accessible** from Vercel's servers
2. **Run database migrations** if needed
3. **Seed the database** with initial users in the `allowedUsers` table

### Test the Application

1. Visit your deployed URL
2. Test the authentication flow
3. Verify data sync functionality
4. Check all dashboard features

## Vercel Configuration

The `vercel.json` file in the project root contains:

- **Build settings** for Next.js optimization
- **Environment variable mappings**
- **API route configurations**
- **CORS headers** for API endpoints

## Custom Domain (Optional)

To use a custom domain:

1. Go to your Vercel project settings
2. Navigate to **"Domains"**
3. Add your custom domain
4. Update DNS settings as instructed
5. Update environment variables with your custom domain

## Monitoring and Analytics

Vercel provides built-in:

- **Performance monitoring**
- **Error tracking**
- **Analytics dashboard**
- **Function logs**

Access these features from your Vercel dashboard.

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation locally

2. **Environment Variable Issues**:
   - Double-check all variable names and values
   - Ensure no trailing spaces in values
   - Redeploy after changing environment variables

3. **Database Connection Issues**:
   - Verify DATABASE_URL format
   - Check Neon.tech database accessibility
   - Ensure SSL is enabled (`sslmode=require`)

4. **Authentication Issues**:
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain
   - Ensure allowed users are in the database

### Support

For deployment support:
- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Review Next.js deployment guide: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **NEXTAUTH_SECRET**: Use a strong, random 32+ character secret
3. **Database Access**: Ensure your Neon.tech database has proper access controls
4. **API Keys**: Rotate Lemlist API keys regularly
5. **CORS**: Review and adjust CORS headers as needed for your domain

## Performance Optimization

Vercel automatically provides:
- **Edge caching** for static assets
- **Serverless functions** for API routes
- **Automatic compression**
- **CDN distribution**

The application is optimized for production with:
- **Code splitting**
- **Image optimization**
- **Static generation** where possible
- **API route optimization**

Your Vitrina Dashboard is now ready for production use!