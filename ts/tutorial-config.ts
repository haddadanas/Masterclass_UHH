import { Driver, DriveStep } from "driver.js";

import { resetView } from "./display.js";
import { hideDialog, showDialog, toggleCollapse, toggleExpand } from "./utils.js";
import { selectFile, selectEvent, loadEvent } from "./files-load.js";

type keyTypes = "basics" | "controls" | "analysis";
const enStepTexts: { [key in keyTypes]: { [key: string]: [string, string] } } = {
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
    controlMenu: [
      "Many more controls",
      "Here you can find additional controls for the event display, including options for customizing the view and analyzing the data. A seperate tutorial for the control menu is available in the help section. Check it out!",
    ],
    end: [
      "End of Tutorial",
      "With this tutorial, you have learned the basics of using the event display. Feel free to explore the other two tutorials on the control menu and analysis! Clicking <i class='fa fa-check'></i> will reset the event display.",
    ],
  },
  controls: {
    welcome: ["Welcome", "This tutorial will guide you through the control menu features."],
    detector: ["Detector Controls", "Here you can find controls related to the detector display."],
    detectorEdits: [
      "Customizing the Detector",
      "You can make various edits to the detector display using these controls. This includes toggeling visibility of different detector components, changing colors, and more.",
    ],
    loadEvent: ["Loading an Event", "For the next steps, we load an example event."],
    eventInfo: [
      "Event Information",
      "Here you can find helpful information, including the MET of the current event, number of selected tracks, and you can activate track information to see the pt and charge of displayed Tracks.<br><i class='fas fa-edit' style='color: blue;'></i> Try activating the track information now!",
    ],
    display: [
      "Track Information",
      "Hover over the muons track to find out the charge of the muon and its measured pT.",
    ],
    showHide: [
      "Show/Hide Objects",
      "From the Show/Hide section, you can toggle the visibility of different objects in the event display, such as photons, jets, and more. By default only muons and electrons are shown.",
    ],
    cut: [
      "Applying Visual Cuts",
      "From this menu, you can apply a pT cut to visible tracks as well as an energy cut to displayed jets. This helps to declutter the view and focus on high-energy objects.<br><i class='fas fa-edit' style='color: blue;'></i> Try setting the pT cut to 40 GeV and see what happens!",
    ],
    selection: [
      "Selection Tools",
      "This part is essential for running the automated selection. More information about this can be found in the analysis tutorial.",
    ],
    saveSettings: [
      "Saving Settings",
      "When switching between different events, the controls are reset to their default values. To ensure your custom settings persist, you can activate this button.",
    ],
    end: [
      "End of Tutorial",
      "You have reached the end of the control menu tutorial. Feel free to explore the analysis tutorial next! Clicking <i class='fa fa-check'></i> will reset the event display.",
    ],
  },
  analysis: {
    wilcome: [
      "Analysis Tutorial",
      "Now we want to find the Higgs boson. For this an automated event selection is used. Again we load an example event first.",
    ],
    selectionTools: [
      "Selection Tools",
      "First, we need to set the event selection criteria. This is done in the selection folder of the control menu.",
    ],
    trySelection: [
      "Test an Empty Selection",
      "The starting point of the criteria is an empty selection, meaning we don't require any cuts. <br><i class='fas fa-edit' style='color: blue;'></i> Try pressing the `Check Selection` button and see how many events are selected!",
    ],
    selectedEvents: [
      "Selected Events",
      "In this example all events are selected. The last two files in the folder show the number of selected events as well as the indices of the first five events that passed the selection.",
    ],
    helpSelection: [
      "Information",
      "For information about each selection criterion, click on the corresponding <kbd>?</kbd> right next to it.",
    ],
    muonSelection: [
      "Finding Muons",
      "Now, we want to find events containing 2 Muons. <br><i class='fas fa-edit' style='color: blue;'></i> Enable the muon selection by clicking the checkbox and then insert the number of required muons!",
    ],
    tryMuonSelection: [
      "Finding Muons",
      "Everytime you change the selection criteria, you can test how many events are selected by pressing the `Check Selection` button. <br><i class='fas fa-edit' style='color: blue;'></i> Try it out!",
    ],
    goingToSelectedEvents: [
      "Switching Events",
      "The current event does not pass the selection anymore, but we see that the 1st and 4th one passes. We can either manually select one of these events or use the `Go to Next Selected Event` button to automatically switch to the next selected event. <br><i class='fas fa-edit' style='color: blue;'></i> Try it out!",
    ],
    csvExport: [
      "CSV-Export",
      "Once you have a good selection of events, you can export the invariant masses of the events as a CSV file. Click the `Export` button, choose what selection you implemented and download the file.",
    ],
    hist: [
      "Collecting the files",
      "By repeating this process for the different channels, you will end up with one file for each channel. A mass histogram is created from these files. For the next step ask your instructor for guidance.",
    ],
    end: [
      "End of the Tutorial",
      "You have reached the end of the control menu tutorial. Feel free to explore the analysis tutorial next! Clicking <i class='fa fa-check'></i> will reset the event display.",
    ],
  },
};

