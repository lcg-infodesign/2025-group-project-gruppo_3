const CONFIG = {
  layout: {
    marginX: 40,
    navbarHeight: 70,
    maxChartSize: 500,
    minChartSize: 300,
    centerXRatio: 0.695,
  },
  responsive: {
    referenceWidth: 1920,
    referenceHeight: 1080,
  },
};

let scaleFactor = 1.0;
let currentChartData = null;

//scaling
function calculateScaleFactor() {
  const referenceWidth = CONFIG.responsive.referenceWidth;
  const referenceHeight = CONFIG.responsive.referenceHeight;

  const widthRatio = windowWidth / referenceWidth;
  const heightRatio = windowHeight / referenceHeight;

  return min(widthRatio, heightRatio);
}

function applyResponsiveScaling() {
  //scaling basato sull'altezza
  const availableHeight = windowHeight - CONFIG.layout.navbarHeight;
  const referenceAvailableHeight =
    CONFIG.responsive.referenceHeight - CONFIG.layout.navbarHeight;

  scaleFactor = availableHeight / referenceAvailableHeight;
  scaleFactor = constrain(scaleFactor, 0.7, 1.2);

  updateResponsiveDimensions();
}

function updateResponsiveDimensions() {
  //posizione grafico
  let centerXRatio = CONFIG.layout.centerXRatio;

  if (windowWidth > 1920) {
    centerXRatio = 0.75;
  } else if (windowWidth < 1366) {
    centerXRatio = 0.65;
  }

  //centro y grafico
  const centerYPercentage = 0.48;
  let centerY;

  if (windowHeight > 1200) {
    centerY = windowHeight * 0.46 + 25;
  } else if (windowHeight < 800) {
    centerY = windowHeight * 0.5 + 25;
  } else {
    centerY = windowHeight * centerYPercentage + 25;
  }

  //posizione grafico
  chartXPercent = centerXRatio;
  chartYPercent = centerY / windowHeight;

  const graphScale = min(scaleFactor * 1.3, 1.2);
  const baseSize = 500;

  const availableHeight = windowHeight - CONFIG.layout.navbarHeight - 100;
  const availableWidth = windowWidth * 0.35;

  const targetSize = min(availableHeight, availableWidth);

  //scale grafico
  chartSize = constrain(
    targetSize * 0.8,
    CONFIG.layout.minChartSize * graphScale,
    CONFIG.layout.maxChartSize * graphScale,
  );

  chartTitleSize = 28;
  mainTextSize = 17;
  chartLabelSize = 14;
  chartTooltipTextSize = 15;
}

let chartXPercent = 0.7;
let chartYPercent = 0.5;
let chartSize = 500;
let chartLevels = 4;
let chartMainColor = "#ff2b00";
let chartGapAngleDeg = 10;
let chartGapRadial = 5;
let chartTitleSize = 28;
let mainTextSize = 17;
let chartLabelSize = 14;
let chartTooltipTextSize = 17;
const INFLATION_FACTOR = 2.4;

let data;
let eruptions = [];
let selectedName;
let selectedYear = 0;
let selectedNumber = 0;
let currentIndex = 0;

let state = {
  learnMoreButtonArea: null,
  navLinks: null,
  navBackArea: null,
};

//animazione variabili
let animationStartTime = 0;
let animationDuration = 1000;
let isAnimating = false;
let initialAnimationStarted = false;

//hover variabili
let hoveredArrow = null;
let hoveredLearnMore = false;

//transizione variabili
let transitionState = {
  active: false,
  startTime: 0,
  duration: 800,
  startX: 0,
  startY: 0,
  startRadius: 0,
  targetRadius: 0,
};

//img
let worldMap;
let currentVolcanoImage = null;
let imageCache = {};
let imagesLoaded = false;

function preload() {
  data = loadTable("../assets/data_impatto.csv", "csv", "header");
  worldMap = loadImage("../assets/Equirectangular_projection.jpg");

  stratoImg = loadImage("../assets/stratovolcano.png");
  calderaImg = loadImage("../assets/caldera.png");
  shieldImg = loadImage("../assets/shield_volcano.png");

  imageCache.strato = stratoImg;
  imageCache.caldera = calderaImg;
  imageCache.shield = shieldImg;
}

// ---------- SETUP VELOCE ----------
function setup() {
  localStorage.setItem("previousPageBeforeDetailView", window.location.href);

  createCanvas(windowWidth, windowHeight);
  textFont("Helvetica");
  frameRate(60);

  applyResponsiveScaling();

  selectedName = getQueryParam("name");
  selectedYear = int(getQueryParam("year"));
  selectedNumber = int(getQueryParam("number"));

  if (!selectedName) return;

  processDataFast();
  updateChartData();

  startAnimation();
  initialAnimationStarted = true;

  loadVolcanoImageAsync();

  setTimeout(loadOtherImagesBackground, 2000);
}

function processDataFast() {
  eruptions = [];

  for (let i = 0; i < data.getRowCount(); i++) {
    if (data.getString(i, "Name") === selectedName) {
      let coords = getUniversalCoordinates(
        data.getString(i, "Latitude"),
        data.getString(i, "Longitude"),
        data.getString(i, "Name"),
        data.getString(i, "Country"),
      );

      eruptions.push({
        year: int(data.getString(i, "Year")),
        mo: data.getString(i, "Mo"),
        dy: data.getString(i, "Dy"),
        country: data.getString(i, "Country"),
        type: data.getString(i, "Type") || "Unknown",
        deaths: data.getString(i, "Deaths") || "Not Available",
        number: int(data.getString(i, "Number")),
        lat: coords.lat,
        lon: coords.lon,
      });
    }
  }

  eruptions.sort((a, b) => a.year - b.year);

  if (!isNaN(selectedNumber) && selectedNumber > 0) {
    const idxByNumber = eruptions.findIndex((e) => e.number === selectedNumber);
    if (idxByNumber !== -1) currentIndex = idxByNumber;
  } else if (!isNaN(selectedYear) && selectedYear > 0) {
    const idxByYear = eruptions.findIndex((e) => e.year === selectedYear);
    if (idxByYear !== -1) {
      currentIndex = idxByYear;
      selectedNumber = eruptions[currentIndex].number;
    }
  }

  if (eruptions.length > 0 && currentIndex === 0) {
    selectedYear = eruptions[0].year;
    selectedNumber = eruptions[0].number;
  }
}

