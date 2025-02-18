ispy.addGroups = function() {
  // Add option to keep user cuts and preferences when switching between events
  ispy.guiReduced.add({"Keep Settings": false}, "Keep Settings");

  ispy.gui.addFolder("Detector");
  ispy.gui.addFolder("Imported");

  ispy.guiReduced.addFolder("Detector");
  ispy.guiReduced.addFolder("Event Selection");

  // create subfolders to access controllers and objects easily, since we have a lot of them
  ispy.subfolders.Detector = [];
  ispy.subfolders.Imported = [];

  ispy.subfoldersReduced.Detector = [];
  ispy.subfoldersReduced["Controllers"] = [];
  ispy.subfoldersReduced["Info"] = [];
  ispy.subfoldersReduced["Selection"] = [];

  ispy.data_groups.forEach(function(gr) {

    ispy.gui.addFolder(gr);
	
    ispy.subfolders[gr] = [];
	
  });

  ispy.reduced_data_groups.forEach(function(gr) {
    ispy.guiReduced.addFolder(gr.name);
  });
	
};

ispy.clearSubfolders = function() {

  ispy.data_groups.forEach(function(g) {

    let folder = ispy.gui.__folders[g];

    ispy.subfolders[g].forEach(function(s) {
		
	    folder.removeFolder(folder.__folders[s]);
	    
    });

    ispy.subfolders[g] = [];
	    
  });

  ["Controllers", "Info"].forEach(function(g) {
    ispy.subfoldersReduced[g].forEach(function(s) {
      s.remove();
    });
    ispy.subfoldersReduced[g] = [];
  });
};

ispy.toggle = function(key) {

  ispy.disabled[key] = !ispy.disabled[key];

  // For event information we display as simple HTML
  // so therefore not part of the scene
  if ( key.includes("Event") ) {

    let event_text = document.getElementById("event-text");
    if (ispy.disabled[key]) {
      event_text.style.display = "none";
    } else {
      event_text.style.display = "block";
    }
	
  }

  ispy.views.forEach(v => {
	
    let obj = ispy.scenes[v].getObjectByName(key);

    // Not every object (and therefore key) is present in
    // every scene.
    if ( ! obj )
	    return;
	
    obj.visible = !ispy.disabled[key];

    // This is for picking. The raycaster is in layer 2.
    // In-principle this toggle will add other non-pickable
    // objects to the layer but we only check raycasting for
    // Physics objects so this is fine.
    obj.traverse(function(s) {

	    s.layers.toggle(2);

    });

  });
    
};

// In some cases (e.g. animation) we want to explicitly turn some things on/off
// It would probably be nice to: do this by group, support wildcards, etc.
ispy.showObject = function(key, view, show) {

  const obj = ispy.scenes[view].getObjectByName(key);
    
  if ( obj !== undefined ) {
    
    obj.visible = show;
    ispy.disabled[key] = !show;

    let elem = document.getElementById(key);

    if ( elem !== null )
	    elem.checked = show;
	
  }

};

