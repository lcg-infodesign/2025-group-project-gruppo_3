const CONFIG = {
  chartXPercent: 0.695,
  chartYPercent: 0.51,
  chartSize: 400,
  chartLevels: 4,
  chartMainColor: "#FFFFFF",
  chartOverlayAlpha: 200,
  chartGapAngleDeg: 10,
  chartGapRadial: 5,
  chartTitleSize: 28,
  chartLabelSize: 14,
  chartTooltipTextSize: 17,
  inflationFactor: 2.4,
  colors: {
    background: "#FF2B00",
    text: "#000000ff",
    accent: "#FFFFFF",
    infoBox: "#ffffffff",
    infoBoxText: "#000000ff",
    infoBoxStroke: "#FF2B00",
    chartAvailable: "#FFFFFF",
    chartUnavailable: "#3C3C3C",
    labelAvailableText: "#000000",
    labelUnavailableText: "#3C3C3C",
  },
  layout: {
    titleStartY: 95,
    topOffset: -20,
    marginX: 40,
    startButtonY: 720,
    labelFontSize: 16,
    navbarHeight: 70,
  },
};

let data;
const INFLATION_FACTOR = 2.4;

//responsive
let scaleFactor = 1.0;

function calculateScaleFactor() {
  const referenceWidth = 1920;
  const referenceHeight = 1080;

  const widthRatio = windowWidth / referenceWidth;
  const heightRatio = windowHeight / referenceHeight;

  return min(widthRatio, heightRatio);
}

function applyResponsiveScaling() {
  const availableHeight = windowHeight - 70;
  const referenceAvailableHeight = 1080 - 70;

  scaleFactor = availableHeight / referenceAvailableHeight;
  scaleFactor = constrain(scaleFactor, 0.7, 1.2);

  updateResponsiveDimensions();
}

function updateResponsiveDimensions() {
  let centerXRatio = 0.695;

  if (windowWidth > 1920) {
    centerXRatio = 0.75;
  } else if (windowWidth < 1366) {
    centerXRatio = 0.65;
  }

  const centerYPercentage = 0.48;
  let centerY;

  if (windowHeight > 1200) {
    centerY = windowHeight * 0.46 + 25;
  } else if (windowHeight < 800) {
    centerY = windowHeight * 0.5 + 25;
  } else {
    centerY = windowHeight * centerYPercentage + 25;
  }

  CONFIG.chartXPercent = centerXRatio;
  CONFIG.chartYPercent = centerY / windowHeight;

  const graphScale = min(scaleFactor * 1.3, 1.2);
  const baseSize = 400;

  const availableHeight = windowHeight - 70 - 100;
  const availableWidth = windowWidth * 0.35;

  const targetSize = min(availableHeight, availableWidth);

  CONFIG.chartSize = constrain(
    targetSize * 0.8,
    300 * graphScale,
    500 * graphScale,
  );

  CONFIG.chartTitleSize = 28;
  CONFIG.chartLabelSize = 14;
  CONFIG.chartTooltipTextSize = 17;
  CONFIG.layout.labelFontSize = 16;

  CONFIG.layout.startButtonY = windowHeight - 100;
}

let state = {
  chartData: null,
  animationStartTime: 0,
  isAnimating: false,
  backButtonArea: null,
  isBackButtonHovered: false,
  navBackArea: null,
  methodologyButtonArea: null,
  isMethodologyButtonHovered: false,
  showMethodologyButton: false,
  scrollArea: null,
  scrollHint: null,
  isAtBottom: false,
  initialized: false,
  previousPageUrl: null,
  volcanoName: null,
  volcanoYear: null,
  volcanoNumber: null,
};

