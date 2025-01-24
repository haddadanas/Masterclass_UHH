ispy.invertColors = function() {

    ispy.inverted_colors = ! ispy.inverted_colors;

    ! ispy.inverted_colors ?  ispy.renderer.setClearColor(0x232323,1) : ispy.renderer.setClearColor(0xefefef,1);

    let body = document.querySelector('body');
    body.classList.toggle('white');
    body.classList.toggle('black');

    let ids = [
	'event-info', 'titlebar', 'toolbar',
	'display', 'browser-table',
	'browser-files', 'obj-table', 'obj-files'
    ];

    ids.forEach(id => {

	let el = document.getElementById(id);

	el.classList.toggle('white');
	el.classList.toggle('black');

    });

    let selectors = [
	'#browser-table th',
	'#obj-table th', '.modal-content', '.modal-title',
	'#table-data-eventObject'
    ];

    selectors.forEach(sels => {

	document.querySelectorAll(sels).forEach(s => {

	    s.classList.toggle('white');
	    s.classList.toggle('black');

	});

    });

};

ispy.setTransparency = function(t) {

    ispy.importTransparency = t;

    document.getElementById('trspy').innerHTML = t;

    let imported = ispy.scene.getObjectByName('Imported');

    imported.children.forEach(function(obj) {

	obj.children.forEach(function(c) {

	    c.material.transparent = true;
	    c.material.opacity = t;

	});

    });

};

ispy.updateRendererInfo = function() {

    var info = ispy.renderer.info;

    var html = "<strong>"+ ispy.renderer_name + " info: </strong>";

    html += "<dl>";
    html += "<dt><strong> render </strong></dt>";

    for ( let prop in info.render ) {

	html += "<dd>" + prop + ": " + info.render[prop] + "</dd>";

    }

    if ( info.memory ) {

	html += "<dt><strong> memory </strong></dt>";

	for ( let prop in info.memory ) {

	    html += "<dd>" + prop + ": " + info.memory[prop] + "</dd>";

	}

    }

    document.getElementById('renderer-info').innerHTML = html;

};

ispy.updateRenderer = function(type) {

    if ( type === ispy.renderer_name ) {

	alert(type + ' is already in use');
	return;

    }

    if ( type === 'WebGLRenderer' ) {

	if ( ! ispy.hasWebGL() ) {

	    alert('WebGL is not available');

	}

    }

    document.getElementById('display').removeChild(ispy.renderer.domElement);
    document.getElementById('axes').removeChild(ispy.inset_renderer.domElement);

    ispy.useRenderer(type);

    var controls = new THREE.TrackballControls(ispy.camera, ispy.renderer.domElement);
    controls.rotateSpeed = 3.0;
    controls.zoomSpeed = 0.5;
    ispy.controls = controls;

    ispy.updateRendererInfo();

};

ispy.onWindowResize = function() {

    let display = document.getElementById('display');
    display.removeAttribute('style');

    let w = display.clientWidth;
    let h = display.clientHeight;

    if ( ispy.is_perspective ) {

	ispy.camera.aspect = w/h;

    } else {

	ispy.camera.left = -w/2;
	ispy.camera.right = w/2;
	ispy.camera.top = h/2;
	ispy.camera.bottom = -h/2;

    }

    ispy.camera.updateProjectionMatrix();
    ispy.renderer.setSize(w,h);
    ispy.render();

};

// Given an object3d this returns the ids of its children
ispy.getObjectIds = function(obj) {

    const ids = [];

    obj.children.forEach(function(c) {

	    ids.push(c.id);

	});

    return ids;

};

