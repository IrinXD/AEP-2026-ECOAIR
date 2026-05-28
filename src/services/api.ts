import axios from 'axios';

const API_KEY = '8f7c3ee6400a3c2921eb685b2216d98d';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

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
}

// Coordenadas padrão: Marialva, PR
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
  try {
    const response = await apiClient.get('/air_pollution', {
      params: {
        lat,
        lon,
        appid: API_KEY,
      },
    });

    const data = response.data;
    const item = data.list[0];

    return {
      aqi: item.main.aqi,
      components: item.components,
      dt: item.dt,
    };
  } catch (error) {
    console.error('Erro ao buscar dados de poluição:', error);
    throw error;
  }
}

export function getAqiLabel(aqi: number): { label: string; color: string; emoji: string } {
  switch (aqi) {
    case 1:
      return { label: 'Boa', color: '#22C55E', emoji: '😊' };
    case 2:
      return { label: 'Razoável', color: '#84CC16', emoji: '🙂' };
    case 3:
      return { label: 'Moderada', color: '#F59E0B', emoji: '😐' };
    case 4:
      return { label: 'Ruim', color: '#EF4444', emoji: '😷' };
    case 5:
      return { label: 'Muito Ruim', color: '#991B1B', emoji: '🚨' };
    default:
      return { label: 'Desconhecido', color: '#6B7280', emoji: '❓' };
  }
}

export function getAqiGradient(aqi: number): string[] {
  switch (aqi) {
    case 1:
      return ['#059669', '#10B981', '#34D399'];
    case 2:
      return ['#65A30D', '#84CC16', '#A3E635'];
    case 3:
      return ['#D97706', '#F59E0B', '#FBBF24'];
    case 4:
      return ['#DC2626', '#EF4444', '#F87171'];
    case 5:
      return ['#7F1D1D', '#991B1B', '#DC2626'];
    default:
      return ['#4B5563', '#6B7280', '#9CA3AF'];
  }
}
