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

/**
 * Análise de Risco - Avalia dados da OpenWeather (AQI, PM2.5, CO)
 * e retorna um alerta em texto se os níveis estiverem prejudiciais.
 */
export function analyzeRisk(
  aqi: number,
  components: PollutionComponents
): RiskAnalysis {
  const { pm2_5, co, no2, o3 } = components;

  // Limites baseados nas diretrizes da OMS
  const pm25Dangerous = pm2_5 > 35; // µg/m³
  const coDangerous = co > 10000; // µg/m³
  const no2Dangerous = no2 > 200; // µg/m³
  const o3Dangerous = o3 > 180; // µg/m³

  const dangerCount = [
    pm25Dangerous,
    coDangerous,
    no2Dangerous,
    o3Dangerous,
  ].filter(Boolean).length;

  if (aqi >= 5 || dangerCount >= 3) {
    return {
      level: 'critical',
      title: '⚠️ Alerta Crítico',
      message: `Qualidade do ar extremamente perigosa! PM2.5: ${pm2_5.toFixed(1)} µg/m³, CO: ${(co / 1000).toFixed(1)} mg/m³. Evite atividades ao ar livre. Este local é candidato prioritário para instalação de biorreatores.`,
      color: '#DC2626',
      icon: 'alert-circle',
    };
  }

  if (aqi >= 4 || dangerCount >= 2) {
    return {
      level: 'high',
      title: '🔴 Risco Alto',
      message: `Níveis de poluição acima do recomendável. PM2.5: ${pm2_5.toFixed(1)} µg/m³. Grupos sensíveis devem limitar exposição. Recomenda-se avaliação para árvore líquida.`,
      color: '#EF4444',
      icon: 'warning',
    };
  }

  if (aqi >= 3 || dangerCount >= 1) {
    return {
      level: 'moderate',
      title: '🟡 Risco Moderado',
      message: `Qualidade do ar moderada. PM2.5: ${pm2_5.toFixed(1)} µg/m³. Pessoas sensíveis podem sentir desconforto. Monitoramento contínuo recomendado.`,
      color: '#F59E0B',
      icon: 'information-circle',
    };
  }

  return {
    level: 'low',
    title: '🟢 Ar Saudável',
    message: `Qualidade do ar dentro dos padrões aceitáveis. PM2.5: ${pm2_5.toFixed(1)} µg/m³. Condições favoráveis para atividades ao ar livre.`,
    color: '#22C55E',
    icon: 'checkmark-circle',
  };
}

/**
 * Simula a densidade de trânsito baseada em hora do dia e localização.
 * Em um cenário real, isso viria de uma API de tráfego.
 */
function simulateTrafficDensity(lat: number, lon: number): number {
  const hour = new Date().getHours();
  let baseDensity = 30;

  // Horários de pico
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    baseDensity = 80;
  } else if (hour >= 10 && hour <= 16) {
    baseDensity = 55;
  } else if (hour >= 20 && hour <= 23) {
    baseDensity = 40;
  } else {
    baseDensity = 15;
  }

  // Variação baseada em coordenadas (simulando áreas urbanas)
  const urbanFactor = Math.abs(Math.sin(lat * 10) * Math.cos(lon * 10));
  return Math.min(100, baseDensity + urbanFactor * 20);
}

/**
 * Simula o índice de área verde baseado na localização.
 * Em um cenário real, isso viria de dados de sensoriamento remoto.
 */
function simulateGreenAreaIndex(lat: number, lon: number): number {
  const seed = Math.abs(Math.sin(lat * 100) + Math.cos(lon * 100));
  return Math.max(10, Math.min(90, seed * 50 + 20));
}

/**
 * Sistema de Recomendação - Calcula o Score de Necessidade de Árvore Líquida.
 * Cruza o AQI atual com variáveis simuladas para gerar um score 0-100%.
 */
export function calculateRecommendationScore(
  aqi: number,
  components: PollutionComponents,
  lat: number,
  lon: number
): RecommendationResult {
  const trafficDensity = simulateTrafficDensity(lat, lon);
  const greenAreaIndex = simulateGreenAreaIndex(lat, lon);

  // Fator 1: Qualidade do Ar (peso 40%)
  const aqiFactor = ((aqi - 1) / 4) * 100; // Normaliza AQI (1-5) para 0-100

  // Fator 2: Nível de PM2.5 (peso 25%)
  const pm25Factor = Math.min(100, (components.pm2_5 / 75) * 100);

  // Fator 3: Densidade de Trânsito (peso 20%)
  const trafficFactor = trafficDensity;

  // Fator 4: Déficit de Área Verde (peso 15%)
  const greenDeficitFactor = 100 - greenAreaIndex;

  // Cálculo do Score Ponderado
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
      description: `Índice AQI ${aqi}/5 — ${aqi >= 4 ? 'Nível prejudicial detectado' : aqi >= 3 ? 'Nível moderado' : 'Dentro do aceitável'}`,
    },
    {
      name: 'Material Particulado (PM2.5)',
      value: Math.round(pm25Factor),
      weight: 25,
      description: `${components.pm2_5.toFixed(1)} µg/m³ — ${components.pm2_5 > 35 ? 'Acima do limite OMS' : 'Dentro dos padrões'}`,
    },
    {
      name: 'Densidade de Trânsito',
      value: Math.round(trafficFactor),
      weight: 20,
      description: `${trafficDensity.toFixed(0)}% de ocupação — ${trafficDensity > 60 ? 'Tráfego intenso' : 'Tráfego moderado'}`,
    },
    {
      name: 'Déficit de Área Verde',
      value: Math.round(greenDeficitFactor),
      weight: 15,
      description: `Cobertura verde: ${greenAreaIndex.toFixed(0)}% — ${greenAreaIndex < 30 ? 'Área com pouca vegetação' : 'Vegetação presente'}`,
    },
  ];

  let recommendation: string;
  if (clampedScore > 85) {
    recommendation = '🔴 PRIORIDADE MÁXIMA: Este local apresenta condições críticas que justificam a instalação imediata de um biorreator de microalgas (árvore líquida). A combinação de alta poluição, tráfego intenso e déficit de área verde torna este ponto ideal para a tecnologia.';
  } else if (clampedScore > 75) {
    recommendation = '🟠 RECOMENDADO: A análise indica que este local se beneficiaria significativamente da instalação de uma árvore líquida. Os indicadores ambientais mostram necessidade de intervenção para melhorar a qualidade do ar.';
  } else if (clampedScore > 50) {
    recommendation = '🟡 MONITORAR: Os indicadores sugerem um nível moderado de necessidade. Recomenda-se monitoramento contínuo e reavaliação periódica. A instalação pode ser considerada em um plano de expansão futuro.';
  } else {
    recommendation = '🟢 BAIXA PRIORIDADE: As condições atuais não justificam a instalação imediata de um biorreator neste local. O ar está dentro de padrões aceitáveis e há cobertura verde suficiente.';
  }

  return {
    score: clampedScore,
    recommendation,
    shouldInstall,
    factors,
  };
}
