# Security Guidelines

## Logging Best Practices

### ❌ Never Log Sensitive Data
- User passwords or tokens
- Form submission data (names, emails, phone numbers, etc.)
- Internal field IDs or database keys
- API keys or secrets
- Personal identifiable information (PII)

### ✅ Safe to Log
- User IDs (UUIDs are generally safe)
- Form IDs (UUIDs)
- Action types (create, update, delete)
- Timestamps
- Error messages (without sensitive context)
- Performance metrics

### Use the Secure Logger
Always use the `logger` utility from `@/lib/logger` instead of direct console statements:

```typescript
import { logger } from '@/lib/logger';

// ❌ Don't do this
console.log('User data:', userData);
console.log('Form submission:', submissionData);

// ✅ Do this instead
logger.info('User action completed', { userId, action: 'form_submit' });
logger.debug('Analytics calculated', { formId, fieldCount });
```

### Environment-Aware Logging
- Production: Only log errors and critical info
- Development: Allow debug logging
- Client-side: Minimal logging in production

### Data Sanitization
The logger automatically sanitizes context data, only allowing:
- `userId`
- `formId` 
- `action`
- `timestamp`
- `userAgent`

### Error Handling
When logging errors, avoid including sensitive data:

```typescript
// ❌ Don't expose sensitive data in errors
console.error('Submission failed:', submissionData);

// ✅ Log errors safely
logger.error('Form submission failed', { formId, userId });
```

## Code Review Checklist

Before merging code, ensure:
- [ ] No `console.log` statements with sensitive data
- [ ] No `alert()` statements with user data
- [ ] No `JSON.stringify()` of user submissions in logs
- [ ] Error messages don't expose internal system details
- [ ] Debug information is properly gated for development only

## Monitoring

- Regularly audit logs for sensitive data exposure
- Use log analysis tools to detect potential data leaks
- Monitor for console statements in production builds