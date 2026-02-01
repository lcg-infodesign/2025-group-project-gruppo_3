let lines = [];
const numLines = 100;
const noiseScale = 0.008;
let timeOffset = 0;
const noiseSpeed = 0.003;
let canvas;
let animationInterval;
let isScrolling = false;
let scrollTimeout;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.id("p5-background-canvas");
  canvas.position(0, 0);
  canvas.style("z-index", "-1");
  canvas.style("pointer-events", "none");

  canvas.elt.style.imageRendering = "optimizeSpeed";
  drawingContext.imageSmoothingEnabled = false;

  //100 linee ogni 8 px
  for (let i = 0; i < numLines; i++) {
    lines[i] = [];
    for (let x = 0; x < width; x += 8) {
      lines[i].push(x);
    }
  }

  noLoop();

  animationInterval = setInterval(drawFrame, 33);

  window.addEventListener("scroll", handleScroll, { passive: true });
}

function handleScroll() {
  //scrolling
  isScrolling = true;

  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }

  //animazione dopo lo scrolling
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isScrolling = false;
    if (!animationInterval) {
      animationInterval = setInterval(drawFrame, 33);
    }
  }, 150);
}

function drawFrame() {
  if (!isScrolling) {
    draw();
  }
}

function draw() {
  background(255, 255, 255);

  timeOffset += noiseSpeed;

  //disegna linee
  for (let i = 0; i < lines.length; i++) {
    stroke("#ff2a00ff");
    strokeWeight(2); //
    noFill();

    beginShape();
    for (let j = 0; j < lines[i].length; j++) {
      const x = lines[i][j];
      const yBase = map(i, 0, lines.length - 1, height * 0.1, height * 0.9);

      const noiseVal = noise(
        x * noiseScale,
        yBase * noiseScale,
        timeOffset + i * 0.05,
      );

      const yOffset = map(noiseVal, 0, 1, -40, 50);
      const y = yBase + yOffset;

      vertex(x, y);
    }
    endShape();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  //rigenera linee
  for (let i = 0; i < numLines; i++) {
    lines[i] = [];
    for (let x = 0; x < width; x += 8) {
      lines[i].push(x);
    }
  }
}

window.addEventListener("beforeunload", function () {
  if (animationInterval) {
    clearInterval(animationInterval);
  }
  window.removeEventListener("scroll", handleScroll);
});