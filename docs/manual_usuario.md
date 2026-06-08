# Manual do Usuário - EcoAir Analytics

Bem-vindo ao **EcoAir Analytics**, o aplicativo inteligente voltado ao Objetivo de Desenvolvimento Sustentável (ODS) 11: Cidades e Comunidades Sustentáveis.
Este manual orienta a utilização do aplicativo para análise de qualidade do ar e obtenção de inteligência em implantação de Biorreatores de Microalgas ("Árvores Líquidas").

---

## Índice
1. [Iniciando o Aplicativo](#iniciando-o-aplicativo)
2. [Aba Analytics (Dashboard)](#aba-analytics-dashboard)
3. [Aba Geospatial (Busca de Cidades e Mapa)](#aba-geospatial-busca-de-cidades-e-mapa)
4. [Entendendo os Fatores Ponderados](#entendendo-os-fatores-ponderados)

---

### 1. Iniciando o Aplicativo
O EcoAir requer acesso a uma conexão de internet para contatar o banco de dados meteorológico.
* Ao abrir o aplicativo, o sistema conectará imediatamente com a estação padrão de Marialva-PR.
* A barra inferior permite navegar pelas abas do aplicativo: **Analytics** e **Geospatial**.

---

### 2. Aba Analytics (Dashboard)
A tela principal (Dashboard) é modelada sob o conceito *Bento Box*, apresentando painéis separados e de rápida leitura.

* **Air Quality Index (AQI):** A barra colorida superior mostra o índice global. Um número baixo (1 ou 2) na cor verde significa ar puro. Números elevados em tons avermelhados indicam risco respiratório e emissões industriais.
* **Liquid Tree Priority:** Exibe o escore calculado (de 0% a 100%) da urgência de implantar um biorreator no local que está sendo monitorado. Valores acima de 75% acendem o alerta laranja neon (Recomendação Urgente).
* **Core Pollutants:** Quadros menores que desmembram as partículas medidas pela estação mais próxima:
  * `PM2.5 / PM10`: Medem as partículas de poeira fina;
  * `CO`: Monóxido de Carbono (combustão de motores);
  * `NO2 e O3`: Gases derivados de tráfego intenso.

---

### 3. Aba Geospatial (Busca de Cidades e Mapa)
Esta tela permite que o usuário faça a varredura global em tempo real e realize sondagens do impacto ambiental.

**Usando a Pesquisa de Cidades:**
1. Toque na barra superior onde está escrito `Search city...`.
2. Digite o nome da cidade desejada (ex: `Nova Déli` para visualizar um caso extremo de poluição, ou `Paris`).
3. Aperte enter/lupa no teclado para buscar. Aparecerá uma lista de resultados.
4. Toque no nome da cidade na lista. O mapa moverá a câmera até o local e carregará o índice de poluição.

**Interagindo com os Dados (Mobile-Only):**
Se estiver usando o aplicativo nativo (Expo Go/Android/iOS), você pode tocar no mapa para ancorar "pinos virtuais". O sistema buscará instantaneamente a qualidade daquele quadrante específico. 

**Calculando a Necessidade (Bottom Sheet):**
Ao clicar em um pino ou ao procurar uma cidade pela barra de busca, um painel emergirá de baixo.
1. O sistema detalhará se a qualidade do ar é um risco biológico.
2. Clicando no botão `Calculate Intervention Need`, nossa Inteligência analítica calculará matematicamente o déficit de árvores comparado aos gases tóxicos.
3. Se a interface responder `INSTALAR`, há embasamento numérico suficiente para defender a criação de um Biorreator naquele pino.

---

### 4. Entendendo os Fatores Ponderados
Ao realizar o cálculo (`Calculate Intervention Need`) na aba do Mapa, são listados os pesos utilizados para a decisão do EcoAir:
* **Qualidade do Ar (AQI) - 40%**: O fator mais grave, ditado pela OMS.
* **PM2.5 - 25%**: O fator mortífero invisível; o acúmulo das micropartículas no pulmão humano.
* **Densidade de Trânsito - 20%**: Zonas engarrafadas sofrem micro-climas abafados e perdem troca de O2.
* **Déficit Verde - 15%**: Zonas puramente asfaltadas absorvem todo o calor e devolvem em estresse ambiental térmico, sendo locais perfeitos para um biorreator encapsulado na calçada.
