import { Driver, driver, DriveStep } from "driver.js";
import { loadEvent, selectEvent, selectFile } from "./files-load";
import { hideDialog, showDialog } from "./utils";
import { resetView } from "./display";

export interface TutorialHooks {
  openPanel?: (id: string) => void;
  focusTool?: (tool: string) => void;
  highlightCanvasObject?: (id: number) => void;
  unhighlightAll?: () => void;
  sendAnalytics?: (event: string, payload?: any) => void;
}

export function startTutorial(key: "basics" | "controls" | "analysis") {
  if (!(key in availableTutorials)) {
    console.error("Invalid tutorial key:", key);
    throw new Error("Invalid tutorial key");
  }
  //detect language
  const lang = localStorage.getItem("language") || navigator.language || "en";
  const availableLanguages: { [key: string]: { [key: string]: [string, string] } } = {
    en: enStepTexts[key],
    de: deStepTexts[key],
  };
  if (!availableLanguages[lang]) {
    window.alert(`No tutorial translation for language ${lang}, falling back to English`);
  }

  const stepTexts = availableLanguages[lang] || availableLanguages["en"];
  const tutorialSteps = availableTutorials[key](stepTexts);

  const driverObj = driver({
    animate: false,
    showProgress: true,
    allowClose: false,
    overlayOpacity: 0.4,
    showButtons: ["next", "previous", "close"],
    nextBtnText: "<i class='fa fa-arrow-right'></i>",
    prevBtnText: "<i class='fa fa-arrow-left'></i>",
    doneBtnText: "<i class='fa fa-check'></i>",
    steps: tutorialSteps,
    disableActiveInteraction: true,
    allowKeyboardControl: false,
    onDestroyed: () => {
      //reload the page to reset the state
      window.location.reload();
    },
  });
  driverObj.drive();
}

const enStepTexts: { [key: string]: { [key: string]: [string, string] } } = {
  basics: {
    welcome: ["Welcome", "This short guided tour highlights how to use the event-display and its main features."],
    canvas: [
      "Canvas",
      "This is the 3D canvas. The detector's E-CAL barrel is shown here. You can rotate, pan, and zoom the view using your mouse or touchpad. <br><i class='fas fa-edit' style='color: blue;'></i> Try it out!",
    ],
    zoom: ["Zoom in and out", "Use this button to zoom in and out of the 3D view."],
    resetView: ["Reset View", "Use this button to reset the view to the initial state."],
    views: [
      "Different Views",
      "Use this button to switch between different views of the detector. Initially the 3D view is shown, but you can also switch to 2D projections. <br><i class='fas fa-edit' style='color: blue;'></i> Try it out!",
    ],
    open: [
      "Open an Event",
      "Here, you can open event files. You can also drag and drop a file into the display area to open it.",
    ],
    selectExampleFile: [
      "Select Example File",
      "You have the choice of loading web files or your local files. For this tutorial, we will load the file 'Hto4l_120-130GeV.ig' from the web.",
    ],
    loadedEvent: [
      "Loaded Event",
      "The event has been loaded. You can see the track and calorimeter hits in the detector. Different colors represent different particle types.",
    ],
    eventName: [
      "Event's Path and Number",
      "The path of the currently loaded event with its index in the curretly loaded file are shown here.",
    ],
    selectingTracks: [
      "Selecting Tracks",
      "You can click on tracks to select them. The track will turn white if selected. <br><i class='fas fa-edit' style='color: blue;'></i> Try selecting the <strong>four red tracks</strong> outside of the E-CAL barrel in this event.",
    ],
    invariantMass: [
      "Getting the invariant mass",
      "By pressing <kbd>M</kbd> the invariant mass of all selected tracks is calculated <br><i class='fas fa-edit' style='color: blue;'></i> Try it out! Notice anything special about the mass ;)",
    ],
    additionalTools: [
      "More tools",
      "Here you can find additional tools, including animated view, screenshot, importing detector models and more. Also the settings menu is located here. Explore the different options you have!",
    ],
    controlMenu:[
      "Many more controls",
      "Here you can find additional controls for the event display, including options for customizing the view and analyzing the data. A seperate tutorial for the control menu is available in the help section. Check it out!",
    ],
    end: [
      "End of Tutorial",
      "With this tutorial, you have learned the basics of using the event display. Feel free to explore the other two tutorials on the control menu and analysis! Clicking <i class='fa fa-check'></i> will reset the event display.",
    ],
  },
  controls: {},
  analysis: {},
};

