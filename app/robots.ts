import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://dualrhythmsystems.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/sign-in', '/sign-up'],
        disallow: ['/agent', '/admin', '/api', '/dashboard', '/board-rhythm'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
