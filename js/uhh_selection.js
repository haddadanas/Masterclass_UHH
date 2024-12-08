analysis.checkCurrentSelection = function () {
    let [text, symbol] = getCurrentSelectionMessage();
    (0, swal)({ text: text, title: "Selection Results", icon: symbol, buttons: false, timer: 3000 });
    if (symbol == "warning")
        return;
    const nSelected = ispy.subfoldersReduced["Selection"].find(e => e.property == "nSelected");
    if (nSelected) {
        nSelected.setValue(analysis.getPassingEvents().length);
    }
    const firstSelected = ispy.subfoldersReduced["Selection"].find(e => e.property == "firstSelected");
    if (firstSelected) {
        firstSelected.setValue(analysis.getPassingEvents().map(e => Number(e) + 1).slice(0, 5).join(", "));
    }
};
analysis.getSceneObjects = function () {
    var _a, _b, _c, _d, _e, _f;
    return [
        ...(((_c = (_b = (_a = ispy.scenes) === null || _a === void 0 ? void 0 : _a["3D"]) === null || _b === void 0 ? void 0 : _b.getObjectByName('Physics')) === null || _c === void 0 ? void 0 : _c.children.map(o => o.name)) || []),
        ...(((_f = (_e = (_d = ispy.scenes) === null || _d === void 0 ? void 0 : _d["3D"]) === null || _e === void 0 ? void 0 : _e.getObjectByName('Tracking')) === null || _f === void 0 ? void 0 : _f.children.map(o => o.name)) || [])
    ].reduce((dic, o) => {
        dic[o.replace(/^(?:PAT|PF)?(.*?)_V\d$/, '$1')] = o;
        return dic;
    }, {});
};
analysis.getSelectionResults = function () {
    let event_stats = document.getElementById('event-statistics');
    if (!event_stats) {
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
    Plotly.newPlot("m-hist", [m_hist]);
    // Plotly.newPlot("mt-hist", [mt_hist]); // TODO enable this when transverse mass is implemented
    return;
};
analysis.getSelectionCuts = function () {
    var cuts = {};
    ispy.subfoldersReduced["Selection"].forEach(e => {
        if (["function", "string"].includes(typeof (e.getValue())))
            return;
        cuts[e.property] = e.getValue();
    });
    return cuts;
};
// Get the passing events in the current file
analysis.getPassingEvents = function () {
    if (!getCurrentEvent()) {
        return [];
    }
    var passing_events = [];
    for (let index of analysis.file_events_summary.keys()) {
        if (checkIfEventPassing(index)) {
            passing_events.push(index);
        }
    }
    return passing_events;
};
// Get CSV of the passing events
analysis.createCSV = function () {
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
};
//
// Get the needed information of all events in the current file
//
analysis.buildFileSummary = function () {
    let event;
    let event_summary;
    let analysisBtn = document.getElementById("analysis_btn");
    if (!analysisBtn) {
        analysisBtn = document.createElement("button");
    }
    $('#loading').modal('hide');
    $('#building').modal('show');
    try {
        // get the event data
        event_summary = new EventCollection(ispy.event_list, ispy.ig_data);
        // store the event summary as a global variable
        analysis.file_events_summary = event_summary.events;
        // enable the analysis button
        analysisBtn.disabled = false;
    }
    catch (err) {
        analysisBtn.disabled = true;
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
let getSelectionParticles = function (event_index) {
    var results = { index: event_index.toString(), parts: new Map(), met: {} };
    var tmp_parts = new Map();
    let summary = analysis.file_events_summary.get(event_index.toString());
    if (!summary) {
        return results;
    }
    let selection = analysis.getSelectionCuts();
    let pt_cut = selection["pt"];
    let filteredSelection = Object.keys(selection).filter(sel => {
        if (["charge", "pt"].includes(sel))
            return false;
        if (selection[sel] == 0 || selection[sel] == -1)
            return false;
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
};
let checkIfEventPassing = function (event_index = -1) {
    if (!getCurrentEvent()) {
        return false;
    }
    if (event_index == -1) {
        event_index = getCurrentIndex();
    }
    event_index = event_index.toString();
    var pass = true;
    var cuts = analysis.getSelectionCuts();
    var summary = analysis.file_events_summary.get(event_index);
    if (!summary) {
        return false;
    }
    // Check the MET cuts
    pass && (pass = checkMinMET(summary.met, cuts["minMETs"]));
    pass && (pass = checkMaxMET(summary.met, cuts["maxMETs"]));
    if (!pass)
        return pass;
    for (let [name, part] of summary.particles) {
        if (cuts[name] == -1)
            continue;
        if (name == "TrackerMuons" || name == "GsfElectrons") {
            pass && (pass = checkCharge(part, cuts["charge"]));
            if (!pass)
                break;
            part = getPtPassingLeptons(part, cuts["pt"]);
        }
        if (part.length != cuts[name]) {
            pass && (pass = false);
            break;
        }
    }
    ;
    return pass;
};
// Helper functions to check the selection
let checkMinMET = function (met, cut) {
    if (cut == -1)
        return true;
    return met["pt"] >= cut;
};
let checkMaxMET = function (met, cut) {
    if (cut == -1)
        return true;
    return met["pt"] <= cut;
};
let checkCharge = function (leptons, cut) {
    if (cut == undefined)
        return true;
    let chargeSum = 0;
    leptons.forEach(lepton => {
        chargeSum += lepton["charge"];
    });
    return Math.sign(chargeSum) == cut;
};
let getPtPassingLeptons = function (leptons, cut) {
    return leptons.filter(lepton => lepton["pt"] >= cut);
};
let sumFourVectors = function (particles) {
    if (particles.size < 1) {
        return { E: 0, px: 0, py: 0, pz: 0 };
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
    return { E: sumE, px: sumPx, py: sumPy, pz: sumPz };
};
// Calculate the invariant mass of a list of particles
let getInvariantMass = function (sumVector) {
    let m = 0;
    let sumPx, sumPy, sumPz, sumE;
    sumPx = sumVector.px;
    sumPy = sumVector.py;
    sumPz = sumVector.pz;
    sumE = sumVector.E;
    m = sumE * sumE;
    m -= (sumPx * sumPx + sumPy * sumPy + sumPz * sumPz);
    m = Math.sqrt(m);
    return m;
};
// Calculate the transverse mass of a list of particles
let getTransverseMass = function (sumVector, met) {
    let m = 0;
    let m1 = getInvariantMass(sumVector);
    let metE2 = met.px * met.px + met.py * met.py;
    let Et2 = sumVector.E * sumVector.E - sumVector.pz * sumVector.pz;
    m = m1 * m1;
    m += 2 * (metE2 * Et2 - sumVector.px * met.px - sumVector.py * met.py);
    m = Math.sqrt(m);
    return m;
};
let createHistogram = function (array, start, end, bins) {
    // Histogram the array to the range `start` to `end` with `bins` bins
    var hist = new Array(bins).fill(0);
    var binWidth = (end - start) / bins;
    array.forEach((val) => {
        if (val <= start) {
            hist[0]++;
            return;
        }
        if (val >= end) {
            hist[bins - 1]++;
            return;
        }
        let bin = Math.floor(val / binWidth);
        hist[bin]++;
    });
    return hist;
};
let createHistogramData = function (array, start, end, bins) {
    // Create the data for a histogram of the array
    return {
        x: array,
        type: 'histogram',
        nbinsx: bins,
    };
};
let getMassesArray = function () {
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
    return { m: masses, mt: massesT };
};
let getCurrentSelectionMessage = function () {
    var pass = checkIfEventPassing();
    if (pass == undefined) {
        return ["No event file is loaded!", "warning"];
    }
    var html = "This Event ";
    html += (pass ? "passes" : "does not pass") + " the selection!";
    let symbol = pass ? "success" : "error";
    return [html, symbol];
};