function updateChartData() {
  let dataRowIndex = findDataRowIndexFast();
  if (dataRowIndex !== -1) {
    currentChartData = buildChartDataFromRow(dataRowIndex);
  } else {
    currentChartData = null;
  }
}

function loadVolcanoImageAsync() {
  if (eruptions.length === 0) return;

  const selected = eruptions[currentIndex];
  const type = normalizeType(selected.type);

  let imageKey = null;

  if (type.includes("stratovolcano") || type.includes("strato")) {
    imageKey = "strato";
  } else if (type.includes("caldera")) {
    imageKey = "caldera";
  } else if (type.includes("shield")) {
    imageKey = "shield";
  } else if (type.includes("cinder")) {
    imageKey = "cinder";
  } else if (type.includes("complex")) {
    imageKey = "complex";
  } else if (type.includes("compound")) {
    imageKey = "compound";
  } else if (type.includes("crater")) {
    imageKey = "crater";
  } else if (type.includes("fissure")) {
    imageKey = "fissure";
  } else if (type.includes("lava_cone") || type.includes("lava cone")) {
    imageKey = "lava_cone";
  } else if (type.includes("lava_dome") || type.includes("lava dome")) {
    imageKey = "lava_dome";
  } else if (type.includes("maar")) {
    imageKey = "maar";
  } else if (type.includes("pumice")) {
    imageKey = "pumice";
  } else if (
    type.includes("pyroclastic_cone") ||
    type.includes("pyroclastic cone")
  ) {
    imageKey = "pyroclastic_cone";
  } else if (
    type.includes("pyroclastic_shield") ||
    type.includes("pyroclastic shield")
  ) {
    imageKey = "pyroclastic_shield";
  } else if (type.includes("subglacial")) {
    imageKey = "subglacial";
  } else if (type.includes("submarine")) {
    imageKey = "submarine";
  } else if (type.includes("tuff")) {
    imageKey = "tuff";
  } else if (
    type.includes("volcanic_field") ||
    type.includes("volcanic field")
  ) {
    imageKey = "volcanic_field";
  }

  if (imageKey && imageCache[imageKey]) {
    currentVolcanoImage = imageCache[imageKey];
    return;
  }

  if (!imageKey) imageKey = "strato";

  const imagePaths = {
    strato: "../assets/stratovolcano.png",
    caldera: "../assets/caldera.png",
    shield: "../assets/shield_volcano.png",
    cinder: "../assets/cinder_cone.png",
    complex: "../assets/complex_volcano.png",
    compound: "../assets/compound_volcano.png",
    crater: "../assets/crater_rows.png",
    fissure: "../assets/fissure_vent.png",
    lava_cone: "../assets/lava_cone.png",
    lava_dome: "../assets/lava_dome.png",
    maar: "../assets/maar.png",
    pumice: "../assets/pumice_cone.png",
    pyroclastic_cone: "../assets/pyroclastic_cone.png",
    pyroclastic_shield: "../assets/pyroclastic_shield.png",
    subglacial: "../assets/subglacial_volcano.png",
    submarine: "../assets/submarine.png",
    tuff: "../assets/tuff_cone.png",
    volcanic_field: "../assets/volcanic_field.png",
  };

  if (imagePaths[imageKey]) {
    loadImage(imagePaths[imageKey], (img) => {
      currentVolcanoImage = img;
      imageCache[imageKey] = img;
    });
  }
}

function loadOtherImagesBackground() {
  const otherImages = [
    "../assets/complex_volcano.png",
    "../assets/cinder_cone.png",
    "../assets/compound_volcano.png",
    "../assets/crater_rows.png",
    "../assets/fissure_vent.png",
    "../assets/lava_cone.png",
    "../assets/lava_dome.png",
    "../assets/maar.png",
    "../assets/pumice_cone.png",
    "../assets/pyroclastic_cone.png",
    "../assets/pyroclastic_shield.png",
    "../assets/subglacial_volcano.png",
    "../assets/submarine.png",
    "../assets/tuff_cone.png",
    "../assets/volcanic_field.png",
  ];

  otherImages.forEach((path, index) => {
    setTimeout(
      () => {
        loadImage(path, (img) => {
          const name = path.split("/").pop().replace(".png", "");
          imageCache[name] = img;
        });
      },
      300 + index * 350,
    );
  });
}

function draw() {
  background("#FFFFFF");

  if (eruptions.length === 0) {
    drawNoDataScreen();
    return;
  }

  updateTransition();

  if (transitionState.active) {
    let selected = eruptions[currentIndex];
    if (currentVolcanoImage) {
      drawVolcanoTypeBackgroundOptimized(selected.type);
    }
    drawBackButton();
    drawLearnMoreButton();
    drawNavBar();
    writeText();
    drawTransition();
  } else {
    drawFullContentOptimized();
  }

  updateCursor();
}

function drawFullContentOptimized() {
  let selected = eruptions[currentIndex];

  if (currentVolcanoImage) {
    drawVolcanoTypeBackgroundOptimized(selected.type);
  }

  drawMap(selected.lat, selected.lon, selected.country);

  drawBackButton();
  drawLearnMoreButton();
  drawNavBar();
  writeText();
  drawYearNavigator(selected.year);
  drawVolcanoDescription(
    selected.type,
    selected.year,
    selected.mo,
    selected.dy,
  );

  if (currentChartData) {
    drawImpactChart(currentChartData);
  } else {
    drawChartPlaceholder();
  }
}