function getQueryParam(param) {
  let urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

//preload
function preload() {
  data = loadTable("../assets/data_impatto.csv", "csv", "header");
}

//trova righe
function findDataRowIndexFast(name, number) {
  if (!data) return -1;

  for (let i = 0; i < data.getRowCount(); i++) {
    if (
      data.getString(i, "Name") === name &&
      String(data.getString(i, "Number")) === String(number)
    ) {
      return i;
    }
  }
  return -1;
}

function convertTo2026Dollars(damageValue) {
  if (!damageValue || damageValue === 0 || isNaN(damageValue)) return 0;
  return damageValue * INFLATION_FACTOR;
}

//trova demage
function formatDamageValue(damageValue) {
  if (
    damageValue === undefined ||
    damageValue === null ||
    damageValue === 0 ||
    isNaN(damageValue)
  ) {
    return "Details not available";
  }

  // Usa la funzione globale o quella definita localmente se accessibile,
  // ma per sicurezza qui replichiamo il calcolo standard:
  let value = damageValue * INFLATION_FACTOR;

  if (value < 2.4) {
    return `Less than $2.4 million (2026 dollars)`;
  } else if (value < 12) {
    return `$${Math.round(value * 10) / 10} million (2026 dollars)`;
  } else if (value < 57.6) {
    return `$${Math.round(value * 10) / 10} million (2026 dollars)`;
  } else {
    return `$${(value / 1000).toFixed(1)} billion (2026 dollars)`;
  }
}

//testo dettagliato (spiegazione range da 1 a 4)
function getDetailText(value, descCode, type) {
  //se è true riposta il valore corretto
  //se è false riporta la descrizione del range
  if (value !== "" && value !== 0 && !isNaN(value)) {
    return value;
  }

  let code = parseInt(descCode);

  if (isNaN(code) || code < 1 || code > 4) {
    return "Impact unknown";
  }

  const tables = {
    deaths: {
      1: "Few (~1 to 50 deaths)",
      2: "Some (~51 to 100 deaths)",
      3: "Many (~101 to 1000 deaths)",
      4: "Very Many (~1001 or more deaths)",
    },
    injuries: {
      1: "Few (~1 to 50 injuries)",
      2: "Some (~51 to 100 injuries)",
      3: "Many (~101 to 1000 injuries)",
      4: "Very Many (~1001 or more injuries)",
    },
    damage: {
      1: "Limited (less than $2.4 million in 2026 dollars)",
      2: "Moderate (~$2.4 to $12 million in 2026 dollars)",
      3: "Severe (~$12 to $57.6 million in 2026 dollars)",
      4: "Extreme ($60 million or more in 2026 dollars)",
    },
    houses: {
      1: "Few (~1 to 50 houses)",
      2: "Some (~51 to 100 houses)",
      3: "Many (~101 to 1000 houses)",
      4: "Very Many (~1001 or more houses)",
    },
    missing: {
      1: "Few (~1 to 50 missing)",
      2: "Some (~51 to 100 missing)",
      3: "Many (~101 to 1000 missing)",
      4: "Very Many (~1001 or more missing)",
    },
  };

  return tables[type][code] || "Details not available";
}

//recupera dati dell'impatto
function buildChartDataFromRow(i) {
  let strDeath = data.getString(i, "Deaths");
  let strInj = data.getString(i, "Injuries");
  let strDmg = data.getString(i, "Damage ($Mil)");
  let strHouse = data.getString(i, "Houses Destroyed");
  let strMissing = data.getString(i, "Missing");

  let deathVal = Number(data.getString(i, "Death Description"));
  let injVal = Number(data.getString(i, "Injuries Description"));
  let dmgVal = Number(data.getString(i, "Damage Description"));
  let houseVal = Number(data.getString(i, "Houses Destroyed Description"));
  let missingVal = Number(data.getString(i, "Missing Description"));
  let impactVal = Number(data.getString(i, "Impact"));

  let dmgValForChart = 0;
  if (!isNaN(dmgVal) && dmgVal > 0) {
    dmgValForChart = constrain(
      Math.round(convertTo2026Dollars(dmgVal)),
      0,
      CONFIG.chartLevels,
    );
  }

  deathVal = isNaN(deathVal) ? 0 : deathVal;
  injVal = isNaN(injVal) ? 0 : injVal;
  dmgVal = isNaN(dmgVal) ? 0 : dmgVal;
  houseVal = isNaN(houseVal) ? 0 : houseVal;
  missingVal = isNaN(missingVal) ? 0 : missingVal;
  impactVal = isNaN(impactVal) ? 0 : impactVal;

  deathVal = constrain(Math.round(deathVal), 0, CONFIG.chartLevels);
  injVal = constrain(Math.round(injVal), 0, CONFIG.chartLevels);
  houseVal = constrain(Math.round(houseVal), 0, CONFIG.chartLevels);
  missingVal = constrain(Math.round(missingVal), 0, CONFIG.chartLevels);

  let formattedDamage = "Details not available";
  if (strDmg && strDmg.trim() !== "") {
    formattedDamage = strDmg;
  } else if (dmgVal > 0) {
    formattedDamage = formatDamageValue(dmgVal);
  }

  return {
    index: i,
    name: data.getString(i, "Name"),
    country: data.getString(i, "Country") || "",
    death: deathVal,
    inj: injVal,
    dmg: dmgValForChart,
    house: houseVal,
    missing: missingVal,
    impact: impactVal,
    rawDeath:
      strDeath === "" || strDeath === "Details not available"
        ? "Details not available"
        : strDeath,
    rawInj:
      strInj === "" || strInj === "Details not available"
        ? "Details not available"
        : strInj,
    rawDmg: formattedDamage,
    rawHouse:
      strHouse === "" || strHouse === "Details not available"
        ? "Details not available"
        : strHouse,
    rawMissing:
      strMissing === "" || strMissing === "Details not available"
        ? "Details not available"
        : strMissing,
    originalDmgValue: dmgVal,
    convertedDmgValue: convertTo2026Dollars(dmgVal),
  };
}

//inizializzazione dati
function initializeData() {
  if (state.initialized) return;

  applyResponsiveScaling();

  state.initialized = true;

  //recupera parametri dall'URL
  state.volcanoName = getQueryParam("name");
  state.volcanoYear = getQueryParam("year");
  state.volcanoNumber = getQueryParam("number");

  //recupera URL precedente su cui la persona era prima di cliccare il tastino learn more
  try {
    state.previousPageUrl = localStorage.getItem(
      "previousPageBeforeDetailView",
    );
  } catch (e) {}

  //carica i dati del grafico
  if (state.volcanoName && state.volcanoNumber && data) {
    const rowIndex = findDataRowIndexFast(
      state.volcanoName,
      state.volcanoNumber,
    );

    if (rowIndex !== -1) {
      state.chartData = buildChartDataFromRow(rowIndex);
    } else {
      console.warn(
        "No data found for:",
        state.volcanoName,
        state.volcanoNumber,
      );
      //usa dati default se non trovati
      state.chartData = {
        name: state.volcanoName,
        year: state.volcanoYear || "Unknown",
        death: 0,
        inj: 0,
        dmg: 0,
        house: 0,
        missing: 0,
        impact: 0,
        rawDeath: "Details not available",
        rawInj: "Details not available",
        rawDmg: "Details not available",
        rawHouse: "Details not available",
        rawMissing: "Details not available",
      };
    }
  } else {
    state.chartData = {
      name: state.volcanoName || "Volcano",
      year: state.volcanoYear || "Unknown",
      death: 0,
      inj: 0,
      dmg: 0,
      house: 0,
      missing: 0,
      impact: 0,
      rawDeath: "Details not available",
      rawInj: "Details not available",
      rawDmg: "Details not available",
      rawHouse: "Details not available",
      rawMissing: "Details not available",
    };
  }

  //forza un ridisegno immediato
  if (typeof redraw === "function") {
    redraw();
  }

  //avvia animazione
  setTimeout(startAnimation, 100);

  //forza il ridimensionamento
  window.dispatchEvent(new Event("resize"));
}

function setup() {
  //calcola lo scaling iniziale
  applyResponsiveScaling();

  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("main-sketch-container");
  frameRate(60);

  //setup degli event listener x scroll
  setupScrollListeners();

  //ridisegno iniziale
  if (typeof redraw === "function") {
    redraw();
  }
}

function draw() {
  //dati inizializzati
  if (!state.initialized) {
    initializeData();
  }

  background(CONFIG.colors.background);
  drawNavBar();
  drawTitle();
  drawBackButton();

  //disegna il bottone methodology solo se visibile
  if (state.showMethodologyButton) {
    drawMethodologyButton();
  }

  if (state.chartData) {
    drawImpactChart(state.chartData);
  } else {
    drawChartPlaceholder();
  }

  updateCursor();
}

//grafico colori opposti di quello di detail
function drawImpactChart(d) {
  let tooltipText = "";

  push();

  let panelW = CONFIG.chartSize + 40;
  let panelH = CONFIG.chartSize + 40;
  let px = width * CONFIG.chartXPercent - panelW / 2;
  let py = height * CONFIG.chartYPercent - panelH / 2;

  noFill();
  noStroke();
  rect(px, py, panelW, panelH, 10);

  let cx = width * CONFIG.chartXPercent;
  let cy = height * CONFIG.chartYPercent;
  translate(cx, cy);

  let gapAngle = radians(CONFIG.chartGapAngleDeg);
  let gapRadial = CONFIG.chartGapRadial;
  let maxChartRadius = CONFIG.chartSize / 2 + 20;
  let radiusStep = CONFIG.chartSize / (2 * CONFIG.chartLevels);

  const values = [d.death, d.inj, d.dmg, d.house, d.missing];
  const labels = [
    "Deaths",
    "Injuries",
    "Damage",
    "Houses Destroyed",
    "Missing",
  ];

  const isDataAvailable = [
    !(d.death === 0 && d.rawDeath === "Details not available"),
    !(d.inj === 0 && d.rawInj === "Details not available"),
    !(d.dmg === 0 && d.rawDmg === "Details not available"),
    !(d.house === 0 && d.rawHouse === "Details not available"),
    !(d.missing === 0 && d.rawMissing === "Details not available"),
  ];

  let animationProgress = getAnimationProgress();

  let mx = mouseX - cx;
  let my = mouseY - cy;
  let mDist = dist(0, 0, mx, my);

  let mAngle = atan2(my, mx);
  if (mAngle < 0) mAngle += TWO_PI;

  let sectionAngle = TWO_PI / 5;

  let hoveredSection = -1;
  if (mDist < maxChartRadius && mDist > 20) {
    let sectionIndex = floor(mAngle / sectionAngle);
    let localAngle = mAngle % sectionAngle;
    let halfGap = gapAngle / 2;
    if (localAngle > halfGap && localAngle < sectionAngle - halfGap) {
      hoveredSection = sectionIndex;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (!isDataAvailable[i]) continue;

    let start = sectionAngle * i + gapAngle / 2;
    let end = sectionAngle * (i + 1) - gapAngle / 2;

    for (let level = 1; level <= CONFIG.chartLevels; level++) {
      let innerR = radiusStep * (level - 1) + gapRadial;
      let outerR = radiusStep * level - gapRadial;

      if (values[i] >= level) {
        let animatedOuterR;

        if (animationProgress < 1.0) {
          let levelDelay = (level - 1) * 0.15;
          let levelProgress = constrain(
            (animationProgress - levelDelay) / (1 - levelDelay),
            0,
            1,
          );
          let easedProgress = 1 - pow(1 - levelProgress, 3);
          animatedOuterR = innerR + (outerR - innerR) * easedProgress;
        } else {
          animatedOuterR = outerR;
        }

        fill(CONFIG.colors.chartAvailable);
        stroke(CONFIG.colors.chartAvailable);
        strokeWeight(1);
        drawArcSegment(innerR, animatedOuterR, start, end);
      } else {
        noFill();

        stroke(CONFIG.colors.chartAvailable);
        strokeWeight(1);
        drawArcSegment(innerR, outerR, start, end);
      }
    }
  }

  //sez grigia scura x dati non disponibili
  for (let i = 0; i < 5; i++) {
    if (isDataAvailable[i]) continue;

    let start = sectionAngle * i + gapAngle / 2;
    let end = sectionAngle * (i + 1) - gapAngle / 2;

    for (let level = 1; level <= CONFIG.chartLevels; level++) {
      let innerR = radiusStep * (level - 1) + gapRadial;
      let outerR = radiusStep * level - gapRadial;

      drawingContext.save();
      drawingContext.beginPath();

      for (let a = start; a <= end; a += 0.01) {
        let x = cos(a) * outerR;
        let y = sin(a) * outerR;
        if (a === start) drawingContext.moveTo(x, y);
        else drawingContext.lineTo(x, y);
      }
      for (let a = end; a >= start; a -= 0.01) {
        let x = cos(a) * innerR;
        let y = sin(a) * innerR;
        drawingContext.lineTo(x, y);
      }
      drawingContext.closePath();
      drawingContext.clip();

      let patternSpacing = 6;

      let lineColor = color(CONFIG.colors.chartUnavailable);
      lineColor.setAlpha(150);

      stroke(lineColor);
      strokeWeight(1);
      noFill();

      let minX = -outerR;
      let maxX = outerR;
      let minY = -outerR;
      let maxY = outerR;

      let angle = PI / 4;
      let cosAngle = cos(angle);
      let sinAngle = sin(angle);

      for (
        let offset = -maxX - maxY;
        offset < maxX + maxY;
        offset += patternSpacing
      ) {
        let x1, y1, x2, y2;

        if (cosAngle !== 0) {
          x1 = minX;
          y1 = (offset - x1 * cosAngle) / sinAngle;
          x2 = maxX;
          y2 = (offset - x2 * cosAngle) / sinAngle;
        }

        if (y1 >= minY || y2 >= minY || y1 <= maxY || y2 <= maxY) {
          line(x1, y1, x2, y2);
        }
      }

      drawingContext.restore();

      noFill();

      stroke(CONFIG.colors.chartUnavailable);
      strokeWeight(1);
      drawArcSegment(innerR, outerR, start, end);
    }
  }

  let detailMaxWidth = 110;

  for (let i = 0; i < 5; i++) {
    let start = sectionAngle * i + gapAngle / 2;
    let end = sectionAngle * (i + 1) - gapAngle / 2;

    textStyle(NORMAL);
    noStroke();

    if (!isDataAvailable[i]) {
      fill(CONFIG.colors.labelUnavailableText);
    } else {
      fill(CONFIG.colors.labelAvailableText);
    }

    textSize(CONFIG.chartLabelSize);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);

    let ang = (start + end) / 2;
    let lx = cos(ang) * (CONFIG.chartSize / 2 + 70);
    let ly = sin(ang) * (CONFIG.chartSize / 2 + 70);

    text(labels[i], lx, ly - 20);

    if (isDataAvailable[i]) {
      let levelValue = values[i];
      let levelText = "Impact: " + levelValue;

      //val impatto
      fill(CONFIG.colors.chartAvailable);
      textSize(CONFIG.chartLabelSize);
      textStyle(BOLD);
      text(levelText, lx, ly - 3);

      let detailText = "";
      if (i === 0) detailText = getDetailText(d.rawDeath, d.death, "deaths");
      else if (i === 1) detailText = getDetailText(d.rawInj, d.inj, "injuries");
      else if (i === 2) detailText = getDetailText(d.rawDmg, d.dmg, "damage");
      else if (i === 3)
        detailText = getDetailText(d.rawHouse, d.house, "houses");
      else if (i === 4)
        detailText = getDetailText(d.rawMissing, d.missing, "missing");

      fill(CONFIG.colors.labelAvailableText);
      textSize(CONFIG.chartLabelSize);
      textStyle(NORMAL);
      textAlign(CENTER, TOP);

      let textY = ly + 7;
      text(detailText, lx - detailMaxWidth / 2, textY, detailMaxWidth);
    } else {
      //details not available x sezioni senza dati
      fill(CONFIG.colors.labelUnavailableText);
      textSize(CONFIG.chartLabelSize);
      textStyle(NORMAL);
      textAlign(CENTER, TOP);

      let textY = ly + 7;
      text(
        "Details not available",
        lx - detailMaxWidth / 2,
        textY,
        detailMaxWidth,
      );
    }
  }

  pop();

  //tooltip hover
  if (hoveredSection !== -1 && isDataAvailable[hoveredSection]) {
    if (hoveredSection === 0) {
      tooltipText = getDetailText(d.rawDeath, d.death, "deaths");
    } else if (hoveredSection === 1) {
      tooltipText = getDetailText(d.rawInj, d.inj, "injuries");
    } else if (hoveredSection === 2) {
      tooltipText = formatDamageValue(d.originalDmgValue);
    } else if (hoveredSection === 3) {
      tooltipText = getDetailText(d.rawHouse, d.house, "houses");
    } else if (hoveredSection === 4) {
      tooltipText = getDetailText(d.rawMissing, d.missing, "missing");
    }
  }

  if (tooltipText !== "" && !tooltipText.includes("not available")) {
    drawTooltip(tooltipText);
  }

  push();
  noStroke();
  fill(CONFIG.colors.text);
  textSize(CONFIG.chartTitleSize);
  textAlign(RIGHT, CENTER);
  textStyle(BOLD);

  let totalImpactText = "Total impact level: " + d.impact;
  let totalImpactX = width - CONFIG.layout.marginX;
  let totalImpactY = CONFIG.layout.navbarHeight + 30 * scaleFactor;

  text(totalImpactText, totalImpactX, totalImpactY);

  textStyle(NORMAL);
  pop();
}

function drawArcSegment(r1, r2, start, end) {
  beginShape();
  for (let a = start; a <= end; a += 0.01) {
    vertex(cos(a) * r2, sin(a) * r2);
  }
  for (let a = end; a >= start; a -= 0.01) {
    vertex(cos(a) * r1, sin(a) * r1);
  }
  endShape(CLOSE);
}

function drawTooltip(txt) {
  push();
  textSize(CONFIG.chartTooltipTextSize);
  let w = textWidth(txt) + 20;
  let h = 34;

  fill(255);
  stroke(CONFIG.colors.chartAvailable);
  rect(mouseX + 15, mouseY - 10, w, h, 6);

  fill(0);
  noStroke();
  textAlign(LEFT, CENTER);
  text(txt, mouseX + 25, mouseY + 8);
  pop();
}

function drawChartPlaceholder() {
  let cx = width * CONFIG.chartXPercent;
  let cy = height * CONFIG.chartYPercent;

  push();
  fill(240);
  noStroke();
  rectMode(CENTER);
  rect(cx, cy, CONFIG.chartSize + 40, CONFIG.chartSize + 40, 12);
  pop();

  push();
  textAlign(CENTER, CENTER);
  fill(0);
  textSize(16);
  text("Impact chart\nnot available", cx, cy);
  pop();
}

//animazioni
function startAnimation() {
  state.isAnimating = true;
  state.animationStartTime = millis();
}

function getAnimationProgress() {
  if (!state.isAnimating) return 1.0;

  let elapsed = millis() - state.animationStartTime;
  let progress = constrain(elapsed / 1000, 0, 1);

  if (progress >= 1.0) {
    state.isAnimating = false;
  }

  return progress;
}

function drawTitle() {
  textSize(72);
  textFont("Helvetica");
  textStyle(BOLD);
  textAlign(LEFT, TOP);

  const titleY = 95 - 20;

  fill(CONFIG.colors.text);
  text("ABOUT THE", CONFIG.layout.marginX, titleY);

  fill(CONFIG.colors.accent);
  text("DETAIL VIEW", CONFIG.layout.marginX, titleY + 75);

  textStyle(NORMAL);
}

//navbar
function drawNavBar() {
  push();

  let navHeight = 60;
  let navY = 0;

  //mouse sopra <back
  let isOverNavBack = false;

  //back bianco, hover nero
  fill(CONFIG.colors.accent);
  textSize(15);
  textFont("Helvetica");
  textStyle(BOLD);
  textAlign(LEFT, CENTER);

  let backText = "<   Back";
  let backX = 40;
  let backY = navHeight / 2;
  let backWidth = textWidth(backText);
  let backHeight = 20;
  let backTextY = backY - backHeight / 2;

  //mouse sopra back
  if (
    mouseX > backX &&
    mouseX < backX + backWidth &&
    mouseY > backTextY &&
    mouseY < backTextY + backHeight
  ) {
    isOverNavBack = true;
    fill(CONFIG.colors.text); //hover
  }

  text(backText, backX, backY);

  //area interazione
  state.navBackArea = {
    x: backX,
    y: backTextY,
    width: backWidth,
    height: backHeight,
  };

  //link navbar
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

    //Colori
    if (link.isExplore) {
      fill(CONFIG.colors.accent); //explore bianco
      textStyle(BOLD);
    } else {
      fill(CONFIG.colors.text); //resto dei link neri
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
      if (link.isExplore) {
        //explore hover nero
        fill(CONFIG.colors.text);
      } else {
        //altri link hover bianco
        fill(CONFIG.colors.accent);
      }

      text(link.name, link.x, link.y);
    }

    currentX += link.width + linkSpacing;
  }
  state.navLinks = navLinks;

  //linea sotto navbar bianca
  stroke(CONFIG.colors.accent);
  strokeWeight(1);
  line(0, navHeight - 5, width, navHeight - 5);

  pop();
}

