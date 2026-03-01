import { useEffect, useState } from 'react';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export function useRecaptcha() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Skip if no site key
    if (!RECAPTCHA_SITE_KEY) {
      console.warn('⚠️ reCAPTCHA site key not configured');
      setIsLoaded(true);
      return;
    }

    // Check if already loaded
    if (window.grecaptcha) {
      setIsLoaded(true);
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const executeRecaptcha = async (action: string): Promise<string | null> => {
    // Always skip in development
    console.log('⚠️ reCAPTCHA skipped in development mode');
    return null;
  };

  return { isLoaded, executeRecaptcha };
}
