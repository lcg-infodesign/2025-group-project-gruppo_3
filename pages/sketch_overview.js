const CONFIG = {
  colors: {
    background: "#ffffffff",
    text: "#000000ff",
    accent: "#FF2B00",
    circle: "#111010b3",
    infoBox: "#ffffffff",
    infoBoxText: "#000000ff",
    infoBoxStroke: "#FF2B00",
  },
  layout: {
    centerXRatio: 0.695,
    maxRadius: 300,
    minRadius: 29,
    continentLabelOffset: 15,
    europeAsiaOffset: 15,
    infoBoxWidth: 220,
    infoBoxHeight: 100,
    bottomControlY: 100,
    marginX: 40,
    fontSizeControls: 16,
    centerYOffset: -10,
    topOffset: -20,
    leftPanelWidth: 300,
    controlButtonHeight: 50,
    controlButtonWidth: 50,
    timeframeFontSize: 30,
    yearFontSize: 30,
    labelFontSize: 16,
    titleStartY: 110,
    buttonStartY: 400,
    timeframeStartY: 600,
    yearStartY: 705,
    legendStartY: 420,
    startButtonY: 820,
  },
  animation: {
    dotEntryDuration: 800,
    dotStaggerDelay: 30,
    dotPopScale: 1.4,
    randomDelayMax: 600,
    waveDuration: 1000,

    fastDotEntryDuration: 400,
    fastRandomDelayMax: 200,
    eruptionDuration: 1000,
    implosionDuration: 250,
    pauseDuration: 150,
    explosionDuration: 600,
    maxExplosionScale: 100,
    shockwaveCount: 5,
    pulseCount: 8,
  },
  centuries: [
    { label: "Full range", value: null },
    { label: "4200 BC", value: -4200 },
    { label: "0", value: 0 },
    { label: "800 AD", value: 800 },
    { label: "1800 AD", value: 1800 },
    { label: "1850 AD", value: 1850 },
    { label: "1900 AD", value: 1900 },
    { label: "1950 AD", value: 1950 },
    { label: "2000 AD", value: 2000 },
    { label: "2050 AD", value: 2050 },
  ],
};

let impactLevels = [];
let allImpacts = [];

const CONCENTRIC_YEARS = [-4200, 0, 800, 1800, 1850, 1900, 1950, 2000, 2050];

const SELECTION_ANIMATION_DURATION = 800;
const HOVER_ANIMATION_DURATION = 300;
const CIRCLE_REVEAL_DURATION = 1500;
const TIMELINE_ANIMATION_SPEED_NORMAL = 500;
const TIMELINE_ANIMATION_SPEED_FAST = 800;
const TIMELINE_PAUSE_BETWEEN_CYCLES = 1000;

const SEARCH_PANEL_ANIM_DURATION = 300;

let state = {
  volcanoData: [],
  filteredData: [],
  selectedCentury: null,
  selectedContinent: null,
  hoveredVolcano: null,
  timelineYear: null,
  centerX: 0,
  centerY: 0,
  continentAngles: {},
  continentCounts: {},
  volcanoPositions: new Map(),
  globalYearRange: { min: 0, max: 0 },
  currentCenturiesIndex: 0,
  isPlaying: false,
  animationTimer: 0,
  animationSpeed: TIMELINE_ANIMATION_SPEED_NORMAL,
  pauseBetweenCycles: TIMELINE_PAUSE_BETWEEN_CYCLES,
  isPausedBetweenCycles: false,
  startButtonArea: null,
  timeFrameLeftArrows: null,
  timeFrameRightArrows: null,
  yearLeftArrow: null,
  yearRightArrow: null,
  availableYears: [],
  currentYearIndex: 0,
  displayedYear: null,
  yearActivatedByUser: false,
  selectionAnimationStart: new Map(),
  hoverAnimationStart: new Map(),
  circleRevealStart: null,
  circleRevealProgress: 0,
  dotAnimationStart: null,
  dotAnimationProgress: 0,
  dotAppearTimes: new Map(),
  waveAnimationStart: null,
  waveAnimationProgress: 0,
  disableDotEntryAnimation: false,
  useFastAnimations: false,
  eruption: {
    active: false,
    phase: "idle",
    x: 0,
    y: 0,
    startTime: 0,
    volcano: null,
    originalSize: 0,
    currentSize: 0,
    shockwaves: [],
    pulses: [],
    implosionStart: 0,
    pauseStart: 0,
    explosionStart: 0,
  },
  learnMoreButtonArea: null,
  searchButtonArea: null,
  searchPanelOpen: false,
  searchPanelX: 0,
  searchPanelY: 0,
  searchPanelWidth: 220,
  searchPanelHeight: 0,
  searchSelectedContinent: null,
  searchSelectedVolcano: null,
  searchContinentsPanelOpen: true,
  searchVolcanoesPanelOpen: false,
  searchEruptionsPanelOpen: false,
  searchPanelAnimProgress: 0,
  searchPanelAnimStart: null,
  hoveredSearchVolcano: null,
  searchPanelVolcanoes: [],
  searchPanelEruptions: [],
  searchPanelScrollY: 0,
  searchPanelMaxHeight: 400,
  searchPanelItemHeight: 30,
  isScrollingSearch: false,
  scrollStartY: 0,
  scrollStartOffset: 0,
  searchPanelHasFocus: false,
  hoveredSearchItemIndex: -1,
  hoveredVolcanoItemIndex: -1,
  hoveredEruptionItemIndex: -1,
  currentHoveredVolcanoName: null,
  hoveredStartButton: false,
  hoveredSearchButton: false,
  hoveredLearnMoreButton: false,
  hoveredTimeFrameLeft: false,
  hoveredTimeFrameRight: false,
  hoveredYearLeft: false,
  hoveredYearRight: false,
  searchTargetHeight: 0,
  logoArea: null,
  navLinks: null,
};

let radialBgImage;

let transitionState = {
  active: false,
  startTime: 0,
  duration: 800,
  startX: 0,
  startY: 0,
  startRadius: 0,
  targetRadius: 0,
};

//responsive
let scaleFactor = 1.0;

function calculateScaleFactor() {
  const referenceWidth = 1920;
  const referenceHeight = 1080;

  const widthRatio = windowWidth / referenceWidth;
  const heightRatio = windowHeight / referenceHeight;

  return min(widthRatio, heightRatio);
}

function applyScaleToConfig(scale) {
  if (!window.originalConfig) {
    window.originalConfig = JSON.parse(JSON.stringify(CONFIG.layout));
  }

  const original = window.originalConfig;
  const availableHeight = windowHeight;
  const bottomMargin = 40;

  //scale
  CONFIG.layout.fontSizeControls = original.fontSizeControls;
  CONFIG.layout.timeframeFontSize = original.timeframeFontSize * scale;
  CONFIG.layout.yearFontSize = original.yearFontSize * scale;
  CONFIG.layout.labelFontSize = original.labelFontSize;
  CONFIG.layout.leftPanelWidth = original.leftPanelWidth * scale;
  CONFIG.layout.controlButtonHeight = original.controlButtonHeight * scale;
  CONFIG.layout.controlButtonWidth = original.controlButtonWidth * scale;

  //grafico scale
  const graphScale = min(scale * 1.3, 1.2);
  CONFIG.layout.maxRadius = original.maxRadius * graphScale;
  CONFIG.layout.minRadius = original.minRadius * graphScale;
  CONFIG.layout.continentLabelOffset =
    original.continentLabelOffset * graphScale;
  CONFIG.layout.europeAsiaOffset = original.europeAsiaOffset * graphScale;

  //tooltip
  const tooltipScale = min(scale * 1.2, 1.1);
  CONFIG.layout.infoBoxWidth = original.infoBoxWidth * tooltipScale;
  CONFIG.layout.infoBoxHeight = original.infoBoxHeight * tooltipScale;

  //margini
  CONFIG.layout.marginX = 40;
  CONFIG.layout.centerYOffset = original.centerYOffset * scale;
  CONFIG.layout.topOffset = original.topOffset * scale;

  //titolo
  CONFIG.layout.titleStartY = 110 * scale;

  //start animation
  CONFIG.layout.startButtonY = availableHeight - bottomMargin - 40;

  //select
  CONFIG.layout.yearStartY = CONFIG.layout.startButtonY - 120;

  //select timeframe
  CONFIG.layout.timeframeStartY = CONFIG.layout.yearStartY - 100;

  //legenda
  CONFIG.layout.legendStartY = CONFIG.layout.timeframeStartY - 200;

  const spaceBetweenTitleAndLegend =
    CONFIG.layout.legendStartY - CONFIG.layout.titleStartY;

  if (spaceBetweenTitleAndLegend < 200) {
    CONFIG.layout.legendStartY = CONFIG.layout.titleStartY + 200;
    CONFIG.layout.timeframeStartY = CONFIG.layout.legendStartY + 150;
    CONFIG.layout.yearStartY = CONFIG.layout.timeframeStartY + 80;
    CONFIG.layout.startButtonY = CONFIG.layout.yearStartY + 80;

    if (CONFIG.layout.startButtonY > availableHeight - bottomMargin) {
      CONFIG.layout.startButtonY = availableHeight - bottomMargin - 20;
      CONFIG.layout.yearStartY = CONFIG.layout.startButtonY - 60;
      CONFIG.layout.timeframeStartY = CONFIG.layout.yearStartY - 60;
      CONFIG.layout.legendStartY = CONFIG.layout.timeframeStartY - 120;
    }
  }

  CONFIG.layout.titleStartY = max(80, CONFIG.layout.titleStartY);
  CONFIG.layout.startButtonY = min(
    CONFIG.layout.startButtonY,
    availableHeight - bottomMargin,
  );
  CONFIG.layout.yearStartY = min(
    CONFIG.layout.yearStartY,
    CONFIG.layout.startButtonY - 60,
  );
  CONFIG.layout.timeframeStartY = min(
    CONFIG.layout.timeframeStartY,
    CONFIG.layout.yearStartY - 60,
  );
  CONFIG.layout.legendStartY = min(
    CONFIG.layout.legendStartY,
    CONFIG.layout.timeframeStartY - 120,
  );
  CONFIG.layout.legendStartY = max(
    CONFIG.layout.titleStartY + 200,
    CONFIG.layout.legendStartY,
  );
}

const CONTINENT_MAP = {
  "Arabia-S": "Asia",
  "Arabia-W": "Asia",
  "China-S": "Asia",
  "Halmahera-Indonesia": "Asia",
  "Hokkaido-Japan": "Asia",
  "Honshu-Japan": "Asia",
  Indonesia: "Asia",
  "Izu Is-Japan": "Asia",
  Java: "Asia",
  Kamchatka: "Asia",
  "Kuril Is": "Asia",
  "Kyushu-Japan": "Asia",
  "Lesser Sunda Is": "Asia",
  "Luzon-Philippines": "Asia",
  "Mindanao-Philippines": "Asia",
  "Philippines-C": "Asia",
  "Ryukyu Is": "Asia",
  "Sangihe Is-Indonesia": "Asia",
  "Sulawesi-Indonesia": "Asia",
  Sumatra: "Asia",
  Turkey: "Asia",
  "Alaska Peninsula": "Americas",
  "Alaska-SW": "Americas",
  "Aleutian Is": "Americas",
  Canada: "Americas",
  "Chile-C": "Americas",
  "Chile-S": "Americas",
  Colombia: "Americas",
  "Costa Rica": "Americas",
  Ecuador: "Americas",
  "El Salvador": "Americas",
  Galapagos: "Americas",
  Guatemala: "Americas",
  "Hawaiian Is": "Americas",
  Mexico: "Americas",
  Nicaragua: "Americas",
  Peru: "Americas",
  "US-Oregon": "Americas",
  "US-Washington": "Americas",
  "US-Wyoming": "Americas",
  "W Indies": "Americas",
  Azores: "Europe",
  "Canary Is": "Europe",
  Greece: "Europe",
  "Iceland-NE": "Europe",
  "Iceland-S": "Europe",
  "Iceland-SE": "Europe",
  "Iceland-SW": "Europe",
  Italy: "Europe",
  "Admiralty Is-SW Paci": "Oceania",
  "Banda Sea": "Oceania",
  "Bougainville-SW Paci": "Oceania",
  "Kermadec Is": "Oceania",
  "New Britain-SW Pac": "Oceania",
  "New Guinea": "Oceania",
  "New Guinea-NE of": "Oceania",
  "New Zealand": "Oceania",
  "Samoa-SW Pacific": "Oceania",
  "Santa Cruz Is-SW Pac": "Oceania",
  "Solomon Is-SW Pacifi": "Oceania",
  "Tonga-SW Pacific": "Oceania",
  "Vanuatu-SW Pacific": "Oceania",
  "Africa-C": "Africa",
  "Africa-E": "Africa",
  "Africa-NE": "Africa",
  "Africa-W": "Africa",
  "Cape Verde Is": "Africa",
  "Indian O-W": "Africa",
  "Red Sea": "Africa",
};

const CONTINENTS = ["Asia", "Americas", "Europe", "Oceania", "Africa"];

function preload() {
  loadTable("../assets/data_impatto.csv", "csv", "header", processTableData);
  radialBgImage = loadImage("../assets/radial_bg.png");
}

