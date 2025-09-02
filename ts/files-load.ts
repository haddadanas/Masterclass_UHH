import { Line, LineSegments, Material, Mesh, Object3D } from "three";
import JSZip from "jszip";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { addEvent, addDetector } from "./objects-add.js";
import { addSelectionRow } from "./tree-view.js";
import { changeMeshMaterials, getHTMLObject, toggleCollapse, cleanupData } from "./utils.js";
import { ispy } from "./config.js";
import { buildFileSummary, getPassingEvents } from "./uhh_selection.js";
import { disabled, gltf_objs } from "./objects-config.js";

/**
 * Toggles the visibility of the specified dialog object.
 * @param object The object's HTML id to toggle.
 * @returns void
 */
function openDialog(id: string) {
  $(id).modal("show");
}

/**
 * Closes the specified dialog object.
 * @param id The HTML id of the dialog to close.
 */
function closeDialog(id: string) {
  $(id).modal("hide");
}

/**
 * Checks if the File API is supported by the browser.
 * @returns boolean
 */
function hasFileAPI(): boolean {
  if (window.FileReader) {
    return true;
  } else {
    console.log("FileReader", window.FileReader);
    console.log("File", window.File);
    console.log("FileList", window.FileList);
    console.log("FileSystem", window.FileSystem);

    return false;
  }
}

/**
 * Clears the files table.
 * @param id The HTML id of the table to clear.
 */
function clearTable(id: string) {
  const tbl = getHTMLObject(id) as HTMLTableElement;

  while (tbl.rows.length > 0) {
    tbl.deleteRow(0);
  }
}

/**
 * Selects the specified file and displayes its events.
 * @param index The index of the file to select.
 * @returns void
 */
function selectEvent(index: number) {
  getHTMLObject("selected-event").innerHTML = `${ispy.file_name}: ${ispy.event_list[index]}`;
  //$("#selected-event").html(ispy.file_name+': '+ispy.event_list[index]);

  ispy.event_index = index;

  getHTMLObject("load-event").classList.remove("disabled");
  //$('#load-event').removeClass('disabled');
}

/**
 * Loads the events of a specified file.
 */
function updateEventList() {
  clearTable("browser-events");
  const tbl = getHTMLObject("browser-events") as HTMLTableElement;

  for (let i = 0; i < ispy.event_list.length; i++) {
    const event = ispy.event_list[i];
    const row = tbl.insertRow(tbl.rows.length);
    const cell = row.insertCell(0);

    cell.innerHTML = `<a id="browser-event-${i}" class="event">${event}</a>`;
    cell.firstChild?.addEventListener("click", () => {
      selectEvent(i);
    });
  }
}

/**
 * Enables the next/previous event button
 */
function enableNextPrev() {
  if (ispy.event_index > 0) {
    getHTMLObject("js-prev-event-button").classList.remove("disabled");
  } else {
    getHTMLObject("js-prev-event-button").classList.add("disabled");
  }

  if (ispy.event_list && ispy.event_list.length - 1 > ispy.event_index) {
    getHTMLObject("js-next-event-button").classList.remove("disabled");
  } else {
    getHTMLObject("js-next-event-button").classList.add("disabled");
  }
}

/**
 * Enables the next/previous selected event button
 */
function enableNextPrevSelected() {
  const selectedEvents = getPassingEvents() || [];

  if (selectedEvents.length > 0 && ispy.event_index > Number(selectedEvents[0])) {
    getHTMLObject("js-prev-sel-event").classList.remove("disabled");
  } else {
    getHTMLObject("js-prev-sel-event").classList.add("disabled");
  }

  if (selectedEvents.length > 0 && ispy.event_index < Number(selectedEvents[selectedEvents.length - 1])) {
    getHTMLObject("js-next-sel-event").classList.remove("disabled");
  } else {
    getHTMLObject("js-next-sel-event").classList.add("disabled");
  }
}

/**
 * Loads the events of a specified file and adds the content to the detector.
 * @returns void
 */