function drawNavBar() {
  push();

  let navHeight = 60;
  let navY = 0;

  fill(255);
  noStroke();
  rect(0, navY, width, navHeight);

  //calcola se il mouse è sopra il tastino back
  let isOverNavBack = false;
  let navBackArea = null;

  //hover tastino back
  fill(0);
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

  //controlla se il mouse è sopra il tasto back
  if (
    mouseX > backX &&
    mouseX < backX + backWidth &&
    mouseY > backTextY &&
    mouseY < backTextY + backHeight
  ) {
    isOverNavBack = true;
    fill("#FF2B00");
  }

  text(backText, backX, backY);

  //area interazione
  navBackArea = {
    x: backX,
    y: backTextY,
    width: backWidth,
    height: backHeight,
  };

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

  let startX = width - totalLinksWidth - 40;
  let currentX = startX;

  for (let i = 0; i < navLinks.length; i++) {
    let link = navLinks[i];
    link.x = currentX;
    link.y = navHeight / 2;

    if (link.isExplore) {
      fill("#FF2B00");
      textStyle(BOLD);
    } else {
      fill(0);
      textStyle(NORMAL);
    }

    text(link.name, link.x, link.y);

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
      cursor(HAND);
      if (!link.isExplore) {
        fill("#FF2B00");
        text(link.name, link.x, link.y);
      }
    }

    currentX += link.width + linkSpacing;
  }

  //area back per interazione
  state.navBackArea = navBackArea;
  state.navLinks = navLinks;

  stroke(245, 40, 0);
  strokeWeight(1);
  line(0, navHeight - 5, width, navHeight - 5);

  pop();
}

function drawVolcanoTypeBackgroundOptimized(typeRaw) {
  if (!currentVolcanoImage) return;

  push();
  translate(width * 0.5, height / 2);
  imageMode(CENTER);
  tint(255, 50);

  let imgWidth = min(1100, width * 0.95);
  let imgHeight = imgWidth * (750 / 1000);

  image(currentVolcanoImage, 0, 0, imgWidth, imgHeight);
  tint(255, 255);
  pop();
}

function drawMap(lat, lon, country) {
  let margin = 60;
  let mapW = 320;
  let mapH = 180;
  let mapX = 40;
  let mapY = height - mapH - 40;
  let cornerRadius = 10;

  let titleY = mapY - 30;
  push();
  fill(chartMainColor);
  textSize(mainTextSize);
  textStyle(BOLD);
  textAlign(LEFT, TOP);

  let label = "Location: ";
  let value = country && country.trim() !== "" ? country : "Unknown";

  push();
  textSize(mainTextSize);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);

  fill(0);
  text(label, mapX, titleY);

  fill(chartMainColor);
  textStyle(BOLD);
  text(value, mapX + 7 + textWidth(label), titleY);
  pop();
  pop();
  push();
  fill(255, 230);
  noStroke();
  rect(mapX - 5, mapY - 5, mapW + 10, mapH + 10, cornerRadius + 2);
  pop();

  push();
  stroke(245, 40, 0);
  strokeWeight(1);
  noFill();
  rect(mapX, mapY, mapW, mapH, cornerRadius);
  pop();

  let innerX = mapX + 2;
  let innerY = mapY + 2;
  let innerW = mapW - 4;
  let innerH = mapH - 4;

  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.roundRect(innerX, innerY, innerW, innerH, cornerRadius - 2);
  drawingContext.clip();

  image(worldMap, innerX, innerY, innerW, innerH);

  drawingContext.restore();
  pop();

  if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
    let lonAdjusted = lon;
    while (lonAdjusted > 180) lonAdjusted -= 360;
    while (lonAdjusted < -180) lonAdjusted += 360;

    let markerX = map(lonAdjusted, -180, 180, innerX, innerX + innerW);

    let latAdjusted = constrain(lat, -90, 90);
    let markerY = map(latAdjusted, 90, -90, innerY, innerY + innerH);

    let offsetPercent = -0.018;
    let offsetPixels = offsetPercent * innerW;

    markerX += offsetPixels;

    drawResponsiveLocationMarker(markerX, markerY);
  }
}

function drawResponsiveLocationMarker(x, y) {
  push();
  noStroke();

  let scaleFactor = width / 1920;
  scaleFactor = constrain(scaleFactor, 0.7, 1.5);

  let baseSize = 30 * scaleFactor;

  for (let i = 0; i < 3; i++) {
    let size = baseSize * (1 + i * 0.3);
    let alpha = map(i, 0, 2, 25, 8);
    fill(255, 100, 0, alpha);
    ellipse(x, y, size, size);
  }

  strokeWeight(max(1, baseSize * 0.07));
  stroke(255, 50, 0);
  noFill();
  ellipse(x, y, baseSize * 0.6, baseSize * 0.6);

  noStroke();
  fill(255, 0, 0);
  ellipse(x, y, baseSize * 0.4, baseSize * 0.4);

  fill(255, 255, 200);
  ellipse(x, y, baseSize * 0.2, baseSize * 0.2);

  pop();
}

function findDataRowIndexFast() {
  for (let i = 0; i < data.getRowCount(); i++) {
    if (
      data.getString(i, "Name") === selectedName &&
      String(data.getString(i, "Number")) === String(selectedNumber)
    ) {
      return i;
    }
  }
  return -1;
}

function getDetailText(value, descCode, type, chartData = null) {
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

  return tables[type][code];
}

