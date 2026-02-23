import {
  HeroSection,
  FeatureCards,
  WhyUsSection,
  CTASection,
  CenterIslands,
  type IslandCenterData,
} from "@/components/home";
import { publicApi } from "@/lib/api";

/** Fetch featured centers for the waterline islands (server-side, graceful failure). */
async function getFeaturedCenters(): Promise<IslandCenterData[]> {
  try {
    const all = await publicApi.getCenters();
    return all
      .filter((c) => c.is_featured)
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        displayName: c.name,
        city: c.city,
        slug: c.slug,
        featured: c.is_featured,
        verified: false,
      }));
  } catch {
    // Backend unreachable — render page without islands
    return [];
  }
}

export default async function HomePage(): Promise<React.ReactNode> {
  const islandCenters = await getFeaturedCenters();

  return (
    <>
      {islandCenters.length > 0 && (
        <CenterIslands centers={islandCenters} />
      )}
      <HeroSection />
      <FeatureCards />
      <WhyUsSection />
      <CTASection />
    </>
  );
}
