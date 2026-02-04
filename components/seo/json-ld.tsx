import Script from 'next/script';

interface OrganizationJsonLdProps {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
  contactType: string;
  supportEmail: string;
}

export function OrganizationJsonLd({
  name,
  url,
  logo,
  description,
  sameAs = [],
  contactType,
  supportEmail,
}: OrganizationJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType,
      email: supportEmail,
    },
  };

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface DiveCenterJsonLdProps {
  name: string;
  description?: string;
  url: string;
  image?: string;
  address: {
    city: string;
    country: string;
    region?: string;
    postalCode?: string;
    streetAddress?: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  telephone?: string;
  email?: string;
  priceRange?: string;
  rating?: {
    value: number;
    count: number;
  };
  openingHours?: string[];
}

export function DiveCenterJsonLd({
  name,
  description,
  url,
  image,
  address,
  geo,
  telephone,
  email,
  priceRange,
  rating,
  openingHours,
}: DiveCenterJsonLdProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': url,
    name,
    description,
    url,
    image,
    address: {
      '@type': 'PostalAddress',
      addressLocality: address.city,
      addressCountry: address.country,
      addressRegion: address.region,
      postalCode: address.postalCode,
      streetAddress: address.streetAddress,
    },
    priceRange,
    telephone,
    email,
  };

  if (geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude,
    };
  }

  if (rating && rating.count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.value,
      reviewCount: rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (openingHours && openingHours.length > 0) {
    schema.openingHoursSpecification = openingHours.map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours,
    }));
  }

  return (
    <Script
      id={`dive-center-jsonld-${name.toLowerCase().replace(/\s+/g, '-')}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebsiteJsonLdProps {
  name: string;
  url: string;
  description: string;
  searchUrl?: string;
}

export function WebsiteJsonLd({
  name,
  url,
  description,
  searchUrl,
}: WebsiteJsonLdProps) {
  const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const resolvedSearchUrl =
    searchUrl ?? `${normalizedUrl}/explorer?q={search_term_string}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: resolvedSearchUrl,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Script
      id="website-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
