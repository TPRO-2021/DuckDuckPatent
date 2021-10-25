import { SimulationNodeDatum } from 'd3';
import { Patent } from '@/models/Patent';

export interface VisualPatentNode extends SimulationNodeDatum {
    id: string;
    patent: Patent;
    type: 'patent' | 'author' | 'citation' | 'company';
    color: string;
    size: number;
}