function processTableData(table) {
  state.volcanoData = [];
  allImpacts = [];

  for (let r = 0; r < table.getRowCount(); r++) {
    let row = table.getRow(r);
    let location = row.getString("Location");

    let deaths = parseInt(row.getString("Deaths")) || 0;
    let impact = parseInt(row.getString("Impact")) || 1;

    if (!isNaN(impact)) {
      allImpacts.push(impact);
    }

    state.volcanoData.push({
      year: parseInt(row.getString("Year")) || 0,
      name: row.getString("Name"),
      location: location,
      country: row.getString("Country"),
      type: row.getString("Type"),
      impact: impact,
      deaths: deaths,
      continent: CONTINENT_MAP[location] || "Sconosciuto",
    });
  }

  impactLevels = [...new Set(allImpacts)].sort((a, b) => a - b);

  if (!impactLevels.includes(15)) {
    impactLevels.push(15);
  }

  impactLevels.sort((a, b) => a - b);

  state.volcanoData.sort((a, b) => b.year - a.year);
  initializeData();
}

function initializeData() {
  state.filteredData = [...state.volcanoData];
  state.globalYearRange = getGlobalYearRange();
  calculateContinentData();
  calculateVolcanoPositions();
  updateAvailableYears();

  state.circleRevealStart = millis();
  state.dotAnimationStart = millis() + 300;
  state.dotAnimationProgress = 0;
  state.useFastAnimations = false;

  state.waveAnimationStart = null;
  state.waveAnimationProgress = 0;

  state.eruption = {
    active: false,
    phase: "idle",
    x: 0,
    y: 0,
    startTime: 0,
    volcano: null,
    originalSize: 0,
    currentSize: 0,
    shockwaves: [],
    pulses: [],
    implosionStart: 0,
    pauseStart: 0,
    explosionStart: 0,
  };

  state.dotAppearTimes.clear();
  state.filteredData.forEach((v) => {
    let key = `${v.name}-${v.year}-${v.deaths}`;
    const randomDelay = Math.random() * CONFIG.animation.randomDelayMax;
    state.dotAppearTimes.set(key, randomDelay);
  });

  state.disableDotEntryAnimation = false;
}

function calculateContinentData() {
  state.continentCounts = CONTINENTS.reduce((acc, cont) => {
    acc[cont] = 0;
    return acc;
  }, {});

  state.volcanoData.forEach((v) => {
    if (state.continentCounts[v.continent] !== undefined) {
      state.continentCounts[v.continent]++;
    }
  });

  let total = state.volcanoData.length;
  let startAngle = 0;

  state.continentAngles = {};
  CONTINENTS.forEach((cont) => {
    let proportion = total > 0 ? state.continentCounts[cont] / total : 0;
    let angleSize = proportion * TWO_PI;

    state.continentAngles[cont] = {
      start: startAngle,
      end: startAngle + angleSize,
      mid: startAngle + angleSize / 2,
    };

    startAngle += angleSize;
  });
}

function calculateVolcanoPositions() {
  state.volcanoPositions.clear();

  const volcanoesByContinent = {};

  CONTINENTS.forEach((cont) => {
    volcanoesByContinent[cont] = [];
  });

  state.filteredData.forEach((v) => {
    let key = `${v.name}-${v.year}-${v.deaths}`;
    if (volcanoesByContinent[v.continent]) {
      volcanoesByContinent[v.continent].push({
        key: key,
        volcano: v,
        year: v.year,
      });
    }
  });

  CONTINENTS.forEach((cont) => {
    const angles = state.continentAngles[cont];
    if (!angles || volcanoesByContinent[cont].length === 0) return;

    volcanoesByContinent[cont].sort((a, b) => a.year - b.year);

    const angleRange = angles.end - angles.start;
    const angleStep =
      angleRange / Math.max(1, volcanoesByContinent[cont].length);

    volcanoesByContinent[cont].forEach((item, index) => {
      const angle = angles.start + angleStep * (index + 0.5);
      state.volcanoPositions.set(item.key, angle);
    });
  });
}

function updateAvailableYears() {
  if (state.selectedCentury === null) {
    state.availableYears = [
      ...new Set(state.volcanoData.map((v) => v.year)),
    ].sort((a, b) => a - b);
  } else {
    const centuryIndex = CONCENTRIC_YEARS.indexOf(state.selectedCentury);
    if (centuryIndex !== -1 && centuryIndex < CONCENTRIC_YEARS.length - 1) {
      const startYear = CONCENTRIC_YEARS[centuryIndex];
      const endYear = CONCENTRIC_YEARS[centuryIndex + 1];

      const filteredYears = state.volcanoData
        .filter((v) => {
          if (centuryIndex === CONCENTRIC_YEARS.length - 2) {
            return v.year >= startYear && v.year <= endYear;
          } else {
            return v.year >= startYear && v.year < endYear;
          }
        })
        .map((v) => v.year);

      state.availableYears = [...new Set(filteredYears)].sort((a, b) => a - b);
    } else {
      state.availableYears = [];
    }
  }

  state.timelineYear = null;
  state.displayedYear =
    state.availableYears.length > 0 ? state.availableYears[0] : null;
  state.currentYearIndex = 0;
  state.yearActivatedByUser = false;

  state.isPlaying = false;
  state.animationTimer = 0;
  state.isPausedBetweenCycles = false;
  state.useFastAnimations = false;

  state.selectionAnimationStart.clear();
  state.hoverAnimationStart.clear();

  state.dotAnimationStart = millis();
  state.dotAnimationProgress = 0;
  state.disableDotEntryAnimation = false;

  state.dotAppearTimes.clear();
  state.filteredData.forEach((v) => {
    let key = `${v.name}-${v.year}-${v.deaths}`;
    const randomDelay = Math.random() * CONFIG.animation.randomDelayMax;
    state.dotAppearTimes.set(key, randomDelay);
  });
}

function getRadiusForImpact(impact) {
  if (impactLevels.length <= 1) return CONFIG.layout.minRadius;

  let idx = impactLevels.indexOf(impact);
  if (idx === -1) return CONFIG.layout.minRadius;

  const totalLevels = impactLevels.length;
  const normalized = idx / (totalLevels - 1);

  return map(
    normalized,
    0,
    1,
    CONFIG.layout.maxRadius,
    CONFIG.layout.minRadius,
  );
}

function drawImpactCircles() {
  const specialIndices = [0, 4, 8, 12].filter(
    (index) => index < impactLevels.length,
  );

  if (state.circleRevealStart !== null) {
    const elapsed = millis() - state.circleRevealStart;
    state.circleRevealProgress = constrain(
      elapsed / CIRCLE_REVEAL_DURATION,
      0,
      1,
    );

    if (state.circleRevealProgress >= 1) {
      state.circleRevealStart = null;
    }
  }

  for (let i = 0; i < impactLevels.length; i++) {
    let radius = map(
      i,
      0,
      impactLevels.length - 1,
      CONFIG.layout.maxRadius,
      CONFIG.layout.minRadius,
    );
    noFill();

    const isSpecial = specialIndices.includes(i);

    if (isSpecial) {
      let animatedRadius = radius;
      let animatedStrokeWeight = 2.75;
      let animatedAlpha = 255;

      if (state.circleRevealProgress < 1) {
        const circleProgress = constrain(
          (state.circleRevealProgress * impactLevels.length - i) / 4,
          0,
          1,
        );
        animatedRadius = radius * circleProgress;
        animatedStrokeWeight = 2.75 * circleProgress;
        animatedAlpha = 255 * circleProgress;
      }

      stroke(255, 43, 0, animatedAlpha);
      strokeWeight(animatedStrokeWeight);
      ellipse(0, 0, animatedRadius * 2);
    } else {
      let animatedRadius = radius;
      if (state.circleRevealProgress < 1) {
        const circleProgress = constrain(
          (state.circleRevealProgress * impactLevels.length - i) / 4,
          0,
          1,
        );
        animatedRadius = radius * circleProgress;
      }

      stroke(CONFIG.colors.circle);
      strokeWeight(0.5);
      ellipse(0, 0, animatedRadius * 2);
    }
  }
}

function applyFilters() {
  state.filteredData = state.volcanoData.filter((v) => {
    let centuryMatch = true;

    if (state.selectedCentury !== null) {
      const centuryIndex = CONCENTRIC_YEARS.indexOf(state.selectedCentury);
      if (centuryIndex !== -1 && centuryIndex < CONCENTRIC_YEARS.length - 1) {
        const startYear = CONCENTRIC_YEARS[centuryIndex];
        const endYear = CONCENTRIC_YEARS[centuryIndex + 1];

        if (centuryIndex === CONCENTRIC_YEARS.length - 2) {
          centuryMatch = v.year >= startYear && v.year <= endYear;
        } else {
          centuryMatch = v.year >= startYear && v.year < endYear;
        }
      } else {
        centuryMatch = false;
      }
    }

    const continentMatch =
      state.selectedContinent === null ||
      v.continent === state.selectedContinent;
    return centuryMatch && continentMatch;
  });

  calculateContinentData();
  calculateVolcanoPositions();
  updateAvailableYears();

  //panel di ricerca eruzione
  if (state.searchPanelOpen) {
    if (state.searchVolcanoesPanelOpen && state.searchSelectedContinent) {
      //raggruppamento vulcani del continente
      const continentVolcanoes = state.filteredData.filter(
        (v) => v.continent === state.searchSelectedContinent,
      );
      const volcanoMap = new Map();
      continentVolcanoes.forEach((v) => {
        if (!volcanoMap.has(v.name)) {
          volcanoMap.set(v.name, v);
        }
      });
      state.searchPanelVolcanoes = Array.from(volcanoMap.values()).sort(
        (a, b) => a.name.localeCompare(b.name),
      );
    } else if (state.searchEruptionsPanelOpen && state.searchSelectedVolcano) {
      //aggiornamento dell eruzioni del vulcano selezionato
      state.searchPanelEruptions = state.filteredData
        .filter((v) => v.name === state.searchSelectedVolcano.name)
        .sort((a, b) => a.year - b.year);
    }

    recalculateSearchPanelHeight();
  }

  if (state.selectedCentury !== null || state.selectedContinent !== null) {
    state.useFastAnimations = false;
    state.dotAnimationStart = millis();
    state.dotAnimationProgress = 0;

    state.dotAppearTimes.clear();
    state.filteredData.forEach((v) => {
      let key = `${v.name}-${v.year}-${v.deaths}`;
      const randomDelay = Math.random() * CONFIG.animation.randomDelayMax;
      state.dotAppearTimes.set(key, randomDelay);
    });
  }
}

function getGlobalYearRange() {
  const years = state.volcanoData.map((v) => v.year);
  return {
    min: Math.min(...years),
    max: Math.max(...years),
  };
}

function updateAnimation() {
  if (!state.isPlaying || state.availableYears.length === 0) return;

  if (!state.yearActivatedByUser) {
    state.yearActivatedByUser = true;
    state.timelineYear = state.availableYears[state.currentYearIndex];
    state.displayedYear = state.availableYears[state.currentYearIndex];
    state.selectionAnimationStart.clear();
  }

  if (state.isPausedBetweenCycles) {
    state.animationTimer += deltaTime;
    if (state.animationTimer >= state.pauseBetweenCycles) {
      state.animationTimer = 0;
      state.isPausedBetweenCycles = false;
      state.currentYearIndex = 0;
      state.timelineYear = state.availableYears[0];
      state.displayedYear = state.availableYears[0];
    }
  }

  state.animationTimer += deltaTime;

  if (state.animationTimer >= state.animationSpeed) {
    state.animationTimer = 0;

    if (state.currentYearIndex < state.availableYears.length - 1) {
      state.currentYearIndex++;
    } else {
      state.isPausedBetweenCycles = true;
      return;
    }
  }

  state.timelineYear = state.availableYears[state.currentYearIndex];
  state.displayedYear = state.availableYears[state.currentYearIndex];
}

function updateDotAnimations() {
  if (state.isPlaying) {
    state.disableDotEntryAnimation = true;
  } else if (!state.isPlaying && state.dotAnimationStart === null) {
    state.disableDotEntryAnimation = false;
  }

  if (state.dotAnimationStart !== null) {
    const elapsed = millis() - state.dotAnimationStart;
    const duration = state.useFastAnimations
      ? CONFIG.animation.fastDotEntryDuration
      : CONFIG.animation.dotEntryDuration;

    state.dotAnimationProgress = constrain(elapsed / duration, 0, 1);

    if (state.dotAnimationProgress >= 1) {
      state.dotAnimationStart = null;
    }
  }

  if (state.waveAnimationStart !== null) {
    const waveElapsed = millis() - state.waveAnimationStart;
    state.waveAnimationProgress = constrain(
      waveElapsed / CONFIG.animation.waveDuration,
      0,
      1,
    );

    if (state.waveAnimationProgress >= 1) {
      state.waveAnimationStart = null;
    }
  }
}

function updateSearchPanelAnimation() {
  if (state.searchPanelAnimStart !== null) {
    const elapsed = millis() - state.searchPanelAnimStart;
    state.searchPanelAnimProgress = constrain(
      elapsed / SEARCH_PANEL_ANIM_DURATION,
      0,
      1,
    );

    if (state.searchPanelAnimProgress < 1) {
      state.searchPanelHeight = lerp(
        0,
        state.searchTargetHeight,
        state.searchPanelAnimProgress,
      );
    } else {
      state.searchPanelHeight = state.searchTargetHeight;
      state.searchPanelAnimStart = null;
    }
  }
}