ispy.addSelectionRow = function(group, key, name, objectIds, visible) {

  let opacity = 1.0;
  let color = new THREE.Color();
  let linewidth = 1;
  //   let min_pt = 1.0;
  //   let min_et = 1.0;
  //   let min_energy = 1.0;
  let nobjects = 0;

  view = "3D";
    
  if ( ispy.detector_description[view].hasOwnProperty(key) ) {

    let style = ispy.detector_description[view][key].style;
    opacity = style.opacity;
    color.set(style.color);
	
  }

  if ( ispy.event_description[view].hasOwnProperty(key) ) {
	
    let style = ispy.event_description[view][key].style;

    if ( style.hasOwnProperty("opacity") ) {
	
	    opacity = style.opacity;

    }

    if ( style.hasOwnProperty("color") ) {

	    color.set(style.color);

    }

    if ( style.hasOwnProperty("linewidth") ) {

	    linewidth = style.linewidth;

    }

    if ( ispy.current_event !== undefined ) {

	    nobjects = ispy.current_event.Collections[key].length;
	    
    }
	
  }

  // TO-DO: Fetch pt and et from objects-config
  const row_obj = {
    show: visible,
    number: nobjects,
    key: key,
    opacity: opacity,
    color: "#"+color.getHexString(),
    linewidth: linewidth,
    min_pt: 1.0,
    min_et: 10.0,
    min_energy: 10.0
  };

  const guis = [ispy.gui];
  const subfolders = [ispy.subfolders];
  if ( group.includes("Detector") ) {
    guis.splice(1, 0, ispy.guiReduced);
    subfolders.splice(1, 0, ispy.subfoldersReduced);
  }
  guis.forEach(function(gui_elem) {
    let folder = gui_elem.__folders[group];
    let sf = folder.__folders[name];

    subfolders.forEach(function(subfolder) {
      subfolder[group].push(name);
    });
    
    sf = folder.addFolder(name);

    if ( ! ( group.includes("Detector") ||
	     group.includes("Imported") ||
	     group.includes("Provenance")
	   )
    ) {

      sf.add(row_obj, "number");

    }
    
    // For Provenance, ECAL, etc. show table when clicking on
    // tab for objects in the gui
    if ( group.includes("Provenance") || group.includes("CAL") ||
	 group.includes("Tracking") || group.includes("Muon") ||
	 group.includes("Physics") ) {
	
      sf.domElement.onclick = function(e) {
	    
      };
	
    }

    sf.add(row_obj, "key");
    
    sf.add(row_obj, "show").onChange(function() {

      ispy.toggle(key);

    });

    // Event is not part of the scene and is
    // handled with css so no need for the rest
    if ( key.includes("Event_") || group.includes("Imported") )
      return;

    sf.add(row_obj, "opacity", 0, 1).onChange(function() {
	
      ispy.views.forEach(v => {
	    
	    let obj = ispy.scenes[v].getObjectByName(key);

	    if ( ! obj )
          return;

	    obj.children.forEach(function(o) {

          o.material.opacity = row_obj.opacity;

	    });

      });

    });

    if ( ispy.use_line2 ) {
    
      // This conditional could / should be improved
      if ( key.includes("GEMDigis") || key.includes("GEMSegments") || key.includes("GEMRec") ||
	     key.includes("CSCStrip") || key.includes("CSCSegments") || key.includes("CSCRec") ||
	     key.includes("CSCWire") || key.includes("RPCRec") || key.includes("DTRecSegment") ) {

	    sf.add(row_obj, "linewidth", 1, 5).onChange(function() {

          ispy.views.forEach(v => {
		
		    let obj = ispy.scenes[v].getObjectByName(key);

		    if ( ! obj )
              return;
		    
		    obj.children.forEach(function(o) {
	    
              o.material.linewidth = row_obj.linewidth*0.001;
	    
		    });

          });

	    });
	
      }

    }

    if ( ispy.use_line2 ) {

      if ( key.includes("GlobalMuon") || key.includes("Electron") || key.includes("Photon") ) {
	
	    sf.add(row_obj, "linewidth", 1, 5).onChange(function() {

          ispy.views.forEach(v => {
		
		    let obj = ispy.scenes[v].getObjectByName(key);

		    if ( ! obj )
              return;
		    
		    obj.children.forEach(function(o) {
	    
              o.material.linewidth = row_obj.linewidth*0.001;
	    
		    });

          });

	    });

      }
	
    }

    if ( key.includes("Muons_") || key.includes("Electron") || key.includes("Tracks_") ) {

      sf.add(row_obj, "min_pt").onChange(function() {

	    ispy.views.forEach(v => {
	    
          let obj = ispy.scenes[v].getObjectByName(key);

          if ( ! obj )
		    return;
		
          obj.children.forEach(function(o) {

		    o.visible = o.userData.pt < row_obj.min_pt ? false : true;

          });

	    });

      });

    }

    if ( key.includes("Jet") ) {

      sf.add(row_obj, "min_et").onChange(function() {

	    ispy.views.forEach(v => {
	    
          let obj = ispy.scenes[v].getObjectByName(key);

          if ( ! obj )
		    return;
		
          obj.children.forEach(function(o) {

		    o.visible = o.userData.et < row_obj.min_et ? false : true;
		    
          });

	    });

      });

    }

    if ( key.includes("Photon") ) {

      sf.add(row_obj, "min_energy").onChange(function() {

	    ispy.views.forEach(v => {
	    
          let obj = ispy.scenes[v].getObjectByName(key);

          if ( ! obj )
		    return;
		
          obj.children.forEach(function(o) {

		    o.visible = o.userData.energy < row_obj.min_energy ? false : true;

          });

	    });

      });

    }

    sf.addColor(row_obj, "color").onChange(function() {

      ispy.views.forEach(v => {

	    let obj = ispy.scenes[v].getObjectByName(key);

	    if ( ! obj )
          return;
	    
	    // Change color in event_decription for objects in
	    // Physics group. Once they are picked (i.e. pointer over)
	    // the color will revert to this new one rather than to the original
	    if ( group.includes("Physics") ) {

          ispy.event_description[v][key].style.color = row_obj.color;
		
	    }
	
	    obj.children.forEach(function(o) {

          o.traverse(function(oc) {

		    // Special case to handle
		    if ( oc.type === "ArrowHelper" ||
			 key.includes("MET") ||
			 key.includes("Proton") ) {
		    
              oc.children.forEach(function(og) {

			    og.material.color = new THREE.Color(row_obj.color);

              });
		    
		    } else {
		
              oc.material.color = new THREE.Color(row_obj.color);
			
		    }
		    
          });
	    
	    });
	    
      });

    });
    
  });
};


