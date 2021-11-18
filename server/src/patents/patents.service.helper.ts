import {
    DocumentInformation,
    OpsDocumentInstance,
    OpsExchangeDocument,
    OpsImageQueryResponse,
    OpsStringData,
    Patent,
    PatentQueryResponse,
    QueryResult,
} from './models';

import * as _ from 'lodash';

/**
 * This helper class provides processing functions which can be used to convert ugly OPS responses into a
 * simplified and good looking JSON
 */
export class PatentsServiceHelper {
    /**
     * Processes an OPS query and returns a much cleaner structure with the needed data
     *
     * @param data  The data response from OPS
     * @param languages The optional languages filter
     */
    public static processQuery(data: PatentQueryResponse, languages?: string): QueryResult {
        const searchResult = data['ops:world-patent-data']['ops:biblio-search'];
        const totalCount = data['ops:world-patent-data']['ops:biblio-search']['@total-result-count'];

        // query data can be either an object or an array for some reason. Therefore if it is an object convert it to an array
        let queryData = searchResult['ops:search-result']['exchange-documents'];
        if (!(queryData instanceof Array)) {
            queryData = [queryData];
        }

        // process the documents array
        let processed: OpsExchangeDocument[] | Patent[] = queryData
            .map((item) => ({
                ...item['exchange-document'],
            }))
            // some patents don't have the property 'exchange-document' so we want to filter them out
            .filter((item) => Object.keys(item).length > 0);

        // if no language filter is specified we don't need to filter
        if (languages) {
            // filter for only the existing languages for the title and by default if no filter applied it is English
            processed = processed.filter((item) => {
                let title = item['bibliographic-data']['invention-title'];
                if (!(title instanceof Array)) {
                    title = [title];
                }
                const patentLanguages = title.filter((t) => t).map((translation) => translation['@lang']);
                return patentLanguages.some((lang) => languages.includes(lang));
            });
        }

        // process each document
        processed = processed.map((item) => PatentsServiceHelper.processPatent(item, languages));

        // return patents and total number of available patents
        return {
            patents: processed,
            total: Number(totalCount),
        };
    }

    /**
     * Processes a single OPS patent and returns the sanitized patent as a simple object
     *
     * @param item  The ops document
     * @param languages The (optional) languages which should be preferred
     */
    public static processPatent(item: OpsExchangeDocument, languages = ''): Patent {
        return {
            id: `${item['@country']}${item['@doc-number']}.${item['@kind']}`,
            title: PatentsServiceHelper.getTitle(item, languages),
            citations: PatentsServiceHelper.getCitations(item),
            abstract: PatentsServiceHelper.getAbstract(item, languages),
            familyId: item['@family-id'] || null,
            inventors: PatentsServiceHelper.getNestedArray<string[]>(
                item,
                'bibliographic-data.parties.inventors.inventor',
                (inventors) => {
                    const inventorMap = inventors.reduce((map, inventor) => {
                        const item = map[inventor['@sequence']];

                        if (!item) {
                            map[inventor['@sequence']] = [inventor];
                            return map;
                        }

                        item.push(inventor);
                        return map;
                    }, {});

                    return Object.keys(inventorMap).map((sequence) => inventorMap[sequence][0]['inventor-name'].name.$);
                },
                [] as string[],
            ),
            applicants: PatentsServiceHelper.getNestedArray<string[]>(
                item,
                'bibliographic-data.parties.applicants.applicant',
                (applicants) => {
                    const applicantMap = applicants.reduce((map, applicant) => {
                        const item = map[applicant['@sequence']];

                        if (!item) {
                            map[applicant['@sequence']] = [applicant];
                            return map;
                        }

                        item.push(applicant);
                        return map;
                    }, {});

                    return Object.keys(applicantMap).map(
                        (sequence) => applicantMap[sequence][0]['applicant-name'].name.$,
                    );
                },
                [] as string[],
            ),
        };
    }

    /**
     * Attempts to get the title of a patent from the provided data
     * @param doc   The exchange document
     * @param languages The preferred languages
     * @private
     */
    private static getTitle(doc: OpsExchangeDocument, languages: string): string {
        let titles = doc['bibliographic-data']['invention-title'];

        // some patents don't have a title for some reason
        if (!titles) {
            return 'Unknown Title';
        }

        // In some edge cases it can happen that the title is an object
        if (!(titles instanceof Array)) {
            titles = [titles];
        }
        // filtering for the provided languages
        const titleSupported = titles.find((title) => (languages || '').includes(title['@lang']));

        //if the Title is not existing by default in english or one of the filtered languages return this message
        if (!titleSupported) {
            return titles[0].$;
        }

        return titleSupported.$;
    }

