import { SimulationLinkDatum } from 'd3';

export interface VisualPatentLink<T> extends SimulationLinkDatum<T> {
    target: T;
    source: T;
    type: string;
}
