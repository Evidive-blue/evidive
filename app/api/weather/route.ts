/**
 * Edge Weather API with caching
 * 
 * Benefits:
 * - Runs at Edge (closest to user) for low latency
 * - Server-side API key (not exposed to client)
 * - Automatic caching via Cache-Control headers
 * - Rate limiting protection for OpenWeatherMap
 */

export const runtime = 'edge';
export const preferredRegion = ['cdg1', 'fra1', 'iad1']; // EU + US

// Round coordinates to reduce cache variations (0.5° grid ≈ 55km)
function roundCoord(coord: number): number {
  return Math.round(coord * 2) / 2;
}

// Cache key based on rounded coordinates
function getCacheKey(lat: number, lng: number): string {
  return `weather_${roundCoord(lat)}_${roundCoord(lng)}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // Validate parameters
  if (!lat || !lng) {
    return Response.json(
      { error: 'Missing lat or lng parameter' },
      { status: 400 }
    );
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return Response.json(
      { error: 'Invalid coordinates' },
      { status: 400 }
    );
  }

  // Validate coordinate ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return Response.json(
      { error: 'Coordinates out of range' },
      { status: 400 }
    );
  }

  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'Weather service not configured' },
      { status: 503 }
    );
  }

  try {
    // Round coordinates for better cache hit rate
    const roundedLat = roundCoord(latitude);
    const roundedLng = roundCoord(longitude);

    const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${roundedLat}&lon=${roundedLng}&units=metric&appid=${apiKey}`;
    
    const response = await fetch(owmUrl, {
      next: { revalidate: 600 }, // Cache for 10 minutes server-side
    });

    if (!response.ok) {
      console.error(`OpenWeatherMap error: ${response.status}`);
      return Response.json(
        { error: 'Weather service unavailable' },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Transform response to only include what we need
    const weather = {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      cityName: data.name || 'Unknown',
      // Include cache key for debugging
      cacheKey: getCacheKey(latitude, longitude),
    };

    return Response.json(weather, {
      headers: {
        // CDN cache for 5 minutes, allow stale for 1 hour while revalidating
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        // Vary by coordinates (already in URL)
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