//back button in basso a dx
function drawBackButton() {
  const buttonWidth = 160;
  const buttonHeight = 40;

  const buttonY = height - 80;
  const buttonX = width - buttonWidth - 50;

  //fill bianco solo con l'hover
  if (state.isBackButtonHovered) {
    fill(CONFIG.colors.accent);
  } else {
    noFill();
  }

  //bordo bianco con l'hover, nero normalmente
  stroke(
    state.isBackButtonHovered ? CONFIG.colors.accent : CONFIG.colors.infoBox,
  );
  strokeWeight(1);
  rect(buttonX, buttonY, buttonWidth, buttonHeight, 5);

  //icona x
  push();
  translate(buttonX + 25, buttonY + buttonHeight / 2);
  fill(
    state.isBackButtonHovered
      ? CONFIG.colors.background
      : CONFIG.colors.infoBox,
  );
  noStroke();
  textSize(20);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("×", 0, 0);
  pop();

  //back nero e rosso con l'hover
  fill(
    state.isBackButtonHovered
      ? CONFIG.colors.background
      : CONFIG.colors.infoBox,
  );
  noStroke();
  textSize(CONFIG.layout.labelFontSize);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("Back", buttonX + 50, buttonY + buttonHeight / 2);

  //area interazione
  state.backButtonArea = {
    x: buttonX,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight,
  };
}