ispy.addControllers = function(group) {

  //   let color = new THREE.Color();
  //   let linewidth = 1;
  let min_pt = 1.0;
  let jet_min_et = 1.0;
  let nobjects = 0;
  let hidden = false;
  let visible = true;

  const row_obj = {
    number: nobjects,
    min_pt: min_pt,
    Electrons: visible,
    Muons: visible,
    Photons: visible,
    Jets: hidden,
    MET: hidden,
    "Jet: min Et": jet_min_et,
    "Additional Tracks": visible
  };

  gui_elem = ispy.guiReduced;
	
  let folder = gui_elem.__folders[group];

  let names = analysis.getSceneObjects();

  if (group.includes("Momentum Cut (GeV)")) {
    folder.add(row_obj, "min_pt", 0, 100).name(
      "min. p<sub>T, visible</sub>"
    ).onChange(function() {
			
      ispy.views.forEach(v => {
	    
        let physic_objs = [
          ...ispy.scenes[v].getObjectByName("Physics").children,
          ...ispy.scenes[v].getObjectByName("Tracking").children
        ].filter((o) => o.visible && o.children[0].userData.hasOwnProperty("pt"));
				
        if ( ! physic_objs.length )
          return;
				
        physic_objs.forEach(function(obj) {
          obj.children.forEach(function(o) {
						
            o.visible = o.userData.pt < row_obj.min_pt ? false : true;
						
          });
        });
				
      });
			
    });
		
    folder.add(row_obj, "Jet: min Et", 0, 200).name(
      "min. E<sub>T, Jets</sub>"
    ).onChange(function() {

      ispy.views.forEach(v => {
	    
        let physic_objs = ispy.scenes[v].getObjectByName(names["Jets"]).children;

        if ( ! physic_objs.length )
          return;
				
        physic_objs.forEach(function(o) {
					
          o.visible = o.userData.et < row_obj["Jet: min Et"] ? false : true;
					
        });
				
      });
			
    });
  }
		
  if (group.includes("Show/Hide")) {
    folder.add(row_obj, "Electrons").onChange(function() {
      let val = this.getValue();
      ispy.views.forEach(v => {
        electron_obj = ispy.scenes[v].getObjectByName(names["GsfElectrons"]);
        if (!electron_obj) return;
        electron_obj.visible = val;
      });	
    });

    folder.add(row_obj, "Muons").onChange(function() {
      let val = this.getValue();
      ispy.views.forEach(v => {
        ["GlobalMuons", "StandaloneMuons", "TrackerMuons"].forEach(muonType => {
          let muon_obj = ispy.scenes[v].getObjectByName(names[muonType]);
          if (muon_obj) {
            muon_obj.visible = val;
          }
        });
      });	
    });
		
    folder.add(row_obj, "Photons").onChange(function() {
      let val = this.getValue();
      ispy.views.forEach(v => {
        photon_obj = ispy.scenes[v].getObjectByName(names["Photons"]);
        if (!photon_obj) return;
        photon_obj.visible = val;
      });	
    });

    folder.add(row_obj, "Jets").onChange(function() {
      let val = this.getValue();
      ispy.views.forEach(v => {
        jet_obj = ispy.scenes[v].getObjectByName(names["Jets"]);
        if (!jet_obj) return;
        jet_obj.visible = val;
      });	
    });

    folder.add(row_obj, "MET").onChange(function() {
      let val = this.getValue();
      ispy.views.forEach(v => {
        met_obj = ispy.scenes[v].getObjectByName(names["METs"]);
        met_obj.visible = val;
      });	
    });

    folder.add(row_obj, "Additional Tracks").onChange(function() {
      let val = this.getValue();
      ispy.views.forEach(v => {
        tracks = ispy.scenes[v].getObjectByName(names["Tracks"]);
        if (!tracks) return;
        tracks.visible = val;
      });	
    });

  }

  // add all controllers to the reduced subfolders for convenience
  folder.__controllers.forEach(function(c) {
    ispy.subfoldersReduced["Controllers"].push(c);
  });

};

