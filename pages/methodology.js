const sections = [
  {
    id: 1,
    title: "METHODOLOGY",
    subtitle: "HOW WE BUILT OUR VISUAL STORY.",
    imageId: "methodology-image-1",
    buttonText: "Explore the dataset",
    buttonLink:
      "https://www.ngdc.noaa.gov/hazel/view/hazards/volcano/event-data",
  },
  {
    id: 2,
    title: "OVERVIEW VISUALIZATION",
    subtitle: "HOW WE VISUALIZE ERUPTION DATA.",
    imageId: "methodology-image-2",
    buttonText: "Explore all eruptions",
    buttonLink: "overview.html",
  },
  {
    id: 3,
    title: "DATA INTERPRETATION",
    subtitle: "HOW WE INTERPRET AND PRESENT DATA.",
    imageId: "methodology-image-3",
    buttonText: "Explore the detail graphs",
    buttonLink: "detail.html?name=Vesuvius&year=1631&impact=12",
  },
];

//variabili globali
let currentSectionId = 1;
let textScrollArea = null;
let scrollHint = null;
let isScrolling = false;
let scrollTimeout = null;
let p5Sketch = null;

//inizializza la pagina quando è pronta
document.addEventListener("DOMContentLoaded", function () {
  initializePage();
  setTimeout(initializeStaticP5, 100);
});

//funzione principale che prepara la pagina
function initializePage() {
  //trova gli elementi importanti della pagina
  textScrollArea = document.querySelector(".text-content");
  scrollHint = document.getElementById("text-scroll-hint");

  //attiva tutti i controlli della pagina
  setupEventListeners();

  //configura il pulsante principale
  setupLearnMoreButton();

  //mostra la prima sezione
  updateSection(currentSectionId);
}

//serve per creare lo sfondo animato con pallini fissi
function initializeStaticP5() {
  if (typeof p5 === "undefined") {
    return;
  }

  //ferma eventuali animazioni precedenti
  stopAllP5Animations();

  //crea una nuova animazione statica
  p5Sketch = new p5((p) => {
    let staticDots = [];
    let canvasElement = null;

    //questo configura il canvas per l'animazione
    p.setup = function () {
      const header = document.querySelector("header");
      const footer = document.getElementById("html-footer");

      if (!header || !footer) {
        return;
      }

      //calcola l'altezza corretta per il canvas
      const headerHeight = header.offsetHeight;
      const footerTop = footer.offsetTop;
      const canvasHeight = footerTop - headerHeight;

      //crea il canvas con le dimensioni calcolate
      canvasElement = p.createCanvas(window.innerWidth, canvasHeight);

      //posiziona il canvas dietro il contenuto
      canvasElement.position(0, headerHeight);
      canvasElement.style("position", "fixed");
      canvasElement.style("z-index", "-100");
      canvasElement.style("pointer-events", "none");

      //crea i pallini per lo sfondo
      createStaticDots(p);

      //disegna l'animazione una sola volta
      drawOnce(p);

      //ferma l'animazione automatica
      p.noLoop();

      //impedisce che l'animazione riparta
      Object.defineProperty(p, "draw", {
        value: function () {
          return;
        },
        writable: false,
        configurable: false,
      });
    };

    //questa funzione crea i pallini statici per lo sfondo
    function createStaticDots(p) {
      staticDots = [];
      const dotCount = 45;

      for (let i = 0; i < dotCount; i++) {
        staticDots.push({
          x: p.random(p.width),
          y: p.random(p.height),
          size: p.random(1.5, 4),
          alpha: p.random(20, 35),
        });
      }
    }

    //questa funzione disegna i pallini sullo schermo
    function drawOnce(p) {
      p.clear();
      p.push();
      p.noStroke();

      for (let dot of staticDots) {
        p.fill(255, 43, 0, dot.alpha);
        p.ellipse(dot.x, dot.y, dot.size, dot.size);
      }

      p.pop();
    }

    //ridimensiona il canvas quando cambia la finestra
    p.windowResized = function () {
      if (!canvasElement) return;

      const header = document.querySelector("header");
      const footer = document.getElementById("html-footer");

      if (!header || !footer) return;

      const headerHeight = header.offsetHeight;
      const footerTop = footer.offsetTop;
      const canvasHeight = footerTop - headerHeight;

      p.resizeCanvas(window.innerWidth, canvasHeight);
      canvasElement.style("top", headerHeight + "px");

      createStaticDots(p);
      drawOnce(p);
    };

    //poi controlla che il canvas resti nella posizione corretta
    window.addEventListener("scroll", function () {
      if (canvasElement) {
        const rect = canvasElement.elt.getBoundingClientRect();

        if (rect.top !== parseInt(canvasElement.style("top"))) {
          const header = document.querySelector("header");
          if (header) {
            canvasElement.style("top", header.offsetHeight + "px");
          }
        }
      }
    });
  });
}

