# Explicação Técnica e Arquitetural - EcoAir

Este documento destina-se à banca de avaliação universitária, detalhando as escolhas técnicas, a arquitetura do software e o algoritmo de recomendação de Inteligência Artificial implementado no projeto EcoAir.

## 1. Arquitetura do Software e Clean Code

O EcoAir foi projetado utilizando o **Expo (React Native)** com **TypeScript** rigoroso, garantindo segurança de tipagem e manutenibilidade. A estrutura do projeto segue o padrão **Screaming Architecture**, separando responsabilidades de forma clara e isolada, com foco nos princípios SOLID.

### 1.1. Estrutura de Diretórios
- `/src/app`: Define as rotas utilizando o `expo-router` em um modelo baseado em sistema de arquivos (File-based routing). O arquivo `_layout.tsx` gerencia a barra de navegação (Bottom Tabs).
- `/src/components`: Componentes visuais burros (Dumb Components) e reutilizáveis. Destaca-se o `BentoCard.tsx`, que abstrai o design system "Dark Analytics", encapsulando margens, tipografia e tema genérico. E o `MapView`, que utiliza uma separação nativa/web (`.web.tsx`) para isolar o `react-native-maps` e evitar crash na compilação web.
- `/src/screens`: Componentes inteligentes (Smart Components) que concentram estado e ciclo de vida (`HomeScreen`, `MapScreen`).
- `/src/services`: Camada de persistência e integração externa. O `api.ts` abstrai todas as chamadas HTTP via Axios para a OpenWeather API, incluindo a lógica de _Geocoding_.
- `/src/utils`: Contém lógicas puras isoladas, como `aiLogic.ts` (regras de negócio desacopladas do React) e `constants.ts` (Design Tokens).

### 1.2. Padrões de Clean Code Aplicados
- **Single Responsibility Principle (SRP):** A lógica de UI (telas) não calcula a pontuação de IA. A função de recomendação existe apenas em `aiLogic.ts`.
- **Desacoplamento:** Nenhuma tela consome as variáveis de ambiente ou constrói URLs do OpenWeather. Elas consomem as funções exportadas por `api.ts`.
- **Nomenclatura Limpa e Auto-documentada:** Remoção de comentários supérfluos, substituídos por nomes de variáveis descritivos (`calculateRecommendationScore`, `simulateTrafficDensity`).

---

## 2. Padrão de UI/UX (Dark Analytics / Bento Box)

O padrão visual foi arquitetado em torno do conceito de **Bento Box** combinado ao **Dark Analytics**.
- Fundo totalmente escuro (`#121212`) foca a atenção nos dados.
- Cartões arredondados em cinza (`#1E1E1E`) confinam informações para diminuir a carga cognitiva.
- O mapeamento de cores reflete semanticamente a urgência: tons Neon para destaque (Verde `#39FF14` e Laranja `#FF5F1F`), comunicando status de poluição sem que o usuário precise entender de microbiologia.

---

## 3. Lógica Algorítmica da "IA" (Score de Necessidade)

O aplicativo cruza dados reais (API de Poluição) com variáveis espaciais/temporais para determinar matematicamente a necessidade de implantação de uma "Árvore Líquida" (biorreator de microalgas).

A função `calculateRecommendationScore` no arquivo `aiLogic.ts` modela essa rede de decisão ponderada:

### 3.1. Fórmula Matemática (Equação Ponderada)
A pontuação final $S \in [0, 100]$ é definida pela soma do produto de 4 fatores normalizados ($F_i$) e seus pesos predefinidos ($W_i$):

$$ S = \sum_{i=1}^{4} (F_i \times W_i) $$

Onde a soma dos pesos é 1 (100%):
- $W_1$ (AQI) = 40% (0.40)
- $W_2$ (PM2.5) = 25% (0.25)
- $W_3$ (Tráfego) = 20% (0.20)
- $W_4$ (Déficit Verde) = 15% (0.15)

### 3.2. Normalização dos Fatores ($F_i$)
1. **Fator 1 (AQI - Air Quality Index):**
   O índice AQI da API retorna de 1 a 5. A normalização para percentual:
   $F_1 = \left(\frac{AQI - 1}{4}\right) \times 100$

2. **Fator 2 (Concentração de PM2.5):**
   Mede partículas nocivas menores que 2.5 micrômetros. O valor crítico da OMS é 35 µg/m³, porém a função mapeia o limite extremo como 75 µg/m³.
   $F_2 = \min\left(100, \left(\frac{PM_{2.5}}{75}\right) \times 100\right)$

3. **Fator 3 (Densidade de Tráfego - Simulação Lógica):**
   A densidade de veículos emite monóxido de carbono e reduz eficiência espacial. É calculada via um modelo base temporal (horários de pico como 07:00h às 09:00h e 17:00h às 19:00h injetam 80% de base) combinado a uma perturbação senoidal para representar agrupamentos urbanos por latitude/longitude:
   $F_3 = \min(100, Base + |\sin(Lat \times 10) \times \cos(Lon \times 10)| \times 20)$

4. **Fator 4 (Déficit de Área Verde - Simulação Lógica):**
   Inverso de quanta floresta/gramado existe.
   $F_4 = 100 - ÍndiceVerde$

### 3.3. Interpretação dos Níveis de Score
A saída clamped (travada) entre `[0, 100]` gera uma _Recommendation_:
- **`> 85%` (Prioridade Máxima):** Urgência biológica devido ao risco humano direto.
- **`> 75%` (Recomendado):** Zona de implantação ideal do biorreator.
- **`> 50%` (Monitorar):** Implantação de longo prazo.
- **`<= 50%` (Baixa Prioridade):** Sustentável no modelo atual.


## 4. Modelagem de Estado (State Machine)

Para garantir a resiliência da aplicação e evitar comportamentos inesperados na interface, o ciclo de vida das requisições no EcoAir foi modelado seguindo o padrão de Máquina de Estados Finitos (Finite State Machine - FSM). 

O estado da tela transita apenas em caminhos unidirecionais previsíveis, sendo gerenciado de forma reativa pela arquitetura do aplicativo (via *Hooks* do React e *Zustand*):

1. **`IDLE` (Ocioso):** Estado inicial. O aplicativo aguarda a ação do usuário na barra de busca ou a permissão de acesso ao GPS do dispositivo.
2. **`FETCHING_LOCATION`:** Transição ativada imediatamente ao solicitar a busca de uma nova cidade ou ao capturar a geolocalização atual.
3. **`FETCHING_DATA`:** O aplicativo bloqueia novas requisições na interface (prevenindo *double-clicks* ou chamadas duplicadas) e realiza a requisição HTTP para a API do OpenWeather.
4. **`CALCULATING_IA`:** Dados de poluição recebidos com sucesso. A interface exibe um indicador de carregamento enquanto aguarda o processamento matemático do *Score de Recomendação* na CPU.
5. **`SUCCESS`:** O estado global é populado com os nós de dados da qualidade do ar (`airQuality`) e a recomendação final da IA (`recommendation`). A UI é liberada para renderizar os *Bento Cards*.
6. **`ERROR`:** Estado de *fallback* ativado caso a API falhe (ex: ausência de internet) ou a cidade buscada não exista. Dispara um alerta visual para o usuário e permite o retorno seguro ao estado `IDLE`.

**Diagrama lógico de transição de estado na interface:**
`[IDLE] -> [FETCHING_LOCATION] -> [FETCHING_DATA] -> [CALCULATING_IA] -> [SUCCESS | ERROR]`
