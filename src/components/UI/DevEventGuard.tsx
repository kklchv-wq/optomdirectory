'use client';

import { useEffect } from 'react';

export default function DevEventGuard() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent Next.js overlay popup for generic browser Event rejections (e.g., cancelled fetches / tile load events)
      if (
        event.reason &&
        (event.reason instanceof Event ||
          (typeof event.reason === 'object' && event.reason.type === 'error') ||
          String(event.reason) === '[object Event]')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