ispy.onMouseMove = function(e) {

    e.preventDefault();

    const container = document.querySelector('canvas');

    const display = document.getElementById('display');
    const w = display.clientWidth;
    const h = display.clientHeight;

    const doc = document.documentElement;
    const left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    const top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

    const offsetX = display.getBoundingClientRect().left + window.pageXOffset - left;
    const offsetY = display.getBoundingClientRect().top + window.pageYOffset - top;

    const pointer = new THREE.Vector2();

    pointer.x = ((e.clientX-offsetX) / w)*2 - 1;
    pointer.y = -((e.clientY-offsetY) / h)*2 +1;

    ispy.raycaster.setFromCamera(pointer, ispy.camera);
    const intersects = ispy.raycaster.intersectObject(ispy.scene.getObjectByName("Physics"), true);

    if ( ispy.intersected ) {

	// Undo selection stuff

	document.body.style.cursor = 'auto';

	// ispy.highlightTableRow(ispy.intersected.name, ispy.intersected.userData, false);

	if ( ! ispy.intersected.selected ) {

	    const original_color = new THREE.Color(
		ispy.event_description[ispy.current_view][ispy.intersected.name].style.color
	    );

	    ispy.intersected.material.color = original_color;

	} else {

	    ispy.intersected.material.color.setHex(0xcccccc);

	}

	ispy.intersected = null;

    }

    if ( intersects.length > 0 ) {

	const res = intersects.filter(function(res) {

	    return res && res.object;

	})[0];

	if ( res && res.object ) {

	    // Selection stuff happens
	    ispy.intersected = res.object;

	    document.body.style.cursor = 'pointer';

	    var original_color = ispy.intersected.material.color;
	    ispy.intersected.material.color.setHex(0xcccccc);

	}

    if (ispy.showTrackInfo) {
        const intersectedObject = intersects[0].object;
        if (intersectedObject.name.match(/Muon|Electron/i) && intersectedObject.parent.visible) {
            const matchingTrack = ispy.current_event.Collections[intersectedObject.name][intersectedObject.userData.originalIndex];
            const chargeIndex = ispy.current_event.Types[intersectedObject.name].findIndex(type => type[0] === 'charge');
            const bubbleText = `Charge: ${matchingTrack[chargeIndex]}` + '\n' + `Pt: ${intersectedObject.userData.pt.toFixed(2)}`;

            // Remove existing bubble if any
            const existingBubble = document.querySelector('.bubble');
            if (existingBubble) {
                existingBubble.remove();
            }

            // Create a new bubble
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.innerText = bubbleText;
            document.body.appendChild(bubble);

            // Position the bubble at the cursor position
            bubble.style.left = `${pointer.x * window.innerWidth / 2 + window.innerWidth / 2}px`;
            bubble.style.top = `${-pointer.y * window.innerHeight / 2 + window.innerHeight / 2}px`;
        }
        else {
            // Remove existing bubble if any
            const existingBubble = document.querySelector('.bubble');
            if (existingBubble) {
                existingBubble.remove();
            }
        }
    }
    }

};

ispy.selected_objects = new Map();
ispy.hidden_objects = [];

ispy.onMouseDown = function(e) {

    if ( ispy.intersected ) {

	// We only want to do this for muons and electrons since
	// it's only to show what objects are selected for invariant mass.
	if ( ispy.intersected.name.includes('Muon') ||
	     ispy.intersected.name.includes('Electron') ) {

	    if ( ispy.intersected.selected ) {

		const original_color = new THREE.Color(
		    ispy.event_description[ispy.current_view][ispy.intersected.name].style.color
		);

		ispy.intersected.material.color = original_color;
		ispy.intersected.selected = false;

		if ( ispy.selected_objects.has(ispy.intersected.id) ) {

		    ispy.selected_objects.delete(ispy.intersected.id);

		}


	    } else {

		ispy.intersected.material.color.setHex(0x808080);
		ispy.intersected.selected = true;
		ispy.displayEventObjectData();

	    }

	}

    ispy.subfoldersReduced['Info'][1].setValue(ispy.selected_objects.size);

    }

};

document.addEventListener('keyup', function(e) {

    if ( e.shiftKey || e.key  === 'Shift' ) {

	ispy.shift_pressed = false;

    }

});