function startFastDotAnimations() {
  state.useFastAnimations = true;
  state.dotAnimationStart = millis();
  state.dotAnimationProgress = 0;

  state.dotAppearTimes.clear();
  state.filteredData.forEach((v) => {
    let key = `${v.name}-${v.year}-${v.deaths}`;
    const randomDelay = Math.random() * CONFIG.animation.fastRandomDelayMax;
    state.dotAppearTimes.set(key, randomDelay);
  });
}

function triggerWaveAnimation() {
  state.waveAnimationStart = millis();
  state.waveAnimationProgress = 0;
}

function triggerVolcanoEruption(volcano, x, y) {
  const originalSize = map(volcano.impact, 1, 15, 5, 15);

  state.eruption = {
    active: true,
    phase: "imploding",
    x: x,
    y: y,
    startTime: millis(),
    volcano: volcano,
    originalSize: originalSize,
    currentSize: originalSize,
    shockwaves: [],
    pulses: [],
    implosionStart: millis(),
    pauseStart: 0,
    explosionStart: 0,
  };

  for (let i = 0; i < CONFIG.animation.shockwaveCount; i++) {
    state.eruption.shockwaves.push({
      startTime: 0,
      size: 0,
      maxSize: random(50, 100),
      thickness: random(1, 3),
      delay: i * 50,
    });
  }

  for (let i = 0; i < CONFIG.animation.pulseCount; i++) {
    state.eruption.pulses.push({
      angle: random(TWO_PI),
      distance: 0,
      maxDistance: random(50, 200),
      speed: random(3, 8),
      size: random(2, 6),
      active: false,
    });
  }

  state.isPlaying = false;
  state.waveAnimationStart = null;
}

function updateEruptionAnimation() {
  if (!state.eruption.active) return;

  const currentTime = millis();
  const totalElapsed = currentTime - state.eruption.startTime;

  if (state.eruption.phase === "imploding") {
    const implosionElapsed = currentTime - state.eruption.implosionStart;
    const implosionProgress = constrain(
      implosionElapsed / CONFIG.animation.implosionDuration,
      0,
      1,
    );

    state.eruption.currentSize =
      state.eruption.originalSize * (1 - implosionProgress * 0.9);

    if (implosionProgress >= 1) {
      state.eruption.phase = "pause";
      state.eruption.pauseStart = currentTime;
    }
  } else if (state.eruption.phase === "pause") {
    const pauseElapsed = currentTime - state.eruption.pauseStart;

    if (pauseElapsed >= CONFIG.animation.pauseDuration) {
      state.eruption.phase = "exploding";
      state.eruption.explosionStart = currentTime;

      for (let wave of state.eruption.shockwaves) {
        wave.startTime = currentTime + wave.delay;
      }

      for (let pulse of state.eruption.pulses) {
        pulse.active = true;
      }
    }
  } else if (state.eruption.phase === "exploding") {
    const explosionElapsed = currentTime - state.eruption.explosionStart;
    const explosionProgress = constrain(
      explosionElapsed / CONFIG.animation.explosionDuration,
      0,
      1,
    );

    state.eruption.currentSize =
      state.eruption.originalSize *
      (1 + explosionProgress * CONFIG.animation.maxExplosionScale);

    for (let wave of state.eruption.shockwaves) {
      if (wave.startTime > 0 && currentTime >= wave.startTime) {
        const waveElapsed = currentTime - wave.startTime;
        if (waveElapsed < 400) {
          const waveProgress = constrain(waveElapsed / 400, 0, 1);
          wave.size = waveProgress * wave.maxSize;
        }
      }
    }

    for (let pulse of state.eruption.pulses) {
      if (pulse.active) {
        pulse.distance = min(pulse.distance + pulse.speed, pulse.maxDistance);
      }
    }

    if (explosionProgress >= 1) {
      state.eruption.phase = "complete";

      setTimeout(() => {
        const v = state.eruption.volcano;
        const url = `detail.html?name=${encodeURIComponent(v.name)}&year=${v.year}&impact=${v.impact}`;

        window.location.href = url;
      }, 100);
    }
  }
}

