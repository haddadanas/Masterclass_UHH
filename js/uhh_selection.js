analysis.checkCurrentSelection = function() {
    let [text, symbol] = getCurrentSelectionMessage();
    swal(text, {title: "Selection Results", icon: symbol, buttons: false, timer: 3000});
    if (symbol == "warning") return;
    ispy.subfoldersReduced["Selection"].find(e => e.property == "nSelected").setValue(analysis.getPassingEvents().length);
    ispy.subfoldersReduced["Selection"].find(e => e.property == "firstSelected").setValue(
        analysis.getPassingEvents().map(e => Number(e) + 1).slice(0, 5).join(", ")
    );
}

analysis.getSceneObjects = function() {
	return [
			...ispy.scenes["3D"].getObjectByName('Physics').children.map(o => o.name),
			...ispy.scenes["3D"].getObjectByName('Tracking').children.map(o => o.name)
		].reduce((dic, o) => {
			dic[o.replace(/^(?:PAT|PF)?(.*?)_V\d$/, '$1')] = o;
			return dic;
		}, {});
}

analysis.getSelectionResults = function() {
    if (analysis.file_events_summary == undefined) {
        document.getElementById('event-statistics').innerHTML = "No event file is loaded!";
        return;
    }
    document.getElementById('event-statistics').innerHTML = "Something should be here!";

    masses = getMassesArray();
    var m_hist = createHistogramData(masses.m.values().toArray(), 0, 200, 20);
    var mt_hist = createHistogramData(masses.mt.values().toArray(), 0, 200, 20);
    Plotly.newPlot("m-hist", [m_hist]);
    // Plotly.newPlot("mt-hist", [mt_hist]); // TODO enable this when transverse mass is implemented
    return;
}

analysis.getSelectionCuts = function() {
    var cuts = {};
    ispy.subfoldersReduced["Selection"].forEach(e => {
        if (["function", "string"].includes(typeof(e.getValue()))) return;
        cuts[e.property] = e.getValue();
    });
    return cuts
}

// Get the passing events in the current file
analysis.getPassingEvents = function() {
    if (!ispy.current_event) {
        return;
    }
    var passing_events = [];
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

    let event;
    let event_summary = new Map();

    $('#loading').modal('hide');
    $('#building').modal('show');
    try {
	
    // get the event data
    ispy.event_list.forEach((event_path, event_index) => {
        try {
        event = JSON.parse(ispy.cleanupData(ispy.ig_data.file(event_path).asText()));
        event_summary.set(event_index.toString(), getEventsSummary(event));
    } catch(err) {
        alert("Error encountered parsing event " + (event_index + 1) + ": " + err);
        alert("The event will be skipped in the analysis.");
    }
    });

    // store the event summary as a global variable
    analysis.file_events_summary = event_summary;
    
    // enable the analysis button
    document.getElementById("analysis_btn").disabled = false;

    } catch(err) {
    
    document.getElementById("analysis_btn").disabled = true;

    // create and display an error message
    let error_msg = "Error encountered building the file summary: \n    " + err;
    error_msg += "\nThe event display will work however the full analysis will remain disabled.";
    error_msg += "\nChecking the selection for single events will still work.";
	alert(error_msg);
    }

    $('#building').modal('hide');
    $('#loading').modal('show');

};

function getEventsSummary(event_json) {
    let part_names = ["TrackerMuons", "GsfElectrons", "Photons", "METs"];
    let keys = Object.keys(event_json.Collections)
    var map = part_names.map(name => keys.filter(k => k.includes(name)).reduce((x, y) => x > y ? x: y));
    var summary = new Map();
    map.forEach((collec) => {

        let type = event_json.Types[collec];
        let key = collec.replace(/^(?:PAT|PF)?(.*?)_V\d$/, '$1');
        if (collec.includes("MET")) {
            summary.set(key, ispy.getMetInformation(type, event_json.Collections[collec][0]));
            return;
        }
        let tmp = new Array();
        event_json.Collections[collec].forEach((part) => {
            tmp.push(ispy.getFourVector(collec, type, part));
        });
        summary.set(key, tmp);
    })
    return summary;
}