function drawImpactChart(d) {
  let tooltipText = "";

  push();

  let panelW = chartSize + 40;
  let panelH = chartSize + 40;
  let px = width * chartXPercent - panelW / 2;
  let py = height * chartYPercent - panelH / 2;

  noFill();
  noStroke();
  rect(px, py, panelW, panelH, 10);

  let cx = width * chartXPercent;
  let cy = height * chartYPercent;
  translate(cx, cy);

  let gapAngle = radians(chartGapAngleDeg);
  let gapRadial = chartGapRadial;
  let maxChartRadius = chartSize / 2 + 20;
  let radiusStep = chartSize / (2 * chartLevels);

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

  //sezioni con dati disponibili
  for (let i = 0; i < 5; i++) {
    if (!isDataAvailable[i]) continue;

    let start = sectionAngle * i + gapAngle / 2;
    let end = sectionAngle * (i + 1) - gapAngle / 2;

    for (let level = 1; level <= chartLevels; level++) {
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

        fill(chartMainColor);
        stroke(chartMainColor);
        strokeWeight(1);
        drawArcSegment(innerR, animatedOuterR, start, end);
      } else {
        noFill();
        stroke(chartMainColor);
        strokeWeight(1);
        drawArcSegment(innerR, outerR, start, end);
      }
    }
  }

  //sezioni in cui non ci sono i dati disponibili
  for (let i = 0; i < 5; i++) {
    if (isDataAvailable[i]) continue;

    let start = sectionAngle * i + gapAngle / 2;
    let end = sectionAngle * (i + 1) - gapAngle / 2;

    for (let level = 1; level <= chartLevels; level++) {
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
      let lineColor = color(180, 180, 180);

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
      stroke(150, 150, 150);
      strokeWeight(1);
      drawArcSegment(innerR, outerR, start, end);
    }
  }

  let detailMaxWidth = 110;
  let lineHeight = 16;

  for (let i = 0; i < 5; i++) {
    let start = sectionAngle * i + gapAngle / 2;
    let end = sectionAngle * (i + 1) - gapAngle / 2;

    textStyle(NORMAL);
    noStroke();

    if (!isDataAvailable[i]) {
      fill(150, 150, 150);
    } else {
      fill(0);
    }
    textSize(chartLabelSize);
    textAlign(CENTER, CENTER);

    let ang = (start + end) / 2;
    let lx = cos(ang) * (chartSize / 2 + 70);
    let ly = sin(ang) * (chartSize / 2 + 70);

    textStyle(BOLD);
    text(labels[i], lx, ly - 20);

    if (isDataAvailable[i]) {
      let levelValue = values[i];
      let levelText = "Impact: " + levelValue;

      fill(chartMainColor);
      textSize(chartLabelSize);
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

      fill(0);
      textSize(chartLabelSize);
      textStyle(NORMAL);
      textAlign(CENTER, TOP);

      let numLines = 1;
      if (detailText.includes("\n")) {
        numLines = 2;
      }

      let textY = ly + 7;
      text(detailText, lx - detailMaxWidth / 2, textY, detailMaxWidth);
    }
  }

  if (hoveredSection !== -1) {
    if (hoveredSection === 0) {
      tooltipText = getDetailText(d.rawDeath, d.death, "deaths");
    } else if (hoveredSection === 1) {
      tooltipText = getDetailText(d.rawInj, d.inj, "injuries");
    } else if (hoveredSection === 2) {
      tooltipText = tooltipText = getDetailText(d.rawDmg, d.dmg, "damage");
    } else if (hoveredSection === 3) {
      tooltipText = getDetailText(d.rawHouse, d.house, "houses");
    } else if (hoveredSection === 4) {
      tooltipText = getDetailText(d.rawMissing, d.missing, "missing");
    }
  }

  pop();

  push();
  noStroke();
  fill(245, 40, 0);
  textSize(chartTitleSize);
  textAlign(RIGHT, CENTER);
  textStyle(BOLD);

  let totalImpactText = "Total impact level: " + d.impact;
  let totalImpactX = width - CONFIG.layout.marginX;
  let totalImpactY = CONFIG.layout.navbarHeight + 30 * scaleFactor;

  text(totalImpactText, totalImpactX, totalImpactY);

  textStyle(NORMAL);
  pop();

  if (tooltipText !== "") {
    drawTooltip(tooltipText);
  }
}

function drawTooltip(txt) {
  push();
  textSize(chartTooltipTextSize);
  let w = textWidth(txt) + 20;
  let h = 34;

  fill(255);
  stroke(chartMainColor);
  rect(mouseX + 15, mouseY - 10, w, h, 6);

  fill(0);
  noStroke();
  textAlign(LEFT, CENTER);
  text(txt, mouseX + 25, mouseY + 8);
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

function getQueryParam(param) {
  let urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function normalizeType(typeStr) {
  if (!typeStr) return "";
  return typeStr.toLowerCase().trim().replace(/\s+/g, " ");
}

function formatYear(year) {
  return year < 0 ? Math.abs(year) + " BC" : Math.abs(year) + " AD";
}

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function getMonthName(mo) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let m = int(mo);
  return m >= 1 && m <= 12 ? months[m - 1] : "???";
}

function convertTo2026Dollars(damageValue) {
  if (!damageValue || damageValue === 0 || isNaN(damageValue)) return 0;
  return damageValue * INFLATION_FACTOR;
}

function formatDamageValue(damageValue) {
  if (
    damageValue === undefined ||
    damageValue === null ||
    damageValue === 0 ||
    isNaN(damageValue)
  ) {
    return "Details not available";
  }

  let value = convertTo2026Dollars(damageValue);

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
      chartLevels,
    );
  }

  deathVal = isNaN(deathVal) ? 0 : deathVal;
  injVal = isNaN(injVal) ? 0 : injVal;
  dmgVal = isNaN(dmgVal) ? 0 : dmgVal;
  houseVal = isNaN(houseVal) ? 0 : houseVal;
  missingVal = isNaN(missingVal) ? 0 : missingVal;
  impactVal = isNaN(impactVal) ? 0 : impactVal;

  deathVal = constrain(Math.round(deathVal), 0, chartLevels);
  injVal = constrain(Math.round(injVal), 0, chartLevels);
  houseVal = constrain(Math.round(houseVal), 0, chartLevels);
  missingVal = constrain(Math.round(missingVal), 0, chartLevels);

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
    rawDeath: strDeath === "" ? "Details not available" : strDeath,
    rawInj: strInj === "" ? "Details not available" : strInj,
    rawDmg: formattedDamage,
    rawHouse: strHouse === "" ? "Details not available" : strHouse,
    rawMissing: strMissing === "" ? "Details not available" : strMissing,
    originalDmgValue: dmgVal,
  };
}

function drawChartPlaceholder() {
  let cx = width * chartXPercent;
  let cy = height * chartYPercent;

  push();
  fill(240);
  noStroke();
  rectMode(CENTER);
  rect(cx, cy, chartSize + 40, chartSize + 40, 12);
  pop();

  push();
  textAlign(CENTER, CENTER);
  fill(0);
  textSize(16);
  text("Impact chart\nnot available", cx, cy);
  pop();
}

function drawNoDataScreen() {
  fill(0);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Nessun vulcano selezionato", 50, 50);
  drawBackButton();
}

function drawBackButton() {
  push();
  stroke(0);
  strokeWeight(1);
  noFill();

  textSize(14);
  textStyle(BOLD);
  let textW = textWidth("<   BACK");
  let rectX = 67 - 6;
  let rectY = 25 - 4;

  rect(rectX, rectY, textW + 12, 23, 6);

  noStroke();
  fill(0);
  text("<   BACK", 67, 33);
  pop();
}