function loadEvent() {
  getHTMLObject("event-loaded").innerHTML = "";
  //getHTMLObject('loading').style.display = 'block';

  //$("#event-loaded").html("");
  $("#loading").modal("show");

  ispy.selected_objects.clear();

  // Hide Detector stuff in tree view if already shown
  if ($("i.Detector").hasClass("glyphicon-chevron-down")) {
    toggleCollapse("Detector");
  }

  let event;
  const fileEntry = ispy.ig_data?.file(ispy.event_list[ispy.event_index]);
  if (!fileEntry) {
    alert("No event data loaded or file not found!");
    return;
  }
  fileEntry.async("string").then(
    (content) => {
      event = JSON.parse(cleanupData(content));

      //getHTMLObject('loading').style.display = 'none';
      $("#loading").modal("hide");

      if (ispy.isGeometry) {
        $.extend(ispy.detector, event);
        addDetector();
        ispy.isGeometry = false;
      } else {
        addEvent(event);
        enableNextPrev();
        enableNextPrevSelected();

        const ievent = Number(ispy.event_index) + 1; // JavaScript!

        getHTMLObject("event-loaded").innerHTML = `${ispy.file_name}:${
          ispy.event_list[ispy.event_index]
        }  [${ievent} of ${ispy.event_list.length}]`;
        //$("#event-loaded").html(ispy.file_name + ":" + ispy.event_list[ispy.event_index] + "  [" + ievent + " of " + ispy.event_list.length + "]");

        console.log(ispy.current_event?.Types);
        console.log(ispy.current_event?.Collections.Products_V1);
      }
    },
    (err) => {
      alert(`Error loading event data: ${err}`);
    },
  );
}

/**
 * Loads the next event in the file.
 */
function nextEvent() {
  if (ispy.event_list && ispy.event_list.length - 1 > ispy.event_index) {
    ispy.event_index++;
    loadEvent();
  }
}

/**
 * Loads the previous event in the file.
 */
function prevEvent() {
  if (ispy.event_list && ispy.event_index > 0) {
    ispy.event_index--;
    loadEvent();
  }
}

/**
 * Loads the next event in the file, passing the selection.
 * @returns void
 */
function nextSelectedEvent() {
  const selectedEvents = getPassingEvents();
  if (selectedEvents.length === 0) {
    return;
  }

  const currentEvent = ispy.event_index;
  const currentIndex = selectedEvents.indexOf(currentEvent.toString());
  let nextIndex;
  if (currentIndex === -1) {
    nextIndex = selectedEvents.reduce((nearestIndex, currentValue, currentIndex) => {
      return Math.abs(Number(currentValue) - currentIndex) <
        Math.abs(Number(selectedEvents[nearestIndex]) - currentIndex)
        ? currentIndex
        : nearestIndex;
    }, 0);
  } else {
    nextIndex = currentIndex + 1;
  }
  if (selectedEvents.length !== 0) {
    nextIndex = selectedEvents[nextIndex % selectedEvents.length];
    ispy.event_index = Number(nextIndex);
    loadEvent();
  }
}

/**
 * Loads the previous event in the file, passing the selection.
 * @returns void
 */
function prevSelectedEvent() {
  const selectedEvents = getPassingEvents();
  if (selectedEvents.length === 0) {
    return;
  }

  const currentEvent = ispy.event_index;
  const currentIndex = selectedEvents.indexOf(currentEvent.toString());
  let nextIndex;
  if (currentIndex === -1) {
    nextIndex = selectedEvents.reduce((nearestIndex, currentValue, currentIndex) => {
      return Math.abs(Number(currentValue) - currentIndex) <
        Math.abs(Number(selectedEvents[nearestIndex]) - currentIndex)
        ? currentIndex
        : nearestIndex;
    }, 0);
  } else {
    nextIndex = currentIndex - 1;
  }
  nextIndex = Math.max(0, nextIndex);
  if (selectedEvents.length !== 0) {
    nextIndex = selectedEvents[nextIndex % selectedEvents.length];
    ispy.event_index = Number(nextIndex);
    loadEvent();
  }
}

/**
 * Loads the events of a specified file.
 * @param index The index of the file to select.
 * @returns void
 */