const deStepTexts: { [key: string]: { [key: string]: [string, string] } } = {
  basics: {
    welcome: ["Willkommen", "Diese kurze geführte Tour zeigt die Hauptfunktionen des Event-Displays."],
    canvas: [
      "Canvas",
      "Dies ist die 3D-Leinwand. Der E-CAL-Barrel des Detektors wird hier angezeigt. Du kannst die Ansicht mit der Maus oder dem Touchpad drehen, schwenken und zoomen. <br><i class='fas fa-edit' style='color: blue;'></i> Probiere es aus!",
    ],
    zoom: ["Rein- und Rauszoomen", "Verwende diese Schaltfläche, um in die 3D-Ansicht hinein- und herauszuzoomen."],
    resetView: [
      "Ansicht zurücksetzen",
      "Verwende diese Schaltfläche, um die Ansicht auf den Anfangszustand zurückzusetzen.",
    ],
    views: [
      "Verschiedene Ansichten",
      "Verwende diese Schaltfläche, um zwischen verschiedenen Ansichten des Detektors zu wechseln. Anfangs wird die 3D-Ansicht angezeigt, aber du kannst auch zu 2D-Projektionen wechseln. <br><i class='fas fa-edit' style='color: blue;'></i> Probiere es aus!",
    ],
    open: [
      "Ereignis öffnen",
      "Hier kannst du Ereignisdateien öffnen. Du kannst auch eine Datei in den Anzeigebereich ziehen und dort ablegen, um sie zu öffnen.",
    ],
    selectExampleFile: [
      "Beispieldatei auswählen",
      "Du hast die Wahl, Webdateien oder deine lokalen Dateien zu laden. Für dieses Tutorial laden wir die Datei 'Hto4l_120-130GeV.ig' aus dem Web.",
    ],
    loadedEvent: [
      "Geladenes Ereignis",
      "Das Ereignis wurde geladen. Du kannst die Spur und die Kalorimeter-Hits im Detektor sehen. Verschiedene Farben repräsentieren verschiedene Teilchentypen.",
    ],
    eventName: [
      "Pfad und Nummer des Ereignisses",
      "Der Pfad des aktuell geladenen Ereignisses mit seinem Index in der aktuell geladenen Datei wird hier angezeigt.",
    ],
    selectingTracks: [
      "Spuren auswählen",
      "Du kannst auf Spuren klicken, um sie auszuwählen. Die Spur wird weiß, wenn sie ausgewählt ist. <br><i class='fas fa-edit' style='color: blue;'></i> Versuche, die <strong>vier roten Spuren</strong> außerhalb des E-CAL-Barrels in diesem Ereignis auszuwählen.",
    ],
    invariantMass: [
      "Berechnung der invarianten Masse",
      "Durch Drücken von <kbd>M</kbd> wird die invariante Masse aller ausgewählten Spuren berechnet. <br><i class='fas fa-edit' style='color: blue;'></i> Probiere es aus! Fällt dir etwas Besonderes an der Masse auf ;)",
    ],
    additionalTools: [
      "Weitere Werkzeuge",
      "Hier findest du weitere Werkzeuge, darunter animierte Ansicht, Screenshot, Import von Detektormodellen und mehr. Auch das Einstellungsmenü befindet sich hier. Erkunde die verschiedenen Optionen, die du hast!",
    ],
    controlMenu:[
      "Viele weitere Steuerungen",
      "Hier findest du weitere Steuerungen für das Event-Display, darunter Optionen zur Anpassung der Ansicht und zur Analyse der Daten. Ein separates Tutorial für das Steuerungsmenü ist im Hilfebereich verfügbar. Schau es dir an!",
    ],
    end: [
      "Ende des Tutorials",
      "Mit diesem Tutorial hast du die Grundlagen der Verwendung des Event-Displays gelernt. Fühle dich frei, die anderen beiden Tutorials im Steuerungsmenü und in der Analyse zu erkunden! Ein Klick auf <i class='fa fa-check'></i> setzt das Event-Display zurück.",
    ],
  },
  controls: {},
  analysis: {},
};