function drawEruption() {
  if (!state.eruption.active) return;

  push();

  const currentTime = millis();

  if (
    state.eruption.phase === "imploding" ||
    state.eruption.phase === "pause"
  ) {
    const size = state.eruption.currentSize;

    fill(0);
    stroke(255, 43, 0);
    strokeWeight(2);
    circle(state.eruption.x, state.eruption.y, size);

    if (state.eruption.phase === "pause") {
      const pulseTime = currentTime - state.eruption.pauseStart;
      const pulseSize = sin(pulseTime * 0.05) * 3;

      noFill();
      stroke(255, 43, 0, 100);
      strokeWeight(1);
      circle(state.eruption.x, state.eruption.y, size + pulseSize);
    }
  } else if (state.eruption.phase === "exploding") {
    const explosionProgress = constrain(
      (currentTime - state.eruption.explosionStart) /
        CONFIG.animation.explosionDuration,
      0,
      1,
    );
    const centerAlpha = 255 * (1 - explosionProgress * 0.7);

    fill(255, 255, 255, centerAlpha);
    noStroke();
    circle(
      state.eruption.x,
      state.eruption.y,
      state.eruption.currentSize * 0.3,
    );

    noFill();
    stroke(255, 43, 0, 200 * (1 - explosionProgress));
    strokeWeight(4);
    circle(state.eruption.x, state.eruption.y, state.eruption.currentSize);

    for (let wave of state.eruption.shockwaves) {
      if (wave.startTime > 0 && currentTime >= wave.startTime) {
        const waveElapsed = currentTime - wave.startTime;
        if (waveElapsed < 400) {
          const waveProgress = waveElapsed / 400;
          const alpha = 150 * (1 - waveProgress);

          stroke(255, 43, 0, alpha);
          strokeWeight(wave.thickness);
          circle(state.eruption.x, state.eruption.y, wave.size);

          stroke(255, 255, 255, alpha * 0.6);
          strokeWeight(wave.thickness * 0.5);
          circle(state.eruption.x, state.eruption.y, wave.size * 1.2);
        }
      }
    }

    for (let pulse of state.eruption.pulses) {
      if (pulse.active) {
        const endX = state.eruption.x + cos(pulse.angle) * pulse.distance;
        const endY = state.eruption.y + sin(pulse.angle) * pulse.distance;

        stroke(255, 43, 0, 150 * (1 - pulse.distance / pulse.maxDistance));
        strokeWeight(1);
        line(state.eruption.x, state.eruption.y, endX, endY);

        fill(255, 255, 255, 200 * (1 - pulse.distance / pulse.maxDistance));
        noStroke();
        circle(endX, endY, pulse.size);
      }
    }

    const expansionCount = 3;
    for (let i = 0; i < expansionCount; i++) {
      const offset = i * 0.2;
      const adjustedProgress = max(0, explosionProgress - offset);

      if (adjustedProgress > 0) {
        const circleSize = state.eruption.currentSize * (0.5 + i * 0.3);
        const alpha = 100 * (1 - adjustedProgress);

        noFill();
        stroke(255, 100, 0, alpha);
        strokeWeight(2 - i * 0.5);
        circle(state.eruption.x, state.eruption.y, circleSize);
      }
    }

    if (explosionProgress < 0.5) {
      const distortionProgress = explosionProgress * 2;
      const distortionAlpha = 80 * (1 - distortionProgress);

      for (let i = 0; i < 3; i++) {
        const size = state.eruption.currentSize * (0.3 + i * 0.2);
        noFill();
        stroke(255, 200, 200, distortionAlpha);
        strokeWeight(1);
        drawingContext.setLineDash([5, 5]);
        circle(state.eruption.x, state.eruption.y, size);
        drawingContext.setLineDash([]);
      }
    }

    if (explosionProgress < 0.3) {
      const flashProgress = explosionProgress / 0.3;
      const flashAlpha = 30 * (1 - flashProgress);

      fill(255, 255, 255, flashAlpha);
      noStroke();
      rect(0, 0, width, height);
    }
  }

  pop();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function updateTransition() {
  if (!transitionState.active) return;

  const elapsed = millis() - transitionState.startTime;
  const progress = constrain(elapsed / transitionState.duration, 0, 1);

  const easedProgress = easeOutCubic(progress);

  const currentRadius = lerp(
    transitionState.startRadius,
    transitionState.targetRadius,
    easedProgress,
  );

  if (progress >= 1) {
    transitionState.active = false;
    window.location.href = "learn_more_overview.html";
  }
}

function drawTransition() {
  if (!transitionState.active) return;

  const elapsed = millis() - transitionState.startTime;
  const progress = constrain(elapsed / transitionState.duration, 0, 1);
  const easedProgress = easeOutCubic(progress);

  const currentRadius = lerp(
    transitionState.startRadius,
    transitionState.targetRadius,
    easedProgress,
  );

  push();

  fill(255, 43, 0);
  noStroke();

  ellipse(
    transitionState.startX,
    transitionState.startY,
    currentRadius * 2,
    currentRadius * 2,
  );

  stroke(200, 30, 0, 100);
  strokeWeight(2);
  noFill();
  ellipse(
    transitionState.startX,
    transitionState.startY,
    currentRadius * 2,
    currentRadius * 2,
  );

  pop();
}

function startTransitionToLearnMore() {
  const buttonRect = state.learnMoreButtonArea;

  transitionState.startX = buttonRect.x + buttonRect.width / 2;
  transitionState.startY = buttonRect.y + buttonRect.height / 2;

  transitionState.startRadius = max(buttonRect.width, buttonRect.height) / 2;

  transitionState.targetRadius =
    dist(
      transitionState.startX,
      transitionState.startY,
      width / 2,
      height / 2,
    ) +
    max(width, height) / 2;

  transitionState.active = true;
  transitionState.startTime = millis();

  state.isPlaying = false;
}

function draw() {
  background(CONFIG.colors.background);
  drawNavBar();

  updateTransition();
  updateSearchPanelAnimation();

  updateButtonHoverStates();

  updateAnimation();
  updateDotAnimations();
  updateEruptionAnimation();

  drawTitle();
  drawStartAnimationButton();
  drawSearchButton();
  drawLearnMoreButton();

  drawLegend();

  if (state.searchPanelOpen) {
    drawSearchPanel();
  }

  drawTemporalRangeSelector();
  drawYearSelector();

  drawMainCircle();
  drawContinentLabels();

  drawEruption();

  checkHover();
  drawInfobox();

  if (transitionState.active) {
    drawTransition();
  }

  updateCursor();
}

function drawNavBar() {
  push();

  //navbar fissa in alto
  let navHeight = 60;
  let navY = 0;

  //sfondo navbar
  fill(255);
  noStroke();
  rect(0, navY, width, navHeight);

  //logo
  fill(0);
  textSize(15);
  textFont("Helvetica");
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("Significant Volcanic Eruptions", 40, navHeight / 2);

  //area logo per click
  let logoText = "Significant Volcanic Eruptions";
  let logoWidth = textWidth(logoText);
  state.logoArea = {
    x: 40 - 11,
    y: navY,
    width: logoWidth + 20,
    height: navHeight,
  };

  //link
  let navLinks = [
    { name: "Homepage", href: "../index.html", x: 0 },
    { name: "Team", href: "team.html", x: 0 },
    { name: "Methodology", href: "methodology.html", x: 0 },
    { name: "Explore", href: "overview.html", x: 0, isExplore: true },
  ];

  let totalLinksWidth = 0;
  let linkSpacing = 40;
  let linkFontSize = 15;

  textSize(linkFontSize);
  textStyle(NORMAL);

  for (let link of navLinks) {
    link.width = textWidth(link.name);
    totalLinksWidth += link.width;
  }
  totalLinksWidth += (navLinks.length - 1) * linkSpacing;

  //posizione link
  let startX = width - totalLinksWidth - 40;
  let currentX = startX;

  for (let i = 0; i < navLinks.length; i++) {
    let link = navLinks[i];
    link.x = currentX;
    link.y = navHeight / 2;

    //link
    if (link.isExplore) {
      fill("#FF2B00");
      textStyle(BOLD);
    } else {
      fill(0);
      textStyle(NORMAL);
    }

    text(link.name, link.x, link.y);

    //hover
    let textW = link.width;
    let textH = 20;
    let textX = link.x;
    let textY = link.y - textH / 2;

    if (
      mouseX > textX &&
      mouseX < textX + textW &&
      mouseY > textY &&
      mouseY < textY + textH
    ) {
      if (!link.isExplore) {
        fill("#FF2B00");
        text(link.name, link.x, link.y);
      }
    }

    currentX += link.width + linkSpacing;
  }
  state.navLinks = navLinks;

  stroke(245, 40, 0);
  strokeWeight(1);
  line(0, navHeight - 5, width, navHeight - 5);

  pop();
}

function updateButtonHoverStates() {
  //hover bottoni
  state.hoveredStartButton =
    state.startButtonArea &&
    mouseX > state.startButtonArea.x &&
    mouseX < state.startButtonArea.x + state.startButtonArea.width &&
    mouseY > state.startButtonArea.y &&
    mouseY < state.startButtonArea.y + state.startButtonArea.height;

  state.hoveredSearchButton =
    state.searchButtonArea &&
    mouseX > state.searchButtonArea.x &&
    mouseX < state.searchButtonArea.x + state.searchButtonArea.width &&
    mouseY > state.searchButtonArea.y &&
    mouseY < state.searchButtonArea.y + state.searchButtonArea.height;

  state.hoveredLearnMoreButton =
    state.learnMoreButtonArea &&
    mouseX > state.learnMoreButtonArea.x &&
    mouseX < state.learnMoreButtonArea.x + state.learnMoreButtonArea.width &&
    mouseY > state.learnMoreButtonArea.y &&
    mouseY < state.learnMoreButtonArea.y + state.learnMoreButtonArea.height;

  state.hoveredTimeFrameLeft =
    state.timeFrameLeftArrows &&
    mouseX > state.timeFrameLeftArrows.x &&
    mouseX < state.timeFrameLeftArrows.x + state.timeFrameLeftArrows.width &&
    mouseY > state.timeFrameLeftArrows.y &&
    mouseY < state.timeFrameLeftArrows.y + state.timeFrameLeftArrows.height;

  state.hoveredTimeFrameRight =
    state.timeFrameRightArrows &&
    mouseX > state.timeFrameRightArrows.x &&
    mouseX < state.timeFrameRightArrows.x + state.timeFrameRightArrows.width &&
    mouseY > state.timeFrameRightArrows.y &&
    mouseY < state.timeFrameRightArrows.y + state.timeFrameRightArrows.height;

  state.hoveredYearLeft =
    state.yearLeftArrow &&
    mouseX > state.yearLeftArrow.x &&
    mouseX < state.yearLeftArrow.x + state.yearLeftArrow.width &&
    mouseY > state.yearLeftArrow.y &&
    mouseY < state.yearLeftArrow.y + state.yearLeftArrow.height;

  state.hoveredYearRight =
    state.yearRightArrow &&
    mouseX > state.yearRightArrow.x &&
    mouseX < state.yearRightArrow.x + state.yearRightArrow.width &&
    mouseY > state.yearRightArrow.y &&
    mouseY < state.yearRightArrow.y + state.yearRightArrow.height;
}

function drawTitle() {
  textSize(72);
  textFont("Helvetica");
  textStyle(BOLD);
  textAlign(LEFT, TOP);

  const titleY = CONFIG.layout.titleStartY + CONFIG.layout.topOffset;

  fill(CONFIG.colors.text);
  text("SIGNIFICANT", CONFIG.layout.marginX, titleY);

  fill(CONFIG.colors.text);
  text("VOLCANIC", CONFIG.layout.marginX, titleY + 75);

  fill(CONFIG.colors.accent);
  text("ERUPTIONS", CONFIG.layout.marginX, titleY + 150);

  textStyle(NORMAL);
}

function drawStartAnimationButton() {
  const buttonWidth = 200;
  const buttonHeight = 40;
  const buttonX = CONFIG.layout.marginX;
  const buttonY = height - 40 - buttonHeight;

  //hover
  if (state.hoveredStartButton) {
    fill(255, 43, 0); //rosso
    stroke(255, 43, 0);
  } else {
    noFill();
    stroke(255, 43, 0);
  }
  strokeWeight(1);
  rect(buttonX, buttonY, buttonWidth, buttonHeight, 5);

  //play/pause
  if (state.hoveredStartButton) {
    fill(255);
  } else {
    fill(255, 43, 0);
  }
  noStroke();

  if (state.isPlaying) {
    rect(buttonX + 15, buttonY + 10, 20, 20);
  } else {
    triangle(
      buttonX + 15,
      buttonY + 10,
      buttonX + 15,
      buttonY + 30,
      buttonX + 35,
      buttonY + 20,
    );
  }

  //testo
  if (state.hoveredStartButton) {
    fill(255);
  } else {
    fill(0);
  }
  noStroke();
  textSize(CONFIG.layout.labelFontSize);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  const buttonText = state.isPlaying ? "Stop Animation" : "Start Animation";
  text(buttonText, buttonX + 50, buttonY + 20);

  state.startButtonArea = {
    x: buttonX,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight,
  };
}

function drawSearchButton() {
  const startButtonRight =
    state.startButtonArea.x + state.startButtonArea.width;
  const learnMoreButtonLeft = state.learnMoreButtonArea
    ? state.learnMoreButtonArea.x
    : width - 160 - 50;
  const availableSpace = learnMoreButtonLeft - startButtonRight;

  const buttonHeight = 40;
  const buttonWidth = 190;

  //allineamento con bottone star animatino
  const buttonY = height - 40 - buttonHeight;
  const buttonX = CONFIG.layout.marginX + 210;

  //hover
  if (state.hoveredSearchButton) {
    fill(255, 43, 0);
    stroke(255, 43, 0);
  } else {
    noFill();
    stroke(245, 40, 0);
  }
  strokeWeight(1);
  rect(buttonX, buttonY, buttonWidth, buttonHeight, 5);

  //lente di ingrandimento
  push();
  translate(buttonX + 22, buttonY + buttonHeight / 2.2);

  //cerchio della lente
  if (state.hoveredSearchButton) {
    stroke(255);
  } else {
    stroke(245, 40, 0);
  }
  strokeWeight(1.5);
  noFill();
  circle(0, 0, 18);

  //manico della lente
  const handleLength = 8;
  const handleAngle = PI / 4;
  const handleX = cos(handleAngle) * 9;
  const handleY = sin(handleAngle) * 9;
  line(
    handleX,
    handleY,
    handleX + cos(handleAngle) * handleLength,
    handleY + sin(handleAngle) * handleLength,
  );

  pop();

  //testo
  if (state.hoveredSearchButton) {
    fill(255);
  } else {
    fill(0);
  }
  noStroke();
  textSize(CONFIG.layout.labelFontSize);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("Search Eruptions", buttonX + 43, buttonY + buttonHeight / 2);

  //area cliccabile
  state.searchButtonArea = {
    x: buttonX,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight,
  };
}

function drawSearchPanel() {
  if (!state.searchButtonArea) return;

  const panelX = state.searchButtonArea.x + state.searchButtonArea.width + 10;
  const panelY = state.searchButtonArea.y + 40;

  const currentPanelHeight = state.searchPanelHeight;
  const panelTopY = panelY - currentPanelHeight;

  const legendStartY = CONFIG.layout.legendStartY;

  const legendOverlap = legendStartY - panelTopY;

  let extraHeight = 0;
  if (legendOverlap > 0) {
    extraHeight = legendOverlap + 120 + 20;
  }

  extraHeight = max(0, extraHeight);

  fill(255);
  noStroke();

  let animatedExtraHeight = 0;
  if (state.searchPanelAnimProgress < 1) {
    animatedExtraHeight = extraHeight * state.searchPanelAnimProgress;
  } else {
    animatedExtraHeight = extraHeight;
  }

  rect(
    panelX - 5,
    panelY - currentPanelHeight - 5,
    state.searchPanelWidth + 10,
    currentPanelHeight + 10 + animatedExtraHeight,
  );

  fill(255);
  stroke(245, 40, 0);
  strokeWeight(1);
  rect(
    panelX,
    panelY - currentPanelHeight,
    state.searchPanelWidth,
    currentPanelHeight,
    8,
  );

  if (currentPanelHeight > 20) {
    push();
    translate(panelX, panelY - currentPanelHeight);

    fill(255);
    noStroke();
    rect(2, 2, state.searchPanelWidth - 4, currentPanelHeight - 4, 6);

    //clip per evitare che il contenuto esca dal pannello
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(0, 0, state.searchPanelWidth, currentPanelHeight);
    drawingContext.clip();

    if (state.searchContinentsPanelOpen) {
      drawContinentsList(currentPanelHeight);
    } else if (state.searchVolcanoesPanelOpen) {
      drawVolcanoesList(currentPanelHeight);
    } else if (state.searchEruptionsPanelOpen) {
      drawEruptionsList(currentPanelHeight);
    }

    drawingContext.restore();
    pop();
  }
}

function drawContinentsList(panelHeight) {
  const margin = 15;
  const itemHeight = 35;
  const titleHeight = 40;

  //titolo
  fill(245, 40, 0);
  noStroke();
  textSize(14);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("SELECT CONTINENT", margin, titleHeight / 2);

  //linea separatrice
  stroke(245, 40, 0, 100);
  strokeWeight(1);
  line(margin, titleHeight, state.searchPanelWidth - margin, titleHeight);

  //lista continenti
  let y = titleHeight + 10;
  for (let i = 0; i < CONTINENTS.length; i++) {
    const continent = CONTINENTS[i];

    if (y + itemHeight > panelHeight) break;

    //hover
    const panelX = state.searchButtonArea.x + state.searchButtonArea.width + 10;
    const panelY = state.searchButtonArea.y + 40 - panelHeight;
    const localX = mouseX - panelX;
    const localY = mouseY - panelY;

    const isHovered =
      localX > margin &&
      localX < state.searchPanelWidth - margin &&
      localY > y &&
      localY < y + itemHeight;

    //background hover (rosso trasparente)
    if (isHovered) {
      fill(245, 40, 0, 15);
      noStroke();
      rect(margin, y, state.searchPanelWidth - 2 * margin, itemHeight, 6);

      state.hoveredSearchItemIndex = i;
    }

    //nome continente
    fill(0);
    noStroke();
    textSize(14);
    textStyle(NORMAL);
    textAlign(LEFT, CENTER);
    text(continent, margin + 10, y + itemHeight / 2);

    //numero di eruzioni nel continente
    const eruptionsCount = state.filteredData.filter(
      (v) => v.continent === continent,
    ).length;
    fill(245, 40, 0);
    textSize(12);
    textStyle(BOLD);
    textAlign(RIGHT, CENTER);
    text(
      `(${eruptionsCount})`,
      state.searchPanelWidth - margin - 10,
      y + itemHeight / 2,
    );

    y += itemHeight + 5;
  }
}

function drawVolcanoesList(panelHeight) {
  const margin = 15;
  const itemHeight = 32;
  const titleHeight = 40;
  const scrollbarWidth = 6;

  //titolo con freccia per tornare indietro
  push();
  translate(0, titleHeight / 2);

  //freccia per tornare indietro
  fill(245, 40, 0);
  noStroke();
  textSize(18);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("←", margin, 0);

  //nome continente
  textSize(14);
  text(state.searchSelectedContinent.toUpperCase(), margin + 25, 0);

  pop();

  //linea separatrice
  stroke(245, 40, 0, 100);
  strokeWeight(1);
  line(margin, titleHeight, state.searchPanelWidth - margin, titleHeight);

  //area scorrimento
  const totalItems = state.searchPanelVolcanoes.length;
  const contentHeight = totalItems * itemHeight;
  const visibleHeight = min(panelHeight - titleHeight, contentHeight);
  const needsScroll = contentHeight > visibleHeight;

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, titleHeight, state.searchPanelWidth, visibleHeight);
  drawingContext.clip();

  //lLista vulcani
  for (let i = 0; i < totalItems; i++) {
    const volcano = state.searchPanelVolcanoes[i];
    const y = titleHeight + i * itemHeight - state.searchPanelScrollY;

    //controlla se l'elemento è visibile
    if (y + itemHeight < titleHeight || y > titleHeight + visibleHeight)
      continue;

    //hover
    const panelX = state.searchButtonArea.x + state.searchButtonArea.width + 10;
    const panelY = state.searchButtonArea.y + 40 - panelHeight;
    const localX = mouseX - panelX;
    const localY = mouseY - panelY;

    const isHovered =
      localX > margin &&
      localX <
        state.searchPanelWidth - margin - (needsScroll ? scrollbarWidth : 0) &&
      localY > y &&
      localY < y + itemHeight;

    //background hover (rosso trasparente)
    if (isHovered) {
      fill(245, 40, 0, 15);
      noStroke();
      rect(
        margin,
        y,
        state.searchPanelWidth -
          2 * margin -
          (needsScroll ? scrollbarWidth : 0),
        itemHeight,
        6,
      );

      //salva l'indice dell'item hovered
      state.hoveredVolcanoItemIndex = i;
    }

    //nome vulcano
    fill(0);
    noStroke();
    textSize(12);
    textStyle(NORMAL);
    textAlign(LEFT, CENTER);

    //abbrevia il nome se troppo lungo
    let volcanoName = volcano.name;
    const maxWidth =
      state.searchPanelWidth -
      2 * margin -
      (needsScroll ? scrollbarWidth : 0) -
      50;
    textSize(12);
    while (textWidth(volcanoName) > maxWidth && volcanoName.length > 20) {
      volcanoName = volcanoName.substring(0, volcanoName.length - 4) + "...";
    }

    text(volcanoName, margin + 5, y + itemHeight / 2);

    //numero di eruzioni del vulcano
    const eruptionsCount = state.filteredData.filter(
      (v) => v.name === volcano.name,
    ).length;
    fill(245, 40, 0);
    textSize(11);
    textStyle(BOLD);
    textAlign(RIGHT, CENTER);
    text(
      `(${eruptionsCount})`,
      state.searchPanelWidth - margin - (needsScroll ? scrollbarWidth + 5 : 5),
      y + itemHeight / 2,
    );
  }

  drawingContext.restore();

  //scrollbar
  if (needsScroll) {
    const scrollbarX = state.searchPanelWidth - scrollbarWidth - 4;
    const scrollbarHeight = visibleHeight * (visibleHeight / contentHeight);
    const scrollbarY =
      titleHeight +
      map(
        state.searchPanelScrollY,
        0,
        contentHeight - visibleHeight,
        0,
        visibleHeight - scrollbarHeight,
      );

    //track
    fill(240);
    noStroke();
    rect(scrollbarX, titleHeight, scrollbarWidth, visibleHeight, 3);

    //thumb
    fill(200);
    rect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 3);

    //thumb hover
    const panelX = state.searchButtonArea.x + state.searchButtonArea.width + 10;
    const panelY = state.searchButtonArea.y + 40 - panelHeight;
    const localX = mouseX - panelX;
    const localY = mouseY - panelY;

    if (
      localX > scrollbarX &&
      localX < scrollbarX + scrollbarWidth &&
      localY > scrollbarY + titleHeight &&
      localY < scrollbarY + titleHeight + scrollbarHeight
    ) {
      fill(180);
      rect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 3);
    }
  }
}

