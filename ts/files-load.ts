import THREE from "three";
// @ts-ignore: No type definitions for 'jszip'
import JSZip from "jszip";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { addEvent, addDetector } from "./objects-add.js";
import { addSelectionRow } from "./tree-view.js";
import { changeMeshMaterials, getHTMLObject, toggleCollapse, cleanupData } from "./utils.js";
import { ispy } from "./config.js";
import { buildFileSummary, getPassingEvents } from "./uhh_selection.js";
import { disabled } from "./objects-config.js";


function openDialog(id: string) {
  $(id).modal("show");
}

function closeDialog(id: string) {
  $(id).modal("hide");
}

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

function clearTable(id: string) {
  let tbl = getHTMLObject(id) as HTMLTableElement;

  while (tbl.rows.length > 0) {
    tbl.deleteRow(0);
  }
}

function selectEvent(index: number) {
  getHTMLObject("selected-event").innerHTML =
    ispy.file_name + ": " + ispy.event_list[index];
  //$("#selected-event").html(ispy.file_name+': '+ispy.event_list[index]);

  ispy.event_index = index;

  getHTMLObject("load-event").classList.remove("disabled");
  //$('#load-event').removeClass('disabled');
}

function updateEventList() {
  clearTable("browser-events");
  let tbl = getHTMLObject("browser-events") as HTMLTableElement;

  for (let i = 0; i < ispy.event_list.length; i++) {
    let e = ispy.event_list[i];
    let row = tbl.insertRow(tbl.rows.length);
    let cell = row.insertCell(0);

    cell.innerHTML =
      '<a id="browser-event-' +
      i +
      '" class="event" onclick="selectEvent(\'' +
      i +
      "');\">" +
      e +
      "</a>";
  }
}

function enableNextPrev() {
  if (ispy.event_index > 0) {
    getHTMLObject("prev-event-button").classList.remove("disabled");
  } else {
    getHTMLObject("prev-event-button").classList.add("disabled");
  }

  if (ispy.event_list && ispy.event_list.length - 1 > ispy.event_index) {
    getHTMLObject("next-event-button").classList.remove("disabled");
  } else {
    getHTMLObject("next-event-button").classList.add("disabled");
  }
}

function enableNextPrevSelected() {
  const selectedEvents = getPassingEvents() || [];

  if (
    selectedEvents.length > 0 &&
    ispy.event_index > Number(selectedEvents[0])
  ) {
    getHTMLObject("prev-sel-event").classList.remove("disabled");
  } else {
    getHTMLObject("prev-sel-event").classList.add("disabled");
  }

  if (
    selectedEvents.length > 0 &&
    ispy.event_index < Number(selectedEvents[selectedEvents.length - 1])
  ) {
    getHTMLObject("next-sel-event").classList.remove("disabled");
  } else {
    getHTMLObject("next-sel-event").classList.add("disabled");
  }
}

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

  try {
    event = JSON.parse(
      cleanupData(ispy.ig_data.file(ispy.event_list[ispy.event_index]).asText())
    );
  } catch (err) {
    alert(err);
  }
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

    let ievent = +ispy.event_index + 1; // JavaScript!

    getHTMLObject("event-loaded").innerHTML =
      ispy.file_name +
      ":" +
      ispy.event_list[ispy.event_index] +
      "  [" +
      ievent +
      " of " +
      ispy.event_list.length +
      "]";
    //$("#event-loaded").html(ispy.file_name + ":" + ispy.event_list[ispy.event_index] + "  [" + ievent + " of " + ispy.event_list.length + "]");

    console.log(ispy.current_event.Types);
    console.log(ispy.current_event.Collections.Products_V1);
  }
}

function nextEvent() {
  if (ispy.event_list && ispy.event_list.length - 1 > ispy.event_index) {
    ispy.event_index++;
    loadEvent();
  }
}

