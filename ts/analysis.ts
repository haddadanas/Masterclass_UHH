import swal from "sweetalert";

import { ispy, analysis } from "./config.js";
import { getCurrentEvent, EventCollection, getCurrentIndex, assertDefined, downloadData, hideDialog, showDialog, toggleButton } from "./utils.js";
import { Particle, FourVector, MET } from "./ispy.interfaces.js";

// Helper functions to check the selection
/**
 * Checks if the minimum MET cut is passed.
 * @param met The MET object to check.
 * @param cut The minimum cut value.
 * @returns True if the cut is passed, false otherwise.
 */
function checkMinMET(met: MET, cut: number): boolean {
  if (cut === -1) return true;
  return met["Et"] >= cut;
}

/**
 * Checks if the maximum MET cut is passed.
 * @param met The MET object to check.
 * @param cut The maximum cut value.
 * @returns True if the cut is passed, false otherwise.
 */
function checkMaxMET(met: MET, cut: number): boolean {
  if (cut === -1) return true;
  return met["Et"] <= cut;
}

/**
 * Checks if the charge cut is passed.
 * @param leptons The leptons to check.
 * @param cut The charge cut value.
 * @returns True if the cut is passed, false otherwise.
 */
function checkCharge(leptons: Particle[], cut: number): boolean {
  if (cut === undefined) return true;
  if (leptons.length === 0) return true;
  let chargeSum = 0;
  leptons.forEach((lepton) => {
    chargeSum += lepton["charge"];
  });
  return Math.sign(chargeSum) === cut;
}

/**
 * Filters the leptons based on the transverse momentum (pt) cut.
 * @param leptons The leptons to check.
 * @param cut The pt cut value.
 * @returns The leptons that pass the pt cut.
 */
function getPtPassingLeptons(leptons: Particle[], cut: number): Particle[] {
  return leptons.filter((lepton) => lepton["pt"] >= cut);
}

/**
 * Sums up a list of particles' four-vectors.
 * @param particles The particles to sum.
 * @returns The sum of the four-vectors.
 */
function sumFourVectors(particles: Map<string, Particle[]>): FourVector {
  if (particles.size < 1) {
    return { E: 0, px: 0, py: 0, pz: 0 };
  }
  let sumPx: number, sumPy: number, sumPz: number, sumE: number;
  sumPx = sumPy = sumPz = sumE = 0;

  particles.forEach((group) => {
    group.forEach((val) => {
      sumPx += val.px;
      sumPy += val.py;
      sumPz += val.pz;
      sumE += val.E;
    });
  });

  return { E: sumE, px: sumPx, py: sumPy, pz: sumPz };
}

/**
 * Checks if the event is passing the selection criteria.
 * @param event_index The index of the event to check.
 * @returns True if the event is passing, false otherwise.
 */
function checkIfEventPassing(event_index: number | string = -1): boolean | undefined {
  if (!getCurrentEvent()) {
    return undefined;
  }
  if (event_index === -1) {
    event_index = getCurrentIndex();
  }
  event_index = event_index.toString();
  const cuts = getSelectionCuts();
  const summary = analysis.file_events_summary.get(event_index);

  if (!summary) {
    return false;
  }

  // Check the MET cuts
  let pass: boolean = checkMinMET(summary.met, cuts["minMETs"]) && checkMaxMET(summary.met, cuts["maxMETs"]);
  if (!pass) return false;

  for (let [name, part] of summary.particles) {
    if (cuts[name] === -1) continue;
    if (name === "TrackerMuons" || name === "GsfElectrons") {
      part = getPtPassingLeptons(part, cuts["pt"]);
      pass = checkCharge(part, cuts["charge"]);
      if (!pass) break;
    }
    if (part.length !== cuts[name]) {
      pass = false;
      break;
    }
  }
  return pass;
}

/**
 * Gets the content of the selection message for the current event.
 * @returns A message indicating whether the current event passes the selection criteria.
 */
function getCurrentSelectionMessage(): [string, string] {
  const pass = checkIfEventPassing();
  const numPassing = getPassingEvents().length;
  if (pass === undefined) {
    return ["No event file is loaded!", "error"];
  }
  let html = "This Event ";
  html += `${pass ? "passes" : "does not pass"} the selection!`;
  html += `\nThere are currently ${numPassing} events passing this selection.`;
  const symbol = pass ? "success" : "warning";
  return [html, symbol];
}

/**
 * Checks if the current selection passes the criteria and displays a message.
 * @returns void
 */
function checkCurrentSelection(): void {
  const [Msgtext, symbol] = getCurrentSelectionMessage();
  swal({ text: Msgtext, title: "Selection Results", icon: symbol, buttons: [false], timer: 3000 }); // TODO check if no buttons
  if (symbol === "error") return;
  const nSelected = ispy.subfolders["Selection"].find((e) => e.property === "nSelected");
  if (nSelected) {
    nSelected.setValue(getPassingEvents().length);
  }
  const firstSelected = ispy.subfolders["Selection"].find((e) => e.property === "firstSelected");
  if (firstSelected) {
    firstSelected.setValue(
      getPassingEvents()
        .map((e) => Number(e) + 1)
        .slice(0, 5)
        .join(", "),
    );
  }
}

/**
 * Gets the values of the selection fields.
 * @returns The current selection cuts.
 */
function getSelectionCuts(): { [key: string]: number } {
  const cuts: { [key: string]: number } = {};
  ispy.subfolders["Selection"].forEach((e) => {
    if (["function", "string"].includes(typeof e.getValue())) return;
    if ("checkbox" in e && !e.checkbox) {
      cuts[e.property] = -1;
      return;
    }
    cuts[e.property] = e.getValue();
  });
  return cuts;
}