function writeText() {
  let margin = 40;

  fill(0);
  textAlign(LEFT, TOP);
  textSize(48);
  textStyle(BOLD);
  let y1 = 75;
  text("THE IMPACT OF ", margin, y1);

  fill(245, 40, 0);
  let volcanoName = selectedName ? selectedName.toUpperCase() : "UNKNOWN";
  let y2 = y1 + 55;
  text(volcanoName, margin, y2);

  fill(0);
  text(" IN", margin + textWidth(volcanoName), y2);
}

//descrizione vulcano
function drawVolcanoDescription(typeRaw, y, mo, dy) {
  let margin = 41;

  let dateY = 325;
  let titleY = 330;
  let descriptionY = 370;

  let mapW = 320;
  let textWidthValue = mapW + 150;

  let dayAvailable = dy && dy !== "0" && dy !== "";
  let monthAvailable = mo && mo !== "0" && mo !== "";

  let dayText = dayAvailable ? dy + getOrdinalSuffix(int(dy)) : "??";
  let monthText = monthAvailable ? getMonthName(mo) : "???";

  let yearText = y < 0 ? Math.abs(y) + " BC" : y.toString();

  let fullDate = `${dayText} ${monthText} ${yearText}`;

  push();
  fill(chartMainColor);
  textSize(mainTextSize);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  pop();
  push();
  textSize(mainTextSize);
  textAlign(LEFT, TOP);
  textStyle(NORMAL);

  fill(0);
  text("Date: ", margin, dateY);

  fill(chartMainColor);
  textStyle(BOLD);
  text(fullDate, margin + textWidth("Date: ") + 5, dateY);
  pop();

  pop();

  push();
  fill(chartMainColor);
  textSize(mainTextSize);
  textAlign(LEFT, TOP);
  text(typeRaw, margin, titleY + 20);
  pop();

  let description = getVolcanoDescription(typeRaw);
  push();
  fill(0);
  textSize(mainTextSize);
  textStyle(NORMAL);
  textLeading(19);
  textAlign(LEFT, TOP);
  text(description, margin, descriptionY, textWidthValue);
  pop();
}

function getVolcanoDescription(type) {
  let normalizedType = normalizeType(type);

  if (normalizedType.includes("caldera")) {
    return "Large, roughly circular depression formed when a volcano's magma chamber is emptied by eruption or subsurface magma movement, causing the overlying rock roof to collapse.";
  } else if (
    normalizedType.includes("cinder cone") ||
    normalizedType.includes("cinder")
  ) {
    return "Smallest and most common type of volcano, built from accumulation of pyroclastic fragments (cinders, ash, scoria) ejected from a single vent.";
  } else if (
    normalizedType.includes("complex volcano") ||
    normalizedType.includes("complex")
  ) {
    return "Mixed volcanic landform consisting of related volcanic centers with associated lava flows and pyroclastic deposits.";
  } else if (
    normalizedType.includes("crater rows") ||
    normalizedType.includes("crater")
  ) {
    return "Linear alignments of small volcanic cones and craters that form along active fissures, typically composed of spatter and cinder cones.";
  } else if (
    normalizedType.includes("fissure vent") ||
    normalizedType.includes("fissure")
  ) {
    return "Linear volcanic opening through which lava erupts, typically with little explosive activity.";
  } else if (normalizedType.includes("lava cone")) {
    return "Small, steep-sided cone built from welded fragments of molten lava called spatter, which adhere together upon impact near a volcanic vent.";
  } else if (normalizedType.includes("lava dome")) {
    return "Circular, mound-shaped volcanic protrusion formed by slow extrusion of highly viscous, silica-rich lava that accumulates around the vent.";
  } else if (normalizedType.includes("maar")) {
    return "Broad, low-relief volcanic crater formed by phreatomagmatic eruptions when groundwater comes into contact with hot magma.";
  } else if (
    normalizedType.includes("pumice cone") ||
    normalizedType.includes("pumice")
  ) {
    return "Volcanic cone built from accumulation of lapilli-to-block-sized pumice deposits ejected from moderate-intensity explosive eruptions.";
  } else if (
    normalizedType.includes("pyroclastic cone") ||
    normalizedType.includes("pyroclastic")
  ) {
    return "General term for volcanic cones constructed from accumulation of explosively ejected fragmental material around a vent.";
  } else if (normalizedType.includes("pyroclastic shield")) {
    return "Uncommon type of shield volcano formed primarily from pyroclastic and highly explosive eruptions rather than fluid lava flows.";
  } else if (
    normalizedType.includes("shield volcano") ||
    normalizedType.includes("shield")
  ) {
    return "Large volcano with low, gently sloping profile (typically 2–10 degrees), formed by eruption of highly fluid, low-viscosity basaltic lava.";
  } else if (
    normalizedType.includes("stratovolcano") ||
    normalizedType.includes("strato")
  ) {
    return "Tall, conical volcano built from many alternating layers of hardened lava, ash, and pyroclastic material deposited during successive eruptions.";
  } else if (
    normalizedType.includes("subglacial volcano") ||
    normalizedType.includes("subglacial")
  ) {
    return "Volcanic landform produced by eruptions beneath glaciers or ice sheets, where magma melts overlying ice and rapidly cools lava.";
  } else if (
    normalizedType.includes("submarine volcano") ||
    normalizedType.includes("submarine")
  ) {
    return "Volcanic eruption occurring beneath the ocean surface, more prevalent than subaerial volcanism.";
  } else if (
    normalizedType.includes("tuff cone") ||
    normalizedType.includes("tuff")
  ) {
    return "Pyroclastic cone composed primarily of consolidated volcanic ash (tuff) formed through phreatomagmatic eruptions.";
  } else if (
    normalizedType.includes("volcanic field") ||
    normalizedType.includes("volcanic")
  ) {
    return "Geographic area containing clusters of up to 100 or more volcanoes, typically 30–80 kilometers in diameter.";
  } else if (normalizedType.includes("compound")) {
    return "Compound volcano - a volcanic center that has experienced multiple eruptions from different vents.";
  } else {
    return "Volcanic formation with unique geological characteristics.";
  }
}