function prevEvent() {
  if (ispy.event_list && ispy.event_index > 0) {
    ispy.event_index--;
    loadEvent();
  }
}

function nextSelectedEvent() {
  let selectedEvents = getPassingEvents();
  if (selectedEvents.length === 0) {
    return;
  }

  let currentEvent = ispy.event_index;
  let currentIndex = selectedEvents.indexOf(currentEvent.toString());
  let nextIndex;
  if (currentIndex === -1) {
    nextIndex = selectedEvents.reduce(
      (nearestIndex, currentValue, currentIndex) => {
        return Math.abs(Number(currentValue) - currentIndex) <
          Math.abs(Number(selectedEvents[nearestIndex]) - currentIndex)
          ? currentIndex
          : nearestIndex;
      },
      0
    );
  } else {
    nextIndex = currentIndex + 1;
  }
  if (selectedEvents.length !== 0) {
    nextIndex = selectedEvents[nextIndex % selectedEvents.length];
    ispy.event_index = Number(nextIndex);
    loadEvent();
  }
}

function prevSelectedEvent() {
  let selectedEvents = getPassingEvents();
  if (selectedEvents.length === 0) {
    return;
  }

  let currentEvent = ispy.event_index;
  let currentIndex = selectedEvents.indexOf(currentEvent.toString());
  let nextIndex;
  if (currentIndex === -1) {
    nextIndex = selectedEvents.reduce(
      (nearestIndex, currentValue, currentIndex) => {
        return Math.abs(Number(currentValue) - currentIndex) <
          Math.abs(Number(selectedEvents[nearestIndex]) - currentIndex)
          ? currentIndex
          : nearestIndex;
      },
      0
    );
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

function selectLocalFile(index: number) {
  if (!ispy.local_files) {
    alert("No local files loaded!");
    return;
  }
  var reader = new FileReader();
  ispy.file_name = ispy.local_files[index].name;

  reader.onload = function (e: ProgressEvent<FileReader>) {
    var data = e.target!.result;
    var zip = new JSZip(data);
    var event_list: string[] = [];

    $.each(zip.files, function (index, zipEntry) {
      if (zipEntry._data !== null && zipEntry.name !== "Header") {
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
  };

  reader.onerror = function (e) {
    alert(e);
  };

  reader.readAsArrayBuffer(ispy.local_files[index]);
}

function updateLocalFileList(list: FileList) {
  clearTable("browser-files");
  let tbl = getHTMLObject("browser-files") as HTMLTableElement;

  for (let i = 0; i < list.length; i++) {
    let name = list[i].name;
    let row = tbl.insertRow(tbl.rows.length);
    let cell = row.insertCell(0);
    let cls = "file";

    cell.innerHTML =
      '<a id="browser-file-' +
      i +
      '" class="' +
      cls +
      '" onclick="selectLocalFile(\'' +
      i +
      "');\">" +
      name +
      "</a>";
  }
}

function loadLocalFiles() {
  if (!hasFileAPI()) {
    var err_msg =
      "Sorry. You seeem to be using a browser that does not support FileReader API. ";
    err_msg +=
      "Please try with Chrome (6.0+), Firefox (3.6+), Safari (6.0+), or IE (10+). ";
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

  let files = (getHTMLObject("local-files") as HTMLInputElement).files;
  if (!files || files.length === 0) {
    alert("Please select a file to load!");
    return;
  }
  ispy.local_files = files;
  updateLocalFileList(ispy.local_files);
  ispy.loaded_local = true;
  openDialog("#files");
}

function loadDroppedFile(file: File) {
  var reader = new FileReader();
  ispy.file_name = file.name;

  //getHTMLObject('loading').style.display = 'block';
  $("#loading").modal("show");

  reader.onload = function (e) {
    var data = e.target!.result;
    var zip = new JSZip(data);

    var event_list: string[] = [];

    $.each(zip.files, function (index, zipEntry) {
      if (zipEntry._data !== null && zipEntry.name !== "Header") {
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
  };

  reader.onerror = function (e) {
    alert(e);
  };

  reader.readAsArrayBuffer(file);
}

function selectFile(filename: string) {
  clearTable("browser-events");

  var new_file_name = filename.split("/")[2]; // of course this isn't a general case for files
  ispy.file_name = new_file_name;

  //getHTMLObject('progress').style.display = 'block';
  $("#progress").modal("show");

  var xhr = new XMLHttpRequest();
  xhr.open("GET", filename, true);
  xhr.overrideMimeType("text/plain; charset=x-user-defined");

  clearTable("browser-events");
  var ecell = (getHTMLObject("browser-events") as HTMLTableElement)
    .insertRow(0)
    .insertCell(0);
  ecell.innerHTML = "Loading events...";

  xhr.onprogress = function (evt) {
    if (evt.lengthComputable) {
      var percentComplete = Math.round((evt.loaded / evt.total) * 100);
      $(".progress-bar").attr("style", "width:" + percentComplete + "%;");
      $(".progress-bar").html(percentComplete + "%");
    }
  };

  xhr.onreadystatechange = function () {
    if (this.readyState === 4) {
      //getHTMLObject('progress').style.display = 'none';

      let progress_bars = document.querySelectorAll("progress-bar");
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
      var zip = JSZip(xhr.responseText);
      var event_list: string[] = [];

      $.each(zip.files, function (index, zipEntry) {
        if (zipEntry._data !== null && zipEntry.name !== "Header") {
          event_list.push(zipEntry.name);
        }
      });

      ispy.event_list = event_list;
      ispy.event_index = 0;
      updateEventList();
      ispy.ig_data = zip;
    }
  };

  xhr.send();
}

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

  let tbl = getHTMLObject("browser-files") as HTMLTableElement;

  for (let i = 0; i < web_files.length; i++) {
    let e = web_files[i];
    let name = e.split("/")[2];
    let row = tbl.insertRow(tbl.rows.length);
    let cell = row.insertCell(0);
    let cls = "file";

    cell.innerHTML =
      '<a id="browser-file-' +
      i +
      '" class="' +
      cls +
      '" onclick="selectFile(\'' +
      e +
      "');\">" +
      name +
      "</a>";
  }
}

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

  let tbl = getHTMLObject("obj-files") as HTMLTableElement;

  for (let i = 0; i < gltf_files.length; i++) {
    let e = gltf_files[i];
    let name = e.split("/")[3];
    let row = tbl.insertRow(tbl.rows.length);
    let cell = row.insertCell(0);
    let cls = "file";

    cell.innerHTML =
      '<a id="browser-file-' +
      i +
      '" class="' +
      cls +
      '" onclick="selectGLTF(\'' +
      name +
      "');\">" +
      name +
      "</a>";
  }
}

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

  let tbl = getHTMLObject("obj-files") as HTMLTableElement;

  for (let i = 0; i < obj_files.length; i++) {
    let e = obj_files[i];
    let name = e.split("/")[3];
    let row = tbl.insertRow(tbl.rows.length);
    let cell = row.insertCell(0);
    let cls = "file";

    cell.innerHTML =
      '<a id="browser-file-' +
      i +
      '" class="' +
      cls +
      '" onclick="selectObj(\'' +
      name +
      "');\">" +
      name +
      "</a>";
  }
}

function readOBJ(file: File, cb: (contents: string, name: string) => void) {
  var reader = new FileReader();

  reader.onload = function (e) {
    //getHTMLObject('loading').style.display = 'none';
    $("#loading").modal("hide");
    cb(e.target!.result as string, file.name);
  };

  reader.onerror = function (e) {
    alert(e);
  };

  reader.readAsText(file);
}

function loadOBJ(contents: string, name: string) {
  let object = new OBJLoader().parse(contents);
  object.name = name;

  (object.children as THREE.Mesh[]).forEach(function (c) {
    changeMeshMaterials(c.material, (m) => {
      m.transparent = true;
      m.opacity = ispy.importTransparency;
    });
  });
  if (ispy.scene) {
    ispy.scene.getObjectByName("Imported")!.add(object);
  }
  addSelectionRow("Imported", object.name, object.name, [], true);
}

function readOBJMTL(
  file: File,
  mtl_file: File,
  cb: (obj: string, mtl_file: File, name: string) => void
) {
  let reader = new FileReader();

  reader.onload = function (e) {
    cb(e.target!.result as string, mtl_file, file.name);
  };

  reader.onerror = function (e) {
    alert(e);
  };

  reader.readAsText(file);
}

function loadOBJMTL(obj: string, mtl_file: File, name: string) {
  let object = new OBJLoader().parse(obj);
  let reader = new FileReader();

  reader.onload = function (e) {
    // let mtl = e.target.result;
    let materials_creator = new MTLLoader().parse(e.target!.result as string, "");
    materials_creator.preload();

    object.traverse(function (o) {
      if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
        if (o.material.name) {
          var material = materials_creator.create(o.material.name);

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

    if (ispy.scene) {
      ispy.scene.getObjectByName("Imported")!.add(object);
    }
    addSelectionRow("Imported", name, name, [], true);
  };

  reader.readAsText(mtl_file);
}

function importModel() {
  if (!hasFileAPI()) {
    var err_msg =
      "Sorry. You seeem to be using a browser that does not support FileReader API. ";
    err_msg +=
      "Please try with Chrome (6.0+), Firefox (3.6+), Safari (6.0+), or IE (10+). ";
    err_msg += "Alternatively, open a file from the web. ";
    alert(err_msg);

    return;
  }

  let files = (getHTMLObject("import-file") as HTMLInputElement).files;
  if (!files || files.length === 0) {
    alert("Please select a file to load!");
    return;
  }
  let extension, file_name;

  if (files.length === 1) {
    // If one file we assume it's an obj file and load it

    file_name = files[0].name;
    extension = file_name.split(".").pop()!.toLowerCase();

    if (extension !== "obj") {
      alert(
        'The file you attempted to load: "' +
          file_name +
          '" does not appear (at least from the extension) to be an .obj file!'
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

    let ext1 = files[0].name.split(".").pop()!.toLowerCase();
    let ext2 = files[1].name.split(".").pop()!.toLowerCase();

    if (ext1 === "obj" && ext2 === "mtl") {
      obj_file = files[0];
      mtl_file = files[1];
    } else if (ext1 === "mtl" && ext2 === "obj") {
      obj_file = files[1];
      mtl_file = files[0];
    } else {
      alert(
        "For now, this application supports either loading one .obj file or loading an .obj file and a corresponding .mtl file!"
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
      "For now, this application supports either loading one .obj file or loading an .obj file and a corresponding .mtl file!"
    );
    return;
  }
}

function selectGLTF(gltf_file: string) {
  getHTMLObject("selected-obj").innerHTML = gltf_file;
  getHTMLObject("load-obj").classList.remove("disabled");

  //$('#selected-obj').html(gltf_file);
  //$('#load-obj').removeClass('disabled');

  ispy.selected_gltf = gltf_file;
}

function loadSelectedGLTF() {
  let name = ispy.selected_gltf.split(".")[0];
  let gltf_file = "./geometry/gltf/" + ispy.selected_gltf;

  const gltf_loader = new GLTFLoader();

  gltf_loader.load(gltf_file, function (gltf) {
    let object = gltf.scene.children[0];

    (object.children as THREE.Mesh[]).forEach(function (c) {
      changeMeshMaterials(c.material, (m) => {
        m.clippingPlanes = ispy.local_planes;
      });
    });

    if (ispy.scene) {
      ispy.scene.getObjectByName("Imported")!.add(object);
    }
    addSelectionRow("Imported", name, name, [], true);
  });
}

function selectObj(obj_file: string) {
  getHTMLObject("selected-obj").innerHTML = obj_file;
  getHTMLObject("load-obj").classList.remove("disabled");

  //$('#selected-obj').html(obj_file);
  //$('#load-obj').removeClass('disabled');

  ispy.selected_obj = obj_file;
}

function loadSelectedObj() {
  var name = ispy.selected_obj.split(".")[0];
  var obj_file = "./geometry/obj/" + ispy.selected_obj;
  var mtl_file = "./geometry/obj/" + name + ".mtl";

  loadOBJMTL_new(obj_file, mtl_file, name, name, "Imported", true);
}

function loadOBJMTL_new(
  obj_file: string,
  mtl_file: string,
  id: string,
  name: string,
  group: string,
  show: boolean
) {
  var mtl_loader = new MTLLoader();

  mtl_loader.load(mtl_file, function (materials) {
    materials.preload();

    var obj_loader = new OBJLoader();
    obj_loader.setMaterials(materials);

    obj_loader.load(obj_file, function (object) {
      object.name = id;
      object.visible = show;
      disabled[object.name] = false;

      (object.children as THREE.Mesh[]).forEach(function (c) {
        changeMeshMaterials(c.material, (m) => {
          m.transparent = true;
          m.opacity = ispy.importTransparency;
          m.clippingPlanes = ispy.local_planes;
        });
      });

      if (ispy.scene) {
        ispy.scene.getObjectByName(group)!.add(object);
      }
      addSelectionRow(group, object.name, name, [], show);
    });
  });

  return;
}

function importBeampipe() {
  loadOBJMTL_new(
    "./geometry/obj/beampipe.obj",
    "./geometry/obj/beampipe.mtl",
    "BeamPipe",
    "Beam Pipe",
    "Imported",
    true
  );
}

function importDetector() {
  if (! ispy.scenes) {
    alert("No scene(s) loaded!");
    return;
  }
  const gltf_loader = new GLTFLoader();

  const gltf_objs = [
    {
      id: "PixelBarrel3D_V1",
      name: "Pixel Barrel",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/PixelBarrel3D_V2.glb", // V2 for pixels corresponds to phase 1 upgrade
    },
    {
      id: "PixelEndcapPlus3D_V1",
      name: "Pixel Endcap (+)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/PixelEndcapPlus3D_V2.glb",
    },
    {
      id: "PixelEndcapMinus3D_V1",
      name: "Pixel Endcap (-)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/PixelEndcapMinus3D_V2.glb",
    },
    {
      id: "SiStripTIB3D_V1",
      name: "Tracker Inner Barrel",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/SiStripTIB3D_V1.glb",
    },
    {
      id: "SiStripTOB3D_V1",
      name: "Tracker Outer Barrel",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/SiStripTOB3D_V1.glb",
    },
    {
      id: "SiStripTIDPlus3D_V1",
      name: "Tracker Inner Detector (+)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/SiStripTIDPlus3D_V1.glb",
    },
    {
      id: "SiStripTIDMinus3D_V1",
      name: "Tracker Inner Detector (-)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/SiStripTIDMinus3D_V1.glb",
    },
    {
      id: "SiStripTECPlus3D_V1",
      name: "Tracker Endcap (+)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/SiStripTECPlus3D_V1.glb",
    },
    {
      id: "SiStripTECMinus3D_V1",
      name: "Tracker Endcap (-)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/SiStripTECMinus3D_V1.glb",
    },
    {
      id: "EcalBarrel3D_V1",
      name: "ECAL Barrel",
      group: "Detector",
      show: true,
      view: "3D",
      file: "./geometry/gltf/EcalBarrel3D_V2.glb",
    },
    {
      id: "EcalEndcapPlus3D_V1",
      name: "ECAL Endcap (+)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/EcalEndcapPlus3D_V1.glb",
    },
    {
      id: "EcalEndcapMinus3D_V1",
      name: "ECAL Endcap (-)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/EcalEndcapMinus3D_V1.glb",
    },
    {
      id: "HcalBarrel3D_V1",
      name: "HCAL Barrel",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/HcalBarrel3D_V1.glb",
    },
    {
      id: "HcalOuter3D_V1",
      name: "HCAL Outer",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/HcalOuter3D_V1.glb",
    },
    {
      id: "HcalEndcapPlus3D_V1",
      name: "HCAL Endcap (+)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/HcalEndcapPlus3D_V1.glb",
    },
    {
      id: "HcalEndcapMinus3D_V1",
      name: "HCAL Endcap (-)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/HcalEndcapMinus3D_V1.glb",
    },
    {
      id: "HcalForwardPlus3D_V1",
      name: "HCAL Forward (+)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/HcalForwardPlus3D_V1.glb",
    },
    {
      id: "HcalForwardMinus3D_V1",
      name: "HCAL Forward (-)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/HcalForwardMinus3D_V1.glb",
    },
    {
      id: "GEMPlus3D_V1",
      name: "Gas Electron Multipliers (+)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/GEMPlus3D_V1.glb",
    },
    {
      id: "GEMMinus3D_V1",
      name: "Gas Electron Multipliers (-)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/GEMMinus3D_V1.glb",
    },
    {
      id: "CSCPlus3D_V1",
      name: "Cathode Strip Chambers (+)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/CSCPlus3D_V1.glb",
    },
    {
      id: "CSCMinus3D_V1",
      name: "Cathode Strip Chambers (-)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/CSCMinus3D_V1.glb",
    },
    {
      id: "DTs3D_V1",
      name: "Drift Tubes",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/DTs3D_V1.glb",
    },
    {
      id: "RPCBarrel3D_V1",
      name: "Resistive Plate Chambers (barrel)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/RPCBarrel3D_V1.glb",
    },
    {
      id: "RPCPlusEndcap3D_V1",
      name: "Resistive Plate Chambers (+)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/RPCPlusEndcap3D_V1.glb",
    },
    {
      id: "RPCMinusEndcap3D_V1",
      name: "Resistive Plate Chambers (-)",
      group: "Detector",
      show: false,
      view: "3D",
      file: "./geometry/gltf/RPCMinusEndcap3D_V1.glb",
    },
    {
      id: "RhoZ",
      name: "RhoZ",
      group: "Detector",
      show: true,
      view: "RhoZ",
      file: "./geometry/gltf/RhoZ_V2.glb",
    },
    {
      id: "RPhi",
      name: "RPhi",
      group: "Detector",
      show: true,
      view: "RPhi",
      file: "./geometry/gltf/RPhi_V2.glb",
    },
  ];

  //getHTMLObject('loading').style.display = 'block';
  $("#loading").modal("show");

    for (let g of gltf_objs) {
      gltf_loader.load(
        g.file,

        function (gltf) {
            let object = gltf.scene.children[0] as THREE.Object3D & { view?: string };

          object.name = g.id;
          object.visible = g.show;
          object.view = g.view;

          // Set render order for geometries
          // Otherwise they won't appear "in-front" of Imported geometries
          (object.children as THREE.LineSegments[]).forEach(function (c) {
            c.renderOrder = 1;
            changeMeshMaterials(c.material, (m: THREE.Material) => {
              m.clippingPlanes = ispy.local_planes;
            });
          });

          disabled[object.name] = !g.show;
          ispy.scenes[object.view].getObjectByName(g.group)!.add(object);

          // For now do not add RPhi and RhoZ selection options to
          // the controls GUI

          if (!(object.name === "RPhi" || object.name === "RhoZ"))
            addSelectionRow(g.group, object.name, g.name, [], g.show);
        }
      );
    };

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
