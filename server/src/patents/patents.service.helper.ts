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

export class PatentsServiceHelper {
    /**
     * Processes an OPS query and returns a much cleaner structure with the needed data
     * @param data
     * @param languages
     */
    public static processQuery(data: PatentQueryResponse, languages?: string): QueryResult {
        const searchResult = data['ops:world-patent-data']['ops:biblio-search'];
        const totalCount = data['ops:world-patent-data']['ops:biblio-search']['@total-result-count'];

        let queryData = searchResult['ops:search-result']['exchange-documents'];
        if (!(queryData instanceof Array)) {
            queryData = [queryData];
        }

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

        processed = processed.map((item) => PatentsServiceHelper.processPatent(item, languages));

        return {
            patents: processed,
            total: Number(totalCount),
        };
    }

    /**
     * Processes an OPS patent and returns the sanitized patent form
     * @param item
     * @param languages
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
     * @param doc
     * @param languages
     * @private
     */
    private static getTitle(doc: OpsExchangeDocument, languages: string): string {
        let titles = doc['bibliographic-data']['invention-title'];

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
     * @param doc
     * @private
     */
    private static getCitations(doc: OpsExchangeDocument): Patent[] {
        let citations = doc['bibliographic-data']['references-cited']?.citation;

        if (!citations || citations.length === 0) {
            return [] as Patent[];
        }

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
     * @param doc
     * @param languages
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
     * @param searchTerms   The search terms which need to be added to the URL
     * @param endpoint      The target endpoint
     * @param page          The page which should be retrieved
     * @param country          The page which should be retrieved
     * @param date          The page which should be retrieved
     */
    public static getQueryString(searchTerms: string[], endpoint: string, page = 0, country = '', date = ''): string {
        let queryString = `${process.env.PATENT_API_URL}`
            .concat(endpoint)
            .concat(`?q=ti%3D ${searchTerms} or ab%3D ${searchTerms}`);

        if (country.trim().length > 0) {
            queryString = queryString.concat(` and pn any "${country}"`);
        }

        if (date.trim().length > 0) {
            queryString = queryString.concat(` and pd within "${date}"`);
        }

        return queryString.concat(`&Range=${page * 100 + 1}-${(page + 1) * 100}`);
    }

    /**
     * Restructures an image query to the desired format
     * @param data
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
