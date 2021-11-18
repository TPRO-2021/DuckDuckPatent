import { SimulationNodeDatum } from 'd3';
import { Patent } from '@/models/Patent';
import { NodeType } from '@/models/NodeType';

/**
 * This model represents VisualPatentNode which can be used in a d3 simulation as a node
 */
export interface VisualPatentNode extends SimulationNodeDatum {
    id: string;
    patent: Patent;
    type: NodeType;
    size: number;
}
