'use client';

import dynamic from 'next/dynamic';

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

export function OceanCanvasWrapper() {
  return <OceanCanvas />;
}
