import Plotly from 'plotly.js';
import swal from 'sweetalert';
import { Object3D } from 'three';
import {ispy, analysis} from "./config";
import {Particle, Lepton, VisibleParticle, EventObject, EventSummary, FourVector} from "./ispy.interfaces";
import * as utils from "./utils"

analysis.checkCurrentSelection = function(): void {
    let [text, symbol] = getCurrentSelectionMessage();
    swal({text: text, title: "Selection Results", icon: symbol, buttons: false, timer: 3000} as SweetAlert.Settings);
    if (symbol == "warning") return;
    const nSelected = ispy.subfoldersReduced["Selection"].find(e => e.property == "nSelected");
    if (nSelected) {
        nSelected.setValue(analysis.getPassingEvents().length);
    }
    const firstSelected = ispy.subfoldersReduced["Selection"].find(e => e.property == "firstSelected");
    if (firstSelected) {
        firstSelected.setValue(
            analysis.getPassingEvents().map(e => Number(e) + 1).slice(0, 5).join(", ")
        );
    }
}

analysis.getSceneObjects = function(): { [key: string]: string } {
	return [
            ...(ispy.scenes?.["3D"]?.getObjectByName('Physics')?.children.map(o => o.name) || []),
            ...(ispy.scenes?.["3D"]?.getObjectByName('Tracking')?.children.map(o => o.name) || [])
        ].reduce((dic: { [key: string]: string }, o) => {
			dic[o.replace(/^(?:PAT|PF)?(.*?)_V\d$/, '$1')] = o;
			return dic;
		}, {});
}

analysis.getSelectionResults = function(): void {
    let event_stats = document.getElementById('event-statistics');
    if (! event_stats) {
        return;
    }
    if (analysis.file_events_summary == undefined) {
        event_stats.innerHTML = "No event file is loaded!";
        return;
    }
    event_stats.innerHTML = "Something should be here!";

    let masses = getMassesArray();
    var m_hist = createHistogramData([...masses.m.values()], 0, 200, 20);
    var mt_hist = createHistogramData([...masses.mt.values()], 0, 200, 20);
    Plotly.newPlot("m-hist", [m_hist as Plotly.Data]);
    // Plotly.newPlot("mt-hist", [mt_hist]); // TODO enable this when transverse mass is implemented
    return;
}

analysis.getSelectionCuts = function(): { [key: string]: number } {
    var cuts: { [key: string]: number } = {};
    ispy.subfoldersReduced["Selection"].forEach(e => {
        if (["function", "string"].includes(typeof(e.getValue()))) return;
        cuts[e.property] = e.getValue();
    });
    return cuts
}

// Get the passing events in the current file
analysis.getPassingEvents = function(): string[] {
    if (!utils.getCurrentEvent()) {
        return [];
    }
    var passing_events: string[] = [];
    for (let index of analysis.file_events_summary.keys()) {
        if (checkIfEventPassing(index)) {
            passing_events.push(index);
        }
    }

    return passing_events;
}

// Get CSV of the passing events
analysis.createCSV = function() { // TODO: enable transverse mass
    var masses = getMassesArray();
    //     var csv = "data:text/csv;charset=utf-8,Event Index,Invariant Mass,Transverse Mass\r\n";
    var csv = "data:text/csv;charset=utf-8,Event Index,Invariant Mass\r\n";
    masses.m.forEach((m, index) => {
        // csv += index + "," + m + "," + masses.mt.get(index) + "\r\n";
        csv += index + "," + m + "\r\n";
    });
    var encodedUri = encodeURI(csv);
    window.open(encodedUri);

    return csv;
}
//
// Get the needed information of all events in the current file
//
analysis.buildFileSummary = function() {

    let event: EventObject;
    let event_summary: utils.EventCollection;
    let analysisBtn = document.getElementById("analysis_btn");
    if (!analysisBtn) {
        analysisBtn = document.createElement("button");
    }

    $('#loading').modal('hide');
    $('#building').modal('show');
    try {
	
    // get the event data
    event_summary = new utils.EventCollection(ispy.event_list, ispy.ig_data);

    // store the event summary as a global variable
    analysis.file_events_summary = event_summary.events;
    
    // enable the analysis button
    (analysisBtn as HTMLButtonElement).disabled = false;

    } catch(err) {
    
    (analysisBtn as HTMLButtonElement).disabled = true;

    // create and display an error message
    let error_msg = "Error encountered building the file summary: \n    " + err;
    error_msg += "\nThe event display will work however the full analysis will remain disabled.";
    error_msg += "\nChecking the selection for single events will still work.";
	alert(error_msg);
    }

    $('#building').modal('hide');
    $('#loading').modal('show');

};


//
// Helper functions for the selection
//

let getSelectionParticles = function(
    event_index: string
): {index: string, parts: Map<string, any>, met: any} {
    var results = {index: event_index.toString(), parts: new Map(), met: {}};
    var tmp_parts = new Map();
    let summary = analysis.file_events_summary.get(event_index.toString());
    if (!summary) {
        return results;
    }
    let selection = analysis.getSelectionCuts();
    let pt_cut = selection["pt"];
    let filteredSelection = Object.keys(selection).filter(sel => {
        if (["charge", "pt"].includes(sel)) return false;
        if (selection[sel] == 0 || selection[sel] == -1) return false;
        return true;
    });
    filteredSelection.forEach(key => {
        if (key == "minMETs" || key == "maxMETs") {
            results["met"] = summary.met;
            return;
        }
        if (summary.particles.has(key)) {
            let tmp = summary.particles.get(key) || [];
            if (key == "GsfElectrons" || key == "TrackerMuons") {
                tmp = tmp.filter(part => part["pt"] >= pt_cut);
            }
            tmp_parts.set(key, tmp);
        }
    });
    results["parts"] = tmp_parts;
    return results;
}

