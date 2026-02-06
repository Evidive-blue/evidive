'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const OceanCanvas = dynamic(
  () => import('@/components/effects/ocean-canvas').then((mod) => mod.OceanCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        className="pointer-events-none fixed inset-0 -z-50 ocean-fallback"
        aria-hidden="true"
      />
    ),
  }
);

// Pages that have their own heavy background (globe 3D, etc.)
const PAGES_WITHOUT_OCEAN = [
  '/centers', // Has DeepDiveExplorer with 3D globe
];

export function OceanCanvasWrapper() {
  const pathname = usePathname();
  
  // Don't load ocean on pages with heavy 3D backgrounds
  const shouldShowOcean = !PAGES_WITHOUT_OCEAN.some(page => pathname.startsWith(page));
  
  if (!shouldShowOcean) {
    // Fallback gradient for pages without ocean
    return (
      <div
        className="pointer-events-none fixed inset-0 -z-50"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(180deg, #0b3a4a 0%, #075985 35%, #0b2a3c 65%, #020617 100%)',
        }}
      />
    );
  }
  
  return <OceanCanvas />;
}
