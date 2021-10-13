import { SimulationNodeDatum } from 'd3';
import { Patent } from '@/models/Patent';

export interface PatentNode extends SimulationNodeDatum {
    id: string;
    patent: Patent;
}