/**
 * Gets an array of event indices that pass the selection criteria.
 * @returns An array of event indices that pass the selection criteria.
 */
function getPassingEvents(): string[] {
  if (!getCurrentEvent()) {
    return [];
  }
  const passing_events: string[] = [];
  for (const index of analysis.file_events_summary.keys()) {
    if (checkIfEventPassing(index)) {
      passing_events.push(index);
    }
  }

  return passing_events.sort((a, b) => Number(a) - Number(b));
}

/**
 * Builds a summary of the file events and enables the analysis button.
 */
function buildFileSummary(): void {
  let event_summary: EventCollection;

  hideDialog("loading");
  showDialog("building");

  try {
    assertDefined(ispy.ig_data, "No event data is loaded!");
    // get the event data
    event_summary = new EventCollection(ispy.event_list, ispy.ig_data);

    // store the event summary as a global variable
    analysis.file_events_summary = event_summary.events;

    // enable the analysis button
    toggleButton("js-csv-btn", true);
  } catch (err) {
    // create and display an error message
    let error_msg = `Error encountered building the file summary: \n${err}`;
    error_msg += "\nThe event display will work however the full analysis will remain disabled.";
    error_msg += "\nChecking the selection for single events will still work.";
    alert(error_msg);
  }

  hideDialog("building");
  showDialog("loading");
}

/**
 * Gets the selection particles for a specific event.
 * @param event_index The index of the event to get the particles for.
 * @returns The selection particles for the event.
 */
function getSelectionParticles(event_index: string): {
  index: string;
  parts: Map<string, Particle[]>;
  met: MET;
} {
  const results = { index: event_index.toString(), parts: new Map(), met: { px: 0, py: 0, Et: 0 } };
  const tmp_parts = new Map();
  const summary = analysis.file_events_summary.get(event_index.toString());
  if (!summary) {
    return results;
  }
  const selection = getSelectionCuts();
  const pt_cut = selection["pt"];
  const filteredSelection = ["TrackerMuons", "GsfElectrons", "Photons"].filter((sel) => {
    return !(selection[sel] === 0 || selection[sel] === -1);
  });
  results["met"] = summary.met;
  filteredSelection.forEach((key) => {
    if (summary.particles.has(key)) {
      let tmp = summary.particles.get(key) || [];
      if (key === "GsfElectrons" || key === "TrackerMuons") {
        tmp = tmp.filter((part) => part["pt"] >= pt_cut);
      }
      tmp_parts.set(key, tmp);
    }
  });
  results["parts"] = tmp_parts;
  return results;
}

/**
 * Calculates the invariant mass of a sum of four-vectors.
 * @param sumVector The sum of four-vectors.
 * @returns The invariant mass.
 */
function getInvariantMass(sumVector: FourVector): number {
  let mass = 0;
  const sumPx: number = sumVector.px;
  const sumPy: number = sumVector.py;
  const sumPz: number = sumVector.pz;
  const sumE: number = sumVector.E;

  mass = sumE * sumE;
  mass -= sumPx * sumPx + sumPy * sumPy + sumPz * sumPz;
  mass = Math.sqrt(mass);

  return mass;
}

/**
 * Calculates the transverse mass of a sum of four-vectors.
 * @param sumVector The sum of four-vectors.
 * @param met The missing transverse energy.
 * @returns The transverse mass.
 */
function getTransverseMass(sumVector: FourVector, met: MET): number {
  let transverseMass = 0;
  const invariantMass = getInvariantMass(sumVector);

  const Et = Math.sqrt(sumVector.E * sumVector.E - sumVector.pz * sumVector.pz);

  transverseMass = invariantMass * invariantMass;
  transverseMass += 2 * (Et * met.Et - sumVector.px * met.px - sumVector.py * met.py);
  transverseMass = Math.sqrt(transverseMass);

  return transverseMass;
}

/**
 * Gets the invariant and transverse masses for each event.
 * @returns An Array containing the invariant and transverse masses for each event.
 */
function getMassesArray(): { m: Map<number, number>; mt: Map<number, number> } {
  const masses = new Map();
  const massesT = new Map();
  const particles = getPassingEvents().map((i) => {
    return getSelectionParticles(i);
  });
  for (const value of particles) {
    const sumVector = sumFourVectors(value.parts);
    masses.set(value.index, getInvariantMass(sumVector));
    if (value.met) {
      massesT.set(value.index, getTransverseMass(sumVector, value.met));
    }
  }
  return { m: masses, mt: massesT };
}

/**
 * Creates a CSV file from the invariant and transverse masses.
 * @param category The category of the CSV file to create.
 * @returns The CSV data as a string.
 */
function createCSV(category: string): string {
  const file_name = ispy.file_name ? ispy.file_name.replace(/\.ig$/, "") : "";
  const masses = getMassesArray();
  let csv = "data:text/csv;charset=utf-8,Event Index,Invariant Mass,Transverse Mass\r\n";
  masses.m.forEach((m, index) => {
    const mt = masses.mt.get(index) || "";
    csv += `${index},${m},${mt}\r\n`;
  });
  const encodedUri = encodeURI(csv);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "");
  downloadData(encodedUri, `${category}_results_${file_name}_${timestamp}.csv`);

  return csv;
}


export {
  checkCurrentSelection,
  getSelectionCuts,
  getPassingEvents,
  createCSV,
  buildFileSummary,
  checkIfEventPassing,
  getSelectionParticles,
  checkMinMET,
  checkMaxMET,
  checkCharge,
  getPtPassingLeptons,
  sumFourVectors,
  getInvariantMass,
  getTransverseMass,
  getMassesArray,
  getCurrentSelectionMessage,
};