ispy.addInfo = function(group) {

  gui_elem = ispy.guiReduced;
	
  let folder = gui_elem.__folders[group];
	
  let names = analysis.getSceneObjects();
  // pt is element 1 in the collection object (inconvinient definition by design)
  met_pt = ispy.current_event.Collections[names["METs"]][0][1];

  const row_obj = {
    MET: met_pt.toFixed(2) + " GeV",
    Sel: "0",
    track: false,
  };

  folder.add(row_obj, "MET").onFinishChange(function() {
    // reset to original value
    this.setValue(this.initialValue);
  });

  folder.add(row_obj, "Sel").name(
    "Selected Tracks"
  ).onFinishChange(function() {
    // reset to original value
    this.setValue(ispy.selected_objects.size);
  });

  folder.add(row_obj, "track").name(
    "Track Info"
  ).onChange(function() {
    ispy.showTrackInfo = this.getValue();
    removeExistingBubble();
  });

  // add all controllers to the reduced subfolders for convenience
  folder.__controllers.forEach(function(c) {
    ispy.subfoldersReduced["Info"].push(c);
  });

};

ispy.saveCutSettings = function() {
  let settings = {};
  btn = ispy.guiReduced.__controllers.find(o => o.property == "Keep Settings");
  if (btn && btn.getValue()) {
    controllers = ispy.subfoldersReduced["Controllers"];
    controllers.forEach(function(c) {
      settings[c.property] = c.getValue();
    });
  }
  return settings;
};

ispy.applySavedSettings = function(settings) {
  if (!Object.keys(settings).length) {
    return;
  };
  controllers = ispy.subfoldersReduced["Controllers"];
  controllers.forEach(function(c) {
    if (c.property in settings) {
      c.setValue(settings[c.property]);
    }
  });
  return {};
};

