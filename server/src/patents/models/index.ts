export interface ExtendedPatent {
    '@system': string;
    '@family-id': string;
    '@country': string;
    '@doc-number': string;
    '@kind': string;
    'bibliographic-data': BiblioData;
    abstract: PatentApiAbstract | PatentApiAbstract[];
}
export interface PatentApiAbstract {
    p: { $: string };
    '@lang': string;
}
export interface ExchangeDoc {
    'exchange-document': ExtendedPatent;
}

interface CitDoc {
    'doc-number': { $: string };
    kind: { $: string };
    country: { $: string };
}

export interface Citation {
    '@cited-phase': string;
    patcit: Patcit;
}
export interface Patcit {
    '@dnum-type': string;
    'document-id': CitDoc[];
}
export interface BiblioData {
    parties: Party;
    'invention-title': Title | Title[];
    'references-cited': { citation: Citation[] };
}
export interface Title {
    $: string;
    '@lang': string;
}
export interface Party {
    inventors: { inventor: Inventor[] };
    applicants: { applicant: Applicant[] };
}
export interface Inventor {
    'inventor-name': { name: { $: string } };
}
export interface Applicant {
    'applicant-name': { name: { $: string } };
}
export interface BiblioSeach {
    'ops:search-result': { 'exchange-documents': ExchangeDoc[] };
}

export interface WorldPatent {
    'ops:biblio-search': BiblioSeach;
}
export interface PatentAPIResponse {
    'ops:world-patent-data': WorldPatent;
}
export interface Patent {
    '@country': string;
    '@doc-number': string;
    '@kind': string;
    abstract: string;
    'invention-title': string;
    'inventor-name': string | string[];
    'applicant-name': string;
    // 'doc-number': string;
    // // kind: string;
    // // country: string;
}
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
