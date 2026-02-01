[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ScyD1Fym)

© CC-BY 4.0 Alice Comini, Matilde Curino, Greta Franco, Carlo Galli, Ilaria La Spada, Annalisa Testaverde.

Obiettivi di conoscenza: 

1. Impatto delle eruzioni vulcaniche: comprendere le conseguenze umane delle eruzioni vulcaniche più significative. Attraverso le visualizzazioni d'insieme e di dettaglio, è possibile individuare una scala di impatto che consente il confronto tra le eruzioni e dati specifici per ciascuna eruzione: morti, feriti, dispersi, case distrutte e danni economici (convertiti in dollari del 2026).

2. Distribuzione geografica e temporale: individuare i continenti maggiormente interessati da eruzioni catastrofiche nel tempo. Guardando la visione d’insieme è possibile comprendere quali aree sono più colpite dalle eruzioni vulcaniche.

3. Classificazione dei vulcani: riconoscere la tipologia di vulcano coinvolta in ogni singola eruzione, grazie a illustrazioni e brevi descrizioni. 

Dataset: Significant Volcanic Eruption Database 
https://www.ngdc.noaa.gov/hazel/view/hazards/volcano/event-data 
I dati sono stati raccolti dalla National Centers for Environmental Information (NCEI), parte della NOAA (National Oceanic and Atmospheric Administration, Stati Uniti), in collaborazione con NGDC (National Geophysical Data Center) e il Global Volcanism Program della Smithsonian Institution. 

Delle 897 eruzioni presenti nel dataset originale, ne sono state selezionate 724, limitando le visualizzazioni alle sole eruzioni che hanno causato un impatto in almeno una delle seguenti categorie: morti, feriti, dispersi, case distrutte o danni economici. Il sito si focalizza, quindi, esclusivamente sulle eruzioni con conseguenze dirette sull’uomo. 

Tra le 34 categorie del dataset, ne sono state selezionate 19: 
Year, Month, Day, Name, Location, Country, Latitude, Longitude, Type, Deaths, Death Description, Missing, Missing Description, Injuries, Injuries Description, Damage ($Mil), Damage Description, Houses Destroyed, Houses Destroyed Description.

Nelle righe del dataset, le categorie relative alle “Description” di morti, dispersi, feriti, case distrutte e danni economici presentano valori numerici da 0 a 4. A ciascun valore corrisponde un range di impatto: 

per le prime 4 categorie (Death, Missing, Injuries e House Destroyed) 

0= None;  1= 1- 50;  2= 51-100;  3= 101-1000;  4= 1000+

per la categoria Demage 

0= None;  1= -1 mil;  2= 1-5 mil;  3= 5-24 mil;  4= 25+ mil

Nel dataset i danni economici sono stati convertiti dagli autori in dollari americani degli anni 90 (anno in cui sono state compilate le prime righe del dataset). 
Per avere un’idea più consapevole dei danni economici causati dalle eruzioni abbiamo convertito questi valori in dollari americani del 2026. 

0= None;  1= -2.4 mil;  2= 2.4-12 mil;  3= 12-57.6 mil;  4= 60+ mil

Abbiamo inoltre generato un nuovo parametro chiamato "Impact", calcolato come la somma dei valori delle categorie "Description". Questo indice permette di determinare l’impatto complessivo di ogni singola eruzione, utilizzato nella visualizzazione d’insieme per confrontare le eruzioni su una scala da 1 a 16 (impatto massimo causato dall’eruzione del Tambora nel 1815).

A supporto delle pagine d’insieme e di dettaglio abbiamo creato due pagine “Learn more” che spiegano nel dettaglio le visualizzazioni e guidano nella navigazione. 

Nonostante le nostre visualizzazioni si concentrino sulle eruzioni piuttosto che sul singolo vulcano, abbiamo voluto visualizzare la posizione dei vulcani coinvolti con una mappa equirettangolare. È stato utile il supporto di DeepSeek, che ha permesso di individuare e correggere gli errori nelle coordinate (Latitude e Longitude) presenti nel dataset originale, in modo che ne risultasse una visualizzazione quanto più fedele alla realtà sulla mappa.  Strumenti AI come DeepSeek e ChatGPT sono stati utilizzati anche per la gestione dello scrolling, per le animazioni complesse e per la risoluzione di bug legati alla resa visiva dei dati.

Il lavoro è stato così suddiviso tra i membri del gruppo:

Alice Comini: codice, visualizzazione della mappa, visualizzazione dei dati 

Matilde Curino: analisi e rielaborazione del dataset, illustrazioni, debugging 

Greta Franco: codice, illustrazioni, descrizione metodologia 

Carlo Galli: prototipazione e mockup su Figma, codice, debugging 

Ilaria La Spada: codice, visualizzazione dei dati, animazioni

Annalisa Testaverde: codice, pagine “Learn More”, suddivisione dei compiti


