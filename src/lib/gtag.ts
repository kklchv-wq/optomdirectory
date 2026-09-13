export const GA_MEASUREMENT_ID = 'G-VZ9D5EC6P5';

// Declare global gtag function on window
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Track page views
 */
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

/**
 * Track custom events (searches, profile views, clicks, form submits)
 */
export const trackEvent = ({
  action,
  category,
  label,
  value,
  params,
}: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  params?: Record<string, unknown>;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...params,
    });
  }
};