//bottone per cambiare da un'eruzione a quella successiva o precedente
function drawYearNavigator(year) {
  let hasMultipleEruptions = eruptions.length > 1;
  let activeColor = color(chartMainColor);
  let inactiveColor = color(180);
  let arrowColor = hasMultipleEruptions ? activeColor : inactiveColor;

  let margin = 62;
  let y = 230;
  let navigatorX = margin;

  textSize(48);
  let leftArrowWidth = textWidth("<");

  textSize(72);
  let yearFormatted = formatYear(year);
  let yearWidth = textWidth(yearFormatted);

  textSize(48);
  let rightArrowWidth = textWidth(">");

  let spaceBetween = 40;
  let framePadding = 20;
  let frameHeight = 50;

  textAlign(LEFT, CENTER);
  fill(0);

  //freccia sx
  let leftArrowX = navigatorX;
  let leftFrameX = leftArrowX - framePadding;
  let leftFrameY = y - frameHeight / 2;

  //hover freccia
  let isLeftArrowHovered = hoveredArrow === "left" && hasMultipleEruptions;

  push();
  if (isLeftArrowHovered) {
    fill(chartMainColor);
    stroke(chartMainColor);
    strokeWeight(1);
    rect(
      leftFrameX,
      leftFrameY,
      leftArrowWidth + framePadding * 2,
      frameHeight,
      10,
    );

    //testo bianco sfondo rosso
    push();
    fill(255);
    textSize(48);
    textStyle(NORMAL);
    text("<", leftArrowX, y);
    pop();
  } else {
    //frecce grigie o rosse
    if (hasMultipleEruptions) {
      stroke(arrowColor);
      strokeWeight(1);
      noFill();
      rect(
        leftFrameX,
        leftFrameY,
        leftArrowWidth + framePadding * 2,
        frameHeight,
        10,
      );
    } else {
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.roundRect(
        leftFrameX,
        leftFrameY,
        leftArrowWidth + framePadding * 2,
        frameHeight,
        10,
      );
      drawingContext.clip();

      stroke(180, 180, 180);
      strokeWeight(1);
      noFill();

      //linee diagonali altro verso
      let patternSpacing = 8;
      let frameWidth = leftArrowWidth + framePadding * 2;

      //linee diagonali
      for (
        let offset = -frameHeight;
        offset < frameWidth;
        offset += patternSpacing
      ) {
        //punto di partenza linee
        let startX = leftFrameX + offset;
        let startY = leftFrameY + frameHeight;

        //punto di arrivo linee
        let endX = leftFrameX + offset + frameHeight;
        let endY = leftFrameY;

        line(startX, startY, endX, endY);
      }

      drawingContext.restore();

      //bordo grigio
      stroke(150, 150, 150);
      strokeWeight(1);
      noFill();
      rect(
        leftFrameX,
        leftFrameY,
        leftArrowWidth + framePadding * 2,
        frameHeight,
        10,
      );
    }

    fill(arrowColor);
    textSize(48);
    textStyle(NORMAL);
    text("<", leftArrowX, y);
  }
  pop();

  //anno in mezzo ai bottoni freccia
  push();
  fill(245, 40, 0);
  textSize(72);
  let yearX = leftArrowX + leftArrowWidth + spaceBetween;
  text(yearFormatted, yearX, y);

  let rightArrowX = yearX + yearWidth + spaceBetween;
  pop();

  //freccia dx
  let rightFrameX = rightArrowX - framePadding;
  let rightFrameY = y - frameHeight / 2;

  //hover freccia dx
  let isRightArrowHovered = hoveredArrow === "right" && hasMultipleEruptions;

  push();
  if (isRightArrowHovered) {
    fill(chartMainColor);
    stroke(chartMainColor);
    strokeWeight(1);
    rect(
      rightFrameX,
      rightFrameY,
      rightArrowWidth + framePadding * 2,
      frameHeight,
      10,
    );

    //testo bianco sfondo rosso
    push();
    fill(255);
    textSize(48);
    textStyle(NORMAL);
    text(">", rightArrowX, y);
    pop();
  } else {
    //frecce grigie o rosse
    if (hasMultipleEruptions) {
      stroke(arrowColor);
      strokeWeight(1);
      noFill();
      rect(
        rightFrameX,
        rightFrameY,
        rightArrowWidth + framePadding * 2,
        frameHeight,
        10,
      );
    } else {
      //pattern di linee per frecce disabilitate
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.roundRect(
        rightFrameX,
        rightFrameY,
        rightArrowWidth + framePadding * 2,
        frameHeight,
        10,
      );
      drawingContext.clip();

      stroke(180, 180, 180);
      strokeWeight(1);
      noFill();

      //linee diagonali verso opposto
      let patternSpacing = 8;
      let frameWidth = rightArrowWidth + framePadding * 2;

      //linee diagonali
      for (
        let offset = -frameHeight;
        offset < frameWidth;
        offset += patternSpacing
      ) {
        //partenza linee diagonali
        let startX = rightFrameX + offset;
        let startY = rightFrameY + frameHeight;

        //fine linee diagonali
        let endX = rightFrameX + offset + frameHeight;
        let endY = rightFrameY;

        line(startX, startY, endX, endY);
      }

      drawingContext.restore();

      //bordo grigio
      stroke(150, 150, 150);
      strokeWeight(1);
      noFill();
      rect(
        rightFrameX,
        rightFrameY,
        rightArrowWidth + framePadding * 2,
        frameHeight,
        10,
      );
    }

    fill(arrowColor);
    textSize(48);
    textStyle(NORMAL);
    text(">", rightArrowX, y);
  }
  pop();

  //counter numero di eruzione per vulcano
  if (eruptions.length > 0) {
    push();
    noStroke();
    fill(chartMainColor);
    textSize(mainTextSize);
    textAlign(LEFT);

    let counterY = y + 75;

    let counterText = currentIndex + 1 + " / " + eruptions.length;

    let label = "Eruption count: ";
    let value = counterText;

    push();
    textSize(mainTextSize);
    textAlign(LEFT);

    textStyle(NORMAL);
    fill(0);
    text(label, margin - 22, counterY);

    fill(chartMainColor);
    textStyle(BOLD);
    text(value, margin - 20 + textWidth(label), counterY);
    pop();

    pop();
  }
}

