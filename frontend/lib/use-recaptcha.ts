import { useEffect, useState } from 'react';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
const IS_VALID_KEY = RECAPTCHA_SITE_KEY && !RECAPTCHA_SITE_KEY.includes('your_') && RECAPTCHA_SITE_KEY.length > 10;

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export function useRecaptcha() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Skip if no valid site key
    if (!IS_VALID_KEY) {
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
    if (!IS_VALID_KEY) return null;
    try {
      if (!window.grecaptcha) return null;
      return await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
    } catch {
      return null;
    }
  };

  return { isLoaded, executeRecaptcha };
}