function selectLocalFile(index: number) {
  if (!ispy.local_files) {
    alert("No local files loaded!");
    return;
  }
  const reader = new FileReader();
  ispy.file_name = ispy.local_files[index].name;

  reader.onload = function (e: ProgressEvent<FileReader>) {
    const target = e.target;
    if (!target || !target.result) {
      alert("Error reading file!");
      return;
    }
    const data = target.result as ArrayBuffer;
    const event_list: string[] = [];
    JSZip.loadAsync(data).then((zip) => {
      $.each(zip.files, (_index, zipEntry) => {
        if (zipEntry.dir !== null && zipEntry.name !== "Header") {
          // TODO check how to access _data instead of dir
          if (zipEntry.name.split("/")[0] === "Geometry") {
            ispy.isGeometry = true;
          }

          event_list.push(zipEntry.name);
        }
      });

      ispy.event_list = event_list;
      ispy.event_index = 0;
      updateEventList();
      ispy.ig_data = zip;
    });
  };
  reader.onerror = function (e) {
    alert(e);
  };

  reader.readAsArrayBuffer(ispy.local_files[index]);
}

/**
 * Updates the list of local files in the browser.
 * @param list The list of local files to update.
 */
function updateLocalFileList(list: FileList) {
  clearTable("browser-files");
  const tbl = getHTMLObject("browser-files") as HTMLTableElement;

  for (let i = 0; i < list.length; i++) {
    const name = list[i].name;
    const row = tbl.insertRow(tbl.rows.length);
    const cell = row.insertCell(0);
    const cls = "file";

    cell.innerHTML = `<a id="browser-file-${i}" class="${cls}">${name}</a>`;
    cell.firstChild?.addEventListener("click", () => {
      selectLocalFile(i);
    });
  }
}

/**
 * Loads the local files.
 * @returns void
 */
function loadLocalFiles() {
  if (!hasFileAPI()) {
    let err_msg = "Sorry. You seeem to be using a browser that does not support FileReader API. ";
    err_msg += "Please try with Chrome (6.0+), Firefox (3.6+), Safari (6.0+), or IE (10+). ";
    err_msg += "Alternatively, open a file from the web. ";
    alert(err_msg);

    return;
  }

  getHTMLObject("load-event").classList.add("disabled");
  //$('#load-event').addClass('disabled');

  clearTable("browser-files");
  clearTable("browser-events");

  getHTMLObject("selected-event").innerHTML = "Selected event";
  //$('#selected-event').html("Selected event");

  const files = (getHTMLObject("js-local-files-btn") as HTMLInputElement).files;
  if (!files || files.length === 0) {
    alert("Please select a file to load!");
    return;
  }
  ispy.local_files = files;
  updateLocalFileList(ispy.local_files);
  ispy.loaded_local = true;
  openDialog("#files");
}

/**
 * Handles the dropped file.
 * @param file The file to load.
 */
function loadDroppedFile(file: File) {
  const reader = new FileReader();
  ispy.file_name = file.name;

  //getHTMLObject('loading').style.display = 'block';
  $("#loading").modal("show");

  reader.onload = function (e) {
    const target = e.target;
    if (!target || !target.result) {
      alert("Error reading file!");
      return;
    }
    const data = target.result as ArrayBuffer;
    const event_list: string[] = [];
    JSZip.loadAsync(data).then((zip) => {
      $.each(zip.files, (_index, zipEntry) => {
        if (zipEntry.dir !== null && zipEntry.name !== "Header") {
          if (zipEntry.name.split("/")[0] === "Geometry") {
            ispy.isGeometry = true;
          }

          event_list.push(zipEntry.name);
        }
      });

      ispy.event_list = event_list;
      ispy.event_index = 0;
      updateEventList();
      ispy.ig_data = zip;
      buildFileSummary();
      loadEvent();

      //getHTMLObject('loading').style.display = 'none';
      $("#loading").modal("hide");
    });
  };

  reader.onerror = function (e) {
    alert(e);
  };

  reader.readAsArrayBuffer(file);
}

/**
 * Selects a file from the browser.
 * @param filename The name of the file to select.
 */