//
// Helper functions for the selection
//

function getSelectionParticles(event_index) {
    var results = {index: event_index};
    var parts = new Map();
    let summary = analysis.file_events_summary.get(String(event_index));
    selection = analysis.getSelectionCuts();
    let pt_cut = selection["pt"];
    selection = Object.keys(selection).filter(sel => {
        if (["charge", "pt"].includes(sel)) return false;
        if (selection[sel] == 0 || selection[sel] == -1) return false;
        return true;
    });
    selection.forEach(key => {
        if (key == "minMETs" || key == "maxMETs") {
            results["met"] = summary.get("METs");
            return;
        }
        if (summary.has(key)) {
            tmp = summary.get(key);
            if (key == "GsfElectrons" || key == "TrackerMuons") {
                tmp = tmp.filter(part => part["pt"] >= pt_cut);
            }
            parts.set(key, tmp);
        }
    });
    results["parts"] = parts;
    return results;
}

function checkIfEventPassing(event_index=-1) {
    if (!ispy.current_event) {
        return;
    }
    if (event_index == -1) {
        event_index = ispy.event_index;
    }

    var pass = true;
    var cuts = analysis.getSelectionCuts();
    var particles = analysis.file_events_summary.get(String(event_index));

    for (let [name, part] of particles) {
        if (name == "METs") {
            pass &&= checkMinMET(part, cuts["minMETs"]);
            pass &&= checkMaxMET(part, cuts["maxMETs"]);
            if (!pass) break;
        }
        if (cuts[name] == -1) continue;
        if (name == "TrackerMuons" || name == "GsfElectrons") {
            pass &&= checkCharge(part, cuts["charge"]);
            if (!pass) break;
            part = getPtPassingLeptons(part, cuts["pt"]);
        }
        if (part.length != cuts[name]) {
            pass &&= false;
            break;
        }
    };
    return pass;
}

// Helper functions to check the selection
function checkMinMET(met, cut) {
    if (cut == -1) return true;
    return met["pt"] >= cut;
}

function checkMaxMET(met, cut) {
    if (cut == -1) return true;
    return met["pt"] <= cut;
}

function checkCharge(leptons, cut) {
    if (cut == undefined) return true;
    let chargeSum = 0;
    leptons.forEach(lepton => {
        chargeSum += lepton["charge"];
    });
    return Math.sign(chargeSum) == cut;
}

function getPtPassingLeptons(leptons, cut) {
    return leptons.filter(lepton => lepton["pt"] >= cut)
}

function sumFourVectors(particles) {
    if (particles.length < 1) {
        return -1;
    }
    let sumPx, sumPy, sumPz, sumE;
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
function getInvariantMass(sumVector) {

    let m = 0;
    let sumPx, sumPy, sumPz, sumE;
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
function getTransverseMass(sumVector, met) {

    let m = 0;
    let m1 = getInvariantMass(sumVector);

    let metE2 = met.px * met.px + met.py * met.py;
    let Et2 = sumVector.E * sumVector.E - sumVector.pz * sumVector.pz;

    m = m1 * m1;
    m += 2 * (metE2 * Et2 - sumVector.px * met.px - sumVector.py * met.py);
    m = Math.sqrt(m);

    return m;
}

function createHistogram(array, start, end, bins) {
    // Histogram the array to the range `start` to `end` with `bins` bins
    var hist = new Array(bins).fill(0);
    var binWidth = (end - start) / bins;
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

function createHistogramData(array, start, end, bins) {
    // Create the data for a histogram of the array
    return {
        x:array,
        type:'histogram',
        nbinsx:bins,
    };
}

function getMassesArray() {
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

function getCurrentSelectionMessage() {
    var pass = checkIfEventPassing();
    if (pass == undefined) {
        return ["No event file is loaded!", "warning"];
    }
    var html = "This Event ";
    html += (pass ? "passes" : "does not pass") + " the selection!";
    symbol = pass ? "success" : "error";
    return [html, symbol];
}