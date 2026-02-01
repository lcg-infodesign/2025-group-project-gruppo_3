let imgs = [];

let names = [
  "Alice Comini",
  "Matilde Curino",
  "Greta Franco",
  "Carlo Galli",
  "Ilaria La Spada",
  "Annalisa Testaverde",
];

//ruoli di ognuno
let roles = [
  "Frontend Development, \nData Visualization & Map-making.",
  "Data Analysis & Visualization,\nIllustrations and Debugging.",
  "Frontend Development, \nIllustrations and Methodology. ",
  "Figma Mockups & Prototypes, \nResearch and Debugging.",
  "Web Development, \nData Visualization & Animations.",
  "Web Support, Learn More \nand Call Management.",
];

//configurazioni x visualizzare correttamente ogni img
let displayConfigs = [];

function preload() {
  imgs[0] = loadImage("../assets/alice.png");
  imgs[1] = loadImage("../assets/mati.png");
  imgs[2] = loadImage("../assets/greta.png");
  imgs[3] = loadImage("../assets/carlo.png");
  imgs[4] = loadImage("../assets/ilaria.png");
  imgs[5] = loadImage("../assets/annalisa.png");
}

function setup() {
  //calcola quanto deve essere alta la pagina
  const contentHeight = calculateContentHeight();

  //poi crea l'area di disegno con le dimensioni corrette
  let canvas = createCanvas(window.innerWidth, contentHeight);
  canvas.parent("sketch-container");

  //stili per posizionare correttamente l'area di disegno
  canvas.style("display", "block");
  canvas.style("position", "relative");
  canvas.style("width", "100%");
  canvas.style("height", contentHeight + "px");

  //imposta il font e l'allineamento del testo
  textFont("Helvetica");
  textAlign(CENTER);

  //configura come mostrare ogni immagine
  setupImageConfigs();
}

//qui definiamo come mostrare ogni foto nel cerchio
function setupImageConfigs() {
  displayConfigs = [
    { scale: 1.15, offsetY: -15, offsetX: 0 }, // Alice
    { scale: 1.0, offsetY: 0, offsetX: 0 }, // Matilde
    { scale: 1.15, offsetY: 0, offsetX: 0 }, // Greta
    { scale: 0.9, offsetY: 0, offsetX: 0 }, // Carlo
    { scale: 1.4, offsetY: 0, offsetX: 0 }, // Ilaria
    { scale: 1.15, offsetY: 0, offsetX: 0 }, // Annalisa
  ];
}

//funzione che disegna tutto sullo schermo
function draw() {
  //sfondo bianco
  background(255);
  //titoli pagina
  drawTitles();
  //membri del team
  drawMembers();
}

//disegna il titolo e la descrizione della pagina
function drawTitles() {
  textAlign(CENTER);

  //titolo principale
  fill(0);
  textSize(48);
  textStyle(BOLD);
  text("TEAM'S PROJECT", width / 2, 100);

  //sottotitolo in rosso
  fill("#FF2B00");
  textSize(28);
  text("THE PEOPLE WHO MADE IT POSSIBLE.", width / 2, 150);

  //descrizione del team (generale)
  fill(50);
  textSize(16);
  textStyle(NORMAL);
  let teamDescription =
    "Hi! We are second-year students of Communication Design from Section C2\nof the Computer Graphics Laboratory course at Politecnico di Milano.";
  text(teamDescription, width / 2, 200);
}

//disegnamo ora tutti i membri del team in una griglia
function drawMembers() {
  //layout fisso per desktop
  let cols = 3;
  let colW = 320;
  let rowH = 380;
  let startY = 280;
  let circleRadius = 100;

  //calcola dove iniziare a disegnare per centrare la griglia
  let totalW = cols * colW;
  let startX = (width - totalW) / 2;

  //per disegnare ogni membro del team
  for (let i = 0; i < names.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);

    let x = startX + col * colW;
    let y = startY + row * rowH;

    let centerX = x + colW / 2;
    let imgCenterY = y + circleRadius + 20;

    //ora disegna il cerchio bianco dove andrà la foto
    fill(255);
    noStroke();
    ellipse(centerX, imgCenterY, circleRadius * 2, circleRadius * 2);

    //poi metti l'immagine del membro del team
    if (imgs[i]) {
      push();
      imageMode(CENTER);

      //creiamo una maschera circolare per l'immagine
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.arc(centerX, imgCenterY, circleRadius, 0, TWO_PI);
      drawingContext.clip();

      //poi calcoliamo le dimensioni per far entrare l'immagine nel cerchio
      let img = imgs[i];
      let config = displayConfigs[i] || { scale: 1.0, offsetY: 0, offsetX: 0 };

      let imgRatio = img.width / img.height;
      let targetDiameter = circleRadius * 2;

      let displayW, displayH;

      //e ora adattiamo l'immagine al cerchio
      if (imgRatio > 1) {
        displayW = targetDiameter * 1.1 * config.scale;
        displayH = displayW / imgRatio;
      } else {
        displayH = targetDiameter * 1.1 * config.scale;
        displayW = displayH * imgRatio;
      }

      //poi disegnamo l'immagine centrata nel cerchio
      image(
        img,
        centerX + config.offsetX,
        imgCenterY + config.offsetY,
        displayW,
        displayH,
      );

      drawingContext.restore();
      pop();

      //aggiunge un sottilissimo contorno al cerchio
      stroke(240);
      strokeWeight(0.5);
      noFill();
      ellipse(centerX, imgCenterY, circleRadius * 2, circleRadius * 2);
    }

    //mettiamo il nome
    fill(0);
    textSize(18);
    textStyle(BOLD);
    let nameY = y + circleRadius * 2 + 60;
    text(names[i], centerX, nameY);

    //descriviamo il ruolo
    fill(100);
    textSize(14);
    textStyle(NORMAL);
    let roleY = nameY + 25;
    text(roles[i], centerX, roleY);
  }
}

//funzione che calcola quanto deve essere alta tutta la pagina
function calculateContentHeight() {
  const titleHeight = 250;
  const membersHeight = calculateMembersHeight();
  const footerSpace = 100;

  return titleHeight + membersHeight + footerSpace;
}

//e poi calcola quanto spazio serve per mostrare tutti i membri
function calculateMembersHeight() {
  let cols = 3;
  let rowH = 380;

  const rows = Math.ceil(6 / cols);
  return rows * rowH + 50;
}