//learn more button
function drawLearnMoreButton() {
  const buttonWidth = 160;
  const buttonHeight = 40;

  const bottomMargin = 40;
  const buttonY = height - bottomMargin - 40;

  const buttonX = width - buttonWidth - 50;

  const minValidY = CONFIG.layout.navbarHeight + 200;
  const finalY = max(buttonY, minValidY);

  //click area
  state.learnMoreButtonArea = {
    x: buttonX,
    y: finalY,
    width: buttonWidth,
    height: buttonHeight,
  };

  const mapMargin = 60;
  const mapW = 320;
  const mapH = 180;
  const mapX = mapMargin;
  const mapY = height - mapH - mapMargin;
  const buttonRight = buttonX + buttonWidth;
  const buttonBottom = finalY + buttonHeight;
  const mapRight = mapX + mapW;
  const mapBottom = mapY + mapH;

  let adjustedY = finalY;
  if (
    buttonX < mapRight &&
    buttonRight > mapX &&
    finalY < mapBottom &&
    buttonBottom > mapY
  ) {
    adjustedY = mapY - buttonHeight - 20;
    state.learnMoreButtonArea.y = adjustedY;
  }

  //bordo bottone
  if (hoveredLearnMore) {
    //hover rosso
    fill(chartMainColor);
    stroke(chartMainColor);
    strokeWeight(1);
    rect(buttonX, adjustedY, buttonWidth, buttonHeight, 5);

    //i
    push();
    translate(buttonX + 25, adjustedY + buttonHeight / 2);
    stroke(255);
    strokeWeight(1);
    noFill();
    circle(0, 0, 20);
    fill(255);
    noStroke();
    textSize(16);
    textAlign(CENTER, CENTER);
    text("i", 0, 0);
    pop();

    //testo
    fill(255);
    noStroke();
    textSize(16);
    textAlign(LEFT, CENTER);
    text("Learn More", buttonX + 50, adjustedY + buttonHeight / 2);
  } else {
    //stato normale
    stroke(245, 40, 0);
    strokeWeight(1);
    noFill();
    rect(buttonX, adjustedY, buttonWidth, buttonHeight, 5);

    //i rossa
    push();
    translate(buttonX + 25, adjustedY + buttonHeight / 2);
    stroke(245, 40, 0);
    strokeWeight(1);
    noFill();
    circle(0, 0, 20);
    fill(245, 40, 0);
    noStroke();
    textSize(16);
    textAlign(CENTER, CENTER);
    text("i", 0, 0);
    pop();

    //testo nero
    fill(0);
    noStroke();
    textSize(16);
    textAlign(LEFT, CENTER);
    text("Learn More", buttonX + 50, adjustedY + buttonHeight / 2);
  }
}

//animazioni
function startAnimation() {
  isAnimating = true;
  animationStartTime = millis();
}

function getAnimationProgress() {
  if (!isAnimating) return 1.0;

  let elapsed = millis() - animationStartTime;
  let progress = constrain(elapsed / animationDuration, 0, 1);

  if (progress >= 1.0) {
    isAnimating = false;
  }

  return progress;
}

//correzione coordinate per malla equirettangolare
function fixAllCoordinates(coordStr, isLatitude = true) {
  if (!coordStr || coordStr === "" || coordStr === "0") {
    return isLatitude ? 0 : -30;
  }

  let str = coordStr.toString().trim();

  if (!isNaN(parseFloat(str)) && str.indexOf(" ") === -1) {
    let dotCount = (str.match(/\./g) || []).length;

    if (dotCount <= 1) {
      let num = parseFloat(str);

      if (isLatitude && Math.abs(num) > 90) {
        return fixDMS(str, isLatitude);
      }
      if (!isLatitude && Math.abs(num) > 180) {
        return fixDMS(str, isLatitude);
      }

      return num;
    }
  }

  return fixDMS(str, isLatitude);
}

function fixDMS(str, isLatitude) {
  let parts = str.split(".");
  parts = parts.filter((p) => p !== "");

  if (parts.length === 0) {
    return isLatitude ? 0 : -30;
  }

  let isNegative = false;
  if (parts[0].startsWith("-")) {
    isNegative = true;
    parts[0] = parts[0].substring(1);
  }

  if (parts.length >= 3) {
    let degrees = parseFloat(parts[0]) || 0;
    let minutes = parseFloat(parts[1]) || 0;
    let seconds = parseFloat(parts[2]) || 0;

    let decimal = degrees + minutes / 60 + seconds / 3600;
    decimal = isNegative ? -decimal : decimal;

    return decimal;
  }

  if (parts.length === 2) {
    let degrees = parseFloat(parts[0]) || 0;
    let minutes = parseFloat(parts[1]) || 0;

    if (minutes >= 60) {
      let combined = parseFloat(parts[0] + "." + parts[1]);
      return isNegative ? -combined : combined;
    }

    let decimal = degrees + minutes / 60;
    decimal = isNegative ? -decimal : decimal;

    return decimal;
  }

  if (parts.length === 1) {
    let num = parseFloat(parts[0]) || 0;

    if (isLatitude && Math.abs(num) > 90) {
      if (num > 90 && num < 1000) {
        let strNum = parts[0];
        if (strNum.length === 3) {
          num = parseFloat(strNum.substring(0, 2) + "." + strNum.substring(2));
        }
      }
    }

    return isNegative ? -num : num;
  }

  return isLatitude ? 0 : -30;
}

function applyKnownFixes(name, lat, lon, country) {
  if (country && country.includes("Italy")) {
    if (lat > 47 && lat < 60) {
      lat = lat - 12;
      lon = lon - 7;
    }
  }

  if (country && country.includes("Iceland")) {
    if (lat > 70) {
      lat = lat - 15;
    }
  }

  if (country && country.includes("Japan")) {
    if (name === "Fujisan" && lat > 40) {
      lat = 35.36;
      lon = 138.73;
    }
  }

  return { lat: lat, lon: lon };
}

function getUniversalCoordinates(latStr, lonStr, name = "", country = "") {
  let lat = fixAllCoordinates(latStr, true);
  let lon = fixAllCoordinates(lonStr, false);

  let fixed = applyKnownFixes(name, lat, lon, country);

  if (fixed.lat > 90) fixed.lat = 90;
  if (fixed.lat < -90) fixed.lat = -90;

  while (fixed.lon > 180) fixed.lon -= 360;
  while (fixed.lon < -180) fixed.lon += 360;

  return fixed;
}