function selectFile(filename: string) {
  clearTable("browser-events");

  ispy.file_name = filename.split("/")[2]; // of course this isn't a general case for files

  //getHTMLObject('progress').style.display = 'block';
  $("#progress").modal("show");

  const xhr = new XMLHttpRequest();
  xhr.open("GET", filename, true);
  xhr.overrideMimeType("text/plain; charset=x-user-defined");

  clearTable("browser-events");
  const ecell = (getHTMLObject("browser-events") as HTMLTableElement).insertRow(0).insertCell(0);
  ecell.innerHTML = "Loading events...";

  xhr.onprogress = function (evt) {
    if (evt.lengthComputable) {
      const percentComplete = Math.round((evt.loaded / evt.total) * 100);
      $(".progress-bar").attr("style", `width:${percentComplete}%;`);
      $(".progress-bar").html(`${percentComplete}%`);
    }
  };

  xhr.onreadystatechange = function () {
    if (this.readyState === 4) {
      //getHTMLObject('progress').style.display = 'none';

      const progress_bars = document.querySelectorAll("div.progress-bar");
      progress_bars.forEach((pb) => {
        (pb as HTMLDivElement).style.width = "0%";
        pb.innerHTML = "0%";
      });

      $("#progress").modal("hide");
      //$('.progress-bar').attr('style', 'width:0%;');
      //$('.progress-bar').html('0%');
    }
  };

  xhr.onload = function () {
    if (this.status === 200) {
      const event_list: string[] = [];
      JSZip.loadAsync(xhr.responseText).then((zip) => {
        $.each(zip.files, (_index, zipEntry) => {
          if (!zipEntry.dir && zipEntry.name !== "Header") {
            event_list.push(zipEntry.name);
          }
        });

        ispy.event_list = event_list;
        ispy.event_index = 0;
        updateEventList();
        ispy.ig_data = zip;
      });
    }
  };

  xhr.send();
}

/**
 * Loads the web files.
 */
function loadWebFiles() {
  const web_files = [
    "./data/Hto4l_120-130GeV.ig",
    "./data/BJetPlusX_Run2012C_0.ig",
    "./data/DoubleMuParked_Run2012C_0.ig",
    "./data/MET_Run2012C_0.ig",
    "./data/TauParked_Run2012C_0.ig",
    "./data/DoubleElectron_Run2012C_0.ig",
    "./data/DoublePhoton_Run2012B_0.ig",
    "./data/JetHT_Run2012C_0.ig",
    "./data/MinimumBias_Run2012C_0.ig",
  ];

  getHTMLObject("selected-event").innerHTML = "Selected event";
  getHTMLObject("load-event").classList.add("disabled");

  //$('#selected-event').html("Selected event");
  //$('#load-event').addClass('disabled');

  const tbl = getHTMLObject("browser-files") as HTMLTableElement;

  for (let i = 0; i < web_files.length; i++) {
    const event = web_files[i];
    const name = event.split("/")[2];
    const row = tbl.insertRow(tbl.rows.length);
    const cell = row.insertCell(0);
    const cls = "file";

    cell.innerHTML = `<a id="browser-file-${i}" class="${cls}">${name}</a>`;
    // add onclick handler to the link
    cell.firstChild?.addEventListener("click", () => {
      selectFile(event);
    });
  }
}

/**
 * Shows the web files dialog.
 */
function showWebFiles() {
  openDialog("#files");

  if (ispy.loaded_local === true) {
    // If we have previously opened a local file then
    // we don't want its contents appearing
    // in the web files dialog
    clearTable("browser-files");
    clearTable("browser-events");
    ispy.loaded_local = false;

    loadWebFiles();
  }

  //getHTMLObject('open-files').style.display = 'none';
  $("#open-files").modal("hide");
}

/**
 * Loads the geometry files.
 */
function loadGLTFFiles() {
  const gltf_files = [
    "./geometry/gltf/EB.glb",
    "./geometry/gltf/EEminus.glb",
    "./geometry/gltf/EEplus.glb",
    "./geometry/gltf/ESminus.glb",
    "./geometry/gltf/ESplus.glb",
    "./geometry/gltf/muon-barrel.glb",
    "./geometry/gltf/muon-endcap-minus.glb",
    "./geometry/gltf/muon-endcap-plus.glb",
    "./geometry/gltf/muon-rphi-minus.glb",
    "./geometry/gltf/muon-rphi-plus.glb",
    "./geometry/gltf/muon-0.glb",
    "./geometry/gltf/muon-1.glb",
    "./geometry/gltf/muon-2.glb",
    "./geometry/gltf/muon-3.glb",
    "./geometry/gltf/HF.glb",
  ];

  clearTable("obj-files");

  getHTMLObject("selected-obj").innerHTML = "Selected geometry";
  getHTMLObject("load-obj").classList.add("disabled");

  //$('#selected-obj').html("Selected geometry");
  //$('#load-obj').addClass('disabled');

  const tbl = getHTMLObject("obj-files") as HTMLTableElement;

  for (let i = 0; i < gltf_files.length; i++) {
    const event = gltf_files[i];
    const name = event.split("/")[3];
    const row = tbl.insertRow(tbl.rows.length);
    const cell = row.insertCell(0);
    const cls = "file";

    cell.innerHTML = `<a id="browser-file-${i}" class="${cls}">${name}</a>`;
    cell.firstChild?.addEventListener("click", () => {
      selectGLTF(name);
    });
  }
}

