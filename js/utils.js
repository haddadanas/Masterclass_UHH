
const mMuon2 = 0.10566 * 0.10566;
const mElectron2 = 0.511e-3 * 0.511e-3;

function getCurrentIndex() {
  return ispy.event_index;
}
function getCurrentEvent() {
  return ispy.current_event;
}
function getFourVector(key, type, eventObjectData) {
  const isMuon = key.includes("Muon");
  const isElectron = key.includes("Electron");
  const isPhoton = key.includes("Photon");
  if (!(isMuon || isElectron || isPhoton)) {
    throw new Error("Unknown particle type: " + key + ", only Muon, Electron, and Photon are supported.");
  }
  let pt, eta, phi, charge, ptype;
  let E;
  pt = eta = phi = charge = E = 0;
  ptype = "";
  for (const [index, t] of type.entries()) {
    if (t[0] === "pt") {
      pt = eventObjectData[index];
    }
    else if (t[0] === "energy") {
      E = eventObjectData[index];
    }
    else if (t[0] === "eta") {
      eta = eventObjectData[index];
    }
    else if (t[0] === "phi") {
      phi = eventObjectData[index];
    }
    else if (t[0] === "charge") {
      charge = eventObjectData[index];
    }
  }
  if (!pt) {
    pt = E / Math.cosh(eta);
  }
  const px = pt * Math.cos(phi);
  const py = pt * Math.sin(phi);
  const pz = pt * Math.sinh(eta);
  if (isPhoton) {
    return { "E": E, "px": px, "py": py, "pz": pz, "pt": pt, "ptype": "Photon" };
  }
  E = 0;
  if (isMuon) {
    E += mMuon2;
    ptype = "Muon";
  }
  if (isElectron) {
    E += mElectron2;
    ptype = "Electron";
  }
  E += pt * pt * Math.cosh(eta) * Math.cosh(eta);
  E = Math.sqrt(E);
  return { "E": E, "px": px, "py": py, "pz": pz, "pt": pt, "charge": charge, "ptype": ptype };
}
function getFourVectorByObjectIndex(key, objectUserData) {
  const type = getCurrentEvent().Types[key];
  const eventObjectData = getCurrentEvent().Collections[key][objectUserData.originalIndex];
  const result = getFourVector(key, type, eventObjectData);
  result["index"] = objectUserData.originalIndex;
  return result;
}
function getMetInformation(type, eventObjectData) {
  let pt, px, py, pz;
  pt = px = py = pz = 0;
  for (const [index, t] of type.entries()) {
    if (t[0] === "pt") {
      pt = eventObjectData[index];
    }
    else if (t[0] === "px") {
      px = eventObjectData[index];
    }
    else if (t[0] === "py") {
      py = eventObjectData[index];
    }
    else if (t[0] === "pz") {
      pz = eventObjectData[index];
    }
  }
  return { "pt": pt, "px": px, "py": py, "pz": pz };
}
;
const cleanupData = function (d) {
  // rm non-standard json bits
  // newer files will not have this problem
  d = d.replace(/\(/g, "[")
    .replace(/\)/g, "]")
    .replace(/\'/g, "\"")
    .replace(/nan/g, "0");
  return d;
};
const getEventsSummary = function (event_json) {
  const part_names = ["TrackerMuons", "GsfElectrons", "Photons", "METs"];
  const keys = Object.keys(event_json.Collections);
  const map = part_names.map(name => keys.filter(k => k.includes(name)).reduce((x, y) => x > y ? x : y));
  const particles = new Map();
  let met = { E: 0, px: 0, py: 0, pz: 0, pt: 0 };
  map.forEach((collec) => {
    const type = event_json.Types[collec];
    const key = collec.replace(/^(?:PAT|PF)?(.*?)_V\d$/, "$1");
    if (collec.includes("MET")) {
      met = getMetInformation(type, event_json.Collections[collec][0]);
      return;
    }
    const tmp = new Array();
    event_json.Collections[collec].forEach((part) => {
      tmp.push(getFourVector(collec, type, part));
    });
    particles.set(key, tmp);
  });
  return { particles: particles, met: met };
};
class EventCollection {
  events = new Map();
  constructor(eventList, igData) {
    if (eventList === undefined || igData === undefined) {
      return;
    }
    // get the event data
    eventList.forEach((event_path, event_index) => {
      try {
        const rawText = igData.files[event_path];
        if (rawText === null) {
          alert("Error encountered reading event " + (event_index + 1) + ": " + event_path + " not found.");
          alert("The event will be skipped in the analysis.");
          return;
        }
        const _event = JSON.parse(cleanupData(rawText.asText()));
        this.events.set(event_index.toString(), getEventsSummary(_event));
      }
      catch (err) {
        alert("Error encountered parsing event " + (event_index + 1) + ": " + err);
        alert("The event will be skipped in the analysis.");
      }
    });
  }
}

function showInfoBubble(bubbleText, pointer) {
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerText = bubbleText;
  document.body.appendChild(bubble);

  // Position the bubble at the cursor position
  bubble.style.left = `${
    (pointer.x * window.innerWidth) / 2 + window.innerWidth / 2
  }px`;
  bubble.style.top = `${
    (-pointer.y * window.innerHeight) / 2 + window.innerHeight / 2
  }px`;
}

function removeExistingBubble() {
  const existingBubble = document.querySelector(".bubble");
  if (existingBubble) {
    existingBubble.remove();
  }
}