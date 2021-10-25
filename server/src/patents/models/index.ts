/**
 * This interface describes the structure of the response which is
 */
export interface PatentAPIResponse {
    'ops:world-patent-data': {
        'ops:biblio-search': {
            '@total-result-count': string;
            'ops:query': {
                $: string;
                '@syntax': string;
            };
            'ops:range': {
                '@begin': string;
                '@end': string;
            };
            'ops:search-result': {
                'exchange-documents': { 'exchange-document': OpsExchangeDocument }[];
            };
        };
    };
}

/**
 * Interface which describes a string as it is provided by OPS
 */
export interface OpsStringData {
    $: string;
}

/**
 * Interface which describes the document id retrieved from OPS
 */
export interface OpsDocumentId {
    '@document-id-type': string;
    'doc-number': OpsStringData;
    name: OpsStringData;
    date: OpsStringData;
    country?: OpsStringData;
    kind?: OpsStringData;
}

/**
 * Interface which represents the patent abstract from OPS
 */
export interface OpsAbstract {
    '@lang': string;
    p: OpsStringData;
}

/**
 * Interface which represents the exchange-document from OPS
 */
export interface OpsExchangeDocument {
    '@system': string;
    '@family-id': string;
    '@country': string;
    '@doc-number': string;
    '@kind': string;
    'bibliographic-data': OpsBiblioData;
    abstract: OpsAbstract | OpsAbstract[];
}

/**
 * Interface representing OPS citation data
 */
export interface OpsCitation {
    '@cited-phase': string;
    '@cited-by': string;
    '@sequence': string;
    '@office': string;
    patcit: {
        '@dnum-type': string;
        '@num': string;
        'document-id': OpsDocumentId[];
    };
    category: OpsStringData[];
    'rel-claims': OpsStringData[];
    'rel-passage': {
        passage: OpsStringData;
    };
}

/**
 * Interface for OPS biblio-data
 */
export interface OpsBiblioData {
    'publication-reference': {
        'document-id': any[];
    };
    'patent-classifications': {
        'patent-classification': OpsClassifications[];
    };
    parties: OpsParty;
    'invention-title': OpsPatentTitle | OpsPatentTitle[];

    'references-cited': { citation: OpsCitation[] };
}

/**
 * Interface for OPS patent-classifications
 *
 * TODO: Describe purpose!
 */
export interface OpsClassifications {
    '@sequence': string;
    'classification-scheme': {
        '@office': string;
        '@scheme': string;
    };
    section: OpsStringData;
    class: OpsStringData;
    subclass: OpsStringData;
    'main-group': OpsStringData;
    subgroup: OpsStringData;
    'classification-value': OpsStringData;
    'generating-office': OpsStringData;
}

export interface OpsPatentTitle {
    $: string;
    '@lang': string;
}
export interface OpsParty {
    inventors: { inventor: OpsInventor[] };
    applicants: { applicant: OpsApplicant[] };
}
export interface OpsInventor {
    'inventor-name': { name: { $: string } };
}
export interface OpsApplicant {
    'applicant-name': { name: { $: string } };
}

/**
 * Interface which represents the patent which is returned to the client
 */
export interface Patent {
    id: string;
    title?: string;
    citations?: Patent[];
    abstract?: string;
}

/**
 * This interface represents the structure of the DuckDuckPatent API response
 */
export interface QueryResult {
    patents: Patent[];
    total: number;
}

/**
 * This interface represents the structure of the auth response from
 * OPS
 */
export interface AuthResponse {
    refresh_token_expires_in: string;
    api_product_list: string;
    api_product_list_json: string[];
    organization_name: string;
    'developer.email': string;
    token_type: string;
    issued_at: string;
    client_id: string;
    access_token: string;
    application_name: string;
    scope: string;
    expires_in: string;
    refresh_count: string;
    status: string;
}