let checkIfEventPassing: (event_index?: number | string) => boolean = function(
    event_index: number | string=-1
): boolean {
    if (!utils.getCurrentEvent()) {
        return false;
    }
    if (event_index == -1) {
        event_index = utils.getCurrentIndex();
    }
    event_index = event_index.toString();
    var pass: boolean = true;
    var cuts = analysis.getSelectionCuts();
    var summary = analysis.file_events_summary.get(event_index);

    if (!summary) {
        return false;
    }

    // Check the MET cuts
    pass &&= checkMinMET(summary.met, cuts["minMETs"]);
    pass &&= checkMaxMET(summary.met, cuts["maxMETs"]);
    if (!pass) return pass;

    for (let [name, part] of summary.particles) {
        if (cuts[name] == -1) continue;
        if (name == "TrackerMuons" || name == "GsfElectrons") {
            pass &&= checkCharge(part as Lepton[], cuts["charge"]);
            if (!pass) break;
            part = getPtPassingLeptons(part as Lepton[], cuts["pt"]);
        }
        if (part.length != cuts[name]) {
            pass &&= false;
            break;
        }
    };
    return pass;
}

// Helper functions to check the selection
let checkMinMET = function(
    met: Particle,
    cut: number,
): boolean {
    if (cut == -1) return true;
    return met["pt"] >= cut;
}

let checkMaxMET = function(
    met: Particle,
    cut: number,
): boolean {
    if (cut == -1) return true;
    return met["pt"] <= cut;
}

let checkCharge = function(
    leptons: Lepton[],
    cut: number,
): boolean {
    if (cut == undefined) return true;
    let chargeSum = 0;
    leptons.forEach(lepton => {
        chargeSum += lepton["charge"];
    });
    return Math.sign(chargeSum) == cut;
}

let getPtPassingLeptons = function(
    leptons: Lepton[],
    cut: number,
): Lepton[] {
    return leptons.filter(lepton => lepton["pt"] >= cut)
}

let sumFourVectors = function(
    particles: Map<string, VisibleParticle[]>,
): FourVector {
    if (particles.size < 1) {
        return {E: 0, px: 0, py: 0, pz: 0};
    }
    let sumPx: number, sumPy: number, sumPz: number, sumE: number;
    sumPx = sumPy = sumPz = sumE = 0;

    particles.forEach((group, key) => {
        group.forEach((val) => {
            sumPx += val.px;
            sumPy += val.py;
            sumPz += val.pz;
            sumE += val.E;
        });
    });

    return {E: sumE, px: sumPx, py: sumPy, pz: sumPz};
}


// Calculate the invariant mass of a list of particles
let getInvariantMass = function(
    sumVector: FourVector,
): number {

    let m = 0;
    let sumPx: number, sumPy: number, sumPz: number, sumE: number;
    sumPx = sumVector.px;
    sumPy = sumVector.py;
    sumPz = sumVector.pz;
    sumE = sumVector.E;

    m = sumE*sumE;
    m -= (sumPx*sumPx + sumPy*sumPy + sumPz*sumPz);
    m = Math.sqrt(m);
    
    return m;
}

// Calculate the transverse mass of a list of particles
let getTransverseMass = function(
    sumVector: FourVector,
    met: {px: number, py: number, [key: string]: any},
): number {

    let m = 0;
    let m1 = getInvariantMass(sumVector);

    let metE2 = met.px * met.px + met.py * met.py;
    let Et2 = sumVector.E * sumVector.E - sumVector.pz * sumVector.pz;

    m = m1 * m1;
    m += 2 * (metE2 * Et2 - sumVector.px * met.px - sumVector.py * met.py);
    m = Math.sqrt(m);

    return m;
}

let createHistogram = function(
    array: number[],
    start: number,
    end: number,
    bins: number,
): number[] {
    // Histogram the array to the range `start` to `end` with `bins` bins
    var hist: number[] = new Array(bins).fill(0);
    var binWidth: number = (end - start) / bins;
    array.forEach((val) => {
        if (val <= start) {
            hist[0]++;
            return;
        }
        if (val >= end) {
            hist[bins-1]++;
            return;
        }
        let bin = Math.floor(val/binWidth);
        hist[bin]++;
    });
    return hist;    
}

let createHistogramData = function(
    array: number[],
    start: number,
    end: number,
    bins: number,
): {x: number[], type: string, nbinsx: number} {
    // Create the data for a histogram of the array
    return {
        x:array,
        type:'histogram',
        nbinsx:bins,
    };
}

let getMassesArray = function(): {m: Map<number, number>, mt: Map<number, number>} {
    var masses = new Map();
    var massesT = new Map();
    let particles = analysis.getPassingEvents().map(i => {
        return getSelectionParticles(i);
    });
    for (let value of particles) {
        let sumVector = sumFourVectors(value.parts);
        masses.set(value.index, getInvariantMass(sumVector));
        if (value.met) {
            massesT.set(value.index, getTransverseMass(sumVector, value.met));
        }
    }
    return {m: masses, mt: massesT};
}

let getCurrentSelectionMessage = function(): [string, string] {
    var pass = checkIfEventPassing();
    if (pass == undefined) {
        return ["No event file is loaded!", "warning"];
    }
    var html = "This Event ";
    html += (pass ? "passes" : "does not pass") + " the selection!";
    let symbol = pass ? "success" : "error";
    return [html, symbol];
}