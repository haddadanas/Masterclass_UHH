// Type: TypeScript file
// Description: This file contains utility functions that are used in the analysis code.

import { ParticleCollection, EventObject } from './ispy.interfaces';
import { ispy } from './config';

export function getCurrentIndex(): number {
    return ispy.event_index;
}

export function getCurrentEvent(): EventObject {
    return ispy.current_event;
}

export function getFourVector(
    key: string,
    type: [string, string][],
    eventObjectData: number[],
): ParticleCollection | undefined {
    const isMuon = key.includes('Muon');
    const isElectron = key.includes('Electron');
    const isPhoton = key.includes('Photon');

    if ( ! ( isMuon || isElectron || isPhoton ) ) {

	return;

    }

    let pt: number, eta: number, phi: number, charge: number, ptype: string;
    let E: number, px: number, py: number, pz: number;

    pt = eta = phi = charge = E = 0;
    ptype = '';

    for ( var t in type ) {

	if ( type[t][0] === 'pt' ) {

	    pt = eventObjectData[t];

	} else if ( type[t][0] === 'energy' ) {

        E = eventObjectData[t];
    
    } else if ( type[t][0] === 'eta' ) {

	    eta = eventObjectData[t];

	} else if ( type[t][0] === 'phi' ) {

	    phi = eventObjectData[t];

	} else if ( type[t][0] === 'charge' ) {

        charge = eventObjectData[t];

    }
    }

    if (!pt) {
        pt = E / Math.cosh(eta);
    }

    px = pt*Math.cos(phi);
    py = pt*Math.sin(phi);
    pz = pt*Math.sinh(eta);

    if ( isPhoton ) {
        return {'E':E, 'px':px, 'py':py, 'pz':pz, 'pt': pt, 'ptype': 'Photon'};
    }

    E = 0;

    if ( isMuon ) {

    E += mMuon2;
    ptype = 'Muon';

    }

    if ( isElectron ) {

    E += mElectron2;
    ptype = 'Electron';

    }

    E += pt*pt*Math.cosh(eta)*Math.cosh(eta);
    E = Math.sqrt(E);

    return {'E':E, 'px':px, 'py':py, 'pz':pz, 'pt': pt, 'charge': charge, 'ptype': ptype};
}

export function getFourVectorByObjectIndex(
    key: string,
    objectUserData: {originalIndex: number, [key: string]: any},
): ParticleCollection {
    const type = getCurrentEvent().Types[key];
    const eventObjectData = getCurrentEvent().Collections[key][objectUserData.originalIndex];
    
    let result = ispy.getFourVector(key, type, eventObjectData);
    result['index'] = objectUserData.originalIndex;

    return result;
}

export function getMetInformation(
    type: [string, string][],
    eventObjectData: number[],
): {pt: number, phi: number, [key: string]: number} {
    
    let pt: number, phi: number;
    let px: number, py: number, pz: number;

    pt = phi = px = py = pz = 0;

    for ( var t in type ) {

    if ( type[t][0] === 'pt' ) {

        pt = eventObjectData[t];

    } else if ( type[t][0] === 'phi' ) {

        phi = eventObjectData[t];  // TODO can be removed

    } else if (type[t][0] === 'px') {

        px = eventObjectData[t];

    } else if (type[t][0] === 'py') {

        py = eventObjectData[t];
        
    } else if (type[t][0] === 'pz') {

        pz = eventObjectData[t];
        
    }

    }

    return {'pt': pt, 'px': px, 'py': py, 'pz':pz, 'phi': phi};

};