//transizione learn more
function startTransitionToLearnMore() {
  const buttonRect = state.learnMoreButtonArea;

  transitionState.startX = buttonRect.x + buttonRect.width / 2;
  transitionState.startY = buttonRect.y + buttonRect.height / 2;
  transitionState.startRadius =
    Math.max(buttonRect.width, buttonRect.height) / 2;
  transitionState.targetRadius =
    dist(
      transitionState.startX,
      transitionState.startY,
      width / 2,
      height / 2,
    ) +
    Math.max(width, height) / 2;

  transitionState.active = true;
  transitionState.startTime = millis();
}

function updateTransition() {
  if (!transitionState.active) return;

  const elapsed = millis() - transitionState.startTime;
  const progress = constrain(elapsed / transitionState.duration, 0, 1);

  if (progress >= 1) {
    transitionState.active = false;
    window.location.href =
      "learn_more_detail.html?name=" +
      encodeURIComponent(selectedName) +
      "&year=" +
      selectedYear +
      "&number=" +
      selectedNumber;
  }
}

function drawTransition() {
  if (!transitionState.active) return;

  const elapsed = millis() - transitionState.startTime;
  const progress = constrain(elapsed / transitionState.duration, 0, 1);

  const currentRadius = lerp(
    transitionState.startRadius,
    transitionState.targetRadius,
    progress,
  );

  push();

  fill(chartMainColor);
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

//interazioni mouse
function mousePressed() {
  if (transitionState.active) return;

  //bottone x back in basso
  if (
    state.navBackArea &&
    mouseX > state.navBackArea.x &&
    mouseX < state.navBackArea.x + state.navBackArea.width &&
    mouseY > state.navBackArea.y &&
    mouseY < state.navBackArea.y + state.navBackArea.height
  ) {
    window.location.href = "overview.html";
    return;
  }

  //bottone back in alto
  if (mouseX > 15 && mouseX < 105 && mouseY > 15 && mouseY < 45) {
    window.location.href = "overview.html";
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

  //learn more
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

  if (eruptions.length <= 1) return;

  //nav anni
  let margin = 82;
  let y = 230;

  textSize(48);
  let leftArrowWidth = textWidth("<");
  let framePadding = 20;
  let frameHeight = 50;
  let leftFrameX = margin - framePadding;
  let leftFrameY = y - frameHeight / 2;

  textSize(72);
  let yearWidth = textWidth(formatYear(selectedYear));
  let yearX = margin + leftArrowWidth + 40;

  textSize(48);
  let rightArrowWidth = textWidth(">");
  let rightFrameX = yearX + yearWidth + 40 - framePadding;

  //freccia sx
  if (
    mouseX > leftFrameX &&
    mouseX < leftFrameX + leftArrowWidth + framePadding * 2 &&
    mouseY > leftFrameY &&
    mouseY < leftFrameY + frameHeight
  ) {
    if (currentIndex > 0) {
      currentIndex--;
    } else {
      currentIndex = eruptions.length - 1;
    }
    updateCurrentEruption();
    return;
  }

  //freccia dx
  if (
    mouseX > rightFrameX &&
    mouseX < rightFrameX + rightArrowWidth + framePadding * 2 &&
    mouseY > leftFrameY &&
    mouseY < leftFrameY + frameHeight
  ) {
    if (currentIndex < eruptions.length - 1) {
      currentIndex++;
    } else {
      currentIndex = 0;
    }
    updateCurrentEruption();
    return;
  }
}

function updateCurrentEruption() {
  selectedYear = eruptions[currentIndex].year;
  selectedNumber = eruptions[currentIndex].number;
  startAnimation();

  loadVolcanoImageAsync();
  updateChartData();
}

function updateCursor() {
  let isOverButton = false;
  hoveredArrow = null;
  hoveredLearnMore = false;

  if (transitionState.active) {
    cursor(ARROW);
    return;
  }

  //hover <back navbar
  if (
    state.navBackArea &&
    mouseX > state.navBackArea.x &&
    mouseX < state.navBackArea.x + state.navBackArea.width &&
    mouseY > state.navBackArea.y &&
    mouseY < state.navBackArea.y + state.navBackArea.height
  ) {
    isOverButton = true;
  }

  //bottone <back
  if (mouseX > 15 && mouseX < 105 && mouseY > 15 && mouseY < 45) {
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

  //learn more
  if (
    state.learnMoreButtonArea &&
    mouseX > state.learnMoreButtonArea.x &&
    mouseX < state.learnMoreButtonArea.x + state.learnMoreButtonArea.width &&
    mouseY > state.learnMoreButtonArea.y &&
    mouseY < state.learnMoreButtonArea.y + state.learnMoreButtonArea.height
  ) {
    isOverButton = true;
    hoveredLearnMore = true;
  }

  //navigazione frecce
  if (eruptions.length > 1) {
    let margin = 82;
    let y = 230;

    textSize(48);
    let leftArrowWidth = textWidth("<");
    let framePadding = 20;
    let frameHeight = 50;
    let leftFrameX = margin - framePadding;
    let leftFrameY = y - frameHeight / 2;

    textSize(72);
    let yearWidth = textWidth(formatYear(selectedYear));
    let yearX = margin + leftArrowWidth + 40;

    textSize(48);
    let rightArrowWidth = textWidth(">");
    let rightFrameX = yearX + yearWidth + 40 - framePadding;

    //freccia sx
    if (
      mouseX > leftFrameX &&
      mouseX < leftFrameX + leftArrowWidth + framePadding * 2 &&
      mouseY > leftFrameY &&
      mouseY < leftFrameY + frameHeight
    ) {
      isOverButton = true;
      hoveredArrow = "left";
    }

    //freccia dx
    if (
      mouseX > rightFrameX &&
      mouseX < rightFrameX + rightArrowWidth + framePadding * 2 &&
      mouseY > leftFrameY &&
      mouseY < leftFrameY + frameHeight
    ) {
      isOverButton = true;
      hoveredArrow = "right";
    }
  }

  cursor(isOverButton ? HAND : ARROW);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  applyResponsiveScaling();
}