/**
 * Loads a GLTF file from the browser.
 */
function loadObjFiles() {
  const obj_files = [
    "./geometry/obj/EB.obj",
    "./geometry/obj/EEminus.obj",
    "./geometry/obj/EEplus.obj",
    "./geometry/obj/ESminus.obj",
    "./geometry/obj/ESplus.obj",
    "./geometry/obj/muon-barrel.obj",
    "./geometry/obj/muon-endcap-minus.obj",
    "./geometry/obj/muon-endcap-plus.obj",
    "./geometry/obj/muon-rphi-minus.obj",
    "./geometry/obj/muon-rphi-plus.obj",
    "./geometry/obj/muon-0.obj",
    "./geometry/obj/muon-1.obj",
    "./geometry/obj/muon-2.obj",
    "./geometry/obj/muon-3.obj",
    "./geometry/obj/HF.obj",
  ];

  clearTable("obj-files");

  getHTMLObject("selected-obj").innerHTML = "Selected geometry";
  getHTMLObject("load-obj").classList.add("disabled");

  //$('#selected-obj').html("Selected geometry");
  //$('#load-obj').addClass('disabled');

  const tbl = getHTMLObject("obj-files") as HTMLTableElement;

  for (let i = 0; i < obj_files.length; i++) {
    const event = obj_files[i];
    const name = event.split("/")[3];
    const row = tbl.insertRow(tbl.rows.length);
    const cell = row.insertCell(0);
    const cls = "file";

    cell.innerHTML = `<a id="browser-file-${i}" class="${cls}">${name}</a>`;
    cell.firstChild?.addEventListener("click", () => {
      selectObj(name);
    });
  }
}

/**
 * Reads an OBJ file.
 * @param file The OBJ file to read.
 * @param cb The callback to call with the file contents.
 */
function readOBJ(file: File, cb: (contents: string, name: string) => void) {
  const reader = new FileReader();

  reader.onload = function (e) {
    //getHTMLObject('loading').style.display = 'none';
    $("#loading").modal("hide");
    // skipcq: JS-0255
    cb(e.target?.result as string, file.name);
  };

  reader.onerror = function (e) {
    alert(e);
  };

  reader.readAsText(file);
}

/**
 * Loads an OBJ file.
 * @param contents The contents of the OBJ file.
 * @param name The name of the OBJ file.
 */
function loadOBJ(contents: string, name: string) {
  const object = new OBJLoader().parse(contents);
  object.name = name;
  const imported = ispy.scene?.getObjectByName("Imported");

  (object.children as Mesh[]).forEach((c) => {
    changeMeshMaterials(c.material, (m) => {
      m.transparent = true;
      m.opacity = ispy.importTransparency;
    });
  });
  if (imported) {
    imported.add(object);
  }
  addSelectionRow("Imported", object.name, object.name, [], true);
}

/**
 * Reads an OBJ file and its associated MTL file.
 * @param file The OBJ file to read.
 * @param mtl_file The MTL file to read.
 * @param cb The callback to call with the file contents.
 */
function readOBJMTL(file: File, mtl_file: File, cb: (obj: string, mtl_file: File, name: string) => void) {
  const reader = new FileReader();

  reader.onload = function (e) {
    // skipcq: JS-0255
    cb(e.target?.result as string, mtl_file, file.name);
  };

  reader.onerror = function (e) {
    alert(e);
  };

  reader.readAsText(file);
}

/**
 * Loads an OBJ file and its associated MTL file.
 * @param obj The contents of the OBJ file.
 * @param mtl_file The MTL file to read.
 * @param name The name of the OBJ file.
 */
