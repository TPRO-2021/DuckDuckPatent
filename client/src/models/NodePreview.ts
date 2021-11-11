import { Patent } from './Patent';

/**
 * Preview for non-patents(citation, author, companies) node
 */
export interface NodePreview {
    id: string;
    title: string;
    subTitle: string;
    type: string;
    relatedPatents: Patent[];
}