//bottone per andare alla pag di methodology
function drawMethodologyButton() {
  const buttonWidth = 200;
  const buttonHeight = 40;

  const buttonX = 50;
  const buttonY = CONFIG.layout.startButtonY; //altezza = al back button
  //no fill normalmente e bianco con l'hover
  if (state.isMethodologyButtonHovered) {
    fill(CONFIG.colors.accent);
  } else {
    noFill();
  }

  //bordo nero e bianco con l'hover
  stroke(
    state.isMethodologyButtonHovered
      ? CONFIG.colors.accent
      : CONFIG.colors.infoBox,
  );
  strokeWeight(1);
  rect(buttonX, buttonY, buttonWidth, buttonHeight, 5);

  //testo bottone about the methodology nero e rosso con l'hover
  fill(
    state.isMethodologyButtonHovered
      ? CONFIG.colors.background
      : CONFIG.colors.infoBox,
  );
  noStroke();
  textSize(CONFIG.layout.labelFontSize);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("About the Methodology", buttonX + 12, buttonY + buttonHeight / 2);

  //area interazione
  state.methodologyButtonArea = {
    x: buttonX,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight,
  };
}

//cursore a manina per l'hober
function updateCursor() {
  let isOverButton = false;
  //<back
  if (
    state.navBackArea &&
    mouseX > state.navBackArea.x &&
    mouseX < state.navBackArea.x + state.navBackArea.width &&
    mouseY > state.navBackArea.y &&
    mouseY < state.navBackArea.y + state.navBackArea.height
  ) {
    isOverButton = true;
  }
  //link navbar
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

  //back button
  state.isBackButtonHovered = false;

  if (
    state.backButtonArea &&
    mouseX > state.backButtonArea.x &&
    mouseX < state.backButtonArea.x + state.backButtonArea.width &&
    mouseY > state.backButtonArea.y &&
    mouseY < state.backButtonArea.y + state.backButtonArea.height
  ) {
    isOverButton = true;
    state.isBackButtonHovered = true;
  }

  //bottone methodology
  state.isMethodologyButtonHovered = false;

  if (
    state.showMethodologyButton &&
    state.methodologyButtonArea &&
    mouseX > state.methodologyButtonArea.x &&
    mouseX <
      state.methodologyButtonArea.x + state.methodologyButtonArea.width &&
    mouseY > state.methodologyButtonArea.y &&
    mouseY < state.methodologyButtonArea.y + state.methodologyButtonArea.height
  ) {
    isOverButton = true;
    state.isMethodologyButtonHovered = true;
  }

  let cx = width * CONFIG.chartXPercent;
  let cy = height * CONFIG.chartYPercent;
  let mx = mouseX - cx;
  let my = mouseY - cy;
  let mDist = dist(0, 0, mx, my);

  if (mDist < CONFIG.chartSize / 2 + 20 && mDist > 20) {
    isOverButton = true;
  }

  if (isOverButton) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

//click sui bottoni
function mousePressed() {
  //<back
  if (
    state.navBackArea &&
    mouseX > state.navBackArea.x &&
    mouseX < state.navBackArea.x + state.navBackArea.width &&
    mouseY > state.navBackArea.y &&
    mouseY < state.navBackArea.y + state.navBackArea.height
  ) {
    goBackToPreviousPage();
    return;
  }

  //link navbar
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

  //back buttone in basso dx
  if (
    state.backButtonArea &&
    mouseX > state.backButtonArea.x &&
    mouseX < state.backButtonArea.x + state.backButtonArea.width &&
    mouseY > state.backButtonArea.y &&
    mouseY < state.backButtonArea.y + state.backButtonArea.height
  ) {
    goBackToPreviousPage();
    return;
  }

  //bottone methodology
  if (
    state.showMethodologyButton &&
    state.methodologyButtonArea &&
    mouseX > state.methodologyButtonArea.x &&
    mouseX <
      state.methodologyButtonArea.x + state.methodologyButtonArea.width &&
    mouseY > state.methodologyButtonArea.y &&
    mouseY < state.methodologyButtonArea.y + state.methodologyButtonArea.height
  ) {
    window.location.href = "methodology.html";
    return;
  }
}

//torna alla pagina precedente
function goBackToPreviousPage() {
  let volcanoName = getQueryParam("name");
  let volcanoYear = getQueryParam("year");
  let volcanoNumber = getQueryParam("number");

  if (volcanoName) {
    let backUrl = "detail.html?name=" + encodeURIComponent(volcanoName);

    if (volcanoYear) backUrl += "&year=" + volcanoYear;
    if (volcanoNumber) backUrl += "&number=" + volcanoNumber;

    window.location.href = backUrl;
    return;
  }

  if (
    document.referrer &&
    document.referrer !== "" &&
    document.referrer !== window.location.href
  ) {
    window.location.href = document.referrer;
  } else {
    //torna alla mappa generale se tutto fallisce
    window.location.href = "overview.html";
  }
}

//ridimensionamento finestra
function windowResized() {
  applyResponsiveScaling();
  resizeCanvas(windowWidth, windowHeight);

  if (typeof redraw === "function") {
    redraw();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    if (typeof setup === "function" && !state.initialized) {
      initializeData();
      if (typeof redraw === "function") {
        redraw();
      }
    }
  }, 100);
});

