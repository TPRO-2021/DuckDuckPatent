import { SimulationNodeDatum } from 'd3';
import { Patent } from '@/models/Patent';
import { NodeType } from '@/models/NodeType';

export interface VisualPatentNode extends SimulationNodeDatum {
    id: string;
    patent: Patent;
    type: NodeType;
    size: number;
}