const availableTutorials = {
  basics: (langMap: { [key: string]: [string, string] }): DriveStep[] => {
    return [
      {
        popover: {
          title: langMap["welcome"][0],
          description: langMap["welcome"][1],
        },
      },
      {
        element: "#js-display",
        popover: {
          title: langMap["canvas"][0],
          description: langMap["canvas"][1],
        },
        disableActiveInteraction: false,
      },
      {
        element: "#tutorial-zoom",
        popover: {
          title: langMap["zoom"][0],
          description: langMap["zoom"][1],
        },
      },
      {
        element: "#tutorial-reset-view",
        popover: {
          title: langMap["resetView"][0],
          description: langMap["resetView"][1],
        },
      },
      {
        element: "#tutorial-views",
        popover: {
          title: langMap["views"][0],
          description: langMap["views"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
            resetView();
            opts.driver.moveNext();
          },
        },
        disableActiveInteraction: false,
      },
      {
        element: "#tutorial-open",
        popover: {
          title: langMap["open"][0],
          description: langMap["open"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
            showDialog("open-files");
            opts.driver.moveNext();
          },
        },
      },
      {
        element: "#tutorial-files-modal",
        popover: {
          title: langMap["selectExampleFile"][0],
          description: langMap["selectExampleFile"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
            hideDialog("open-files");
            selectFile("./data/Hto4l_120-130GeV.ig")
              .then(() => {
                selectEvent(1);
                loadEvent();
                opts.driver.moveNext();
              })
              .catch((err) => {
                window.alert(`Error loading example file: ${err}`);
              });
          },
        },
      },
      {
        element: "#js-event-loaded",
        popover: {
          title: langMap["eventName"][0],
          description: langMap["eventName"][1],
        },
      },
      {
        element: "#js-display",
        popover: {
          title: langMap["loadedEvent"][0],
          description: langMap["loadedEvent"][1],
        },
        disableActiveInteraction: false,
      },
      {
        element: "#js-display",
        popover: {
          title: langMap["selectingTracks"][0],
          description: langMap["selectingTracks"][1],
        },
        disableActiveInteraction: false,
      },
      {
        element: "#js-display",
        popover: {
          title: langMap["invariantMass"][0],
          description: langMap["invariantMass"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
            hideDialog("invariant-mass-modal");
            opts.driver.moveNext();
          },
        },
        disableActiveInteraction: false,
      },
      {
        element: "#js-secondary-toolbar",
        popover: {
          title: langMap["additionalTools"][0],
          description: langMap["additionalTools"][1],
        },
      },
      {
        element: "#js-treegui",
        popover: {
          title: langMap["controlMenu"][0],
          description: langMap["controlMenu"][1],
        },
      },
      {
        popover: {
          title: langMap["end"][0],
          description: langMap["end"][1],
        },
      },
    ];
  },
  controls: (_langMap: { [key: string]: [string, string] }): DriveStep[] => {
    return [];
  },
  analysis: (_langMap: { [key: string]: [string, string] }): DriveStep[] => {
    return [];
  },
};