const deStepTexts: { [key in keyTypes]: { [key: string]: [string, string] } } = {
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
    controlMenu: [
      "Viele weitere Steuerungen",
      "Hier findest du weitere Steuerungen für das Event-Display, darunter Optionen zur Anpassung der Ansicht und zur Analyse der Daten. Ein separates Tutorial für das Steuerungsmenü ist im Hilfebereich verfügbar. Schau es dir an!",
    ],
    end: [
      "Ende des Tutorials",
      "Mit diesem Tutorial hast du die Grundlagen der Verwendung des Event-Displays gelernt. Fühle dich frei, die anderen beiden Tutorials im Steuerungsmenü und in der Analyse zu erkunden! Ein Klick auf <i class='fa fa-check'></i> setzt das Event-Display zurück.",
    ],
  },
  controls: {
    welcome: ["Willkommen", "Dieses Tutorial führt dich durch die Funktionen des Steuerungsmenüs."],
    detector: ["Detektor", "Hier findest du Steuerungen im Zusammenhang mit der Detektoranzeige."],
    detectorEdits: [
      "Detektoranpassungen",
      "Hier kannst du Änderungen an den Detektoreinstellungen vornehmen, einschließlich der Anpassung von Geometrie und Materialeigenschaften.",
    ],
    loadEvent: ["Ereignis laden", "Für die nächsten Schritte laden wir ein Beispielereignis."],
    eventInfo: [
      "Ereignisinformationen",
      "Hier findest du Informationen über das aktuell geladene Ereignis, einschließlich seiner Eigenschaften und der enthaltenen Teilchen.",
    ],
    display: [
      "Trackinformationen",
      "Bewege den Mauszeiger über die Myon-Spur, um die Ladung des Myons und seinen gemessenen pT zu erfahren.",
    ],
    showHide: [
      "Objekte anzeigen/ausblenden",
      "Über dieses Menü kannst du die Sichtbarkeit verschiedener Objekte in der Ereignisanzeige umschalten, wie z.B. Photonen, Jets und mehr. Standardmäßig werden nur Myonen und Elektronen angezeigt.",
    ],
    cut: [
      "Objekte selektieren",
      "Mit dieser Funktion kannst du ausgewählte Objekte aus der Ereignisanzeige entfernen. Dies ist nützlich, um die Anzeige zu bereinigen oder sich auf bestimmte Objekte zu konzentrieren.",
    ],
    selection: [
      "Auswahlwerkzeuge",
      "Dieser Abschnitt ist wichtig für die Durchführung der automatisierten Auswahl. Weitere Informationen hierzu findest du im Analysetutorial.",
    ],
    saveSettings: [
      "Einstellungen speichern",
      "Beim Wechseln zwischen verschiedenen Ereignissen werden die Steuerungen auf ihre Standardwerte zurückgesetzt. Um sicherzustellen, dass deine benutzerdefinierten Einstellungen erhalten bleiben, kannst du diese Schaltfläche aktivieren.",
    ],
    end: [
      "Ende des Tutorials",
      "Du hast das Ende des Steuerungsmenü-Tutorials erreicht. Fühle dich frei, als nächstes das Analysetutorial zu erkunden! Ein Klick auf <i class='fa fa-check'></i> setzt das Event-Display zurück.",
    ],
  },
  analysis: {
    welcome: [
      "Analysis Tutorial",
      "Jetzt wollen wir das Higgs Boson finden. Für diesen Zweck gibt es eine automatisierte Auswahl von Events. Wir laden wieder einen Beispiel-Event.",
    ],
    selectionTools: [
      "Auswahlwerkzeuge",
      "Zuerst müssen wir die Auswahlkriterien für die Ereignisse festlegen. Dies geschieht im Auswahlordner des Steuerungsmenüs.",
    ],
    trySelection: [
      "Leere Selektion testen",
      "Der Ausgangspunkt der Kriterien ist eine leere Auswahl, was bedeutet, dass wir keine Schnitte benötigen. <br><i class='fas fa-edit' style='color: blue;'></i> Versuche, die Schaltfläche `Check Selection` zu drücken und zu sehen, wie viele Ereignisse ausgewählt sind!",
    ],
    selectedEvents: [
      "Ausgewählte Ereignisse",
      "In diesem Beispiel sind alle Ereignisse ausgewählt. Die letzten beiden Dateien im Ordner zeigen die Anzahl der ausgewählten Ereignisse sowie die Indizes der ersten fünf Ereignisse, die die Auswahl bestanden haben.",
    ],
    helpSelection: [
      "Information",
      "Für Informationen zu jedem Auswahlkriterium klicke auf das entsprechende <kbd>?</kbd> direkt daneben.",
    ],
    muonSelection: [
      "Myonen Finden",
      "Jetzt wollen wir Ereignisse finden, die 2 Myonen enthalten. <br><i class='fas fa-edit' style='color: blue;'></i> Aktiviere die Myonenauswahl, indem du das Kontrollkästchen anklickst und dann die Anzahl der benötigten Myonen eingibst!",
    ],
    tryMuonSelection: [
      "Myonen Finden",
      "Jedes Mal, wenn du die Auswahlkriterien änderst, kannst du testen, wie viele Ereignisse ausgewählt sind, indem du die Schaltfläche `Check Selection` drückst. <br><i class='fas fa-edit' style='color: blue;'></i> Probiere es aus!",
    ],
    goingToSelectedEvents: [
      "Ereignisse wechseln",
      "Das aktuelle Ereignis besteht die Auswahl nicht mehr, aber wir sehen, dass das 1. und 4. Ereignis bestehen. Wir können entweder manuell eines dieser Ereignisse auswählen oder die Schaltfläche `Go to Next Selected Event` verwenden, um automatisch zum nächsten ausgewählten Ereignis zu wechseln. <br><i class='fas fa-edit' style='color: blue;'></i> Probiere es aus!",
    ],
    csvExport: [
      "CSV-Export",
      "Sobald du eine gute Auswahl an Ereignissen hast, kannst du die invarianten Massen der Ereignisse als CSV-Datei exportieren. Klicke auf die Schaltfläche `Export`, wähle aus, welche Auswahl du implementiert hast, und lade die Datei herunter.",
    ],
    hist: [
      "Dateien sammeln",
      "Indem du diesen Prozess für die verschiedenen Kanäle wiederholst, erhältst du eine Datei für jeden Kanal. Aus diesen Dateien wird ein Mass histogramm erstellt. Für den nächsten Schritt frage deinen Ausbilder um Hilfe.",
    ],
    end: [
      "Ende des Tutorials",
      "Du hast das Ende des Tutorials zum Steuerungsmenü erreicht. Fühle dich frei, das nächste Tutorial zur Analyse zu erkunden! Ein Klick auf <i class='fa fa-check'></i> setzt die Ereignisanzeige zurück.",
    ],
  },
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
  controls: (langMap: { [key: string]: [string, string] }): DriveStep[] => {
    return [
      {
        element: "#js-treegui",
        popover: {
          title: langMap["welcome"][0],
          description: langMap["welcome"][1],
        },
      },
      {
        element: "#detector-folder",
        popover: {
          title: langMap["detectorEdits"][0],
          description: langMap["detectorEdits"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
            const detectorFolder = toggleExpand("Detector");
            detectorFolder.folders[0].open();
            opts.driver.moveNext();
          },
        },
      },
      {
        element: "#detector-folder .lil-children > .lil-gui",
        popover: {
          title: langMap["detectorEdits"][0],
          description: langMap["detectorEdits"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
            toggleCollapse("Detector");
            toggleExpand("info");
            opts.driver.moveNext();
          },
        },
        disableActiveInteraction: false,
      },
      {
        popover: {
          title: langMap["loadEvent"][0],
          description: langMap["loadEvent"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
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
        element: "#info-folder",
        popover: {
          title: langMap["eventInfo"][0],
          description: langMap["eventInfo"][1],
        },
        disableActiveInteraction: false,
      },
      {
        element: "#js-display",
        popover: {
          title: langMap["display"][0],
          description: langMap["display"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
            toggleCollapse("info");
            toggleExpand("showFolder");
            opts.driver.moveNext();
          },
        },
        disableActiveInteraction: false,
      },
      {
        element: "#showFolder-folder",
        popover: {
          title: langMap["showHide"][0],
          description: langMap["showHide"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
            toggleCollapse("showFolder");
            toggleExpand("momentumCut");
            opts.driver.moveNext();
          },
        },
        disableActiveInteraction: false,
      },
      {
        element: "#momentumCut-folder",
        popover: {
          title: langMap["cut"][0],
          description: langMap["cut"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
            toggleCollapse("momentumCut");
            opts.driver.moveNext();
          },
        },
        disableActiveInteraction: false,
      },
      {
        element: "#selection-folder",
        popover: {
          title: langMap["selection"][0],
          description: langMap["selection"][1],
        },
      },
      {
        element: "#save-setting-controller",
        popover: {
          title: langMap["saveSettings"][0],
          description: langMap["saveSettings"][1],
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
  analysis: (langMap: { [key: string]: [string, string] }): DriveStep[] => {
    return [
      {
        popover: {
          title: langMap["wilcome"][0],
          description: langMap["wilcome"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
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
        element: "#selection-folder",
        popover: {
          title: langMap["selectionTools"][0],
          description: langMap["selectionTools"][1],
          onNextClick: (_el, _step, opts: { driver: Driver }) => {
            toggleExpand("selection");
            opts.driver.moveNext();
          },
        },
      },
      {
        element: "#selection-folder",
        popover: {
          title: langMap["trySelection"][0],
          description: langMap["trySelection"][1],
        },
        disableActiveInteraction: false,
      },
      {
        element: "#selection-folder",
        popover: {
          title: langMap["selectedEvents"][0],
          description: langMap["selectedEvents"][1],
        },
      },
      {
        element: "#selection-folder",
        popover: {
          title: langMap["helpSelection"][0],
          description: langMap["helpSelection"][1],
        },
        disableActiveInteraction: false,
      },
      {
        element: "#selection-folder .lil-number",
        popover: {
          title: langMap["muonSelection"][0],
          description: langMap["muonSelection"][1],
        },
        disableActiveInteraction: false,
      },
      {
        element: "#selection-folder",
        popover: {
          title: langMap["tryMuonSelection"][0],
          description: langMap["tryMuonSelection"][1],
        },
        disableActiveInteraction: false,
      },
      {
        element: "#tutorial-sel-next-prev",
        popover: {
          title: langMap["goingToSelectedEvents"][0],
          description: langMap["goingToSelectedEvents"][1],
        },
        disableActiveInteraction: false,
      },
      {
        element: "#tutorial-csv",
        popover: {
          title: langMap["csvExport"][0],
          description: langMap["csvExport"][1],
        },
      },
      {
        popover: {
          title: langMap["hist"][0],
          description: langMap["hist"][1],
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
};

function getTutorialSteps(tutorial: string, lang: string): DriveStep[] {
  if (!["basics", "controls", "analysis"].includes(tutorial)) {
    console.error("Invalid tutorial key:", tutorial);
    throw new Error("Invalid tutorial key");
  }
  const key = tutorial as keyTypes;
  const availableLanguages: { [key: string]: { [key: string]: [string, string] } } = {
    en: enStepTexts[key],
    de: deStepTexts[key],
  };
  if (!availableLanguages[lang]) {
    window.alert(`No tutorial translation for language ${lang}, falling back to English`);
  }
  const textSteps = availableLanguages[lang] || availableLanguages["en"];
  return availableTutorials[key](textSteps);
}

export { getTutorialSteps };
