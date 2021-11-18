/**
 ********************************************************
 * OPS related models
 ********************************************************
 */

/**
 * Interface which describes a string as it is provided by OPS
 */
export interface OpsStringData {
    $: string;
}

/**
 * Interface which describes the OPS response for an image query
 */
export interface OpsImageQueryResponse {
    'ops:world-patent-data': {
        'ops:document-inquiry': {
            'ops:publication-reference': OpsPublicationReference;
            'ops:inquiry-result': {
                'publication-reference': OpsPublicationReference;
                'ops:document-instance': OpsDocumentInstance[];
            };
        };
    };
}

/**
 * This interface describes the structure of the OPS response
 */
export interface PatentQueryResponse {
    'ops:world-patent-data': {
        'ops:biblio-search': {
            '@total-result-count': string;
            'ops:query'?: {
                $: string;
                '@syntax': string;
            };
            'ops:range'?: {
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
 * This interface represents the structure of the family response from OPS
 */
export interface PatentFamilyResponse {
    'ops:world-patent-data': {
        'ops:patent-family': {
            '@total-result-count': string;
            'ops:family-member': OpsFamilyMember[];
        };
    };
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

/**
 * This interface represents the structure of an OPS patent object
 */
export interface OpsPatent {
    'ops:world-patent-data': {
        'exchange-documents': {
            'exchange-document': OpsExchangeDocument;
        };
    };
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

/**
 * This interface represents the structure of an OPS-family-member
 */
export interface OpsFamilyMember {
    '@family-id': string;
    'publication-reference': OpsPublicationReference;
    'application-reference': {
        '@doc-id': string;
        '@is-representative': 'YES' | 'NO';
        'document-id': OpsDocumentId;
    };
    'exchange-document': OpsExchangeDocument;
}

/**
 * This interface represents the structure of an OPS-patent title
 */
export interface OpsPatentTitle {
    $: string;
    '@lang': string;
}

/**
 * This interface represents the structure of an OPS-party
 */
export interface OpsParty {
    inventors: { inventor: OpsInventor[] };
    applicants: { applicant: OpsApplicant[] };
}

/**
 * This interface represents the structure of an OPS-inventor
 */
export interface OpsInventor {
    'inventor-name': { name: OpsStringData };
}

/**
 * This interface represents the structure of an OPS-applicant
 */
export interface OpsApplicant {
    'applicant-name': { name: OpsStringData };
}

/**
 * This interface represents the structure of an OPS-publication reference
 */
export interface OpsPublicationReference {
    'document-id': {
        '@document-id-type': 'epodoc' | 'docdb';
        'doc-number': OpsStringData;
        kind: OpsStringData;
        country?: string;
    };
}

/**
 * This interface represents the structure of an OPS-document instance
 */
export interface OpsDocumentInstance {
    '@system': string;
    '@number-of-pages': string;
    '@desc': 'FullDocument' | 'Drawing' | 'FirstPageClipping';
    '@link': string;
    'ops:document-format-options': OpsDocumentFormatOptions;
    'ops:document-section': { '@name': string; '@start-page': string }[];
}

/**
 * This interface represents the structure of the OPS format options
 */
export interface OpsDocumentFormatOptions {
    'ops:document-format': OpsStringData[];
}

/**
 ********************************************************
 * DuckDuckPatent-API related models
 ********************************************************
 */

/**
 * Interface which represents the patent which is returned to the client
 */
export interface Patent {
    id: string;
    title?: string;
    citations?: Patent[];
    abstract?: string;
    familyId?: string;
    inventors?: string[];
    applicants?: string[];
}

/**
 * Interface which represents a document information object
 */
export interface DocumentInformation {
    formats: string[];
    type: string;
    url: string;
    sections: { name: string; startPage: string }[];
    pages: number;
}

/**
 * This interface represents the structure of the DuckDuckPatent API response
 */
export interface QueryResult {
    patents: Patent[];
    total: number;
}

/**
 * This interface represents the possible content of a clients query
 */
export interface PatentSearchQuery {
    keywords: string[] | string;
    page?: string;
    language: string;
    country: string;
    date: string;
    applicant?: string;
    inventor?: string;
}
