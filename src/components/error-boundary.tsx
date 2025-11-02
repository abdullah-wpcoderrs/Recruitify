"use client";

import { useEffect } from 'react';

/**
 * Global error handler to suppress Chrome extension errors
 * These errors are caused by browser extensions trying to communicate with the page
 * and don't affect the application functionality
 */
export function ErrorBoundaryHandler() {
  useEffect(() => {
    // Suppress Chrome extension errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      
      // List of error patterns to suppress (Chrome extension related)
      const suppressPatterns = [
        'No tab with id',
        'message channel closed',
        'Extension context invalidated',
        'chrome.runtime',
        'chrome.tabs',
      ];
      
      // Check if error matches any suppression pattern
      const shouldSuppress = suppressPatterns.some(pattern => 
        errorMessage.includes(pattern)
      );
      
      if (shouldSuppress) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
      
      return false;
    };
    
    // Suppress unhandled promise rejections from Chrome extensions
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason || '';
      const reasonStr = typeof reason === 'string' ? reason : String(reason);
      
      const suppressPatterns = [
        'No tab with id',
        'message channel closed',
        'Extension context invalidated',
        'chrome.runtime',
        'chrome.tabs',
      ];
      
      const shouldSuppress = suppressPatterns.some(pattern => 
        reasonStr.includes(pattern)
      );
      
      if (shouldSuppress) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
      
      return false;
    };
    
    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return null;
}