    /**
     * Gets citations from a provided OpsExchangeDocument
     * @param doc   The ops exchange document
     * @private
     */
    private static getCitations(doc: OpsExchangeDocument): Patent[] {
        let citations = doc['bibliographic-data']['references-cited']?.citation;

        // no citations? Return an empty array!
        if (!citations || citations.length === 0) {
            return [] as Patent[];
        }

        // if only one citation is present it will be an object for some weird reason
        if (!(citations instanceof Array)) {
            citations = [citations];
        }

        return (
            citations
                // some patents have citations to non-patent sources. we have to filter those out
                .filter((citation) => citation.patcit)
                .map((citation) => {
                    const docDbId = citation.patcit['document-id'].filter(
                        (docId) => docId['@document-id-type'] === 'docdb',
                    )[0];

                    return {
                        id: `${docDbId.country.$}${docDbId['doc-number'].$}.${docDbId.kind.$}`,
                    };
                }) as Patent[]
        );
    }

    /**
     * Gets the abstract from a provided OpsExchangeDocument
     *
     * @param doc   The exchange document
     * @param languages The preferred languages
     * @private
     */
    private static getAbstract(doc: OpsExchangeDocument, languages: string): string {
        let abstracts = doc.abstract;

        // if no abstract exists we can return unknown abstract
        if (!abstracts) {
            return 'No abstract available';
        }

        // In some edge cases it can happen that the abstract is an object
        if (!(abstracts instanceof Array)) {
            abstracts = [abstracts];
        }

        // filtering for the provided languages
        const abstractSupported = abstracts.find((abstract) => (languages || '').includes(abstract['@lang']));

        //if the abstract is not existing by default in english or one of the filtered languages return this message
        if (!abstractSupported) {
            return abstracts[0].p.$;
        }

        return abstractSupported.p.$;
    }

    /**
     * Attempts to process the passed document according to the passed parameters
     * @param doc   The document
     * @param path  The path where the array data is found
     * @param processingFn  The function which should process the data
     * @param defaultValue  The default value which should be applied when no data was found
     * @private
     */
    private static getNestedArray<T>(doc: any, path: string, processingFn, defaultValue: T): T {
        let instanceArr = _.get(doc, path);

        if (!instanceArr) {
            return defaultValue;
        }

        if (!(instanceArr instanceof Array)) {
            instanceArr = [instanceArr];
        }

        return processingFn(instanceArr);
    }

    /**
     * Compiles an OPS query string based on the provided data
     *
     * @param searchTerms   The search terms which need to be added to the URL
     * @param endpoint      The target endpoint
     * @param page          The page which should be retrieved
     * @param country       The country-filter
     * @param date          The date-filter
     * @param inventor      The inventor
     * @param applicant     The applicant
     * @param pageSize      The page size (default: 100)
     */
    public static getQueryString(
        searchTerms: string[],
        endpoint: string,
        page = 0,
        country = '',
        date = '',
        inventor?: string,
        applicant?: string,
        pageSize = 100,
    ): string {
        let queryString = `${process.env.PATENT_API_URL}`.concat(endpoint);

        // filters array we will use later to add them to the query string
        const filters: string[] = [];

        if (searchTerms) {
            filters.push(`ti%3D ${searchTerms} or ab%3D ${searchTerms}`);
        }

        if (inventor) {
            filters.push(`inventor%3D${inventor}`);
        }

        if (applicant) {
            filters.push(`applicant%3D${applicant}`);
        }

        if (country.trim().length > 0) {
            filters.push(`pn any "${country}"`);
        }

        if (date.trim().length > 0) {
            filters.push(`pd within "${date}"`);
        }

        // add filters array to the query-string
        filters.forEach((filter, index) => {
            if (index === 0) {
                queryString = queryString.concat('?q=').concat(filter);
                return;
            }

            queryString = queryString.concat(' and ').concat(filter);
        });

        return queryString.concat(`&Range=${page * pageSize + 1}-${(page + 1) * pageSize}`);
    }

    /**
     * Restructures an image query to the desired format
     *
     * @param data The OPS-image query response
     */
    public static async processImageQuery(data: OpsImageQueryResponse): Promise<DocumentInformation[]> {
        return PatentsServiceHelper.getNestedArray<OpsDocumentInstance[]>(
            data,
            'ops:world-patent-data.ops:document-inquiry.ops:inquiry-result.ops:document-instance',
            (imageInformation) => imageInformation,
            [],
        ).map((document) => ({
            formats: PatentsServiceHelper.getNestedArray(
                document,
                'ops:document-format-options.ops:document-format',
                (format: OpsStringData[]) => format.map((format) => format.$),
                [],
            ),
            type: (document['@desc'] || 'unknown').toLowerCase(),
            url: document['@link'],
            sections: PatentsServiceHelper.getNestedArray(
                document,
                'ops:document-section',
                (sections: { '@name': string; '@start-page': string }[]) =>
                    sections.map((section) => ({ name: section['@name'], startPage: section['@start-page'] })),
                [],
            ),
            pages: Number(document['@number-of-pages'] || 0),
        }));
    }
}
