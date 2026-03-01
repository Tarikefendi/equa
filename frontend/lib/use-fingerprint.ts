import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<any> | null = null;
let cachedFingerprint: string | null = null;

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(cachedFingerprint);
  const [loading, setLoading] = useState(!cachedFingerprint);

  useEffect(() => {
    if (cachedFingerprint) {
      setFingerprint(cachedFingerprint);
      setLoading(false);
      return;
    }

    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }

    fpPromise
      .then(fp => fp.get())
      .then(result => {
        cachedFingerprint = result.visitorId;
        setFingerprint(result.visitorId);
        setLoading(false);
      })
      .catch(error => {
        console.error('Fingerprint error:', error);
        setLoading(false);
      });
  }, []);

  return { fingerprint, loading };
}

export async function getFingerprint(): Promise<string | null> {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  try {
    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }
    const fp = await fpPromise;
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return result.visitorId;
  } catch (error) {
    console.error('Fingerprint error:', error);
    return null;
  }
}
