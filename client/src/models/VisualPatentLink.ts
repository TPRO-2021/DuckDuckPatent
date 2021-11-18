import { SimulationLinkDatum } from 'd3';

/**
 * This model represents VisualPatentLink which can be used in a d3 simulation as a Link
 */
export interface VisualPatentLink<T> extends SimulationLinkDatum<T> {
    target: T;
    source: T;
    type: string;
}
