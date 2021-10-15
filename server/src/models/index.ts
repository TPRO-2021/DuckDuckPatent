export interface Patent {
    patent_number: string;
    patent_title: string;
    patent_date: string;
    patent_firstnamed_assignee_country?: string;
    patent_abstract?: string;
    patent_kind?: string;
    patent_num_foreign_citations?: string[];
    patent_type?: string;
}

export interface PatentAPIResponse {
    count: number;
    total_patent_count: number;
    patents: Patent[];
}