//ferma tutte le animazioni precedenti
function stopAllP5Animations() {
  if (window.p5 && window.p5.instance) {
    try {
      window.p5.instance.noLoop();
    } catch (e) {}
  }

  const originalRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = function (callback) {
    return 0;
  };

  const intervals = [];
  const originalSetInterval = window.setInterval;
  window.setInterval = function (callback, delay) {
    if (delay < 1000) {
      return 0;
    }
    return originalSetInterval.apply(this, arguments);
  };
}

//aggiunge stili CSS per bloccare animazioni indesiderate
function addAnimationBlockingCSS() {
  const style = document.createElement("style");
  style.textContent = `
        canvas {
            animation: none;
            transition: none;
            transform: none;
            will-change: auto;
        }
        
        .p5Canvas {
            position: fixed;
            top: 90px;
            left: 0;
            width: 100vw;
            z-index: -100;
            pointer-events: none;
        }
        
        * {
            backface-visibility: hidden;
            perspective: 1000px;
        }
    `;
  document.head.appendChild(style);
}

//attiva tutti i controlli interattivi della pagina
function setupEventListeners() {
  if (textScrollArea) {
    textScrollArea.addEventListener("scroll", handleTextScroll);
  }

  if (scrollHint) {
    scrollHint.addEventListener("click", handleScrollHintClick);
  }

  document.querySelectorAll(".fixed-dot").forEach((dot) => {
    dot.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const sectionId = parseInt(this.getAttribute("data-section"));
      if (sectionId !== currentSectionId && !isScrolling) {
        scrollToSection(sectionId);
      }
    });
  });

  document.addEventListener("keydown", handleKeyDown);

  addAnimationBlockingCSS();
}

//configura il pulsante principale del learn more
function setupLearnMoreButton() {
  const button = document.getElementById("learn-more-btn");
  if (!button) return;

  const newButton = button.cloneNode(true);
  button.parentNode.replaceChild(newButton, button);

  newButton.addEventListener("click", function (e) {
    e.preventDefault();
    const section = sections.find((s) => s.id === currentSectionId);
    if (section) {
      if (section.buttonLink.includes("http")) {
        window.open(section.buttonLink, "_blank");
      } else {
        window.location.href = section.buttonLink;
      }
    }
  });
}

//questa funzione è per lo scroll nel pannello di testo
function handleTextScroll() {
  if (!textScrollArea || isScrolling) return;

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    const scrollTop = textScrollArea.scrollTop;
    const scrollHeight = textScrollArea.scrollHeight;
    const clientHeight = textScrollArea.clientHeight;

    const sectionHeight = (scrollHeight - clientHeight) / 3;
    let newSectionId = currentSectionId;

    if (scrollTop < sectionHeight + 150) {
      newSectionId = 1;
    } else if (scrollTop < sectionHeight * 2 + 150) {
      newSectionId = 2;
    } else {
      newSectionId = 3;
    }

    if (newSectionId !== currentSectionId) {
      updateSection(newSectionId);
    }
  }, 100);
}

//questa gestisce il click sulla freccia di scroll
function handleScrollHintClick() {
  if (isScrolling) return;

  if (currentSectionId === sections.length) {
    scrollToSection(1);
  } else {
    scrollToSection(currentSectionId + 1);
  }
}

//per scorrere alla sezione specificata
function scrollToSection(sectionId) {
  if (!textScrollArea || sectionId < 1 || sectionId > sections.length) return;

  isScrolling = true;

  const section = sections.find((s) => s.id === sectionId);
  if (!section) {
    isScrolling = false;
    return;
  }

  const scrollHeight = textScrollArea.scrollHeight;
  const clientHeight = textScrollArea.clientHeight;
  const maxScroll = scrollHeight - clientHeight;
  const sectionHeight = maxScroll / 3;

  let targetScroll;

  switch (sectionId) {
    case 1:
      targetScroll = 0 - 10;
      break;
    case 2:
      targetScroll = sectionHeight - 90;
      break;
    case 3:
      targetScroll = sectionHeight * 2 + 155;
      break;
    default:
      targetScroll = 0;
  }

  targetScroll = Math.min(maxScroll, targetScroll);

  updateSection(sectionId);

  textScrollArea.scrollTo({
    top: targetScroll,
    behavior: "smooth",
  });

  setTimeout(() => {
    isScrolling = false;
  }, 600);
}

