# Production Deployment Checklist

## Pre-deployment

### Environment Configuration
- [ ] Create production Supabase project
- [ ] Apply database schema (`supabase/schema.sql`)
- [ ] Apply analytics migration (`supabase/migration-analytics-fields.sql`)
- [ ] Configure Row Level Security policies
- [ ] Set up Google Cloud project
- [ ] Enable Google Sheets API
- [ ] Create OAuth 2.0 credentials
- [ ] Configure redirect URIs for production domain
- [ ] Update `.env.production` with all required variables
- [ ] Verify all environment variables are set correctly

### Code Review
- [ ] Remove any development-only code or console.logs
- [ ] Verify all API endpoints use proper authentication
- [ ] Check that error handling is appropriate for production
- [ ] Ensure all secrets are properly managed
- [ ] Review security headers and CORS settings

### Performance Optimization
- [ ] Verify image optimization settings
- [ ] Check bundle sizes and optimize if necessary
- [ ] Ensure proper caching headers
- [ ] Verify compression is enabled
- [ ] Test on different devices and network conditions

### Testing
- [ ] Run all unit tests
- [ ] Perform end-to-end testing
- [ ] Test authentication flows
- [ ] Test Google Sheets integration
- [ ] Test form submission and analytics
- [ ] Test error scenarios
- [ ] Verify mobile responsiveness

## Deployment

### Infrastructure
- [ ] Set up production domain
- [ ] Configure SSL certificate
- [ ] Set up CDN if needed
- [ ] Configure load balancing if required
- [ ] Set up monitoring and alerting
- [ ] Configure backup procedures
- [ ] Set up log aggregation

### Application Deployment
- [ ] Build application with production settings
- [ ] Deploy to production environment
- [ ] Verify environment variables are correctly set
- [ ] Test all critical user flows
- [ ] Monitor application performance
- [ ] Check error logs for any issues

## Post-deployment

### Monitoring
- [ ] Verify monitoring is working correctly
- [ ] Set up uptime monitoring
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Configure security monitoring

### Security
- [ ] Verify SSL certificate is valid
- [ ] Test security headers
- [ ] Verify authentication is working correctly
- [ ] Check for any security vulnerabilities
- [ ] Review access controls

### Analytics
- [ ] Verify analytics tracking is working
- [ ] Set up conversion tracking
- [ ] Configure user behavior analytics
- [ ] Set up funnel analysis

## Ongoing Maintenance

### Regular Tasks
- [ ] Monitor application performance
- [ ] Review and rotate secrets定期
- [ ] Update dependencies regularly
- [ ] Review security patches
- [ ] Backup database regularly
- [ ] Monitor error rates
- [ ] Review user feedback

### Scaling Considerations
- [ ] Monitor resource usage
- [ ] Plan for traffic spikes
- [ ] Consider database scaling
- [ ] Plan for storage growth
- [ ] Consider geographic distribution