import { PollutionComponents } from '../services/api';

export interface RiskAnalysis {
  level: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  message: string;
  color: string;
  icon: string;
}

export interface RecommendationResult {
  score: number;
  recommendation: string;
  shouldInstall: boolean;
  factors: RecommendationFactor[];
}

export interface RecommendationFactor {
  name: string;
  value: number;
  weight: number;
  description: string;
}

export function analyzeRisk(
  aqi: number,
  components: PollutionComponents
): RiskAnalysis {
  const { pm2_5, co, no2, o3 } = components;

  const pm25Dangerous = pm2_5 > 35;
  const coDangerous = co > 10000;
  const no2Dangerous = no2 > 200;
  const o3Dangerous = o3 > 180;

  const dangerCount = [
    pm25Dangerous,
    coDangerous,
    no2Dangerous,
    o3Dangerous,
  ].filter(Boolean).length;

  if (aqi >= 5 || dangerCount >= 3) {
    return {
      level: 'critical',
      title: 'Alerta Crítico',
      message: `Risco iminente. PM2.5: ${pm2_5.toFixed(1)} µg/m³, CO: ${(co / 1000).toFixed(1)} mg/m³. Local prioritário para biorreatores.`,
      color: '#DC2626',
      icon: 'alert-triangle',
    };
  }

  if (aqi >= 4 || dangerCount >= 2) {
    return {
      level: 'high',
      title: 'Risco Alto',
      message: `Níveis prejudiciais. PM2.5: ${pm2_5.toFixed(1)} µg/m³. Avaliação para árvore líquida sugerida.`,
      color: '#EF4444',
      icon: 'alert-circle',
    };
  }

  if (aqi >= 3 || dangerCount >= 1) {
    return {
      level: 'moderate',
      title: 'Risco Moderado',
      message: `Qualidade do ar moderada. Sensíveis podem sentir desconforto.`,
      color: '#F59E0B',
      icon: 'info',
    };
  }

  return {
    level: 'low',
    title: 'Ar Saudável',
    message: `Padrões aceitáveis. PM2.5: ${pm2_5.toFixed(1)} µg/m³.`,
    color: '#22C55E',
    icon: 'check-circle',
  };
}

/**
 * Mocks traffic density (0-100) using time distribution and spatial coordinates
 * Peak hours: 7-9h, 17-19h (80 base)
 * Spatial variation: sinusoidal mapping to mimic urban clusters
 */
function simulateTrafficDensity(lat: number, lon: number): number {
  const hour = new Date().getHours();
  let baseDensity = 30;

  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    baseDensity = 80;
  } else if (hour >= 10 && hour <= 16) {
    baseDensity = 55;
  } else if (hour >= 20 && hour <= 23) {
    baseDensity = 40;
  } else {
    baseDensity = 15;
  }

  const urbanFactor = Math.abs(Math.sin(lat * 10) * Math.cos(lon * 10));
  return Math.min(100, baseDensity + urbanFactor * 20);
}

/**
 * Mocks green area index (0-100) using spatial seeding
 */
function simulateGreenAreaIndex(lat: number, lon: number): number {
  const seed = Math.abs(Math.sin(lat * 100) + Math.cos(lon * 100));
  return Math.max(10, Math.min(90, seed * 50 + 20));
}

/**
 * Calculates a probabilistic score [0-100] representing the necessity of a Liquid Tree deployment.
 * Math Formula: S = (AQI_norm * 0.40) + (PM2.5_norm * 0.25) + (Traffic * 0.20) + (GreenDeficit * 0.15)
 */
export function calculateRecommendationScore(
  aqi: number,
  components: PollutionComponents,
  lat: number,
  lon: number
): RecommendationResult {
  const trafficDensity = simulateTrafficDensity(lat, lon);
  const greenAreaIndex = simulateGreenAreaIndex(lat, lon);

  const aqiFactor = ((aqi - 1) / 4) * 100;
  const pm25Factor = Math.min(100, (components.pm2_5 / 75) * 100);
  const trafficFactor = trafficDensity;
  const greenDeficitFactor = 100 - greenAreaIndex;

  const score = Math.round(
    aqiFactor * 0.4 +
    pm25Factor * 0.25 +
    trafficFactor * 0.2 +
    greenDeficitFactor * 0.15
  );

  const clampedScore = Math.max(0, Math.min(100, score));
  const shouldInstall = clampedScore > 75;

  const factors: RecommendationFactor[] = [
    {
      name: 'Qualidade do Ar (AQI)',
      value: Math.round(aqiFactor),
      weight: 40,
      description: `Índice AQI ${aqi}/5`,
    },
    {
      name: 'Poluição PM2.5',
      value: Math.round(pm25Factor),
      weight: 25,
      description: `${components.pm2_5.toFixed(1)} µg/m³`,
    },
    {
      name: 'Densidade de Trânsito',
      value: Math.round(trafficFactor),
      weight: 20,
      description: `${trafficDensity.toFixed(0)}%`,
    },
    {
      name: 'Déficit de Área Verde',
      value: Math.round(greenDeficitFactor),
      weight: 15,
      description: `Cobertura verde: ${greenAreaIndex.toFixed(0)}%`,
    },
  ];

  let recommendation: string;
  if (clampedScore > 85) {
    recommendation = 'PRIORIDADE MÁXIMA: Alta poluição combinada a déficit arbóreo exige biorreator de emergência.';
  } else if (clampedScore > 75) {
    recommendation = 'RECOMENDADO: Níveis persistentes de degradação atmosférica sugerem intervenção tecnológica viável.';
  } else if (clampedScore > 50) {
    recommendation = 'MONITORAR: Parâmetros moderados. Uma árvore líquida pode atuar de forma preventiva na região.';
  } else {
    recommendation = 'BAIXA PRIORIDADE: Fatores ambientais estabilizados e saudáveis.';
  }

  return {
    score: clampedScore,
    recommendation,
    shouldInstall,
    factors,
  };
}
