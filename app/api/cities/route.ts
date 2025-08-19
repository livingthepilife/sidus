import { NextRequest, NextResponse } from 'next/server';

// Lazy load cities data to prevent blocking startup
let citiesData: any = null;

async function getCities() {
  if (!citiesData) {
    const citiesModule = await import('cities.json');
    citiesData = citiesModule.default;
  }
  return citiesData;
}

interface City {
  name: string;
  lat: string;
  lng: string;
  country: string;
  admin1: string;
  admin2: string;
}

function getCountryName(countryCode: string): string {
  const countryNames: { [key: string]: string } = {
    'US': 'United States',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'PL': 'Poland',
    'CZ': 'Czech Republic',
    'HU': 'Hungary',
    'PT': 'Portugal',
    'IE': 'Ireland',
    'GR': 'Greece',
    'TR': 'Turkey',
    'RU': 'Russia',
    'JP': 'Japan',
    'KR': 'South Korea',
    'CN': 'China',
    'IN': 'India',
    'TH': 'Thailand',
    'ID': 'Indonesia',
    'PH': 'Philippines',
    'SG': 'Singapore',
    'MY': 'Malaysia',
    'VN': 'Vietnam',
    'AE': 'UAE',
    'SA': 'Saudi Arabia',
    'EG': 'Egypt',
    'NG': 'Nigeria',
    'ZA': 'South Africa',
    'BR': 'Brazil',
    'AR': 'Argentina',
    'MX': 'Mexico',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru'
  };
  
  return countryNames[countryCode] || countryCode;
}

function getStateName(countryCode: string, admin1Code: string): string {
  // Common state/province mappings for major countries
  if (countryCode === 'US') {
    const stateMap: { [key: string]: string } = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
      'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
      'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
      'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
      'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
      'DC': 'District of Columbia'
    };
    return stateMap[admin1Code] || admin1Code;
  }
  
  if (countryCode === 'CA') {
    const provinceMap: { [key: string]: string } = {
      'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba', 'NB': 'New Brunswick',
      'NL': 'Newfoundland and Labrador', 'NS': 'Nova Scotia', 'NT': 'Northwest Territories',
      'NU': 'Nunavut', 'ON': 'Ontario', 'PE': 'Prince Edward Island', 'QC': 'Quebec',
      'SK': 'Saskatchewan', 'YT': 'Yukon'
    };
    return provinceMap[admin1Code] || admin1Code;
  }
  
  return admin1Code;
}

function formatCityName(city: City): string {
  let formatted = city.name;
  
  // Add state/province if available
  if (city.admin1) {
    const stateName = getStateName(city.country, city.admin1);
    formatted += `, ${stateName}`;
  }
  
  // Add country
  formatted += `, ${getCountryName(city.country)}`;
  
  return formatted;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const lowercaseQuery = query.toLowerCase().trim();
    
    // Get cities data lazily
    const cities = await getCities();
    
    // Search through all cities
    const matchingCities = cities
      .filter((city: City) => {
        const cityName = city.name.toLowerCase();
        return cityName.includes(lowercaseQuery);
      })
      .sort((a: City, b: City) => {
        const aStartsWith = a.name.toLowerCase().startsWith(lowercaseQuery);
        const bStartsWith = b.name.toLowerCase().startsWith(lowercaseQuery);
        
        // Prioritize exact start matches
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Then sort alphabetically
        return a.name.localeCompare(b.name);
      })
      .slice(0, 10) // Limit to top 10 results
      .map((city: City) => formatCityName(city));

    return NextResponse.json(matchingCities);
  } catch (error) {
    console.error('Error searching cities:', error);
    return NextResponse.json({ error: 'Failed to search cities' }, { status: 500 });
  }
} 