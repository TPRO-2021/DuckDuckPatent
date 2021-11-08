import { Patent } from './Patent';

export interface NodePreview {
    id: string;
    title: string;
    subTitle: string;
    type: string;
    relatedPatents: Patent[];
}
