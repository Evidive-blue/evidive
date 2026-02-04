import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale, isValidLocale } from '@/lib/i18n/config';

// Paths that should not be processed by the middleware
const publicPaths = [
  '/api',
  '/_next',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
  '/og-image.jpg',
  '/evidive-logo.png',
  '/site.webmanifest',
];

function getLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  return isValidLocale(potentialLocale) ? potentialLocale : null;
}

function getPreferredLocale(request: NextRequest): string {
  // Check cookie first
  const localeCookie = request.cookies.get('NEXT_LOCALE');
  if (localeCookie && isValidLocale(localeCookie.value)) {
    return localeCookie.value;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const [code, priority = '1'] = lang.trim().split(';q=');
        return {
          code: code.split('-')[0].toLowerCase(),
          priority: parseFloat(priority),
        };
      })
      .sort((a, b) => b.priority - a.priority);

    for (const lang of languages) {
      if (isValidLocale(lang.code)) {
        return lang.code;
      }
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip static files
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if locale is in the path and strip it (we don't use URL-based locale)
  const pathLocale = getLocaleFromPath(pathname);

  if (pathLocale) {
    // Locale is in path - strip it and redirect to clean URL
    const cleanPath = pathname.replace(`/${pathLocale}`, '') || '/';
    const newUrl = new URL(request.url);
    newUrl.pathname = cleanPath;
    
    const response = NextResponse.redirect(newUrl);
    response.cookies.set('NEXT_LOCALE', pathLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });
    return response;
  }

  // No locale in path - just set cookie with preferred locale (no redirect)
  const preferredLocale = getPreferredLocale(request);
  
  const response = NextResponse.next();
  response.cookies.set('NEXT_LOCALE', preferredLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