function drawEruptionsList(panelHeight) {
  const margin = 15;
  const itemHeight = 28;
  const titleHeight = 40;
  const scrollbarWidth = 6;

  //titolo con freccia per tornare indietro
  push();
  translate(0, titleHeight / 2);

  //freccia per tornare indietro
  fill(245, 40, 0);
  noStroke();
  textSize(18);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("←", margin, 0);

  //nome vulcano (troncato se troppo lungo)
  let volcanoName = state.searchSelectedVolcano.name;
  textSize(14);
  const maxTitleWidth = state.searchPanelWidth - margin - 40;
  while (textWidth(volcanoName) > maxTitleWidth && volcanoName.length > 15) {
    volcanoName = volcanoName.substring(0, volcanoName.length - 4) + "...";
  }
  text(volcanoName.toUpperCase(), margin + 25, 0);

  pop();

  //linea separatrice
  stroke(245, 40, 0, 100);
  strokeWeight(1);
  line(margin, titleHeight, state.searchPanelWidth - margin, titleHeight);

  //area scorrimento
  const totalItems = state.searchPanelEruptions.length;
  const contentHeight = totalItems * itemHeight;
  const visibleHeight = min(panelHeight - titleHeight, contentHeight);
  const needsScroll = contentHeight > visibleHeight;

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, titleHeight, state.searchPanelWidth, visibleHeight);
  drawingContext.clip();

  //lista eruzioni
  for (let i = 0; i < totalItems; i++) {
    const eruption = state.searchPanelEruptions[i];
    const y = titleHeight + i * itemHeight - state.searchPanelScrollY;

    //controlla se l'elemento è visibile
    if (y + itemHeight < titleHeight || y > titleHeight + visibleHeight)
      continue;

    //calcola hover
    const panelX = state.searchButtonArea.x + state.searchButtonArea.width + 10;
    const panelY = state.searchButtonArea.y + 40 - panelHeight;
    const localX = mouseX - panelX;
    const localY = mouseY - panelY;

    const isHovered =
      localX > margin &&
      localX <
        state.searchPanelWidth - margin - (needsScroll ? scrollbarWidth : 0) &&
      localY > y &&
      localY < y + itemHeight;

    //background hover (rosso trasparente)
    if (isHovered) {
      fill(245, 40, 0, 15);
      noStroke();
      rect(
        margin,
        y,
        state.searchPanelWidth -
          2 * margin -
          (needsScroll ? scrollbarWidth : 0),
        itemHeight,
        6,
      );

      //indice item hovered
      state.hoveredEruptionItemIndex = i;
    }

    //anno
    fill(245, 40, 0);
    noStroke();
    textSize(11);
    textStyle(BOLD);
    textAlign(LEFT, CENTER);
    text(formatYear(eruption.year), margin + 5, y + itemHeight / 2);

    //impact
    fill(0);
    textSize(11);
    textStyle(NORMAL);
    textAlign(RIGHT, CENTER);
    text(
      `Impact: ${eruption.impact}`,
      state.searchPanelWidth - margin - (needsScroll ? scrollbarWidth + 5 : 5),
      y + itemHeight / 2,
    );
  }

  drawingContext.restore();

  //scrollbar
  if (needsScroll) {
    const scrollbarX = state.searchPanelWidth - scrollbarWidth - 4;
    const scrollbarHeight = visibleHeight * (visibleHeight / contentHeight);
    const scrollbarY =
      titleHeight +
      map(
        state.searchPanelScrollY,
        0,
        contentHeight - visibleHeight,
        0,
        visibleHeight - scrollbarHeight,
      );

    //track
    fill(240);
    noStroke();
    rect(scrollbarX, titleHeight, scrollbarWidth, visibleHeight, 3);

    //thumb
    fill(200);
    rect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 3);

    //thumb hover
    const panelX = state.searchButtonArea.x + state.searchButtonArea.width + 10;
    const panelY = state.searchButtonArea.y + 40 - panelHeight;
    const localX = mouseX - panelX;
    const localY = mouseY - panelY;

    if (
      localX > scrollbarX &&
      localX < scrollbarX + scrollbarWidth &&
      localY > scrollbarY + titleHeight &&
      localY < scrollbarY + titleHeight + scrollbarHeight
    ) {
      fill(180);
      rect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 3);
    }
  }
}

function openSearchPanel() {
  state.searchPanelOpen = true;
  state.searchPanelAnimStart = millis();
  state.searchPanelAnimProgress = 0;
  state.searchContinentsPanelOpen = true;
  state.searchVolcanoesPanelOpen = false;
  state.searchEruptionsPanelOpen = false;
  state.searchSelectedContinent = null;
  state.searchSelectedVolcano = null;
  state.searchPanelVolcanoes = [];
  state.searchPanelEruptions = [];
  state.searchPanelScrollY = 0;
  state.hoveredSearchItemIndex = -1;
  state.hoveredVolcanoItemIndex = -1;
  state.hoveredEruptionItemIndex = -1;

  recalculateSearchPanelHeight();

  state.searchPanelHasFocus = true;
}

function closeSearchPanel() {
  state.searchPanelOpen = false;
  state.searchPanelAnimStart = null;
  state.searchPanelAnimProgress = 0;
  state.searchContinentsPanelOpen = true;
  state.searchVolcanoesPanelOpen = false;
  state.searchEruptionsPanelOpen = false;
  state.searchSelectedContinent = null;
  state.searchSelectedVolcano = null;
  state.searchPanelVolcanoes = [];
  state.searchPanelEruptions = [];
  state.searchPanelScrollY = 0;
  state.hoveredSearchItemIndex = -1;
  state.hoveredVolcanoItemIndex = -1;
  state.hoveredEruptionItemIndex = -1;

  state.searchPanelHeight = 0;
  state.searchTargetHeight = 0;

  state.searchPanelHasFocus = false;
}

function selectContinentInSearch(continent) {
  state.searchSelectedContinent = continent;
  state.searchContinentsPanelOpen = false;
  state.searchVolcanoesPanelOpen = true;
  state.searchEruptionsPanelOpen = false;

  //raccolta vulcani per continenti
  const continentVolcanoes = state.filteredData.filter(
    (v) => v.continent === continent,
  );

  //raccolta per nome del vulcano
  const volcanoMap = new Map();
  continentVolcanoes.forEach((v) => {
    if (!volcanoMap.has(v.name)) {
      volcanoMap.set(v.name, v);
    }
  });

  state.searchPanelVolcanoes = Array.from(volcanoMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  state.searchPanelScrollY = 0;
  state.hoveredVolcanoItemIndex = -1;

  state.searchPanelAnimStart = millis();
  state.searchPanelAnimProgress = 0;
  recalculateSearchPanelHeight();
}

function selectVolcanoInSearch(volcano) {
  state.searchSelectedVolcano = volcano;
  state.searchContinentsPanelOpen = false;
  state.searchVolcanoesPanelOpen = false;
  state.searchEruptionsPanelOpen = true;

  //raccolta del eruzioni per vulcano
  state.searchPanelEruptions = state.filteredData
    .filter((v) => v.name === volcano.name)
    .sort((a, b) => a.year - b.year);

  state.searchPanelScrollY = 0;
  state.hoveredEruptionItemIndex = -1;

  state.searchPanelAnimStart = millis();
  state.searchPanelAnimProgress = 0;
  recalculateSearchPanelHeight();
}

function recalculateSearchPanelHeight() {
  if (state.searchContinentsPanelOpen) {
    const margin = 15;
    const itemHeight = 35;
    const titleHeight = 40;
    const totalHeight =
      titleHeight + 10 + CONTINENTS.length * (itemHeight + 5) + 5;
    state.searchTargetHeight = min(totalHeight, state.searchPanelMaxHeight);
  } else if (state.searchVolcanoesPanelOpen && state.searchSelectedContinent) {
    const margin = 15;
    const itemHeight = 32;
    const titleHeight = 40;
    const totalHeight =
      titleHeight + state.searchPanelVolcanoes.length * itemHeight + 15;
    state.searchTargetHeight = min(totalHeight, state.searchPanelMaxHeight);
  } else if (state.searchEruptionsPanelOpen && state.searchSelectedVolcano) {
    const margin = 15;
    const itemHeight = 28;
    const titleHeight = 40;
    const totalHeight =
      titleHeight + state.searchPanelEruptions.length * itemHeight + 15;
    state.searchTargetHeight = min(totalHeight, state.searchPanelMaxHeight);
  }
}

function drawLearnMoreButton() {
  const buttonWidth = 160;
  const buttonHeight = 40;

  // POSIZIONE FISSA: allineato con gli altri bottoni
  const buttonX = width - buttonWidth - 50;
  const buttonY = height - 40 - buttonHeight; // 40px dal fondo

  //bottone con hover
  if (state.hoveredLearnMoreButton) {
    fill(255, 43, 0); //rosso
    stroke(255, 43, 0);
  } else {
    noFill();
    stroke(245, 40, 0);
  }
  strokeWeight(1);
  rect(buttonX, buttonY, buttonWidth, buttonHeight, 5);

  //icona "i" con hover effect
  push();
  translate(buttonX + 25, buttonY + buttonHeight / 2);
  if (state.hoveredLearnMoreButton) {
    stroke(255);
    fill(255);
  } else {
    stroke(245, 40, 0);
    fill(245, 40, 0);
  }
  strokeWeight(1);
  noFill();
  circle(0, 0, 20);
  if (state.hoveredLearnMoreButton) {
    fill(255);
  } else {
    fill(245, 40, 0);
  }
  noStroke();
  textSize(16);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("i", 0, 0);
  pop();

  //testo
  if (state.hoveredLearnMoreButton) {
    fill(255);
  } else {
    fill(0);
  }
  noStroke();
  textSize(CONFIG.layout.labelFontSize);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("Learn More", buttonX + 50, buttonY + buttonHeight / 2);

  state.learnMoreButtonArea = {
    x: buttonX,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight,
  };
}

function drawLegend() {
  const startX = CONFIG.layout.marginX;
  const startY = CONFIG.layout.legendStartY + 20;

  textSize(16);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);
  stroke(CONFIG.colors.accent);
  noFill();

  //grafico visione d'insieme
  const y1 = startY;

  noStroke();
  fill(0);
  circle(startX + 20, y1 + 12, 12);

  noStroke();
  fill(CONFIG.colors.text);
  text("Volcanic eruption", startX + 45, y1 + 12);

  //distribuzione in base al valore d'impatto

  const y2 = startY + 35;

  push();
  translate(startX + 20, y2 + 12);

  stroke(CONFIG.colors.accent);
  strokeWeight(1);
  noFill();

  const R = 13;
  const r = 4;
  const r2 = 3;

  //cerchio grande
  circle(0, 0, R * 2);

  //cerchio centrale
  circle(0, 0, r * 2);

  //linea verticale
  line(0, R + 2, 0, 4);

  fill(CONFIG.colors.accent);
  triangle(0, 1, -2, 6, 2, 6);
  pop();

  noStroke();
  fill(CONFIG.colors.text);
  text("Distribution based on impact range", startX + 45, y2 + 12);

  //Temporal order of eruptions

  const y3 = startY + 70;

  push();
  translate(startX + 15, y3 + 25);

  stroke(CONFIG.colors.accent);
  strokeWeight(1);
  noFill();

  const A = 23;
  const a1 = -PI / 1.7;
  const a2 = -PI / 4;

  //lati dello spicchio
  line(0, 0, cos(a1) * A, sin(a1) * A);
  line(0, 0, cos(a2) * A, sin(a2) * A);

  //arco
  arc(0, 0, A * 2, A * 2, a1, a2);

  //freccia tangente sull'arco
  const ax = cos(a2) * A;
  const ay = sin(a2) * A;

  line(ax, ay, ax - 4, ay - 2);
  line(ax, ay, ax - 2, ay - 4);

  pop();

  noStroke();
  fill(CONFIG.colors.text);
  text(
    "Eruption order: from oldest to most recent within each continent. ",
    startX + 45,
    y3 + 12,
  );
}