document.addEventListener('keydown', function(e) {

    // Instead of a button, make output of 3D to JSON a "secret" key binding
    // If shift + e then export
    if ( e.which === 69 && e.shiftKey ) {

	ispy.exportScene();

    }

    // up arrow
    if ( e.which === 38 && e.shiftKey ) {

	ispy.zoomIn();

    }

    // down
    if ( e.which === 40 && e.shiftKey ) {

	ispy.zoomOut();

    }

    // right
    if ( e.which === 39 ) {

	ispy.nextEvent();

    }

    // left
    if ( e.which === 37 ) {

	ispy.prevEvent();

    }

    // shift+a to toggle animation
    if ( e.which === 65 && e.shiftKey ) {

	ispy.toggleAnimation();

    }

    if ( e.shiftKey || e.key === 'Shift' ) {

	ispy.shift_pressed = true;

    }

    // M
    if ( e.which === 77 ) {

	ispy.showMass();

    }

    // H
    if ( e.which === 72 ) {

	ispy.hide = true;

	if ( ispy.intersected && ispy.intersected.name.includes('Jet') ) {

	    ispy.intersected.material.color = new THREE.Color(
		ispy.event_description[ispy.current_view][ispy.intersected.name].style.color
	    );

	    ispy.intersected.visible = false;
	    ispy.hidden_objects.push(ispy.intersected);

	}

    }

    // S
    if ( e.which === 83 ) {

	ispy.show = true;

	const hidden_object = ispy.hidden_objects.pop();

	if ( hidden_object ) {

	    hidden_object.visible = true;

	}

    }

});

const mMuon2 = 0.10566*0.10566;
const mElectron2 = 0.511e-3*0.511e-3;


ispy.showMass = function() {

    var m = 0;
    var sumE = 0;
    var sumPx = 0;
    var sumPy = 0;
    var sumPz = 0;

    ispy.selected_objects.forEach(function(o, key) {

	sumE  += o.four_vector.E;
	sumPx += o.four_vector.px;
	sumPy += o.four_vector.py;
	sumPz += o.four_vector.pz;

	// This is cheating. Should get colors from event_description config.
	if ( o.ptype === 'Electron' ) {

	    o.material.color.setHex(0x19ff19);

	}

	if ( o.ptype === 'Muon' ) {

	    o.material.color.setHex(0xff0000);

	}

	o.selected = false;

    });

    m = sumE*sumE;
    m -= (sumPx*sumPx + sumPy*sumPy + sumPz*sumPz);
    m = Math.sqrt(m);

    document.getElementById('invariant-mass').innerHTML = m.toFixed(2);
    //document.getElementById('invariant-mass-modal').style.display = 'block';
    $('#invariant-mass-modal').modal('show');

    ispy.selected_objects.clear();
    ispy.subfoldersReduced['Info'][1].setValue(0);

};

ispy.displayEventObjectData = function() {

    const key = ispy.intersected.name;
    const objectUserData = ispy.intersected.userData;

    let fourVector = getFourVectorByObjectIndex(key, objectUserData);
    let ptype = fourVector.ptype;

    ispy.intersected.four_vector = fourVector;
    ispy.intersected.ptype = ptype;

    ispy.selected_objects.set(ispy.intersected.id, ispy.intersected);

};

// ispy.highlightTableRow = function(key, objectUserData, doEffect) {

//     if ( ( ispy.currentCollection == key && doEffect ) || ! doEffect ) {

// 	var selector = "#" + key.concat(objectUserData.originalIndex);
// 	var row = $(selector);

// 	if ( row ) {

// 	    if ( doEffect ) {

// 		var color = ispy.inverted_colors ? "#dfdfdf" : "#777";
// 		row.css("background-color", color);
// 		//row.scrollintoview();

// 	    } else {

// 		row.removeAttr("style");

// 	    }

// 	}

//     }

// };

ispy.highlightObject = function(objectId) {

    var selected = ispy.scene.getObjectById(Number(objectId), true);

    document.body.style.cursor = "pointer";

    if ( selected ) {

	if ( ispy.highlighted != selected && selected.visible ) {

	    if ( ispy.highlighted ) {

		ispy.highlighted.material.color.setHex(ispy.highlighted.current_color);

	    }

	    ispy.highlighted = selected;
	    ispy.highlighted.current_color = ispy.highlighted.material.color.getHex();
	    ispy.highlighted.material.color.setHex(0xcccccc);

	}

    }

};

ispy.unHighlightObject = function() {

    document.body.style.cursor = "default";

    if ( ispy.highlighted ) {

	ispy.highlighted.material.color.setHex(ispy.highlighted.current_color);
	ispy.highlighted = null;

    }

};