//event listener x scrolling
function setupScrollListeners() {
  state.scrollArea = document.getElementById("text-scroll-area");
  state.scrollHint = document.getElementById("scroll-hint");

  if (state.scrollArea) {
    state.scrollArea.addEventListener("scroll", handleTextScroll);
    document.addEventListener("wheel", handleGlobalWheel, { passive: false });

    if (state.scrollHint) {
      state.scrollHint.addEventListener("click", function () {
        scrollTextContent(300);
      });
    }

    //inzializza scroll
    setTimeout(checkScrollEnd, 100);
  }
}

//scrolling globale
function handleGlobalWheel(e) {
  if (state.scrollArea) {
    state.scrollArea.scrollTop += e.deltaY;
    e.preventDefault();
    checkScrollEnd();
  }
}

//scrolling solo del testo a sx
function handleTextScroll() {
  checkScrollEnd();
}

//siamo alla fine dello scrolling a sx?
function checkScrollEnd() {
  if (!state.scrollArea || !state.scrollHint) return;

  const scrollTop = state.scrollArea.scrollTop;
  const scrollHeight =
    state.scrollArea.scrollHeight - state.scrollArea.clientHeight;
  const scrollPercentage =
    scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

  //va via la freccia e mostra il bottone methodology
  if (scrollPercentage > 90) {
    state.scrollHint.style.display = "none";
    state.isAtBottom = true;
    state.showMethodologyButton = true; //mostra
  } else {
    state.scrollHint.style.display = "block";
    state.isAtBottom = false;
    state.showMethodologyButton = false; //non mostra bottone
  }
}

//scrolling del solo testo a sx
function scrollTextContent(pixels) {
  if (!state.scrollArea) return;

  state.scrollArea.scrollTop += pixels;
  checkScrollEnd();
}

//inizializzazione caricamento pag
document.addEventListener("DOMContentLoaded", function () {
  // Assicura che p5.js sia pronto
  setTimeout(function () {
    if (typeof setup === "function" && !state.initialized) {
      initializeData();

      if (typeof redraw === "function") {
        redraw();
      }
    }
  }, 100);
});
