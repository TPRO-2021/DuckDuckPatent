import { Patent } from '@/models/Patent';

/**
 * A saved patent as it can be found in the saved page. Apart from the patent it also contains
 * the searched terms
 */
export interface SavedPatent {
    patent: Patent;
    searchTerms: string[];
}
