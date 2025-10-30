# Production Deployment Guide

## Prerequisites

1. Node.js 18+ and npm
2. Supabase account with production project
3. Google Cloud Console project with OAuth and Sheets API configured
4. Domain name (optional but recommended)

## Environment Setup

1. Copy the production environment file:
   ```bash
   cp .env.production .env.local
   ```

2. Update all environment variables with production values:
   - Supabase credentials
   - Google OAuth credentials
   - NextAuth configuration

## Building for Production

1. Install dependencies:
   ```bash
   npm ci
   ```

2. Build the application:
   ```bash
   npm run build:prod
   ```

3. Start the production server:
   ```bash
   npm run start:prod
   ```

## Deployment Options

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with zero configuration

### Docker Deployment
Create a Dockerfile:
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build:prod

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### Traditional Server Deployment
1. Build the application on your server or CI/CD pipeline
2. Copy the `.next` directory and `public` directory to your server
3. Install production dependencies:
   ```bash
   npm ci --only=production
   ```
4. Start the server:
   ```bash
   npm run start:prod
   ```

## Security Considerations

1. Never commit `.env.local` or `.env.production` to version control
2. Use strong, randomly generated secrets for `NEXTAUTH_SECRET`
3. Configure proper CORS settings in Supabase
4. Set up proper Row Level Security (RLS) policies
5. Use HTTPS in production
6. Regularly update dependencies

## Performance Optimization

1. Enable image optimization in Next.js
2. Use CDN for static assets
3. Configure proper caching headers
4. Enable compression in your web server
5. Use a reverse proxy like Nginx for additional performance benefits

## Monitoring and Analytics

1. Set up error tracking (e.g., Sentry)
2. Implement application performance monitoring
3. Configure log aggregation
4. Set up uptime monitoring

## Backup and Recovery

1. Regular database backups
2. Backup environment configurations
3. Document deployment procedures
4. Test recovery procedures regularly