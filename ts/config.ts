import {Ispy, Analysis} from './ispy.interfaces';

export const ispy: Ispy = {
    detector: { Collections: {} },
    version: "v1.0.0-UHH (dev)",
    POINT: 0,
    LINE: 1,
    BOX: 2,
    SOLIDBOX: 3,
    SCALEDBOX: 4,
    SCALEDSOLIDBOX: 5,
    SCALEDSOLIDTOWER: 6,
    MODEL: 7,
    ASSOC: 8,
    SHAPE: 9,
    TEXT: 10,
    BUFFERBOX: 11,
    STACKEDTOWER: 12
};

export const analysis: Analysis = {
    file_events_summary: new Map<number, any>()
};