function loadOBJMTL(obj: string, mtl_file: File, name: string) {
  const object = new OBJLoader().parse(obj);
  const reader = new FileReader();
  const imported = ispy.scene?.getObjectByName("Imported");

  reader.onload = function (e) {
    // let mtl = e.target.result;
    const materials_creator = new MTLLoader().parse(e.target?.result as string, "");
    materials_creator.preload();

    object.traverse((o) => {
      if (o instanceof Mesh || o instanceof Line) {
        if (o.material.name) {
          const material = materials_creator.create(o.material.name);
          if (material) {
            o.material = material;
            o.material.transparent = true;
            o.material.opacity = ispy.importTransparency;
          }
        }
      }
    });

    //getHTMLObject('loading').style.display = 'none';
    $("#loading").modal("hide");

    object.name = name;
    object.visible = true;
    disabled[name] = false;

    if (imported) {
      imported.add(object);
    }
    addSelectionRow("Imported", name, name, [], true);
  };

  reader.readAsText(mtl_file);
}

/**
 * Imports a model from the browser.
 */
function importModel() {
  if (!hasFileAPI()) {
    let err_msg = "Sorry. You seeem to be using a browser that does not support FileReader API. ";
    err_msg += "Please try with Chrome (6.0+), Firefox (3.6+), Safari (6.0+), or IE (10+). ";
    err_msg += "Alternatively, open a file from the web. ";
    alert(err_msg);

    return;
  }

  const files = (getHTMLObject("import-file") as HTMLInputElement).files;
  if (!files || files.length === 0) {
    alert("Please select a file to load!");
    return;
  }
  let extension, file_name;

  if (files.length === 1) {
    // If one file we assume it's an obj file and load it

    file_name = files[0].name;
    extension = file_name.split(".").pop()?.toLowerCase();

    if (extension !== "obj") {
      alert(
        `The file you attempted to load: "${file_name}" does not appear (at least from the extension) to be an .obj file!`,
      );
      return;
    }

    //getHTMLObject('loading').style.display = 'block';
    //getHTMLObject('import-model').style.display = 'none';

    $("#loading").modal("show");
    $("#import-model").modal("hide");

    readOBJ(files[0], loadOBJ);
  } else if (files.length === 2) {
    // We support for now either one obj file or an obj file and an mtl file

    let obj_file, mtl_file;

    const ext1 = files[0].name.split(".").pop()?.toLowerCase();
    const ext2 = files[1].name.split(".").pop()?.toLowerCase();

    if (ext1 === "obj" && ext2 === "mtl") {
      obj_file = files[0];
      mtl_file = files[1];
    } else if (ext1 === "mtl" && ext2 === "obj") {
      obj_file = files[1];
      mtl_file = files[0];
    } else {
      alert(
        "For now, this application supports either loading one .obj file or loading an .obj file and a corresponding .mtl file!",
      );
      return;
    }

    //getHTMLObject('loading').style.display = 'block';
    //getHTMLObject('import-model').style.display = 'none';

    $("#loading").modal("show");
    $("#import-model").modal("hide");

    readOBJMTL(obj_file, mtl_file, loadOBJMTL);
  } else {
    alert(
      "For now, this application supports either loading one .obj file or loading an .obj file and a corresponding .mtl file!",
    );
  }
}

/**
 * Selects a GLTF file and updates the UI.
 * @param gltf_file The GLTF file to select.
 */
function selectGLTF(gltf_file: string) {
  getHTMLObject("selected-obj").innerHTML = gltf_file;
  getHTMLObject("load-obj").classList.remove("disabled");

  //$('#selected-obj').html(gltf_file);
  //$('#load-obj').removeClass('disabled');

  ispy.selected_gltf = gltf_file;
}

/**
 * Loads the selected GLTF file.
 * @returns void
 */
function loadSelectedGLTF() {
  const name = ispy.selected_gltf.split(".")[0];
  const gltf_file = `./geometry/gltf/${ispy.selected_gltf}`;
  const imported = ispy.scene?.getObjectByName("Imported");

  const gltf_loader = new GLTFLoader();

  gltf_loader.load(gltf_file, (gltf) => {
    const object = gltf.scene.children[0];

    (object.children as Mesh[]).forEach((c) => {
      changeMeshMaterials(c.material, (m) => {
        m.clippingPlanes = ispy.local_planes;
      });
    });

    if (imported) {
      imported.add(object);
    }
    addSelectionRow("Imported", name, name, [], true);
  });
}

/**
 * Selects an OBJ file and updates the UI.
 * @param obj_file The OBJ file to select.
 */
