'use client';

import { DeepDiveExplorer } from '@/components/centers/deep-dive-explorer';

type JsonValue = unknown;

interface Center {
  id: string;
  slug: string;
  name: JsonValue;
  shortDescription: JsonValue;
  city: string;
  country: string;
  latitude: JsonValue;
  longitude: JsonValue;
  verified: boolean;
  rating: number;
  reviewCount: number;
  serviceCount: number;
}

interface CentersClientProps {
  centers: Center[];
}

export function CentersClient({ centers }: CentersClientProps) {
  return <DeepDiveExplorer centers={centers} />;
}
