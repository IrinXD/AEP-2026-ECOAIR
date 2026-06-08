import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '8f7c3ee6400a3c2921eb685b2216d98d';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

export interface PollutionComponents {
  co: number;
  no: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  nh3: number;
}

export interface AirPollutionData {
  aqi: number;
  components: PollutionComponents;
  dt: number;
}

export interface LocationData {
  lat: number;
  lon: number;
  name?: string;
  state?: string;
  country?: string;
}

export const DEFAULT_LOCATION: LocationData = {
  lat: -23.4822,
  lon: -51.7925,
  name: 'Marialva, PR',
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export async function fetchAirPollution(
  lat: number = DEFAULT_LOCATION.lat,
  lon: number = DEFAULT_LOCATION.lon
): Promise<AirPollutionData> {
  const response = await apiClient.get('/air_pollution', {
    params: { lat, lon, appid: API_KEY },
  });
  
  const data = response.data;
  const item = data.list[0];

  return {
    aqi: item.main.aqi,
    components: item.components,
    dt: item.dt,
  };
}

export async function searchCityByName(query: string): Promise<LocationData[]> {
  try {
    const response = await axios.get(`${GEO_URL}/direct`, {
      params: { q: query, limit: 5, appid: API_KEY },
      timeout: 10000,
    });
    
    return response.data.map((item: any) => ({
      lat: item.lat,
      lon: item.lon,
      name: item.name,
      state: item.state,
      country: item.country,
    }));
  } catch (error) {
    console.error('Error searching city:', error);
    return [];
  }
}

export function getAqiLabel(aqi: number): { label: string; color: string } {
  switch (aqi) {
    case 1: return { label: 'Boa', color: '#39FF14' };
    case 2: return { label: 'Razoável', color: '#A3E635' };
    case 3: return { label: 'Moderada', color: '#FF5F1F' };
    case 4: return { label: 'Ruim', color: '#EF4444' };
    case 5: return { label: 'Muito Ruim', color: '#991B1B' };
    default: return { label: 'Desconhecido', color: '#71717A' };
  }
}

export function getAqiGradient(aqi: number): string[] {
  switch (aqi) {
    case 1: return ['#059669', '#34D399'];
    case 2: return ['#65A30D', '#A3E635'];
    case 3: return ['#D97706', '#FBBF24'];
    case 4: return ['#DC2626', '#F87171'];
    case 5: return ['#7F1D1D', '#DC2626'];
    default: return ['#2A2A2A', '#3F3F46'];
  }
}