function drawTemporalRangeSelector() {
  const startX = CONFIG.layout.marginX;
  const startY = CONFIG.layout.timeframeStartY;
  const labelY = startY;
  const controlsY = startY + 20;

  fill(CONFIG.colors.text);
  noStroke();
  textSize(CONFIG.layout.labelFontSize);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);
  text("Select time frame:", startX, labelY);

  let yearString;

  if (state.selectedCentury === null) {
    yearString = "Full range";
  } else {
    const index = CONCENTRIC_YEARS.indexOf(state.selectedCentury);
    if (index !== -1 && index < CONCENTRIC_YEARS.length - 1) {
      const startYear = formatYearShort(CONCENTRIC_YEARS[index]);
      const endYear = formatYearShort(CONCENTRIC_YEARS[index + 1]);
      yearString = startYear + " - " + endYear;
    } else {
      yearString = "Full range";
    }
  }

  const leftArrowsX = startX;
  const leftArrowsY = controlsY;
  drawDoubleArrowWithBox(
    leftArrowsX,
    leftArrowsY,
    60,
    40,
    "<<",
    state.hoveredTimeFrameLeft,
  );

  const yearX = leftArrowsX + 60;
  fill(CONFIG.colors.text);
  textSize(CONFIG.layout.timeframeFontSize);
  textAlign(CENTER, CENTER);
  text(yearString, yearX + 140, leftArrowsY + 20);

  const rightArrowsX = yearX + 280;
  drawDoubleArrowWithBox(
    rightArrowsX,
    leftArrowsY,
    60,
    40,
    ">>",
    state.hoveredTimeFrameRight,
  );

  state.timeFrameLeftArrows = {
    x: leftArrowsX,
    y: leftArrowsY,
    width: 60,
    height: 40,
  };
  state.timeFrameRightArrows = {
    x: rightArrowsX,
    y: leftArrowsY,
    width: 60,
    height: 40,
  };
}

function drawYearSelector() {
  const startX = CONFIG.layout.marginX;
  const startY = CONFIG.layout.yearStartY;
  const labelY = startY;
  const controlsY = startY + 20;

  fill(CONFIG.colors.accent);
  noStroke();
  textSize(CONFIG.layout.labelFontSize);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);
  text("Select year:", startX, labelY);

  const leftArrowX = startX;
  const leftArrowY = controlsY;
  drawSingleArrowWithBox(
    leftArrowX,
    leftArrowY,
    60,
    40,
    "<",
    state.hoveredYearLeft,
  );

  const yearX = leftArrowX + 100;

  let yearText;
  if (state.displayedYear !== null) {
    yearText = formatYear(state.displayedYear);
  } else if (state.availableYears.length > 0) {
    yearText = formatYear(state.availableYears[0]);
  } else {
    yearText = "No data";
  }

  fill(CONFIG.colors.accent);
  textSize(CONFIG.layout.yearFontSize);
  textAlign(CENTER, CENTER);
  text(yearText, yearX + 100, leftArrowY + 20);

  const rightArrowX = yearX + 240;
  drawSingleArrowWithBox(
    rightArrowX,
    leftArrowY,
    60,
    40,
    ">",
    state.hoveredYearRight,
  );

  state.yearLeftArrow = {
    x: leftArrowX,
    y: leftArrowY,
    width: 50,
    height: 40,
  };
  state.yearRightArrow = {
    x: rightArrowX,
    y: leftArrowY,
    width: 50,
    height: 40,
  };
}

function drawDoubleArrowWithBox(x, y, w, h, arrows, isHovered) {
  if (isHovered) {
    fill(255, 43, 0);
    stroke(255, 43, 0);
  } else {
    fill(255);
    stroke(CONFIG.colors.text);
  }
  strokeWeight(1);
  rect(x, y, w, h, 5);

  if (isHovered) {
    fill(255);
  } else {
    fill(CONFIG.colors.text);
  }
  noStroke();
  textSize(25);
  textAlign(CENTER, CENTER);
  text(arrows, x + w / 2, y + h / 2);
}

function drawSingleArrowWithBox(x, y, w, h, arrow, isHovered) {
  if (isHovered) {
    fill(255, 43, 0);
    stroke(255, 43, 0);
  } else {
    fill(255);
    stroke(CONFIG.colors.accent);
  }
  strokeWeight(1);
  rect(x, y, w, h, 5);

  if (isHovered) {
    fill(255);
  } else {
    fill(CONFIG.colors.accent);
  }
  noStroke();
  textSize(25);
  textAlign(CENTER, CENTER);
  text(arrow, x + w / 2, y + h / 2);
}

function drawInfobox() {
  if (state.hoveredVolcano) {
    const volcano = state.hoveredVolcano;

    const boxWidth = 220;
    const boxHeight = 90;

    let x = mouseX + 25;
    let y = mouseY - boxHeight / 2;

    if (x + boxWidth > width) x = mouseX - boxWidth - 20;
    if (y < 0) y = 0;
    if (y + boxHeight > height) y = height - boxHeight;

    fill(CONFIG.colors.infoBox);
    stroke(CONFIG.colors.infoBoxStroke);
    strokeWeight(1);
    rect(x, y, boxWidth, boxHeight, 5);

    fill(CONFIG.colors.infoBoxText);
    noStroke();

    //nome vulcano
    textSize(16);
    textStyle(BOLD);
    textAlign(LEFT, TOP);

    //troncamento nome se troppo lungo
    let volcanoName = volcano.name;
    const maxNameWidth = boxWidth - 20; //margini

    while (textWidth(volcanoName) > maxNameWidth && volcanoName.length > 10) {
      volcanoName = volcanoName.substring(0, volcanoName.length - 4) + "...";
    }

    text(volcanoName, x + 10, y + 10);

    //year
    textSize(16);
    textStyle(NORMAL);
    text("Year: " + formatYear(volcano.year), x + 10, y + 40);

    //impact
    text("Impact: " + volcano.impact, x + 10, y + 60);
  }
}

function drawMainCircle() {
  push();
  translate(state.centerX, state.centerY);

  if (radialBgImage) {
    let imageDim = 2 * 0.989;
    let imageSize = CONFIG.layout.maxRadius * imageDim;
    imageMode(CENTER);
    image(radialBgImage, 0, 0, imageSize, imageSize);
  }

  drawImpactCircles();

  const numbers = [1, 5, 9, 13, 16];
  const startAngle = PI / 2;

  const totalHeight = CONFIG.layout.maxRadius - CONFIG.layout.minRadius;
  const spacing = totalHeight / (numbers.length - 1);

  numbers.forEach((num, index) => {
    const radius = map(
      num,
      1,
      16,
      CONFIG.layout.maxRadius,
      CONFIG.layout.minRadius,
    );
    const x = 0;
    const y = radius + 10;

    if (num === 1 || num === 16) {
      fill(0);
    } else {
      fill(CONFIG.colors.text);
    }
    noStroke();
    textSize(16);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(num.toString(), x, y);
  });

  drawContinentDividers();

  if (state.filteredData.length > 0) {
    drawVolcanoes();
  }

  pop();
}

function drawContinentDividers() {
  stroke(CONFIG.colors.circle);
  strokeWeight(1);

  CONTINENTS.forEach((cont) => {
    const angles = state.continentAngles[cont];
    if (angles) {
      line(
        0,
        0,
        cos(angles.start) * CONFIG.layout.maxRadius,
        sin(angles.start) * CONFIG.layout.maxRadius,
      );
    }
  });
}

function drawVolcanoes() {
  state.filteredData.forEach((v) => {
    let key = `${v.name}-${v.year}-${v.deaths}`;
    let angle = state.volcanoPositions.get(key);
    const angles = state.continentAngles[v.continent];

    if (!angle && angles) {
      angle = angles.mid;
      state.volcanoPositions.set(key, angle);
    }

    if (!angle) return;

    const r = getRadiusForImpact(v.impact);
    const x = cos(angle) * r;
    const y = sin(angle) * r;

    const isHighlighted =
      state.timelineYear !== null &&
      state.yearActivatedByUser &&
      v.year === state.timelineYear;
    const isHovered = state.hoveredVolcano === v;

    if (isHighlighted) {
      if (!state.selectionAnimationStart.has(key)) {
        state.selectionAnimationStart.set(key, millis());
      }
    } else {
      state.selectionAnimationStart.delete(key);
    }

    if (isHovered) {
      if (!state.hoverAnimationStart.has(key)) {
        state.hoverAnimationStart.set(key, millis());
      }
    } else {
      state.hoverAnimationStart.delete(key);
    }

    let selectionProgress = 0;
    if (isHighlighted && state.selectionAnimationStart.has(key)) {
      const startTime = state.selectionAnimationStart.get(key);
      const elapsed = millis() - startTime;
      selectionProgress = constrain(
        elapsed / SELECTION_ANIMATION_DURATION,
        0,
        1,
      );
    }

    let hoverProgress = 0;
    if (isHovered && state.hoverAnimationStart.has(key)) {
      const startTime = state.hoverAnimationStart.get(key);
      const elapsed = millis() - startTime;
      hoverProgress = constrain(elapsed / HOVER_ANIMATION_DURATION, 0, 1);
    }

    if (isHighlighted || isHovered) {
      drawVolcanoGlow(
        v,
        x,
        y,
        isHighlighted,
        isHovered,
        selectionProgress,
        hoverProgress,
      );
    }

    drawVolcanoDotAnimated(x, y, isHighlighted, isHovered, v, key);
  });
}

function drawVolcanoDotAnimated(x, y, isHighlighted, isHovered, volcano, key) {
  let entryProgress = 1;

  if (
    !state.disableDotEntryAnimation &&
    state.dotAnimationStart !== null &&
    state.dotAnimationProgress < 1
  ) {
    const appearTime = state.dotAppearTimes.get(key) || 0;
    const elapsed = millis() - state.dotAnimationStart;

    if (elapsed >= appearTime) {
      const dotElapsed = elapsed - appearTime;
      const duration = state.useFastAnimations
        ? CONFIG.animation.fastDotEntryDuration
        : CONFIG.animation.dotEntryDuration;
      entryProgress = constrain(dotElapsed / duration, 0, 1);
    } else {
      entryProgress = 0;
    }
  }

  if (entryProgress === 0) return;

  const baseSize = isHighlighted ? 10 : isHovered ? 8 : 5;
  const finalSize = baseSize * entryProgress;
  const alpha = 255 * entryProgress;

  let color;
  if (isHighlighted) {
    color = CONFIG.colors.accent;
  } else if (isHovered) {
    color = CONFIG.colors.text;
  } else {
    color = CONFIG.colors.text;
  }

  fill(red(color), green(color), blue(color), alpha);
  noStroke();
  circle(x, y, finalSize);
}

function drawVolcanoGlow(
  volcano,
  x,
  y,
  isHighlighted,
  isHovered,
  selectionProgress,
  hoverProgress,
) {
  let entryProgress = 1;
  const key = `${volcano.name}-${volcano.year}-${volcano.deaths}`;

  if (
    !state.disableDotEntryAnimation &&
    state.dotAnimationStart !== null &&
    state.dotAnimationProgress < 1
  ) {
    const appearTime = state.dotAppearTimes.get(key) || 0;
    const elapsed = millis() - state.dotAnimationStart;

    if (elapsed >= appearTime) {
      const dotElapsed = elapsed - appearTime;
      const duration = state.useFastAnimations
        ? CONFIG.animation.fastDotEntryDuration
        : CONFIG.animation.dotEntryDuration;
      entryProgress = constrain(dotElapsed / duration, 0, 1);
    } else {
      entryProgress = 0;
    }
  }

  if (entryProgress === 0) return;

  let glowSize, alpha;

  if (isHighlighted) {
    let baseSize = map(volcano.impact, 5, 15, 60, 90);
    let baseAlpha = map(volcano.impact, 5, 15, 70, 100);
    glowSize = selectionProgress * baseSize * entryProgress;
    alpha = selectionProgress * baseAlpha * entryProgress;
  } else if (isHovered) {
    let baseSize = map(volcano.impact, 5, 15, 50, 80);
    let baseAlpha = map(volcano.impact, 5, 15, 60, 90);
    glowSize = hoverProgress * baseSize * entryProgress;
    alpha = hoverProgress * baseAlpha * entryProgress;
  } else {
    return;
  }

  fill(255, 43, 0, alpha);
  noStroke();
  circle(x, y, glowSize);
}

function drawContinentLabels() {
  CONTINENTS.forEach((cont) => {
    const angles = state.continentAngles[cont];
    if (!angles) return;

    const angle = angles.mid;

    const labelRadius = CONFIG.layout.maxRadius + 35;

    const x = state.centerX + cos(angle) * labelRadius;
    const y = state.centerY + sin(angle) * labelRadius;

    push();
    translate(x, y);

    let rotationAngle = angle + HALF_PI;

    if (angle > HALF_PI && angle < 3 * HALF_PI) {
      rotationAngle += PI;
    }

    if (cont === "Americas") {
      rotationAngle += PI;
    }

    rotate(rotationAngle);

    fill(CONFIG.colors.text);
    noStroke();
    textSize(16);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(cont, 0, 0);
    pop();
  });
}

function checkHover() {
  if (state.filteredData.length === 0) {
    state.hoveredVolcano = null;
  } else {
    let newHovered = null;
    let minDist = Infinity;

    state.filteredData.forEach((v) => {
      const angles = state.continentAngles[v.continent];
      if (!angles) return;

      const key = `${v.name}-${v.year}-${v.deaths}`;
      const angle = state.volcanoPositions.get(key) || angles.mid;
      const r = getRadiusForImpact(v.impact);
      const x = state.centerX + cos(angle) * r;
      const y = state.centerY + sin(angle) * r;

      const d = dist(mouseX, mouseY, x, y);
      if (d < 15 && d < minDist) {
        minDist = d;
        newHovered = v;
      }
    });

    state.hoveredVolcano = newHovered;
  }
}

