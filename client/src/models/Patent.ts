import { CitedPatent } from '@/models/CitedPatent';

/**
 * This interface represents the patent data structure
 */
// export interface Patent {
//     patent_number: string;
//     patent_title: string;
//     patent_date: string;
//     patent_firstnamed_assignee_country?: string;
//     patent_abstract?: string;
//     patent_kind?: string;
//     patent_num_foreign_citations?: string;
//     patent_type?: string;
//     cited_patents: CitedPatent[];
// }
export interface Patent {
    '@country'?: string;
    '@doc-number'?: string;
    '@kind'?: string;
    abstract: string;
    'invention-title'?: string;
    'inventor-name'?: string;
    'applicant-name'?: string;
    //cited_patents: CitedPatent[];
}