function selectObj(obj_file: string) {
  getHTMLObject("selected-obj").innerHTML = obj_file;
  getHTMLObject("load-obj").classList.remove("disabled");

  //$('#selected-obj').html(obj_file);
  //$('#load-obj').removeClass('disabled');

  ispy.selected_obj = obj_file;
}

/**
 * Loads the selected OBJ file.
 */
function loadSelectedObj() {
  const name = ispy.selected_obj.split(".")[0];
  const obj_file = `./geometry/obj/${ispy.selected_obj}`;
  const mtl_file = `./geometry/obj/${name}.mtl`;

  loadOBJMTL_new(obj_file, mtl_file, name, name, "Imported", true);
}

/**
 * Loads an OBJ file and its associated MTL file.
 * @param obj_file The OBJ file to load.
 * @param mtl_file The MTL file to load.
 * @param id The ID to assign to the loaded object.
 * @param name The name to assign to the loaded object.
 * @param group The group to add the loaded object to.
 * @param show Whether to show the loaded object.
 */
function loadOBJMTL_new(obj_file: string, mtl_file: string, id: string, name: string, group: string, show: boolean) {
  const mtl_loader = new MTLLoader();
  const groupObject = ispy.scene?.getObjectByName(group);

  mtl_loader.load(mtl_file, (materials) => {
    materials.preload();

    const obj_loader = new OBJLoader();
    obj_loader.setMaterials(materials);
    obj_loader.load(obj_file, (object) => {
      object.name = id;
      object.visible = show;
      disabled[object.name] = false;

      (object.children as Mesh[]).forEach((c) => {
        changeMeshMaterials(c.material, (m) => {
          m.transparent = true;
          m.opacity = ispy.importTransparency;
          m.clippingPlanes = ispy.local_planes;
        });
      });

      if (groupObject) {
        groupObject.add(object);
      }
      addSelectionRow(group, object.name, name, [], show);
    });
  });

  return;
}

/**
 * Imports the beampipe geometry.
 */
function importBeampipe() {
  loadOBJMTL_new(
    "./geometry/obj/beampipe.obj",
    "./geometry/obj/beampipe.mtl",
    "BeamPipe",
    "Beam Pipe",
    "Imported",
    true,
  );
}

/**
 * Imports the detector geometry.
 */
function importDetector() {
  if (!ispy.scenes) {
    alert("No scene(s) loaded!");
    return;
  }
  const gltf_loader = new GLTFLoader();

  //getHTMLObject('loading').style.display = 'block';
  $("#loading").modal("show");

  for (const g of gltf_objs) {
    gltf_loader.load(g.file, (gltf) => {
      const object = gltf.scene.children[0] as Object3D & {
        view?: string;
      };

      object.name = g.id;
      object.visible = g.show;
      object.view = g.view;

      // Set render order for geometries
      // Otherwise they won't appear "in-front" of Imported geometries
      (object.children as LineSegments[]).forEach((c) => {
        c.renderOrder = 1;
        changeMeshMaterials(c.material, (m: Material) => {
          m.clippingPlanes = ispy.local_planes;
        });
      });

      disabled[object.name] = !g.show;
      ispy.scenes[object.view].getObjectByName(g.group)?.add(object);

      // For now do not add RPhi and RhoZ selection options to
      // the controls GUI

      if (!(object.name === "RPhi" || object.name === "RhoZ"))
        addSelectionRow(g.group, object.name, g.name, [], g.show);
    });
  }

  //getHTMLObject('loading').style.display = 'none';
  $("#loading").modal("hide");
}

export {
  openDialog,
  closeDialog,
  hasFileAPI,
  clearTable,
  selectEvent,
  updateEventList,
  enableNextPrev,
  enableNextPrevSelected,
  loadEvent,
  nextEvent,
  prevEvent,
  nextSelectedEvent,
  prevSelectedEvent,
  selectLocalFile,
  updateLocalFileList,
  loadLocalFiles,
  loadDroppedFile,
  selectFile,
  loadWebFiles,
  showWebFiles,
  cleanupData,
  loadGLTFFiles,
  loadObjFiles,
  importModel,
  importBeampipe,
  importDetector,
  selectGLTF,
  loadSelectedGLTF,
  selectObj,
  loadSelectedObj,
  loadOBJMTL,
  loadOBJ,
  readOBJ,
  readOBJMTL,
};