function updateLayout() {
  //centro
  let centerXRatio = CONFIG.layout.centerXRatio;

  if (width > 1920) {
    centerXRatio = 0.75;
  } else if (width < 1366) {
    centerXRatio = 0.65;
  }

  state.centerX = width * centerXRatio;

  const centerYPercentage = 0.48;

  if (height > 1200) {
    state.centerY = height * 0.46 + 25;
  } else if (height < 800) {
    state.centerY = height * 0.5 + 25;
  } else {
    state.centerY = height * centerYPercentage + 25;
  }
}

function mousePressed() {
  //click sul logo home
  if (
    state.logoArea &&
    mouseX > state.logoArea.x &&
    mouseX < state.logoArea.x + state.logoArea.width &&
    mouseY > state.logoArea.y &&
    mouseY < state.logoArea.y + state.logoArea.height
  ) {
    window.location.href = "../index.html";
    return;
  }

  //click sui link della navbar
  if (state.navLinks) {
    for (let link of state.navLinks) {
      let textW = link.width;
      let textH = 20;
      let textX = link.x;
      let textY = link.y - textH / 2;

      if (
        mouseX > textX &&
        mouseX < textX + textW &&
        mouseY > textY &&
        mouseY < textY + textH
      ) {
        window.location.href = link.href;
        return;
      }
    }
  }

  //click sul bottone learn more
  if (
    state.learnMoreButtonArea &&
    mouseX > state.learnMoreButtonArea.x &&
    mouseX < state.learnMoreButtonArea.x + state.learnMoreButtonArea.width &&
    mouseY > state.learnMoreButtonArea.y &&
    mouseY < state.learnMoreButtonArea.y + state.learnMoreButtonArea.height
  ) {
    startTransitionToLearnMore();
    return;
  }

  //click sul bottone search
  if (
    state.searchButtonArea &&
    mouseX > state.searchButtonArea.x &&
    mouseX < state.searchButtonArea.x + state.searchButtonArea.width &&
    mouseY > state.searchButtonArea.y &&
    mouseY < state.searchButtonArea.y + state.searchButtonArea.height
  ) {
    if (state.searchPanelOpen) {
      closeSearchPanel();
    } else {
      openSearchPanel();
    }
    return;
  }

  //click all'interno del pannello di ricerca se aperto
  if (state.searchPanelOpen && state.searchPanelAnimProgress > 0) {
    const panelX = state.searchButtonArea.x + state.searchButtonArea.width + 10;
    const panelY = state.searchButtonArea.y + 40 - state.searchPanelHeight;

    if (
      mouseX > panelX &&
      mouseX < panelX + state.searchPanelWidth &&
      mouseY > panelY &&
      mouseY < panelY + state.searchPanelHeight
    ) {
      const margin = 15;
      const titleHeight = 40;
      const localX = mouseX - panelX;
      const localY = mouseY - panelY;

      //continenti vulcani o eruzioni
      if (state.searchContinentsPanelOpen) {
        //click su un continente
        if (localY > titleHeight) {
          const itemHeight = 35;
          const itemIndex = Math.floor(
            (localY - titleHeight) / (itemHeight + 5),
          );
          if (itemIndex >= 0 && itemIndex < CONTINENTS.length) {
            const continent = CONTINENTS[itemIndex];
            selectContinentInSearch(continent);
            return;
          }
        }
      } else if (state.searchVolcanoesPanelOpen) {
        //click sulla freccia per tornare ai continenti
        if (localY < titleHeight && localX < margin + 20) {
          state.searchContinentsPanelOpen = true;
          state.searchVolcanoesPanelOpen = false;
          state.searchEruptionsPanelOpen = false;
          state.searchSelectedContinent = null;
          state.searchPanelVolcanoes = [];
          state.searchPanelScrollY = 0;
          state.hoveredVolcanoItemIndex = -1;

          state.searchPanelAnimStart = millis();
          state.searchPanelAnimProgress = 0;
          recalculateSearchPanelHeight();
          return;
        }

        //click su un vulcano
        const itemHeight = 32;
        if (localY > titleHeight) {
          const scrollY = state.searchPanelScrollY;
          const visibleY = localY - titleHeight + scrollY;
          const itemIndex = Math.floor(visibleY / itemHeight);

          if (itemIndex >= 0 && itemIndex < state.searchPanelVolcanoes.length) {
            const volcano = state.searchPanelVolcanoes[itemIndex];
            selectVolcanoInSearch(volcano);
            return;
          }
        }

        //click sulla scrollbar
        const visibleHeight = state.searchPanelHeight - titleHeight;
        const contentHeight = state.searchPanelVolcanoes.length * itemHeight;

        if (contentHeight > visibleHeight) {
          const scrollbarWidth = 6;
          const scrollbarX = state.searchPanelWidth - scrollbarWidth - 4;

          if (
            localX > scrollbarX &&
            localX < scrollbarX + scrollbarWidth &&
            localY > titleHeight &&
            localY < titleHeight + visibleHeight
          ) {
            //scroll
            state.isScrollingSearch = true;
            state.scrollStartY = mouseY;
            state.scrollStartOffset = state.searchPanelScrollY;
            return;
          }
        }
      } else if (state.searchEruptionsPanelOpen) {
        //click sulla freccia per tornare ai vulcani
        if (localY < titleHeight && localX < margin + 20) {
          state.searchContinentsPanelOpen = false;
          state.searchVolcanoesPanelOpen = true;
          state.searchEruptionsPanelOpen = false;
          state.searchSelectedVolcano = null;
          state.searchPanelEruptions = [];
          state.searchPanelScrollY = 0;
          state.hoveredEruptionItemIndex = -1;

          state.searchPanelAnimStart = millis();
          state.searchPanelAnimProgress = 0;
          recalculateSearchPanelHeight();
          return;
        }

        //click sull'eruzione
        const itemHeight = 28;
        if (localY > titleHeight) {
          const scrollY = state.searchPanelScrollY;
          const visibleY = localY - titleHeight + scrollY;
          const itemIndex = Math.floor(visibleY / itemHeight);

          if (itemIndex >= 0 && itemIndex < state.searchPanelEruptions.length) {
            const eruption = state.searchPanelEruptions[itemIndex];
            //avvia animazione eruzione se clicchi su un'eruzione
            const key = `${eruption.name}-${eruption.year}-${eruption.deaths}`;
            const angle = state.volcanoPositions.get(key);
            if (angle !== undefined) {
              const radius = getRadiusForImpact(eruption.impact);
              const x = state.centerX + cos(angle) * radius;
              const y = state.centerY + sin(angle) * radius;
              triggerVolcanoEruption(eruption, x, y);
            }
            return;
          }
        }

        //click sulla scrollbar
        const visibleHeight = state.searchPanelHeight - titleHeight;
        const contentHeight = state.searchPanelEruptions.length * itemHeight;

        if (contentHeight > visibleHeight) {
          const scrollbarWidth = 6;
          const scrollbarX = state.searchPanelWidth - scrollbarWidth - 4;

          if (
            localX > scrollbarX &&
            localX < scrollbarX + scrollbarWidth &&
            localY > titleHeight &&
            localY < titleHeight + visibleHeight
          ) {
            //scrolling
            state.isScrollingSearch = true;
            state.scrollStartY = mouseY;
            state.scrollStartOffset = state.searchPanelScrollY;
            return;
          }
        }
      }

      return;
    }

    //chiude il pannello se cliccho fuori
    closeSearchPanel();
    return;
  }

  if (
    state.startButtonArea &&
    mouseX > state.startButtonArea.x &&
    mouseX < state.startButtonArea.x + state.startButtonArea.width &&
    mouseY > state.startButtonArea.y &&
    mouseY < state.startButtonArea.y + state.startButtonArea.height
  ) {
    state.isPlaying = !state.isPlaying;

    if (state.isPlaying && state.availableYears.length > 0) {
      state.animationSpeed = TIMELINE_ANIMATION_SPEED_FAST;
      state.animationTimer = 0;
      state.isPausedBetweenCycles = false;

      state.useFastAnimations = true;
      startFastDotAnimations();

      state.disableDotEntryAnimation = true;

      if (!state.yearActivatedByUser) {
        state.yearActivatedByUser = true;
        state.currentYearIndex = 0;
        state.timelineYear = state.availableYears[0];
        state.displayedYear = state.availableYears[0];
      }
    } else if (state.availableYears.length === 0) {
      state.isPlaying = false;
    } else {
      state.animationSpeed = TIMELINE_ANIMATION_SPEED_NORMAL;
      state.useFastAnimations = false;
      state.disableDotEntryAnimation = false;

      state.dotAnimationStart = millis();
      state.dotAnimationProgress = 0;

      state.dotAppearTimes.clear();
      state.filteredData.forEach((v) => {
        let key = `${v.name}-${v.year}-${v.deaths}`;
        const randomDelay = Math.random() * CONFIG.animation.randomDelayMax;
        state.dotAppearTimes.set(key, randomDelay);
      });
    }
    return;
  }

  if (
    state.timeFrameLeftArrows &&
    mouseX > state.timeFrameLeftArrows.x &&
    mouseX < state.timeFrameLeftArrows.x + state.timeFrameLeftArrows.width &&
    mouseY > state.timeFrameLeftArrows.y &&
    mouseY < state.timeFrameLeftArrows.y + state.timeFrameLeftArrows.height
  ) {
    if (state.selectedCentury === null) {
      state.selectedCentury = CONCENTRIC_YEARS[CONCENTRIC_YEARS.length - 2];
    } else {
      const currentIndex = CONCENTRIC_YEARS.indexOf(state.selectedCentury);
      if (currentIndex > 0) {
        state.selectedCentury = CONCENTRIC_YEARS[currentIndex - 1];
      } else if (currentIndex === 0) {
        state.selectedCentury = null;
      }
    }
    applyFilters();
    return;
  }

  if (
    state.timeFrameRightArrows &&
    mouseX > state.timeFrameRightArrows.x &&
    mouseX < state.timeFrameRightArrows.x + state.timeFrameRightArrows.width &&
    mouseY > state.timeFrameRightArrows.y &&
    mouseY < state.timeFrameRightArrows.y + state.timeFrameRightArrows.height
  ) {
    if (state.selectedCentury === null) {
      state.selectedCentury = CONCENTRIC_YEARS[0];
    } else {
      const currentIndex = CONCENTRIC_YEARS.indexOf(state.selectedCentury);
      if (currentIndex < CONCENTRIC_YEARS.length - 2) {
        state.selectedCentury = CONCENTRIC_YEARS[currentIndex + 1];
      } else if (currentIndex === CONCENTRIC_YEARS.length - 2) {
        state.selectedCentury = null;
      }
    }
    applyFilters();
    return;
  }

  if (
    state.yearLeftArrow &&
    mouseX > state.yearLeftArrow.x &&
    mouseX < state.yearLeftArrow.x + state.yearLeftArrow.width &&
    mouseY > state.yearLeftArrow.y &&
    mouseY < state.yearLeftArrow.y + state.yearLeftArrow.height &&
    state.availableYears.length > 0
  ) {
    state.yearActivatedByUser = true;
    state.isPlaying = false;
    state.animationSpeed = TIMELINE_ANIMATION_SPEED_NORMAL;
    state.useFastAnimations = false;
    state.disableDotEntryAnimation = false;

    if (state.timelineYear === null) {
      state.currentYearIndex = state.availableYears.length - 1;
    } else {
      const currentIndex = state.availableYears.indexOf(state.timelineYear);
      if (currentIndex > 0) {
        state.currentYearIndex = currentIndex - 1;
      } else if (currentIndex === 0) {
        state.currentYearIndex = state.availableYears.length - 1;
      }
    }

    state.timelineYear = state.availableYears[state.currentYearIndex];
    state.displayedYear = state.availableYears[state.currentYearIndex];
    return;
  }

  if (
    state.yearRightArrow &&
    mouseX > state.yearRightArrow.x &&
    mouseX < state.yearRightArrow.x + state.yearRightArrow.width &&
    mouseY > state.yearRightArrow.y &&
    mouseY < state.yearRightArrow.y + state.yearRightArrow.height &&
    state.availableYears.length > 0
  ) {
    state.yearActivatedByUser = true;
    state.isPlaying = false;
    state.animationSpeed = TIMELINE_ANIMATION_SPEED_NORMAL;
    state.useFastAnimations = false;
    state.disableDotEntryAnimation = false;

    if (state.timelineYear === null) {
      state.currentYearIndex = 0;
    } else {
      const currentIndex = state.availableYears.indexOf(state.timelineYear);
      if (currentIndex < state.availableYears.length - 1) {
        state.currentYearIndex = currentIndex + 1;
      } else if (currentIndex === state.availableYears.length - 1) {
        state.currentYearIndex = 0;
      }
    }

    state.timelineYear = state.availableYears[state.currentYearIndex];
    state.displayedYear = state.availableYears[state.currentYearIndex];
    return;
  }

  const distFromCenter = dist(mouseX, mouseY, state.centerX, state.centerY);
  if (distFromCenter < CONFIG.layout.maxRadius * 1.5) {
    triggerWaveAnimation();
  }

  let closestVolcano = null;
  let closestVolcanoPos = null;
  let minDistance = 25;

  for (let v of state.filteredData) {
    let key = `${v.name}-${v.year}-${v.deaths}`;

    if (!state.volcanoPositions.has(key)) continue;

    const angle = state.volcanoPositions.get(key);
    const radius = getRadiusForImpact(v.impact);

    const x = state.centerX + cos(angle) * radius;
    const y = state.centerY + sin(angle) * radius;

    const d = dist(mouseX, mouseY, x, y);

    if (d < minDistance) {
      minDistance = d;
      closestVolcano = v;
      closestVolcanoPos = { x, y };
    }
  }

  if (closestVolcano && closestVolcanoPos) {
    triggerVolcanoEruption(
      closestVolcano,
      closestVolcanoPos.x,
      closestVolcanoPos.y,
    );
    return;
  }
}

