import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const DEFAULT_IMAGE = `${APP_URL}/og-default.png`;

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/campaigns/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    const c = json.data;

    const title = c.title;
    const description = c.description?.substring(0, 160) || 'Equa platformunda bir kampanya';
    const url = `${APP_URL}/campaigns/${id}`;
    const image = DEFAULT_IMAGE;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'article',
        images: [{ url: image, width: 1200, height: 630, alt: title }],
        siteName: 'Equa',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
      alternates: { canonical: url },
    };
  } catch {
    return {
      title: 'Kampanya | Equa',
      description: 'Equa platformunda haksızlıklara karşı sesini yükselt.',
    };
  }
}

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
