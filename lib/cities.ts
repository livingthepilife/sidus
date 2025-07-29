// City search using server-side API endpoint
// Cache for search performance
let searchCache = new Map<string, string[]>();

export async function searchCities(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  
  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }
  
  try {
    const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      console.error('Failed to fetch cities:', response.statusText);
      return [];
    }
    
    const cities = await response.json();
    
    // Cache the results
    searchCache.set(cacheKey, cities);
    
    // Limit cache size to prevent memory issues
    if (searchCache.size > 1000) {
      const firstKey = searchCache.keys().next().value;
      if (firstKey) {
        searchCache.delete(firstKey);
      }
    }
    
    return cities;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
} 