function mouseDragged() {
  if (
    state.isScrollingSearch &&
    (state.searchVolcanoesPanelOpen || state.searchEruptionsPanelOpen)
  ) {
    const itemHeight = state.searchVolcanoesPanelOpen ? 32 : 28;
    const titleHeight = 40;
    const visibleHeight = state.searchPanelHeight - titleHeight;
    const contentHeight =
      (state.searchVolcanoesPanelOpen
        ? state.searchPanelVolcanoes.length
        : state.searchPanelEruptions.length) * itemHeight;

    if (contentHeight > visibleHeight) {
      const deltaY = mouseY - state.scrollStartY;
      const scrollRatio = contentHeight / visibleHeight;
      const newScrollY = state.scrollStartOffset + deltaY * scrollRatio;

      state.searchPanelScrollY = constrain(
        newScrollY,
        0,
        contentHeight - visibleHeight,
      );
    }
  }
}

function mouseReleased() {
  state.isScrollingSearch = false;
}

function mouseWheel(event) {
  //scroll mouse
  if (
    state.searchPanelOpen &&
    (state.searchVolcanoesPanelOpen || state.searchEruptionsPanelOpen) &&
    state.searchPanelAnimProgress === 1
  ) {
    const panelX = state.searchButtonArea.x + state.searchButtonArea.width + 10;
    const panelY = state.searchButtonArea.y + 40 - state.searchPanelHeight;

    if (
      mouseX > panelX &&
      mouseX < panelX + state.searchPanelWidth &&
      mouseY > panelY &&
      mouseY < panelY + state.searchPanelHeight
    ) {
      const itemHeight = state.searchVolcanoesPanelOpen ? 32 : 28;
      const titleHeight = 40;
      const visibleHeight = state.searchPanelHeight - titleHeight;
      const contentHeight =
        (state.searchVolcanoesPanelOpen
          ? state.searchPanelVolcanoes.length
          : state.searchPanelEruptions.length) * itemHeight;

      if (contentHeight > visibleHeight) {
        const scrollAmount = event.delta * 0.5;
        state.searchPanelScrollY = constrain(
          state.searchPanelScrollY + scrollAmount,
          0,
          contentHeight - visibleHeight,
        );
        return false;
      }
    }
  }

  return true;
}

function keyPressed() {
  //frecce della tastiera per navigare nei pannelli di ricerca
  if (state.searchPanelOpen && state.searchPanelAnimProgress === 1) {
    if (state.searchVolcanoesPanelOpen) {
      const itemHeight = 32;
      const titleHeight = 40;
      const visibleHeight = state.searchPanelHeight - titleHeight;
      const contentHeight = state.searchPanelVolcanoes.length * itemHeight;

      if (contentHeight > visibleHeight) {
        if (keyCode === UP_ARROW) {
          state.searchPanelScrollY = max(
            0,
            state.searchPanelScrollY - itemHeight,
          );
          return false;
        } else if (keyCode === DOWN_ARROW) {
          state.searchPanelScrollY = min(
            contentHeight - visibleHeight,
            state.searchPanelScrollY + itemHeight,
          );
          return false;
        } else if (keyCode === ENTER || keyCode === RETURN) {
          if (
            state.hoveredVolcanoItemIndex >= 0 &&
            state.hoveredVolcanoItemIndex < state.searchPanelVolcanoes.length
          ) {
            const volcano =
              state.searchPanelVolcanoes[state.hoveredVolcanoItemIndex];
            selectVolcanoInSearch(volcano);
            return false;
          }
        }
      }
    } else if (state.searchEruptionsPanelOpen) {
      const itemHeight = 28;
      const titleHeight = 40;
      const visibleHeight = state.searchPanelHeight - titleHeight;
      const contentHeight = state.searchPanelEruptions.length * itemHeight;

      if (contentHeight > visibleHeight) {
        if (keyCode === UP_ARROW) {
          state.searchPanelScrollY = max(
            0,
            state.searchPanelScrollY - itemHeight,
          );
          return false;
        } else if (keyCode === DOWN_ARROW) {
          state.searchPanelScrollY = min(
            contentHeight - visibleHeight,
            state.searchPanelScrollY + itemHeight,
          );
          return false;
        }
      }
    }

    if (state.searchContinentsPanelOpen) {
      if (keyCode === UP_ARROW) {
        if (state.hoveredSearchItemIndex > 0) {
          state.hoveredSearchItemIndex--;
        } else {
          state.hoveredSearchItemIndex = CONTINENTS.length - 1;
        }
        return false;
      } else if (keyCode === DOWN_ARROW) {
        if (state.hoveredSearchItemIndex < CONTINENTS.length - 1) {
          state.hoveredSearchItemIndex++;
        } else {
          state.hoveredSearchItemIndex = 0;
        }
        return false;
      } else if (keyCode === ENTER || keyCode === RETURN) {
        if (
          state.hoveredSearchItemIndex >= 0 &&
          state.hoveredSearchItemIndex < CONTINENTS.length
        ) {
          const continent = CONTINENTS[state.hoveredSearchItemIndex];
          selectContinentInSearch(continent);
          return false;
        }
      }
    }

    //chiudi il pannello
    if (keyCode === ESCAPE) {
      closeSearchPanel();
      return false;
    }
  }

  return true;
}

function formatYear(year) {
  return Math.abs(year) + (year < 0 ? " BC" : " AD");
}

function formatYearShort(year) {
  if (year < 0) {
    return Math.abs(year) + " BC";
  } else if (year === 0) {
    return "0";
  } else {
    return year + " AD";
  }
}

function windowResized() {
  //fattore di scala
  const newScaleFactor = calculateScaleFactor();
  const constrainedScale = constrain(newScaleFactor, 0.5, 1.2);

  if (abs(constrainedScale - scaleFactor) > 0.01) {
    scaleFactor = constrainedScale;
    applyScaleToConfig(scaleFactor);
  }

  resizeCanvas(windowWidth, windowHeight);

  //layout cerchio grafico
  updateLayout();
}

function setup() {
  //fattore di scala
  scaleFactor = calculateScaleFactor();
  scaleFactor = constrain(scaleFactor, 0.5, 1.2);

  applyScaleToConfig(scaleFactor);

  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-container");
  canvas.elt.style.touchAction = "none";

  //layout cerchio grafico
  updateLayout();
  frameRate(60);
}

function updateCursor() {
  let isOverButton = false;

  //torna alla home logo
  if (
    state.logoArea &&
    mouseX > state.logoArea.x &&
    mouseX < state.logoArea.x + state.logoArea.width &&
    mouseY > state.logoArea.y &&
    mouseY < state.logoArea.y + state.logoArea.height
  ) {
    isOverButton = true;
  }

  //navbar links
  if (state.navLinks) {
    for (let link of state.navLinks) {
      let textW = link.width;
      let textH = 20;
      let textX = link.x;
      let textY = link.y - textH / 2;

      if (
        mouseX > textX &&
        mouseX < textX + textW &&
        mouseY > textY &&
        mouseY < textY + textH
      ) {
        isOverButton = true;
        break;
      }
    }
  }

  if (
    state.learnMoreButtonArea &&
    mouseX > state.learnMoreButtonArea.x &&
    mouseX < state.learnMoreButtonArea.x + state.learnMoreButtonArea.width &&
    mouseY > state.learnMoreButtonArea.y &&
    mouseY < state.learnMoreButtonArea.y + state.learnMoreButtonArea.height
  ) {
    isOverButton = true;
  }

  if (
    state.searchButtonArea &&
    mouseX > state.searchButtonArea.x &&
    mouseX < state.searchButtonArea.x + state.searchButtonArea.width &&
    mouseY > state.searchButtonArea.y &&
    mouseY < state.searchButtonArea.y + state.searchButtonArea.height
  ) {
    isOverButton = true;
  }

  if (
    state.startButtonArea &&
    mouseX > state.startButtonArea.x &&
    mouseX < state.startButtonArea.x + state.startButtonArea.width &&
    mouseY > state.startButtonArea.y &&
    mouseY < state.startButtonArea.y + state.startButtonArea.height
  ) {
    isOverButton = true;
  }

  if (
    state.timeFrameLeftArrows &&
    mouseX > state.timeFrameLeftArrows.x &&
    mouseX < state.timeFrameLeftArrows.x + state.timeFrameLeftArrows.width &&
    mouseY > state.timeFrameLeftArrows.y &&
    mouseY < state.timeFrameLeftArrows.y + state.timeFrameLeftArrows.height
  ) {
    isOverButton = true;
  }

  if (
    state.timeFrameRightArrows &&
    mouseX > state.timeFrameRightArrows.x &&
    mouseX < state.timeFrameRightArrows.x + state.timeFrameRightArrows.width &&
    mouseY > state.timeFrameRightArrows.y &&
    mouseY < state.timeFrameRightArrows.y + state.timeFrameRightArrows.height
  ) {
    isOverButton = true;
  }

  if (
    state.yearLeftArrow &&
    mouseX > state.yearLeftArrow.x &&
    mouseX < state.yearLeftArrow.x + state.yearLeftArrow.width &&
    mouseY > state.yearLeftArrow.y &&
    mouseY < state.yearLeftArrow.y + state.yearLeftArrow.height
  ) {
    isOverButton = true;
  }

  if (
    state.yearRightArrow &&
    mouseX > state.yearRightArrow.x &&
    mouseX < state.yearRightArrow.x + state.yearRightArrow.width &&
    mouseY > state.yearRightArrow.y &&
    mouseY < state.yearRightArrow.y + state.yearRightArrow.height
  ) {
    isOverButton = true;
  }

  //controlla gli elementi nel pannello di ricerca
  if (state.searchPanelOpen && state.searchPanelAnimProgress > 0) {
    const panelX = state.searchButtonArea.x + state.searchButtonArea.width + 10;
    const panelY = state.searchButtonArea.y + 40 - state.searchPanelHeight;

    if (
      mouseX > panelX &&
      mouseX < panelX + state.searchPanelWidth &&
      mouseY > panelY &&
      mouseY < panelY + state.searchPanelHeight
    ) {
      const margin = 15;
      const titleHeight = 40;
      const localY = mouseY - panelY;

      if (state.searchContinentsPanelOpen) {
        const itemHeight = 35;
        if (localY > titleHeight) {
          isOverButton = true;
        }
      } else if (state.searchVolcanoesPanelOpen) {
        const itemHeight = 32;
        const scrollbarWidth = 6;
        const localX = mouseX - panelX;

        //vulcani
        if (localY > titleHeight) {
          isOverButton = true;
        }

        //scrollbar
        const visibleHeight = state.searchPanelHeight - titleHeight;
        const contentHeight = state.searchPanelVolcanoes.length * itemHeight;

        if (contentHeight > visibleHeight) {
          const scrollbarX = state.searchPanelWidth - scrollbarWidth - 4;
          if (
            localX > scrollbarX &&
            localX < scrollbarX + scrollbarWidth &&
            localY > titleHeight &&
            localY < titleHeight + visibleHeight
          ) {
            isOverButton = true;
          }
        }
      } else if (state.searchEruptionsPanelOpen) {
        const itemHeight = 28;
        const scrollbarWidth = 6;
        const localX = mouseX - panelX;

        //eruzioni
        if (localY > titleHeight) {
          isOverButton = true;
        }

        //scrollbar
        const visibleHeight = state.searchPanelHeight - titleHeight;
        const contentHeight = state.searchPanelEruptions.length * itemHeight;

        if (contentHeight > visibleHeight) {
          const scrollbarX = state.searchPanelWidth - scrollbarWidth - 4;
          if (
            localX > scrollbarX &&
            localX < scrollbarX + scrollbarWidth &&
            localY > titleHeight &&
            localY < titleHeight + visibleHeight
          ) {
            isOverButton = true;
          }
        }
      }
    }
  }

  const distFromCenter = dist(mouseX, mouseY, state.centerX, state.centerY);
  if (distFromCenter < CONFIG.layout.maxRadius * 1.1) {
    for (let v of state.filteredData) {
      let key = `${v.name}-${v.year}-${v.deaths}`;

      if (!state.volcanoPositions.has(key)) continue;

      const angle = state.volcanoPositions.get(key);
      const radius = getRadiusForImpact(v.impact);
      const x = state.centerX + cos(angle) * radius;
      const y = state.centerY + sin(angle) * radius;
      const d = dist(mouseX, mouseY, x, y);

      if (d < 15) {
        isOverButton = true;
        break;
      }
    }
  }

  if (isOverButton) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}
