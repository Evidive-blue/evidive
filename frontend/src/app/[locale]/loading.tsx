/**
 * Suspense boundary for all [locale] routes.
 *
 * While the route's server component is loading (data fetch, async work),
 * this skeleton is streamed immediately so the user sees the ocean
 * background + navbar instantly and gets a subtle loading indicator
 * in the content area.
 */
export default function Loading(): React.ReactNode {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Pulse ring — pure CSS, no JS */}
        <div className="relative h-10 w-10">
          <span className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20" />
          <span className="absolute inset-2 rounded-full bg-cyan-500/40" />
        </div>
      </div>
    </div>
  );
}