//aggiorna tutti gli elementi della sezione corrente
function updateSection(sectionId) {
  currentSectionId = sectionId;
  const section = sections.find((s) => s.id === sectionId);

  if (!section) return;

  updateTitle(section.title, section.subtitle);
  updateImage(section.imageId);
  updateButton(section.buttonText, section.buttonLink);
  updateFixedDots(sectionId);
  updateScrollHint();
}

//cambia il titolo e sottotitolo della sezione
function updateTitle(title, subtitle) {
  const titleElement = document.getElementById("dynamic-title");
  const subtitleElement = document.getElementById("dynamic-subtitle");

  if (!titleElement || !subtitleElement) return;

  titleElement.classList.add("title-transition");
  subtitleElement.classList.add("title-transition");

  titleElement.textContent = title;
  subtitleElement.textContent = subtitle;

  setTimeout(() => {
    titleElement.classList.remove("title-transition");
    subtitleElement.classList.remove("title-transition");
  }, 400);
}

//cambia l'immagine della sezione per mettere quella relativa
function updateImage(imageId) {
  document.querySelectorAll(".methodology-image").forEach((img) => {
    img.classList.remove("active");
  });

  const currentImage = document.getElementById(imageId);
  if (currentImage) {
    currentImage.classList.add("active");
  }
}

//aggiorna il pulsante con testo e link corretti
function updateButton(buttonText, buttonLink) {
  const button = document.getElementById("learn-more-btn");
  if (!button) return;

  button.textContent = buttonText;

  const newButton = button.cloneNode(true);
  button.parentNode.replaceChild(newButton, button);

  newButton.addEventListener("click", function (e) {
    e.preventDefault();
    if (buttonLink.includes("http")) {
      window.open(buttonLink, "_blank");
    } else {
      window.location.href = buttonLink;
    }
  });
}

//aggiorna i pallini di navigazione laterali
function updateFixedDots(sectionId) {
  document.querySelectorAll(".fixed-dot").forEach((dot) => {
    const dotSectionId = parseInt(dot.getAttribute("data-section"));
    if (dotSectionId === sectionId) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

//aggiorna la freccia di scroll in base alla sezione
function updateScrollHint() {
  if (!scrollHint) return;

  if (currentSectionId === sections.length) {
    scrollHint.classList.add("flipped");
    scrollHint.title = "Torna all'inizio";
  } else {
    scrollHint.classList.remove("flipped");
    scrollHint.title = "Vai alla prossima sezione";
  }
}

//questa serve per gestire la navigazione da tastiera
function handleKeyDown(e) {
  switch (e.key) {
    case "ArrowDown":
    case "PageDown":
      e.preventDefault();
      if (currentSectionId < sections.length) {
        scrollToSection(currentSectionId + 1);
      } else {
        scrollToSection(1);
      }
      break;

    case "ArrowUp":
    case "PageUp":
      e.preventDefault();
      if (currentSectionId > 1) {
        scrollToSection(currentSectionId - 1);
      } else {
        scrollToSection(sections.length);
      }
      break;

    case "ArrowRight":
      e.preventDefault();
      if (currentSectionId < sections.length) {
        scrollToSection(currentSectionId + 1);
      }
      break;

    case "ArrowLeft":
      e.preventDefault();
      if (currentSectionId > 1) {
        scrollToSection(currentSectionId - 1);
      }
      break;

    case " ":
    case "Enter":
      e.preventDefault();
      if (currentSectionId < sections.length) {
        scrollToSection(currentSectionId + 1);
      } else {
        scrollToSection(1);
      }
      break;

    case "1":
      e.preventDefault();
      if (currentSectionId !== 1) {
        scrollToSection(1);
      }
      break;

    case "2":
      e.preventDefault();
      if (currentSectionId !== 2) {
        scrollToSection(2);
      }
      break;

    case "3":
      e.preventDefault();
      if (currentSectionId !== 3) {
        scrollToSection(3);
      }
      break;
  }
}

//espone le funzioni principali all'esterno
window.methodology = {
  scrollToSection,
  currentSection: () => currentSectionId,
};
