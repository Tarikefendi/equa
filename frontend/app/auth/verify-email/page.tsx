'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Doğrulama token\'ı bulunamadı');
      return;
    }
    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response: any = await api.verifyEmail(token);
      if (response.success) {
        setStatus('success');
        setMessage('Email adresiniz başarıyla doğrulandı!');
        setTimeout(() => router.push('/'), 3000);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Email doğrulama başarısız');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Doğrulanıyor...</h1>
            <p className="text-gray-600">Lütfen bekleyin</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">Başarılı!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Ana sayfaya yönlendiriliyorsunuz...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Hata!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Ana Sayfaya Dön
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<div className="text-center py-16 text-gray-500">Yükleniyor...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
