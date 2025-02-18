analysis.selection_naming_map = {
  "TrackerMuons": "# &mu;",
  "GsfElectrons": "# e",
  "Photons": "# &gamma;",
  "charge": "Charge Sign",
  "pt": "Min p<sub>T,&#8467;</sub>",
  "minMETs": "Min <span class='strikethrough'>p<sub>T</sub></span> (MET)",
  "maxMETs": "Max <span class='strikethrough'>p<sub>T</sub></span> (MET)",
  "check": "Check Selection",
  "nSelected": "# Passing",
  "firstSelected": "Passing Events",
};

analysis.selection_fields_help = {
  "TrackerMuons": "Number of Muons required, which pass the p<sub>T</sub> constraint. If '-1' is entered, the selection is ignored.",
  "GsfElectrons": "Number of Electrons required, which pass the p<sub>T</sub> constraint. If '-1' is entered, the selection is ignored.",
  "Photons": "Number of photons required. If '-1' is entered, the selection is ignored.",
  "charge": "Required charge of the sum of selected leptons",
  "pt": "Minimum p<sub>T</sub> required for the leptons",
  "minMETs": "Minimum MET required",
  "maxMETs": "Maximum MET required",
  "nSelected": "Total Number of events passing the selection",
  "firstSelected": "First 5 events passing the selection",
};

